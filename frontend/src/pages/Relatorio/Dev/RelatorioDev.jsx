import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./RelatorioDev.css";

const API_URL = import.meta.env.VITE_API_URL;

const INTERVALO_MONITORAMENTO = 5000;
const MAX_HISTORICO_LATENCIA = 30;

function RelatorioDev() {
  const [health, setHealth] = useState(null);
  const [latencias, setLatencias] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState("");

  const verificarSaude = useCallback(async () => {
    const inicio = performance.now();

    try {
      setVerificando(true);

      const response = await fetch(`${API_URL}/health`, {
        credentials: "include",
        cache: "no-store",
      });

      const fim = performance.now();
      const latencia = Math.round(fim - inicio);

      const data = await response.json();

      const registro = {
        valor: latencia,
        horario: new Date(),
      };

      setLatencias((atual) => {
        const novoHistorico = [...atual, registro];

        return novoHistorico.slice(
          -MAX_HISTORICO_LATENCIA
        );
      });

      setHealth({
        ...data,
        clientResponseTime: latencia,
        verificadoEm: new Date(),
      });

      if (!response.ok) {
        setErro(
          data?.status === "error"
            ? "A API respondeu, mas encontrou um problema."
            : `API respondeu com status ${response.status}.`
        );
      } else {
        setErro("");
      }
    } catch (error) {
      console.error("Erro no monitoramento da API:", error);

      const fim = performance.now();
      const latencia = Math.round(fim - inicio);

      setLatencias((atual) => {
        const novoHistorico = [
          ...atual,
          {
            valor: latencia,
            horario: new Date(),
            erro: true,
          },
        ];

        return novoHistorico.slice(
          -MAX_HISTORICO_LATENCIA
        );
      });

      setHealth({
        status: "error",
        database: "unknown",
        clientResponseTime: latencia,
        verificadoEm: new Date(),
      });

      setErro(
        error?.message ||
          "Não foi possível conectar à API."
      );
    } finally {
      setVerificando(false);
      setCarregando(false);
    }
  }, []);

  async function carregarDados() {
    try {
      const [alunosResponse, professoresResponse] =
        await Promise.all([
          fetch(`${API_URL}/alunos`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/professores`, {
            credentials: "include",
          }),
        ]);

      if (alunosResponse.ok) {
        const alunosData = await alunosResponse.json();

        setAlunos(
          Array.isArray(alunosData)
            ? alunosData
            : []
        );
      }

      if (professoresResponse.ok) {
        const professoresData =
          await professoresResponse.json();

        setProfessores(
          Array.isArray(professoresData)
            ? professoresData
            : []
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar dados do sistema:",
        error
      );
    }
  }

  useEffect(() => {
    verificarSaude();
    carregarDados();

    const intervalo = setInterval(
      verificarSaude,
      INTERVALO_MONITORAMENTO
    );

    return () => clearInterval(intervalo);
  }, [verificarSaude]);

  const estatisticas = useMemo(() => {
    const valores = latencias
      .map((item) => item.valor)
      .filter((valor) => Number.isFinite(valor));

    if (!valores.length) {
      return {
        atual: null,
        media: null,
        minima: null,
        maxima: null,
      };
    }

    return {
      atual: valores[valores.length - 1],
      media: Math.round(
        valores.reduce(
          (total, valor) => total + valor,
          0
        ) / valores.length
      ),
      minima: Math.min(...valores),
      maxima: Math.max(...valores),
    };
  }, [latencias]);

  const alunosAtivos = useMemo(() => {
    return alunos.filter(
      (aluno) =>
        !aluno.status ||
        String(aluno.status).toLowerCase() === "ativo"
    ).length;
  }, [alunos]);

  const statusApi =
    health?.status === "ok"
      ? "online"
      : "erro";

  const statusBanco =
    health?.database === "connected"
      ? "online"
      : health?.database === "disconnected"
      ? "erro"
      : "desconhecido";

  const sincronizacao = health?.sincronizacao;

  const totalAlunos =
  health?.dados?.totalAlunos ?? "--";

const totalProfessores =
  health?.dados?.totalProfessores ?? "--";

  const statusSincronizacao =
    sincronizacao?.status || "aguardando";

  function formatarHorario(data) {
    if (!data) return "--";

    return new Date(data).toLocaleTimeString(
      "pt-BR"
    );
  }

  function formatarDuracao(duracao) {
    if (duracao == null) return "--";

    if (duracao < 1000) {
      return `${duracao} ms`;
    }

    return `${(duracao / 1000).toFixed(1)} s`;
  }

  function obterClasseLatencia(valor) {
    if (valor == null) return "";

    if (valor < 150) return "boa";
    if (valor < 400) return "atencao";

    return "ruim";
  }

  function obterTextoSincronizacao() {
    if (statusSincronizacao === "sucesso") {
      return "Sincronizado";
    }

    if (statusSincronizacao === "executando") {
      return "Sincronizando...";
    }

    if (statusSincronizacao === "erro") {
      return "Erro";
    }

    return "Aguardando";
  }

  function obterClasseSincronizacao() {
    if (statusSincronizacao === "sucesso") {
      return "sucesso";
    }

    if (statusSincronizacao === "executando") {
      return "atencao";
    }

    if (statusSincronizacao === "erro") {
      return "problema";
    }

    return "";
  }

  if (carregando) {
    return (
      <div className="relatorio-dev">
        <div className="relatorio-dev-loading">
          Verificando sistema...
        </div>
      </div>
    );
  }

  return (
    <div className="relatorio-dev">
      <header className="relatorio-dev-header">
        <div>
          <span className="relatorio-dev-label">
            Desenvolvimento
          </span>

          <h1>Diagnóstico do sistema</h1>

          <p>
            Monitoramento técnico do Som Renovo Manager.
          </p>
        </div>

        <button
          type="button"
          className="relatorio-dev-atualizar"
          onClick={() => {
            verificarSaude();
            carregarDados();
          }}
          disabled={verificando}
        >
          {verificando
            ? "Verificando..."
            : "↻ Verificar agora"}
        </button>
      </header>

      {/* SAÚDE */}

      <section className="relatorio-dev-section">
        <div className="relatorio-dev-section-header">
          <div>
            <span>Monitoramento</span>
            <h2>Saúde do sistema</h2>
          </div>

          <div
            className={`relatorio-dev-live ${
              statusApi === "online"
                ? "ativo"
                : "problema"
            }`}
          >
            <span />
            Monitoramento ativo
          </div>
        </div>

        <div className="relatorio-dev-status-grid">
          <div className="relatorio-dev-status-card">
            <div className="relatorio-dev-status-top">
              <span>API</span>

              <i
                className={`relatorio-dev-indicador ${statusApi}`}
              />
            </div>

            <strong>
              {statusApi === "online"
                ? "Online"
                : "Offline"}
            </strong>

            <small>{API_URL}</small>
          </div>

          <div className="relatorio-dev-status-card">
            <div className="relatorio-dev-status-top">
              <span>Banco de dados</span>

              <i
                className={`relatorio-dev-indicador ${statusBanco}`}
              />
            </div>

            <strong>
              {statusBanco === "online"
                ? "Conectado"
                : statusBanco === "erro"
                ? "Desconectado"
                : "Desconhecido"}
            </strong>

            <small>
              Verificado pelo endpoint /health
            </small>
          </div>

          <div className="relatorio-dev-status-card">
            <div className="relatorio-dev-status-top">
              <span>Frontend</span>

              <i className="relatorio-dev-indicador online" />
            </div>

            <strong>Online</strong>

            <small>Aplicação carregada</small>
          </div>

          <div className="relatorio-dev-status-card">
            <div className="relatorio-dev-status-top">
              <span>Ambiente</span>
            </div>

            <strong>
              {import.meta.env.MODE || "unknown"}
            </strong>

            <small>
              {import.meta.env.DEV
                ? "Desenvolvimento"
                : "Produção"}
            </small>
          </div>
        </div>

        {erro && (
          <div className="relatorio-dev-erro">
            <strong>Problema detectado</strong>
            <span>{erro}</span>
          </div>
        )}
      </section>

      {/* PERFORMANCE */}

      <section className="relatorio-dev-section">
        <div className="relatorio-dev-section-header">
          <div>
            <span>Performance</span>
            <h2>Latência da API</h2>
          </div>

          <small className="relatorio-dev-atualizacao">
            Atualização a cada 5 segundos
          </small>
        </div>

        <div className="relatorio-dev-performance-grid">
          <div className="relatorio-dev-performance-card destaque">
            <span>Agora</span>

            <strong
              className={obterClasseLatencia(
                estatisticas.atual
              )}
            >
              {estatisticas.atual != null
                ? `${estatisticas.atual} ms`
                : "--"}
            </strong>

            <small>
              {health
                ? `Última verificação às ${formatarHorario(
                    health.verificadoEm
                  )}`
                : "--"}
            </small>
          </div>

          <div className="relatorio-dev-performance-card">
            <span>Média</span>

            <strong>
              {estatisticas.media != null
                ? `${estatisticas.media} ms`
                : "--"}
            </strong>
          </div>

          <div className="relatorio-dev-performance-card">
            <span>Mínima</span>

            <strong>
              {estatisticas.minima != null
                ? `${estatisticas.minima} ms`
                : "--"}
            </strong>
          </div>

          <div className="relatorio-dev-performance-card">
            <span>Máxima</span>

            <strong>
              {estatisticas.maxima != null
                ? `${estatisticas.maxima} ms`
                : "--"}
            </strong>
          </div>
        </div>

        <div className="relatorio-dev-grafico">
          <div className="relatorio-dev-grafico-header">
            <span>Últimas verificações</span>
            <small>
              {latencias.length} registros
            </small>
          </div>

          <div className="relatorio-dev-grafico-area">
            {latencias.length === 0 ? (
              <span className="relatorio-dev-grafico-vazio">
                Aguardando medições...
              </span>
            ) : (
              latencias.map((item, index) => {
                const maior =
                  estatisticas.maxima || 1;

                const altura = Math.max(
                  8,
                  Math.min(
                    100,
                    (item.valor / maior) * 100
                  )
                );

                return (
                  <div
                    className="relatorio-dev-grafico-coluna"
                    key={`${item.horario.toISOString()}-${index}`}
                    title={`${item.valor} ms`}
                  >
                    <div
                      className={`relatorio-dev-grafico-barra ${
                        item.erro ? "erro" : ""
                      }`}
                      style={{
                        height: `${altura}%`,
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* DADOS */}

      <section className="relatorio-dev-section">
        <div className="relatorio-dev-section-header">
          <div>
            <span>Banco / dados</span>
            <h2>Resumo do sistema</h2>
          </div>
        </div>

        <div className="relatorio-dev-dados-grid">
  <div className="relatorio-dev-dado">
    <span>Total de alunos</span>

    <strong>{totalAlunos}</strong>

    <small>
      Cadastrados no banco de dados
    </small>
  </div>

  <div className="relatorio-dev-dado">
    <span>Total de professores</span>

    <strong>{totalProfessores}</strong>

    <small>
      Professores cadastrados
    </small>
  </div>

  <div className="relatorio-dev-dado">
    <span>Última verificação</span>

    <strong>
      {formatarHorario(health?.verificadoEm)}
    </strong>

    <small>
      Monitoramento da API
    </small>
  </div>
</div>
      </section>

      {/* INTEGRAÇÕES */}

      <section className="relatorio-dev-section">
        <div className="relatorio-dev-section-header">
          <div>
            <span>Infraestrutura</span>
            <h2>Integrações</h2>
          </div>
        </div>

        <div className="relatorio-dev-integracoes">
          <div className="relatorio-dev-integracao">
            <div>
              <strong>API do Manager</strong>
              <span>
                Comunicação entre frontend e backend.
              </span>
            </div>

            <span
              className={`relatorio-dev-badge ${
                statusApi === "online"
                  ? "sucesso"
                  : "problema"
              }`}
            >
              {statusApi === "online"
                ? "Funcionando"
                : "Problema"}
            </span>
          </div>

          <div className="relatorio-dev-integracao">
            <div>
              <strong>PostgreSQL</strong>
              <span>
                Banco de dados principal do Manager.
              </span>
            </div>

            <span
              className={`relatorio-dev-badge ${
                statusBanco === "online"
                  ? "sucesso"
                  : "problema"
              }`}
            >
              {statusBanco === "online"
                ? "Conectado"
                : "Verificar"}
            </span>
          </div>

          <div className="relatorio-dev-integracao">
            <div>
              <strong>Google Sheets</strong>
              <span>
                Fonte utilizada pela sincronização de alunos.
              </span>

              {sincronizacao?.resultado && (
                <small>
                  Última sincronização às{" "}
                  {formatarHorario(sincronizacao.fim)}
                  {" • "}
                  {sincronizacao.resultado.professores} professores
                  {" • "}
                  {sincronizacao.resultado.alunosNovos} novos
                  {" • "}
                  {sincronizacao.resultado.alunosAtualizados} atualizados
                </small>
              )}

              {sincronizacao?.erro && (
                <small>
                  Erro: {sincronizacao.erro}
                </small>
              )}
            </div>

            <span
              className={`relatorio-dev-badge ${obterClasseSincronizacao()}`}
            >
              {obterTextoSincronizacao()}
            </span>
          </div>

          <div className="relatorio-dev-integracao">
            <div>
              <strong>Google OAuth</strong>
              <span>
                Autenticação dos usuários do Manager.
              </span>
            </div>

            <span className="relatorio-dev-badge">
              Ativo
            </span>
          </div>
        </div>
      </section>

      {/* DIAGNÓSTICO */}

      <section className="relatorio-dev-section">
        <div className="relatorio-dev-section-header">
          <div>
            <span>Diagnóstico</span>
            <h2>Informações técnicas</h2>
          </div>
        </div>

        <div className="relatorio-dev-tecnico">
          <div>
            <span>URL da API</span>
            <code>{API_URL}</code>
          </div>

          <div>
            <span>Ambiente</span>
            <code>
              {import.meta.env.MODE || "unknown"}
            </code>
          </div>

          <div>
            <span>Intervalo de monitoramento</span>
            <code>5 segundos</code>
          </div>

          <div>
            <span>Histórico de latência</span>
            <code>
              {MAX_HISTORICO_LATENCIA} medições
            </code>
          </div>
        </div>
      </section>

      <footer className="relatorio-dev-footer">
        Som Renovo Manager • Painel de diagnóstico
      </footer>
    </div>
  );
}

export default RelatorioDev;