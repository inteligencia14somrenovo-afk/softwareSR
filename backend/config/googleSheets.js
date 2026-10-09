
require("dotenv").config();

const { google } = require("googleapis");

let auth;
let modoOAuth = false;

const SPREADSHEET_ID =
  "1bbzbHCy5_tHx2mj7KW6xl1f_K7dPFK5QWVWeXbAnco";

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REFRESH_TOKEN
) {
  modoOAuth = true;

  console.log(
    "🔐 Google Sheets: usando OAuth 2.0 com refresh token."
  );

  auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
} else {
  console.log(
    "🔑 Google Sheets: usando Application Default Credentials."
  );

  auth = new google.auth.GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
}

console.log("🔎 Ambiente Google Sheets:", {
  modoOAuth,
  clientIdConfigurado: Boolean(process.env.GOOGLE_CLIENT_ID),
  clientSecretConfigurado: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  refreshTokenConfigurado: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
  spreadsheetId: SPREADSHEET_ID,
});


const sheets = google.sheets({
  version: "v4",
  auth,
});

// =====================================================
// DIAGNÓSTICO TEMPORÁRIO — REMOVER APÓS O TESTE
// =====================================================

async function diagnosticarGoogleSheets() {
  console.log("🧪 Iniciando diagnóstico de acesso ao Google Sheets...");

  // Teste 1: validar o token OAuth e consultar seus escopos.
if (modoOAuth) {
  try {
    const resultado = await auth.getAccessToken();
    const accessToken = resultado.token;

    if (!accessToken) {
      throw new Error("O Google não retornou um access token.");
    }

    const info = await auth.getTokenInfo(accessToken);

    console.log("🔎 Diagnóstico do token OAuth:", {
      tokenObtido: true,
      email: info.email || "E-mail não disponibilizado",
      escopos: info.scopes || [],
      audiencia: info.aud || "Não informada",
    });
  } catch (error) {
    console.error("❌ Falha ao validar o token OAuth:", {
      status: error.response?.status,
      mensagem:
        error.response?.data?.error_description ||
        error.response?.data?.error?.message ||
        error.message,
    });
  }
}
  // Teste 2: confirmar acesso ao arquivo específico.
  try {
    const resposta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: "spreadsheetId,properties(title),sheets(properties(title,sheetId))",
    });

    console.log("✅ Acesso à planilha confirmado:", {
      id: resposta.data.spreadsheetId,
      titulo: resposta.data.properties?.title,
      abas: resposta.data.sheets?.map((aba) => ({
        nome: aba.properties?.title,
        gid: aba.properties?.sheetId,
      })),
    });
  } catch (error) {
    console.error("❌ Falha ao acessar a planilha:", {
      status: error.response?.status,
      mensagem:
        error.response?.data?.error?.message ||
        error.message,
      motivo:
        error.response?.data?.error?.status ||
        "Não informado",
    });
  }
}

// Executar o diagnóstico sem bloquear a exportação do módulo.
diagnosticarGoogleSheets().catch((error) => {
  console.error(
    "❌ Erro inesperado no diagnóstico Google Sheets:",
    error.message
  );
});

module.exports = sheets;
