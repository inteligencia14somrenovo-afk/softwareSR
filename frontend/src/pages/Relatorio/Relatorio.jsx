import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Relatorio.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

/* =====================================================
   DIAS DA SEMANA
===================================================== */

const normalizarDiaSemana = (valor) => {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  const texto = String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    texto !== "" &&
    !isNaN(Number(texto))
  ) {
    const numero =
      Number(texto);

    if (
      numero >= 0 &&
      numero <= 6
    ) {
      return numero;
    }

    if (numero === 7) {
      return 6;
    }
  }

  const mapa = {
    domingo: 0,
    dom: 0,

    segunda: 1,
    "segunda-feira": 1,
    seg: 1,

    terca: 2,
    "terca-feira": 2,
    ter: 2,

    quarta: 3,
    "quarta-feira": 3,
    qua: 3,

    quinta: 4,
    "quinta-feira": 4,
    qui: 4,

    sexta: 5,
    "sexta-feira": 5,
    sex: 5,

    sabado: 6,
    "sabado-feira": 6,
    sab: 6,
  };

  return mapa[texto] ?? null;
};

/* =====================================================
   DATA
===================================================== */

const formatarData = (data) => {
  if (!data) {
    return "";
  }

  const partes =
    String(data).split("-");

  if (
    partes.length !== 3
  ) {
    return String(data);
  }

  const [ano, mes, dia] =
    partes;

  return `${dia}/${mes}/${ano}`;
};

const obterDataISO = (data) => {
  const ano =
    data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};

const obterDiasDoMes = (
  ano,
  mes
) => {
  const dias = [];

  const quantidade =
    new Date(
      ano,
      mes + 1,
      0
    ).getDate();

  for (
    let dia = 1;
    dia <= quantidade;
    dia++
  ) {
    const data =
      new Date(
        ano,
        mes,
        dia
      );

    dias.push({
      data,
      dataString:
        obterDataISO(data),
      diaSemana:
        data.getDay(),
    });
  }

  return dias;
};

/* =====================================================
   HORÁRIO
===================================================== */

const formatarHorario = (
  horario
) => {
  if (!horario) {
    return "";
  }

  return String(
    horario
  ).trim();
};

/* =====================================================
   NORMALIZAR RESPOSTA DA PLANILHA
===================================================== */

const normalizarHorariosResposta = (
  data
) => {
  if (!data) {
    return [];
  }

  if (
    Array.isArray(
      data.horarios
    )
  ) {
    return data.horarios;
  }

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data.dados
    )
  ) {
    return data.dados;
  }

  if (
    Array.isArray(
      data.resultado
    )
  ) {
    return data.resultado;
  }

  const resultado = [];

  Object.entries(
    data
  ).forEach(
    ([chave, valor]) => {
      if (
        Array.isArray(valor)
      ) {
        valor.forEach(
          (item) => {
            if (
              item &&
              typeof item ===
                "object"
            ) {
              resultado.push({
                ...item,

                diaSemana:
                  item.diaSemana ??
                  item.dia ??
                  item.dia_semana ??
                  chave,
              });
            }
          }
        );
      }
    }
  );

  return resultado;
};

/* =====================================================
   NORMALIZAR ITEM DE HORÁRIO
===================================================== */

const normalizarHorario = (
  item
) => {
  if (
    !item ||
    typeof item !==
      "object"
  ) {
    return null;
  }

  const celula =
    item.celula ??
    item.cell ??
    item.endereco ??
    item.codigoCelula ??
    "";

  const diaSemana =
    item.diaSemana ??
    item.dia ??
    item.dia_semana ??
    item.diaSemanaNome ??
    "";

  const horario =
    item.horario ??
    item.hora ??
    item.horarioAula ??
    "";

  const nome =
    item.nome ??
    item.nomeAluno ??
    item.alunoNome ??
    item.aluno?.nome ??
    "";

  const instrumento =
    item.instrumento ??
    item.curso ??
    item.aluno?.instrumento ??
    "";

  const codigoAluno =
    item.codigoAluno ??
    item.codigo ??
    item.idAluno ??
    item.alunoId ??
    item.aluno?.codigo ??
    "";

  const foto =
    item.foto ??
    item.fotoAluno ??
    "";

  const cancelado =
    item.cancelado ??
    false;

  return {
    ...item,

    celula:
      String(celula).trim(),

    diaSemana,

    horario:
      formatarHorario(
        horario
      ),

    nome:
      String(nome).trim(),

    instrumento:
      String(
        instrumento
      ).trim(),

    codigoAluno:
      String(
        codigoAluno
      ).trim(),

    foto,

    cancelado,
  };
};

