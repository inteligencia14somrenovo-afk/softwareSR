import { useEffect, useState } from "react";

import Button from "../../components/UI/Button/Button";
import Modal from "../../components/UI/Modal/Modal";

import { nomesInstrumentos } from "./utils/instrumentos";

import AlunoCard from "./components/AlunoCard";
import AlunoDetalhes from "./components/AlunosDetalhes";
import Responsaveis from "./components/Responsaveis";

import "./Alunos.css";


function Alunos() {

  // =========================
  // MODAIS
  // =========================

  const [showModal, setShowModal] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);

  const [alunoEditando, setAlunoEditando] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);


  // =========================
  // FORMULÁRIO ALUNO
  // =========================

  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    nascimento: "",
    foto: "",
    instrumento: "",
    unidade: ""
  });


  // =========================
  // ALUNOS
  // =========================

  const [alunos, setAlunos] = useState(() => {

    const alunosSalvos = localStorage.getItem("alunos");

    if (alunosSalvos) {
      return JSON.parse(alunosSalvos);
    }

    return [
      {
        id: 1,
        nome: "João Silva",
        instrumento: "violao",
        unidade: "Porto velho",
        idade: 15,
        foto: "",
        cor: "violao",
        aniversario: "15/06/2011",
        status: "ativo",
        responsaveis: []
      },

      {
        id: 2,
        nome: "Maria Souza",
        instrumento: "piano",
        unidade: "Porto velho",
        idade: 20,
        foto: "",
        cor: "piano",
        aniversario: "22/03/2006",
        status: "ativo",
        responsaveis: []
      },

      {
        id: 3,
        nome: "Lucas Oliveira",
        instrumento: "guitarra",
        unidade: "Ji parana 1",
        idade: 12,
        foto: "",
        cor: "guitarra",
        aniversario: "08/11/2013",
        status: "viajando",
        responsaveis: []
      },

      {
        id: 4,
        nome: "Ana Santos",
        instrumento: "bateria",
        unidade: "Ji parana 2",
        idade: 14,
        foto: "",
        cor: "bateria",
        aniversario: "30/01/2012",
        status: "faltas",
        responsaveis: []
      }
    ];

  });


  // =========================
  // SALVAR LOCALSTORAGE
  // =========================

  useEffect(() => {

    localStorage.setItem(
      "alunos",
      JSON.stringify(alunos)
    );
    window.dispatchEvent(
      new
      Event("alunosAtualizados")
    );

  }, [alunos]);


  // =========================
  // FILTROS
  // =========================

  const [pesquisa, setPesquisa] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [filtroInstrumento, setFiltroInstrumento] = useState("");
  const [filtroIdade, setFiltroIdade] = useState("");


  // =========================
  // ABRIR NOVO ALUNO
  // =========================

  const abrirNovoAluno = () => {

    setAlunoEditando(null);

    setNovoAluno({
      nome: "",
      nascimento: "",
      foto: "",
      instrumento: "",
      unidade: ""
    });

    setShowModal(true);

  };


  // =========================
// RESPONSÁVEIS
// =========================

const adicionarResponsavel = (responsavel) => {

  if (!alunoSelecionado) {
    return;
  }

  setAlunos((alunosAtuais) => {

    const alunosAtualizados = alunosAtuais.map((aluno) => {

      if (aluno.id !== alunoSelecionado.id) {
        return aluno;
      }

      return {
        ...aluno,
        responsaveis: [
          ...(aluno.responsaveis || []),
          responsavel
        ]
      };

    });

    const alunoAtualizado = alunosAtualizados.find(
      (aluno) => aluno.id === alunoSelecionado.id
    );

    setAlunoSelecionado(alunoAtualizado);

    return alunosAtualizados;

  });
};


const excluirResponsavel = (responsavelId) => {

  if (!alunoSelecionado) {
    return;
  }

  const confirmar = window.confirm(
    "Deseja realmente excluir este responsável?"
  );

  if (!confirmar) {
    return;
  }

  setAlunos((alunosAtuais) => {

    const alunosAtualizados = alunosAtuais.map((aluno) => {

      if (aluno.id !== alunoSelecionado.id) {
        return aluno;
      }

      return {
        ...aluno,

        responsaveis: (aluno.responsaveis || []).filter(
          (responsavel) =>
            responsavel.id !== responsavelId
        )
      };

    });

    const alunoAtualizado = alunosAtualizados.find(
      (aluno) => aluno.id === alunoSelecionado.id
    );

    setAlunoSelecionado(alunoAtualizado);

    return alunosAtualizados;

  });
};

