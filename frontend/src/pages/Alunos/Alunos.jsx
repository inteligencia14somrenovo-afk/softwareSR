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
  // ATUALIZAÇÃO DA PLANILHA
  // =========================

  const [atualizandoAlunos, setAtualizandoAlunos] =
    useState(false);


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
  // PROFESSOR
  // =========================================================

  const isProfessor =
    professor?.role === "professor" ||
    professor?.role === "admin" ||
    professor?.role === "dev";


  // =========================================================
  // OPÇÕES DE INSTRUMENTOS
  // =========================================================

  const opcoesInstrumentos = [
    { valor: "guitarra", nome: "Guitarra" },
    { valor: "violao", nome: "Violão" },
    { valor: "ukulele", nome: "Ukulele" },
    { valor: "contrabaixo", nome: "Contrabaixo" },
    { valor: "violino", nome: "Violino" },
    { valor: "teclado", nome: "Teclado" },
    { valor: "piano", nome: "Piano" },
    { valor: "canto", nome: "Canto" },
    { valor: "bateria", nome: "Bateria" }
  ];


  // =========================================================
  // CARREGAR ALUNOS
  // =========================================================

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
        `${API_URL}/alunos`,
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
      // NORMALIZA OS DADOS
      //
      // A tela Alunos deve conter somente alunos definitivos.
      //
      // Por segurança, mesmo que algum registro temporário
      // chegue indevidamente pela API, ele será descartado.
      // =====================================================

      const alunosPlanilha = (data.alunos || [])
        .filter((aluno) => {

          const tipo =
            String(
              aluno.tipo ||
              aluno.tipoAluno ||
              aluno.tipo_aluno ||
              ""
            )
              .trim()
              .toLowerCase();


          // =================================================
          // TIPOS TEMPORÁRIOS
          // =================================================

          if (
            tipo === "aluno_temporario" ||
            tipo === "experimental" ||
            tipo === "reposicao" ||
            tipo === "reposição"
          ) {
            return false;
          }


          // =================================================
          // PROTEÇÃO CONTRA NOMES DE AULA EXPERIMENTAL
          // =================================================

          const nome =
            String(
              aluno.nome || ""
            )
              .trim()
              .toUpperCase();


          if (
            nome.startsWith("AE")
          ) {
            return false;
          }


          return true;

        })
        .map(
          (aluno) => ({
            ...aluno,

            codigoAluno:
              aluno.codigoAluno ??
              aluno.codigo_aluno ??
              aluno.id,

            nascimento:
              aluno.nascimento || null,

            foto:
              aluno.foto || null,

            responsaveis:
              aluno.responsaveis || []
          })
        );


      setAlunos(alunosPlanilha);


      console.log(
        "✅ Alunos definitivos carregados:",
        alunosPlanilha
      );


    } catch (error) {

      console.error(
        "❌ Erro ao carregar alunos:",
        error
      );


      setAlunos([]);

    } finally {

      setCarregandoAlunos(false);

    }

  };


  // =========================================================
  // CARREGAR ALUNOS AO ABRIR A TELA
  // =========================================================

  useEffect(() => {

    carregarAlunos();

  }, [
    professor,
    carregandoProfessor
  ]);


  // =========================================================
  // ATUALIZAR ALUNOS PELA PLANILHA
  // =========================================================

  const atualizarAlunosDaPlanilha = async () => {

    if (!isProfessor || atualizandoAlunos) {
      return;
    }


    try {

      setAtualizandoAlunos(true);


      const response = await fetch(
        `${API_URL}/planilha/sincronizar`,
        {
          method: "POST",
          credentials: "include",
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.erro ||
          data.mensagem ||
          "Não foi possível atualizar os alunos."
        );

      }


      // Depois da sincronização, recarrega os alunos
      // diretamente do banco.
      await carregarAlunos();


      console.log(
        "✅ Alunos atualizados pela planilha:",
        data
      );


    } catch (error) {

      console.error(
        "❌ Erro ao atualizar alunos:",
        error
      );

      alert(
        error.message ||
        "Não foi possível atualizar os alunos."
      );

    } finally {

      setAtualizandoAlunos(false);

    }

  };


  // =========================================================
  // ATUALIZAR ALUNO
  // =========================================================

  const atualizarAluno = (alunoAtualizado) => {

    setAlunos((alunosAtuais) =>
      alunosAtuais.map((aluno) =>
        aluno.id === alunoAtualizado.id
          ? {
              ...aluno,
              ...alunoAtualizado
            }
          : aluno
      )
    );


    setAlunoSelecionado((alunoAtual) =>
      alunoAtual
        ? {
            ...alunoAtual,
            ...alunoAtualizado
          }
        : alunoAtual
    );

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


    const dataString = String(nascimento)
      .split("T")[0];


    const partes = dataString.split("-");


    if (partes.length !== 3) {
      return "";
    }


    const anoNascimento = Number(partes[0]);
    const mesNascimento = Number(partes[1]);
    const diaNascimento = Number(partes[2]);


    if (
      !anoNascimento ||
      !mesNascimento ||
      !diaNascimento
    ) {
      return "";
    }


    const hoje = new Date();


    let idade =
      hoje.getFullYear() -
      anoNascimento;


    const aniversarioAindaNaoChegou =
      hoje.getMonth() + 1 < mesNascimento ||
      (
        hoje.getMonth() + 1 === mesNascimento &&
        hoje.getDate() < diaNascimento
      );


    if (aniversarioAindaNaoChegou) {
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
  // NOME DO INSTRUMENTO PARA BUSCA
  // =========================================================

  const obterTextoInstrumento = (aluno) => {

    if (!aluno) {
      return "";
    }


    const instrumentoEspecifico =
      aluno.instrumento_especifico;


    if (instrumentoEspecifico) {

      const nomeEspecifico =
        opcoesInstrumentos.find(
          (opcao) =>
            opcao.valor ===
            instrumentoEspecifico
        )?.nome;


      if (nomeEspecifico) {
        return nomeEspecifico;
      }

    }


    return (
      nomesInstrumentos[aluno.instrumento] ||
      aluno.instrumento ||
      ""
    );

  };


  // =========================================================
  // FILTRAGEM
  // =========================================================

  const alunosFiltrados =
    alunos.filter((aluno) => {

      // =====================================================
      // PROTEÇÃO EXTRA
      // =====================================================

      const tipo =
        String(
          aluno.tipo ||
          aluno.tipoAluno ||
          aluno.tipo_aluno ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        tipo === "aluno_temporario" ||
        tipo === "experimental" ||
        tipo === "reposicao" ||
        tipo === "reposição"
      ) {
        return false;
      }


      // =====================================================
      // NÃO EXIBIR AULAS EXPERIMENTAIS
      // =====================================================

      if (
        (aluno.nome || "")
          .trim()
          .toUpperCase()
          .startsWith("AE")
      ) {
        return false;
      }


      const textoPesquisa =
        pesquisa
          .toLowerCase()
          .trim();


      const textoInstrumento =
        obterTextoInstrumento(aluno)
          .toLowerCase();


      const nomeInstrumentoBase =
        (
          nomesInstrumentos[
            aluno.instrumento
          ] ||
          ""
        )
          .toLowerCase();


      const correspondePesquisa =

        (aluno.nome || "")
          .toLowerCase()
          .includes(textoPesquisa)

        ||

        String(
          aluno.codigoAluno ?? ""
        )
          .toLowerCase()
          .includes(textoPesquisa)

        ||

        textoInstrumento
          .includes(textoPesquisa)

        ||

        nomeInstrumentoBase
          .includes(textoPesquisa)

        ||

        (aluno.unidade || "")
          .toLowerCase()
          .includes(textoPesquisa);


      const correspondeUnidade =

        !filtroUnidade ||

        aluno.unidade ===
        filtroUnidade;


      const instrumentoBase =
        String(aluno.instrumento || "")
          .trim()
          .toLowerCase();


      const instrumentoEspecifico =
        String(aluno.instrumento_especifico || "")
          .trim()
          .toLowerCase();


      const correspondeInstrumento =

        !filtroInstrumento ||

        (
          instrumentoEspecifico &&
          instrumentoEspecifico ===
            filtroInstrumento
        )

        ||

        (
          !instrumentoEspecifico &&
          (
            (
              (
                instrumentoBase ===
                  "guitarra/violao" ||
                instrumentoBase ===
                  "guitarra/violao/ukulele/contrabaixo"
              ) &&
              [
                "guitarra",
                "violao",
                "ukulele",
                "contrabaixo"
              ].includes(
                filtroInstrumento
              )
            )

            ||

            (
              instrumentoBase ===
                "teclado/piano" &&
              [
                "teclado",
                "piano"
              ].includes(
                filtroInstrumento
              )
            )

            ||

            instrumentoBase ===
              filtroInstrumento
          )
        );


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


        {/* ===================================================
            ATUALIZAR ALUNOS
            Somente professor
        =================================================== */}

        {isProfessor && (

          <button
            type="button"
            className="botao-atualizar-alunos"
            onClick={atualizarAlunosDaPlanilha}
            disabled={atualizandoAlunos}
          >

            {atualizandoAlunos
              ? "Atualizando..."
              : "↻ Atualizar alunos"
            }

          </button>

        )}

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


          {opcoesInstrumentos.map(
            (instrumento) => (

              <option
                key={instrumento.valor}
                value={instrumento.valor}
              >
                {instrumento.nome}
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

            onAlunoAtualizado={
              atualizarAluno
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

