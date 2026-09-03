const express = require("express");

const {
  buscarNotificacoes
} = require("../controllers/notificacoes.controller");

const router = express.Router();


// =====================================================
// GET /notificacoes
// Busca notificações do professor autenticado
// =====================================================

router.get(
  "/",
  buscarNotificacoes
);


module.exports = router;