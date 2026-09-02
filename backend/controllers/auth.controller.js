const { google } = require("googleapis");
const oauth2Client = require("../config/google");
const pool = require("../config/database");

const FRONTEND_URL =
process.env.FRONTEND_URL
|| "http://localhost:5173";

const scopes = [
  "openid",
  "email",
  "profile",
];

const iniciarGoogle = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "select_account",
  });

  res.redirect(url);
};

const callbackGoogle = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Código de autorização não recebido.",
      });
    }

    // Troca o código recebido pelo Google pelos tokens
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Busca informações da conta Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    const email = data.email;
    const nomeGoogle = data.name;

    if (!email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O Google não forneceu um e-mail.",
      });
    }

    // Procura o professor pelo e-mail
    const professorExistente = await pool.query(
      `
      SELECT *
      FROM professores
      WHERE email = $1
      `,
      [email]
    );

    let professor;

    if (professorExistente.rows.length > 0) {
      // Professor já existe
      professor = professorExistente.rows[0];

      console.log("👨‍🏫 Professor encontrado:", professor.email);
    } else {
      // Primeiro acesso: cria o professor
      const novoProfessor = await pool.query(
        `
        INSERT INTO professores (email, nome)
        VALUES ($1, $2)
        RETURNING *
        `,
        [email, nomeGoogle || null]
      );

      professor = novoProfessor.rows[0];

      console.log("🆕 Novo professor criado:", professor.email);
    }

    //Guarda o professor na sessão
    req.session.professorId = professor.id;

    await new Promise((resolve, reject) => {
  req.session.save((err) => {
    if (err) {
      reject(err);
      return;
    }

    resolve();
  });
});

    console.log(" Login realizado:", professor.email);

    console.log("FRONTEND_URL:", FRONTEND_URL);
    return res.redirect(`${FRONTEND_URL}/`);

  } catch (error) {
    console.error("❌ Erro no login Google:", error);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao realizar login.",
    });
  }
};

module.exports = {
  iniciarGoogle,
  callbackGoogle,
};