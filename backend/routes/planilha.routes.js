const express = require("express");

const {
  listarProfessoresComPlanilha,
  sincronizarPlanilha,
  buscarHorariosProfessor,
  buscarHorariosOrganizados,
  buscarAlunosProfessor,
} = require("../controllers/planilha.controller");

const pool = require("../config/database");

const router = express.Router();

async function exigirAdminOuDev(req, res, next) {
  try {
    if (!req.session?.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado.",
      });
    }

    const resultado = await pool.query(
      `
      SELECT role
      FROM professores
      WHERE id = $1
      `,
      [req.session.professorId]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
    }

    const role = String(resultado.rows[0].role || "")
  .trim()
  .toLowerCase();

    if (role !== "admin" && role !== "dev") {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "Somente administradores e desenvolvedores podem sincronizar a planilha.",
      });
    }

    next();
  } catch (error) {
    console.error(
      "Erro ao verificar permissão de sincronização:",
      error
    );

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao verificar permissão.",
    });
  }
}

router.post(
  "/sincronizar",
  exigirAdminOuDev,
  sincronizarPlanilha
);

router.get(
  "/professores",
  listarProfessoresComPlanilha
);

router.get(
  "/horarios/:professorId",
  buscarHorariosProfessor
);

router.get(
  "/horarios/:professorId/organizados",
  buscarHorariosOrganizados
);

router.get(
  "/alunos/:professorId",
  buscarAlunosProfessor
);

module.exports = router;