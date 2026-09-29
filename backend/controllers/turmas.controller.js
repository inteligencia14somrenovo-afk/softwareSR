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

  const match = texto.match(
    /^(\d{1,2})(?::(\d{2}))?h$/
  );

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

function interpretarCabecalho(conteudo) {
  const original = normalizarTexto(conteudo);

  if (!original) {
    return null;
  }

  const texto = original.toLowerCase();

  // ===================================================
  // MUSICALIZAÇÃO
  //
  // Exemplo:
  // MUSICALIZAÇÃO - SEGUNDA 10H
  // ===================================================

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

  // ===================================================
  // TEORIA
  //
  // Exemplo:
  // Segunda 15h
  // Quarta 10h
  // ===================================================

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

  return null;
}

// =====================================================
// VERIFICAR CÓDIGO DE ALUNO
// =====================================================

function ehCodigoAluno(valor) {
  const texto = normalizarTexto(valor);

  if (!texto) {
    return false;
  }

  return /^\d+$/.test(texto);
}

// =====================================================
// BUSCAR DADOS BRUTOS DAS TURMAS
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
// BUSCAR VALOR DE CÉLULA
// =====================================================

function obterCelula(
  matriz,
  linha,
  coluna
) {
  return matriz[linha]?.[coluna] ?? "";
}

// =====================================================
// EXTRAIR ALUNOS DA TURMA
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
    const valorCodigo =
      normalizarTexto(
        obterCelula(
          matriz,
          linha,
          colunaCodigo
        )
      );

    const valorNome =
      normalizarTexto(
        obterCelula(
          matriz,
          linha,
          colunaCodigo + 1
        )
      );

    // Outro cabeçalho encontrado.
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
// INTERPRETAR TODAS AS TURMAS
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
      const conteudo =
        normalizarTexto(
          obterCelula(
            matriz,
            linha,
            coluna
          )
        );

      const cabecalho =
        interpretarCabecalho(
          conteudo
        );

      if (!cabecalho) {
        continue;
      }

      const alunos =
        extrairAlunos(
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

        totalAlunos:
          alunos.length,

        professor: null,
      });
    }
  }

  return turmas;
}

// =====================================================
// INTERPRETAR HORÁRIO DO PROFESSOR
// =====================================================
//
// Exemplos aceitos:
//
// 17h 🎵 T4 Musicalização
// 17h Musicalização
// 10h 🎼 Teoria
// 10h Teoria
//
// T1/T2/T3/T4 são ignorados.
// =====================================================

function interpretarHorarioProfessor(
  conteudo
) {
  const texto =
    normalizarTexto(conteudo);

  if (!texto) {
    return null;
  }

  // Precisa começar com horário.
  const horarioMatch =
    texto.match(
      /^(\d{1,2})(?::(\d{2}))?\s*h?/i
    );

  if (!horarioMatch) {
    return null;
  }

  const hora =
    Number(horarioMatch[1]);

  const minuto =
    horarioMatch[2]
      ? Number(horarioMatch[2])
      : 0;

  if (
    hora < 0 ||
    hora > 23 ||
    minuto < 0 ||
    minuto > 59
  ) {
    return null;
  }

  const horario =
    `${String(hora).padStart(2, "0")}:${String(
      minuto
    ).padStart(2, "0")}`;

  const restante =
    texto
      .replace(
        /^(\d{1,2})(?::(\d{2}))?\s*h?/i,
        ""
      )
      .trim();

  const restanteNormalizado =
    restante
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  // ===================================================
  // MUSICALIZAÇÃO
  // ===================================================

  if (
    restanteNormalizado.includes(
      "musicalizacao"
    )
  ) {
    return {
      tipo: "MUSICALIZAÇÃO",
      horario,
    };
  }

  // ===================================================
  // TEORIA
  // ===================================================

  if (
    restanteNormalizado.includes(
      "teoria"
    )
  ) {
    return {
      tipo: "TEORIA",
      horario,
    };
  }

  return null;
}

// =====================================================
// MAPA DE DIAS DOS PROFESSORES
// =====================================================
//
// planilha_horarios usa:
//
// 2 = segunda
// 3 = terça
// 4 = quarta
// 5 = quinta
// 6 = sexta
// 7 = sábado
// =====================================================

