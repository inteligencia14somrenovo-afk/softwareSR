const pool = require("../config/database");
const sheets = require("../config/googleSheets");

const SPREADSHEET_ID =
  "1bbzbHCy5_tHx2mjI7KW6xl1f_K7dPFK5QWVWeXbAnco";

  let statusSincronizacao = {
  status: "aguardando",
  inicio: null,
  fim: null,
  duracao: null,
  resultado: null,
  erro: null,
};

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
          "guitarra/violao";

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
        )
        .trim();


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

      conteudoOriginal:
        texto,

    };
  }


  // =====================================================
  // ALUNO NORMAL
  // =====================================================

  const codigoMatch =
    texto.match(
      /\b\d{3,5}\b/
    );


  const codigoAluno =
    codigoMatch
      ? Number(codigoMatch[0])
      : null;


  let restante =
    texto
      .replace(
        /^(\d{1,2})(?::(\d{2}))?h?/i,
        ""
      )
      .replace(
        /📸|❌|🎸|🥁|🎹|🎤|🎻|🎵|🪕|🎼/g,
        ""
      )
      .replace(
        /\b\d{3,5}\b/,
        ""
      )
      .trim();


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
      "aluno",

    codigoAluno,

    nome:
      restante || null,

    instrumento,

    foto,

    conteudoOriginal:
      texto,

  };
}


// =====================================================
// MONTAR ALUNOS A PARTIR DA PLANILHA
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

    // Ignora coluna A

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


    let codigo =
      horario.codigoAluno;

    let nome =
      horario.nome;

    let instrumento =
      horario.instrumento;

    let foto =
      horario.foto;


    // =================================================
    // AE COM ALUNO FIXO
    // =================================================

    if (
      horario.tipo === "experimental" &&
      horario.alunoSubstituido
    ) {

      codigo =
        horario.alunoSubstituido.codigoAluno;

      nome =
        horario.alunoSubstituido.nome;

      instrumento =
        horario.alunoSubstituido.instrumento;

      foto = false;

    }


    // AE sem aluno fixo não vira aluno cadastrado

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
        horario.tipo === "experimental" &&
        horario.alunoSubstituido
          ? horario.alunoSubstituido.dataBloqueada
          : null,

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


  const alunos =
    montarAlunosDaPlanilha(
      resultado
    );


  let novos = 0;
  let atualizados = 0;


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
  };
}


// =====================================================
// FUNÇÃO INTERNA DE SINCRONIZAÇÃO
// =====================================================

async function executarSincronizacao() {
  const inicio = Date.now();

  statusSincronizacao = {
    status: "executando",
    inicio: new Date().toISOString(),
    fim: null,
    duracao: null,
    resultado: null,
    erro: null,
  };

  const client = await pool.connect();


  try {

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


    await client.query(
      "BEGIN"
    );


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


      console.log(
        `✅ ${professor.nome} sincronizado: ${valores.length} linhas | ` +
        `${resultadoAlunos.total} alunos | ` +
        `${resultadoAlunos.novos} novos | ` +
        `${resultadoAlunos.atualizados} atualizados`
      );

    }


   await client.query("COMMIT");

const resultado = {
  sucesso: true,
  professores: professores.rows.length,
  celulas: totalCelulas,
  alunosNovos: totalAlunosNovos,
  alunosAtualizados: totalAlunosAtualizados,
};

statusSincronizacao = {
  status: "sucesso",
  inicio: statusSincronizacao.inicio,
  fim: new Date().toISOString(),
  duracao: Date.now() - inicio,
  resultado,
  erro: null,
};

return resultado;


  } catch (error) {
  await client.query("ROLLBACK");

  statusSincronizacao = {
    status: "erro",
    inicio: statusSincronizacao.inicio,
    fim: new Date().toISOString(),
    duracao: Date.now() - inicio,
    resultado: null,
    erro: error.message,
  };

  throw error;
} finally {

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

      sucesso: true,

      mensagem:
        "Planilha sincronizada com sucesso!",

      ...resultado,

    });


  } catch (error) {

    console.error(
      "❌ Erro ao sincronizar planilha:",
      error
    );


    res.status(500).json({

      sucesso: false,

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

        sucesso: false,

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

        sucesso: false,

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

      sucesso: true,

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

      sucesso: false,

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

        sucesso: false,

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


      const horario =
        interpretarCelula(
          item.conteudo
        );


      if (!horario) {

        continue;

      }


      dados.push({

        celula:
          item.celula,

        diaSemana:
          diasSemana[item.coluna],

        coluna:
          item.coluna,

        ...horario,

      });


      if (
        horario.tipo === "experimental" &&
        horario.alunoSubstituido
      ) {

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
            horario.alunoSubstituido.codigoAluno,

          nome:
            horario.alunoSubstituido.nome,

          instrumento:
            horario.alunoSubstituido.instrumento,

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

      sucesso: true,

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

      sucesso: false,

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

        sucesso: false,

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

      sucesso: true,

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

      sucesso: false,

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