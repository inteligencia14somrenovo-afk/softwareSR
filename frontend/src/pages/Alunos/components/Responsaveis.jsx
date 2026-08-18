import { useEffect, useState } from "react";
import API_URL from "../../../config/api";

function Responsaveis({
  aluno,
  onAdicionar,
  onExcluir,
  onEditar
}) {
  const [showForm, setShowForm] = useState(false);

  const [responsavelSelecionado, setResponsavelSelecionado] =
    useState(null);

  const [menuAberto, setMenuAberto] = useState(null);

  const [responsavelEditando, setResponsavelEditando] =
    useState(null);

  const [novoResponsavel, setNovoResponsavel] = useState({
    nome: "",
    telefone: "",
    foto: ""
  });

  const [carregando, setCarregando] = useState(false);

  // =====================================================
  // CARREGAR RESPONSÁVEIS DO BANCO
  // =====================================================

  useEffect(() => {
    const carregarResponsaveis = async () => {
      if (!aluno?.id) {
        return;
      }

      try {
        setCarregando(true);

        const response = await fetch(
          `${API_URL}/alunos/${aluno.id}/responsaveis`,
          {
            credentials: "include"
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensagem ||
            "Não foi possível carregar os responsáveis."
          );
        }

        // Atualiza o aluno no estado do Alunos.jsx
        if (onAdicionar) {
          // Não usamos onAdicionar aqui porque ele adicionaria
          // um responsável por vez.
          // O estado inicial será atualizado pelo próprio Alunos.jsx
          // quando o componente receber os dados.
        }

        // Atualiza apenas a representação local do aluno
        // através de um evento personalizado não é necessário.
        // Os responsáveis serão sincronizados abaixo.
        if (Array.isArray(data.responsaveis)) {
          setResponsavelSelecionado(null);

          // Mantém os responsáveis disponíveis no componente
          setResponsaveisLocais(data.responsaveis);
        }

      } catch (error) {
        console.error(
          "❌ Erro ao carregar responsáveis:",
          error
        );

        alert(
          error.message ||
          "Não foi possível carregar os responsáveis."
        );

      } finally {
        setCarregando(false);
      }
    };

    carregarResponsaveis();
  }, [aluno?.id]);

  // =====================================================
  // RESPONSÁVEIS LOCAIS
  // =====================================================

  const [responsaveisLocais, setResponsaveisLocais] =
    useState(aluno?.responsaveis || []);

  // Mantém sincronizado quando o aluno muda
  useEffect(() => {
    setResponsaveisLocais(aluno?.responsaveis || []);
  }, [aluno?.id]);

  // =====================================================
  // SALVAR RESPONSÁVEL
  // =====================================================

  const salvar = async () => {
    if (
      !novoResponsavel.nome.trim() ||
      !novoResponsavel.telefone.trim()
    ) {
      alert(
        "Preencha o nome e o telefone do responsável."
      );

      return;
    }

    if (!aluno?.id) {
      alert("Aluno não identificado.");

      return;
    }

    try {
      setCarregando(true);

      // =================================================
      // EDITAR
      // =================================================

      if (responsavelEditando) {
        const response = await fetch(
          `${API_URL}/responsaveis/${responsavelEditando.id}`,
          {
            method: "PUT",

            credentials: "include",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              nome: novoResponsavel.nome.trim(),
              telefone: novoResponsavel.telefone.trim(),
              foto: novoResponsavel.foto || null
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensagem ||
            "Não foi possível atualizar o responsável."
          );
        }

        const responsavelAtualizado =
          data.responsavel;

        setResponsaveisLocais((responsaveisAtuais) =>
          responsaveisAtuais.map((responsavel) =>
            responsavel.id === responsavelAtualizado.id
              ? responsavelAtualizado
              : responsavel
          )
        );

        if (onEditar) {
          onEditar(responsavelAtualizado);
        }

      }

      // =================================================
      // NOVO RESPONSÁVEL
      // =================================================

      else {
        const response = await fetch(
          `${API_URL}/alunos/${aluno.id}/responsaveis`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              nome: novoResponsavel.nome.trim(),
              telefone: novoResponsavel.telefone.trim(),
              foto: novoResponsavel.foto || null
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensagem ||
            "Não foi possível cadastrar o responsável."
          );
        }

        const responsavelCriado =
          data.responsavel;

        setResponsaveisLocais(
          (responsaveisAtuais) => [
            ...responsaveisAtuais,
            responsavelCriado
          ]
        );

        if (onAdicionar) {
          onAdicionar(responsavelCriado);
        }
      }

      // =================================================
      // LIMPA FORMULÁRIO
      // =================================================

      setNovoResponsavel({
        nome: "",
        telefone: "",
        foto: ""
      });

      setResponsavelEditando(null);
      setShowForm(false);

    } catch (error) {
      console.error(
        "❌ Erro ao salvar responsável:",
        error
      );

      alert(
        error.message ||
        "Não foi possível salvar o responsável."
      );

    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // EXCLUIR RESPONSÁVEL
  // =====================================================

  const excluir = async (responsavelId) => {
    const confirmar = window.confirm(
      "Deseja realmente excluir este responsável?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(
        `${API_URL}/responsaveis/${responsavelId}`,
        {
          method: "DELETE",

          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
          "Não foi possível excluir o responsável."
        );
      }

      setResponsaveisLocais(
        (responsaveisAtuais) =>
          responsaveisAtuais.filter(
            (responsavel) =>
              responsavel.id !== responsavelId
          )
      );

      if (onExcluir) {
        onExcluir(responsavelId);
      }

      if (
        responsavelSelecionado?.id === responsavelId
      ) {
        setResponsavelSelecionado(null);
      }

    } catch (error) {
      console.error(
        "❌ Erro ao excluir responsável:",
        error
      );

      alert(
        error.message ||
        "Não foi possível excluir o responsável."
      );

    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // CANCELAR
  // =====================================================

  const cancelar = () => {
    setShowForm(false);

    setResponsavelEditando(null);

    setNovoResponsavel({
      nome: "",
      telefone: "",
      foto: ""
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="responsaveis-lista">

      {carregando && (
        <p className="responsaveis-carregando">
          Carregando...
        </p>
      )}

      <div className="responsaveis-scroll">

        {responsaveisLocais.map((responsavel) => (

          <div
            className="responsavel-card"
            key={responsavel.id}
            onClick={() =>
              setResponsavelSelecionado(
                responsavel
              )
            }
          >

            <div className="responsavel-foto">

              {responsavel.foto ? (

                <img
                  src={responsavel.foto}
                  alt={responsavel.nome}
                />

              ) : (

                "👤"

              )}

            </div>


            <div className="responsavel-dados">

              <strong>
                {responsavel.nome}
              </strong>

              <span>
                📱 {responsavel.telefone}
              </span>

            </div>


            <div className="responsavel-menu-container">

              <button
                type="button"
                className="responsavel-menu"
                onClick={(e) => {

                  e.stopPropagation();

                  setMenuAberto(
                    menuAberto === responsavel.id
                      ? null
                      : responsavel.id
                  );

                }}
              >
                ⋮
              </button>


              {menuAberto === responsavel.id && (

                <div
                  className="responsavel-menu-opcoes"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >

                  <button
                    type="button"
                    onClick={() => {

                      setResponsavelEditando(
                        responsavel
                      );

                      setNovoResponsavel({
                        nome: responsavel.nome,
                        telefone:
                          responsavel.telefone,
                        foto:
                          responsavel.foto || ""
                      });

                      setMenuAberto(null);

                      setShowForm(true);

                    }}
                  >
                    ✏️ Editar
                  </button>


                  <button
                    type="button"
                    className="opcao-excluir"
                    onClick={() => {

                      setMenuAberto(null);

                      excluir(
                        responsavel.id
                      );

                    }}
                  >
                    🗑️ Excluir
                  </button>

                </div>

              )}

            </div>

          </div>

        ))}

      </div>


      {!showForm && (

        <button
          type="button"
          className="btn-adicionar-responsavel"
          onClick={() => setShowForm(true)}
        >
          + Adicionar responsável
        </button>

      )}


      {showForm && (

        <div className="responsavel-form">

          <h4>
            {responsavelEditando
              ? "Editar responsável"
              : "Novo responsável"}
          </h4>


          <input
            type="text"
            placeholder="Nome completo"
            value={novoResponsavel.nome}
            onChange={(e) =>
              setNovoResponsavel({
                ...novoResponsavel,
                nome: e.target.value
              })
            }
          />


          <input
            type="tel"
            placeholder="Telefone"
            value={novoResponsavel.telefone}
            onChange={(e) =>
              setNovoResponsavel({
                ...novoResponsavel,
                telefone: e.target.value
              })
            }
          />


          <input
            type="file"
            accept="image/*"
            onChange={(e) => {

              const arquivo =
                e.target.files[0];

              if (!arquivo) {
                return;
              }

              const leitor =
                new FileReader();

              leitor.onloadend = () => {

                setNovoResponsavel({
                  ...novoResponsavel,
                  foto: leitor.result
                });

              };

              leitor.readAsDataURL(
                arquivo
              );

            }}
          />


          <div className="responsavel-form-acoes">

            <button
              type="button"
              onClick={salvar}
              disabled={carregando}
            >
              {carregando
                ? "Salvando..."
                : responsavelEditando
                  ? "Salvar alterações"
                  : "Salvar responsável"}
            </button>


            <button
              type="button"
              onClick={cancelar}
              disabled={carregando}
            >
              Cancelar
            </button>

          </div>

        </div>

      )}


      {responsavelSelecionado && (

        <div
          className="responsavel-overlay"
          onClick={() =>
            setResponsavelSelecionado(null)
          }
        >

          <div
            className="responsavel-detalhes"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="responsavel-fechar"
              onClick={() =>
                setResponsavelSelecionado(null)
              }
            >
              ×
            </button>


            <div className="responsavel-foto-grande">

              {responsavelSelecionado.foto ? (

                <img
                  src={
                    responsavelSelecionado.foto
                  }
                  alt={
                    responsavelSelecionado.nome
                  }
                />

              ) : (

                "👤"

              )}

            </div>


            <h3>
              {responsavelSelecionado.nome}
            </h3>


            <p>
              📱{" "}
              {responsavelSelecionado.telefone}
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default Responsaveis;