const DIAS_SEMANA = {
  2: "SEGUNDA",
  3: "TERÇA",
  4: "QUARTA",
  5: "QUINTA",
  6: "SEXTA",
  7: "SÁBADO",
};

// =====================================================
// BUSCAR PROFESSORES DOS HORÁRIOS
// =====================================================
//
// IMPORTANTE:
//
// planilha_horarios.professor_id
//     ↓
// professores_planilha.id
//
// professores_planilha
//     ↓ email
//
// professores.id
// =====================================================

async function buscarHorariosDosProfessores() {
  const resultado = await pool.query(
    `
    SELECT
      ph.professor_id AS professor_planilha_id,

      ph.linha,
      ph.coluna,
      ph.celula,
      ph.conteudo,

      pp.nome AS professor_planilha_nome,
      pp.email AS professor_email,

      p.id AS professor_id,
      p.nome AS professor_nome

    FROM planilha_horarios ph

    INNER JOIN professores_planilha pp
      ON pp.id = ph.professor_id

    INNER JOIN professores p
      ON LOWER(TRIM(p.email))
       =
       LOWER(TRIM(pp.email))

    WHERE pp.ativo = TRUE

    ORDER BY
      p.id,
      ph.linha,
      ph.coluna
    `
  );

  return resultado.rows;
}

// =====================================================
// INDEXAR PROFESSORES POR:
// TIPO + DIA + HORÁRIO
// =====================================================

function montarIndiceProfessores(
  horarios
) {
  const indice = new Map();

  for (const item of horarios) {
    const dia =
      DIAS_SEMANA[item.coluna];

    if (!dia) {
      continue;
    }

    const horario =
      interpretarHorarioProfessor(
        item.conteudo
      );

    if (!horario) {
      continue;
    }

    const chave =
      `${horario.tipo}|${dia}|${horario.horario}`;

    if (!indice.has(chave)) {
      indice.set(chave, []);
    }

    const lista =
      indice.get(chave);

    // Evita adicionar o mesmo professor
    // várias vezes para o mesmo horário.
    const jaExiste =
      lista.some(
        (professor) =>
          professor.id ===
          item.professor_id
      );

    if (jaExiste) {
      continue;
    }

    lista.push({
      id: item.professor_id,
      nome:
        item.professor_nome ||
        item.professor_planilha_nome,
      email: item.professor_email,
      professorPlanilhaId:
        item.professor_planilha_id,
    });
  }

  return indice;
}

// =====================================================
// CRUZAR TURMAS COM PROFESSORES
// =====================================================

async function vincularProfessoresAsTurmas(
  turmas
) {
  const horarios =
    await buscarHorariosDosProfessores();

  const indice =
    montarIndiceProfessores(
      horarios
    );

  return turmas.map((turma) => {
    const chave =
      `${turma.tipo}|${turma.dia}|${turma.horario}`;

    const professores =
      indice.get(chave) || [];

    return {
      ...turma,

      professor:
        professores.length === 1
          ? professores[0]
          : null,

      professoresEncontrados:
        professores,

      totalProfessoresEncontrados:
        professores.length,
    };
  });
}

// =====================================================
// ENDPOINT — TURMAS INTERPRETADAS
// =====================================================

async function buscarTurmasInterpretadas(
  req,
  res
) {
  try {
    const dados =
      await buscarDadosBrutos();

    const turmas =
      interpretarTurmas(
        dados
      );

    res.json({
      sucesso: true,
      totalTurmas:
        turmas.length,
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
// ENDPOINT — TURMAS + PROFESSORES
// =====================================================

async function buscarTurmasComProfessores(
  req,
  res
) {
  try {
    const dados =
      await buscarDadosBrutos();

    const turmas =
      interpretarTurmas(
        dados
      );

    const turmasComProfessores =
      await vincularProfessoresAsTurmas(
        turmas
      );

    res.json({
      sucesso: true,

      totalTurmas:
        turmasComProfessores.length,

      turmas:
        turmasComProfessores,
    });
  } catch (erro) {
    console.error(
      "❌ Erro ao cruzar turmas com professores:",
      erro
    );

    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao cruzar turmas com professores.",
      erro: erro.message,
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  buscarTurmasInterpretadas,
  buscarTurmasComProfessores,
  interpretarTurmas,
  vincularProfessoresAsTurmas,
};