/* =====================================================
   COMPONENTE
===================================================== */

function Relatorio() {
  const [
    professor,
    setProfessor,
  ] = useState(null);

  const [
    carregandoProfessor,
    setCarregandoProfessor,
  ] = useState(true);

  const [
    horariosPlanilha,
    setHorariosPlanilha,
  ] = useState([]);

  const [
    presencas,
    setPresencas,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mesSelecionado,
    setMesSelecionado,
  ] = useState(
    new Date()
  );

  /* =====================================================
     NOVOS ESTADOS VISUAIS
  ===================================================== */

  const [
    alunoSelecionado,
    setAlunoSelecionado,
  ] = useState(null);

  const [
    pesquisaAluno,
    setPesquisaAluno,
  ] = useState("");

  const [
    mostrarTodosAlunos,
    setMostrarTodosAlunos,
  ] = useState(false);

  const [
    pesquisaAula,
    setPesquisaAula,
  ] = useState("");

  const [
    mostrarTodasAulas,
    setMostrarTodasAulas,
  ] = useState(false);

  /* =====================================================
     MÊS
  ===================================================== */

  const ano =
    mesSelecionado.getFullYear();

  const mes =
    mesSelecionado.getMonth();

  const mesString =
    `${ano}-${String(
      mes + 1
    ).padStart(2, "0")}`;

  const nomeMes =
    mesSelecionado.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    );

  /* =====================================================
     PROFESSOR LOGADO
  ===================================================== */

  useEffect(() => {
    const carregarProfessor =
      async () => {
        try {
          setCarregandoProfessor(
            true
          );

          const response =
            await fetch(
              `${API_URL}/auth/me`,
              {
                credentials:
                  "include",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.mensagem ||
                "Não foi possível identificar o professor."
            );
          }

          const professorEncontrado =
            data.professor ||
            data.usuario ||
            data.user ||
            data;

          console.log(
            "👨‍🏫 Professor do relatório:",
            professorEncontrado
          );

          if (
            !professorEncontrado?.id
          ) {
            throw new Error(
              "Professor logado não possui ID."
            );
          }

          setProfessor(
            professorEncontrado
          );
        } catch (error) {
          console.error(
            "❌ Erro ao carregar professor:",
            error
          );

          setErro(
            error.message ||
              "Não foi possível identificar o professor logado."
          );
        } finally {
          setCarregandoProfessor(
            false
          );
        }
      };

    carregarProfessor();
  }, []);

  /* =====================================================
     CARREGAR HORÁRIOS
  ===================================================== */

  const carregarHorarios =
    async () => {
      if (
        !professor?.id
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/planilha/horarios/${professor.id}/organizados`,
            {
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        console.log(
          "📋 Resposta dos horários:",
          data
        );

        if (
          !response.ok
        ) {
          throw new Error(
            data.mensagem ||
              "Não foi possível carregar os horários."
          );
        }

        const horarios =
          normalizarHorariosResposta(
            data
          )
            .map(
              normalizarHorario
            )
            .filter(Boolean);

        console.log(
          "📋 Horários normalizados:",
          horarios
        );

        setHorariosPlanilha(
          horarios
        );
      } catch (error) {
        console.error(
          "❌ Erro ao carregar horários:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível carregar os horários."
        );
      }
    };

  /* =====================================================
     CARREGAR PRESENÇAS
  ===================================================== */

  const carregarPresencas =
    async () => {
      if (
        !professor?.id
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/presencas?mes=${mesString}`,
            {
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        console.log(
          "📊 Presenças do relatório:",
          data
        );

        if (
          !response.ok
        ) {
          throw new Error(
            data.mensagem ||
              "Não foi possível carregar as presenças."
          );
        }

        const formatadas =
          (
            data.presencas ||
            []
          ).map(
            (presenca) => ({
              id: Number(
                presenca.id
              ),

              celula:
                String(
                  presenca.celula ||
                    ""
                ).trim(),

              data:
                typeof presenca.data ===
                "string"
                  ? presenca.data.split(
                      "T"
                    )[0]
                  : presenca.data,

              status:
                presenca.status,
            })
          );

        setPresencas(
          formatadas
        );
      } catch (error) {
        console.error(
          "❌ Erro ao carregar presenças:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível carregar as presenças."
        );
      }
    };

  /* =====================================================
     CARREGAMENTO
  ===================================================== */

  useEffect(() => {
    if (
      carregandoProfessor ||
      !professor?.id
    ) {
      return;
    }

    setCarregando(
      true
    );

    setErro("");

    Promise.all([
      carregarHorarios(),
      carregarPresencas(),
    ])
      .catch(
        (error) => {
          console.error(
            "❌ Erro geral no relatório:",
            error
          );
        }
      )
      .finally(() => {
        setCarregando(
          false
        );
      });
  }, [
    professor,
    carregandoProfessor,
    mesString,
  ]);

  /* =====================================================
     AULAS DO MÊS
  ===================================================== */

  const aulasDoMes =
    useMemo(() => {
      if (
        !horariosPlanilha.length
      ) {
        return [];
      }

      const diasDoMes =
        obterDiasDoMes(
          ano,
          mes
        );

      const aulas = [];

      horariosPlanilha.forEach(
        (horario) => {
          if (
            !horario.celula ||
            !horario.nome
          ) {
            return;
          }

          if (
            horario.cancelado ===
              true ||
            horario.cancelado ===
              "true" ||
            horario.cancelado ===
              "1"
          ) {
            return;
          }

          const diaSemana =
            normalizarDiaSemana(
              horario.diaSemana
            );

          if (
            diaSemana === null
          ) {
            return;
          }

          diasDoMes.forEach(
            (dia) => {
              if (
                dia.diaSemana !==
                diaSemana
              ) {
                return;
              }

              const presenca =
                presencas.find(
                  (item) =>
                    item.celula ===
                      horario.celula &&
                    item.data ===
                      dia.dataString
                );

              aulas.push({
                id:
                  `${horario.celula}-${dia.dataString}`,

                celula:
                  horario.celula,

                data:
                  dia.dataString,

                horario:
                  horario.horario,

                nome:
                  horario.nome,

                instrumento:
                  horario.instrumento,

                codigoAluno:
                  horario.codigoAluno,

                foto:
                  horario.foto,

                status:
                  presenca?.status ||
                  "pendente",
              });
            }
          );
        }
      );

      return aulas.sort(
        (a, b) => {
          if (
            a.data !==
            b.data
          ) {
            return a.data.localeCompare(
              b.data
            );
          }

          return a.horario.localeCompare(
            b.horario
          );
        }
      );
    }, [
      horariosPlanilha,
      presencas,
      ano,
      mes,
    ]);

  /* =====================================================
     ALUNOS
  ===================================================== */

  const alunos =
    useMemo(() => {
      const mapa =
        new Map();

      aulasDoMes.forEach(
        (aula) => {
          const chave =
            aula.codigoAluno ||
            aula.nome ||
            aula.celula;

          if (
            !mapa.has(chave)
          ) {
            mapa.set(
              chave,
              {
                id: chave,

                codigoAluno:
                  aula.codigoAluno,

                nome:
                  aula.nome,

                instrumento:
                  aula.instrumento,

                foto:
                  aula.foto,

                aulas: [],

                presentes: 0,

                faltas: 0,

                pendentes: 0,
              }
            );
          }

          const aluno =
            mapa.get(chave);

          aluno.aulas.push(
            aula
          );

          if (
            aula.status ===
            "presente"
          ) {
            aluno.presentes++;
          } else if (
            aula.status ===
            "falta"
          ) {
            aluno.faltas++;
          } else {
            aluno.pendentes++;
          }
        }
      );

      return Array.from(
        mapa.values()
      ).map(
        (aluno) => {
          const totalRegistradas =
            aluno.presentes +
            aluno.faltas;

          return {
            ...aluno,

            totalAulas:
              aluno.aulas.length,

            frequencia:
              totalRegistradas >
              0
                ? Math.round(
                    (
                      aluno.presentes /
                      totalRegistradas
                    ) *
                      100
                  )
                : 0,
          };
        }
      );
    }, [
      aulasDoMes,
    ]);

  /* =====================================================
     ALUNOS FILTRADOS
  ===================================================== */

  const alunosFiltrados =
    useMemo(() => {
      const termo =
        pesquisaAluno
          .trim()
          .toLowerCase();

      const filtrados =
        !termo
          ? alunos
          : alunos.filter(
              (aluno) =>
                aluno.nome
                  .toLowerCase()
                  .includes(
                    termo
                  )
            );

      if (
        mostrarTodosAlunos ||
        termo
      ) {
        return filtrados;
      }

      return filtrados.slice(
        0,
        5
      );
    }, [
      alunos,
      pesquisaAluno,
      mostrarTodosAlunos,
    ]);

  /* =====================================================
     RESUMO
  ===================================================== */

  const resumo =
    useMemo(() => {
      const totalAulas =
        aulasDoMes.length;

      const presentes =
        aulasDoMes.filter(
          (aula) =>
            aula.status ===
            "presente"
        ).length;

      const faltas =
        aulasDoMes.filter(
          (aula) =>
            aula.status ===
            "falta"
        ).length;

      const pendentes =
        aulasDoMes.filter(
          (aula) =>
            aula.status ===
            "pendente"
        ).length;

      const registradas =
        presentes +
        faltas;

      const frequencia =
        registradas > 0
          ? Math.round(
              (
                presentes /
                registradas
              ) *
                100
            )
          : 0;

      return {
        totalAulas,
        presentes,
        faltas,
        pendentes,
        frequencia,
      };
    }, [
      aulasDoMes,
    ]);

  /* =====================================================
     FREQUÊNCIA POR DIA
  ===================================================== */

  const frequenciaPorDia =
    useMemo(() => {
      const mapa =
        new Map();

      aulasDoMes.forEach(
        (aula) => {
          if (
            !mapa.has(
              aula.data
            )
          ) {
            mapa.set(
              aula.data,
              {
                data:
                  aula.data,

                presentes: 0,

                faltas: 0,

                pendentes: 0,
              }
            );
          }

          const dia =
            mapa.get(
              aula.data
            );

          if (
            aula.status ===
            "presente"
          ) {
            dia.presentes++;
          } else if (
            aula.status ===
            "falta"
          ) {
            dia.faltas++;
          } else {
            dia.pendentes++;
          }
        }
      );

      return Array.from(
        mapa.values()
      )
        .sort(
          (a, b) =>
            a.data.localeCompare(
              b.data
            )
        )
        .map(
          (dia) => {
            const registradas =
              dia.presentes +
              dia.faltas;

            return {
              ...dia,

              frequencia:
                registradas >
                0
                  ? Math.round(
                      (
                        dia.presentes /
                        registradas
                      ) *
                        100
                    )
                  : 0,
            };
          }
        );
    }, [
      aulasDoMes,
    ]);

  /* =====================================================
     AULAS FILTRADAS
  ===================================================== */

  const aulasFiltradas =
    useMemo(() => {
      const termo =
        pesquisaAula
          .trim()
          .toLowerCase();

      const filtradas =
        !termo
          ? aulasDoMes
          : aulasDoMes.filter(
              (aula) =>
                aula.nome
                  .toLowerCase()
                  .includes(
                    termo
                  )
            );

      if (
        mostrarTodasAulas ||
        termo
      ) {
        return filtradas;
      }

      return filtradas.slice(
        0,
        10
      );
    }, [
      aulasDoMes,
      pesquisaAula,
      mostrarTodasAulas,
    ]);

  /* =====================================================
     MUDAR MÊS
  ===================================================== */

  const mudarMes =
    (quantidade) => {
      setMesSelecionado(
        (atual) =>
          new Date(
            atual.getFullYear(),
            atual.getMonth() +
              quantidade,
            1
          )
      );

      setAlunoSelecionado(
        null
      );

      setPesquisaAluno(
        ""
      );

      setPesquisaAula(
        ""
      );

      setMostrarTodosAlunos(
        false
      );

      setMostrarTodasAulas(
        false
      );
    };

  /* =====================================================
     CSV
  ===================================================== */

  const baixarRelatorioPresencas =
    () => {
      const linhas = [
        [
          "Aluno",
          "Código",
          "Instrumento",
          "Data",
          "Horário",
          "Status",
        ],
      ];

      aulasDoMes.forEach(
        (aula) => {
          linhas.push([
            aula.nome,
            aula.codigoAluno,
            aula.instrumento,
            formatarData(
              aula.data
            ),
            aula.horario,
            aula.status,
          ]);
        }
      );

      const csv =
        linhas
          .map(
            (linha) =>
              linha
                .map(
                  (valor) =>
                    `"${String(
                      valor ??
                        ""
                    ).replace(
                      /"/g,
                      '""'
                    )}"`
                )
                .join(";")
          )
          .join("\n");

      const blob =
        new Blob(
          [
            "\uFEFF" +
              csv,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `relatorio-presencas-${mesString}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );
    };

  /* =====================================================
     FECHAR MODAL
  ===================================================== */

  const fecharHistorico =
    () => {
      setAlunoSelecionado(
        null
      );
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    carregandoProfessor ||
    carregando
  ) {
    return (
      <div className="relatorio">
        <div className="relatorio-carregando">
          Carregando relatório...
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relatorio">

      {/* HEADER */}

      <div className="relatorio-header">
        <div>
          <h1>
            Relatório
          </h1>

          <p>
            Histórico de presença e
            desempenho dos alunos.
          </p>
        </div>

        <button
          type="button"
          className="btn-download"
          onClick={
            baixarRelatorioPresencas
          }
        >
          ↓ CSV Presenças
        </button>
      </div>

      {/* ERRO */}

      {erro && (
        <div className="relatorio-erro">
          {erro}
        </div>
      )}

      {/* MÊS */}

      <div className="relatorio-mes">
        <button
          type="button"
          onClick={() =>
            mudarMes(-1)
          }
        >
          ‹
        </button>

        <strong>
          {nomeMes}
        </strong>

        <button
          type="button"
          onClick={() =>
            mudarMes(1)
          }
        >
          ›
        </button>
      </div>

      {/* RESUMO */}

      <div className="relatorio-resumo">

        <div className="card-resumo">
          <span>
            Aulas previstas
          </span>

          <strong>
            {resumo.totalAulas}
          </strong>
        </div>

        <div className="card-resumo">
          <span>
            Presenças
          </span>

          <strong>
            {resumo.presentes}
          </strong>
        </div>

        <div className="card-resumo">
          <span>
            Faltas
          </span>

          <strong>
            {resumo.faltas}
          </strong>
        </div>

        <div className="card-resumo">
          <span>
            Pendentes
          </span>

          <strong>
            {resumo.pendentes}
          </strong>
        </div>

        <div className="card-resumo destaque">
          <span>
            Frequência
          </span>

          <strong>
            {resumo.frequencia}%
          </strong>
        </div>

      </div>

      {/* GRÁFICOS */}

      <div className="relatorio-graficos">

        {/* PRESENÇA X FALTA */}

        <div className="grafico-card">

          <div className="grafico-header">
            <div>
              <h2>
                Presença x Falta
              </h2>

              <p>
                Situação das aulas
                registradas no mês.
              </p>
            </div>
          </div>

          <div className="grafico-presenca">

            <div className="barra-grafico">
              <div
                className="barra presente"
                style={{
                  height: `${
                    resumo.totalAulas >
                    0
                      ? (
                          resumo.presentes /
                          resumo.totalAulas
                        ) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="barra-grafico">
              <div
                className="barra falta"
                style={{
                  height: `${
                    resumo.totalAulas >
                    0
                      ? (
                          resumo.faltas /
                          resumo.totalAulas
                        ) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="barra-grafico">
              <div
                className="barra pendente"
                style={{
                  height: `${
                    resumo.totalAulas >
                    0
                      ? (
                          resumo.pendentes /
                          resumo.totalAulas
                        ) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

          </div>

          <div className="legenda-grafico">

            <span>
              <i className="legenda presente" />
              Presente:{" "}
              {resumo.presentes}
            </span>

            <span>
              <i className="legenda falta" />
              Falta:{" "}
              {resumo.faltas}
            </span>

            <span>
              <i className="legenda pendente" />
              Pendente:{" "}
              {resumo.pendentes}
            </span>

          </div>

        </div>

        {/* FREQUÊNCIA NO MÊS */}

        <div className="grafico-card">

          <div className="grafico-header">
            <div>
              <h2>
                Frequência no mês
              </h2>

              <p>
                Evolução da frequência
                por dia.
              </p>
            </div>
          </div>

          <div className="frequencia-grafico">

            {frequenciaPorDia.length ===
            0 ? (
              <div className="grafico-vazio">
                Nenhuma aula registrada.
              </div>
            ) : (
              frequenciaPorDia.map(
                (dia) => (
                  <div
                    className="frequencia-coluna"
                    key={
                      dia.data
                    }
                  >
                    <span>
                      {dia.frequencia}%
                    </span>

                    <div className="frequencia-barra">
                      <div
                        style={{
                          height: `${dia.frequencia}%`,
                        }}
                      />
                    </div>

                    <small>
                      {dia.data.slice(
                        8,
                        10
                      )}
                    </small>
                  </div>
                )
              )
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          FREQUÊNCIA POR ALUNO
      ===================================================== */}

      <div className="relatorio-secao">

        <div className="secao-header">
          <div>
            <h2>
              Frequência por aluno
            </h2>

            <p>
              Desempenho individual
              durante o mês.
            </p>
          </div>
        </div>

        {/* PESQUISA DE ALUNO */}

        <div className="relatorio-pesquisa">
          <span>
            🔍
          </span>

          <input
            type="text"
            value={
              pesquisaAluno
            }
            onChange={(event) =>
              setPesquisaAluno(
                event.target.value
              )
            }
            placeholder="Pesquisar aluno por nome..."
          />
        </div>

        <div className="alunos-relatorio">

          {alunosFiltrados.length ===
          0 ? (
            <div className="relatorio-vazio">
              Nenhum aluno encontrado.
            </div>
          ) : (
            alunosFiltrados.map(
              (aluno) => (
                <div
                  className="aluno-relatorio"
                  key={
                    aluno.id
                  }
                >

                  <button
                    type="button"
                    className="aluno-linha"
                    onClick={() =>
                      setAlunoSelecionado(
                        aluno
                      )
                    }
                  >

                    <div className="aluno-info">

                      <strong>
                        {aluno.nome}
                      </strong>

                      <span>
                        {aluno.instrumento ||
                          "Sem instrumento"}
                      </span>

                    </div>

                    <div className="aluno-numero">

                      <strong>
                        {aluno.totalAulas}
                      </strong>

                      <span>
                        aulas
                      </span>

                    </div>

                    <div className="aluno-numero">

                      <strong>
                        {aluno.presentes}
                      </strong>

                      <span>
                        presentes
                      </span>

                    </div>

                    <div className="aluno-numero">

                      <strong>
                        {aluno.faltas}
                      </strong>

                      <span>
                        faltas
                      </span>

                    </div>

                    <div className="aluno-numero">

                      <strong>
                        {aluno.pendentes}
                      </strong>

                      <span>
                        pendentes
                      </span>

                    </div>

                    <div className="aluno-frequencia">

                      <strong>
                        {aluno.frequencia}%
                      </strong>

                      <div className="frequencia-progress">
                        <div
                          style={{
                            width: `${aluno.frequencia}%`,
                          }}
                        />
                      </div>

                    </div>

                    <span className="aluno-seta">
                      →
                    </span>

                  </button>

                </div>
              )
            )
          )}

        </div>

        {/* VER TODOS */}

        {!pesquisaAluno.trim() &&
          alunos.length > 5 && (
            <button
              type="button"
              className="btn-ver-todos"
              onClick={() =>
                setMostrarTodosAlunos(
                  (valor) =>
                    !valor
                )
              }
            >
              {mostrarTodosAlunos
                ? "Mostrar menos ↑"
                : `Ver todos os ${alunos.length} alunos ↓`}
            </button>
          )}

      </div>

      {/* =====================================================
          MODAL / HISTÓRICO DO ALUNO
      ===================================================== */}

      {alunoSelecionado && (
        <div
          className="historico-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharHistorico();
            }
          }}
        >

          <div className="historico-modal">

            <div className="historico-modal-header">

              <div>
                <span>
                  Histórico do aluno
                </span>

                <h2>
                  {alunoSelecionado.nome}
                </h2>

                <p>
                  {alunoSelecionado.instrumento ||
                    "Sem instrumento"}
                </p>
              </div>

              <button
                type="button"
                className="historico-modal-fechar"
                onClick={
                  fecharHistorico
                }
                aria-label="Fechar histórico"
              >
                ×
              </button>

            </div>

            <div className="historico-resumo">

              <div>
                <strong>
                  {
                    alunoSelecionado.totalAulas
                  }
                </strong>

                <span>
                  aulas
                </span>
              </div>

              <div>
                <strong>
                  {
                    alunoSelecionado.presentes
                  }
                </strong>

                <span>
                  presentes
                </span>
              </div>

              <div>
                <strong>
                  {
                    alunoSelecionado.faltas
                  }
                </strong>

                <span>
                  faltas
                </span>
              </div>

              <div>
                <strong>
                  {
                    alunoSelecionado.pendentes
                  }
                </strong>

                <span>
                  pendentes
                </span>
              </div>

              <div className="destaque">
                <strong>
                  {
                    alunoSelecionado.frequencia
                  }%
                </strong>

                <span>
                  frequência
                </span>
              </div>

            </div>

            <div className="historico-modal-conteudo">

              <div className="historico-header">
                <strong>
                  Histórico de aulas
                </strong>
              </div>

              <div className="historico-tabela">

                <div className="historico-cabecalho">
                  <span>
                    Data
                  </span>

                  <span>
                    Horário
                  </span>

                  <span>
                    Instrumento
                  </span>

                  <span>
                    Status
                  </span>
                </div>

                {alunoSelecionado.aulas.map(
                  (aula) => (
                    <div
                      className="historico-linha"
                      key={
                        aula.id
                      }
                    >

                      <span>
                        {formatarData(
                          aula.data
                        )}
                      </span>

                      <span>
                        {aula.horario}
                      </span>

                      <span>
                        {aula.instrumento ||
                          "-"}
                      </span>

                      <span>

                        {aula.status ===
                        "presente" ? (
                          <b className="status presente">
                            Presente
                          </b>
                        ) : aula.status ===
                          "falta" ? (
                          <b className="status falta">
                            Falta
                          </b>
                        ) : (
                          <b className="status pendente">
                            Pendente
                          </b>
                        )}

                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          DETALHAMENTO DAS AULAS
      ===================================================== */}

      <div className="relatorio-secao">

        <div className="secao-header">
          <div>
            <h2>
              Detalhamento das aulas
            </h2>

            <p>
              Todas as aulas previstas
              no período selecionado.
            </p>
          </div>
        </div>

        {/* PESQUISA DE AULAS */}

        <div className="relatorio-pesquisa">
          <span>
            🔍
          </span>

          <input
            type="text"
            value={
              pesquisaAula
            }
            onChange={(event) =>
              setPesquisaAula(
                event.target.value
              )
            }
            placeholder="Pesquisar aluno nas aulas..."
          />
        </div>

        <div className="tabela-relatorio">

          <div className="tabela-cabecalho">

            <span>
              Aluno
            </span>

            <span>
              Data
            </span>

            <span>
              Horário
            </span>

            <span>
              Instrumento
            </span>

            <span>
              Status
            </span>

          </div>

          {aulasFiltradas.length ===
          0 ? (
            <div className="tabela-vazia">
              {pesquisaAula.trim()
                ? "Nenhuma aula encontrada para este aluno."
                : "Nenhuma aula encontrada."}
            </div>
          ) : (
            aulasFiltradas.map(
              (aula) => (
                <div
                  className="tabela-linha"
                  key={
                    aula.id
                  }
                >

                  <span>
                    <strong>
                      {aula.nome}
                    </strong>
                  </span>

                  <span>
                    {formatarData(
                      aula.data
                    )}
                  </span>

                  <span>
                    {aula.horario}
                  </span>

                  <span>
                    {aula.instrumento ||
                      "-"}
                  </span>

                  <span>

                    {aula.status ===
                    "presente" ? (
                      <b className="status presente">
                        Presente
                      </b>
                    ) : aula.status ===
                      "falta" ? (
                      <b className="status falta">
                        Falta
                      </b>
                    ) : (
                      <b className="status pendente">
                        Pendente
                      </b>
                    )}

                  </span>

                </div>
              )
            )
          )}

        </div>

        {/* VER TODAS */}

        {!pesquisaAula.trim() &&
          aulasDoMes.length > 10 && (
            <button
              type="button"
              className="btn-ver-todos"
              onClick={() =>
                setMostrarTodasAulas(
                  (valor) =>
                    !valor
                )
              }
            >
              {mostrarTodasAulas
                ? "Mostrar menos ↑"
                : `Ver todas as ${aulasDoMes.length} aulas ↓`}
            </button>
          )}

      </div>

    </div>
  );
}

export default Relatorio;