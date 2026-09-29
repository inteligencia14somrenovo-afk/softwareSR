import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../config/api";

import "./Turmas.css";

function Turmas() {
  const {
    professor,
    carregando: carregandoProfessor,
  } = useAuth();

  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // =====================================================
  // PERFIL DE ACESSO
  // =====================================================

  const isAdminOuDev =
    professor?.role === "admin" ||
    professor?.role === "dev";

  const isProfessor =
    professor?.role === "professor";

  // =====================================================
  // CARREGAR TURMAS
  // =====================================================

  const carregarTurmas = async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/api/turmas/com-professores`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro ||
            "Não foi possível carregar as turmas."
        );
      }

      setTurmas(data.turmas || []);

    } catch (error) {
      console.error(
        "❌ Erro ao carregar turmas:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as turmas."
      );

      setTurmas([]);

    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // CARREGAR AO ABRIR
  // =====================================================

  useEffect(() => {
    if (carregandoProfessor || !professor) {
      return;
    }

    carregarTurmas();
  }, [
    professor,
    carregandoProfessor,
  ]);

  // =====================================================
  // TURMAS VISÍVEIS
  // =====================================================

  const turmasVisiveis =
    isAdminOuDev
      ? turmas
      : isProfessor
      ? turmas.filter(
          (turma) =>
            turma.professor?.id ===
            professor.id
        )
      : [];

  // =====================================================
  // CARREGAMENTO
  // =====================================================

  if (
    carregandoProfessor ||
    carregando
  ) {
    return (
      <div className="turmas-page">
        <div className="turmas-loading">
          Carregando turmas...
        </div>
      </div>
    );
  }

  // =====================================================
  // ERRO
  // =====================================================

  if (erro) {
    return (
      <div className="turmas-page">
        <div className="turmas-erro">

          <p>{erro}</p>

          <button
            type="button"
            onClick={carregarTurmas}
          >
            Tentar novamente
          </button>

        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="turmas-page">

      {/* CABEÇALHO */}

      <div className="turmas-header">

        <div>

          <h1>
            Turmas
          </h1>

          <p>
            {turmasVisiveis.length}{" "}
            {turmasVisiveis.length === 1
              ? "turma encontrada"
              : "turmas encontradas"}
          </p>

        </div>

      </div>

      {/* NENHUMA TURMA */}

      {turmasVisiveis.length === 0 ? (

        <div className="turmas-vazio">

          <p>
            {isProfessor
              ? "Você não possui turmas cadastradas."
              : "Nenhuma turma encontrada."}
          </p>

        </div>

      ) : (

        <div className="turmas-grid">

          {turmasVisiveis.map(
            (turma) => (

              <div
                className="turma-card"
                key={`${turma.tipo}-${turma.dia}-${turma.horario}-${turma.celulaCabecalho}`}
              >

                {/* TOPO */}

                <div className="turma-card-topo">

                  <span className="turma-tipo">
                    {turma.tipo}
                  </span>

                  <span className="turma-horario">
                    {turma.horario}
                  </span>

                </div>

                {/* DIA */}

                <div className="turma-dia">
                  {turma.dia}
                </div>

                {/* PROFESSOR */}

                <div className="turma-professor">

                  <span className="turma-label">
                    Professor
                  </span>

                  <strong>
                    {turma.professor?.nome ||
                      "Professor não definido"}
                  </strong>

                </div>

                {/* ALUNOS */}

                <div className="turma-alunos-resumo">

                  <span className="turma-label">
                    Alunos
                  </span>

                  <strong>
                    {turma.totalAlunos}
                  </strong>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default Turmas;