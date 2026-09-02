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