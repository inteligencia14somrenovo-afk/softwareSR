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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const data = new Date();
    return new Date(data.getFullYear(), data.getMonth(), 1);
  });

  const mesString = `${mesSelecionado.getFullYear()}-${String(
    mesSelecionado.getMonth() + 1
  ).padStart(2, "0")}`;

  const nomeMes = mesSelecionado.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [alunosResponse, professoresResponse] = await Promise.all([
        fetch(`${API_URL}/alunos`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/professores`, {
          credentials: "include",
        }),
      ]);

      if (!alunosResponse.ok) {
        throw new Error("Não foi possível carregar os alunos.");
      }

      if (!professoresResponse.ok) {
        throw new Error("Não foi possível carregar os professores.");
      }

      const alunosData = await alunosResponse.json();
      const professoresData = await professoresResponse.json();

      setAlunos(Array.isArray(alunosData) ? alunosData : []);
      setProfessores(
        Array.isArray(professoresData) ? professoresData : []
      );
    } catch (error) {
      console.error("Erro ao carregar relatório administrativo:", error);
      setErro("Não foi possível carregar os dados do relatório.");
    } finally {
      setCarregando(false);
    }
  }

  const resumo = useMemo(() => {
    const totalAlunos = alunos.length;
    const totalProfessores = professores.length;

    const alunosAtivos = alunos.filter(
      (aluno) =>
        !aluno.status ||
        String(aluno.status).toLowerCase() === "ativo"
    ).length;

    const alunosInativos = totalAlunos - alunosAtivos;

    return {
      totalAlunos,
      totalProfessores,
      alunosAtivos,
      alunosInativos,
    };
  }, [alunos, professores]);

  const alunosPorProfessor = useMemo(() => {
    return professores
      .map((professor) => {
        const alunosDoProfessor = alunos.filter(
          (aluno) => Number(aluno.professor_id) === Number(professor.id)
        );

        const ativos = alunosDoProfessor.filter(
          (aluno) =>
            !aluno.status ||
            String(aluno.status).toLowerCase() === "ativo"
        ).length;

        return {
          ...professor,
          totalAlunos: alunosDoProfessor.length,
          alunosAtivos: ativos,
          alunosInativos: alunosDoProfessor.length - ativos,
        };
      })
      .sort((a, b) => b.alunosAtivos - a.alunosAtivos);
  }, [alunos, professores]);

  const alunosPorInstrumento = useMemo(() => {
    const mapa = {};

    alunos.forEach((aluno) => {
      const instrumento = aluno.instrumento || "Não informado";

      if (!mapa[instrumento]) {
        mapa[instrumento] = 0;
      }

      mapa[instrumento]++;
    });

    return Object.entries(mapa)
      .map(([instrumento, quantidade]) => ({
        instrumento,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [alunos]);

  function mudarMes(direcao) {
    setMesSelecionado(
      (atual) =>
        new Date(
          atual.getFullYear(),
          atual.getMonth() + direcao,
          1
        )
    );
  }

  if (carregando) {
    return (
      <div className="relatorio-admin">
        <div className="relatorio-admin-loading">
          Carregando relatório...
        </div>
      </div>
    );
  }

  return (
    <div className="relatorio-admin">
      <header className="relatorio-admin-header">
        <div>
          <span className="relatorio-admin-label">
            Administração
          </span>

          <h1>Relatório da Escola</h1>

          <p>
            Acompanhe alunos, professores e os principais indicadores
            da escola.
          </p>
        </div>

        <div className="relatorio-admin-periodo">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
          >
            ‹
          </button>

          <span>{nomeMes}</span>

          <button
            type="button"
            onClick={() => mudarMes(1)}
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

      <section className="relatorio-admin-resumo">
        <div className="relatorio-admin-card">
          <span>Total de alunos</span>
          <strong>{resumo.totalAlunos}</strong>
          <small>Cadastros atuais</small>
        </div>

        <div className="relatorio-admin-card">
          <span>Alunos ativos</span>
          <strong>{resumo.alunosAtivos}</strong>
          <small>Alunos em atividade</small>
        </div>

        <div className="relatorio-admin-card">
          <span>Professores</span>
          <strong>{resumo.totalProfessores}</strong>
          <small>Professores cadastrados</small>
        </div>

        <div className="relatorio-admin-card">
          <span>Alunos inativos</span>
          <strong>{resumo.alunosInativos}</strong>
          <small>Cadastros não ativos</small>
        </div>
      </section>

      <section className="relatorio-admin-section">
        <div className="relatorio-admin-section-header">
          <div>
            <span>Equipe</span>
            <h2>Alunos por professor</h2>
          </div>
        </div>

        <div className="relatorio-admin-professores">
          {alunosPorProfessor.length === 0 ? (
            <p className="relatorio-admin-vazio">
              Nenhum professor encontrado.
            </p>
          ) : (
            alunosPorProfessor.map((professor) => (
              <button
                type="button"
                className="relatorio-admin-professor"
                key={professor.id}
                onClick={() =>
                  navigate(`/professores/${professor.id}`)
                }
              >
                <div className="relatorio-admin-professor-avatar">
                  {professor.foto_url ? (
                    <img
                      src={professor.foto_url}
                      alt={professor.nome}
                    />
                  ) : (
                    professor.nome?.charAt(0)?.toUpperCase()
                  )}
                </div>

                <div className="relatorio-admin-professor-info">
                  <strong>{professor.nome}</strong>
                  <span>
                    {professor.alunosAtivos} alunos ativos
                  </span>
                </div>

                <div className="relatorio-admin-professor-total">
                  <strong>{professor.totalAlunos}</strong>
                  <span>total</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="relatorio-admin-section">
        <div className="relatorio-admin-section-header">
          <div>
            <span>Distribuição</span>
            <h2>Alunos por instrumento</h2>
          </div>
        </div>

        <div className="relatorio-admin-instrumentos">
          {alunosPorInstrumento.length === 0 ? (
            <p className="relatorio-admin-vazio">
              Nenhum instrumento encontrado.
            </p>
          ) : (
            alunosPorInstrumento.map((item) => (
              <div
                className="relatorio-admin-instrumento"
                key={item.instrumento}
              >
                <div className="relatorio-admin-instrumento-topo">
                  <span>{item.instrumento}</span>
                  <strong>{item.quantidade}</strong>
                </div>

                <div className="relatorio-admin-barra">
                  <div
                    style={{
                      width: `${
                        resumo.totalAlunos > 0
                          ? (item.quantidade / resumo.totalAlunos) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="relatorio-admin-section relatorio-admin-futuro">
        <div className="relatorio-admin-section-header">
          <div>
            <span>Análise histórica</span>
            <h2>Movimentação dos alunos</h2>
          </div>
        </div>

        <div className="relatorio-admin-placeholder">
          <div className="relatorio-admin-placeholder-icon">
            ↗
          </div>

          <div>
            <strong>
              Histórico de entradas, saídas e mudanças
            </strong>

            <p>
              Esta análise será alimentada pelo histórico de
              movimentações dos alunos e das alterações de horários.
            </p>
          </div>
        </div>
      </section>

      <section className="relatorio-admin-section relatorio-admin-futuro">
        <div className="relatorio-admin-section-header">
          <div>
            <span>Inteligência</span>
            <h2>Análise com IA</h2>
          </div>
        </div>

        <div className="relatorio-admin-placeholder">
          <div className="relatorio-admin-placeholder-icon">
            ✦
          </div>

          <div>
            <strong>
              Interpretação automática dos resultados
            </strong>

            <p>
              A IA poderá interpretar as movimentações da escola,
              identificar padrões e destacar alterações relevantes.
            </p>
          </div>
        </div>
      </section>

      <footer className="relatorio-admin-footer">
        Período selecionado:{" "}
        <strong>{mesString}</strong>
      </footer>
    </div>
  );
}

export default RelatorioAdmin;