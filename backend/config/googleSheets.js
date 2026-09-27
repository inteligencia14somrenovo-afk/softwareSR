require("dotenv").config();

const { google } = require("googleapis");

let auth;

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_REFRESH_TOKEN
) {
  console.log("🔐 Google Sheets: usando OAuth 2.0 com refresh token.");

  auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
} else {
  console.log("🔑 Google Sheets: usando Application Default Credentials.");

  auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

const sheets = google.sheets({
  version: "v4",
  auth,
});

module.exports = sheets;