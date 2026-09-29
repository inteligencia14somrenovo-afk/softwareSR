const express = require("express");

const {
  testarSincronizacaoTurmas,
} = require("../controllers/planilha_turmas.controller");

const router = express.Router();

router.post("/sincronizar", testarSincronizacaoTurmas);

module.exports = router;