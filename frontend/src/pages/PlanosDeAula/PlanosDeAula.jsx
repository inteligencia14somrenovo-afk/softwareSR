import { useEffect, useMemo, useState } from "react";
import { GoBook, GoChevronDown, GoChevronRight, GoPlus } from "react-icons/go";
import { FaMusic } from "react-icons/fa";
import "./PlanosDeAula.css";

function PlanosDeAula() {
  const [alunos, setAlunos] = useState(() => {
    const salvos = localStorage.getItem("alunos");
    return salvos ? JSON.parse(salvos) : [];
  });

  const [instrumentos, setInstrumentos] = useState(() => {
    const salvos = localStorage.getItem("instrumentosProfessor");
    return salvos
      ? JSON.parse(salvos)
      : ["Violão", "Guitarra", "Bateria", "Ukulele"];
  });

  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const [progresso, setProgresso] = useState([]);
  const [repertorio, setRepertorio] = useState([]);
  const [planos, setPlanos] = useState([]);

  const [mostrarInstrumentos, setMostrarInstrumentos] = useState(true);

  useEffect(() => {
    const atualizarAlunos = () => {
      const salvos = localStorage.getItem("alunos");
      setAlunos(salvos ? JSON.parse(salvos) : []);
    };

    window.addEventListener("alunosAtualizados", atualizarAlunos);

    return () => {
      window.removeEventListener("alunosAtualizados", atualizarAlunos);
    };
  }, []);

  useEffect(() => {
    const atualizarInstrumentos = () => {
      const salvos = localStorage.getItem("instrumentosProfessor");

      if (salvos) {
        setInstrumentos(JSON.parse(salvos));
      }
    };

    window.addEventListener("perfilProfessorAtualizado", atualizarInstrumentos);

    return () => {
      window.removeEventListener(
        "perfilProfessorAtualizado",
        atualizarInstrumentos
      );
    };
  }, []);

  useEffect(() => {
    if (!alunoSelecionado) {
      setProgresso([]);
      setRepertorio([]);
      setPlanos([]);
      return;
    }

    const progressoSalvo = localStorage.getItem(
      `progresso_${alunoSelecionado.id}`
    );

    const repertorioSalvo = localStorage.getItem(
      `repertorio_${alunoSelecionado.id}`
    );

    const planosSalvos = localStorage.getItem(
      `planosAula_${alunoSelecionado.id}`
    );

    setProgresso(progressoSalvo ? JSON.parse(progressoSalvo) : []);
    setRepertorio(repertorioSalvo ? JSON.parse(repertorioSalvo) : []);
    setPlanos(planosSalvos ? JSON.parse(planosSalvos) : []);
  }, [alunoSelecionado]);

  const alunosPorInstrumento = useMemo(() => {
    if (!instrumentoSelecionado) return [];

    return alunos.filter(
      (aluno) =>
        aluno.instrumento?.toLowerCase() ===
        instrumentoSelecionado.toLowerCase()
    );
  }, [alunos, instrumentoSelecionado]);

  const selecionarInstrumento = (instrumento) => {
    setInstrumentoSelecionado(instrumento);
    setAlunoSelecionado(null);
  };

  const selecionarAluno = (aluno) => {
    setAlunoSelecionado(aluno);
  };

  const adicionarProgresso = () => {
    if (!alunoSelecionado) return;

    const assunto = window.prompt("Digite o assunto ou habilidade:");

    if (!assunto?.trim()) return;

    const novo = {
      id: Date.now(),
      titulo: assunto.trim(),
      status: "em-desenvolvimento"
    };

    const atualizados = [...progresso, novo];

    setProgresso(atualizados);

    localStorage.setItem(
      `progresso_${alunoSelecionado.id}`,
      JSON.stringify(atualizados)
    );
  };

  const adicionarRepertorio = () => {
    if (!alunoSelecionado) return;

    const musica = window.prompt("Digite o nome da música:");

    if (!musica?.trim()) return;

    const novo = {
      id: Date.now(),
      titulo: musica.trim(),
      status: "aprendendo"
    };

    const atualizados = [...repertorio, novo];

    setRepertorio(atualizados);

    localStorage.setItem(
      `repertorio_${alunoSelecionado.id}`,
      JSON.stringify(atualizados)
    );
  };

  const adicionarPlano = () => {
    if (!alunoSelecionado) return;

    const titulo = window.prompt("Digite o objetivo da aula:");

    if (!titulo?.trim()) return;

    const novo = {
      id: Date.now(),
      titulo: titulo.trim(),
      data: new Date().toLocaleDateString("pt-BR"),
      status: "planejada"
    };

    const atualizados = [...planos, novo];

    setPlanos(atualizados);

    localStorage.setItem(
      `planosAula_${alunoSelecionado.id}`,
      JSON.stringify(atualizados)
    );
  };

  return (
    <div className="planos-aula">
      <header className="planos-header">
        <div>
          <h1>Planos de Aula</h1>
          <p>Planeje as aulas a partir do progresso de cada aluno.</p>
        </div>
      </header>

      <div className="planos-layout">

        <aside className="planos-sidebar">

          <button
            className="sidebar-titulo"
            onClick={() => setMostrarInstrumentos(!mostrarInstrumentos)}
          >
            <span>Alunos</span>
            {mostrarInstrumentos ? <GoChevronDown /> : <GoChevronRight />}
          </button>

          {mostrarInstrumentos && (
            <div className="instrumentos-lista">

              {instrumentos.map((instrumento) => {
                const quantidade = alunos.filter(
                  (aluno) =>
                    aluno.instrumento?.toLowerCase() ===
                    instrumento.toLowerCase()
                ).length;

                const ativo =
                  instrumentoSelecionado === instrumento;

                return (
                  <div key={instrumento}>

                    <button
                      className={
                        ativo
                          ? "instrumento ativo"
                          : "instrumento"
                      }
                      onClick={() =>
                        selecionarInstrumento(instrumento)
                      }
                    >
                      <span>
                        <FaMusic />
                        {instrumento}
                      </span>

                      <small>{quantidade}</small>
                    </button>

                    {ativo && (
                      <div className="alunos-instrumento">

                        {alunosPorInstrumento.length === 0 ? (
                          <span className="sem-alunos">
                            Nenhum aluno
                          </span>
                        ) : (
                          alunosPorInstrumento.map((aluno) => (
                            <button
                              key={aluno.id}
                              className={
                                alunoSelecionado?.id === aluno.id
                                  ? "aluno ativo"
                                  : "aluno"
                              }
                              onClick={() =>
                                selecionarAluno(aluno)
                              }
                            >
                              {aluno.nome}
                            </button>
                          ))
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </aside>

        <main className="planos-conteudo">

          {!alunoSelecionado ? (
            <div className="planos-vazio">
              <GoBook />
              <h2>Selecione um aluno</h2>
              <p>
                Escolha um instrumento e depois selecione
                um aluno para visualizar seu progresso.
              </p>
            </div>
          ) : (
            <>
              <section className="aluno-banner">
                <div className="aluno-avatar">
                  {alunoSelecionado.nome?.charAt(0)}
                </div>

                <div>
                  <span>{alunoSelecionado.instrumento}</span>
                  <h2>{alunoSelecionado.nome}</h2>
                </div>
              </section>

              <div className="blocos-planos">

                <section className="bloco">
                  <div className="bloco-header">
                    <div>
                      <span className="bloco-numero">01</span>
                      <div>
                        <h3>Progresso</h3>
                        <p>Habilidades e conteúdos desenvolvidos.</p>
                      </div>
                    </div>

                    <button onClick={adicionarProgresso}>
                      <GoPlus />
                    </button>
                  </div>

                  <div className="bloco-conteudo">

                    {progresso.length === 0 ? (
                      <div className="bloco-vazio">
                        Nenhum progresso registrado.
                      </div>
                    ) : (
                      progresso.map((item) => (
                        <div className="progresso-item" key={item.id}>
                          <span className="status-ponto"></span>
                          <strong>{item.titulo}</strong>
                          <small>{item.status}</small>
                        </div>
                      ))
                    )}

                  </div>
                </section>

                <section className="bloco">
                  <div className="bloco-header">
                    <div>
                      <span className="bloco-numero">02</span>
                      <div>
                        <h3>Repertório</h3>
                        <p>Músicas que o aluno está desenvolvendo.</p>
                      </div>
                    </div>

                    <button onClick={adicionarRepertorio}>
                      <GoPlus />
                    </button>
                  </div>

                  <div className="bloco-conteudo">

                    {repertorio.length === 0 ? (
                      <div className="bloco-vazio">
                        Nenhuma música cadastrada.
                      </div>
                    ) : (
                      repertorio.map((item) => (
                        <div className="repertorio-item" key={item.id}>
                          <FaMusic />
                          <strong>{item.titulo}</strong>
                          <small>{item.status}</small>
                        </div>
                      ))
                    )}

                  </div>
                </section>

                <section className="bloco">
                  <div className="bloco-header">
                    <div>
                      <span className="bloco-numero">03</span>
                      <div>
                        <h3>Desenvolvimento</h3>
                        <p>
                          Técnica, teoria, ritmo e outros pontos.
                        </p>
                      </div>
                    </div>

                    <button>
                      <GoPlus />
                    </button>
                  </div>

                  <div className="bloco-conteudo">
                    <div className="desenvolvimento-grid">
                      <span>Técnica</span>
                      <span>Teoria</span>
                      <span>Ritmo</span>
                      <span>Acordes</span>
                      <span>Escalas</span>
                      <span>Improvisação</span>
                    </div>
                  </div>
                </section>

                <section className="bloco bloco-planos">
                  <div className="bloco-header">
                    <div>
                      <span className="bloco-numero">04</span>
                      <div>
                        <h3>Planos de Aula</h3>
                        <p>
                          Aulas planejadas para o desenvolvimento do aluno.
                        </p>
                      </div>
                    </div>

                    <button onClick={adicionarPlano}>
                      <GoPlus />
                    </button>
                  </div>

                  <div className="bloco-conteudo">

                    {planos.length === 0 ? (
                      <div className="bloco-vazio">
                        Nenhum plano de aula criado.
                      </div>
                    ) : (
                      planos.map((plano) => (
                        <div className="plano-item" key={plano.id}>
                          <div>
                            <strong>{plano.titulo}</strong>
                            <small>{plano.data}</small>
                          </div>

                          <span>{plano.status}</span>
                        </div>
                      ))
                    )}

                  </div>
                </section>

              </div>
            </>
          )}

        </main>

      </div>
    </div>
  );
}

export default PlanosDeAula;