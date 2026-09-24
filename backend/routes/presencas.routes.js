const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// =====================================================
// GET /presencas
// Lista presenças do professor autenticado
//
// Pode receber:
// ?data=2026-08-19
// ?mes=2026-08
// =====================================================

router.get("/", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;

    const {
      data,
      mes
    } = req.query;


    let query = `
      SELECT
        p.id,
        p.professor_id,
        p.celula,
        p.data,
        p.status,
        p.created_at,
        p.updated_at

      FROM presencas_planilha p

      WHERE
        p.professor_id = $1
    `;

    const parametros = [
      professorId
    ];


    // =================================================
    // FILTRO POR DATA
    // =================================================

    if (data) {

      parametros.push(data);

      query += `
        AND p.data = $${parametros.length}
      `;
    }


    // =================================================
    // FILTRO POR MÊS
    // =================================================

    if (mes) {

      if (!/^\d{4}-\d{2}$/.test(mes)) {

        return res.status(400).json({
          sucesso: false,
          mensagem: "Formato de mês inválido. Use YYYY-MM."
        });
      }

      parametros.push(`${mes}-01`);

      query += `
        AND p.data >= $${parametros.length}::date
        AND p.data < ($${parametros.length}::date + INTERVAL '1 month')
      `;
    }


    query += `
      ORDER BY
        p.data ASC,
        p.celula ASC
    `;


    const resultado = await pool.query(
      query,
      parametros
    );


    res.json({
      sucesso: true,
      presencas: resultado.rows
    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar presenças:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar presenças."
    });
  }

});

// =====================================================
// GET /presencas/relatorio-admin
//
// Relatório de presença para ADMIN / DEV.
//
// Exemplo:
// GET /presencas/relatorio-admin?mes=2026-09
// =====================================================

