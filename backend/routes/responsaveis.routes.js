const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// =====================================================
// POST /alunos/:alunoId/responsaveis
// Cria um responsável para um aluno
// =====================================================

router.post("/alunos/:alunoId/responsaveis", async (req, res) => {

  try {

    // Verifica autenticação
    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }


    const professorId = req.session.professorId;
    const alunoId = Number(req.params.alunoId);


    if (!alunoId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do aluno inválido."
      });
    }


    const {
      nome,
      telefone,
      foto
    } = req.body;


    // Validação
    if (
      !nome ||
      !nome.trim() ||
      !telefone ||
      !telefone.trim()
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha o nome e o telefone do responsável."
      });
    }


    // =====================================================
    // Verifica se o aluno pertence ao professor autenticado
    // =====================================================

    const aluno = await pool.query(
      `
      SELECT id
      FROM alunos
      WHERE id = $1
      AND professor_id = $2
      `,
      [
        alunoId,
        professorId
      ]
    );


    if (aluno.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });
    }


    // =====================================================
    // Cria o responsável
    // =====================================================

    const resultado = await pool.query(
      `
      INSERT INTO responsaveis (
        aluno_id,
        nome,
        telefone,
        foto
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        aluno_id,
        nome,
        telefone,
        foto,
        created_at,
        updated_at
      `,
      [
        alunoId,
        nome.trim(),
        telefone.trim(),
        foto || null
      ]
    );


    res.status(201).json({
      sucesso: true,
      mensagem: "Responsável criado com sucesso.",
      responsavel: resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao criar responsável:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar responsável."
    });

  }

});

// =====================================================
// GET /alunos/:alunoId/responsaveis
// Lista os responsáveis de um aluno
// =====================================================

router.get("/alunos/:alunoId/responsaveis", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const alunoId = Number(req.params.alunoId);

    if (!alunoId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do aluno inválido."
      });
    }

    // Verifica se o aluno pertence ao professor
    const aluno = await pool.query(
      `
      SELECT id
      FROM alunos
      WHERE id = $1
      AND professor_id = $2
      `,
      [alunoId, professorId]
    );

    if (aluno.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        id,
        aluno_id,
        nome,
        telefone,
        foto,
        created_at,
        updated_at
      FROM responsaveis
      WHERE aluno_id = $1
      ORDER BY nome ASC
      `,
      [alunoId]
    );

    res.json({
      sucesso: true,
      responsaveis: resultado.rows
    });

  } catch (error) {

    console.error(
      "❌ Erro ao buscar responsáveis:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar responsáveis."
    });

  }

});


// =====================================================
// PUT /responsaveis/:id
// Edita um responsável
// =====================================================

router.put("/responsaveis/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const responsavelId = Number(req.params.id);

    const {
      nome,
      telefone,
      foto
    } = req.body;

    if (!responsavelId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do responsável inválido."
      });
    }

    if (
      !nome ||
      !nome.trim() ||
      !telefone ||
      !telefone.trim()
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha o nome e o telefone do responsável."
      });
    }

    // Verifica se o responsável pertence
    // a um aluno do professor autenticado
    const responsavel = await pool.query(
      `
      SELECT r.id
      FROM responsaveis r
      INNER JOIN alunos a
        ON a.id = r.aluno_id
      WHERE r.id = $1
      AND a.professor_id = $2
      `,
      [responsavelId, professorId]
    );

    if (responsavel.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Responsável não encontrado."
      });
    }

    const resultado = await pool.query(
      `
      UPDATE responsaveis
      SET
        nome = $1,
        telefone = $2,
        foto = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING
        id,
        aluno_id,
        nome,
        telefone,
        foto,
        created_at,
        updated_at
      `,
      [
        nome.trim(),
        telefone.trim(),
        foto || null,
        responsavelId
      ]
    );

    res.json({
      sucesso: true,
      mensagem: "Responsável atualizado com sucesso.",
      responsavel: resultado.rows[0]
    });

  } catch (error) {

    console.error(
      "❌ Erro ao editar responsável:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao editar responsável."
    });

  }

});


// =====================================================
// DELETE /responsaveis/:id
// Exclui um responsável
// =====================================================

router.delete("/responsaveis/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const responsavelId = Number(req.params.id);

    if (!responsavelId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do responsável inválido."
      });
    }

    // Verifica se o responsável pertence
    // a um aluno do professor autenticado
    const responsavel = await pool.query(
      `
      SELECT r.id
      FROM responsaveis r
      INNER JOIN alunos a
        ON a.id = r.aluno_id
      WHERE r.id = $1
      AND a.professor_id = $2
      `,
      [responsavelId, professorId]
    );

    if (responsavel.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Responsável não encontrado."
      });
    }

    await pool.query(
      `
      DELETE FROM responsaveis
      WHERE id = $1
      `,
      [responsavelId]
    );

    res.json({
      sucesso: true,
      mensagem: "Responsável excluído com sucesso."
    });

  } catch (error) {

    console.error(
      "❌ Erro ao excluir responsável:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir responsável."
    });

  }

});

module.exports = router;