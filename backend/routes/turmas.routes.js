const express = require("express");

const {
  buscarTurmasInterpretadas,
  buscarTurmasComProfessores,
} = require("../controllers/turmas.controller");

const router = express.Router();

// Turmas somente com interpretação da planilha
router.get(
  "/",
  buscarTurmasInterpretadas
);

// Turmas cruzadas com professores
router.get(
  "/com-professores",
  buscarTurmasComProfessores
);

module.exports = router;