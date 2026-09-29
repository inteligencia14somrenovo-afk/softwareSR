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
  const [turmaSelecionada, setTurmaSelecionada] =
    useState(null);

  const isAdminOuDev =
    professor?.role === "admin" ||
    professor?.role === "dev";

  const isProfessor =
    professor?.role === "professor";

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
  // FECHAR MODAL COM ESC
  // =====================================================

  useEffect(() => {
    if (!turmaSelecionada) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setTurmaSelecionada(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [turmaSelecionada]);

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
  // SEPARAR POR TIPO
  // =====================================================

  const turmasTeoria =
    turmasVisiveis.filter(
      (turma) =>
        turma.tipo === "TEORIA"
    );

  const turmasMusicalizacao =
    turmasVisiveis.filter(
      (turma) =>
        turma.tipo === "MUSICALIZAÇÃO"
    );

  // =====================================================
  // CARD
  // =====================================================

  const renderizarTurma = (turma) => {
    const temExcecao =
      turma.tipoVinculo ===
      "excecao_data";

    return (
      <div
        className={`turma-card ${
          temExcecao
            ? "turma-card-excecao"
            : ""
        }`}
        role="button"
        tabIndex={0}
        onClick={() =>
          setTurmaSelecionada(turma)
        }
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            setTurmaSelecionada(turma);
          }
        }}
      >
        <div className="turma-card-topo">
          <span className="turma-tipo">
            {turma.tipo}
          </span>

          <span className="turma-horario">
            {turma.horario}
          </span>
        </div>

        <div className="turma-dia">
          {turma.dia}
        </div>

        <div className="turma-professor">
          <span className="turma-label">
            Professor
          </span>

          <strong>
            {turma.professor?.nome ||
              "Professor não definido"}
          </strong>

          {turma.tipoVinculo ===
            "excecao_data" &&
            turma.motivoExcecao?.length >
              0 && (
              <div className="turma-excecao-motivo">
                {turma.motivoExcecao.map(
                  (motivo) => (
                    <span
                      key={motivo.data}
                    >
                      {motivo.data}:{" "}
                      {motivo.descricao}
                    </span>
                  )
                )}
              </div>
            )}
        </div>

        <div className="turma-alunos-resumo">
          <span className="turma-label">
            Alunos
          </span>

          <strong>
            {turma.totalAlunos}
          </strong>
        </div>

        {temExcecao && (
          <div className="turma-excecao-resumo">
            Responsável definido por data
          </div>
        )}

        <div className="turma-card-abrir">
          Ver detalhes →
        </div>
      </div>
    );
  };

  // =====================================================
  // MODAL
  // =====================================================

  const renderizarModal = () => {
    if (!turmaSelecionada) {
      return null;
    }

    const turma =
      turmaSelecionada;

    const temExcecao =
      turma.tipoVinculo ===
      "excecao_data";

    return (
      <div
        className="turma-modal-overlay"
        onClick={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            setTurmaSelecionada(null);
          }
        }}
      >
        <div
          className="turma-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="turma-modal-titulo"
        >
          <div className="turma-modal-header">
            <div>
              <span className="turma-modal-tipo">
                {turma.tipo}
              </span>

              <h2 id="turma-modal-titulo">
                {turma.dia} às{" "}
                {turma.horario}
              </h2>
            </div>

            <button
              type="button"
              className="turma-modal-fechar"
              onClick={() =>
                setTurmaSelecionada(null)
              }
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          <div className="turma-modal-conteudo">
            {/* PROFESSOR */}

            <section className="turma-modal-secao">
              <span className="turma-label">
                Professor
              </span>

              <strong className="turma-modal-professor">
                {turma.professor?.nome ||
                  "Professor não definido"}
              </strong>

              {turma.professor?.email && (
                <span className="turma-modal-email">
                  {turma.professor.email}
                </span>
              )}
            </section>

            {/* EXCEÇÃO */}

            {temExcecao && (
              <section className="turma-modal-secao turma-modal-excecao">
                <div className="turma-modal-excecao-titulo">
                  Exceção de data
                </div>

                {turma.motivoExcecao?.length >
                0 ? (
                  turma.motivoExcecao.map(
                    (motivo) => (
                      <div
                        className="turma-modal-excecao-item"
                        key={motivo.data}
                      >
                        <strong>
                          {motivo.data}
                        </strong>

                        <span>
                          {motivo.descricao}{" "}
                          {turma.professor
                            ?.nome ||
                            "Professor"}{" "}
                          fica responsável
                          pela turma nesta
                          data.
                        </span>
                      </div>
                    )
                  )
                ) : (
                  turma.datasResolvidas?.map(
                    (data) => (
                      <div
                        className="turma-modal-excecao-item"
                        key={data}
                      >
                        <strong>
                          {data}
                        </strong>

                        <span>
                          {turma.professor
                            ?.nome ||
                            "Professor"}{" "}
                          fica responsável
                          pela turma nesta
                          data.
                        </span>
                      </div>
                    )
                  )
                )}

                {turma.professorAE && (
                  <div className="turma-modal-ae">
                    <span className="turma-label">
                      Aula experimental
                    </span>

                    <strong>
                      {turma.professorAE.nome}
                    </strong>
                  </div>
                )}
              </section>
            )}

            {/* ALUNOS */}

            <section className="turma-modal-secao">
              <div className="turma-modal-alunos-header">
                <div>
                  <span className="turma-label">
                    Alunos
                  </span>

                  <strong>
                    {turma.totalAlunos}
                  </strong>
                </div>
              </div>

              {turma.alunos?.length > 0 ? (
                <div className="turma-modal-alunos">
                  {turma.alunos.map(
                    (aluno) => (
                      <div
                        className="turma-modal-aluno"
                        key={`${aluno.codigo}-${aluno.nome}`}
                      >
                        <span className="turma-aluno-codigo">
                          {aluno.codigo}
                        </span>

                        <span className="turma-aluno-nome">
                          {aluno.nome ||
                            "Nome não informado"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="turma-modal-sem-alunos">
                  Nenhum aluno cadastrado.
                </div>
              )}
            </section>

            {/* STATUS DO VÍNCULO */}

            <section className="turma-modal-status">
              {turma.tipoVinculo ===
                "normal" && (
                <span>
                  Professor definido
                  normalmente pelo
                  horário.
                </span>
              )}

              {turma.tipoVinculo ===
                "excecao_data" && (
                <span>
                  Professor definido
                  através de uma
                  exceção de data na
                  planilha.
                </span>
              )}

              {turma.tipoVinculo ===
                "ambiguo" && (
                <span>
                  Existem múltiplos
                  professores para
                  este horário.
                </span>
              )}

              {turma.tipoVinculo ===
                "sem_professor" && (
                <span>
                  Nenhum professor foi
                  encontrado para este
                  horário.
                </span>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // LOADING
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
  // TELA
  // =====================================================

  return (
    <div className="turmas-page">
      <div className="turmas-header">
        <div>
          <h1>Turmas</h1>

          <p>
            {turmasVisiveis.length}{" "}
            {turmasVisiveis.length === 1
              ? "turma encontrada"
              : "turmas encontradas"}
          </p>
        </div>
      </div>

      {turmasVisiveis.length === 0 ? (
        <div className="turmas-vazio">
          <p>
            {isProfessor
              ? "Você não possui turmas cadastradas."
              : "Nenhuma turma encontrada."}
          </p>
        </div>
      ) : (
        <div className="turmas-secoes">
          {/* =================================================
              TEORIA
          ================================================= */}

          {turmasTeoria.length > 0 && (
            <section className="turmas-secao">
              <h2 className="turmas-secao-titulo">
                TEORIA
              </h2>

              <div className="turmas-grid">
                {turmasTeoria.map(
                  (turma) =>
                    renderizarTurma(
                      turma
                    )
                )}
              </div>
            </section>
          )}

          {/* =================================================
              MUSICALIZAÇÃO
          ================================================= */}

          {turmasMusicalizacao.length >
            0 && (
            <section className="turmas-secao">
              <h2 className="turmas-secao-titulo">
                MUSICALIZAÇÃO
              </h2>

              <div className="turmas-grid">
                {turmasMusicalizacao.map(
                  (turma) =>
                    renderizarTurma(
                      turma
                    )
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {renderizarModal()}
    </div>
  );
}

export default Turmas;