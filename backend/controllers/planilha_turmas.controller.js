const pool = require("../config/database");
const sheets = require("../config/googleSheets");

const SPREADSHEET_ID =
  "1bbzbHCy5_tHx2mj7KW6xl1f_K7dPFK5QWVWeXbAnco";

// =====================================================
// CONFIGURAÇÃO DAS ABAS / BLOCOS DE TURMAS
// =====================================================
//
// A mesma aba possui dois blocos:
//
// TEORIA:
// A1:AI20
//
// MUSICALIZAÇÃO:
// A24:X37
//
// O campo "tipo" identifica de qual bloco o dado veio.
// Ele não é salvo no banco ainda, pois a tabela
// planilha_turmas atual não possui uma coluna para isso.
// =====================================================

const ABAS_TURMAS = [
  {
    tipo: "TEORIA",
    aba: "Teoria e Musicalização atualizados",
    intervalo: "A1:AI20",
    linhaInicial: 1,
    colunaInicial: 1,
  },
  {
    tipo: "MUSICALIZAÇÃO",
    aba: "Teoria e Musicalização atualizados",
    intervalo: "A24:X37",
    linhaInicial: 24,
    colunaInicial: 1,
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
// SINCRONIZAÇÃO INTERNA DOS BLOCOS DE TURMAS
// =====================================================
//
// Esta função NÃO abre conexão, NÃO inicia transação
// e NÃO faz COMMIT/ROLLBACK.
//
// Ela recebe o mesmo client utilizado pela
// sincronização principal da planilha.
//
// Isso permite que:
// - horários
// - alunos
// - turmas
//
// sejam sincronizados dentro da mesma transação.
// =====================================================

async function sincronizarTurmasComClient(client) {
  let totalCelulas = 0;

  for (const turma of ABAS_TURMAS) {
    console.log(
      `📚 Sincronizando ${turma.tipo}: ${turma.aba}!${turma.intervalo}`
    );

  
const resposta = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `'${turma.aba.replace(/'/g, "''")}'!${turma.intervalo}`,
});


    const valores = resposta.data.values || [];

    console.log(
      `📊 ${turma.tipo}: ${valores.length} linha(s) retornada(s).`
    );

    // -------------------------------------------------
    // Remove somente os dados que pertencem ao intervalo
    // atual.
    //
    // Como os dois blocos estão na mesma aba, não podemos
    // simplesmente apagar toda a aba a cada bloco.
    // -------------------------------------------------

    const [linhaInicio, linhaFim] =
      turma.intervalo
        .match(/\d+/g)
        .map(Number);

    await client.query(
      `
      DELETE FROM planilha_turmas
      WHERE aba = $1
        AND linha BETWEEN $2 AND $3
      `,
      [
        turma.aba,
        linhaInicio,
        linhaFim,
      ]
    );

    // -------------------------------------------------
    // Salva cada célula com sua posição REAL na planilha
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
        const conteudo =
          linha[colunaIndex] ?? "";

        const linhaReal =
          turma.linhaInicial + linhaIndex;

        const colunaReal =
          turma.colunaInicial + colunaIndex;

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
      `✅ ${turma.tipo}: ${valores.length} linha(s) processada(s).`
    );
  }

  return {
    totalCelulas,

    blocos: ABAS_TURMAS.map(
      (item) => ({
        tipo: item.tipo,
        aba: item.aba,
        intervalo: item.intervalo,
      })
    ),
  };
}

// =====================================================
// SINCRONIZAÇÃO DAS TURMAS
// =====================================================
//
// Esta função continua sendo usada pela sincronização
// manual/teste.
//
// Ela cria sua própria conexão e transação.
//
// A sincronização automática utilizará diretamente
// sincronizarTurmasComClient() para compartilhar a
// mesma transação da sincronização principal.
// =====================================================

async function sincronizarTurmas() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultado =
      await sincronizarTurmasComClient(client);

    await client.query("COMMIT");

    console.log(
      `✅ Sincronização das turmas concluída. ${resultado.totalCelulas} célula(s) sincronizada(s).`
    );

    return {
      sucesso: true,
      mensagem:
        "Turmas sincronizadas com sucesso.",
      totalCelulas:
        resultado.totalCelulas,
      blocos:
        resultado.blocos,
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
      mensagem:
        "Erro ao buscar dados das turmas.",
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
      mensagem:
        "Erro ao buscar dados da aba.",
      erro: erro.message,
    });
  }
}

// =====================================================
// SINCRONIZAÇÃO MANUAL
// =====================================================

async function testarSincronizacaoTurmas(req, res) {
  try {
    const resultado =
      await sincronizarTurmas();

    res.json(resultado);
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao sincronizar turmas.",
      erro: erro.message,
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sincronizarTurmas,
  sincronizarTurmasComClient,
  testarSincronizacaoTurmas,
  buscarPlanilhaTurmas,
  buscarTurmasPorAba,
};