const editarResponsavel = (responsavelAtualizado) => {

  if (!alunoSelecionado) {
    return;
  }

  setAlunos((alunosAtuais) => {

    const alunosAtualizados = alunosAtuais.map((aluno) => {

      if (aluno.id !== alunoSelecionado.id) {
        return aluno;
      }

      return {
        ...aluno,

        responsaveis: (aluno.responsaveis || []).map(
          (responsavel) =>
            responsavel.id === responsavelAtualizado.id
              ? responsavelAtualizado
              : responsavel
        )
      };

    });

    const alunoAtualizado = alunosAtualizados.find(
      (aluno) => aluno.id === alunoSelecionado.id
    );

    setAlunoSelecionado(alunoAtualizado);

    return alunosAtualizados;

  });
};

  // =========================
  // SALVAR / EDITAR ALUNO
  // =========================

  const salvarAluno = () => {

    if (
      !novoAluno.nome.trim() ||
      !novoAluno.nascimento ||
      !novoAluno.instrumento ||
      !novoAluno.unidade
    ) {

      alert("Preencha todos os campos.");

      return;

    }


    // EDITAR

    if (alunoEditando) {

      setAlunos(

        alunos.map((aluno) => {

          if (aluno.id !== alunoEditando.id) {
            return aluno;
          }

          return {

            ...aluno,

            nome: novoAluno.nome,

            nascimento: novoAluno.nascimento,

            foto: novoAluno.foto || aluno.foto || "",

            instrumento: novoAluno.instrumento,

            unidade: novoAluno.unidade,

            cor: novoAluno.instrumento

          };

        })

      );

    }

    // NOVO ALUNO

    else {

      const novo = {

        id: Date.now(),

        nome: novoAluno.nome,

        nascimento: novoAluno.nascimento,

        instrumento: novoAluno.instrumento,

        unidade: novoAluno.unidade,

        foto: novoAluno.foto || "",

        cor: novoAluno.instrumento,

        aniversario: "",

        status: "ativo",

        responsaveis: []

      };


      setAlunos([
        ...alunos,
        novo
      ]);

    }


    setNovoAluno({
      nome: "",
      nascimento: "",
      foto: "",
      instrumento: "",
      unidade: ""
    });

    setAlunoEditando(null);

    setShowModal(false);

  };


  // =========================
  // EDITAR ALUNO
  // =========================

  const editarAluno = (aluno) => {

    setShowDetalhes(false);

    setAlunoEditando(aluno);

    setNovoAluno({

      nome: aluno.nome,

      nascimento: aluno.nascimento || "",

      foto: aluno.foto || "",

      instrumento: aluno.instrumento,

      unidade: aluno.unidade

    });

    setShowModal(true);

  };


  // =========================
  // EXCLUIR ALUNO
  // =========================

  const excluirAluno = (id) => {

    const aluno = alunos.find(
      (item) => item.id === id
    );


    if (!aluno) {
      return;
    }


    const confirmar = window.confirm(
      `Deseja realmente excluir ${aluno.nome}?`
    );


    if (!confirmar) {
      return;
    }


    setAlunos(
      alunos.filter(
        (aluno) => aluno.id !== id
      )
    );

    setShowDetalhes(false);

    setAlunoSelecionado(null);

  };


  // =========================
  // ABRIR DETALHES
  // =========================

  const abrirDetalhes = (aluno) => {

    setAlunoSelecionado(aluno);

    setShowDetalhes(true);

  };


  // =========================
  // CALCULAR IDADE
  // =========================

  const calcularIdade = (nascimento) => {

    if (!nascimento) {
      return "";
    }


    const hoje = new Date();

    const dataNascimento = new Date(nascimento);


    let idade =
      hoje.getFullYear() -
      dataNascimento.getFullYear();


    const mes =
      hoje.getMonth() -
      dataNascimento.getMonth();


    if (
      mes < 0 ||
      (
        mes === 0 &&
        hoje.getDate() < dataNascimento.getDate()
      )
    ) {

      idade--;

    }


    return idade;

  };


  // =========================
  // FORMATAR ANIVERSÁRIO
  // =========================

  const formatarAniversario = (nascimento) => {

    if (!nascimento) {
      return "";
    }


    const data = new Date(
      `${nascimento}T00:00:00`
    );


    return data.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long"
      }
    );

  };


  // =========================
  // FILTRAGEM
  // =========================

  const alunosFiltrados = alunos.filter((aluno) => {

    const textoPesquisa =
      pesquisa.toLowerCase().trim();


    const correspondePesquisa =

      aluno.nome
        .toLowerCase()
        .includes(textoPesquisa)

      ||

      nomesInstrumentos[aluno.instrumento]
        ?.toLowerCase()
        .includes(textoPesquisa)

      ||

      aluno.unidade
        .toLowerCase()
        .includes(textoPesquisa);


    const correspondeUnidade =

      !filtroUnidade ||
      aluno.unidade === filtroUnidade;


    const correspondeInstrumento =

      !filtroInstrumento ||
      aluno.instrumento === filtroInstrumento;


    const correspondeIdade =

      !filtroIdade ||
      String(
        calcularIdade(aluno.nascimento)
      ) === filtroIdade;


    return (

      correspondePesquisa &&

      correspondeUnidade &&

      correspondeInstrumento &&

      correspondeIdade

    );

  });


  // =========================
  // STATUS
  // =========================

  const statusAluno = (status) => {

    if (status === "viajando") {

      return {
        texto: "Viajando",
        classe: "status-viajando"
      };

    }


    if (status === "faltas") {

      return {
        texto: "Muitas faltas",
        classe: "status-faltas"
      };

    }


    return {
      texto: "Ativo",
      classe: "status-ativo"
    };

  };


  // =========================
  // RENDER
  // =========================

  return (

    <div className="alunos">


      {/* CABEÇALHO */}

      <div className="alunos-header">

        <h1>
          Alunos
        </h1>


        <Button onClick={abrirNovoAluno}>

          + Novo Aluno

        </Button>

      </div>


      {/* FILTROS */}

      <div className="alunos-tools">


        <input
          type="text"
          placeholder="🔍 Pesquisar aluno..."
          value={pesquisa}
          onChange={(e) =>
            setPesquisa(e.target.value)
          }

        />


        <select

          value={filtroUnidade}

          onChange={(e) =>
            setFiltroUnidade(e.target.value)
          }

        >

          <option value="">
            Todas as unidades
          </option>

          <option value="Porto velho">
            Porto Velho
          </option>

          <option value="Ji parana 1">
            Ji-Paraná 1
          </option>

          <option value="Ji parana 2">
            Ji-Paraná 2
          </option>

        </select>


        <select
          value={filtroInstrumento}
          onChange={(e) =>
            setFiltroInstrumento(e.target.value)
          }

        >

          <option value="">
            Todos os instrumentos
          </option>


          {Object.entries(
            nomesInstrumentos
          ).map(
            ([valor, nome]) => (

              <option
                key={valor}
                value={valor}
              >
                {nome}
              </option>

            )
          )}

        </select>


        <select
          value={filtroIdade}
          onChange={(e) =>
            setFiltroIdade(e.target.value)
          }

        >

          <option value="">
            Todas as idades
          </option>


          {Array.from(
            { length: 19 },
            (_, i) => i + 12
          ).map((idade) => (

            <option
              key={idade}
              value={idade}
            >
              {idade} anos
            </option>

          ))}

        </select>

      </div>


      {/* CARDS */}

      <div className="cards-alunos">

        {alunosFiltrados.map((aluno) => (

          <AlunoCard
            key={aluno.id}
            aluno={aluno}
            nomesInstrumentos={
              nomesInstrumentos
            }
            calcularIdade={
              calcularIdade
            }
            abrirDetalhes={
              abrirDetalhes
            }

          />

        ))}

      </div>


      {/* NENHUM RESULTADO */}

      {alunosFiltrados.length === 0 && (

        <div className="no-results">

          <h3>
            Nenhum aluno encontrado
          </h3>

          <p>
            Tente alterar sua pesquisa ou os filtros.
          </p>
        </div>

      )}


      {/* MODAL NOVO / EDITAR */}

      {showModal && (

        <Modal
          onClose={() => {
            setShowModal(false);
            setAlunoEditando(null);
          }}

        >

          <h2>
            {alunoEditando
              ? "Editar Aluno"
              : "Novo Aluno"}
          </h2>


          <input
            type="text"
            placeholder="Nome completo"
            value={novoAluno.nome}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                nome: e.target.value
              })
            }

          />


          <input
            type="date"
            value={novoAluno.nascimento}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                nascimento: e.target.value
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
                setNovoAluno({
                  ...novoAluno,
                  foto: leitor.result
                });
              };
              leitor.readAsDataURL(arquivo);
            }}

          />


          <select
            value={novoAluno.instrumento}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                instrumento: e.target.value
              })
            }

          >

            <option value="">
              Selecione o Instrumento
            </option>


            {Object.entries(
              nomesInstrumentos
            ).map(
              ([valor, nome]) => (

                <option
                  key={valor}
                  value={valor}
                >
                  {nome}
                </option>
              )
            )}
          </select>


          <select
            value={novoAluno.unidade}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                unidade: e.target.value
              })
            }
          >

            <option value="">
              Selecione a Unidade
            </option>


            <option value="Porto velho">
              Porto Velho
            </option>


            <option value="Ji parana 1">
              Ji-Paraná 1
            </option>


            <option value="Ji parana 2">
              Ji-Paraná 2
            </option>

          </select>


          <Button onClick={salvarAluno}>
            {alunoEditando
              ? "Salvar Alterações"
              : "Salvar Aluno"}
          </Button>
        </Modal>
      )}


      {/* MODAL DETALHES */}

      {showDetalhes &&
        alunoSelecionado && (

          <AlunoDetalhes

            aluno={alunoSelecionado}

            nomesInstrumentos={
              nomesInstrumentos
            }

            calcularIdade={
              calcularIdade
            }

            formatarAniversario={
              formatarAniversario
            }

            statusAluno={
              statusAluno
            }

            onClose={() => {

              setShowDetalhes(false);

              setAlunoSelecionado(null);

            }}

            onEditar={() =>

              editarAluno(
                alunoSelecionado
              )

            }

            onExcluir={() =>

              excluirAluno(
                alunoSelecionado.id
              )

            }

            onAdicionarResponsavel={adicionarResponsavel}
            onExcluirResponsavel={excluirResponsavel}
            onEditarResponsavel={editarResponsavel}
          />


        )}
    </div>

  );
}

export default Alunos;