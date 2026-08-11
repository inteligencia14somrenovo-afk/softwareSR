import { useState } from "react";

function Responsaveis({ aluno, onAdicionar, onExcluir, onEditar}) {
  const [showForm, setShowForm] = useState(false);

  const [responsavelSelecionado, setResponsavelSelecionado] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [responsavelEditando, setResponsavelEditando] = useState(null);

  const [novoResponsavel, setNovoResponsavel] = useState({
    nome: "",
    telefone: "",
    foto: ""
  });

  const salvar = () => {
    if (
      !novoResponsavel.nome.trim() ||
      !novoResponsavel.telefone.trim()
    ) {
      alert("Preencha o nome e o telefone do responsável.");
      return;
    }

    const responsavel = {
      id: Date.now(),
      nome: novoResponsavel.nome.trim(),
      telefone: novoResponsavel.telefone.trim(),
      foto: novoResponsavel.foto || ""
    };

        if (responsavelEditando) {
      onEditar({
        ...responsavelEditando,
        nome: novoResponsavel.nome.trim(),
        telefone: novoResponsavel.telefone.trim(),
        foto: novoResponsavel.foto || ""
      });
    } else {
      onAdicionar(responsavel);
    }

    setNovoResponsavel({
      nome: "",
      telefone: "",
      foto: ""
    });

    setResponsavelEditando(null);
    
    setShowForm(false);
  };

  const cancelar = () => {
    setShowForm(false);

    setResponsavelEditando(null);

    setNovoResponsavel({
      nome: "",
      telefone: "",
      foto: ""
    });
  };

  

  return (
    <div className="responsaveis-lista">

      <div className="responsaveis-scroll">
        {(aluno.responsaveis || []).map((responsavel) => (
          <div
            className="responsavel-card"
            key={responsavel.id}
            onClick={() => setResponsavelSelecionado(responsavel)}
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
              <strong>{responsavel.nome}</strong>
              <span>📱 {responsavel.telefone}</span>
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
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setResponsavelEditando(responsavel);
                setNovoResponsavel({
                  nome: responsavel.nome,
                  telefone: responsavel.telefone,
                  foto: responsavel.foto || ""
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
                onExcluir(responsavel.id);
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
            : "Novo responsável" }
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
              const arquivo = e.target.files[0];

              if (!arquivo) return;

              const leitor = new FileReader();

              leitor.onloadend = () => {
                setNovoResponsavel({
                  ...novoResponsavel,
                  foto: leitor.result
                });
              };

              leitor.readAsDataURL(arquivo);
            }}
          />

          <div className="responsavel-form-acoes">
            <button
              type="button"
              onClick={salvar}
            >
              {responsavelEditando
              ? "Salvar alterações"
              : "Salvar responsável"}
            </button>

            <button
              type="button"
              onClick={cancelar}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {responsavelSelecionado && (
          <div
            className="responsavel-overlay"
            onClick={() => setResponsavelSelecionado(null)}
          >
            <div
              className="responsavel-detalhes"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="responsavel-fechar"
                onClick={() => setResponsavelSelecionado(null)}
              >
                ×
              </button>

              <div className="responsavel-foto-grande">
                {responsavelSelecionado.foto ? (
                  <img
                    src={responsavelSelecionado.foto}
                    alt={responsavelSelecionado.nome}
                  />
                ) : (
                  "👤"
                )}
              </div>

              <h3>{responsavelSelecionado.nome}</h3>

              <p>
                📱 {responsavelSelecionado.telefone}
              </p>
            </div>
          </div>
        )}
    </div>
  );
}

export default Responsaveis;