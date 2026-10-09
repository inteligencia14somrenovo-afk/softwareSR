const pool = require("../config/database");
const sheets = require("../config/googleSheets");

const {
  sincronizarTurmasComClient,
} = require("./planilha_turmas.controller");

const SPREADSHEET_ID =
  "1bbzbHCy5_tHx2mjI7KW6xl1f_K7dPFK5QWVWeXbAnco";

// =====================================================
// LOCK GLOBAL DA SINCRONIZAÇÃO
//
// O PostgreSQL garante que somente uma sincronização
// possa acontecer por vez, mesmo que existam múltiplas
// requisições ou instâncias do backend.
// =====================================================

const LOCK_SINCRONIZACAO = 736421;

let statusSincronizacao = {
  status: "aguardando",
  inicio: null,
  fim: null,
  duracao: null,
  resultado: null,
  erro: null,
};


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


function extrairInicioIntervalo(intervalo) {
  const match =
    intervalo.match(/^([A-Z]+)(\d+)/i);

  if (!match) {
    throw new Error(
      `Intervalo inválido: ${intervalo}`
    );
  }

  return {
    coluna: match[1].toUpperCase(),
    linha: Number(match[2]),
  };
}


function letraParaNumero(letras) {
  let numero = 0;

  for (const letra of letras) {
    numero =
      numero * 26 +
      (letra.charCodeAt(0) - 64);
  }

  return numero;
}

function dataTemporariaExpirada(dataTexto) {
  if (!dataTexto) return false;

  const match = dataTexto.match(
    /^(\d{1,2})\/(\d{1,2})$/
  );

  if (!match) return false;

  const dia = Number(match[1]);
  const mes = Number(match[2]);

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Porto_Velho",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value])
  );

  const hoje = new Date(
    Number(valores.year),
    Number(valores.month) - 1,
    Number(valores.day)
  );

  const dataMarcada = new Date(
    Number(valores.year),
    mes - 1,
    dia
  );

  // Datas inválidas não devem causar exclusões.
  if (
    dataMarcada.getMonth() !== mes - 1 ||
    dataMarcada.getDate() !== dia
  ) {
    return false;
  }

  return dataMarcada < hoje;
}


// =====================================================
// EXTRAI DATAS ESPECÍFICAS DO TEXTO
//
// Exemplos:
//
// "Sara Angelo 25/09"
// → ["25/09"]
//
// "Sara Angelo 18/06 25/06"
// → ["18/06", "25/06"]
// =====================================================


function extrairDatas(texto) {
  const datas = [];

  // Reconhece datas mesmo quando estão junto de emojis
  // ou separadas por pontuação.
  const regex = /(?<!\d)(\d{1,2}\/\d{1,2})(?!\d)/g;

  let match;

  while ((match = regex.exec(texto)) !== null) {
    datas.push(match[1]);
  }

  // Evita datas repetidas na mesma célula.
  return [...new Set(datas)];
}


// =====================================================
// REMOVE DATAS DO TEXTO
// =====================================================

