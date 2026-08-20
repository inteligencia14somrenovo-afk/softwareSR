import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiUserPlus,
  FiClipboard
} from "react-icons/fi";

import API_URL from "../../config/api";

import "./TelaInicial.css";


function TelaInicial() {

  const navigate = useNavigate();


  // =====================================================
  // ESTADOS
  // =====================================================

  const [alunos, setAlunos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [presencas, setPresencas] = useState([]);

  const [carregando, setCarregando] = useState(true);


  // =====================================================
  // DATA ATUAL
  // =====================================================

  const hoje = new Date();

  const ano = hoje.getFullYear();

  const mes = String(
    hoje.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate()
  ).padStart(2, "0");

  const dataHoje = `${ano}-${mes}-${dia}`;


  /*
    JavaScript:

    Domingo = 0
    Segunda = 1
    ...
    Sábado = 6

    Nosso banco:

    Segunda = 1
    ...
    Sábado = 6

    Portanto domingo não possui aulas.
  */

  const diaSemana = hoje.getDay();


  // =====================================================
  // CARREGAR DADOS
  // =====================================================

  useEffect(() => {

    const carregarDashboard = async () => {

      try {

        setCarregando(true);


        const [
          respostaAlunos,
          respostaAulas,
          respostaPresencas
        ] = await Promise.all([

          fetch(
            `${API_URL}/alunos`,
            {
              credentials: "include"
            }
          ),

          fetch(
            `${API_URL}/aulas`,
            {
              credentials: "include"
            }
          ),

          fetch(
            `${API_URL}/presencas?data=${dataHoje}`,
            {
              credentials: "include"
            }
          )

        ]);


        const [
          dadosAlunos,
          dadosAulas,
          dadosPresencas
        ] = await Promise.all([

          respostaAlunos.json(),
          respostaAulas.json(),
          respostaPresencas.json()

        ]);


        if (!respostaAlunos.ok) {
          throw new Error(
            dadosAlunos.mensagem ||
            "Erro ao carregar alunos."
          );
        }


        if (!respostaAulas.ok) {
          throw new Error(
            dadosAulas.mensagem ||
            "Erro ao carregar aulas."
          );
        }


        if (!respostaPresencas.ok) {
          throw new Error(
            dadosPresencas.mensagem ||
            "Erro ao carregar presenças."
          );
        }


        setAlunos(
          dadosAlunos.alunos || []
        );


        setAulas(
          dadosAulas.aulas || []
        );


        setPresencas(
          dadosPresencas.presencas || []
        );


      } catch (error) {

        console.error(
          "❌ Erro ao carregar dashboard:",
          error
        );

      } finally {

        setCarregando(false);

      }

    };


    carregarDashboard();

  }, [dataHoje]);


  // =====================================================
  // AULAS DE HOJE
  // =====================================================

  const aulasHoje = useMemo(() => {

    if (diaSemana === 0) {
      return [];
    }

    return aulas
      .filter(
        (aula) =>
          Number(aula.dia_semana) ===
          diaSemana
      )
      .sort(
        (a, b) =>
          a.horario.localeCompare(
            b.horario
          )
      );

  }, [aulas, diaSemana]);


  // =====================================================
  // PRESENÇA DE HOJE
  // =====================================================

  const totalPresencasHoje =
    presencas.length;


  const presentesHoje =
    presencas.filter(
      (presenca) =>
        presenca.status ===
        "presente"
    ).length;


  const faltasHoje =
    presencas.filter(
      (presenca) =>
        presenca.status ===
        "falta"
    ).length;


  const percentualPresenca =
    totalPresencasHoje > 0
      ? Math.round(
          (presentesHoje /
            totalPresencasHoje) *
            100
        )
      : 0;


  // =====================================================
  // PRÓXIMA AULA
  // =====================================================

  const horaAtual =
    `${String(
      hoje.getHours()
    ).padStart(2, "0")}:${String(
      hoje.getMinutes()
    ).padStart(2, "0")}`;


  const proximaAula =
    aulasHoje.find(
      (aula) =>
        aula.horario >= horaAtual
    ) || null;


  // =====================================================
  // DATA FORMATADA
  // =====================================================

  const dataFormatada =
    hoje.toLocaleDateString(
      "pt-BR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long"
      }
    );


  // =====================================================
  // CARREGANDO
  // =====================================================

  if (carregando) {

    return (

      <div className="tela-inicial">

        <div className="dashboard-loading">

          <div className="loading-circle"></div>

          <p>
            Carregando seu painel...
          </p>

        </div>

      </div>

    );

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="tela-inicial">


      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="dashboard-header">

        <div>

          <span className="dashboard-label">
            PAINEL DO PROFESSOR
          </span>

          <h1>
            Olá, Professor!
          </h1>

          <p>
            {dataFormatada}
          </p>

        </div>

        <button
          className="dashboard-presenca-btn"
          type="button"
          onClick={() =>
            navigate("/presenca")
          }
        >
          <FiClipboard />

          Registrar presença

          <FiArrowRight />

        </button>

      </div>


      {/* =================================================
          CARDS
      ================================================= */}

      <div className="dashboard-cards">


        {/* ALUNOS */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiUsers />
          </div>

          <div>

            <span>
              Alunos
            </span>

            <strong>
              {alunos.length}
            </strong>

            <small>
              alunos cadastrados
            </small>

          </div>

        </div>


        {/* AULAS */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              Aulas hoje
            </span>

            <strong>
              {aulasHoje.length}
            </strong>

            <small>
              aulas programadas
            </small>

          </div>

        </div>


        {/* PRESENÇA */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiCheckCircle />
          </div>

          <div>

            <span>
              Presença hoje
            </span>

            <strong>
              {totalPresencasHoje > 0
                ? `${percentualPresenca}%`
                : "—"}
            </strong>

            <small>

              {totalPresencasHoje > 0
                ? `${presentesHoje} presentes • ${faltasHoje} faltas`
                : "nenhum registro ainda"}

            </small>

          </div>

        </div>


        {/* PRÓXIMA AULA */}

        <div className="dashboard-card proxima-aula-card">

          <div className="dashboard-card-icon">
            <FiClock />
          </div>

          <div>

            <span>
              Próxima aula
            </span>

            {proximaAula ? (

              <>
                <strong>
                  {proximaAula.horario}
                </strong>

                <small>
                  {proximaAula.aluno_nome}
                </small>
              </>

            ) : (

              <>
                <strong>
                  —
                </strong>

                <small>
                  Nenhuma aula restante
                </small>
              </>

            )}

          </div>

        </div>

      </div>


      {/* =================================================
          CONTEÚDO PRINCIPAL
      ================================================= */}

      <div className="dashboard-grid">


        {/* =================================================
            AGENDA
        ================================================= */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span>
                AGENDA
              </span>

              <h2>
                Aulas de hoje
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/presenca")
              }
            >
              Ver presença
              <FiArrowRight />
            </button>

          </div>


          {aulasHoje.length === 0 ? (

            <div className="dashboard-empty">

              <div>
                <FiCalendar />
              </div>

              <h3>
                Nenhuma aula hoje
              </h3>

              <p>
                Você não possui aulas
                programadas para hoje.
              </p>

            </div>

          ) : (

            <div className="agenda-list">

              {aulasHoje.map(
                (aula) => {

                  const registro =
                    presencas.find(
                      (presenca) =>
                        Number(
                          presenca.aula_id
                        ) ===
                        Number(aula.id)
                    );


                  return (

                    <div
                      key={aula.id}
                      className="agenda-item"
                    >

                      <div className="agenda-time">

                        <strong>
                          {aula.horario}
                        </strong>

                      </div>


                      <div className="agenda-info">

                        <strong>
                          {aula.aluno_nome}
                        </strong>

                        <span>
                          {aula.aluno_instrumento}
                        </span>

                      </div>


                      <div
                        className={
                          registro
                            ? registro.status ===
                              "presente"
                              ? "agenda-status presente"
                              : "agenda-status falta"
                            : "agenda-status pendente"
                        }
                      >

                        {registro
                          ? registro.status ===
                            "presente"
                            ? "Presente"
                            : "Falta"
                          : "Pendente"}

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* =================================================
            AÇÕES RÁPIDAS
        ================================================= */}

        <section className="dashboard-section dashboard-actions">

          <div className="section-header">

            <div>

              <span>
                ATALHOS
              </span>

              <h2>
                Ações rápidas
              </h2>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/alunos")
            }
            className="quick-action"
          >

            <div>
              <FiUserPlus />
            </div>

            <span>

              <strong>
                Gerenciar alunos
              </strong>

              <small>
                Cadastrar e visualizar alunos
              </small>

            </span>

            <FiArrowRight />

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/presenca")
            }
            className="quick-action"
          >

            <div>
              <FiCalendar />
            </div>

            <span>

              <strong>
                Configurar horários
              </strong>

              <small>
                Organizar sua agenda semanal
              </small>

            </span>

            <FiArrowRight />

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/relatorio")
            }
            className="quick-action"
          >

            <div>
              <FiClipboard />
            </div>

            <span>

              <strong>
                Ver relatórios
              </strong>

              <small>
                Acompanhar histórico dos alunos
              </small>

            </span>

            <FiArrowRight />

          </button>

        </section>

      </div>

    </div>

  );

}


export default TelaInicial;