router.get("/relatorio-admin", async (req, res) => {
  try {
    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    // =================================================
    // VERIFICAR USUÁRIO
    // =================================================

    const usuarioResult = await pool.query(
      `
      SELECT
        id,
        nome,
        email,
        role,
        foto_url
      FROM professores
      WHERE id = $1
      LIMIT 1
      `,
      [req.session.professorId]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }

    const usuario = usuarioResult.rows[0];

    if (
      usuario.role !== "admin" &&
      usuario.role !== "dev"
    ) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Acesso permitido somente para administração."
      });
    }

    // =================================================
    // VALIDAR MÊS
    // =================================================

    const { mes } = req.query;

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe o mês no formato YYYY-MM."
      });
    }

    const [ano, mesNumero] = mes
      .split("-")
      .map(Number);

    // =================================================
    // PROFESSORES
    // =================================================

    const professoresResult = await pool.query(
      `
      SELECT
        p.id,
        p.nome,
        p.email,
        p.foto_url,
        pp.id AS professores_planilha_id
      FROM professores p

      LEFT JOIN professores_planilha pp
        ON LOWER(TRIM(p.email))
         =
           LOWER(TRIM(pp.email))
        AND pp.ativo = TRUE

      WHERE
        p.role = 'professor'

      ORDER BY
        p.nome ASC
      `
    );

    // =================================================
    // ALUNOS
    // =================================================

    const alunosResult = await pool.query(
      `
      SELECT
        id,
        professor_id,
        nome,
        instrumento,
        status
      FROM alunos
      `
    );

    const alunosPorProfessor = new Map();

    alunosResult.rows.forEach((aluno) => {
      const professorId = Number(aluno.professor_id);

      if (!alunosPorProfessor.has(professorId)) {
        alunosPorProfessor.set(professorId, []);
      }

      alunosPorProfessor
        .get(professorId)
        .push(aluno);
    });

    // =================================================
    // HORÁRIOS DA PLANILHA
    //
    // Aqui professor_id é o ID de
    // professores_planilha.
    // =================================================

    const horariosResult = await pool.query(
      `
      SELECT
        ph.id,
        ph.professor_id AS professores_planilha_id,
        ph.celula,
        ph.horario,
        ph.conteudo
      FROM planilha_horarios ph
      WHERE
        ph.celula ~ '^[B-G][0-9]+$'
        AND ph.conteudo IS NOT NULL
        AND TRIM(ph.conteudo) <> ''
      ORDER BY
        ph.professor_id,
        ph.celula
      `
    );

    // =================================================
    // PRESENÇAS DO MÊS
    // =================================================

    const presencasResult = await pool.query(
      `
      SELECT
        id,
        professor_id,
        celula,
        data,
        status,
        created_at,
        updated_at
      FROM presencas_planilha

      WHERE
        data >= $1::date
        AND data < ($1::date + INTERVAL '1 month')

      ORDER BY
        data ASC,
        celula ASC
      `,
      [`${mes}-01`]
    );

    // =================================================
    // MAPA DAS PRESENÇAS
    // =================================================

    const mapaPresencas = new Map();

    presencasResult.rows.forEach((presenca) => {
      const data =
        presenca.data instanceof Date
          ? presenca.data.toISOString().slice(0, 10)
          : String(presenca.data).slice(0, 10);

      const chave =
        `${presenca.professor_id}|${presenca.celula}|${data}`;

      mapaPresencas.set(chave, presenca);
    });

    // =================================================
    // MAPA DOS HORÁRIOS DA COLUNA A
    //
    // A70 = horário da linha 70
    // E70 = aluno da quinta-feira
    // =================================================

    const horariosPorLinha = new Map();

    const linhasHorarioResult = await pool.query(
      `
      SELECT
        professor_id,
        celula,
        conteudo
      FROM planilha_horarios
      WHERE
        celula ~ '^A[0-9]+$'
      `
    );

    linhasHorarioResult.rows.forEach((item) => {
      const linha =
        String(item.celula).match(/^A([0-9]+)$/i)?.[1];

      if (!linha) {
        return;
      }

      const chave =
        `${item.professor_id}|${linha}`;

      horariosPorLinha.set(
        chave,
        String(item.conteudo || "")
          .trim()
      );
    });

    // =================================================
    // DATAS DO MÊS
    // =================================================

    function gerarDatasDoMes(ano, mesNumero) {
      const datas = [];

      const data = new Date(
        Date.UTC(
          ano,
          mesNumero - 1,
          1
        )
      );

      while (
        data.getUTCMonth() === mesNumero - 1
      ) {
        datas.push(
          data.toISOString().slice(0, 10)
        );

        data.setUTCDate(
          data.getUTCDate() + 1
        );
      }

      return datas;
    }

    const datasDoMes =
      gerarDatasDoMes(
        ano,
        mesNumero
      );

    // =================================================
    // COLUNA DA PLANILHA → DIA DA SEMANA
    //
    // B = segunda
    // C = terça
    // D = quarta
    // E = quinta
    // F = sexta
    // G = sábado
    // =================================================

    const diaPorColuna = {
      B: 1,
      C: 2,
      D: 3,
      E: 4,
      F: 5,
      G: 6
    };

    // =================================================
    // IDENTIFICAR SE É ALUNO / AULA VÁLIDA
    //
    // Evita transformar células como:
    // "18h"
    // em uma aula.
    //
    // Código de aluno = 4 dígitos
    // Experimental = AE
    // =================================================

    function ehAulaValida(conteudo) {
      const texto = String(conteudo || "");

      return (
        /\b\d{4}\b/.test(texto) ||
        /\bAE\b/i.test(texto)
      );
    }

    // =================================================
    // DATA DE AULA EXPERIMENTAL
    //
    // Exemplo:
    // "AE Ana Júlia 15a Guitarra 30/09"
    // =================================================

    function obterDataExperimental(
      conteudo,
      mesSelecionado
    ) {
      const texto = String(conteudo || "");

      if (!/\bAE\b/i.test(texto)) {
        return null;
      }

      const encontrado =
        texto.match(/(\d{1,2})\/(\d{1,2})/);

      if (!encontrado) {
        return null;
      }

      const dia = Number(encontrado[1]);
      const mes = Number(encontrado[2]);

      if (mes !== mesSelecionado) {
        return null;
      }

      return `${ano}-${String(mes).padStart(2, "0")}-${String(
        dia
      ).padStart(2, "0")}`;
    }

    // =================================================
    // GERAR RELATÓRIO DE CADA PROFESSOR
    // =================================================

    const relatorios = [];

    for (const professor of professoresResult.rows) {
      const professorId =
        Number(professor.id);

      const planilhaId =
        professor.professores_planilha_id
          ? Number(professor.professores_planilha_id)
          : null;

      const alunosProfessor =
        alunosPorProfessor.get(professorId) || [];

      let presentes = 0;
      let faltas = 0;
      let pendentes = 0;

      const detalhes = [];

      // -----------------------------------------------
      // Professor sem planilha
      // -----------------------------------------------

      if (planilhaId) {
        const horariosProfessor =
          horariosResult.rows.filter(
            (horario) =>
              Number(
                horario.professores_planilha_id
              ) === planilhaId
          );

        for (const horario of horariosProfessor) {
          const celula =
            String(horario.celula || "")
              .toUpperCase();

          const match =
            celula.match(/^([B-G])([0-9]+)$/);

          if (!match) {
            continue;
          }

          const coluna = match[1];
          const linha = match[2];

          if (!ehAulaValida(horario.conteudo)) {
            continue;
          }

          const diaSemana =
            diaPorColuna[coluna];

          const horarioLinha =
            horariosPorLinha.get(
              `${planilhaId}|${linha}`
            ) || horario.horario || "";

          const dataExperimental =
            obterDataExperimental(
              horario.conteudo,
              mesNumero
            );

          // ---------------------------------------------
          // Verificar cada dia do mês
          // ---------------------------------------------

          for (const data of datasDoMes) {
            const dataObj =
              new Date(`${data}T00:00:00Z`);

            const diaReal =
              dataObj.getUTCDay();

            // Experimental:
            // somente na data informada.
            if (dataExperimental) {
              if (data !== dataExperimental) {
                continue;
              }
            } else {
              // Aula normal:
              // somente no dia da semana.
              if (diaReal !== diaSemana) {
                continue;
              }
            }

            const chave =
              `${professorId}|${celula}|${data}`;

            const registro =
              mapaPresencas.get(chave);

            let status = "pendente";

            if (registro) {
              if (registro.status === "presente") {
                status = "presente";
                presentes++;
              } else if (registro.status === "falta") {
                status = "falta";
                faltas++;
              }
            } else {
              pendentes++;
            }

            detalhes.push({
              data,
              celula,
              horario: horarioLinha,
              conteudo: horario.conteudo,
              status
            });
          }
        }
      }

      detalhes.sort((a, b) => {
        if (a.data !== b.data) {
          return a.data.localeCompare(b.data);
        }

        return String(a.horario)
          .localeCompare(
            String(b.horario)
          );
      });

      relatorios.push({
        professor: {
          id: professor.id,
          nome: professor.nome,
          email: professor.email,
          foto_url: professor.foto_url
        },

        totalAlunos:
          alunosProfessor.length,

        alunosAtivos:
          alunosProfessor.filter(
            (aluno) =>
              !aluno.status ||
              String(aluno.status)
                .toLowerCase() === "ativo"
          ).length,

        presentes,
        faltas,
        pendentes,

        totalAulas:
          presentes +
          faltas +
          pendentes,

        detalhes
      });
    }

    // =================================================
    // RESUMO GERAL
    // =================================================

    const resumo =
      relatorios.reduce(
        (resultado, professor) => {
          resultado.presentes +=
            professor.presentes;

          resultado.faltas +=
            professor.faltas;

          resultado.pendentes +=
            professor.pendentes;

          resultado.totalAulas +=
            professor.totalAulas;

          return resultado;
        },
        {
          presentes: 0,
          faltas: 0,
          pendentes: 0,
          totalAulas: 0
        }
      );

    res.json({
      sucesso: true,
      mes,
      resumo,
      professores: relatorios
    });

  } catch (error) {
    console.error(
      "❌ Erro no relatório administrativo:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao gerar relatório administrativo."
    });
  }
});

