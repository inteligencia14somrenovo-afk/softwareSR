import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import Button from "../../components/UI/Button/Button";
import Modal from "../../components/UI/Modal/Modal";

import { nomesInstrumentos } from "./utils/instrumentos";

import AlunoCard from "./components/AlunoCard";
import AlunoDetalhes from "./components/AlunosDetalhes";
import Responsaveis from "./components/Responsaveis";

import API_URL from "../../config/api";

import "./Alunos.css";


function Alunos() {

  const {
    professor,
    carregando: carregandoProfessor
  } = useAuth();


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

  const [alunos, setAlunos] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);


  // =========================
  // CARREGAR ALUNOS
  // =========================

  useEffect(() => {

    const carregarAlunos = async () => {

      if (carregandoProfessor) {
        return;
      }

      if (!professor) {
        setAlunos([]);
        setCarregandoAlunos(false);
        return;
      }

      try {

        setCarregandoAlunos(true);

        const response = await fetch(
          `&{API_URL}/alunos`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensagem ||
            "Não foi possível carregar os alunos."
          );
        }

        setAlunos(data.alunos || []);

      } catch (error) {

        console.error(
          "❌ Erro ao carregar alunos:",
          error
        );

      } finally {

        setCarregandoAlunos(false);

      }

    };

    carregarAlunos();

  }, [professor, carregandoProfessor]);


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


  // =========================================================
  // RESPONSÁVEIS
  // =========================================================


  // =========================
  // ADICIONAR RESPONSÁVEL
  // =========================

  const adicionarResponsavel = async (responsavel) => {

    if (!alunoSelecionado) {
      return;
    }

    try {

      const response = await fetch(
        `&{API_URL}/responsaveis`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            aluno_id: alunoSelecionado.id,
            nome: responsavel.nome,
            telefone: responsavel.telefone,
            foto: responsavel.foto || null
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


      // O backend deve devolver o responsável criado
      const responsavelCriado =
        data.responsavel;


      setAlunos((alunosAtuais) => {

        const alunosAtualizados =
          alunosAtuais.map((aluno) => {

            if (
              aluno.id !== alunoSelecionado.id
            ) {
              return aluno;
            }

            return {
              ...aluno,

              responsaveis: [
                ...(aluno.responsaveis || []),
                responsavelCriado
              ]
            };

          });


        const alunoAtualizado =
          alunosAtualizados.find(
            (aluno) =>
              aluno.id === alunoSelecionado.id
          );


        setAlunoSelecionado(alunoAtualizado);


        return alunosAtualizados;

      });

    } catch (error) {

      console.error(
        "❌ Erro ao adicionar responsável:",
        error
      );

      alert(
        error.message ||
        "Não foi possível cadastrar o responsável."
      );

    }

  };


  // =========================
  // EDITAR RESPONSÁVEL
  // =========================

  const editarResponsavel = async (
    responsavelAtualizado
  ) => {

    if (!alunoSelecionado) {
      return;
    }

    try {

      const response = await fetch(
        `&{API_URL}/responsaveis/${responsavelAtualizado.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nome: responsavelAtualizado.nome,
            telefone: responsavelAtualizado.telefone,
            foto: responsavelAtualizado.foto || null
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


      const responsavelAtualizadoBanco =
        data.responsavel;


      setAlunos((alunosAtuais) => {

        const alunosAtualizados =
          alunosAtuais.map((aluno) => {

            if (
              aluno.id !== alunoSelecionado.id
            ) {
              return aluno;
            }


            return {
              ...aluno,

              responsaveis:
                (aluno.responsaveis || []).map(
                  (responsavel) =>
                    responsavel.id ===
                    responsavelAtualizadoBanco.id
                      ? responsavelAtualizadoBanco
                      : responsavel
                )
            };

          });


        const alunoAtualizado =
          alunosAtualizados.find(
            (aluno) =>
              aluno.id === alunoSelecionado.id
          );


        setAlunoSelecionado(alunoAtualizado);


        return alunosAtualizados;

      });

    } catch (error) {

      console.error(
        "❌ Erro ao editar responsável:",
        error
      );

      alert(
        error.message ||
        "Não foi possível atualizar o responsável."
      );

    }

  };


  // =========================
  // EXCLUIR RESPONSÁVEL
  // =========================

  const excluirResponsavel = async (
    responsavelId
  ) => {

    if (!alunoSelecionado) {
      return;
    }


    const confirmar = window.confirm(
      "Deseja realmente excluir este responsável?"
    );


    if (!confirmar) {
      return;
    }


    try {

      const response = await fetch(
        `&{API_URL}/responsaveis/${responsavelId}`,
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


      setAlunos((alunosAtuais) => {

        const alunosAtualizados =
          alunosAtuais.map((aluno) => {

            if (
              aluno.id !== alunoSelecionado.id
            ) {
              return aluno;
            }


            return {
              ...aluno,

              responsaveis:
                (aluno.responsaveis || []).filter(
                  (responsavel) =>
                    responsavel.id !== responsavelId
                )
            };

          });


        const alunoAtualizado =
          alunosAtualizados.find(
            (aluno) =>
              aluno.id === alunoSelecionado.id
          );


        setAlunoSelecionado(alunoAtualizado);


        return alunosAtualizados;

      });

    } catch (error) {

      console.error(
        "❌ Erro ao excluir responsável:",
        error
      );

      alert(
        error.message ||
        "Não foi possível excluir o responsável."
      );

    }

  };


  // =========================================================
  // SALVAR / EDITAR ALUNO
  // =========================================================

  const salvarAluno = async () => {

    if (
      !novoAluno.nome.trim() ||
      !novoAluno.nascimento ||
      !novoAluno.instrumento ||
      !novoAluno.unidade
    ) {

      alert("Preencha todos os campos.");

      return;

    }


    try {


      // =====================================================
      // EDITAR ALUNO
      // =====================================================

      if (alunoEditando) {

        const response = await fetch(
          `&{API_URL}/alunos/${alunoEditando.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              nome: novoAluno.nome.trim(),
              nascimento: novoAluno.nascimento,
              foto: novoAluno.foto || null,
              instrumento: novoAluno.instrumento,
              unidade: novoAluno.unidade
            })
          }
        );


        const data = await response.json();


        if (!response.ok) {

          throw new Error(
            data.mensagem ||
            "Não foi possível atualizar o aluno."
          );

        }


        setAlunos((alunosAtuais) =>
          alunosAtuais.map((aluno) =>
            aluno.id === alunoEditando.id
              ? {
                  ...data.aluno,

                  // preserva responsáveis
                  // caso o PUT de aluno não os devolva
                  responsaveis:
                    data.aluno.responsaveis ??
                    aluno.responsaveis ??
                    []
                }
              : aluno
          )
        );

      }


      // =====================================================
      // NOVO ALUNO
      // =====================================================

      else {

        const response = await fetch(
          `&{API_URL}/alunos`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              nome: novoAluno.nome.trim(),
              nascimento: novoAluno.nascimento,
              foto: novoAluno.foto || null,
              instrumento: novoAluno.instrumento,
              unidade: novoAluno.unidade
            })
          }
        );


        const data = await response.json();


        if (!response.ok) {

          throw new Error(
            data.mensagem ||
            "Não foi possível cadastrar o aluno."
          );

        }


        setAlunos((alunosAtuais) => [
          ...alunosAtuais,
          {
            ...data.aluno,
            responsaveis:
              data.aluno.responsaveis || []
          }
        ]);

      }


      // =====================================================
      // LIMPA FORMULÁRIO
      // =====================================================

      setNovoAluno({
        nome: "",
        nascimento: "",
        foto: "",
        instrumento: "",
        unidade: ""
      });


      setAlunoEditando(null);
      setShowModal(false);


    } catch (error) {

      console.error(
        "❌ Erro ao salvar aluno:",
        error
      );


      alert(
        error.message ||
        "Não foi possível salvar o aluno."
      );

    }

  };


  // =========================================================
  // EDITAR ALUNO
  // =========================================================

  const editarAluno = (aluno) => {

    setShowDetalhes(false);

    setAlunoEditando(aluno);

    setNovoAluno({

      nome: aluno.nome,

      nascimento:
        aluno.nascimento || "",

      foto:
        aluno.foto || "",

      instrumento:
        aluno.instrumento,

      unidade:
        aluno.unidade

    });

    setShowModal(true);

  };


  // =========================================================
  // EXCLUIR ALUNO
  // =========================================================

  const excluirAluno = async (id) => {

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


    try {

      const response = await fetch(
        `&{API_URL}/alunos/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.mensagem ||
          "Não foi possível excluir o aluno."
        );

      }


      setAlunos((alunosAtuais) =>
        alunosAtuais.filter(
          (aluno) => aluno.id !== id
        )
      );


      setShowDetalhes(false);
      setAlunoSelecionado(null);


    } catch (error) {

      console.error(
        "❌ Erro ao excluir aluno:",
        error
      );


      alert(
        error.message ||
        "Não foi possível excluir o aluno."
      );

    }

  };


  // =========================================================
  // ABRIR DETALHES
  // =========================================================

  const abrirDetalhes = (aluno) => {

    setAlunoSelecionado(aluno);

    setShowDetalhes(true);

  };


  // =========================================================
  // CALCULAR IDADE
  // =========================================================

  const calcularIdade = (nascimento) => {

    if (!nascimento) {
      return "";
    }


    const hoje = new Date();

    const dataNascimento =
      new Date(nascimento);


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
        hoje.getDate() <
        dataNascimento.getDate()
      )
    ) {

      idade--;

    }


    return idade;

  };


  // =========================================================
  // FORMATAR ANIVERSÁRIO
  // =========================================================

const formatarAniversario = (nascimento) => {

  if (!nascimento) {
    return "";
  }

  // PostgreSQL pode retornar:
  // 2020-05-15
  // ou
  // 2020-05-15T00:00:00.000Z

  const dataString = String(nascimento).split("T")[0];

  const partes = dataString.split("-");

  if (partes.length !== 3) {
    return "";
  }

  const [ano, mes, dia] = partes;

  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia)
  );

  if (isNaN(data.getTime())) {
    return "";
  }

  return data.toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long"
    }
  );
};

  // =========================================================
  // FILTRAGEM
  // =========================================================

  const alunosFiltrados =
    alunos.filter((aluno) => {

      const textoPesquisa =
        pesquisa.toLowerCase().trim();


      const correspondePesquisa =

        aluno.nome
          .toLowerCase()
          .includes(textoPesquisa)

        ||

        nomesInstrumentos[
          aluno.instrumento
        ]
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
          calcularIdade(
            aluno.nascimento
          )
        ) === filtroIdade;


      return (

        correspondePesquisa &&

        correspondeUnidade &&

        correspondeInstrumento &&

        correspondeIdade

      );

    });


  // =========================================================
  // STATUS
  // =========================================================

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


  // =========================================================
  // CARREGANDO
  // =========================================================

  if (
    carregandoProfessor ||
    carregandoAlunos
  ) {

    return (

      <div className="alunos">

        <p>
          Carregando alunos...
        </p>

      </div>

    );

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="alunos">


      {/* CABEÇALHO */}

      <div className="alunos-header">

        <h1>
          Alunos
        </h1>


        <Button
          onClick={abrirNovoAluno}
        >
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

        {alunosFiltrados.map(
          (aluno) => (

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

          )
        )}

      </div>


      {/* NENHUM RESULTADO */}

      {alunosFiltrados.length === 0 && (

        <div className="no-results">

          <h3>
            Nenhum aluno encontrado
          </h3>

          <p>
            Tente alterar sua pesquisa
            ou os filtros.
          </p>

        </div>

      )}


      {/* =====================================================
          MODAL NOVO / EDITAR ALUNO
      ===================================================== */}

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


              leitor.readAsDataURL(
                arquivo
              );

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


          <Button
            onClick={salvarAluno}
          >

            {alunoEditando
              ? "Salvar Alterações"
              : "Salvar Aluno"}

          </Button>

        </Modal>

      )}


      {/* =====================================================
          MODAL DETALHES
      ===================================================== */}

      {showDetalhes &&
        alunoSelecionado && (

          <AlunoDetalhes

            aluno={
              alunoSelecionado
            }

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


            onAdicionarResponsavel={
              adicionarResponsavel
            }


            onExcluirResponsavel={
              excluirResponsavel
            }


            onEditarResponsavel={
              editarResponsavel
            }

          />

        )}

    </div>

  );

}


export default Alunos;