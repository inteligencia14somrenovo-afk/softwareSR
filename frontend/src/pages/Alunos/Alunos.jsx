import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import { nomesInstrumentos } from "./utils/instrumentos";

import AlunoCard from "./components/AlunoCard";
import AlunoDetalhes from "./components/AlunosDetalhes";

import API_URL from "../../config/api";

import "./Alunos.css";


function Alunos() {

  const {
    professor,
    carregando: carregandoProfessor
  } = useAuth();


  // =========================
  // MODAL DE DETALHES
  // =========================

  const [showDetalhes, setShowDetalhes] = useState(false);

  const [alunoSelecionado, setAlunoSelecionado] =
    useState(null);


  // =========================
  // ALUNOS
  // =========================

  const [alunos, setAlunos] = useState([]);

  const [carregandoAlunos, setCarregandoAlunos] =
    useState(true);


  // =========================
  // FILTROS
  // =========================

  const [pesquisa, setPesquisa] = useState("");

  const [filtroUnidade, setFiltroUnidade] =
    useState("");

  const [filtroInstrumento, setFiltroInstrumento] =
    useState("");

  const [filtroIdade, setFiltroIdade] =
    useState("");


  // =========================================================
  // CARREGAR ALUNOS DA PLANILHA
  // =========================================================

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
          `${API_URL}/planilha/alunos/${professor.id}`,
          {
            credentials: "include",
          }
        );


        const data = await response.json();


        if (!response.ok) {

          throw new Error(
            data.erro ||
            data.mensagem ||
            "Não foi possível carregar os alunos da planilha."
          );

        }


        // =====================================================
        // NORMALIZA OS DADOS DA PLANILHA
        // =====================================================

        const alunosPlanilha =
          (data.alunos || []).map(
            (aluno) => ({

              ...aluno,

              // A planilha ainda não possui
              // uma URL de foto.
              foto: null,

              // A planilha ainda não possui
              // data de nascimento.
              nascimento: null,

              // Mantém compatibilidade
              // com o componente de detalhes.
              responsaveis:
                aluno.responsaveis || []

            })
          );


        setAlunos(alunosPlanilha);


        console.log(
          "✅ Alunos carregados da planilha:",
          alunosPlanilha
        );


      } catch (error) {

        console.error(
          "❌ Erro ao carregar alunos da planilha:",
          error
        );


        setAlunos([]);

      } finally {

        setCarregandoAlunos(false);

      }

    };


    carregarAlunos();

  }, [
    professor,
    carregandoProfessor
  ]);


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


    const dataString =
      String(nascimento)
        .split("T")[0];


    const partes =
      dataString.split("-");


    if (partes.length !== 3) {
      return "";
    }


    const [ano, mes, dia] =
      partes;


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
        pesquisa
          .toLowerCase()
          .trim();


      const correspondePesquisa =

        (aluno.nome || "")
          .toLowerCase()
          .includes(textoPesquisa)

        ||

        (
          nomesInstrumentos[
            aluno.instrumento
          ]

          ||

          aluno.instrumento

          ||

          ""
        )
          .toLowerCase()
          .includes(textoPesquisa)

        ||

        (aluno.unidade || "")
          .toLowerCase()
          .includes(textoPesquisa);


      const correspondeUnidade =

        !filtroUnidade ||

        aluno.unidade ===
        filtroUnidade;


      const correspondeInstrumento =

        !filtroInstrumento ||

        aluno.instrumento ===
        filtroInstrumento;


      // =====================================================
      // IDADE
      //
      // Como a planilha atualmente não possui
      // nascimento, esse filtro só funcionará
      // quando essa informação existir.
      // =====================================================

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


      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="alunos-header">

        <h1>
          Alunos
        </h1>

      </div>


      {/* =====================================================
          FILTROS
      ===================================================== */}

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


      {/* =====================================================
          CARDS DOS ALUNOS
      ===================================================== */}

      <div className="cards-alunos">

        {alunosFiltrados.map(
          (aluno) => (

            <AlunoCard
              key={aluno.codigoAluno || aluno.id}
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


      {/* =====================================================
          NENHUM RESULTADO
      ===================================================== */}

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
          MODAL DE DETALHES
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

          />

        )}

    </div>

  );

}


export default Alunos;