// =====================================================
// GET /presencas/:id
// Busca uma presença específica
// =====================================================

router.get("/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const presencaId = req.params.id;


    const resultado = await pool.query(
      `
      SELECT
        p.id,
        p.professor_id,
        p.celula,
        p.data,
        p.status,
        p.created_at,
        p.updated_at

      FROM presencas_planilha p

      WHERE
        p.id = $1
        AND p.professor_id = $2
      `,
      [
        presencaId,
        professorId
      ]
    );


    if (resultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Registro de presença não encontrado."
      });
    }


    res.json({
      sucesso: true,
      presenca: resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar presença:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar presença."
    });
  }

});


// =====================================================
// POST /presencas
//
// Registra ou atualiza presença.
//
// Body:
//
// {
//   "celula": "B70",
//   "data": "2026-09-01",
//   "status": "presente"
// }
//
// =====================================================

router.post("/", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;

    const {
      celula,
      data,
      status
    } = req.body;


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if (
      !celula ||
      !data ||
      !status
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Informe a célula, a data e o status."
      });
    }


    if (
      status !== "presente" &&
      status !== "falta"
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Status inválido. Use presente ou falta."
      });
    }


    // =================================================
    // VALIDAR CÉLULA
    // =================================================

    if (
      !/^[A-Z]+[0-9]+$/i.test(celula)
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem: "Célula da planilha inválida."
      });
    }


    // =================================================
    // VERIFICAR SE A CÉLULA PERTENCE AO PROFESSOR
    // =================================================

    const aulaPlanilha =
      await pool.query(
        `
        SELECT
          ph.id,
          ph.celula,
          ph.conteudo

        FROM planilha_horarios ph

        INNER JOIN professores_planilha pp
          ON pp.id = ph.professor_id

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE
          ph.celula = $1
          AND p.id = $2
          AND pp.ativo = TRUE

        LIMIT 1
        `,
        [
          celula.toUpperCase(),
          professorId
        ]
      );


    if (aulaPlanilha.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Horário da planilha não encontrado ou não pertence ao professor."
      });
    }


    // =================================================
    // INSERIR OU ATUALIZAR
    // =================================================

    const resultado =
      await pool.query(
        `
        INSERT INTO presencas_planilha (
          professor_id,
          celula,
          data,
          status
        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )

        ON CONFLICT (
          professor_id,
          celula,
          data
        )

        DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = NOW()

        RETURNING
          id,
          professor_id,
          celula,
          data,
          status,
          created_at,
          updated_at
        `,
        [
          professorId,
          celula.toUpperCase(),
          data,
          status
        ]
      );


    res.status(201).json({
      sucesso: true,
      mensagem:
        "Presença registrada com sucesso.",
      presenca:
        resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao registrar presença:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao registrar presença."
    });
  }

});


