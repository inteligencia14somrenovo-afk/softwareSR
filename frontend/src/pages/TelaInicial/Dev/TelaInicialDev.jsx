import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiUserCheck,
  FiCheckCircle,
  FiBookOpen,
  FiArrowRight,
  FiDatabase,
  FiServer,
  FiActivity,
  FiSettings
} from "react-icons/fi";

import API_URL from "../../../config/api";

import "./TelaInicialDev.css";

function TelaInicialDev() {
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);

        const [respostaAlunos, respostaProfessores] =
          await Promise.all([
            fetch(`${API_URL}/alunos`, {
              credentials: "include"
            }),

            fetch(`${API_URL}/professores`, {
              credentials: "include"
            })
          ]);

        const dadosAlunos = await respostaAlunos.json();
        const dadosProfessores =
          await respostaProfessores.json();

        if (respostaAlunos.ok) {
          setAlunos(dadosAlunos.alunos || []);
        }

        if (respostaProfessores.ok) {
          setProfessores(
            dadosProfessores.professores || []
          );
        }
      } catch (error) {
        console.error(
          "❌ Erro ao carregar dados da Tela Inicial Dev:",
          error
        );

        setAlunos([]);
        setProfessores([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  const totalAlunos = alunos.length;

  const totalProfessores = professores.filter(
  (professor) => professor.role === "professor"
).length;

  const alunosAtivos = alunos.filter(
    (aluno) =>
      !aluno.status ||
      aluno.status.toString().toLowerCase() === "ativo"
  ).length;

  const instrumentos = new Set(
    alunos
      .map((aluno) => aluno.instrumento)
      .filter(Boolean)
  );

  return (
    <div className="dev-dashboard">

      {/* =========================
          CABEÇALHO
      ========================= */}

      <header className="dev-header">

        <div>
          <span className="dev-eyebrow">
            Som Renovo Manager
          </span>

          <h1>Painel do Desenvolvedor</h1>

          <p>
            Visão geral dos dados e do estado da aplicação.
          </p>
        </div>

        <div className="dev-status">
          <span className="status-dot"></span>
          Sistema operacional
        </div>

      </header>


      {/* =========================
          RESUMO
      ========================= */}

      <section className="dev-cards">

        <div className="dev-card">

          <div className="dev-card-icon">
            <FiUsers />
          </div>

          <div>
            <span>Alunos</span>

            <strong>
              {carregando ? "..." : totalAlunos}
            </strong>

            <small>
              Total cadastrado
            </small>
          </div>

        </div>


        <div className="dev-card">

          <div className="dev-card-icon">
            <FiUserCheck />
          </div>

          <div>
            <span>Professores</span>

            <strong>
              {carregando ? "..." : totalProfessores}
            </strong>

            <small>
              Professores cadastrados
            </small>
          </div>

        </div>


        <div className="dev-card">

          <div className="dev-card-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Alunos ativos</span>

            <strong>
              {carregando ? "..." : alunosAtivos}
            </strong>

            <small>
              Status ativo
            </small>
          </div>

        </div>


        <div className="dev-card">

          <div className="dev-card-icon">
            <FiBookOpen />
          </div>

          <div>
            <span>Instrumentos</span>

            <strong>
              {carregando ? "..." : instrumentos.size}
            </strong>

            <small>
              Instrumentos cadastrados
            </small>
          </div>

        </div>

      </section>


      {/* =========================
          CONTEÚDO PRINCIPAL
      ========================= */}

      <div className="dev-grid">

        {/* PROFESSORES */}

        <section className="dev-panel">

          <div className="panel-header">

            <div>
              <span className="panel-eyebrow">
                Escola
              </span>

              <h2>Professores</h2>

              <p>
                Professores cadastrados no sistema
              </p>
            </div>

            <button
              className="panel-link"
              onClick={() =>
                navigate("/professores")
              }
            >
              Ver todos
              <FiArrowRight />
            </button>

          </div>


          <div className="dev-professores-list">

            {carregando ? (

              <div className="dev-estado">
                Carregando professores...
              </div>

            ) : professores.length === 0 ? (

              <div className="dev-estado">
                Nenhum professor encontrado.
              </div>

            ) : (

              professores.map((professor) => (

                <button
                  key={professor.id}
                  className="dev-professor-item"
                  onClick={() =>
                    navigate(
                      `/professores/${professor.id}`
                    )
                  }
                >

                  <div className="dev-professor-avatar">

                    {professor.foto_url ? (

                      <img
                        src={professor.foto_url}
                        alt={professor.nome}
                      />

                    ) : (

                      <span>
                        {professor.nome
                          ? professor.nome
                              .charAt(0)
                              .toUpperCase()
                          : "?"}
                      </span>

                    )}

                  </div>


                  <div className="dev-professor-info">

                    <strong>
                      {professor.nome || "Sem nome"}
                    </strong>

                    <span>
                      {professor.email || "Sem e-mail"}
                    </span>

                  </div>


                  <div className="dev-professor-alunos">

                    <strong>
                      {professor.total_alunos || 0}
                    </strong>

                    <span>
                      {professor.total_alunos === 1
                        ? "aluno"
                        : "alunos"}
                    </span>

                  </div>


                  <FiArrowRight />

                </button>

              ))

            )}

          </div>

        </section>


        {/* STATUS TÉCNICO */}

        <section className="dev-panel">

          <div className="panel-header">

            <div>
              <span className="panel-eyebrow">
                Sistema
              </span>

              <h2>Status técnico</h2>

              <p>
                Informações do ambiente atual
              </p>
            </div>

          </div>


          <div className="dev-status-list">

            <div className="dev-status-item">

              <div className="dev-status-icon">
                <FiServer />
              </div>

              <div>
                <strong>Frontend</strong>
                <span>Aplicação React</span>
              </div>

              <b className="status-ok">
                Online
              </b>

            </div>


            <div className="dev-status-item">

              <div className="dev-status-icon">
                <FiActivity />
              </div>

              <div>
                <strong>API</strong>
                <span>Backend da aplicação</span>
              </div>

              <b className="status-ok">
                Online
              </b>

            </div>


            <div className="dev-status-item">

              <div className="dev-status-icon">
                <FiDatabase />
              </div>

              <div>
                <strong>Banco de dados</strong>
                <span>PostgreSQL</span>
              </div>

              <b className="status-ok">
                Online
              </b>

            </div>

          </div>

        </section>

      </div>


      {/* =========================
          ACESSOS RÁPIDOS
      ========================= */}

      <section className="dev-panel dev-shortcuts">

        <div className="panel-header">

          <div>
            <span className="panel-eyebrow">
              Desenvolvimento
            </span>

            <h2>Acessos rápidos</h2>

            <p>
              Áreas úteis para manutenção do sistema
            </p>
          </div>

        </div>


        <div className="shortcut-grid">

          <button
            className="shortcut"
            onClick={() =>
              navigate("/alunos")
            }
          >
            <FiUsers />

            <div>
              <strong>Alunos</strong>

              <small>
                Consultar cadastros
              </small>
            </div>

            <FiArrowRight />
          </button>


          <button
            className="shortcut"
            onClick={() =>
              navigate("/professores")
            }
          >
            <FiUserCheck />

            <div>
              <strong>Professores</strong>

              <small>
                Consultar professores
              </small>
            </div>

            <FiArrowRight />
          </button>



          <button
            className="shortcut"
            onClick={() =>
              navigate("/relatorio")
            }
          >
            <FiActivity />

            <div>
              <strong>Relatórios</strong>

              <small>
                Consultar informações
              </small>
            </div>

            <FiArrowRight />
          </button>

        </div>

      </section>

    </div>
  );
}

export default TelaInicialDev;