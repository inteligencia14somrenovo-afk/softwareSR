import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserGraduate,
  FaEnvelope,
} from "react-icons/fa";

import API_URL from "../../config/api";

import "./Professores.css";

const ProfessorDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [professor, setProfessor] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro("");

        const response = await fetch(
          `${API_URL}/professores/${id}/alunos`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensagem ||
              "Erro ao carregar os dados do professor."
          );
        }

        setProfessor(data.professor || null);
        setAlunos(data.alunos || []);
      } catch (error) {
        console.error(
          "❌ Erro ao carregar professor:",
          error
        );

        setErro(
          error.message ||
            "Erro ao carregar os dados do professor."
        );
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id]);

  if (carregando) {
    return (
      <div className="professores-page">
        <p>Carregando professor...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="professores-page">
        <div className="professores-erro">
          {erro}
        </div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="professores-page">
        <div className="professores-erro">
          Professor não encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="professores-page">

      <div className="professores-header">

        <div>
          <button
            type="button"
            onClick={() => navigate("/professores")}
          >
            <FaArrowLeft />
            Voltar
          </button>

          <h1>{professor.nome}</h1>

          <p>
            Informações do professor e seus alunos.
          </p>
        </div>

      </div>

      <div className="professor-card">

        <div className="professor-card-top">

          <div className="professor-avatar">

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

          <div className="professor-info">

            <h3>{professor.nome}</h3>

            <p>
              <FaEnvelope /> {professor.email}
            </p>

          </div>

        </div>

        <div className="professor-card-bottom">

          <div className="professor-alunos">

            <FaUserGraduate />

            <span>
              {alunos.length}{" "}
              {alunos.length === 1
                ? "aluno"
                : "alunos"}
            </span>

          </div>

        </div>

      </div>

      <div className="professores-header">
        <div>
          <h2>Alunos</h2>
          <p>
            Alunos vinculados a este professor.
          </p>
        </div>
      </div>

      <div className="professores-grid">

        {alunos.length === 0 ? (

          <div className="professores-vazio">

            <FaUserGraduate />

            <h3>
              Nenhum aluno encontrado
            </h3>

            <p>
              Este professor ainda não possui
              alunos cadastrados.
            </p>

          </div>

        ) : (

          alunos.map((aluno) => (

            <div
              key={aluno.id}
              className="professor-card"
            >

              <div className="professor-card-top">

                <div className="professor-avatar">

                  {aluno.foto ? (

                    <img
                      src={aluno.foto}
                      alt={aluno.nome}
                    />

                  ) : (

                    <span>
                      {aluno.nome
                        ? aluno.nome
                            .charAt(0)
                            .toUpperCase()
                        : "?"}
                    </span>

                  )}

                </div>

                <div className="professor-info">

                  <h3>
                    {aluno.nome || "Sem nome"}
                  </h3>

                  <p>
                    Código:{" "}
                    {aluno.codigo_aluno ||
                      "Não informado"}
                  </p>

                  <p>
                    Instrumento:{" "}
                    {aluno.instrumento ||
                      "Não informado"}
                  </p>

                </div>

              </div>

              <div className="professor-card-bottom">

                <span>
                  {aluno.status || "Sem status"}
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
};

export default ProfessorDetalhes;