// =====================================================
// PUT /presencas/:id
// Atualiza uma presença
// =====================================================

router.put("/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const presencaId = req.params.id;

    const {
      status
    } = req.body;


    if (
      status !== "presente" &&
      status !== "falta"
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Status inválido. Use presente ou falta."
      });
    }


    const resultado =
      await pool.query(
        `
        UPDATE presencas_planilha

        SET
          status = $1,
          updated_at = NOW()

        WHERE
          id = $2
          AND professor_id = $3

        RETURNING
          id,
          professor_id,
          celula,
          data,
          status,
          created_at,
          updated_at
        `,
        [
          status,
          presencaId,
          professorId
        ]
      );


    if (resultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Registro de presença não encontrado."
      });
    }


    res.json({
      sucesso: true,
      mensagem:
        "Presença atualizada com sucesso.",
      presenca:
        resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao atualizar presença:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao atualizar presença."
    });
  }

});


// =====================================================
// DELETE /presencas/:id
// Remove um registro de presença
// =====================================================

router.delete("/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const presencaId = req.params.id;


    const resultado =
      await pool.query(
        `
        DELETE FROM presencas_planilha

        WHERE
          id = $1
          AND professor_id = $2

        RETURNING
          id,
          professor_id,
          celula,
          data,
          status
        `,
        [
          presencaId,
          professorId
        ]
      );


    if (resultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Registro de presença não encontrado."
      });
    }


    res.json({
      sucesso: true,
      mensagem:
        "Registro de presença removido.",
      presenca:
        resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao excluir presença:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao excluir presença."
    });
  }

});


module.exports = router;