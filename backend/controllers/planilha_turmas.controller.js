const pool = require("../config/database");
const sheets = require("../config/googleSheets");

const SPREADSHEET_ID =
  "1bbzbHCy5_tHx2mjI7KW6xl1f_K7dPFK5QWVWeXbAnco";

// =====================================================
// CONFIGURAÇÃO DAS ABAS DE TURMAS
// =====================================================

const ABAS_TURMAS = [
  {
    aba: "Teoria",
    intervalo: "A37:AI37",
  },
  {
    aba: "Musicalização",
    intervalo: "A37:AI37",
  },
];

// =====================================================
// UTILITÁRIOS
// =====================================================

function colunaParaLetra(numero) {
  let resultado = "";

  while (numero > 0) {
    const resto = (numero - 1) % 26;

    resultado =
      String.fromCharCode(65 + resto) + resultado;

    numero = Math.floor((numero - 1) / 26);
  }

  return resultado;
}

// =====================================================
// SINCRONIZAÇÃO DAS ABAS DE TURMAS
// =====================================================

async function sincronizarTurmas() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalCelulas = 0;

    for (const turma of ABAS_TURMAS) {
      console.log(
        `📚 Sincronizando aba de turmas: ${turma.aba}`
      );

      const resposta = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${turma.aba}!${turma.intervalo}`,
      });

      const valores = resposta.data.values || [];

      // -------------------------------------------------
      // Remove somente os dados antigos dessa aba.
      // As outras abas permanecem intactas.
      // -------------------------------------------------

      await client.query(
        `
        DELETE FROM planilha_turmas
        WHERE aba = $1
        `,
        [turma.aba]
      );

      // -------------------------------------------------
      // Salva novamente os dados atuais da planilha.
      // -------------------------------------------------

      for (
        let linhaIndex = 0;
        linhaIndex < valores.length;
        linhaIndex++
      ) {
        const linha = valores[linhaIndex];

        for (
          let colunaIndex = 0;
          colunaIndex < linha.length;
          colunaIndex++
        ) {
          const conteudo = linha[colunaIndex] ?? "";

          const linhaReal = 37 + linhaIndex;
          const colunaReal = colunaIndex + 1;

          const celula =
            `${colunaParaLetra(colunaReal)}${linhaReal}`;

          await client.query(
            `
            INSERT INTO planilha_turmas (
              aba,
              linha,
              coluna,
              celula,
              conteudo
            )
            VALUES ($1, $2, $3, $4, $5)

            ON CONFLICT (aba, linha, coluna)
            DO UPDATE SET
              celula = EXCLUDED.celula,
              conteudo = EXCLUDED.conteudo,
              updated_at = CURRENT_TIMESTAMP
            `,
            [
              turma.aba,
              linhaReal,
              colunaReal,
              celula,
              conteudo,
            ]
          );

          totalCelulas++;
        }
      }

      console.log(
        `✅ ${turma.aba}: ${valores.length} linha(s) sincronizada(s).`
      );
    }

    await client.query("COMMIT");

    console.log(
      `✅ Sincronização das turmas concluída. ${totalCelulas} célula(s).`
    );

    return {
      sucesso: true,
      mensagem: "Turmas sincronizadas com sucesso.",
      totalCelulas,
      abas: ABAS_TURMAS.map((item) => item.aba),
    };
  } catch (erro) {
    await client.query("ROLLBACK");

    console.error(
      "❌ Erro ao sincronizar turmas:",
      erro
    );

    throw erro;
  } finally {
    client.release();
  }
}

// =====================================================
// BUSCAR DADOS BRUTOS DAS TURMAS
// =====================================================
//
// Por enquanto retorna exatamente o que foi espelhado
// do Google Sheets.
//
// A montagem das turmas será feita separadamente,
// depois do cruzamento com planilha_horarios.
//

async function buscarPlanilhaTurmas(req, res) {
  try {
    const resultado = await pool.query(
      `
      SELECT
        id,
        aba,
        linha,
        coluna,
        celula,
        conteudo,
        created_at,
        updated_at
      FROM planilha_turmas
      ORDER BY
        aba,
        linha,
        coluna
      `
    );

    res.json({
      sucesso: true,
      total: resultado.rows.length,
      dados: resultado.rows,
    });
  } catch (erro) {
    console.error(
      "❌ Erro ao buscar planilha de turmas:",
      erro
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar dados das turmas.",
      erro: erro.message,
    });
  }
}

// =====================================================
// BUSCAR DADOS DE UMA ABA ESPECÍFICA
// =====================================================

async function buscarTurmasPorAba(req, res) {
  try {
    const { aba } = req.params;

    const abasPermitidas = ABAS_TURMAS.map(
      (item) => item.aba
    );

    if (!abasPermitidas.includes(aba)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Aba de turma inválida.",
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        id,
        aba,
        linha,
        coluna,
        celula,
        conteudo,
        created_at,
        updated_at
      FROM planilha_turmas
      WHERE aba = $1
      ORDER BY
        linha,
        coluna
      `,
      [aba]
    );

    res.json({
      sucesso: true,
      aba,
      total: resultado.rows.length,
      dados: resultado.rows,
    });
  } catch (erro) {
    console.error(
      "❌ Erro ao buscar aba de turmas:",
      erro
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar dados da aba.",
      erro: erro.message,
    });
  }
}

// =====================================================
// SINCRONIZAÇÃO MANUAL
// =====================================================

async function testarSincronizacaoTurmas(req, res) {
  try {
    const resultado = await sincronizarTurmas();

    res.json(resultado);
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao sincronizar turmas.",
      erro: erro.message,
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sincronizarTurmas,
  testarSincronizacaoTurmas,
  buscarPlanilhaTurmas,
  buscarTurmasPorAba,
};