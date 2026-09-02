const pool = require("../config/database");
const sheets = require("../config/googleSheets");

const SPREADSHEET_ID =
  "1bbzbHCy5_tHx2mjI7KW6xl1f_K7dPFK5QWVWeXbAnco";

function colunaParaLetra(numero) {
  let resultado = "";

  while (numero > 0) {
    const resto = (numero - 1) % 26;
    resultado =
      String.fromCharCode(65 + resto) + resultado;
    numero = Math.floor((numero - 1) / 26);
  }

  return resultado;
}

function extrairInicioIntervalo(intervalo) {
  const match =
    intervalo.match(/^([A-Z]+)(\d+)/i);

  if (!match) {
    throw new Error(
      `Intervalo inválido: ${intervalo}`
    );
  }

  return {
    coluna: match[1].toUpperCase(),
    linha: Number(match[2]),
  };
}

function letraParaNumero(letras) {
  let numero = 0;

  for (const letra of letras) {
    numero =
      numero * 26 +
      (letra.charCodeAt(0) - 64);
  }

  return numero;
}


// =====================================================
// FUNÇÃO INTERNA DE SINCRONIZAÇÃO
// =====================================================

async function executarSincronizacao() {
  const client = await pool.connect();

  try {
    const professores = await client.query(`
      SELECT id, nome, email, aba, intervalo
      FROM professores_planilha
      WHERE ativo = TRUE
    `);

    let totalCelulas = 0;

    await client.query("BEGIN");

    for (const professor of professores.rows) {

      console.log(
        `🔄 Sincronizando ${professor.nome}...`
      );

      const response =
        await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${professor.aba}!${professor.intervalo}`,
        });

      const valores =
        response.data.values || [];

      const inicio =
        extrairInicioIntervalo(
          professor.intervalo
        );

      const colunaInicial =
        letraParaNumero(inicio.coluna);

      const linhaInicial =
        inicio.linha;


      // Remove o espelho anterior
      await client.query(
        `
        DELETE FROM planilha_horarios
        WHERE professor_id = $1
        `,
        [professor.id]
      );


      for (
        let linha = 0;
        linha < valores.length;
        linha++
      ) {

        const row = valores[linha];

        for (
          let coluna = 0;
          coluna < row.length;
          coluna++
        ) {

          const conteudo =
            row[coluna] ?? "";

          const numeroLinha =
            linhaInicial + linha;

          const numeroColuna =
            colunaInicial + coluna;

          const letraColuna =
            colunaParaLetra(
              numeroColuna
            );

          const celula =
            `${letraColuna}${numeroLinha}`;


          await client.query(
            `
            INSERT INTO planilha_horarios
            (
              professor_id,
              linha,
              coluna,
              celula,
              conteudo
            )
            VALUES
            ($1, $2, $3, $4, $5)
            `,
            [
              professor.id,
              linha + 1,
              coluna + 1,
              celula,
              conteudo,
            ]
          );

          totalCelulas++;
        }
      }

      console.log(
        `✅ ${professor.nome} sincronizado: ${valores.length} linhas`
      );
    }

    await client.query("COMMIT");

    return {
      sucesso: true,
      professores:
        professores.rows.length,
      celulas: totalCelulas,
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
}


// =====================================================
// SINCRONIZAÇÃO MANUAL — API
// =====================================================

async function sincronizarPlanilha(req, res) {

  try {

    const resultado =
      await executarSincronizacao();

    res.json({
      sucesso: true,
      mensagem:
        "Planilha sincronizada com sucesso!",
      ...resultado,
    });

  } catch (error) {

    console.error(
      "❌ Erro ao sincronizar planilha:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });

  }
}


// =====================================================
// BUSCAR HORÁRIOS BRUTOS
// =====================================================

async function buscarHorariosProfessor(req, res) {

  try {

    const { professorId } = req.params;

    const resultado =
      await pool.query(
        `
        SELECT
          id,
          professor_id,
          linha,
          coluna,
          celula,
          conteudo,
          created_at,
          updated_at
        FROM planilha_horarios
        WHERE professor_id = $1
        ORDER BY linha, coluna
        `,
        [professorId]
      );

    res.json({
      sucesso: true,
      professor_id:
        Number(professorId),
      total:
        resultado.rows.length,
      dados:
        resultado.rows,
    });

  } catch (error) {

    console.error(
      "❌ Erro ao buscar horários:",
      error
    );

    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });

  }
}


// =====================================================
// INTERPRETAR CÉLULA
// =====================================================

function interpretarCelula(conteudo) {

  if (
    !conteudo ||
    !conteudo.trim()
  ) {
    return null;
  }

  const texto =
    conteudo.trim();


  const horarioMatch =
    texto.match(
      /^(\d{1,2})(?::(\d{2}))?h?/i
    );

  if (!horarioMatch) {
    return null;
  }


  const hora =
    horarioMatch[1].padStart(
      2,
      "0"
    );

  const minuto =
    horarioMatch[2] || "00";


  const codigoMatch =
    texto.match(
      /\b\d{3,5}\b/
    );

  const codigoAluno =
    codigoMatch
      ? Number(codigoMatch[0])
      : null;


  let restante =
    texto
      .replace(
        /^(\d{1,2})(?::(\d{2}))?h?/i,
        ""
      )
      .replace(
        /📸|❌|🎸|🥁|🎹|🎤|🎻|🎵|🪕|🎼/g,
        ""
      )
      .replace(
        /\b\d{3,5}\b/,
        ""
      )
      .trim();


  const cancelado =
    texto.includes("❌");

  const foto =
    texto.includes("📸");


  let instrumento = null;


  if (texto.includes("🎸"))
    instrumento = "guitarra";

  else if (texto.includes("🥁"))
    instrumento = "bateria";

  else if (texto.includes("🎹"))
    instrumento = "teclado/piano";

  else if (texto.includes("🎤"))
    instrumento = "canto";

  else if (texto.includes("🎻"))
    instrumento = "violino";

  else if (texto.includes("🪕"))
    instrumento = "ukulele";


  return {

    horario:
      `${hora}:${minuto}`,

    codigoAluno,

    nome:
      restante || null,

    instrumento,

    cancelado,

    foto,

    conteudoOriginal:
      texto,

  };
}


// =====================================================
// BUSCAR HORÁRIOS ORGANIZADOS
// =====================================================

async function buscarHorariosOrganizados(
  req,
  res
) {

  try {

    const { professorId } =
      req.params;


    const professor =
      await pool.query(
        `
        SELECT
          pp.id,
          pp.nome,
          pp.email,
          pp.aba,
          pp.intervalo
        FROM professores_planilha pp

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE p.id = $1
          AND pp.ativo = TRUE

        LIMIT 1
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {

      return res.status(404).json({

        sucesso: false,

        erro:
          "Nenhuma planilha configurada para este professor."

      });

    }


    const professorPlanilha =
      professor.rows[0];


    const resultado =
      await pool.query(
        `
        SELECT
          celula,
          linha,
          coluna,
          conteudo
        FROM planilha_horarios
        WHERE professor_id = $1
        ORDER BY linha, coluna
        `,
        [professorPlanilha.id]
      );


    const diasSemana = {

      2: "SEGUNDA",

      3: "TERÇA",

      4: "QUARTA",

      5: "QUINTA",

      6: "SEXTA",

      7: "SÁBADO",

    };


    const dados = [];


    for (
      const item
      of resultado.rows
    ) {

      // Ignora a coluna A
      if (
        !diasSemana[item.coluna]
      ) {
        continue;
      }


      const horario =
        interpretarCelula(
          item.conteudo
        );


      if (!horario) {
        continue;
      }


      dados.push({

        celula:
          item.celula,

        diaSemana:
          diasSemana[item.coluna],

        coluna:
          item.coluna,

        ...horario,

      });

    }


    res.json({

      sucesso: true,

      professor_id:
        Number(professorId),

      professor_planilha_id:
        professorPlanilha.id,

      total:
        dados.length,

      dados,

    });

  } catch (error) {

    console.error(
      "❌ Erro ao organizar horários:",
      error
    );

    res.status(500).json({

      sucesso: false,

      erro: error.message,

    });

  }

}


// =====================================================
// BUSCAR ALUNOS DA PLANILHA
// =====================================================

async function buscarAlunosProfessor(req, res) {

  try {

    const { professorId } = req.params;


    // -------------------------------------------------
    // Localiza a configuração da planilha do professor
    // -------------------------------------------------

    const professor =
      await pool.query(
        `
        SELECT
          pp.id,
          pp.nome,
          pp.email
        FROM professores_planilha pp

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE p.id = $1
          AND pp.ativo = TRUE

        LIMIT 1
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {

      return res.status(404).json({

        sucesso: false,

        erro:
          "Nenhuma planilha configurada para este professor."

      });

    }


    const professorPlanilha =
      professor.rows[0];


    // -------------------------------------------------
    // Busca as células sincronizadas
    // -------------------------------------------------

    const resultado =
      await pool.query(
        `
        SELECT
          celula,
          linha,
          coluna,
          conteudo
        FROM planilha_horarios
        WHERE professor_id = $1
        ORDER BY linha, coluna
        `,
        [professorPlanilha.id]
      );


    // -------------------------------------------------
    // Somente colunas dos dias da semana
    // -------------------------------------------------

    const diasSemana = {

      2: "SEGUNDA",
      3: "TERÇA",
      4: "QUARTA",
      5: "QUINTA",
      6: "SEXTA",
      7: "SÁBADO",

    };


    // -------------------------------------------------
    // Agrupa os alunos pelo código
    // -------------------------------------------------

    const alunosMap = new Map();


    for (
      const item
      of resultado.rows
    ) {

      // Ignora coluna A
      if (
        !diasSemana[item.coluna]
      ) {
        continue;
      }


      const horario =
        interpretarCelula(
          item.conteudo
        );


      if (!horario) {
        continue;
      }


      // Sem código não conseguimos
      // identificar o aluno com segurança
      if (
        !horario.codigoAluno
      ) {
        continue;
      }


      const codigo =
        horario.codigoAluno;


      // -------------------------------------------------
      // Primeiro registro do aluno
      // -------------------------------------------------

      if (
        !alunosMap.has(codigo)
      ) {

        alunosMap.set(
          codigo,
          {

            id: codigo,

            codigoAluno:
              codigo,

            nome:
              horario.nome || "Aluno sem nome",

            instrumento:
              horario.instrumento,

            foto:
              horario.foto,

            nascimento:
              null,

            unidade:
              "Porto velho",

            status:
              "ativo",

            horarios: []

          }
        );

      }


      const aluno =
        alunosMap.get(codigo);


      // -------------------------------------------------
      // Completa dados caso apareçam
      // diferentes em outra célula
      // -------------------------------------------------

      if (
        !aluno.nome &&
        horario.nome
      ) {

        aluno.nome =
          horario.nome;

      }


      if (
        !aluno.instrumento &&
        horario.instrumento
      ) {

        aluno.instrumento =
          horario.instrumento;

      }


      if (
        horario.foto
      ) {

        aluno.foto = true;

      }


      // -------------------------------------------------
      // Guarda os horários do aluno
      // -------------------------------------------------

      aluno.horarios.push({

        celula:
          item.celula,

        diaSemana:
          diasSemana[item.coluna],

        horario:
          horario.horario,

        instrumento:
          horario.instrumento,

        cancelado:
          horario.cancelado,

        conteudoOriginal:
          horario.conteudoOriginal

      });

    }


    // -------------------------------------------------
    // Converte Map para array
    // -------------------------------------------------

    const alunos =
      Array.from(
        alunosMap.values()
      );


    // Ordena alfabeticamente
    alunos.sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    );


    // -------------------------------------------------
    // RESPOSTA
    // -------------------------------------------------

    res.json({

      sucesso: true,

      professor_id:
        Number(professorId),

      total:
        alunos.length,

      alunos

    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar alunos da planilha:",
      error
    );


    res.status(500).json({

      sucesso: false,

      erro:
        error.message

    });

  }

}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sincronizarPlanilha,
  executarSincronizacao,
  buscarHorariosProfessor,
  buscarHorariosOrganizados,
  buscarAlunosProfessor,
};