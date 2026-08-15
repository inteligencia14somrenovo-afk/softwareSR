import { useState } from "react";
import { GoPlus, GoPencil, GoTrash, GoPeople, GoCalendar } from "react-icons/go";
import { FaMusic } from "react-icons/fa";
import "./Bandas.css";

function Bandas() {
  const [bandas, setBandas] = useState(() => {
    const salvas = localStorage.getItem("bandas");
    return salvas ? JSON.parse(salvas) : [];
  });

  const [alunos] = useState(() => {
    const salvos = localStorage.getItem("alunos");
    return salvos ? JSON.parse(salvos) : [];
  });

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    nome: "",
    estilo: "",
    descricao: "",
    professor: "",
    status: "Ativa"
  });

  const salvarBandas = (dados) => {
    setBandas(dados);
    localStorage.setItem("bandas", JSON.stringify(dados));
  };

  const limparForm = () => {
    setForm({
      nome: "",
      estilo: "",
      descricao: "",
      professor: "",
      status: "Ativa"
    });
    setEditando(null);
  };

  const abrirNovaBanda = () => {
    limparForm();
    setMostrarForm(true);
  };

  const editarBanda = (banda) => {
    setForm({
      nome: banda.nome,
      estilo: banda.estilo || "",
      descricao: banda.descricao || "",
      professor: banda.professor || "",
      status: banda.status || "Ativa"
    });
    setEditando(banda.id);
    setMostrarForm(true);
  };

  const salvarBanda = (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Digite o nome da banda.");
      return;
    }

    if (editando) {
      salvarBandas(
        bandas.map((banda) =>
          banda.id === editando
            ? { ...banda, ...form }
            : banda
        )
      );
    } else {
      salvarBandas([
        ...bandas,
        {
          id: Date.now(),
          ...form,
          integrantes: [],
          ensaios: []
        }
      ]);
    }

    limparForm();
    setMostrarForm(false);
  };

  const excluirBanda = (id) => {
    if (!window.confirm("Deseja excluir esta banda?")) return;

    salvarBandas(
      bandas.filter((banda) => banda.id !== id)
    );

    if (mostrarDetalhes === id) {
      setMostrarDetalhes(null);
    }
  };

  const adicionarIntegrante = (bandaId, alunoId, instrumento) => {
    if (!alunoId || !instrumento.trim()) return;

    salvarBandas(
      bandas.map((banda) =>
        banda.id === bandaId
          ? {
              ...banda,
              integrantes: [
                ...(banda.integrantes || []),
                {
                  id: Date.now(),
                  alunoId: Number(alunoId),
                  instrumento
                }
              ]
            }
          : banda
      )
    );
  };

  const removerIntegrante = (bandaId, integranteId) => {
    salvarBandas(
      bandas.map((banda) =>
        banda.id === bandaId
          ? {
              ...banda,
              integrantes: (banda.integrantes || []).filter(
                (integrante) => integrante.id !== integranteId
              )
            }
          : banda
      )
    );
  };

  const adicionarEnsaio = (bandaId) => {
    const data = prompt("Data do ensaio:");
    if (!data) return;

    const horario = prompt("Horário do ensaio:");
    if (!horario) return;

    salvarBandas(
      bandas.map((banda) =>
        banda.id === bandaId
          ? {
              ...banda,
              ensaios: [
                ...(banda.ensaios || []),
                {
                  id: Date.now(),
                  data,
                  horario
                }
              ]
            }
          : banda
      )
    );
  };

  const removerEnsaio = (bandaId, ensaioId) => {
    salvarBandas(
      bandas.map((banda) =>
        banda.id === bandaId
          ? {
              ...banda,
              ensaios: (banda.ensaios || []).filter(
                (ensaio) => ensaio.id !== ensaioId
              )
            }
          : banda
      )
    );
  };

  const encontrarAluno = (id) =>
    alunos.find((aluno) => aluno.id === Number(id));

  const bandasFiltradas = bandas.filter((banda) =>
    banda.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalIntegrantes = bandas.reduce(
    (total, banda) =>
      total + (banda.integrantes?.length || 0),
    0
  );

  const bandasAtivas = bandas.filter(
    (banda) => banda.status === "Ativa"
  ).length;

  return (
    <div className="bandas">
      <header className="bandas-header">
        <div>
          <h1>Bandas</h1>
          <p>Formações musicais e ensaios da escola</p>
        </div>

        <button className="btn-nova-banda" onClick={abrirNovaBanda}>
          <GoPlus />
          Nova banda
        </button>
      </header>

      <div className="bandas-resumo">
        <div className="resumo-card">
          <FaMusic />
          <div>
            <strong>{bandas.length}</strong>
            <span>Bandas</span>
          </div>
        </div>

        <div className="resumo-card">
          <GoPeople />
          <div>
            <strong>{totalIntegrantes}</strong>
            <span>Integrantes</span>
          </div>
        </div>

        <div className="resumo-card">
          <FaMusic />
          <div>
            <strong>{bandasAtivas}</strong>
            <span>Ativas</span>
          </div>
        </div>
      </div>

      <div className="bandas-ferramentas">
        <input
          type="text"
          placeholder="Pesquisar banda..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {mostrarForm && (
        <div className="banda-form-container">
          <form className="banda-form" onSubmit={salvarBanda}>
            <div className="form-header">
              <div>
                <h2>
                  {editando ? "Editar banda" : "Nova banda"}
                </h2>
                <p>Informações básicas da formação</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  limparForm();
                  setMostrarForm(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Nome da banda *
                <input
                  value={form.nome}
                  onChange={(e) =>
                    setForm({ ...form, nome: e.target.value })
                  }
                  placeholder="Ex: Banda Renovo"
                />
              </label>

              <label>
                Estilo musical
                <input
                  value={form.estilo}
                  onChange={(e) =>
                    setForm({ ...form, estilo: e.target.value })
                  }
                  placeholder="Ex: Gospel, Rock..."
                />
              </label>

              <label>
                Professor responsável
                <input
                  value={form.professor}
                  onChange={(e) =>
                    setForm({ ...form, professor: e.target.value })
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option>Ativa</option>
                  <option>Inativa</option>
                  <option>Em preparação</option>
                </select>
              </label>

              <label className="campo-descricao">
                Descrição
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descricao: e.target.value
                    })
                  }
                  placeholder="Informações sobre a banda..."
                />
              </label>
            </div>

            <div className="form-acoes">
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => {
                  limparForm();
                  setMostrarForm(false);
                }}
              >
                Cancelar
              </button>

              <button type="submit" className="btn-salvar">
                {editando ? "Salvar alterações" : "Cadastrar banda"}
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="bandas-lista">
        {bandasFiltradas.length === 0 ? (
          <div className="bandas-vazia">
            <FaMusic />
            <h2>Nenhuma banda encontrada</h2>
            <p>Cadastre uma banda para começar.</p>
          </div>
        ) : (
          bandasFiltradas.map((banda) => {
            const aberta = mostrarDetalhes === banda.id;

            return (
              <article className="banda-card" key={banda.id}>
                <div className="banda-icone">
                  <FaMusic />
                </div>

                <div className="banda-info">
                  <div className="banda-titulo">
                    <h2>{banda.nome}</h2>

                    <span
                      className={`status ${
                        banda.status === "Ativa"
                          ? "ativa"
                          : "inativa"
                      }`}
                    >
                      {banda.status}
                    </span>
                  </div>

                  <span className="banda-estilo">
                    {banda.estilo || "Estilo não informado"}
                  </span>

                  <p>
                    {banda.descricao ||
                      "Nenhuma descrição cadastrada."}
                  </p>

                  <div className="banda-detalhes">
                    <span>
                      <GoPeople />
                      {banda.integrantes?.length || 0} integrantes
                    </span>

                    <span>
                      <GoCalendar />
                      {banda.ensaios?.length || 0} ensaios
                    </span>
                  </div>

                  {aberta && (
                    <div className="banda-detalhes-painel">
                      <h3>Integrantes</h3>

                      {banda.integrantes?.length ? (
                        banda.integrantes.map((integrante) => {
                          const aluno = encontrarAluno(
                            integrante.alunoId
                          );

                          return (
                            <div
                              className="integrante"
                              key={integrante.id}
                            >
                              <span>
                                {aluno?.nome || "Aluno removido"}
                              </span>

                              <small>
                                {integrante.instrumento}
                              </small>

                              <button
                                onClick={() =>
                                  removerIntegrante(
                                    banda.id,
                                    integrante.id
                                  )
                                }
                              >
                                <GoTrash />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p>Nenhum integrante cadastrado.</p>
                      )}

                      <div className="adicionar-integrante">
                        <select id={`aluno-${banda.id}`}>
                          <option value="">
                            Selecionar aluno
                          </option>

                          {alunos.map((aluno) => (
                            <option
                              key={aluno.id}
                              value={aluno.id}
                            >
                              {aluno.nome}
                            </option>
                          ))}
                        </select>

                        <input
                          id={`instrumento-${banda.id}`}
                          placeholder="Instrumento"
                        />

                        <button
                          onClick={() => {
                            const aluno = document.getElementById(
                              `aluno-${banda.id}`
                            ).value;

                            const instrumento =
                              document.getElementById(
                                `instrumento-${banda.id}`
                              ).value;

                            adicionarIntegrante(
                              banda.id,
                              aluno,
                              instrumento
                            );
                          }}
                        >
                          <GoPlus />
                        </button>
                      </div>

                      <h3>Ensaios</h3>

                      {banda.ensaios?.length ? (
                        banda.ensaios.map((ensaio) => (
                          <div
                            className="ensaio"
                            key={ensaio.id}
                          >
                            <span>
                              {ensaio.data}
                            </span>

                            <small>
                              {ensaio.horario}
                            </small>

                            <button
                              onClick={() =>
                                removerEnsaio(
                                  banda.id,
                                  ensaio.id
                                )
                              }
                            >
                              <GoTrash />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p>Nenhum ensaio agendado.</p>
                      )}

                      <button
                        className="btn-ensaio"
                        onClick={() =>
                          adicionarEnsaio(banda.id)
                        }
                      >
                        <GoCalendar />
                        Adicionar ensaio
                      </button>
                    </div>
                  )}
                </div>

                <div className="banda-acoes">
                  <button
                    title="Detalhes"
                    onClick={() =>
                      setMostrarDetalhes(
                        aberta ? null : banda.id
                      )
                    }
                  >
                    <GoPeople />
                  </button>

                  <button
                    title="Editar"
                    onClick={() => editarBanda(banda)}
                  >
                    <GoPencil />
                  </button>

                  <button
                    title="Excluir"
                    className="excluir"
                    onClick={() => excluirBanda(banda.id)}
                  >
                    <GoTrash />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export default Bandas;