const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// =====================================================
// FUNÇÃO AUXILIAR
// Verifica se o professor está autenticado
// =====================================================

const verificarAutenticacao = (req, res) => {

  if (!req.session.professorId) {

    res.status(401).json({
      sucesso: false,
      mensagem: "Usuário não autenticado."
    });

    return false;
  }

  return true;
};


// =====================================================
// GET /aulas
// Lista todos os horários de prática
// do professor autenticado
// =====================================================

router.get("/", async (req, res) => {

  try {

    if (!verificarAutenticacao(req, res)) {
      return;
    }

    const professorId = req.session.professorId;

    const resultado = await pool.query(
      `
      SELECT
        a.id,
        a.professor_id,
        a.aluno_id,
        a.dia_semana,
        TO_CHAR(a.horario, 'HH24:MI') AS horario,
        a.created_at,
        a.updated_at,

        al.nome AS aluno_nome,
        al.instrumento AS aluno_instrumento

      FROM aulas a

      INNER JOIN alunos al
        ON al.id = a.aluno_id

      WHERE
        a.professor_id = $1
        AND al.professor_id = $1

      ORDER BY
        a.dia_semana ASC,
        a.horario ASC
      `,
      [professorId]
    );

    res.json({
      sucesso: true,
      aulas: resultado.rows
    });

  } catch (error) {

    console.error(
      "❌ Erro ao buscar aulas:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar aulas."
    });

  }

});


// =====================================================
// GET /aulas/:id
// Busca um horário específico
// =====================================================

router.get("/:id", async (req, res) => {

  try {

    if (!verificarAutenticacao(req, res)) {
      return;
    }

    const professorId = req.session.professorId;
    const aulaId = req.params.id;

    const resultado = await pool.query(
      `
      SELECT
        a.id,
        a.professor_id,
        a.aluno_id,
        a.dia_semana,
        TO_CHAR(a.horario, 'HH24:MI') AS horario,
        a.created_at,
        a.updated_at,

        al.nome AS aluno_nome,
        al.instrumento AS aluno_instrumento

      FROM aulas a

      INNER JOIN alunos al
        ON al.id = a.aluno_id

      WHERE
        a.id = $1
        AND a.professor_id = $2
        AND al.professor_id = $2
      `,
      [
        aulaId,
        professorId
      ]
    );

    if (resultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Horário não encontrado."
      });

    }

    res.json({
      sucesso: true,
      aula: resultado.rows[0]
    });

  } catch (error) {

    console.error(
      "❌ Erro ao buscar aula:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar aula."
    });

  }

});


// =====================================================
// POST /aulas
// Cria um horário de prática para um aluno
// =====================================================

router.post("/", async (req, res) => {
  
  try {

    if (!verificarAutenticacao(req, res)) {
      return;
    }

    const professorId = req.session.professorId;

    const {
      alunoId,
      diaSemana,
      horario
    } = req.body;


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if (
      !alunoId ||
      diaSemana === undefined ||
      diaSemana === null ||
      !horario
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Informe o aluno, o dia da semana e o horário."
      });

    }


    const dia = Number(diaSemana);


    if (
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 6
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "O dia da semana deve estar entre 1 e 6."
      });

    }


    // =================================================
    // VERIFICAR ALUNO
    // O aluno precisa pertencer ao professor
    // =================================================

    const alunoResultado = await pool.query(
      `
      SELECT
        id,
        nome,
        instrumento
      FROM alunos
      WHERE
        id = $1
        AND professor_id = $2
      `,
      [
        alunoId,
        professorId
      ]
    );


    if (alunoResultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });

    }


    // =================================================
    // VERIFICAR HORÁRIO EXISTENTE
    // Cada aluno possui um único horário de prática
    // =================================================

    const horarioExistente = await pool.query(
      `
      SELECT id
      FROM aulas
      WHERE
        professor_id = $1
        AND aluno_id = $2
      `,
      [
        professorId,
        alunoId
      ]
    );


    if (horarioExistente.rows.length > 0) {

      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Este aluno já possui um horário de prática configurado."
      });

    }


    // =================================================
    // CRIAR HORÁRIO
    // =================================================

    const resultado = await pool.query(
      `
      INSERT INTO aulas (
        professor_id,
        aluno_id,
        dia_semana,
        horario
      )

      VALUES (
        $1,
        $2,
        $3,
        $4
      )

      RETURNING
        id,
        professor_id,
        aluno_id,
        dia_semana,
        TO_CHAR(horario, 'HH24:MI') AS horario,
        created_at,
        updated_at
      `,
      [
        professorId,
        alunoId,
        dia,
        horario
      ]
    );


    res.status(201).json({

      sucesso: true,

      mensagem:
        "Horário configurado com sucesso.",

      aula: {
        ...resultado.rows[0],

        aluno_nome:
          alunoResultado.rows[0].nome,

        aluno_instrumento:
          alunoResultado.rows[0].instrumento
      }

    });

  } catch (error) {

    console.error(
      "❌ Erro ao criar aula:",
      error
    );


    // PostgreSQL UNIQUE
    if (error.code === "23505") {

      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Este aluno já possui um horário de prática configurado."
      });

    }


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao configurar horário."
    });

  }

});


