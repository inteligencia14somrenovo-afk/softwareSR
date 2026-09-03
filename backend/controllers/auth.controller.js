const { google } = require("googleapis");
const oauth2Client = require("../config/google");
const pool = require("../config/database");

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

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

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    const email = data.email;

    if (!email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O Google não forneceu um e-mail.",
      });
    }

    const professorExistente = await pool.query(
      `
      SELECT *
      FROM professores
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
      `,
      [email]
    );

    if (professorExistente.rows.length === 0) {
      console.log("🚫 Acesso negado para:", email);

      return res.status(403).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Acesso não autorizado</title>
          </head>
          <body style="
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 60px 20px;
          ">
            <h2>Acesso não autorizado</h2>
            <p>
              Este e-mail não está cadastrado no sistema
              da Som Renovo.
            </p>
            <p>
              Entre em contato com um administrador.
            </p>
          </body>
        </html>
      `);
    }

    const professor = professorExistente.rows[0];

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

    console.log("✅ Login realizado:", professor.email);
    console.log("FRONTEND_URL:", FRONTEND_URL);

    return res.redirect(`${FRONTEND_URL}/`);

  } catch (error) {
    console.error("❌ Erro no login Google:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao realizar login.",
    });
  }
};

module.exports = {
  iniciarGoogle,
  callbackGoogle,
};