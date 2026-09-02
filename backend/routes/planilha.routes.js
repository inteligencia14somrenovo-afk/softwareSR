const express = require("express");

const {
  sincronizarPlanilha,
  buscarHorariosProfessor,
  buscarHorariosOrganizados,
  buscarAlunosProfessor,
} = require("../controllers/planilha.controller");

const router = express.Router();

router.post(
  "/sincronizar",
  sincronizarPlanilha
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