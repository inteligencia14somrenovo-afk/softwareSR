import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiClipboard
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import API_URL from "../../config/api";

import "./TelaInicial.css";

function TelaInicial() {

  const navigate = useNavigate();

  const {
    professor,
    carregando: carregandoProfessor
  } = useAuth();

  const [alunos, setAlunos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [presencas, setPresencas] = useState([]);

  const [carregando, setCarregando] = useState(true);

  const hoje = new Date();

  const dataHoje =
    `${hoje.getFullYear()}-` +
    `${String(hoje.getMonth() + 1).padStart(2, "0")}-` +
    `${String(hoje.getDate()).padStart(2, "0")}`;

  /*
   * JS:
   * 0 = Domingo
   * 1 = Segunda
   * 2 = Terça
   * 3 = Quarta
   * 4 = Quinta
   * 5 = Sexta
   * 6 = Sábado
   */
  const diasSemana = [
    "DOMINGO",
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO"
  ];

  const diaHoje = diasSemana[hoje.getDay()];

  useEffect(() => {

    if (carregandoProfessor) {
      return;
    }

    if (!professor) {
      setAlunos([]);
      setAulas([]);
      setPresencas([]);
      setCarregando(false);
      return;
    }

    const carregarDados = async () => {

      try {

        setCarregando(true);

        const [
          respostaAlunos,
          respostaHorarios,
          respostaPresencas
        ] = await Promise.all([

          fetch(
            `${API_URL}/planilha/alunos/${professor.id}`,
            {
              credentials: "include"
            }
          ),

          fetch(
            `${API_URL}/planilha/horarios/${professor.id}/organizados`,
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

        const dadosAlunos =
          await respostaAlunos.json();

        const dadosHorarios =
          await respostaHorarios.json();

        const dadosPresencas =
          await respostaPresencas.json();

        /*
         * ALUNOS
         */
        if (respostaAlunos.ok) {

          setAlunos(
            dadosAlunos.alunos || []
          );

        } else {

          setAlunos([]);

        }

        /*
         * HORÁRIOS
         *
         * O endpoint retorna:
         *
         * {
         *   sucesso: true,
         *   dados: [...]
         * }
         */
        if (respostaHorarios.ok) {

          const horarios =
            Array.isArray(dadosHorarios.dados)
              ? dadosHorarios.dados
              : [];

          setAulas(horarios);

          console.log(
            "✅ Horários carregados na Tela Inicial:",
            horarios
          );

        } else {

          setAulas([]);

        }

        /*
         * PRESENÇAS
         */
        if (respostaPresencas.ok) {

          const listaPresencas =
            Array.isArray(dadosPresencas)
              ? dadosPresencas
              : Array.isArray(dadosPresencas.presencas)
                ? dadosPresencas.presencas
                : [];

          setPresencas(listaPresencas);

        } else {

          setPresencas([]);

        }

      } catch (error) {

        console.error(
          "❌ Erro ao carregar dados da Tela Inicial:",
          error
        );

        setAlunos([]);
        setAulas([]);
        setPresencas([]);

      } finally {

        setCarregando(false);

      }

    };

    carregarDados();

  }, [
    professor,
    carregandoProfessor,
    dataHoje
  ]);


  /*
   * =====================================================
   * AULAS DE HOJE
   * =====================================================
   *
   * Somente aulas normais entram aqui.
   *
   * Aulas experimentais são separadas para não serem
   * tratadas como aulas comuns.
   */
  const aulasHoje = useMemo(() => {

    return aulas
      .filter(
        aula =>
          aula.diaSemana === diaHoje &&
          aula.tipo !== "experimental"
      )
      .sort(
        (a, b) =>
          a.horario.localeCompare(
            b.horario
          )
      );

  }, [
    aulas,
    diaHoje
  ]);


  /*
   * =====================================================
   * AULAS EXPERIMENTAIS DE HOJE
   * =====================================================
   */
  const aulasExperimentaisHoje = useMemo(() => {

    return aulas
      .filter(
        aula =>
          aula.diaSemana === diaHoje &&
          aula.tipo === "experimental"
      )
      .sort(
        (a, b) =>
          a.horario.localeCompare(
            b.horario
          )
      );

  }, [
    aulas,
    diaHoje
  ]);


  /*
   * =====================================================
   * PRESENÇA DE HOJE
   * =====================================================
   */
  const presencasHoje = useMemo(() => {

    return presencas.filter(
      presenca =>
        presenca.data === dataHoje
    );

  }, [
    presencas,
    dataHoje
  ]);


  /*
   * =====================================================
   * TOTAL DE ALUNOS
   * =====================================================
   */
  const totalAlunos = alunos.length;


  /*
   * =====================================================
   * TOTAL DE AULAS NORMAIS DE HOJE
   * =====================================================
   */
  const totalAulasHoje =
    aulasHoje.length;


  /*
   * =====================================================
   * PRESENÇAS
   * =====================================================
   */
  const totalPresentes =
    presencasHoje.filter(
      p => p.status === "presente"
    ).length;


  /*
   * =====================================================
   * CONVERTE HH:MM PARA MINUTOS
   * =====================================================
   */
  const horarioEmMinutos = (
    horario
  ) => {

    if (!horario) {
      return 0;
    }

    const [hora, minuto] =
      horario.split(":").map(Number);

    return (
      hora * 60 +
      minuto
    );

  };


  /*
   * =====================================================
   * HORÁRIO ATUAL
   * =====================================================
   */
  const agora = new Date();

  const minutosAgora =
    agora.getHours() * 60 +
    agora.getMinutes();


  /*
   * =====================================================
   * AULA ACONTECENDO AGORA
   * =====================================================
   *
   * AE já foi separado acima, então nunca será
   * considerada uma aula comum aqui.
   */
  const aulaAtual = useMemo(() => {

    return (
      aulasHoje.find(aula => {

        const inicio =
          horarioEmMinutos(
            aula.horario
          );

        const fim =
          inicio + 60;

        return (
          minutosAgora >= inicio &&
          minutosAgora < fim
        );

      }) || null
    );

  }, [
    aulasHoje,
    minutosAgora
  ]);


  /*
   * =====================================================
   * PRÓXIMA AULA
   * =====================================================
   */
  const proximaAula = useMemo(() => {

    return (
      aulasHoje.find(aula => {

        return (
          horarioEmMinutos(
            aula.horario
          ) > minutosAgora
        );

      }) || null
    );

  }, [
    aulasHoje,
    minutosAgora
  ]);


  /*
   * =====================================================
   * STATUS DA AULA
   * =====================================================
   */
  const obterStatusPresenca = (
    aula
  ) => {

    const registro =
      presencasHoje.find(
        presenca =>
          presenca.celula ===
          aula.celula
      );

    if (!registro) {
      return "pendente";
    }

    return registro.status;
  };


  /*
   * =====================================================
   * FORMATA HORÁRIO
   * =====================================================
   */
  const formatarHorario = (
    horario
  ) => {

    if (!horario) {
      return "--:--";
    }

    return horario;
  };


  /*
   * =====================================================
   * FORMATA DATA
   * =====================================================
   */
  const dataFormatada =
    hoje.toLocaleDateString(
      "pt-BR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long"
      }
    );


  return (

    <div className="tela-inicial">

      <div className="dashboard-header">

        <div>

          <h1>
            Olá, {professor?.nome || "Professor"}!
          </h1>

          <p>
            {dataFormatada}
          </p>

        </div>

        <button
          className="dashboard-presenca-btn"
          onClick={() =>
            navigate("/presenca")
          }
        >
          <FiCheckCircle />
          Registrar presença
        </button>

      </div>


      {/*
       * =====================================================
       * CARDS PRINCIPAIS
       * =====================================================
       */}
      <div className="dashboard-cards">

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiUsers />
          </div>

          <div>

            <span>
              Alunos
            </span>

            <strong>
              {carregando
                ? "..."
                : totalAlunos}
            </strong>

          </div>

        </div>


        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiCalendar />
          </div>

          <div>

            <span>
              Aulas hoje
            </span>

            <strong>
              {carregando
                ? "..."
                : totalAulasHoje}
            </strong>

          </div>

        </div>


        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiCheckCircle />
          </div>

          <div>

            <span>
              Presença hoje
            </span>

            <strong>
              {carregando
                ? "..."
                : totalPresentes}
            </strong>

          </div>

        </div>


        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            <FiClock />
          </div>

          <div>

            <span>
              Próxima aula
            </span>

            <strong>
              {proximaAula
                ? proximaAula.horario
                : "--:--"}
            </strong>

          </div>

        </div>

      </div>


      {/*
       * =====================================================
       * DESTAQUE DA AULA
       * =====================================================
       */}
      <div className="dashboard-destaque">

        {aulaAtual ? (

          <div className="destaque-conteudo aula-atual">

            <div className="destaque-label">
              AULA ACONTECENDO AGORA
            </div>

            <div className="destaque-info">

              <div>

                <h2>
                  {aulaAtual.nome ||
                    "Horário reservado"}
                </h2>

                <p>
                  {aulaAtual.instrumento ||
                    "Instrumento não informado"}
                </p>

              </div>

              <strong>
                {aulaAtual.horario}
              </strong>

            </div>

          </div>

        ) : proximaAula ? (

          <div className="destaque-conteudo aula-proxima">

            <div className="destaque-label">
              PRÓXIMA AULA
            </div>

            <div className="destaque-info">

              <div>

                <h2>
                  {proximaAula.nome ||
                    "Horário reservado"}
                </h2>

                <p>
                  {proximaAula.instrumento ||
                    "Instrumento não informado"}
                </p>

              </div>

              <strong>
                {proximaAula.horario}
              </strong>

            </div>

          </div>

        ) : (

          <div className="destaque-conteudo">

            <div className="destaque-label">
              AGENDA
            </div>

            <div className="destaque-info">

              <div>

                <h2>
                  Nenhuma aula restante hoje
                </h2>

                <p>
                  Você não possui mais aulas agendadas para hoje.
                </p>

              </div>

            </div>

          </div>

        )}

      </div>


      {/*
       * =====================================================
       * ÁREA RESERVADA PARA AULAS EXPERIMENTAIS
       * =====================================================
       *
       * A parte visual será feita no CSS/JSX na próxima
       * etapa. Os dados já estão separados em:
       *
       * aulasExperimentaisHoje
       *
       */}

       {aulasExperimentaisHoje.length > 0 && (
  <section className="dashboard-experimentais">

    <div className="experimentais-header">
      <div>
        <h2>🧪 Aulas Experimentais</h2>
        <p>Experimentos agendados para hoje</p>
      </div>
    </div>

    <div className="experimentais-list">

      {aulasExperimentaisHoje.map((aula) => (
        <div
          className="experimental-item"
          key={aula.celula}
        >
          <div className="experimental-time">
            {aula.horario}
          </div>

          <div className="experimental-info">
            <strong>
              {aula.nome || "Aluno experimental"}
            </strong>

            <span>
              {aula.idade
                ? `${aula.idade} anos`
                : "Idade não informada"}
            </span>
          </div>

          <div className="experimental-instrumento">
            {aula.instrumento === "guitarra" && "🎸"}
            {aula.instrumento === "violão" && "🎸"}
            {aula.instrumento === "teclado" && "🎹"}
            {aula.instrumento === "piano" && "🎹"}
            {aula.instrumento === "bateria" && "🥁"}
            {aula.instrumento === "canto" && "🎤"}
            {aula.instrumento === "violino" && "🎻"}
            {aula.instrumento === "ukulele" && "🪕"}

            <span>
              {aula.instrumento || "Instrumento não informado"}
            </span>
          </div>

          <div className="experimental-data">
            {aula.dataExperimental || "--/--"}
          </div>
        </div>
      ))}

    </div>
  </section>
)}


      <div className="dashboard-grid">

        {/*
         * =====================================================
         * AGENDA
         * =====================================================
         */}
        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Aulas de hoje
              </h2>

              <p>
                Sua agenda para hoje
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/presenca")
              }
            >
              Ver horário
              <FiArrowRight />
            </button>

          </div>


          <div className="agenda-list">

            {carregando ? (

              <div className="empty-state">
                Carregando aulas...
              </div>

            ) : aulasHoje.length === 0 ? (

              <div className="empty-state">

                <FiCalendar />

                <h3>
                  Nenhuma aula hoje
                </h3>

                <p>
                  Não há aulas cadastradas para hoje.
                </p>

              </div>

            ) : (

              aulasHoje.map(
                aula => {

                  const status =
                    obterStatusPresenca(
                      aula
                    );

                  return (

                    <div
                      className="agenda-item"
                      key={aula.celula}
                    >

                      <div className="agenda-time">
                        {formatarHorario(
                          aula.horario
                        )}
                      </div>

                      <div className="agenda-info">

                        <strong>
                          {aula.nome ||
                            "Horário disponível"}
                        </strong>

                        <span>
                          {aula.instrumento ||
                            "Sem instrumento"}
                        </span>

                      </div>

                      <div
                        className={`agenda-status ${status}`}
                      >
                        {status === "presente"
                          ? "Presente"
                          : status === "falta"
                            ? "Falta"
                            : "Pendente"}
                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>

        </section>


        {/*
         * =====================================================
         * ACESSOS RÁPIDOS
         * =====================================================
         */}
        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Acessos rápidos
              </h2>

              <p>
                Acesse as principais áreas
              </p>

            </div>

          </div>


          <div className="quick-actions">

            <button
              onClick={() =>
                navigate("/alunos")
              }
            >

              <FiUsers />

              <div>

                <strong>
                  Alunos
                </strong>

                <span>
                  Consultar alunos
                </span>

              </div>

              <FiArrowRight />

            </button>


            <button
              onClick={() =>
                navigate("/presenca")
              }
            >

              <FiCalendar />

              <div>

                <strong>
                  Horário
                </strong>

                <span>
                  Ver agenda e horários
                </span>

              </div>

              <FiArrowRight />

            </button>


            <button
              onClick={() =>
                navigate("/relatorio")
              }
            >

              <FiClipboard />

              <div>

                <strong>
                  Relatórios
                </strong>

                <span>
                  Consultar relatórios
                </span>

              </div>

              <FiArrowRight />

            </button>

          </div>

        </section>

      </div>

    </div>

  );
}

export default TelaInicial;