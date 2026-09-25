const pool = require("../config/database");


// =====================================================
// GET /notificacoes
//
// Gera notificações reais para o professor autenticado.
//
// Tipos atuais:
// - experimental
// - presenca
// - proxima_aula
// - aniversario_5_dias
// - aniversario_2_dias
// - aniversario_hoje
//
// As notificações ainda são geradas dinamicamente.
// =====================================================

async function buscarNotificacoes(req, res) {

  try {

    // ===================================================
    // AUTENTICAÇÃO
    // ===================================================

    if (!req.session.professorId) {

      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });

    }

    const professorId =
      req.session.professorId;


    // ===================================================
    // DATA E HORA ATUAIS
    //
    // Som Renovo usa America/Porto_Velho
    // ===================================================

    const agora = new Date();

    const partesData =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone: "America/Porto_Velho",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }
      ).formatToParts(agora);


    const obterParteData = (tipo) => {

      const parte =
        partesData.find(
          item =>
            item.type === tipo
        );

      return parte
        ? parte.value
        : null;

    };


    const ano =
      Number(
        obterParteData("year")
      );

    const mes =
      Number(
        obterParteData("month")
      );

    const dia =
      Number(
        obterParteData("day")
      );


    const dataHoje =
      `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;


    // Para horário atual, usamos Intl para respeitar
    // America/Porto_Velho.

    const partesHora =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: "America/Porto_Velho",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }
      ).formatToParts(agora);


    const horaAtual =
      Number(
        partesHora.find(
          item =>
            item.type === "hour"
        )?.value || 0
      );

    const minutoAtual =
      Number(
        partesHora.find(
          item =>
            item.type === "minute"
        )?.value || 0
      );


    const minutosAgora =
      horaAtual * 60 +
      minutoAtual;


    // ===================================================
    // DIA DA SEMANA
    // ===================================================

    const diasSemana = [
      "DOMINGO",
      "SEGUNDA",
      "TERÇA",
      "QUARTA",
      "QUINTA",
      "SEXTA",
      "SÁBADO"
    ];


    const dataPortoVelho =
      new Date(
        `${dataHoje}T12:00:00-04:00`
      );


    const diaHoje =
      diasSemana[
        dataPortoVelho.getDay()
      ];


    // ===================================================
    // BUSCAR HORÁRIOS
    // ===================================================

    const resultadoHorarios =
      await pool.query(
        `
        SELECT
          ph.celula,
          ph.linha,
          ph.coluna,
          ph.dia,
          ph.horario,
          ph.conteudo

        FROM planilha_horarios ph

        INNER JOIN professores_planilha pp
          ON pp.id = ph.professor_id

        INNER JOIN professores p
          ON LOWER(TRIM(p.email))
          =
          LOWER(TRIM(pp.email))

        WHERE
          p.id = $1
          AND pp.ativo = TRUE

        ORDER BY
          ph.linha ASC,
          ph.coluna ASC
        `,
        [
          professorId
        ]
      );


    // ===================================================
    // MAPA DAS COLUNAS
    // ===================================================

    const mapaDias = {
      2: "SEGUNDA",
      3: "TERÇA",
      4: "QUARTA",
      5: "QUINTA",
      6: "SEXTA",
      7: "SÁBADO"
    };


    // ===================================================
    // INTERPRETAR HORÁRIO
    // ===================================================

    const horarioEmMinutos = (
      horario
    ) => {

      if (!horario) {
        return null;
      }

      const partes =
        String(horario)
          .split(":")
          .map(Number);

      if (
        partes.length < 2 ||
        Number.isNaN(partes[0]) ||
        Number.isNaN(partes[1])
      ) {
        return null;
      }

      return (
        partes[0] * 60 +
        partes[1]
      );

    };


    // ===================================================
    // INTERPRETAR CONTEÚDO
    // ===================================================

    const interpretarCelula = (
      texto
    ) => {

      if (!texto) {
        return null;
      }

      const original =
        String(texto).trim();

      if (!original) {
        return null;
      }


      // ===============================================
      // HORÁRIO
      // ===============================================

      const horarioMatch =
        original.match(
          /^(\d{1,2})(?:[:h](\d{1,2})?)?h?\s*/i
        );


      if (!horarioMatch) {
        return null;
      }


      const hora =
        Number(
          horarioMatch[1]
        );

      const minuto =
        horarioMatch[2]
          ? Number(
              horarioMatch[2]
            )
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
        `${String(hora).padStart(2, "0")}:` +
        `${String(minuto).padStart(2, "0")}`;


      const textoSemHorario =
        original
          .replace(
            horarioMatch[0],
            ""
          )
          .trim();


      // ===============================================
      // AULA EXPERIMENTAL
      // ===============================================

      const experimentalMatch =
        textoSemHorario.match(
          /^AE\s+(.+?)\s+(\d{1,3})a\s+(guitarra|violão|violao|teclado|piano|bateria|canto|violino|ukulele)\s+(\d{1,2}\/\d{1,2})$/i
        );


      if (experimentalMatch) {

        return {

          tipo: "experimental",

          horario,

          nome:
            experimentalMatch[1]
              .trim(),

          idade:
            Number(
              experimentalMatch[2]
            ),

          instrumento:
            experimentalMatch[3]
              .toLowerCase(),

          dataExperimental:
            experimentalMatch[4],

          conteudoOriginal:
            original

        };

      }


      // ===============================================
      // AULA NORMAL
      // ===============================================

      let textoNormal =
        textoSemHorario
          .replace(/🎸/g, "")
          .replace(/🥁/g, "")
          .replace(/🎹/g, "")
          .replace(/🎤/g, "")
          .replace(/🎻/g, "")
          .replace(/🪕/g, "")
          .replace(/📸/g, "")
          .replace(/❌/g, "")
          .trim();


      // ===============================================
      // CÓDIGO DO ALUNO
      // ===============================================

      const codigoMatch =
        textoNormal.match(
          /(?:^|\s)(\d{3,5})(?:\s|$)/
        );


      if (!codigoMatch) {
        return null;
      }


      const codigoAluno =
        Number(
          codigoMatch[1]
        );


      const nome =
        textoNormal
          .replace(
            codigoMatch[0],
            " "
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim();


      // ===============================================
      // INSTRUMENTO
      // ===============================================

      let instrumento = null;


      if (original.includes("🎸")) {

        instrumento =
          "guitarra";

      } else if (
        original.includes("🥁")
      ) {

        instrumento =
          "bateria";

      } else if (
        original.includes("🎹")
      ) {

        instrumento =
          "teclado/piano";

      } else if (
        original.includes("🎤")
      ) {

        instrumento =
          "canto";

      } else if (
        original.includes("🎻")
      ) {

        instrumento =
          "violino";

      } else if (
        original.includes("🪕")
      ) {

        instrumento =
          "ukulele";

      }


      return {

        tipo: "aluno",

        horario,

        codigoAluno,

        nome:
          nome || null,

        instrumento,

        conteudoOriginal:
          original

      };

    };


    // ===================================================
    // TRANSFORMAR DADOS
    // ===================================================

    const aulas =
      resultadoHorarios.rows
        .map((linha) => {

          const interpretado =
            interpretarCelula(
              linha.conteudo
            );

          if (!interpretado) {
            return null;
          }

          return {

            ...linha,

            diaSemana:
              mapaDias[
                linha.coluna
              ],

            ...interpretado

          };

        })
        .filter(Boolean);


    // ===================================================
    // AULAS DE HOJE
    // ===================================================

    const aulasHoje =
      aulas
        .filter(
          aula =>
            aula.diaSemana
              === diaHoje
        )
        .sort(
          (a, b) =>
            horarioEmMinutos(
              a.horario
            ) -
            horarioEmMinutos(
              b.horario
            )
        );


    // ===================================================
    // PRESENÇAS DE HOJE
    // ===================================================

    const resultadoPresencas =
      await pool.query(
        `
        SELECT
          celula,
          status

        FROM presencas_planilha

        WHERE
          professor_id = $1
          AND data = $2
        `,
        [
          professorId,
          dataHoje
        ]
      );


    const presencasHoje =
      resultadoPresencas.rows;


    // ===================================================
    // LISTA FINAL
    // ===================================================

    const notificacoes = [];


    // ===================================================
    // 1. AULAS EXPERIMENTAIS
    // ===================================================

    const experimentaisHoje =
      aulasHoje.filter(
        aula =>
          aula.tipo
          === "experimental"
      );


    experimentaisHoje.forEach(
      (aula) => {

        notificacoes.push({

          id:
            `experimental-${aula.celula}`,

          tipo:
            "experimental",

          icone:
            "🧪",

          titulo:
            "Aula experimental hoje",

          mensagem:
            `${aula.nome || "Aluno"} tem uma aula experimental de ${aula.instrumento || "música"} às ${aula.horario}.`,

          data:
            dataHoje,

          lida:
            false,

          celula:
            aula.celula

        });

      }
    );


    // ===================================================
    // 2. PRESENÇAS PENDENTES
    // ===================================================

    const aulasNormaisHoje =
      aulasHoje.filter(
        aula =>
          aula.tipo
          === "aluno" &&
          aula.codigoAluno
      );


    aulasNormaisHoje.forEach(
      (aula) => {

        const registro =
          presencasHoje.find(
            presenca =>
              presenca.celula
              === aula.celula
          );


        if (!registro) {

          notificacoes.push({

            id:
              `presenca-${aula.celula}`,

            tipo:
              "presenca",

            icone:
              "📝",

            titulo:
              "Presença pendente",

            mensagem:
              `A presença da aula das ${aula.horario} ainda não foi registrada.`,

            data:
              dataHoje,

            lida:
              false,

            celula:
              aula.celula

          });

        }

      }
    );


    // ===================================================
    // 3. PRÓXIMA AULA
    // ===================================================

    const proximaAula =
      aulasNormaisHoje.find(
        aula => {

          const minutos =
            horarioEmMinutos(
              aula.horario
            );

          return (
            minutos !== null &&
            minutos > minutosAgora
          );

        }
      );


    if (proximaAula) {

      notificacoes.push({

        id:
          `proxima-aula-${proximaAula.celula}`,

        tipo:
          "proxima_aula",

        icone:
          "📅",

        titulo:
          "Próxima aula",

        mensagem:
          `Sua próxima aula é às ${proximaAula.horario}${proximaAula.nome ? ` com ${proximaAula.nome}` : ""}.`,

        data:
          dataHoje,

        lida:
          false,

        celula:
          proximaAula.celula

      });

    }


// ===================================================
// 4. ANIVERSÁRIOS
//
// Avisos:
// - 5 dias antes
// - 2 dias antes
// - no dia
// ===================================================

const resultadoAniversarios =
  await pool.query(
    `
    SELECT
      id,
      nome,
      nascimento,

      CASE
        WHEN
          TO_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::text
            || '-' ||
            TO_CHAR(nascimento, 'MM-DD'),
            'YYYY-MM-DD'
          ) < CURRENT_DATE
        THEN
          TO_DATE(
            (
              EXTRACT(YEAR FROM CURRENT_DATE) + 1
            )::text
            || '-' ||
            TO_CHAR(nascimento, 'MM-DD'),
            'YYYY-MM-DD'
          )

        ELSE
          TO_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::text
            || '-' ||
            TO_CHAR(nascimento, 'MM-DD'),
            'YYYY-MM-DD'
          )
      END AS proximo_aniversario

    FROM alunos

    WHERE
      professor_id = $1
      AND nascimento IS NOT NULL

    ORDER BY nome ASC
    `,
    [
      professorId
    ]
  );


// ---------------------------------------------------
// Criar notificações
// ---------------------------------------------------

resultadoAniversarios.rows.forEach(
  (aluno) => {

    const diferencaDias =
      Math.round(
        (
          new Date(aluno.proximo_aniversario)
            .getTime()
          -
          new Date(dataHoje)
            .getTime()
        )
        /
        (
          1000 *
          60 *
          60 *
          24
        )
      );


    // ===============================================
    // 5 DIAS ANTES
    // ===============================================

    if (diferencaDias === 5) {

      notificacoes.push({

        id:
          `aniversario-5-${aluno.id}-${dataHoje}`,

        tipo:
          "aniversario_5_dias",

        icone:
          "🎂",

        titulo:
          "Aniversário em 5 dias",

        mensagem:
          `O aniversário de ${aluno.nome} será em 5 dias.`,

        data:
          dataHoje,

        lida:
          false

      });

    }


    // ===============================================
    // 2 DIAS ANTES
    // ===============================================

    if (diferencaDias === 2) {

      notificacoes.push({

        id:
          `aniversario-2-${aluno.id}-${dataHoje}`,

        tipo:
          "aniversario_2_dias",

        icone:
          "🎂",

        titulo:
          "Aniversário em 2 dias",

        mensagem:
          `O aniversário de ${aluno.nome} será em 2 dias.`,

        data:
          dataHoje,

        lida:
          false

      });

    }


    // ===============================================
    // NO DIA
    // ===============================================

    if (diferencaDias === 0) {

      notificacoes.push({

        id:
          `aniversario-hoje-${aluno.id}-${dataHoje}`,

        tipo:
          "aniversario_hoje",

        icone:
          "🎉",

        titulo:
          "Aniversário hoje",

        mensagem:
          `Hoje é aniversário de ${aluno.nome}!`,

        data:
          dataHoje,

        lida:
          false

      });

    }

  }
);

    // ===================================================
    // ORDEM
    // ===================================================

    const prioridade = {

      aniversario_hoje: 1,
      aniversario_2_dias: 2,
      aniversario_5_dias: 3,
      experimental: 4,
      presenca: 5,
      proxima_aula: 6

    };


    notificacoes.sort(
      (a, b) =>
        (
          prioridade[a.tipo] || 99
        ) -
        (
          prioridade[b.tipo] || 99
        )
    );


    // ===================================================
    // RESPOSTA
    // ===================================================

    return res.json({

      sucesso: true,

      data: dataHoje,

      notificacoes

    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar notificações:",
      error
    );

    return res.status(500).json({

      sucesso: false,

      mensagem:
        "Erro ao buscar notificações."

    });

  }

}


module.exports = {
  buscarNotificacoes
};