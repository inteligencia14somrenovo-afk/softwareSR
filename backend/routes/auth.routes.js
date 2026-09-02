const express = require("express");
const pool = require("../config/database");

const {
  iniciarGoogle,
  callbackGoogle,
} = require("../controllers/auth.controller");

const router = express.Router();

router.get("/google", iniciarGoogle);

router.get("/google/callback", callbackGoogle);

router.get("/me", async (req, res) => {
  try {
    if (!req.session.professorId) {
      return res.status(401).json({
        autenticado: false,
        mensagem: "Usuário não autenticado.",
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        id,
        email,
        nome,
        foto_url,
        instrumentos,
        perfil_configurado,
        created_at,
        updated_at
      FROM professores
      WHERE id = $1
      `,
      [req.session.professorId]
    );

    if (resultado.rows.length === 0) {
      req.session.destroy(() => {});

      return res.status(401).json({
        autenticado: false,
        mensagem: "Professor não encontrado.",
      });
    }

    return res.json({
      autenticado: true,
      professor: resultado.rows[0],
    });

  } catch (error) {
    console.error("❌ Erro ao verificar sessão:", error);

    return res.status(500).json({
      autenticado: false,
      mensagem: "Erro ao verificar autenticação.",
    });
  }
});



module.exports = router;