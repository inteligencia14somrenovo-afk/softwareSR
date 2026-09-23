const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// =====================================================
// GET /alunos
// Lista somente os alunos do professor autenticado
// =====================================================

// =====================================================
// GET /alunos
//
// Professor → somente seus alunos
// Admin/Dev → todos os alunos da escola
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


    // =====================================================
    // BUSCA O USUÁRIO AUTENTICADO
    // =====================================================

    const professorResult = await pool.query(
      `
      SELECT
        id,
        nome,
        role
      FROM professores
      WHERE id = $1
      `,
      [professorId]
    );


    if (professorResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }


    const usuario = professorResult.rows[0];


    // =====================================================
    // ADMIN / DEV
    // Busca todos os alunos da escola
    // =====================================================

    if (
      usuario.role === "admin" ||
      usuario.role === "dev"
    ) {

      const resultado = await pool.query(
        `
        SELECT
          a.id,
          a.professor_id,
          a.codigo_aluno,
          a.nome,
          a.nascimento,
          a.foto,
          a.instrumento,
          a.unidade,
          a.status,
          a.created_at,
          a.updated_at,

          p.nome AS professor_nome

        FROM alunos a

        LEFT JOIN professores p
          ON p.id = a.professor_id

        ORDER BY a.nome ASC
        `
      );


      return res.json({
        sucesso: true,
        alunos: resultado.rows
      });

    }


    // =====================================================
    // PROFESSOR
    // Busca somente os próprios alunos
    // =====================================================

    const resultado = await pool.query(
      `
      SELECT
        id,
        professor_id,
        codigo_aluno,
        nome,
        nascimento,
        foto,
        instrumento,
        unidade,
        status,
        created_at,
        updated_at
      FROM alunos
      WHERE professor_id = $1
      ORDER BY nome ASC
      `,
      [professorId]
    );


    res.json({
      sucesso: true,
      alunos: resultado.rows
    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar alunos:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar alunos."
    });

  }

});


// =====================================================
// POST /alunos
// Cria um aluno para o professor autenticado
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
      nome,
      nascimento,
      foto,
      instrumento,
      unidade
    } = req.body;


    if (
      !nome ||
      !nome.trim() ||
      !nascimento ||
      !instrumento ||
      !unidade
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha todos os campos obrigatórios."
      });
    }


    const resultado = await pool.query(
      `
      INSERT INTO alunos (
        professor_id,
        nome,
        nascimento,
        foto,
        instrumento,
        unidade
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        nome,
        nascimento,
        foto,
        instrumento,
        unidade,
        status,
        created_at,
        updated_at
      `,
      [
        professorId,
        nome.trim(),
        nascimento,
        foto || null,
        instrumento,
        unidade
      ]
    );


    res.status(201).json({
      sucesso: true,
      mensagem: "Aluno criado com sucesso.",
      aluno: resultado.rows[0]
    });


  } catch (error) {

    console.error("❌ Erro ao criar aluno:", error);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar aluno."
    });

  }

});


// =====================================================
// PUT /alunos/:id
// Edita somente um aluno do professor autenticado
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

    const alunoId = req.params.id;


    const {
      nome,
      nascimento,
      foto,
      instrumento,
      unidade
    } = req.body;


    // Validação

    if (
      !nome ||
      !nome.trim() ||
      !nascimento ||
      !instrumento ||
      !unidade
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha todos os campos obrigatórios."
      });
    }


    const resultado = await pool.query(
      `
      UPDATE alunos
      SET
        nome = $1,
        nascimento = $2,
        foto = $3,
        instrumento = $4,
        unidade = $5,
        updated_at = NOW()
      WHERE
        id = $6
        AND professor_id = $7
      RETURNING
        id,
        nome,
        nascimento,
        foto,
        instrumento,
        unidade,
        status,
        created_at,
        updated_at
      `,
      [
        nome.trim(),
        nascimento,
        foto || null,
        instrumento,
        unidade,
        alunoId,
        professorId
      ]
    );


    // Nenhum aluno encontrado

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });
    }


    res.json({
      sucesso: true,
      mensagem: "Aluno atualizado com sucesso.",
      aluno: resultado.rows[0]
    });


  } catch (error) {

    console.error("❌ Erro ao atualizar aluno:", error);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar aluno."
    });

  }

});


// =====================================================
// DELETE /alunos/:id
// Exclui somente um aluno do professor autenticado
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

    const alunoId = req.params.id;


    const resultado = await pool.query(
      `
      DELETE FROM alunos
      WHERE
        id = $1
        AND professor_id = $2
      RETURNING id, nome
      `,
      [
        alunoId,
        professorId
      ]
    );


    if (resultado.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });
    }


    res.json({
      sucesso: true,
      mensagem: "Aluno excluído com sucesso.",
      aluno: resultado.rows[0]
    });


  } catch (error) {

    console.error("❌ Erro ao excluir aluno:", error);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir aluno."
    });

  }

});


module.exports = router;