// =====================================================
// PUT /aulas/:id
// Atualiza um horário de prática
// =====================================================

router.put("/:id", async (req, res) => {

  try {

    if (!verificarAutenticacao(req, res)) {
      return;
    }

    const professorId = req.session.professorId;
    const aulaId = req.params.id;

    const {
      alunoId,
      diaSemana,
      horario
    } = req.body;


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if (
      !alunoId ||
      diaSemana === undefined ||
      diaSemana === null ||
      !horario
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Informe o aluno, o dia da semana e o horário."
      });

    }


    const dia = Number(diaSemana);


    if (
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 6
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "O dia da semana deve estar entre 1 e 6."
      });

    }


    // =================================================
    // VERIFICAR ALUNO
    // =================================================

    const alunoResultado = await pool.query(
      `
      SELECT
        id,
        nome,
        instrumento
      FROM alunos
      WHERE
        id = $1
        AND professor_id = $2
      `,
      [
        alunoId,
        professorId
      ]
    );


    if (alunoResultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });

    }


    // =================================================
    // VERIFICAR SE O HORÁRIO EXISTE
    // E PERTENCE AO PROFESSOR
    // =================================================

    const aulaExistente = await pool.query(
      `
      SELECT id
      FROM aulas
      WHERE
        id = $1
        AND professor_id = $2
      `,
      [
        aulaId,
        professorId
      ]
    );


    if (aulaExistente.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Horário não encontrado."
      });

    }


    // =================================================
    // VERIFICAR OUTRO HORÁRIO DO MESMO ALUNO
    // =================================================

    const outroHorario = await pool.query(
      `
      SELECT id
      FROM aulas
      WHERE
        professor_id = $1
        AND aluno_id = $2
        AND id <> $3
      `,
      [
        professorId,
        alunoId,
        aulaId
      ]
    );


    if (outroHorario.rows.length > 0) {

      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Este aluno já possui outro horário de prática configurado."
      });

    }


    // =================================================
    // ATUALIZAR
    // =================================================

    const resultado = await pool.query(
      `
      UPDATE aulas

      SET
        aluno_id = $1,
        dia_semana = $2,
        horario = $3,
        updated_at = NOW()

      WHERE
        id = $4
        AND professor_id = $5

      RETURNING
        id,
        professor_id,
        aluno_id,
        dia_semana,
        TO_CHAR(horario, 'HH24:MI') AS horario,
        created_at,
        updated_at
      `,
      [
        alunoId,
        dia,
        horario,
        aulaId,
        professorId
      ]
    );


    if (resultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Horário não encontrado."
      });

    }


    res.json({

      sucesso: true,

      mensagem:
        "Horário atualizado com sucesso.",

      aula: {
        ...resultado.rows[0],

        aluno_nome:
          alunoResultado.rows[0].nome,

        aluno_instrumento:
          alunoResultado.rows[0].instrumento
      }

    });

  } catch (error) {

    console.error(
      "❌ Erro ao atualizar aula:",
      error
    );


    if (error.code === "23505") {

      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Este aluno já possui outro horário de prática configurado."
      });

    }


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar horário."
    });

  }

});


// =====================================================
// DELETE /aulas/:id
// Exclui um horário de prática
//
// As presenças relacionadas serão excluídas
// pelo ON DELETE CASCADE da tabela presencas.
// =====================================================

router.delete("/:id", async (req, res) => {

  try {

    if (!verificarAutenticacao(req, res)) {
      return;
    }

    const professorId = req.session.professorId;
    const aulaId = req.params.id;


    const resultado = await pool.query(
      `
      DELETE FROM aulas

      WHERE
        id = $1
        AND professor_id = $2

      RETURNING
        id,
        aluno_id
      `,
      [
        aulaId,
        professorId
      ]
    );


    if (resultado.rows.length === 0) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Horário não encontrado."
      });

    }


    res.json({

      sucesso: true,

      mensagem:
        "Horário excluído com sucesso.",

      aula: resultado.rows[0]

    });

  } catch (error) {

    console.error(
      "❌ Erro ao excluir aula:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir horário."
    });

  }

});


module.exports = router;