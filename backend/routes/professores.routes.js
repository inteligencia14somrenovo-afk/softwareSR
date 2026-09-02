const express = require("express");
const pool = require("../config/database");

const router = express.Router();

router.put("/perfil", async (req, res) => {
  try {
    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado.",
      });
    }

    const { nome, foto_url, instrumentos } = req.body;

    if (!nome || nome.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome é obrigatório.",
      });
    }

    if (!Array.isArray(instrumentos)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Instrumentos inválidos.",
      });
    }

    const resultado = await pool.query(
      `
      UPDATE professores
      SET
        nome = $1,
        foto_url = $2,
        instrumentos = $3,
        perfil_configurado = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING
        id,
        email,
        nome,
        foto_url,
        instrumentos,
        perfil_configurado,
        created_at,
        updated_at
      `,
      [
        nome.trim(),
        foto_url || null,
        JSON.stringify(instrumentos),
        req.session.professorId,
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Professor não encontrado.",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Perfil configurado com sucesso.",
      professor: resultado.rows[0],
    });

  } catch (error) {
    console.error("❌ Erro ao atualizar perfil:", error);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao salvar perfil.",
    });
  }
});

module.exports = router;