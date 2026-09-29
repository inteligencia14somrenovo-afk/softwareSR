const pool = require("../config/database");

// =====================================================
// UTILITÁRIOS
// =====================================================

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizarDia(dia) {
  const dias = {
    segunda: "SEGUNDA",
    terca: "TERÇA",
    terça: "TERÇA",
    quarta: "QUARTA",
    quinta: "QUINTA",
    sexta: "SEXTA",
    sabado: "SÁBADO",
    sábado: "SÁBADO",
  };

  return dias[normalizarTexto(dia).toLowerCase()] || null;
}

function normalizarHorario(horario) {
  const texto = normalizarTexto(horario)
    .toLowerCase()
    .replace(/\s/g, "");

  const match = texto.match(/^(\d{1,2})h(?:(\d{2}))?$/);

  if (!match) {
    return null;
  }

  const hora = Number(match[1]);
  const minuto = match[2]
    ? Number(match[2])
    : 0;

  if (
    hora < 0 ||
    hora > 23 ||
    minuto < 0 ||
    minuto > 59
  ) {
    return null;
  }

  return `${String(hora).padStart(2, "0")}:${String(
    minuto
  ).padStart(2, "0")}`;
}

// =====================================================
// INTERPRETAR CABEÇALHO DE TURMA
// =====================================================
//
// Exemplos:
//
// "Segunda 15h"
// "Quarta 10h"
// "MUSICALIZAÇÃO - SEGUNDA 10H"
// "17h 🎵 T4 Musicalização"
//
// O T1/T2/T3/T4 não é utilizado.
// =====================================================

function interpretarCabecalho(conteudo) {
  const original = normalizarTexto(conteudo);

  if (!original) {
    return null;
  }

  const texto = original.toLowerCase();

  // ---------------------------------------------------
  // MUSICALIZAÇÃO
  // ---------------------------------------------------

  if (texto.includes("musicalização")) {
    const match = texto.match(
      /musicalização\s*-\s*(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)\s+(\d{1,2}h(?:\d{2})?)/i
    );

    if (!match) {
      return null;
    }

    const dia = normalizarDia(match[1]);
    const horario = normalizarHorario(match[2]);

    if (!dia || !horario) {
      return null;
    }

    return {
      tipo: "MUSICALIZAÇÃO",
      dia,
      horario,
    };
  }

  // ---------------------------------------------------
  // TEORIA
  // ---------------------------------------------------

  const matchTeoria = texto.match(
    /^(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)\s+(\d{1,2}h(?:\d{2})?)/i
  );

  if (matchTeoria) {
    const dia = normalizarDia(matchTeoria[1]);
    const horario = normalizarHorario(matchTeoria[2]);

    if (!dia || !horario) {
      return null;
    }

    return {
      tipo: "TEORIA",
      dia,
      horario,
    };
  }

  // ---------------------------------------------------
  // CASO FUTURO:
  //
  // "17h 🎵 T4 Musicalização"
  //
  // Mantemos suporte para esse formato também.
  // ---------------------------------------------------

  if (
    texto.includes("musicalizacao") ||
    texto.includes("musicalização")
  ) {
    const match = texto.match(
      /(\d{1,2}h(?:\d{2})?).*musicaliza/i
    );

    if (match) {
      const horario = normalizarHorario(match[1]);

      if (horario) {
        return {
          tipo: "MUSICALIZAÇÃO",
          dia: null,
          horario,
        };
      }
    }
  }

  return null;
}

// =====================================================
// VERIFICAR SE É CÓDIGO DE ALUNO
// =====================================================

function ehCodigoAluno(valor) {
  const texto = normalizarTexto(valor);

  if (!texto) {
    return false;
  }

  return /^\d+$/.test(texto);
}

// =====================================================
// BUSCAR DADOS BRUTOS
// =====================================================

async function buscarDadosBrutos() {
  const resultado = await pool.query(
    `
    SELECT
      aba,
      linha,
      coluna,
      celula,
      conteudo
    FROM planilha_turmas
    ORDER BY
      linha,
      coluna
    `
  );

  return resultado.rows;
}

