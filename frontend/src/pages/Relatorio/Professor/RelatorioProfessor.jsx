import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { nomesInstrumentos } from "../../Alunos/utils/instrumentos";

import "./RelatorioProfessor.css";

const API_URL = import.meta.env.VITE_API_URL;
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

  const instrumentoEspecifico =
    item.instrumento_especifico ??
    item.instrumentoEspecifico ?? 
    item.aluno?.instrumento_especifico ??
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

    instrumentoEspecifico:
      String(
        instrumentoEspecifico
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

          const ehExperimental =
            horario.tipo ===
            "experimental";

          const diaSemana =
            normalizarDiaSemana(
              horario.diaSemana
            );

          /*
           * AULA EXPERIMENTAL
           * -----------------
           * A AE acontece somente na
           * data definida em dataExperimental.
           */
          if (ehExperimental) {
            if (
              !horario.dataExperimental
            ) {
              return;
            }

            const partesData =
              String(
                horario.dataExperimental
              ).split("/");

            if (
              partesData.length !== 2
            ) {
              return;
            }

            const diaExperimental =
              String(
                partesData[0]
              ).padStart(2, "0");

            const mesExperimental =
              String(
                partesData[1]
              ).padStart(2, "0");

            const dataExperimentalISO =
              `${ano}-${mesExperimental}-${diaExperimental}`;

            diasDoMes.forEach(
              (dia) => {
                if (
                  dia.dataString !==
                  dataExperimentalISO
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

                  instrumentoEspecifico:
                    horario.instrumentoEspecifico,

                  codigoAluno:
                    horario.codigoAluno,

                  foto:
                    horario.foto,

                  tipo:
                    horario.tipo,

                  dataExperimental:
                    horario.dataExperimental,

                  status:
                    presenca?.status ||
                    "pendente",
                });
              }
            );

            return;
          }

          /*
           * AULA NORMAL
           * -----------
           * Continua funcionando como aula
           * recorrente pelo dia da semana.
           */
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

                instrumentoEspecifico:
                  horario.instrumentoEspecifico,

                codigoAluno:
                  horario.codigoAluno,

                foto:
                  horario.foto,

                tipo:
                  horario.tipo,

                dataExperimental:
                  horario.dataExperimental,

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

                instrumentoEspecifico:
                  aula.instrumentoEspecifico,

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
   PDF
===================================================== */

const obterNomeInstrumento = (
  instrumento,
  instrumentoEspecifico
) => {
  const especifico =
    instrumentoEspecifico
      ?.toString()
      .trim()
      .toLowerCase();

  const nomesEspecificos = {
    guitarra: "Guitarra",
    violao: "Violão",
    ukulele: "Ukulele",
    contrabaixo: "Contrabaixo",
    teclado: "Teclado",
    piano: "Piano",
    violino: "Violino",
    bateria: "Bateria",
    canto: "Canto",
  };

  if (
    especifico &&
    nomesEspecificos[especifico]
  ) {
    return nomesEspecificos[
      especifico
    ];
  }

  if (!instrumento) {
    return "Não informado";
  }

  const chave = instrumento
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    chave ===
      "guitarra/violao/ukulele/contrabaixo" ||
    chave ===
      "guitarra/violao"
  ) {
    return "Guitarra, Violão, Ukulele ou Contrabaixo";
  }

  if (
    chave ===
      "teclado/piano"
  ) {
    return "Teclado ou Piano";
  }

  return (
    nomesInstrumentos[chave] ||
    instrumento ||
    "Não informado"
  );
};