function removerDatas(texto) {
  return texto
    .replace(/(?<!\d)\d{1,2}\/\d{1,2}(?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// =====================================================
// FUNÇÃO INTERNA — INTERPRETAR CÉLULA
// =====================================================

function interpretarCelula(conteudo) {

  if (
    !conteudo ||
    !conteudo.trim()
  ) {
    return null;
  }

  const texto =
    conteudo.trim();


  // =====================================================
  // HORÁRIO
  // =====================================================

  const horarioMatch =
    texto.match(
      /^(\d{1,2})(?::(\d{2}))?h?/i
    );

  if (!horarioMatch) {
    return null;
  }

  const hora =
    horarioMatch[1].padStart(
      2,
      "0"
    );

  const minuto =
    horarioMatch[2] || "00";


  // =====================================================
  // TEXTO SEM HORÁRIO
  // =====================================================

  const textoSemHorario =
    texto
      .replace(
        /^(\d{1,2})(?::(\d{2}))?h?/i,
        ""
      )
      .trim();


  // =====================================================
  // AULA EXPERIMENTAL (AE)
  // =====================================================

  const experimentalMatch =
    textoSemHorario.match(
      /^AE\s+(.+?)\s+(\d{1,3})a\s+(guitarra|violão|violao|teclado|piano|bateria|canto|violino|ukulele)\s+(\d{1,2}\/\d{1,2})(?:\s+(?:📸|❌|🎸|🥁|🎹|🎤|🎻|🎵|🪕|🎼)?\s*(\d{3,5})\s+(.+?))?$/i
    );


  if (experimentalMatch) {

    const nome =
      `AE ${experimentalMatch[1].trim()}`;

    const idade =
      Number(
        experimentalMatch[2]
      );

    const instrumentoTexto =
      experimentalMatch[3]
        .toLowerCase();

    const dataExperimental =
      experimentalMatch[4];

    let instrumento =
      instrumentoTexto;


    if (
      instrumentoTexto === "violão" ||
      instrumentoTexto === "violao"
    ) {
      instrumento = "violao";

    } else if (
      instrumentoTexto === "teclado" ||
      instrumentoTexto === "piano"
    ) {
      instrumento =
        "teclado/piano";
    }


    // ===================================================
    // ALUNO FIXO SUBSTITUÍDO
    // ===================================================

    let alunoSubstituido =
      null;


    if (
      experimentalMatch[5]
    ) {

      const codigoAluno =
        Number(
          experimentalMatch[5]
        );

      const nomeAluno =
        experimentalMatch[6]
          .trim();

      let instrumentoAluno =
        null;


      if (texto.includes("🎸"))
        instrumentoAluno =
          "guitarra/violao/ukulele/contrabaixo";

      else if (texto.includes("🥁"))
        instrumentoAluno =
          "bateria";

      else if (texto.includes("🎹"))
        instrumentoAluno =
          "teclado/piano";

      else if (texto.includes("🎤"))
        instrumentoAluno =
          "canto";

      else if (texto.includes("🎻"))
        instrumentoAluno =
          "violino";

      else if (texto.includes("🪕"))
        instrumentoAluno =
          "ukulele";


      alunoSubstituido = {

        codigoAluno,

        nome:
          nomeAluno,

        instrumento:
          instrumentoAluno,

        dataBloqueada:
          dataExperimental,

      };

    }


    return {

      horario:
        `${hora}:${minuto}`,

      tipo:
        "experimental",

      codigoAluno:
        null,

      nome,

      idade,

      instrumento,

      dataExperimental,

      datasEspecificas:
        [dataExperimental],

      alunoSubstituido,

      foto:
        texto.includes("📸"),

      conteudoOriginal:
        texto,

    };

  }


  // =====================================================
  // REPOSIÇÃO DE AULA (REP)
  // =====================================================

  const reposicao =
    /^Rep\b/i.test(
      textoSemHorario
    );


  if (reposicao) {

    const codigoMatch =
      textoSemHorario.match(
        /\b\d{3,5}\b/
      );

    const codigoAluno =
      codigoMatch
        ? Number(codigoMatch[0])
        : null;


    const datasEspecificas =
      extrairDatas(
        textoSemHorario
      );


    let restante =
      textoSemHorario
        .replace(
          /^Rep\b/i,
          ""
        )
        .replace(
          /📸|❌|🎸|🥁|🎹|🎤|🎻|🎵|🪕|🎼/g,
          ""
        )
        .replace(
          /\b\d{3,5}\b/,
          ""
        );


    restante =
      removerDatas(
        restante
      );


    const foto =
      texto.includes("📸");


    let instrumento = null;


    if (texto.includes("🎸"))
      instrumento = "guitarra/violao";

    else if (texto.includes("🥁"))
      instrumento = "bateria";

    else if (texto.includes("🎹"))
      instrumento = "teclado/piano";

    else if (texto.includes("🎤"))
      instrumento = "canto";

    else if (texto.includes("🎻"))
      instrumento = "violino";

    else if (texto.includes("🪕"))
      instrumento = "ukulele";


    return {

      horario:
        `${hora}:${minuto}`,

      tipo:
        "reposicao",

      codigoAluno,

      nome:
        restante || null,

      instrumento,

      foto,

      datasEspecificas,

      conteudoOriginal:
        texto,

    };

  }


  // =====================================================
  // ALUNO NORMAL
  // =====================================================

  // =====================================================
  // CÓDIGO DO ALUNO
  //
  // Primeiro tentamos encontrar o código logo depois
  // do horário, inclusive quando ele está colado:
  //
  // 16:20h3047 Bento Barbeto
  //       ↑
  //       código
  //
  // Depois mantemos a busca tradicional como fallback.
  // =====================================================

  const codigoColadoMatch =
    textoSemHorario.match(
      /^(\d{3,5})(?=\s|$)/
    );

  const codigoMatch =
    codigoColadoMatch ||
    textoSemHorario.match(
      /\b\d{3,5}\b/
    );

  const codigoAluno =
    codigoMatch
      ? Number(
          codigoMatch[1] ||
          codigoMatch[0]
        )
      : null;

  const datasEspecificas =
    extrairDatas(
      textoSemHorario
    );

  // =====================================================
  // REMOVE O HORÁRIO
  // =====================================================

  let restante =
    texto.replace(
      /^(\d{1,2})(?::(\d{2}))?h?/i,
      ""
    );

  // =====================================================
  // REMOVE O CÓDIGO
  //
  // Primeiro trata o código colado ao horário:
  //
  // 16:20h3047 Bento Barbeto
  //
  // Depois trata o formato com espaço:
  //
  // 16:20h 3047 Bento Barbeto
  // =====================================================

  if (codigoAluno) {

    restante =
      restante.replace(
        new RegExp(
          `^\\s*${codigoAluno}\\b`
        ),
        ""
      );

  }

  // =====================================================
  // REMOVE EMOJIS
  // =====================================================

  restante =
    restante.replace(
      /📸|❌|🎸|🥁|🎹|🎤|🎻|🎵|🪕|🎼/g,
      ""
    );

  // =====================================================
  // REMOVE DATAS ESPECÍFICAS
  // =====================================================

  restante =
    removerDatas(
      restante
    );

  const foto =
    texto.includes("📸");

  let instrumento = null;

  if (texto.includes("🎸"))
    instrumento =
      "guitarra/violao";

  else if (texto.includes("🥁"))
    instrumento =
      "bateria";

  else if (texto.includes("🎹"))
    instrumento =
      "teclado/piano";

  else if (texto.includes("🎤"))
    instrumento =
      "canto";

  else if (texto.includes("🎻"))
    instrumento =
      "violino";

  else if (texto.includes("🪕"))
    instrumento =
      "ukulele";

  return {

    horario:
      `${hora}:${minuto}`,

    // ===================================================
    // ALUNO COM DATA = TEMPORÁRIO
    // ===================================================

    tipo:
      datasEspecificas.length > 0
        ? "aluno_temporario"
        : "aluno",

    codigoAluno,

    nome:
      restante || null,

    instrumento,

    foto,

    datasEspecificas,

    conteudoOriginal:
      texto,

  };
}


// =====================================================
// MONTAR ALUNOS DEFINITIVOS A PARTIR DA PLANILHA
//
// SOMENTE entram:
//
// aluno normal SEM data
//
// NÃO entram:
//
// AE
// Rep
// aluno normal com data
// =====================================================

function montarAlunosDaPlanilha(
  resultado
) {

  const diasSemana = {

    2: "SEGUNDA",
    3: "TERÇA",
    4: "QUARTA",
    5: "QUINTA",
    6: "SEXTA",
    7: "SÁBADO",

  };


  const alunosMap =
    new Map();


  for (
    const item
    of resultado.rows
  ) {

    // =================================================
    // IGNORA COLUNA A
    // =================================================

    if (
      !diasSemana[item.coluna]
    ) {
      continue;
    }


    const horario =
      interpretarCelula(
        item.conteudo
      );


    if (!horario) {
      continue;
    }


    // =================================================
    // SOMENTE ALUNO DEFINITIVO
    // =================================================

    if (
      horario.tipo !== "aluno"
    ) {
      continue;
    }


    const codigo =
      horario.codigoAluno;

    const nome =
      horario.nome;

    const instrumento =
      horario.instrumento;

    const foto =
      horario.foto;


    if (!codigo) {
      continue;
    }


    if (
      !alunosMap.has(codigo)
    ) {

      alunosMap.set(
        codigo,
        {

          id:
            codigo,

          codigoAluno:
            codigo,

          nome:
            nome ||
            "Aluno sem nome",

          instrumento,

          foto,

          nascimento:
            null,

          unidade:
            "Porto velho",

          status:
            "ativo",

          horarios:
            []

        }
      );

    }


    const aluno =
      alunosMap.get(codigo);


    if (
      (!aluno.nome ||
        aluno.nome === "Aluno sem nome") &&
      nome
    ) {

      aluno.nome =
        nome;

    }


    if (
      !aluno.instrumento &&
      instrumento
    ) {

      aluno.instrumento =
        instrumento;

    }


    if (foto) {
      aluno.foto = true;
    }


    aluno.horarios.push({

      celula:
        item.celula,

      diaSemana:
        diasSemana[item.coluna],

      horario:
        horario.horario,

      instrumento,

      conteudoOriginal:
        horario.conteudoOriginal,

      dataBloqueada:
        null,

    });

  }


  const alunos =
    Array.from(
      alunosMap.values()
    );


  alunos.sort(
    (a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
  );


  return alunos;
}


// =====================================================
// IDENTIFICAR CÓDIGOS TEMPORÁRIOS
//
// Retorna os códigos que aparecem na planilha
// somente como:
//
// - aluno_temporario
// - Rep
//
// e NÃO aparecem como aluno definitivo.
// =====================================================

function obterCodigosTemporarios(
  resultado
) {

  const diasSemana = {

    2: "SEGUNDA",
    3: "TERÇA",
    4: "QUARTA",
    5: "QUINTA",
    6: "SEXTA",
    7: "SÁBADO",

  };


  const codigosDefinitivos =
    new Set();

  const codigosTemporarios =
    new Set();


  for (
    const item
    of resultado.rows
  ) {

    if (
      !diasSemana[item.coluna]
    ) {
      continue;
    }


    const horario =
      interpretarCelula(
        item.conteudo
      );


    if (!horario) {
      continue;
    }


    // =================================================
    // ALUNO DEFINITIVO
    // =================================================

    if (
      horario.tipo === "aluno" &&
      horario.codigoAluno
    ) {

      codigosDefinitivos.add(
        Number(
          horario.codigoAluno
        )
      );

      continue;
    }


    // =================================================
    // ALUNO TEMPORÁRIO
    // =================================================

    if (
      horario.tipo ===
        "aluno_temporario" &&
      horario.codigoAluno
    ) {

      codigosTemporarios.add(
        Number(
          horario.codigoAluno
        )
      );

      continue;
    }


    // =================================================
    // REP
    // =================================================

    if (
      horario.tipo ===
        "reposicao" &&
      horario.codigoAluno
    ) {

      codigosTemporarios.add(
        Number(
          horario.codigoAluno
        )
      );

    }

  }


  // =====================================================
  // SE O CÓDIGO TAMBÉM É DEFINITIVO,
  // NÃO PODE SER REMOVIDO.
  // =====================================================

  for (
    const codigo
    of codigosDefinitivos
  ) {

    codigosTemporarios.delete(
      codigo
    );

  }


  return {
    codigosDefinitivos,
    codigosTemporarios,
  };

}


// =====================================================
// SINCRONIZAR ALUNOS NA TABELA alunos
// =====================================================

async function sincronizarAlunosDoProfessor(
  client,
  professorId,
  professorPlanilhaId
) {

  const resultado =
    await client.query(
      `
      SELECT
        celula,
        linha,
        coluna,
        conteudo
      FROM planilha_horarios
      WHERE professor_id = $1
      ORDER BY linha, coluna
      `,
      [professorPlanilhaId]
    );


  // =====================================================
  // MONTA SOMENTE OS ALUNOS DEFINITIVOS
  // =====================================================

  const alunos =
    montarAlunosDaPlanilha(
      resultado
    );

// =====================================================
  // IDENTIFICA TEMPORÁRIOS ATUAIS E ANTIGOS
  //
  // 1. Temporários/reposições ainda presentes na planilha.
  // 2. Registros antigos cujo nome contém uma data,
  //    mas que não são alunos definitivos.
  //
  // Um código definitivo nunca deve ser excluído.
  // =====================================================

  const {
    codigosDefinitivos,
    codigosTemporarios,
  } = obterCodigosTemporarios(resultado);

  let novos = 0;
  let atualizados = 0;
  let removidosTemporarios = 0;

  // Busca os registros atuais deste professor.
  const alunosExistentes = await client.query(
    `
    SELECT id, codigo_aluno, nome
    FROM alunos
    WHERE professor_id = $1
    `,
    [professorId]
  );

  const idsParaRemover = [];

  // Data isolada no nome: 23/09, 5/10 etc.
  const regexDataTemporaria =
    /(?:^|\s)\d{1,2}\/\d{1,2}(?=\s|$)/;

  for (const alunoExistente of alunosExistentes.rows) {
    const codigo = alunoExistente.codigo_aluno == null
      ? null
      : Number(alunoExistente.codigo_aluno);

    // Nunca remover um código que também seja definitivo.
    const ehDefinitivo =
      codigo !== null &&
      codigosDefinitivos.has(codigo);

    if (ehDefinitivo) {
      continue;
    }

    const nome = alunoExistente.nome || "";

    // Está marcado como temporário/reposição na planilha?
    const temporarioNaPlanilha =
      codigo !== null &&
      codigosTemporarios.has(codigo);

    // Ficou salvo como temporário no nome, mas pode ter
    // desaparecido da planilha depois da data marcada.
    const temporarioAntigo =
      regexDataTemporaria.test(nome);

    if (temporarioNaPlanilha || temporarioAntigo) {
      idsParaRemover.push(alunoExistente.id);
    }
  }

  // Exclui somente os IDs identificados e contabiliza
  // a quantidade realmente removida.
  if (idsParaRemover.length > 0) {
    const resultadoRemocao = await client.query(
      `
      DELETE FROM alunos
      WHERE professor_id = $1
        AND id = ANY($2::integer[])
      RETURNING id
      `,
      [professorId, idsParaRemover]
    );

    removidosTemporarios =
      resultadoRemocao.rowCount;
  }
 
  // =====================================================
  // SINCRONIZA ALUNOS DEFINITIVOS
  // =====================================================

  for (
    const aluno
    of alunos
  ) {

    // =================================================
    // VERIFICA SE O ALUNO JÁ EXISTE
    // =================================================

    const existente =
      await client.query(
        `
        SELECT
          id,
          nascimento,
          foto
        FROM alunos
        WHERE professor_id = $1
          AND codigo_aluno = $2
        LIMIT 1
        `,
        [
          professorId,
          aluno.codigoAluno,
        ]
      );


    // =================================================
    // ATUALIZA
    // =================================================

    if (
      existente.rows.length > 0
    ) {

      const alunoExistente =
        existente.rows[0];


      await client.query(
        `
        UPDATE alunos
        SET
          nome = $1,
          instrumento = $2,
          status = $3,
          updated_at = NOW()
        WHERE id = $4
        `,
        [
          aluno.nome,
          aluno.instrumento ||
            "Não informado",
          "ativo",
          alunoExistente.id,
        ]
      );


      atualizados++;

      continue;
    }


    // =================================================
    // NOVO ALUNO
    // =================================================

    await client.query(
      `
      INSERT INTO alunos
      (
        professor_id,
        codigo_aluno,
        nome,
        nascimento,
        foto,
        instrumento,
        unidade,
        status,
        created_at,
        updated_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        NULL,
        NULL,
        $4,
        $5,
        $6,
        NOW(),
        NOW()
      )
      `,
      [
        professorId,
        aluno.codigoAluno,
        aluno.nome,
        aluno.instrumento ||
          "Não informado",
        aluno.unidade,
        aluno.status,
      ]
    );


    novos++;

  }


  return {
    total: alunos.length,
    novos,
    atualizados,
    removidosTemporarios,
  };

}


// =====================================================
// FUNÇÃO INTERNA DE SINCRONIZAÇÃO
// =====================================================

async function executarSincronizacao() {

  const inicio =
    Date.now();

  const client =
    await pool.connect();

  let lockAdquirido = false;
  let transacaoIniciada = false;


  try {

    // =================================================
    // PROTEÇÃO CONTRA SINCRONIZAÇÕES SIMULTÂNEAS
    //
    // O lock pertence à conexão PostgreSQL.
    // Enquanto uma sincronização estiver executando,
    // outra requisição não poderá iniciar outra.
    // =================================================

    const lockResult =
      await client.query(
        `
        SELECT pg_try_advisory_lock($1) AS adquirido
        `,
        [LOCK_SINCRONIZACAO]
      );


    if (
      !lockResult.rows[0].adquirido
    ) {

      const erro =
        new Error(
          "Já existe uma sincronização da planilha em andamento. Aguarde alguns segundos e tente novamente."
        );

      erro.code =
        "SINCRONIZACAO_EM_ANDAMENTO";

      throw erro;

    }


    lockAdquirido = true;


    statusSincronizacao = {

      status:
        "executando",

      inicio:
        new Date().toISOString(),

      fim:
        null,

      duracao:
        null,

      resultado:
        null,

      erro:
        null,

    };


    const professores =
      await client.query(
        `
        SELECT
          pp.id,
          pp.nome,
          pp.email,
          pp.aba,
          pp.intervalo,
          p.id AS professor_id
        FROM professores_planilha pp

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE pp.ativo = TRUE
        `
      );


    let totalCelulas = 0;

    let totalAlunosNovos = 0;

    let totalAlunosAtualizados = 0;

    let totalAlunosTemporariosRemovidos = 0;

    // =================================================
    // RESULTADO DA SINCRONIZAÇÃO DAS TURMAS
    // =================================================

    let resultadoTurmas = {
      totalCelulas: 0,
      blocos: [],
    };


    await client.query(
      "BEGIN"
    );

    transacaoIniciada = true;


    for (
      const professor
      of professores.rows
    ) {

      console.log(
        `🔄 Sincronizando ${professor.nome}...`
      );


      const response =
        await sheets.spreadsheets.values.get({

          spreadsheetId:
            SPREADSHEET_ID,

          range:
            `${professor.aba}!${professor.intervalo}`,

        });


      const valores =
        response.data.values || [];


      const inicio =
        extrairInicioIntervalo(
          professor.intervalo
        );


      const colunaInicial =
        letraParaNumero(
          inicio.coluna
        );


      const linhaInicial =
        inicio.linha;


      // =================================================
      // REMOVE O ESPELHO ANTERIOR
      // =================================================

      await client.query(
        `
        DELETE FROM planilha_horarios
        WHERE professor_id = $1
        `,
        [professor.id]
      );


      // =================================================
      // RECRIA O ESPELHO
      //
      // ON CONFLICT protege contra qualquer registro
      // que já exista para a mesma combinação:
      //
      // professor_id + linha + coluna
      // =================================================

      for (
        let linha = 0;
        linha < valores.length;
        linha++
      ) {

        const row =
          valores[linha];


        for (
          let coluna = 0;
          coluna < row.length;
          coluna++
        ) {

          const conteudo =
            row[coluna] ?? "";


          const numeroLinha =
            linhaInicial + linha;


          const numeroColuna =
            colunaInicial + coluna;


          const letraColuna =
            colunaParaLetra(
              numeroColuna
            );


          const celula =
            `${letraColuna}${numeroLinha}`;


          await client.query(
            `
            INSERT INTO planilha_horarios
            (
              professor_id,
              linha,
              coluna,
              celula,
              conteudo
            )
            VALUES
            ($1, $2, $3, $4, $5)

            ON CONFLICT (
              professor_id,
              linha,
              coluna
            )

            DO UPDATE SET
              celula = EXCLUDED.celula,
              conteudo = EXCLUDED.conteudo,
              updated_at = NOW()
            `,
            [
              professor.id,
              linha + 1,
              coluna + 1,
              celula,
              conteudo,
            ]
          );


          totalCelulas++;

        }

      }


      // =================================================
      // SINCRONIZA ALUNOS
      // =================================================

      const resultadoAlunos =
        await sincronizarAlunosDoProfessor(
          client,
          professor.professor_id,
          professor.id
        );


      totalAlunosNovos +=
        resultadoAlunos.novos;


      totalAlunosAtualizados +=
        resultadoAlunos.atualizados;


      totalAlunosTemporariosRemovidos +=
        resultadoAlunos.removidosTemporarios;


      console.log(
        `✅ ${professor.nome} sincronizado: ${valores.length} linhas | ` +
        `${resultadoAlunos.total} alunos | ` +
        `${resultadoAlunos.novos} novos | ` +
        `${resultadoAlunos.atualizados} atualizados | ` +
        `${resultadoAlunos.removidosTemporarios} temporários removidos`
      );

    }


    // =====================================================
    // SINCRONIZA TURMAS
    //
    // Usa o MESMO client e a MESMA transação
    // da sincronização principal.
    //
    // Assim:
    //
    // - horários
    // - alunos
    // - turmas
    //
    // são atualizados juntos.
    //
    // Se ocorrer algum erro aqui, o ROLLBACK abaixo
    // desfaz toda a sincronização desta execução.
    // =====================================================

    
    // =====================================================
    // SINCRONIZA TURMAS
    //
    // Usa um SAVEPOINT para isolar possíveis erros.
    // Se as turmas falharem, preserva a sincronização
    // dos horários e alunos, incluindo a limpeza dos
    // registros temporários.
    // =====================================================

    console.log(
      "📚 Iniciando sincronização automática das turmas..."
    );

    let erroSincronizacaoTurmas = null;

    await client.query(
      "SAVEPOINT sincronizacao_turmas"
    );

    try {
      resultadoTurmas =
        await sincronizarTurmasComClient(client);

      await client.query(
        "RELEASE SAVEPOINT sincronizacao_turmas"
      );

      console.log(
        `✅ Turmas sincronizadas: ${resultadoTurmas.totalCelulas} célula(s).`
      );
    } catch (errorTurmas) {
      // Desfaz somente o que aconteceu dentro do
      // SAVEPOINT, preservando as alterações anteriores.
      await client.query(
        "ROLLBACK TO SAVEPOINT sincronizacao_turmas"
      );

      await client.query(
        "RELEASE SAVEPOINT sincronizacao_turmas"
      );

      erroSincronizacaoTurmas =
        errorTurmas.message;

      resultadoTurmas = {
        totalCelulas: 0,
        blocos: [],
        erro: erroSincronizacaoTurmas,
      };

      console.error(
        "❌ Erro ao sincronizar turmas. A sincronização de horários e alunos será preservada:",
        errorTurmas
      );
    }


    // =====================================================
    // FINALIZA A TRANSAÇÃO
    // =====================================================

    await client.query(
      "COMMIT"
    );

    transacaoIniciada = false;


    const resultado = {

      sucesso:
        true,

      professores:
        professores.rows.length,

      celulas:
        totalCelulas,

      alunosNovos:
        totalAlunosNovos,

      alunosAtualizados:
        totalAlunosAtualizados,

      alunosTemporariosRemovidos:
        totalAlunosTemporariosRemovidos,

      

      // =================================================
      // RESULTADO DAS TURMAS
      // =================================================

           turmas: {
        celulas: resultadoTurmas.totalCelulas,
        blocos: resultadoTurmas.blocos,
        erro: resultadoTurmas.erro || null,
      },

    };


    statusSincronizacao = {

      status:
        "sucesso",

      inicio:
        statusSincronizacao.inicio,

      fim:
        new Date().toISOString(),

      duracao:
        Date.now() - inicio,

      resultado,

      erro:
        null,

    };


    return resultado;


  } catch (error) {

    if (
      transacaoIniciada
    ) {

      try {

        await client.query(
          "ROLLBACK"
        );

      } catch (rollbackError) {

        console.error(
          "❌ Erro ao fazer ROLLBACK:",
          rollbackError
        );

      }

    }


    // =================================================
    // ERRO DE SINCRONIZAÇÃO SIMULTÂNEA
    //
    // Não trata como erro interno do sistema.
    // A rota transforma em HTTP 409.
    // =================================================

    if (
      error.code ===
      "SINCRONIZACAO_EM_ANDAMENTO"
    ) {

      throw error;

    }


    statusSincronizacao = {

      status:
        "erro",

      inicio:
        statusSincronizacao.inicio ||
        new Date().toISOString(),

      fim:
        new Date().toISOString(),

      duracao:
        Date.now() - inicio,

      resultado:
        null,

      erro:
        error.message,

    };


    throw error;


  } finally {

    // =================================================
    // LIBERA O LOCK DO POSTGRES
    // =================================================

    if (
      lockAdquirido
    ) {

      try {

        await client.query(
          `
          SELECT pg_advisory_unlock($1)
          `,
          [LOCK_SINCRONIZACAO]
        );

      } catch (unlockError) {

        console.error(
          "❌ Erro ao liberar lock da sincronização:",
          unlockError
        );

      }

    }


    client.release();

  }

}


// =====================================================
// SINCRONIZAÇÃO MANUAL — API
// =====================================================

async function sincronizarPlanilha(
  req,
  res
) {

  try {

    const resultado =
      await executarSincronizacao();


    res.json({

      sucesso:
        true,

      mensagem:
        "Planilha sincronizada com sucesso!",

      ...resultado,

    });


  } catch (error) {

    if (
      error.code ===
      "SINCRONIZACAO_EM_ANDAMENTO"
    ) {

      return res.status(409).json({

        sucesso:
          false,

        erro:
          error.message,

      });

    }


    console.error(
      "❌ Erro ao sincronizar planilha:",
      error
    );


    res.status(500).json({

      sucesso:
        false,

      erro:
        error.message,

    });

  }

}


// =====================================================
// BUSCAR HORÁRIOS BRUTOS
// =====================================================

async function buscarHorariosProfessor(
  req,
  res
) {

  try {

    if (
      !req.session.professorId
    ) {

      return res.status(401).json({

        sucesso:
          false,

        mensagem:
          "Usuário não autenticado.",

      });

    }


    const professorId =
      req.session.professorId;


    const professor =
      await pool.query(
        `
        SELECT
          pp.id,
          pp.nome,
          pp.email
        FROM professores_planilha pp

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE p.id = $1
          AND pp.ativo = TRUE

        LIMIT 1
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {

      return res.status(404).json({

        sucesso:
          false,

        mensagem:
          "Nenhuma planilha configurada para este professor.",

      });

    }


    const professorPlanilha =
      professor.rows[0];


    const resultado =
      await pool.query(
        `
        SELECT
          id,
          professor_id,
          linha,
          coluna,
          celula,
          conteudo,
          created_at,
          updated_at
        FROM planilha_horarios
        WHERE professor_id = $1
        ORDER BY linha, coluna
        `,
        [professorPlanilha.id]
      );


    return res.json({

      sucesso:
        true,

      professor_id:
        professorId,

      total:
        resultado.rows.length,

      dados:
        resultado.rows,

    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar horários:",
      error
    );


    return res.status(500).json({

      sucesso:
        false,

      erro:
        error.message,

    });

  }

}


// =====================================================
// BUSCAR HORÁRIOS ORGANIZADOS
// =====================================================

async function buscarHorariosOrganizados(
  req,
  res
) {

  try {

    const { professorId } =
      req.params;


    const professor =
      await pool.query(
        `
        SELECT
          pp.id,
          pp.nome,
          pp.email,
          pp.aba,
          pp.intervalo
        FROM professores_planilha pp

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE p.id = $1
          AND pp.ativo = TRUE

        LIMIT 1
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {

      return res.status(404).json({

        sucesso:
          false,

        erro:
          "Nenhuma planilha configurada para este professor.",

      });

    }


    const professorPlanilha =
      professor.rows[0];


    const resultado =
      await pool.query(
        `
        SELECT
          celula,
          linha,
          coluna,
          conteudo
        FROM planilha_horarios
        WHERE professor_id = $1
        ORDER BY linha, coluna
        `,
        [professorPlanilha.id]
      );


    // ===================================================
    // BUSCAR INSTRUMENTO ESPECÍFICO DOS ALUNOS
    // ===================================================

    const alunosResultado =
      await pool.query(
        `
        SELECT
          codigo_aluno,
          instrumento_especifico
        FROM alunos
        WHERE professor_id = $1
        `,
        [Number(professorId)]
      );


    const instrumentosEspecificos =
      new Map();


    for (
      const aluno
      of alunosResultado.rows
    ) {

      if (
        aluno.codigo_aluno === null ||
        aluno.codigo_aluno === undefined
      ) {
        continue;
      }


      instrumentosEspecificos.set(
        Number(aluno.codigo_aluno),
        aluno.instrumento_especifico || null
      );

    }


    const diasSemana = {

      2: "SEGUNDA",
      3: "TERÇA",
      4: "QUARTA",
      5: "QUINTA",
      6: "SEXTA",
      7: "SÁBADO",

    };


    const dados = [];


    for (
      const item
      of resultado.rows
    ) {

      if (
        !diasSemana[item.coluna]
      ) {
        continue;
      }

const horario = interpretarCelula(item.conteudo);

if (!horario) {
  continue;
}

if (
  horario.tipo === "aluno_temporario" &&
  horario.datasEspecificas?.some(dataTemporariaExpirada)
) {
  continue;
}

      const instrumentoEspecifico =
        horario.codigoAluno
          ? instrumentosEspecificos.get(
              Number(horario.codigoAluno)
            ) || null
          : null;


      dados.push({

        celula:
          item.celula,

        diaSemana:
          diasSemana[item.coluna],

        coluna:
          item.coluna,

        ...horario,

        instrumento_especifico:
          instrumentoEspecifico,

      });


      // =================================================
      // ALUNO FIXO SUBSTITUÍDO POR AE
      //
      // Continua aparecendo para a Presença,
      // mas NÃO é recriado como aluno.
      // =================================================

      if (
        horario.tipo === "experimental" &&
        horario.alunoSubstituido
      ) {

        const codigoAluno =
          horario.alunoSubstituido.codigoAluno;


        const instrumentoEspecificoSubstituido =
          instrumentosEspecificos.get(
            Number(codigoAluno)
          ) || null;


        dados.push({

          celula:
            item.celula,

          diaSemana:
            diasSemana[item.coluna],

          coluna:
            item.coluna,

          horario:
            horario.horario,

          tipo:
            "aluno",

          codigoAluno:
            codigoAluno,

          nome:
            horario.alunoSubstituido.nome,

          instrumento:
            horario.alunoSubstituido.instrumento,

          instrumento_especifico:
            instrumentoEspecificoSubstituido,

          foto:
            false,

          dataBloqueada:
            horario.alunoSubstituido.dataBloqueada,

          conteudoOriginal:
            item.conteudo,

        });

      }

    }


    res.json({

      sucesso:
        true,

      professor_id:
        Number(professorId),

      professor_planilha_id:
        professorPlanilha.id,

      total:
        dados.length,

      dados,

    });


  } catch (error) {

    console.error(
      "❌ Erro ao organizar horários:",
      error
    );


    res.status(500).json({

      sucesso:
        false,

      erro:
        error.message,

    });

  }

}


// =====================================================
// BUSCAR ALUNOS DA PLANILHA
// =====================================================

async function buscarAlunosProfessor(
  req,
  res
) {

  try {

    const { professorId } =
      req.params;


    const professor =
      await pool.query(
        `
        SELECT
          pp.id,
          pp.nome,
          pp.email
        FROM professores_planilha pp

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE p.id = $1
          AND pp.ativo = TRUE

        LIMIT 1
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {

      return res.status(404).json({

        sucesso:
          false,

        erro:
          "Nenhuma planilha configurada para este professor.",

      });

    }


    const professorPlanilha =
      professor.rows[0];


    const resultado =
      await pool.query(
        `
        SELECT
          celula,
          linha,
          coluna,
          conteudo
        FROM planilha_horarios
        WHERE professor_id = $1
        ORDER BY linha, coluna
        `,
        [professorPlanilha.id]
      );


    const alunos =
      montarAlunosDaPlanilha(
        resultado
      );


    res.json({

      sucesso:
        true,

      professor_id:
        Number(professorId),

      total:
        alunos.length,

      alunos,

    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar alunos da planilha:",
      error
    );


    res.status(500).json({

      sucesso:
        false,

      erro:
        error.message,

    });

  }

}


// =====================================================
// EXPORTS
// =====================================================

function getStatusSincronizacao() {
  return statusSincronizacao;
}


module.exports = {

  sincronizarPlanilha,

  executarSincronizacao,

  getStatusSincronizacao,

  buscarHorariosProfessor,

  buscarHorariosOrganizados,

  buscarAlunosProfessor,

};