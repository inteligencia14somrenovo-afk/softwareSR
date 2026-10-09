
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

module.exports = sheets;