// =====================================================
// ORGANIZAR CÉLULAS EM MATRIZ
// =====================================================

function montarMatriz(dados) {
  const matriz = {};

  for (const item of dados) {
    if (!matriz[item.linha]) {
      matriz[item.linha] = {};
    }

    matriz[item.linha][item.coluna] =
      item.conteudo;
  }

  return matriz;
}

// =====================================================
// BUSCAR VALOR DE UMA CÉLULA
// =====================================================

function obterCelula(matriz, linha, coluna) {
  return matriz[linha]?.[coluna] ?? "";
}

// =====================================================
// EXTRAIR ALUNOS DE UMA TURMA
// =====================================================
//
// A estrutura é:
//
// B4 = Segunda 15h
// B5 = Codigo
// C5 = Aluno
// B6 = código
// C6 = nome
// B7 = código
// C7 = nome
//
// Então, ao encontrar um cabeçalho em B4,
// procuramos alunos abaixo dele até encontrar
// outro cabeçalho na mesma coluna ou chegar
// ao fim do bloco.
// =====================================================

function extrairAlunos(
  matriz,
  linhaCabecalho,
  colunaCodigo,
  linhaFim
) {
  const alunos = [];

  for (
    let linha = linhaCabecalho + 1;
    linha <= linhaFim;
    linha++
  ) {
    const valorCodigo = normalizarTexto(
      obterCelula(
        matriz,
        linha,
        colunaCodigo
      )
    );

    const valorNome = normalizarTexto(
      obterCelula(
        matriz,
        linha,
        colunaCodigo + 1
      )
    );

    // Se encontrou outro cabeçalho de turma,
    // terminou esta turma.
    if (
      interpretarCabecalho(valorCodigo)
    ) {
      break;
    }

    if (
      valorCodigo.toUpperCase() ===
        "TURMA FECHADA" ||
      valorNome.toUpperCase() ===
        "TURMA FECHADA"
    ) {
      continue;
    }

    if (!ehCodigoAluno(valorCodigo)) {
      continue;
    }

    alunos.push({
      codigo: valorCodigo,
      nome: valorNome || null,
    });
  }

  return alunos;
}

// =====================================================
// EXTRAIR TURMAS
// =====================================================

function interpretarTurmas(dados) {
  const matriz = montarMatriz(dados);

  const linhas = Object.keys(matriz)
    .map(Number)
    .sort((a, b) => a - b);

  if (!linhas.length) {
    return [];
  }

  const menorLinha = Math.min(...linhas);
  const maiorLinha = Math.max(...linhas);

  const turmas = [];

  for (
    let linha = menorLinha;
    linha <= maiorLinha;
    linha++
  ) {
    const colunas = Object.keys(
      matriz[linha] || {}
    )
      .map(Number)
      .sort((a, b) => a - b);

    for (const coluna of colunas) {
      const conteudo = normalizarTexto(
        obterCelula(
          matriz,
          linha,
          coluna
        )
      );

      const cabecalho =
        interpretarCabecalho(conteudo);

      if (!cabecalho) {
        continue;
      }

      const alunos = extrairAlunos(
        matriz,
        linha,
        coluna,
        maiorLinha
      );

      turmas.push({
        tipo: cabecalho.tipo,
        dia: cabecalho.dia,
        horario: cabecalho.horario,
        celulaCabecalho:
          `${coluna}:${linha}`,
        alunos,
        totalAlunos: alunos.length,
      });
    }
  }

  return turmas;
}

// =====================================================
// ENDPOINT DE TESTE
// =====================================================

async function buscarTurmasInterpretadas(
  req,
  res
) {
  try {
    const dados = await buscarDadosBrutos();

    const turmas =
      interpretarTurmas(dados);

    res.json({
      sucesso: true,
      totalTurmas: turmas.length,
      turmas,
    });
  } catch (erro) {
    console.error(
      "❌ Erro ao interpretar turmas:",
      erro
    );

    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao interpretar turmas.",
      erro: erro.message,
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  buscarTurmasInterpretadas,
  interpretarTurmas,
};
