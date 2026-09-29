import { useEffect, useState } from "react";
import "./Turmas.css";

function Turmas() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarTurmas();
  }, []);

  async function carregarTurmas() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch("/api/turmas/com-professores");

      if (!resposta.ok) {
        throw new Error("Erro ao buscar turmas.");
      }

      const dados = await resposta.json();

      setTurmas(dados.turmas || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      setErro("Não foi possível carregar as turmas.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="turmas-page">
        <div className="turmas-loading">
          Carregando turmas...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="turmas-page">
        <div className="turmas-erro">
          <p>{erro}</p>

          <button onClick={carregarTurmas}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="turmas-page">
      <div className="turmas-header">
        <div>
          <h1>Turmas</h1>

          <p>
            {turmas.length}{" "}
            {turmas.length === 1 ? "turma encontrada" : "turmas encontradas"}
          </p>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="turmas-vazio">
          <p>Nenhuma turma encontrada.</p>
        </div>
      ) : (
        <div className="turmas-grid">
          {turmas.map((turma) => (
            <div
              className="turma-card"
              key={`${turma.tipo}-${turma.dia}-${turma.horario}-${turma.celulaCabecalho}`}
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
                  {turma.professor?.nome || "Professor não definido"}
                </strong>
              </div>

              <div className="turma-alunos-resumo">
                <span className="turma-label">
                  Alunos
                </span>

                <strong>
                  {turma.totalAlunos}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Turmas;