const obterNomeMesPDF = () => {
  return mesSelecionado.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

const gerarRelatorioPDF = () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();

  const margem = 15;

  /* =================================================
     CORES
  ================================================= */

  const preto = [25, 25, 25];
  const cinza = [105, 105, 105];

  const verde = [22, 128, 58];
  const vermelho = [199, 53, 53];
  const amarelo = [167, 119, 0];

  /* =================================================
     DADOS
  ================================================= */

  const alunosPDF = [...alunos]
    .filter(
      (aluno) =>
        !aluno.aulas?.some(
          (aula) =>
            aula.tipo === "experimental"
        )
    )
    .sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    );

  const totalAulasExperimentais =
    aulasDoMes.filter(
      (aula) =>
        aula.tipo === "experimental"
    ).length;

  /* =================================================
     CABEÇALHO
  ================================================= */

  doc.setFillColor(...preto);

  doc.rect(
    0,
    0,
    larguraPagina,
    32,
    "F"
  );

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.text(
    "SOM RENOVO",
    margem,
    13
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.text(
    "ESCOLA DE MÚSICA",
    margem,
    19
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.text(
    "RELATÓRIO DE FREQUÊNCIA",
    larguraPagina - margem,
    13,
    {
      align: "right",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.text(
    obterNomeMesPDF(),
    larguraPagina - margem,
    19,
    {
      align: "right",
    }
  );

  /* =================================================
     PROFESSOR
  ================================================= */

  let y = 43;

  doc.setTextColor(...cinza);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  doc.text(
    "PROFESSOR",
    margem,
    y
  );

  doc.setTextColor(...preto);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(12);

  doc.text(
    professor?.nome ||
      professor?.name ||
      "Professor",
    margem,
    y + 6
  );

  /* =================================================
     RESUMO
  ================================================= */

  y += 17;

  const cards = [
    {
      titulo: "AULAS PREVISTAS",
      valor: resumo.totalAulas,
    },
    {
      titulo: "PRESENÇAS",
      valor: resumo.presentes,
    },
    {
      titulo: "FALTAS",
      valor: resumo.faltas,
    },
    {
      titulo: "PENDENTES",
      valor: resumo.pendentes,
    },
    {
      titulo: "FREQUÊNCIA",
      valor: `${resumo.frequencia}%`,
    },
    {
      titulo: "AULAS EXPERIMENTAIS",
      valor: totalAulasExperimentais,
    },
  ];

  const espacamento = 4;

  const larguraCard =
    (
      larguraPagina -
      margem * 2 -
      espacamento * 2
    ) / 3;

  const alturaCard = 24;

  cards.forEach(
    (card, index) => {
      const coluna =
        index % 3;

      const linha =
        Math.floor(index / 3);

      const x =
        margem +
        coluna *
          (
            larguraCard +
            espacamento
          );

      const cardY =
        y +
        linha *
          (
            alturaCard +
            espacamento
          );

      doc.setFillColor(
        248,
        248,
        248
      );

      doc.roundedRect(
        x,
        cardY,
        larguraCard,
        alturaCard,
        2,
        2,
        "F"
      );

      doc.setTextColor(...cinza);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(6.5);

      doc.text(
        card.titulo,
        x + 4,
        cardY + 7
      );

      doc.setTextColor(...preto);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(14);

      doc.text(
        String(card.valor),
        x + 4,
        cardY + 17
      );
    }
  );

  /* =================================================
     GRÁFICOS
  ================================================= */

  y +=
    alturaCard * 2 +
    espacamento +
    14;

  doc.setTextColor(...preto);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(13);

  doc.text(
    "Visão geral da frequência",
    margem,
    y
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.setTextColor(...cinza);

  doc.text(
    "Distribuição das presenças e faltas no período.",
    margem,
    y + 5
  );

  /* =================================================
     GRÁFICO 1 — PRESENÇAS X FALTAS
  ================================================= */

  const graficoY =
    y + 12;

  const graficoAltura = 55;

  const graficoLargura =
    (
      larguraPagina -
      margem * 2 -
      8
    ) / 2;

  const grafico1X =
    margem;

  doc.setFillColor(
    248,
    248,
    248
  );

  doc.roundedRect(
    grafico1X,
    graficoY,
    graficoLargura,
    graficoAltura,
    2,
    2,
    "F"
  );

  doc.setTextColor(...preto);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.text(
    "Presenças × Faltas",
    grafico1X + 5,
    graficoY + 8
  );

  const maiorValor =
    Math.max(
      resumo.presentes || 0,
      resumo.faltas || 0,
      1
    );

  const areaGraficoX =
    grafico1X + 12;

  const areaGraficoY =
    graficoY + 16;

  const areaGraficoLargura =
    graficoLargura - 20;

  const areaGraficoAltura = 29;

  doc.setDrawColor(
    210,
    210,
    210
  );

  doc.setLineWidth(0.3);

  doc.line(
    areaGraficoX,
    areaGraficoY +
      areaGraficoAltura,
    areaGraficoX +
      areaGraficoLargura,
    areaGraficoY +
      areaGraficoAltura
  );

  const barras = [
    {
      nome: "Presenças",
      valor:
        resumo.presentes || 0,
      cor: verde,
    },
    {
      nome: "Faltas",
      valor:
        resumo.faltas || 0,
      cor: vermelho,
    },
  ];

  const larguraBarra = 18;

  barras.forEach(
    (barra, index) => {
      const alturaBarra =
        maiorValor > 0
          ? (
              barra.valor /
              maiorValor
            ) *
            areaGraficoAltura
          : 0;

      const x =
        areaGraficoX +
        18 +
        index * 48;

      const yBarra =
        areaGraficoY +
        areaGraficoAltura -
        alturaBarra;

      doc.setFillColor(
        ...barra.cor
      );

      doc.roundedRect(
        x,
        yBarra,
        larguraBarra,
        alturaBarra,
        1,
        1,
        "F"
      );

      doc.setTextColor(...preto);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(8);

      doc.text(
        String(barra.valor),
        x +
          larguraBarra / 2,
        yBarra - 2,
        {
          align: "center",
        }
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(6.5);

      doc.text(
        barra.nome,
        x +
          larguraBarra / 2,
        areaGraficoY +
          areaGraficoAltura +
          7,
        {
          align: "center",
        }
      );
    }
  );

  /* =================================================
     GRÁFICO 2 — FREQUÊNCIA POR ALUNO
  ================================================= */

  const grafico2X =
    margem +
    graficoLargura +
    8;

  doc.setFillColor(
    248,
    248,
    248
  );

  doc.roundedRect(
    grafico2X,
    graficoY,
    graficoLargura,
    graficoAltura,
    2,
    2,
    "F"
  );

  doc.setTextColor(...preto);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.text(
    "Frequência no mês",
    grafico2X + 5,
    graficoY + 8
  );

  const alunosGrafico =
    [...alunosPDF]
      .sort(
        (a, b) =>
          b.frequencia -
          a.frequencia
      )
      .slice(0, 5);

  const inicioGraficoAlunoY =
    graficoY + 15;

  const larguraBarraAluno =
    graficoLargura - 42;

  alunosGrafico.forEach(
    (aluno, index) => {
      const linhaY =
        inicioGraficoAlunoY +
        index * 7;

      const percentual =
        Math.max(
          0,
          Math.min(
            100,
            Number(
              aluno.frequencia
            ) || 0
          )
        );

      const nome =
        aluno.nome.length > 13
          ? `${aluno.nome.substring(
              0,
              13
            )}...`
          : aluno.nome;

      doc.setTextColor(...cinza);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(5.8);

      doc.text(
        nome,
        grafico2X + 5,
        linhaY + 3
      );

      const barraX =
        grafico2X + 39;

      const barraY =
        linhaY;

      doc.setFillColor(
        225,
        225,
        225
      );

      doc.roundedRect(
        barraX,
        barraY,
        larguraBarraAluno,
        4,
        1,
        1,
        "F"
      );

      doc.setFillColor(...verde);

      doc.roundedRect(
        barraX,
        barraY,
        (
          larguraBarraAluno *
          percentual
        ) / 100,
        4,
        1,
        1,
        "F"
      );

      doc.setTextColor(...preto);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(5.8);

      doc.text(
        `${percentual}%`,
        grafico2X +
          graficoLargura -
          5,
        linhaY + 3,
        {
          align: "right",
        }
      );
    }
  );

  if (
    alunosGrafico.length === 0
  ) {
    doc.setTextColor(...cinza);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.text(
      "Nenhum aluno no período.",
      grafico2X + 5,
      graficoY + 28
    );
  }

  /* =================================================
     FREQUÊNCIA POR ALUNO
  ================================================= */

  y =
    graficoY +
    graficoAltura +
    14;

  doc.setTextColor(...preto);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(13);

  doc.text(
    "Frequência por aluno",
    margem,
    y
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.setTextColor(...cinza);

  doc.text(
    "Resumo individual das aulas no período.",
    margem,
    y + 5
  );

  y += 10;

  autoTable(
    doc,
    {
      startY: y,

      margin: {
        left: margem,
        right: margem,
        bottom: 18,
      },

      head: [
        [
          "Aluno",
          "Instrumento",
          "Aulas",
          "Presenças",
          "Faltas",
          "Pendentes",
          "Frequência",
        ],
      ],

      body:
        alunosPDF.map(
          (aluno) => [
            aluno.nome,
            obterNomeInstrumento(
              aluno.instrumento,
              aluno.instrumentoEspecifico
            ),
            aluno.totalAulas,
            aluno.presentes,
            aluno.faltas,
            aluno.pendentes,
            `${aluno.frequencia}%`,
          ]
        ),

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        textColor: preto,
        lineColor: [
          225,
          225,
          225,
        ],
        lineWidth: 0.2,
      },

      headStyles: {
        fillColor: preto,
        textColor: [
          255,
          255,
          255,
        ],
        fontStyle: "bold",
        fontSize: 7.5,
      },

      alternateRowStyles: {
        fillColor: [
          250,
          250,
          250,
        ],
      },

      columnStyles: {
        0: {
          cellWidth: 48,
        },

        1: {
          cellWidth: 30,
        },

        2: {
          halign: "center",
          cellWidth: 18,
        },

        3: {
          halign: "center",
          cellWidth: 20,
        },

        4: {
          halign: "center",
          cellWidth: 18,
        },

        5: {
          halign: "center",
          cellWidth: 22,
        },

        6: {
          halign: "center",
          cellWidth: 23,
          fontStyle: "bold",
        },
      },

      didParseCell: (data) => {
        if (
          data.section ===
            "body" &&
          data.column.index ===
            6
        ) {
          const valor =
            Number(
              String(
                data.cell.text?.[0] ||
                  ""
              ).replace(
                "%",
                ""
              )
            );

          if (
            valor >= 75
          ) {
            data.cell.styles.textColor =
              verde;
          } else if (
            valor < 50
          ) {
            data.cell.styles.textColor =
              vermelho;
          } else {
            data.cell.styles.textColor =
              amarelo;
          }
        }
      },
    }
  );

  /* =================================================
     RODAPÉ EM TODAS AS PÁGINAS
  ================================================= */

  const quantidadePaginas =
    doc.internal.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <=
    quantidadePaginas;
    pagina++
  ) {
    doc.setPage(
      pagina
    );

    doc.setDrawColor(
      225,
      225,
      225
    );

    doc.line(
      margem,
      alturaPagina - 13,
      larguraPagina -
        margem,
      alturaPagina - 13
    );

    doc.setTextColor(...cinza);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.text(
      `Som Renovo Escola de Música • ${obterNomeMesPDF()}`,
      margem,
      alturaPagina - 7
    );

    doc.text(
      `Página ${pagina} de ${quantidadePaginas}`,
      larguraPagina -
        margem,
      alturaPagina - 7,
      {
        align: "right",
      }
    );
  }

  /* =================================================
     DOWNLOAD
  ================================================= */

  doc.save(
    `relatorio-frequencia-${mesString}.pdf`
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
            gerarRelatorioPDF
          }
        >
          📄 Exportar PDF
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
                        {obterNomeInstrumento(
                          aluno.instrumento,
                          aluno.instrumentoEspecifico
                        )}
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
                  {obterNomeInstrumento(
                    alunoSelecionado.instrumento,
                    alunoSelecionado.instrumentoEspecifico
                  )}
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
                        {obterNomeInstrumento(
                          aula.instrumento,
                          aula.instrumentoEspecifico
                        )}
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
                    {obterNomeInstrumento(
                      aula.instrumento,
                      aula.instrumentoEspecifico
                    )}
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