import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiCheckCircle,
  FiArrowRight,
  FiUser
} from "react-icons/fi";

import { useAuth } from "../../../context/AuthContext";
import API_URL from "../../../config/api";

import "./TelaInicialAdmin.css";

function TelaInicialAdmin() {
  const navigate = useNavigate();

  const { professor, carregando: carregandoProfessor } = useAuth();

  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (carregandoProfessor || !professor) {
      return;
    }

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
        } else {
          setAlunos([]);
        }

        if (respostaProfessores.ok) {
          setProfessores(
            dadosProfessores.professores || []
          );
        } else {
          setProfessores([]);
        }
      } catch (error) {
        console.error(
          "❌ Erro ao carregar dados do Admin:",
          error
        );

        setAlunos([]);
        setProfessores([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [professor, carregandoProfessor]);

  const totalAlunos = alunos.length;
  const totalProfessores = professores.filter(
  (professor) => professor.role === "professor"
).length;

  const alunosAtivos = alunos.filter(
    (aluno) =>
      !aluno.status ||
      aluno.status.toString().toLowerCase() === "ativo"
  ).length;

  const alunosPorInstrumento = alunos.reduce(
    (resultado, aluno) => {
      const instrumento =
        aluno.instrumento || "Não informado";

      resultado[instrumento] =
        (resultado[instrumento] || 0) + 1;

      return resultado;
    },
    {}
  );

  const instrumentosOrdenados = Object.entries(
    alunosPorInstrumento
  )
    .sort(([, quantidadeA], [, quantidadeB]) =>
      quantidadeB - quantidadeA
    )
    .slice(0, 6);

  return (
    <div className="admin-inicio">

      {/* =========================
          CABEÇALHO
      ========================= */}

      <div className="admin-inicio-header">

        <div>
          <h1>
            Olá, {professor?.nome || "Admin"}!
          </h1>

          <p>
            Visão geral da escola
          </p>
        </div>

      </div>


      {/* =========================
          RESUMO
      ========================= */}

      <div className="admin-resumo">

        <div className="admin-resumo-card">

          <div className="admin-resumo-icon">
            <FiUsers />
          </div>

          <div>
            <span>Alunos</span>

            <strong>
              {carregando ? "..." : totalAlunos}
            </strong>
          </div>

        </div>


        <div className="admin-resumo-card">

          <div className="admin-resumo-icon">
            <FiUserCheck />
          </div>

          <div>
            <span>Professores</span>

            <strong>
              {carregando ? "..." : totalProfessores}
            </strong>
          </div>

        </div>


        <div className="admin-resumo-card">

          <div className="admin-resumo-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Alunos ativos</span>

            <strong>
              {carregando ? "..." : alunosAtivos}
            </strong>
          </div>

        </div>


        <div className="admin-resumo-card">

          <div className="admin-resumo-icon">
            <FiCalendar />
          </div>

          <div>
            <span>Instrumentos</span>

            <strong>
              {carregando
                ? "..."
                : Object.keys(alunosPorInstrumento).length}
            </strong>
          </div>

        </div>

      </div>


      {/* =========================
          CONTEÚDO PRINCIPAL
      ========================= */}

      <div className="admin-inicio-grid">

        {/* PROFESSORES */}

        <section className="admin-painel">

          <div className="admin-painel-header">

            <div>
              <h2>Professores</h2>

              <p>
                Professores e quantidade de alunos
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/professores")
              }
            >
              Ver todos
              <FiArrowRight />
            </button>

          </div>


          <div className="admin-professores-list">

            {carregando ? (

              <div className="admin-estado">
                Carregando professores...
              </div>

            ) : professores.length === 0 ? (

              <div className="admin-estado">
                Nenhum professor encontrado.
              </div>

            ) : (

              professores.map((item) => (

                <button
                  key={item.id}
                  className="admin-professor-item"
                  onClick={() =>
                    navigate(
                      `/professores/${item.id}`
                    )
                  }
                >

                  <div className="admin-professor-avatar">

                    {item.foto_url ? (

                      <img
                        src={item.foto_url}
                        alt={item.nome}
                      />

                    ) : (

                      <span>
                        {item.nome
                          ? item.nome
                              .charAt(0)
                              .toUpperCase()
                          : "?"}
                      </span>

                    )}

                  </div>


                  <div className="admin-professor-info">

                    <strong>
                      {item.nome || "Sem nome"}
                    </strong>

                    <span>
                      {item.email}
                    </span>

                  </div>


                  <div className="admin-professor-alunos">

                    <strong>
                      {item.total_alunos || 0}
                    </strong>

                    <span>
                      {item.total_alunos === 1
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


        {/* INSTRUMENTOS */}

        <section className="admin-painel">

          <div className="admin-painel-header">

            <div>
              <h2>Alunos por instrumento</h2>

              <p>
                Distribuição dos alunos
              </p>
            </div>

          </div>


          <div className="admin-instrumentos">

            {carregando ? (

              <div className="admin-estado">
                Carregando alunos...
              </div>

            ) : instrumentosOrdenados.length === 0 ? (

              <div className="admin-estado">
                Nenhum aluno encontrado.
              </div>

            ) : (

              instrumentosOrdenados.map(
                ([instrumento, quantidade]) => (

                  <div
                    className="admin-instrumento-item"
                    key={instrumento}
                  >

                    <div className="admin-instrumento-nome">

                      <FiUser />

                      <span>
                        {instrumento}
                      </span>

                    </div>

                    <strong>
                      {quantidade}
                    </strong>

                  </div>

                )
              )

            )}

          </div>

        </section>

      </div>


      {/* =========================
          ACESSOS RÁPIDOS
      ========================= */}

      <section className="admin-painel admin-acessos">

        <div className="admin-painel-header">

          <div>
            <h2>Acessos rápidos</h2>

            <p>
              Acesse as principais áreas administrativas
            </p>
          </div>

        </div>


        <div className="admin-acessos-grid">

          <button
            onClick={() =>
              navigate("/alunos")
            }
          >

            <FiUsers />

            <div>
              <strong>Alunos</strong>

              <span>
                Ver todos os alunos
              </span>
            </div>

            <FiArrowRight />

          </button>


          <button
            onClick={() =>
              navigate("/professores")
            }
          >

            <FiUserCheck />

            <div>
              <strong>Professores</strong>

              <span>
                Gerenciar professores
              </span>
            </div>

            <FiArrowRight />

          </button>



          <button
            onClick={() =>
              navigate("/relatorio")
            }
          >

            <FiCheckCircle />

            <div>
              <strong>Relatórios</strong>

              <span>
                Consultar relatórios
              </span>
            </div>

            <FiArrowRight />

          </button>

        </div>

      </section>

    </div>
  );
}

export default TelaInicialAdmin;