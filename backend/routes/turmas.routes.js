const express = require("express");

const {
  buscarTurmasInterpretadas,
} = require("../controllers/turmas.controller");

const router = express.Router();

router.get(
  "/",
  buscarTurmasInterpretadas
);

module.exports = router;