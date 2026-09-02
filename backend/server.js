const express = require("express");
const cors = require("cors");
const session = require("express-session");

const pool = require("./config/database");

const professoresRoutes = require("./routes/professores.routes");
const authRoutes = require("./routes/auth.routes");
const alunosRoutes = require("./routes/alunos.routes");
const responsaveisRoutes = require("./routes/responsaveis.routes");

const aulasRoutes = require("./routes/aulas.routes");
const presencasRoutes = require("./routes/presencas.routes");
const googleSheetsRoutes = require("./routes/googleSheets");
const planilhaRoutes = require("./routes/planilha.routes");

const {
  executarSincronizacao,
} = require("./controllers/planilha.controller");

const app = express();

const PORT = process.env.PORT || 3000;


// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);


// =====================================================
// SESSÃO
// =====================================================

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// =====================================================
// DEBUG DE ROTAS
// =====================================================

app.use((req, res, next) => {

  console.log(
    `🌐 ${req.method} ${req.originalUrl}`
  );

  next();

});

// =====================================================
// JSON
// =====================================================

app.use(express.json());


// =====================================================
// ROTAS
// =====================================================

app.use("/professores", professoresRoutes);

app.use("/auth", authRoutes);

app.use("/alunos", alunosRoutes);

app.use("/", responsaveisRoutes);

app.use("/aulas", aulasRoutes);

app.use("/presencas", presencasRoutes);

app.use("/google-sheets", googleSheetsRoutes);

app.use("/planilha", planilhaRoutes);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

  res.json({
    sucesso: true,
    mensagem: "Backend Som Renovo funcionando!",
  });

});


// =====================================================
// TESTE BANCO
// =====================================================

app.get("/teste-banco", async (req, res) => {

  try {

    const resultado = await pool.query(
      "SELECT NOW()"
    );

    res.json({
      sucesso: true,
      mensagem: "Conexão com PostgreSQL funcionando!",
      horarioBanco: resultado.rows[0].now,
    });

  } catch (error) {

    console.error(
      "Erro ao conectar com o banco:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar ao PostgreSQL.",
    });

  }

});

// =====================================================
// SINCRONIZAR PLANILHA
// =====================================================


let sincronizacaoEmAndamento = false;

async function sincronizarAutomaticamente() {
  if (sincronizacaoEmAndamento) {
    console.log("⏳ Sincronização já está em andamento.");
    return;
  }

  sincronizacaoEmAndamento = true;

  try {
    console.log("⏰ Iniciando sincronização automática...");

    const resultado = await executarSincronizacao();

    console.log(
      "✅ Sincronização automática concluída:",
      resultado
    );
  } catch (error) {
    console.error(
      "❌ Erro na sincronização automática:",
      error
    );
  } finally {
    sincronizacaoEmAndamento = false;
  }
}

// =====================================================
// SERVIDOR
// =====================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  // Sincroniza assim que o backend inicia
  sincronizarAutomaticamente();

  // Depois sincroniza a cada 1 minuto
  setInterval(
    sincronizarAutomaticamente,
    60 * 1000
  );
});