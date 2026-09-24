import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RelatorioAdmin.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function RelatorioAdmin() {
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);

  const [relatorioPresenca, setRelatorioPresenca] =
    useState(null);

  const [professorSelecionado, setProfessorSelecionado] =
    useState(null);

  const [alunoSelecionado, setAlunoSelecionado] =
    useState(null);

  // =====================================================
  // PÁGINA INTERNA DO RELATÓRIO
  // =====================================================

  const [paginaRelatorio, setPaginaRelatorio] =
    useState("principal");

  const [historicoMensal, setHistoricoMensal] =
    useState([]);

  const [carregandoHistorico, setCarregandoHistorico] =
    useState(false);

  const [erroHistorico, setErroHistorico] =
    useState("");

  const [carregando, setCarregando] = useState(true);

  const [carregandoPresenca, setCarregandoPresenca] =
    useState(true);

  const [erro, setErro] = useState("");

  const [erroPresenca, setErroPresenca] =
    useState("");

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const data = new Date();

    return new Date(
      data.getFullYear(),
      data.getMonth(),
      1
    );
  });

  const mesString = `${mesSelecionado.getFullYear()}-${String(
    mesSelecionado.getMonth() + 1
  ).padStart(2, "0")}`;

  const nomeMes =
    mesSelecionado.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

  // =====================================================
  // CARREGAR DADOS BÁSICOS
  // =====================================================

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        alunosResponse,
        professoresResponse
      ] = await Promise.all([
        fetch(`${API_URL}/alunos`, {
          credentials: "include"
        }),

        fetch(`${API_URL}/professores`, {
          credentials: "include"
        })
      ]);

      if (!alunosResponse.ok) {
        throw new Error(
          "Não foi possível carregar os alunos."
        );
      }

      if (!professoresResponse.ok) {
        throw new Error(
          "Não foi possível carregar os professores."
        );
      }

      const alunosData =
        await alunosResponse.json();

      const professoresData =
        await professoresResponse.json();

      setAlunos(
        Array.isArray(alunosData)
          ? alunosData
          : Array.isArray(alunosData?.alunos)
          ? alunosData.alunos
          : []
      );

      setProfessores(
        Array.isArray(professoresData)
          ? professoresData
          : Array.isArray(professoresData?.professores)
          ? professoresData.professores
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar relatório administrativo:",
        error
      );

      setErro(
        "Não foi possível carregar os dados do relatório."
      );
    } finally {
      setCarregando(false);
    }
  }

  // =====================================================
  // CARREGAR PRESENÇAS
  // =====================================================

  useEffect(() => {
    carregarRelatorioPresenca();
  }, [mesString]);

  async function carregarRelatorioPresenca() {
    try {
      setCarregandoPresenca(true);
      setErroPresenca("");

      setProfessorSelecionado(null);
      setAlunoSelecionado(null);

      const response = await fetch(
        `${API_URL}/presencas/relatorio-admin?mes=${mesString}`,
        {
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.mensagem ||
            "Não foi possível carregar o relatório de presença."
        );
      }

      setRelatorioPresenca(data);
    } catch (error) {
      console.error(
        "Erro ao carregar relatório de presença:",
        error
      );

      setErroPresenca(
        error.message ||
          "Não foi possível carregar os dados de presença."
      );

      setRelatorioPresenca(null);
    } finally {
      setCarregandoPresenca(false);
    }
  }

  // =====================================================
  // CARREGAR ANÁLISE HISTÓRICA
  // =====================================================

  useEffect(() => {
    if (paginaRelatorio === "historico") {
      carregarHistorico();
    }
  }, [paginaRelatorio]);

  function obterMesAnterior(data, quantidade) {
    return new Date(
      data.getFullYear(),
      data.getMonth() - quantidade,
      1
    );
  }

  function obterMesString(data) {
    return `${data.getFullYear()}-${String(
      data.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  function obterNomeMesCurto(data) {
    return data.toLocaleDateString("pt-BR", {
      month: "short"
    }).replace(".", "");
  }

  async function carregarHistorico() {
    try {
      setCarregandoHistorico(true);
      setErroHistorico("");

      const meses = Array.from(
        { length: 6 },
        (_, index) => {
          const data = obterMesAnterior(
            mesSelecionado,
            5 - index
          );

          return {
            data,
            mes: obterMesString(data),
            nome: obterNomeMesCurto(data)
          };
        }
      );

      const resultados = await Promise.all(
        meses.map(async (item) => {
          const response = await fetch(
            `${API_URL}/presencas/relatorio-admin?mes=${item.mes}`,
            {
              credentials: "include"
            }
          );

          if (!response.ok) {
            throw new Error(
              `Erro ao carregar ${item.mes}.`
            );
          }

          const data = await response.json();

          return {
            ...item,
            resumo: data?.resumo || {
              presentes: 0,
              faltas: 0,
              pendentes: 0,
              totalAulas: 0
            },
            professores:
              data?.professores || []
          };
        })
      );

      setHistoricoMensal(resultados);
    } catch (error) {
      console.error(
        "Erro ao carregar análise histórica:",
        error
      );

      setErroHistorico(
        error.message ||
          "Não foi possível carregar a análise histórica."
      );
    } finally {
      setCarregandoHistorico(false);
    }
  }

  // =====================================================
  // RESUMO DOS ALUNOS
  // =====================================================

  const resumo = useMemo(() => {
    const totalAlunos = alunos.length;

    const totalProfessores =
      professores.filter(
        (professor) =>
          professor.role === "professor"
      ).length;

    const alunosAtivos =
      alunos.filter(
        (aluno) =>
          !aluno.status ||
          String(aluno.status).toLowerCase() ===
            "ativo"
      ).length;

    const alunosInativos =
      totalAlunos - alunosAtivos;

    return {
      totalAlunos,
      totalProfessores,
      alunosAtivos,
      alunosInativos
    };
  }, [alunos, professores]);

  // =====================================================
  // ALUNOS POR INSTRUMENTO
  // =====================================================

  const alunosPorInstrumento = useMemo(() => {
    const mapa = {};

    alunos.forEach((aluno) => {
      let instrumento =
        aluno?.instrumento ??
        aluno?.instrumento_nome ??
        aluno?.nomeInstrumento ??
        "";

      if (
        typeof instrumento === "object" &&
        instrumento !== null
      ) {
        instrumento =
          instrumento.nome ||
          instrumento.label ||
          instrumento.instrumento ||
          "";
      }

      instrumento = String(instrumento).trim();

      if (!instrumento) {
        instrumento = "Não informado";
      }

      const chave =
        instrumento.toLocaleLowerCase("pt-BR");

      if (!mapa[chave]) {
        mapa[chave] = {
          instrumento,
          quantidade: 0
        };
      }

      mapa[chave].quantidade++;
    });

    return Object.values(mapa).sort(
      (a, b) =>
        b.quantidade - a.quantidade
    );
  }, [alunos]);

  // =====================================================
  // DADOS DE PRESENÇA
  // =====================================================

  const resumoPresenca =
    relatorioPresenca?.resumo || {
      presentes: 0,
      faltas: 0,
      pendentes: 0,
      totalAulas: 0
    };

  const professoresComPresenca =
    useMemo(() => {
      const lista =
        relatorioPresenca?.professores || [];

      return [...lista].sort((a, b) => {
        if (
          b.presentes !==
          a.presentes
        ) {
          return (
            b.presentes -
            a.presentes
          );
        }

        return String(
          a.professor?.nome || ""
        ).localeCompare(
          String(
            b.professor?.nome || ""
          )
        );
      });
    }, [relatorioPresenca]);

  // =====================================================
  // MAPA DE ALUNOS
  // =====================================================

  const alunosPorCodigo = useMemo(() => {
    const mapa = {};

    alunos.forEach((aluno) => {
      const codigo =
        aluno?.codigo_aluno ??
        aluno?.codigoAluno ??
        aluno?.codigo;

      if (codigo !== undefined && codigo !== null) {
        mapa[String(codigo).trim()] = aluno;
      }
    });

    return mapa;
  }, [alunos]);

  // =====================================================
  // IDENTIFICAR ALUNO DO REGISTRO
  // =====================================================

  function obterCodigoAluno(item) {
    if (!item) {
      return "";
    }

    if (item.codigo_aluno) {
      return String(item.codigo_aluno);
    }

    if (item.codigoAluno) {
      return String(item.codigoAluno);
    }

    if (item.aluno?.codigo_aluno) {
      return String(item.aluno.codigo_aluno);
    }

    const conteudo =
      String(item.conteudo || "");

    const encontrado =
      conteudo.match(/\b\d{4}\b/);

    return encontrado
      ? encontrado[0]
      : "";
  }

  function obterAlunoDoRegistro(item) {
    const codigo =
      obterCodigoAluno(item);

    if (codigo && alunosPorCodigo[codigo]) {
      return alunosPorCodigo[codigo];
    }

    const conteudo =
      String(item.conteudo || "")
        .toLowerCase();

    if (!conteudo) {
      return null;
    }

    return (
      alunos.find((aluno) => {
        const nome =
          String(aluno?.nome || "")
            .toLowerCase()
            .trim();

        return (
          nome &&
          conteudo.includes(nome)
        );
      }) || null
    );
  }

  // =====================================================
  // CONSOLIDAR ALUNOS DO PROFESSOR
  // =====================================================

  function obterAlunosConsolidados(professor) {
    const detalhes =
      professor?.detalhes || [];

    const mapa = {};

    detalhes.forEach((item) => {
      const aluno =
        obterAlunoDoRegistro(item);

      const codigo =
        obterCodigoAluno(item);

      const nome =
        aluno?.nome ||
        item?.aluno ||
        item?.nomeAluno ||
        "Aluno não identificado";

      const chave =
        codigo ||
        String(nome)
          .trim()
          .toLowerCase();

      if (!mapa[chave]) {
        mapa[chave] = {
          chave,
          codigo,
          nome,
          instrumento:
            aluno?.instrumento ||
            aluno?.instrumento_nome ||
            aluno?.nomeInstrumento ||
            "",
          presente: 0,
          falta: 0,
          pendente: 0,
          detalhes: []
        };
      }

      if (item.status === "presente") {
        mapa[chave].presente++;
      } else if (item.status === "falta") {
        mapa[chave].falta++;
      } else {
        mapa[chave].pendente++;
      }

      mapa[chave].detalhes.push(item);
    });

    return Object.values(mapa).sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    );
  }

  // =====================================================
  // PORCENTAGENS
  // =====================================================

  const percentualPresente =
    resumoPresenca.totalAulas > 0
      ? (
          (resumoPresenca.presentes /
            resumoPresenca.totalAulas) *
          100
        )
      : 0;

  const percentualFalta =
    resumoPresenca.totalAulas > 0
      ? (
          (resumoPresenca.faltas /
            resumoPresenca.totalAulas) *
          100
        )
      : 0;

  const percentualPendente =
    resumoPresenca.totalAulas > 0
      ? (
          (resumoPresenca.pendentes /
            resumoPresenca.totalAulas) *
          100
        )
      : 0;

  // =====================================================
  // MÊS
  // =====================================================

  function mudarMes(direcao) {
    setMesSelecionado(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() +
            direcao,
          1
        )
    );
  }

  // =====================================================
  // NAVEGAÇÃO DA ANÁLISE HISTÓRICA
  // =====================================================

  function abrirAnaliseHistorica() {
    setProfessorSelecionado(null);
    setAlunoSelecionado(null);
    setPaginaRelatorio("historico");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function voltarDoHistorico() {
    setPaginaRelatorio("principal");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =====================================================
  // PROFESSOR
  // =====================================================

  function selecionarProfessor(professor) {
    setProfessorSelecionado(
      professor
    );

    setAlunoSelecionado(null);
    setPaginaRelatorio("principal");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function voltarParaResumo() {
    setProfessorSelecionado(null);
    setAlunoSelecionado(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =====================================================
  // ALUNO
  // =====================================================

  function selecionarAluno(aluno) {
    setAlunoSelecionado(aluno);
  }

  function voltarParaAlunos() {
    setAlunoSelecionado(null);
  }

  // =====================================================
  // FORMATAÇÕES
  // =====================================================

  function formatarData(data) {
    if (!data) {
      return "-";
    }

    const [ano, mes, dia] =
      String(data)
        .slice(0, 10)
        .split("-");

    return `${dia}/${mes}`;
  }

  function nomeStatus(status) {
    if (status === "presente") {
      return "Presente";
    }

    if (status === "falta") {
      return "Falta";
    }

    return "Pendente";
  }

  function obterInstrumento(aluno) {
    let instrumento =
      aluno?.instrumento ??
      aluno?.instrumento_nome ??
      aluno?.nomeInstrumento ??
      "";

    if (
      typeof instrumento === "object" &&
      instrumento !== null
    ) {
      instrumento =
        instrumento.nome ||
        instrumento.label ||
        instrumento.instrumento ||
        "";
    }

    return (
      String(instrumento).trim() ||
      "Não informado"
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (carregando) {
    return (
      <div className="relatorio-admin">
        <div className="relatorio-admin-loading">
          Carregando relatório...
        </div>
      </div>
    );
  }

  // =====================================================
  // MINI PÁGINA — ANÁLISE HISTÓRICA
  // =====================================================

  if (paginaRelatorio === "historico") {
    const ultimoMes =
      historicoMensal[
        historicoMensal.length - 1
      ];

    const primeiroMes =
      historicoMensal[0];

    const totalHistorico =
      historicoMensal.reduce(
        (acumulado, item) => {
          return {
            presentes:
              acumulado.presentes +
              Number(
                item.resumo?.presentes || 0
              ),

            faltas:
              acumulado.faltas +
              Number(
                item.resumo?.faltas || 0
              ),

            pendentes:
              acumulado.pendentes +
              Number(
                item.resumo?.pendentes || 0
              ),

            totalAulas:
              acumulado.totalAulas +
              Number(
                item.resumo?.totalAulas || 0
              )
          };
        },
        {
          presentes: 0,
          faltas: 0,
          pendentes: 0,
          totalAulas: 0
        }
      );

    const percentualHistorico =
      totalHistorico.totalAulas > 0
        ? (
            (totalHistorico.presentes /
              totalHistorico.totalAulas) *
            100
          )
        : 0;

    const maiorMesPresencas =
      [...historicoMensal].sort(
        (a, b) =>
          Number(
            b.resumo?.presentes || 0
          ) -
          Number(
            a.resumo?.presentes || 0
          )
      )[0];

    return (
      <div className="relatorio-admin">
        <header className="relatorio-admin-header">
          <div>
            <button
              type="button"
              className="relatorio-admin-voltar"
              onClick={
                voltarDoHistorico
              }
            >
              ← Voltar para o relatório
            </button>

            <span className="relatorio-admin-label">
              Análise histórica
            </span>

            <h1>
              Histórico da escola
            </h1>

            <p>
              Acompanhe a evolução da
              frequência nos últimos meses.
            </p>
          </div>

          {paginaRelatorio === "principal" && (
  <div className="relatorio-admin-periodo">
            <button
              type="button"
              onClick={() =>
                mudarMes(-1)
              }
              aria-label="Mês anterior"
            >
              ‹
            </button>

            <span>{nomeMes}</span>

            <button
              type="button"
              onClick={() =>
                mudarMes(1)
              }
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div> 
        )}
        </header>

        {erroHistorico && (
          <div className="relatorio-admin-erro">
            {erroHistorico}
          </div>
        )}

        {carregandoHistorico ? (
          <div className="relatorio-admin-loading">
            Carregando análise histórica...
          </div>
        ) : (
          <>
            {/* =========================================
                RESUMO HISTÓRICO
            ========================================= */}

            <section className="relatorio-admin-resumo">
              <div className="relatorio-admin-card">
                <span>
                  Aulas no período
                </span>

                <strong>
                  {
                    totalHistorico.totalAulas
                  }
                </strong>

                <small>
                  Últimos 6 meses
                </small>
              </div>

              <div className="relatorio-admin-card">
                <span>
                  Presenças
                </span>

                <strong>
                  {
                    totalHistorico.presentes
                  }
                </strong>

                <small>
                  Registros de presença
                </small>
              </div>

              <div className="relatorio-admin-card">
                <span>
                  Faltas
                </span>

                <strong>
                  {
                    totalHistorico.faltas
                  }
                </strong>

                <small>
                  Registros de falta
                </small>
              </div>

              <div className="relatorio-admin-card">
                <span>
                  Frequência
                </span>

                <strong>
                  {percentualHistorico.toFixed(
                    0
                  )}
                  %
                </strong>

                <small>
                  Presença no período
                </small>
              </div>
            </section>

            {/* =========================================
                EVOLUÇÃO MENSAL
            ========================================= */}

            <section className="relatorio-admin-section">
              <div className="relatorio-admin-section-header">
                <div>
                  <span>
                    Evolução
                  </span>

                  <h2>
                    Frequência mês a mês
                  </h2>
                </div>

                <strong>
                  {primeiroMes?.mes} →{" "}
                  {ultimoMes?.mes}
                </strong>
              </div>

              {historicoMensal.length ===
              0 ? (
                <p className="relatorio-admin-vazio">
                  Nenhum histórico
                  encontrado.
                </p>
              ) : (
                <div className="relatorio-admin-historico-lista">
                  {historicoMensal.map(
                    (item) => {
                      const total =
                        Number(
                          item.resumo
                            ?.totalAulas ||
                            0
                        );

                      const presentes =
                        Number(
                          item.resumo
                            ?.presentes ||
                            0
                        );

                      const faltas =
                        Number(
                          item.resumo
                            ?.faltas ||
                            0
                        );

                      const pendentes =
                        Number(
                          item.resumo
                            ?.pendentes ||
                            0
                        );

                      const percentual =
                        total > 0
                          ? (presentes /
                              total) *
                            100
                          : 0;

                      return (
                        <div
                          className="relatorio-admin-historico-mes"
                          key={item.mes}
                        >
                          <div className="relatorio-admin-historico-mes-topo">
                            <strong>
                              {item.nome}
                            </strong>

                            <span>
                              {total} aulas
                            </span>
                          </div>

                          <div className="relatorio-admin-grafico">
                            <div
                              className="relatorio-admin-grafico-barra"
                              style={{
                                gridTemplateColumns: `
                                  ${presentes || 0}fr
                                  ${faltas || 0}fr
                                  ${pendentes || 0}fr
                                `
                              }}
                            >
                              {presentes >
                                0 && (
                                <div className="grafico-presente">
                                  {presentes}
                                </div>
                              )}

                              {faltas >
                                0 && (
                                <div className="grafico-falta">
                                  {faltas}
                                </div>
                              )}

                              {pendentes >
                                0 && (
                                <div className="grafico-pendente">
                                  {pendentes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relatorio-admin-historico-mes-info">
                            <span>
                              ✓{" "}
                              {presentes}
                            </span>

                            <span>
                              ×{" "}
                              {faltas}
                            </span>

                            <span>
                              ⏳{" "}
                              {pendentes}
                            </span>

                            <strong>
                              {percentual.toFixed(
                                0
                              )}
                              %
                            </strong>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            {/* =========================================
                DESTAQUE DO PERÍODO
            ========================================= */}

            <section className="relatorio-admin-section">
              <div className="relatorio-admin-section-header">
                <div>
                  <span>
                    Destaque
                  </span>

                  <h2>
                    Maior volume de presenças
                  </h2>
                </div>
              </div>

              {maiorMesPresencas ? (
                <div className="relatorio-admin-historico-destaque">
                  <div>
                    <span>
                      Mês com mais
                      presenças
                    </span>

                    <strong>
                      {
                        maiorMesPresencas.nome
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Presenças
                    </span>

                    <strong>
                      {
                        maiorMesPresencas
                          .resumo
                          ?.presentes || 0
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Faltas
                    </span>

                    <strong>
                      {
                        maiorMesPresencas
                          .resumo
                          ?.faltas || 0
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Aulas
                    </span>

                    <strong>
                      {
                        maiorMesPresencas
                          .resumo
                          ?.totalAulas || 0
                      }
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="relatorio-admin-vazio">
                  Nenhum dado disponível.
                </p>
              )}
            </section>

            {/* =========================================
                TABELA HISTÓRICA
            ========================================= */}

            <section className="relatorio-admin-section">
              <div className="relatorio-admin-section-header">
                <div>
                  <span>
                    Histórico
                  </span>

                  <h2>
                    Dados por mês
                  </h2>
                </div>
              </div>

              <div className="relatorio-admin-tabela-wrapper">
                <table className="relatorio-admin-tabela">
                  <thead>
                    <tr>
                      <th>
                        Mês
                      </th>

                      <th>
                        Aulas
                      </th>

                      <th>
                        Presentes
                      </th>

                      <th>
                        Faltas
                      </th>

                      <th>
                        Pendentes
                      </th>

                      <th>
                        Frequência
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {historicoMensal.map(
                      (item) => {
                        const total =
                          Number(
                            item.resumo
                              ?.totalAulas ||
                              0
                          );

                        const presentes =
                          Number(
                            item.resumo
                              ?.presentes ||
                              0
                          );

                        const percentual =
                          total > 0
                            ? (presentes /
                                total) *
                              100
                            : 0;

                        return (
                          <tr
                            key={
                              item.mes
                            }
                          >
                            <td>
                              <strong>
                                {
                                  item.mes
                                }
                              </strong>
                            </td>

                            <td>
                              {total}
                            </td>

                            <td>
                              <span className="relatorio-admin-status presente">
                                <i />
                                {
                                  presentes
                                }
                              </span>
                            </td>

                            <td>
                              <span className="relatorio-admin-status falta">
                                <i />
                                {
                                  item
                                    .resumo
                                    ?.faltas ||
                                  0
                                }
                              </span>
                            </td>

                            <td>
                              <span className="relatorio-admin-status pendente">
                                <i />
                                {
                                  item
                                    .resumo
                                    ?.pendentes ||
                                  0
                                }
                              </span>
                            </td>

                            <td>
                              <strong>
                                {percentual.toFixed(
                                  0
                                )}
                                %
                              </strong>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="relatorio-admin-footer">
          Análise histórica baseada nos
          últimos 6 meses.
        </footer>
      </div>
    );
  }

  // =====================================================
  // DETALHE DO ALUNO
  // =====================================================

  if (
    professorSelecionado &&
    alunoSelecionado
  ) {
    const professor =
      professorSelecionado.professor;

    const detalhes =
      alunoSelecionado.detalhes || [];

    return (
      <div className="relatorio-admin">
        <header className="relatorio-admin-header">
          <div>
            <button
              type="button"
              className="relatorio-admin-voltar"
              onClick={
                voltarParaAlunos
              }
            >
              ← Voltar para alunos
            </button>

            <span className="relatorio-admin-label">
              Aluno
            </span>

            <h1>
              {alunoSelecionado.nome}
            </h1>

            <p>
              {obterInstrumento(
                alunoSelecionado
              )}{" "}
              · {professor?.nome}
            </p>
          </div>

          <div className="relatorio-admin-periodo">
            <button
              type="button"
              onClick={() =>
                mudarMes(-1)
              }
              aria-label="Mês anterior"
            >
              ‹
            </button>

            <span>{nomeMes}</span>

            <button
              type="button"
              onClick={() =>
                mudarMes(1)
              }
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
        </header>

        <section className="relatorio-admin-professor-detalhe">
          <div className="relatorio-admin-detalhe-identidade">
            <div className="relatorio-admin-detalhe-avatar">
              {professor?.foto_url ? (
                <img
                  src={
                    professor.foto_url
                  }
                  alt={
                    professor.nome
                  }
                />
              ) : (
                professor?.nome
                  ?.charAt(0)
                  ?.toUpperCase()
              )}
            </div>

            <div>
              <strong>
                {alunoSelecionado.nome}
              </strong>

              <span>
                {obterInstrumento(
                  alunoSelecionado
                )}
              </span>
            </div>
          </div>

          <div className="relatorio-admin-detalhe-cards">
            <div className="relatorio-admin-detalhe-card">
              <span>Presentes</span>

              <strong className="presente">
                {
                  alunoSelecionado.presente
                }
              </strong>
            </div>

            <div className="relatorio-admin-detalhe-card">
              <span>Faltas</span>

              <strong className="falta">
                {
                  alunoSelecionado.falta
                }
              </strong>
            </div>

            <div className="relatorio-admin-detalhe-card">
              <span>Pendentes</span>

              <strong className="pendente">
                {
                  alunoSelecionado.pendente
                }
              </strong>
            </div>
          </div>
        </section>

        <section className="relatorio-admin-section">
          <div className="relatorio-admin-section-header">
            <div>
              <span>Histórico</span>

              <h2>
                Aulas de{" "}
                {alunoSelecionado.nome}
              </h2>
            </div>
          </div>

          {detalhes.length === 0 ? (
            <p className="relatorio-admin-vazio">
              Nenhuma aula encontrada
              para este período.
            </p>
          ) : (
            <div className="relatorio-admin-tabela-wrapper">
              <table className="relatorio-admin-tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {detalhes.map(
                    (item, index) => (
                      <tr
                        key={`${item.data}-${item.celula}-${index}`}
                      >
                        <td>
                          {formatarData(
                            item.data
                          )}
                        </td>

                        <td>
                          {item.horario ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={`relatorio-admin-status ${item.status}`}
                          >
                            <i />
                            {nomeStatus(
                              item.status
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="relatorio-admin-footer">
          Período selecionado:{" "}
          <strong>
            {mesString}
          </strong>
        </footer>
      </div>
    );
  }

  // =====================================================
  // DETALHE DO PROFESSOR
  // =====================================================

  if (professorSelecionado) {
    const professor =
      professorSelecionado.professor;

    const total =
      professorSelecionado.totalAulas ||
      0;

    const percentual =
      total > 0
        ? (
            (professorSelecionado.presentes /
              total) *
            100
          )
        : 0;

    const alunosConsolidados =
      obterAlunosConsolidados(
        professorSelecionado
      );

    return (
      <div className="relatorio-admin">
        <header className="relatorio-admin-header">
          <div>
            <button
              type="button"
              className="relatorio-admin-voltar"
              onClick={
                voltarParaResumo
              }
            >
              ← Voltar para o relatório
            </button>

            <span className="relatorio-admin-label">
              Relatório do professor
            </span>

            <h1>
              {professor?.nome ||
                "Professor"}
            </h1>

            <p>
              Acompanhamento de presença
              no mês de {nomeMes}.
            </p>
          </div>

          <div className="relatorio-admin-periodo">
            <button
              type="button"
              onClick={() =>
                mudarMes(-1)
              }
              aria-label="Mês anterior"
            >
              ‹
            </button>

            <span>{nomeMes}</span>

            <button
              type="button"
              onClick={() =>
                mudarMes(1)
              }
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
        </header>

        <section className="relatorio-admin-professor-detalhe">
          <div className="relatorio-admin-detalhe-identidade">
            <div className="relatorio-admin-detalhe-avatar">
              {professor?.foto_url ? (
                <img
                  src={
                    professor.foto_url
                  }
                  alt={
                    professor.nome
                  }
                />
              ) : (
                professor?.nome
                  ?.charAt(0)
                  ?.toUpperCase()
              )}
            </div>

            <div>
              <strong>
                {professor?.nome}
              </strong>

              <span>
                {
                  professorSelecionado.totalAlunos
                }{" "}
                alunos
              </span>
            </div>
          </div>

          <div className="relatorio-admin-detalhe-cards">
            <div className="relatorio-admin-detalhe-card">
              <span>Presentes</span>

              <strong className="presente">
                {
                  professorSelecionado.presentes
                }
              </strong>
            </div>

            <div className="relatorio-admin-detalhe-card">
              <span>Faltas</span>

              <strong className="falta">
                {
                  professorSelecionado.faltas
                }
              </strong>
            </div>

            <div className="relatorio-admin-detalhe-card">
              <span>Pendentes</span>

              <strong className="pendente">
                {
                  professorSelecionado.pendentes
                }
              </strong>
            </div>
          </div>
        </section>

        <section className="relatorio-admin-section">
          <div className="relatorio-admin-section-header">
            <div>
              <span>Frequência</span>

              <h2>
                Presença de{" "}
                {professor?.nome}
              </h2>
            </div>

            <strong className="relatorio-admin-percentual">
              {percentual.toFixed(0)}%
              presentes
            </strong>
          </div>

          <div className="relatorio-admin-grafico">
            <div
              className="relatorio-admin-grafico-barra"
              style={{
                gridTemplateColumns: `
                  ${professorSelecionado.presentes || 0}fr
                  ${professorSelecionado.faltas || 0}fr
                  ${professorSelecionado.pendentes || 0}fr
                `
              }}
            >
              {professorSelecionado.presentes >
                0 && (
                <div className="grafico-presente">
                  {
                    professorSelecionado.presentes
                  }
                </div>
              )}

              {professorSelecionado.faltas >
                0 && (
                <div className="grafico-falta">
                  {
                    professorSelecionado.faltas
                  }
                </div>
              )}

              {professorSelecionado.pendentes >
                0 && (
                <div className="grafico-pendente">
                  {
                    professorSelecionado.pendentes
                  }
                </div>
              )}
            </div>

            <div className="relatorio-admin-legenda">
              <span>
                <i className="legenda-presente" />
                Presentes
              </span>

              <span>
                <i className="legenda-falta" />
                Faltas
              </span>

              <span>
                <i className="legenda-pendente" />
                Pendentes
              </span>
            </div>
          </div>
        </section>

        <section className="relatorio-admin-section">
          <div className="relatorio-admin-section-header">
            <div>
              <span>Alunos</span>

              <h2>
                Alunos de{" "}
                {professor?.nome}
              </h2>
            </div>

            <strong>
              {alunosConsolidados.length} alunos
            </strong>
          </div>

          {alunosConsolidados.length ===
          0 ? (
            <p className="relatorio-admin-vazio">
              Nenhum aluno encontrado
              neste período.
            </p>
          ) : (
            <div className="relatorio-admin-alunos-consolidados">
              {alunosConsolidados.map(
                (aluno) => (
                  <button
                    type="button"
                    className="relatorio-admin-aluno"
                    key={aluno.chave}
                    onClick={() =>
                      selecionarAluno(
                        aluno
                      )
                    }
                  >
                    <div className="relatorio-admin-aluno-avatar">
                      {aluno.nome
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="relatorio-admin-aluno-info">
                      <strong>
                        {aluno.nome}
                      </strong>

                      <span>
                        {obterInstrumento(
                          aluno
                        )}
                        {aluno.codigo
                          ? ` · ${aluno.codigo}`
                          : ""}
                      </span>
                    </div>

                    <div className="relatorio-admin-aluno-status">
                      <span className="presente">
                        ✓{" "}
                        {aluno.presente}
                      </span>

                      <span className="falta">
                        × {aluno.falta}
                      </span>

                      <span className="pendente">
                        ⏳{" "}
                        {aluno.pendente}
                      </span>
                    </div>

                    <span className="relatorio-admin-aluno-seta">
                      →
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </section>

        <footer className="relatorio-admin-footer">
          Período selecionado:{" "}
          <strong>
            {mesString}
          </strong>
        </footer>
      </div>
    );
  }

  // =====================================================
  // VISÃO GERAL
  // =====================================================

  return (
    <div className="relatorio-admin">
      <header className="relatorio-admin-header">
        <div>
          <span className="relatorio-admin-label">
            Administração
          </span>

          <h1>Relatório da Escola</h1>

          <p>
            Acompanhe alunos, professores e
            a frequência da escola.
          </p>
        </div>

        <div className="relatorio-admin-periodo">
          <button
            type="button"
            onClick={() =>
              mudarMes(-1)
            }
            aria-label="Mês anterior"
          >
            ‹
          </button>

          <span>{nomeMes}</span>

          <button
            type="button"
            onClick={() =>
              mudarMes(1)
            }
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
      </header>

      {erro && (
        <div className="relatorio-admin-erro">
          {erro}
        </div>
      )}

      {erroPresenca && (
        <div className="relatorio-admin-erro">
          {erroPresenca}
        </div>
      )}

      {/* =================================================
          RESUMO
      ================================================= */}

      <section className="relatorio-admin-resumo">
        <div className="relatorio-admin-card">
          <span>Total de alunos</span>

          <strong>
            {resumo.totalAlunos}
          </strong>

          <small>
            Cadastros atuais
          </small>
        </div>

        <div className="relatorio-admin-card">
          <span>Alunos ativos</span>

          <strong>
            {resumo.alunosAtivos}
          </strong>

          <small>
            Alunos em atividade
          </small>
        </div>

        <div className="relatorio-admin-card">
          <span>Professores</span>

          <strong>
            {resumo.totalProfessores}
          </strong>

          <small>
            Professores cadastrados
          </small>
        </div>

        <div className="relatorio-admin-card">
          <span>Presenças</span>

          <strong>
            {resumoPresenca.presentes}
          </strong>

          <small>
            No período selecionado
          </small>
        </div>

        <div className="relatorio-admin-card">
          <span>Faltas</span>

          <strong>
            {resumoPresenca.faltas}
          </strong>

          <small>
            No período selecionado
          </small>
        </div>

        <div className="relatorio-admin-card">
          <span>Pendentes</span>

          <strong>
            {resumoPresenca.pendentes}
          </strong>

          <small>
            Ainda sem registro
          </small>
        </div>
      </section>

      {/* =================================================
          FREQUÊNCIA GERAL
      ================================================= */}

      <section className="relatorio-admin-section">
        <div className="relatorio-admin-section-header">
          <div>
            <span>Frequência</span>

            <h2>
              Presença da escola
            </h2>
          </div>

          {carregandoPresenca ? (
            <span className="relatorio-admin-mini-loading">
              Atualizando...
            </span>
          ) : (
            <strong className="relatorio-admin-percentual">
              {percentualPresente.toFixed(
                0
              )}
              % presentes
            </strong>
          )}
        </div>

        <div className="relatorio-admin-grafico">
          <div
            className="relatorio-admin-grafico-barra"
            style={{
              gridTemplateColumns: `
                ${resumoPresenca.presentes || 0}fr
                ${resumoPresenca.faltas || 0}fr
                ${resumoPresenca.pendentes || 0}fr
              `
            }}
          >
            {resumoPresenca.presentes >
              0 && (
              <div className="grafico-presente">
                {resumoPresenca.presentes}
              </div>
            )}

            {resumoPresenca.faltas >
              0 && (
              <div className="grafico-falta">
                {resumoPresenca.faltas}
              </div>
            )}

            {resumoPresenca.pendentes >
              0 && (
              <div className="grafico-pendente">
                {resumoPresenca.pendentes}
              </div>
            )}
          </div>

          <div className="relatorio-admin-grafico-info">
            <span>
              Total de aulas:{" "}
              <strong>
                {resumoPresenca.totalAulas}
              </strong>
            </span>

            <span>
              Presente:{" "}
              <strong>
                {percentualPresente.toFixed(
                  1
                )}
                %
              </strong>
            </span>

            <span>
              Falta:{" "}
              <strong>
                {percentualFalta.toFixed(
                  1
                )}
                %
              </strong>
            </span>

            <span>
              Pendente:{" "}
              <strong>
                {percentualPendente.toFixed(
                  1
                )}
                %
              </strong>
            </span>
          </div>

          <div className="relatorio-admin-legenda">
            <span>
              <i className="legenda-presente" />
              Presentes
            </span>

            <span>
              <i className="legenda-falta" />
              Faltas
            </span>

            <span>
              <i className="legenda-pendente" />
              Pendentes
            </span>
          </div>
        </div>
      </section>

      {/* =================================================
          PROFESSORES
      ================================================= */}

      <section className="relatorio-admin-section">
        <div className="relatorio-admin-section-header">
          <div>
            <span>Equipe</span>

            <h2>
              Frequência por professor
            </h2>
          </div>
        </div>

        <div className="relatorio-admin-professores">
          {professoresComPresenca.length ===
          0 ? (
            <p className="relatorio-admin-vazio">
              Nenhum professor encontrado.
            </p>
          ) : (
            professoresComPresenca.map(
              (item) => (
                <button
                  type="button"
                  className="relatorio-admin-professor"
                  key={
                    item.professor.id
                  }
                  onClick={() =>
                    selecionarProfessor(
                      item
                    )
                  }
                >
                  <div className="relatorio-admin-professor-avatar">
                    {item.professor
                      .foto_url ? (
                      <img
                        src={
                          item
                            .professor
                            .foto_url
                        }
                        alt={
                          item.professor
                            .nome
                        }
                      />
                    ) : (
                      item.professor
                        .nome
                        ?.charAt(0)
                        ?.toUpperCase()
                    )}
                  </div>

                  <div className="relatorio-admin-professor-info">
                    <strong>
                      {
                        item.professor
                          .nome
                      }
                    </strong>

                    <span>
                      {
                        item.totalAlunos
                      }{" "}
                      alunos
                    </span>
                  </div>

                  <div className="relatorio-admin-professor-frequencia">
                    <span className="presente">
                      ✓{" "}
                      {item.presentes}
                    </span>

                    <span className="falta">
                      × {item.faltas}
                    </span>

                    <span className="pendente">
                      ⏳{" "}
                      {item.pendentes}
                    </span>
                  </div>

                  <div className="relatorio-admin-professor-total">
                    <strong>
                      {
                        item.totalAulas
                      }
                    </strong>

                    <span>
                      aulas
                    </span>
                  </div>
                </button>
              )
            )
          )}
        </div>
      </section>

      {/* =================================================
          INSTRUMENTOS
      ================================================= */}

      <section className="relatorio-admin-section">
        <div className="relatorio-admin-section-header">
          <div>
            <span>
              Distribuição
            </span>

            <h2>
              Alunos por instrumento
            </h2>
          </div>
        </div>

        <div className="relatorio-admin-instrumentos">
          {alunosPorInstrumento.length ===
          0 ? (
            <p className="relatorio-admin-vazio">
              Nenhum aluno encontrado.
            </p>
          ) : (
            alunosPorInstrumento.map(
              (item) => (
                <div
                  className="relatorio-admin-instrumento"
                  key={
                    item.instrumento
                  }
                >
                  <div className="relatorio-admin-instrumento-topo">
                    <span>
                      {
                        item.instrumento
                      }
                    </span>

                    <strong>
                      {
                        item.quantidade
                      }
                    </strong>
                  </div>

                  <div className="relatorio-admin-barra">
                    <div
                      style={{
                        width: `${
                          resumo.totalAlunos >
                          0
                            ? (item.quantidade /
                                resumo.totalAlunos) *
                              100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              )
            )
          )}
        </div>
      </section>

      {/* =================================================
          HISTÓRICO
      ================================================= */}

      <section
        className="relatorio-admin-section relatorio-admin-futuro"
        onClick={
          abrirAnaliseHistorica
        }
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            abrirAnaliseHistorica();
          }
        }}
      >
        <div className="relatorio-admin-section-header">
          <div>
            <span>
              Análise histórica
            </span>

            <h2>
              Movimentação dos alunos
            </h2>
          </div>

          <span className="relatorio-admin-historico-link">
            Ver análise →
          </span>
        </div>

        <div className="relatorio-admin-placeholder">
          <div className="relatorio-admin-placeholder-icon">
            ↗
          </div>

          <div>
            <strong>
              Histórico de frequência
              da escola
            </strong>

            <p>
              Consulte a evolução de
              presenças, faltas e pendências
              dos últimos meses.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          IA
      ================================================= */}

      <section className="relatorio-admin-section relatorio-admin-futuro">
        <div className="relatorio-admin-section-header">
          <div>
            <span>
              Inteligência
            </span>

            <h2>
              Análise com IA
            </h2>
          </div>
        </div>

        <div className="relatorio-admin-placeholder">
          <div className="relatorio-admin-placeholder-icon">
            ✦
          </div>

          <div>
            <strong>
              Interpretação automática
              dos resultados
            </strong>

            <p>
              A IA poderá interpretar as
              movimentações da escola,
              identificar padrões e destacar
              alterações relevantes.
            </p>
          </div>
        </div>
      </section>

      <footer className="relatorio-admin-footer">
        Período selecionado:{" "}
        <strong>
          {mesString}
        </strong>
      </footer>
    </div>
  );
}

export default RelatorioAdmin;