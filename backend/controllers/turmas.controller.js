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
// DATAS ESPECÍFICAS
// =====================================================

function extrairDatasEspecificas(texto) {
  const datas = [];
  const textoNormalizado = normalizarTexto(texto);

  const regex =
    /(?:^|\s)(\d{1,2}\/\d{1,2})(?=\s|$)/g;

  let match;

  while (
    (match = regex.exec(textoNormalizado)) !== null
  ) {
    datas.push(match[1]);
  }

  return [...new Set(datas)];
}

// =====================================================
// DETECTAR AULA EXPERIMENTAL
// =====================================================

function ehAulaExperimental(conteudo) {
  const texto = normalizarTexto(conteudo);

  const textoSemHorario =
    texto.replace(
      /^(\d{1,2})(?::(\d{2}))?\s*h?/i,
      ""
    ).trim();

  return /^AE\b/i.test(textoSemHorario);
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
// Aceita:
//
// 17h 🎵 T4 Musicalização
// 17h Musicalização
// 10h 🎼 Teoria
// 10h Teoria
//
// T1/T2/T3/T4 são ignorados.
//
// Também pode receber um horário herdado da linha
// quando a célula não começa com horário.
// =====================================================

function interpretarHorarioProfessor(
  conteudo,
  horarioFallback = null
) {
  const texto =
    normalizarTexto(conteudo);

  if (!texto) {
    return null;
  }

  // ===================================================
  // TENTAR HORÁRIO EXPLÍCITO
  // ===================================================

  const horarioMatch =
    texto.match(
      /^(\d{1,2})(?::(\d{2}))?\s*h?/i
    );

  let horario = null;
  let restante = texto;

  if (horarioMatch) {
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

    horario =
      `${String(hora).padStart(2, "0")}:${String(
        minuto
      ).padStart(2, "0")}`;

    restante =
      texto
        .replace(
          /^(\d{1,2})(?::(\d{2}))?\s*h?/i,
          ""
        )
        .trim();
  } else {
    // =================================================
    // NOVO:
    // A célula não possui horário.
    //
    // Exemplo:
    //
    // 🎵 T3 Musicalização 29/09 🎹 3140 Ana Cecília-
    //
    // O horário será herdado da linha da planilha.
    // =================================================

    horario =
      horarioFallback
        ? normalizarHorario(
            horarioFallback
          )
        : null;

    restante = texto;
  }

  if (!horario) {
    return null;
  }

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

const DIAS_SEMANA = {
  2: "SEGUNDA",
  3: "TERÇA",
  4: "QUARTA",
  5: "QUINTA",
  6: "SEXTA",
  7: "SÁBADO",
};

// =====================================================
// DESCOBRIR HORÁRIOS DAS LINHAS
// =====================================================
//
// Algumas células da planilha não repetem o horário.
//
// Exemplo:
//
// 16h 🎤 3290 Deborah Vitória...
//
// e outra célula na mesma linha:
//
// 🎵 T3 Musicalização 29/09 🎹 3140 Ana Cecília-
//
// Nesse caso a segunda célula pertence ao mesmo horário
// da linha.
//
// Primeiro descobrimos os horários explícitos e depois
// usamos a linha como referência para as células que
// não possuem horário.
// =====================================================

function montarMapaHorariosDasLinhas(
  horarios
) {
  const mapa = new Map();

  for (const item of horarios) {
    const horario =
      interpretarHorarioProfessor(
        item.conteudo
      );

    if (!horario) {
      continue;
    }

    const chave =
      `${item.linha}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }

    const lista =
      mapa.get(chave);

    const jaExiste =
      lista.some(
        (itemHorario) =>
          itemHorario.horario ===
            horario.horario &&
          itemHorario.tipo ===
            horario.tipo
      );

    if (jaExiste) {
      continue;
    }

    lista.push({
      horario:
        horario.horario,

      tipo:
        horario.tipo,
    });
  }

  return mapa;
}

// =====================================================
// BUSCAR PROFESSORES DOS HORÁRIOS
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

  // Primeiro descobrimos os horários explícitos
  // existentes em cada linha.
  const mapaHorariosDasLinhas =
    montarMapaHorariosDasLinhas(
      horarios
    );

  for (const item of horarios) {
    const dia =
      DIAS_SEMANA[item.coluna];

    if (!dia) {
      continue;
    }

    // =================================================
    // TENTAR HORÁRIO EXPLÍCITO
    //
    // Se não existir, usar o horário conhecido
    // da mesma linha.
    // =================================================

    let horario =
      interpretarHorarioProfessor(
        item.conteudo
      );

    if (!horario) {
      const horariosDaLinha =
        mapaHorariosDasLinhas.get(
          `${item.linha}`
        ) || [];

      // Se a linha possui apenas um horário,
      // podemos herdá-lo com segurança.
      if (
        horariosDaLinha.length === 1
      ) {
        horario =
          interpretarHorarioProfessor(
            item.conteudo,
            horariosDaLinha[0].horario
          );
      } else {
        // Se houver mais de um horário na mesma linha,
        // não fazemos uma associação arbitrária.
        horario = null;
      }
    }

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

    let professor =
      lista.find(
        (itemProfessor) =>
          itemProfessor.id ===
          item.professor_id
      );

    if (!professor) {
      professor = {
        id: item.professor_id,

        nome:
          item.professor_nome ||
          item.professor_planilha_nome,

        email: item.professor_email,

        professorPlanilhaId:
          item.professor_planilha_id,

        horarios: [],
      };

      lista.push(professor);
    }

    const datasEspecificas =
      extrairDatasEspecificas(
        item.conteudo
      );

    professor.horarios.push({
      linha: item.linha,
      coluna: item.coluna,
      celula: item.celula,
      conteudo: item.conteudo,

      horario:
        horario.horario,

      tipo:
        horario.tipo,

      datasEspecificas,

      aulaExperimental:
        ehAulaExperimental(
          item.conteudo
        ),
    });
  }

  return indice;
}

// =====================================================
// VERIFICAR SE UM PROFESSOR POSSUI EXCEÇÃO
// EM UMA DATA ESPECÍFICA
// =====================================================

function obterExcecoesDoProfessor(
  professor,
  tipo,
  horario
) {
  const excecoes = [];

  for (
    const item
    of professor.horarios
  ) {
    if (
      item.tipo !== tipo ||
      item.horario !== horario
    ) {
      continue;
    }

    if (
      item.datasEspecificas.length === 0
    ) {
      continue;
    }

    excecoes.push({
      ...item,
      tipo,
      horario,
    });
  }

  return excecoes;
}

// =====================================================
// IDENTIFICAR CONFLITO ESPECÍFICO
// =====================================================
//
// Caso 1:
//
// Manuely:
// 19h Teoria 29/09
//
// Apolo:
// 19h AE Vitor 18a Piano 29/09 🎼 Teoria
//
// → Manuely responsável em 29/09.
//
// Caso 2:
//
// Sara:
// 16h 🎤 3290 Deborah Vitória
// 22/09 e 29/09 🎵 T3 Musicalização
//
// Manuely:
// 🎵 T3 Musicalização 29/09 🎹 3140 Ana Cecília-
//
// → Sara em 22/09
// → Manuely em 29/09
//
// A segunda célula não precisa conter "AE".
// O que importa é que ela representa o mesmo
// tipo/horário e possui uma data específica.
// =====================================================

function resolverConflitoPorData(
  professores,
  tipo,
  horario
) {
  if (
    professores.length <= 1
  ) {
    return null;
  }

  // ===================================================
  // TODAS AS OCORRÊNCIAS DATADAS
  // ===================================================

  const ocorrenciasPorProfessor =
    professores.map(
      (professor) => ({
        professor,

        ocorrencias:
          obterExcecoesDoProfessor(
            professor,
            tipo,
            horario
          ),
      })
    );

  // ===================================================
  // COMPARAR DATAS ENTRE OS PROFESSORES
  // ===================================================

  for (
    const origem
    of ocorrenciasPorProfessor
  ) {
    for (
      const ocorrencia
      of origem.ocorrencias
    ) {
      for (
        const data
        of ocorrencia.datasEspecificas
      ) {
        const outrosProfessores =
          ocorrenciasPorProfessor.filter(
            (outro) =>
              outro.professor.id !==
              origem.professor.id
          );

        for (
          const outro
          of outrosProfessores
        ) {
          const outraOcorrencia =
            outro.ocorrencias.find(
              (item) =>
                item.datasEspecificas.includes(
                  data
                )
            );

          if (!outraOcorrencia) {
            continue;
          }

          // =========================================
          // Se um dos dois é AE, o outro é o
          // responsável pela turma.
          // =========================================

          if (
            !ocorrencia.aulaExperimental &&
            outraOcorrencia.aulaExperimental
          ) {
            return {
              professor:
                origem.professor,

              tipoResolucao:
                "excecao_data",

              datas: [data],

              professorAE:
                outro.professor,

              ocupacoesAE: [
                {
                  data,

                  professor:
                    outro.professor,

                  conteudo:
                    outraOcorrencia.conteudo,

                  celula:
                    outraOcorrencia.celula,
                },
              ],
            };
          }

          if (
            ocorrencia.aulaExperimental &&
            !outraOcorrencia.aulaExperimental
          ) {
            return {
              professor:
                outro.professor,

              tipoResolucao:
                "excecao_data",

              datas: [data],

              professorAE:
                origem.professor,

              ocupacoesAE: [
                {
                  data,

                  professor:
                    origem.professor,

                  conteudo:
                    ocorrencia.conteudo,

                  celula:
                    ocorrencia.celula,
                },
              ],
            };
          }

          // =========================================
          // NOVO CASO:
          //
          // Dois professores possuem ocorrência
          // datada no mesmo horário.
          //
          // Se a ocorrência de origem possui
          // conteúdo que indica diretamente a turma
          // e a outra também, mantemos a ocorrência
          // normal como responsável.
          //
          // Isso permite casos como:
          //
          // Sara:
          // 16h ... 22/09 e 29/09 Musicalização
          //
          // Manuely:
          // Musicalização 29/09 ... Ana Cecília
          //
          // A célula da Manuely está ocupando o
          // mesmo horário naquela data.
          // =========================================

          const origemTemTipo =
            ocorrencia.tipo === tipo;

          const outraTemTipo =
            outraOcorrencia.tipo === tipo;

          if (
            origemTemTipo &&
            outraTemTipo
          ) {
            // Se apenas uma ocorrência possui
            // horário explicitamente informado,
            // ela representa o horário-base.
            //
            // A outra pode ser a substituição.
            const origemTemHorarioExplicito =
              /^(\d{1,2})(?::(\d{2}))?\s*h?/i.test(
                normalizarTexto(
                  ocorrencia.conteudo
                )
              );

            const outraTemHorarioExplicito =
              /^(\d{1,2})(?::(\d{2}))?\s*h?/i.test(
                normalizarTexto(
                  outraOcorrencia.conteudo
                )
              );

            if (
              origemTemHorarioExplicito &&
              !outraTemHorarioExplicito
            ) {
              return {
                professor:
                  outro.professor,

                tipoResolucao:
                  "excecao_data",

                datas: [data],

                professorAE: null,

                ocupacoesAE: [
                  {
                    data,

                    professor:
                      outro.professor,

                    conteudo:
                      outraOcorrencia.conteudo,

                    celula:
                      outraOcorrencia.celula,
                  },
                ],
              };
            }

            if (
              !origemTemHorarioExplicito &&
              outraTemHorarioExplicito
            ) {
              return {
                professor:
                  origem.professor,

                tipoResolucao:
                  "excecao_data",

                datas: [data],

                professorAE: null,

                ocupacoesAE: [
                  {
                    data,

                    professor:
                      origem.professor,

                    conteudo:
                      ocorrencia.conteudo,

                    celula:
                      ocorrencia.celula,
                  },
                ],
              };
            }
          }
        }
      }
    }
  }

  return null;
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

    // =================================================
    // NENHUM PROFESSOR
    // =================================================

    if (
      professores.length === 0
    ) {
      return {
        ...turma,

        professor: null,

        professoresEncontrados: [],

        totalProfessoresEncontrados: 0,

        tipoVinculo:
          "sem_professor",

        excecoes: [],
      };
    }

    // =================================================
    // UM ÚNICO PROFESSOR
    // =================================================

    if (
      professores.length === 1
    ) {
      const professor =
        professores[0];

      return {
        ...turma,

        professor: {
          id:
            professor.id,

          nome:
            professor.nome,

          email:
            professor.email,

          professorPlanilhaId:
            professor.professorPlanilhaId,
        },

        professoresEncontrados: [
          {
            id:
              professor.id,

            nome:
              professor.nome,

            email:
              professor.email,

            professorPlanilhaId:
              professor.professorPlanilhaId,
          },
        ],

        totalProfessoresEncontrados: 1,

        tipoVinculo:
          "normal",

        excecoes:
          obterExcecoesDoProfessor(
            professor,
            turma.tipo,
            turma.horario
          ),
      };
    }

    // =================================================
    // MAIS DE UM PROFESSOR
    // =================================================

    const resolucao =
      resolverConflitoPorData(
        professores,
        turma.tipo,
        turma.horario
      );

    if (resolucao) {
      return {
        ...turma,

        professor: {
          id:
            resolucao.professor.id,

          nome:
            resolucao.professor.nome,

          email:
            resolucao.professor.email,

          professorPlanilhaId:
            resolucao.professor
              .professorPlanilhaId,
        },

        professoresEncontrados:
          professores.map(
            (professor) => ({
              id:
                professor.id,

              nome:
                professor.nome,

              email:
                professor.email,

              professorPlanilhaId:
                professor.professorPlanilhaId,
            })
          ),

        totalProfessoresEncontrados:
          professores.length,

        tipoVinculo:
          "excecao_data",

        excecoes:
          resolucao.ocupacoesAE,

        datasResolvidas:
          resolucao.datas,

        professorAE:
          resolucao.professorAE
            ? {
                id:
                  resolucao
                    .professorAE.id,

                nome:
                  resolucao
                    .professorAE.nome,

                email:
                  resolucao
                    .professorAE.email,

                professorPlanilhaId:
                  resolucao
                    .professorAE
                    .professorPlanilhaId,
              }
            : null,
      };
    }

    // =================================================
    // AMBIGUIDADE REAL
    // =================================================

    return {
      ...turma,

      professor: null,

      professoresEncontrados:
        professores.map(
          (professor) => ({
            id:
              professor.id,

            nome:
              professor.nome,

            email:
              professor.email,

            professorPlanilhaId:
              professor.professorPlanilhaId,
          })
        ),

      totalProfessoresEncontrados:
        professores.length,

      tipoVinculo:
        "ambiguo",

      excecoes: [],
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

      erro:
        erro.message,
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

      erro:
        erro.message,
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