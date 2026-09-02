const express = require('express');
const sheets = require('../config/googleSheets');

const router = express.Router();

const SPREADSHEET_ID = '1bbzbHCy5_tHx2mjI7KW6xl1f_K7dPFK5QWVWeXbAnco';

router.get('/teste', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Horário!A69:G81',
    });

    res.json({
      sucesso: true,
      dados: response.data.values || [],
    });
  } catch (error) {
    console.error('Erro ao acessar Google Sheets:', error);

    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

module.exports = router;
