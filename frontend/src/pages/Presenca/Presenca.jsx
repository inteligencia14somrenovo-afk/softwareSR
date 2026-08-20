import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { GoTrash } from "react-icons/go";
import Semanas from "./components/Semanas";
import API_URL from "../../config/api";

import "./Presenca.css";

function Presenca() {

  const {
    professor,
    carregando: carregandoProfessor
  } = useAuth();

  // =========================
  // ALUNOS
  // =========================

  const [alunos, setAlunos] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);


  // =========================
  // AULAS / HORÁRIOS
  // =========================

  const [aulas, setAulas] = useState([]);
  const [carregandoAulas, setCarregandoAulas] = useState(true);


  // =========================
  // PRESENÇAS
  // =========================

  const [presencas, setPresencas] = useState([]);
  const [carregandoPresencas, setCarregandoPresencas] = useState(true);


  // =========================
  // SEMANA E DIA
  // =========================

  const [semanaSelecionada, setSemanaSelecionada] = useState(0);
  const [diaSelecionado, setDiaSelecionado] = useState(1);

  const [mesSelecionado, setMesSelecionado] = useState(new Date());


  // =========================
  // CONTROLE VISUAL
  // =========================

  const [semanasConcluidas, setSemanasConcluidas] = useState(() => {

    const salvas =
      localStorage.getItem("semanasConcluidas");

    return salvas
      ? JSON.parse(salvas)
      : [];

  });


  const [mesesConcluidos, setMesesConcluidos] = useState(() => {

    const salvos =
      localStorage.getItem("mesesConcluidos");

    return salvos
      ? JSON.parse(salvos)
      : [];

  });


  // =========================
  // FORMULÁRIO
  // =========================

  const [mostrarFormAula, setMostrarFormAula] =
    useState(false);


  const [novaAula, setNovaAula] = useState({
    alunoId: "",
    diaSemana: "",
    horario: ""
  });


  // =========================
  // ESTADO DE CARREGAMENTO
  // =========================

  const carregando =
    carregandoProfessor ||
    carregandoAlunos ||
    carregandoAulas ||
    carregandoPresencas;


  // =========================
  // DIAS
  // =========================

  const dias = [
    {
      numero: 1,
      nome: "Segunda-feira"
    },
    {
      numero: 2,
      nome: "Terça-feira"
    },
    {
      numero: 3,
      nome: "Quarta-feira"
    },
    {
      numero: 4,
      nome: "Quinta-feira"
    },
    {
      numero: 5,
      nome: "Sexta-feira"
    },
    {
      numero: 6,
      nome: "Sábado"
    }
  ];


  // =========================
  // MÊS ATUAL
  // =========================

  const anoAtual =
    mesSelecionado.getFullYear();

  const mesAtual =
    mesSelecionado.getMonth();


  const primeiroDiaMes = new Date(
    anoAtual,
    mesAtual,
    1
  );

  primeiroDiaMes.setHours(
    0,
    0,
    0,
    0
  );


  const ultimoDiaMes = new Date(
    anoAtual,
    mesAtual + 1,
    0
  );

  ultimoDiaMes.setHours(
    23,
    59,
    59,
    999
  );


  // =========================
  // INÍCIO DA SEMANA
  // =========================

  const obterInicioSemana = (data) => {

    const novaData =
      new Date(data);

    const dia =
      novaData.getDay();

    const diferenca =
      dia === 0
        ? -6
        : 1 - dia;

    novaData.setDate(
      novaData.getDate() + diferenca
    );

    novaData.setHours(
      0,
      0,
      0,
      0
    );

    return novaData;

  };


  // =========================
  // FIM DA SEMANA
  // =========================

  const obterFimSemana = (inicio) => {

    const fim =
      new Date(inicio);

    fim.setDate(
      fim.getDate() + 5
    );

    fim.setHours(
      23,
      59,
      59,
      999
    );

    return fim;

  };


  // =========================
  // SEMANAS DO MÊS
  // =========================

  const obterSemanasDoMes = () => {

    const semanas = [];

    let inicio =
      obterInicioSemana(
        primeiroDiaMes
      );


    while (
      inicio <= ultimoDiaMes
    ) {

      const fim =
        obterFimSemana(
          inicio
        );


      const inicioVisivel =
        inicio < primeiroDiaMes
          ? new Date(primeiroDiaMes)
          : new Date(inicio);


      const fimVisivel =
        fim > ultimoDiaMes
          ? new Date(ultimoDiaMes)
          : new Date(fim);


      semanas.push({

        inicio:
          new Date(inicio),

        fim:
          new Date(fim),

        inicioVisivel,

        fimVisivel

      });


      inicio =
        new Date(inicio);


      inicio.setDate(
        inicio.getDate() + 7
      );

    }


    return semanas;

  };


  const semanas =
    obterSemanasDoMes();


  // =========================
  // IDENTIFICADOR DA SEMANA
  // =========================

  const obterIdSemana = (index) => {

    return `${anoAtual}-${mesAtual}-${index}`;

  };


  // =========================
  // VERIFICAR CONCLUSÃO
  // =========================

  const semanaAtualConcluida =
    semanasConcluidas.includes(
      obterIdSemana(
        semanaSelecionada
      )
    );


  // =========================
  // DATA DO DIA
  // =========================

  const obterDataDoDia = (
    semana,
    numeroDia
  ) => {

    if (!semana) {
      return null;
    }


    const data =
      new Date(
        semana.inicio
      );


    data.setDate(
      data.getDate() +
      (numeroDia - 1)
    );


    data.setHours(
      0,
      0,
      0,
      0
    );


    return data;

  };


  // =========================
  // DIA DISPONÍVEL
  // =========================

  const diaEstaDisponivel = (
    numeroDia
  ) => {

    const semana =
      semanas[
        semanaSelecionada
      ];


    if (!semana) {
      return false;
    }


    const data =
      obterDataDoDia(
        semana,
        numeroDia
      );


    return (
      data >= primeiroDiaMes &&
      data <= ultimoDiaMes
    );

  };


  // =========================
  // DATA SELECIONADA
  // =========================

  const dataSelecionada =
    obterDataDoDia(
      semanas[
        semanaSelecionada
      ],
      diaSelecionado
    );


  const dataString =
    dataSelecionada
      ? dataSelecionada
          .toISOString()
          .split("T")[0]
      : "";


  // =========================
  // STRING DO MÊS PARA API
  // =========================

  const mesString =
    `${anoAtual}-${String(
      mesAtual + 1
    ).padStart(2, "0")}`;


  // =========================
  // FORMATAR DATA
  // =========================

  const formatarData = (data) => {

    if (!data) {
      return "";
    }


    return data.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit"
      }
    );

  };


  // =====================================================
  // CARREGAR ALUNOS
  // =====================================================

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


        const response =
          await fetch(
            `${API_URL}/alunos`,
            {
              credentials:
                "include"
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.mensagem ||
            "Não foi possível carregar os alunos."
          );

        }


        setAlunos(
          data.alunos || []
        );


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

  }, [
    professor,
    carregandoProfessor
  ]);


  // =====================================================
  // CARREGAR AULAS
  // =====================================================

  useEffect(() => {

    const carregarAulas = async () => {

      if (
        carregandoProfessor ||
        !professor
      ) {
        return;
      }


      try {

        setCarregandoAulas(true);


        const response =
          await fetch(
            `${API_URL}/aulas`,
            {
              credentials:
                "include"
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.mensagem ||
            "Não foi possível carregar os horários."
          );

        }


        const aulasFormatadas =
          (data.aulas || []).map(
            (aula) => ({

              id:
                Number(aula.id),

              alunoId:
                Number(aula.aluno_id),

              diaSemana:
                Number(aula.dia_semana),

              horario:
                aula.horario

            })
          );


        setAulas(
          aulasFormatadas
        );


      } catch (error) {

        console.error(
          "❌ Erro ao carregar aulas:",
          error
        );

      } finally {

        setCarregandoAulas(false);

      }

    };


    carregarAulas();

  }, [
    professor,
    carregandoProfessor
  ]);


  // =====================================================
  // CARREGAR PRESENÇAS DO MÊS
  // =====================================================

  useEffect(() => {

    const carregarPresencas = async () => {

      if (
        carregandoProfessor ||
        !professor
      ) {
        return;
      }


      try {

        setCarregandoPresencas(
          true
        );


        const response =
          await fetch(
            `${API_URL}/presencas?mes=${mesString}`,
            {
              credentials:
                "include"
            }
          );


        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.mensagem ||
            "Não foi possível carregar as presenças."
          );

        }


        const presencasFormatadas =
          (data.presencas || []).map(
            (presenca) => ({

              id:
                Number(presenca.id),

              aulaId:
                Number(presenca.aula_id),

              alunoId:
                Number(presenca.aluno_id),

              data:
                typeof presenca.data ===
                "string"
                  ? presenca.data.split("T")[0]
                  : presenca.data,

              status:
                presenca.status

            })
          );


        setPresencas(
          presencasFormatadas
        );


      } catch (error) {

        console.error(
          "❌ Erro ao carregar presenças:",
          error
        );

      } finally {

        setCarregandoPresencas(
          false
        );

      }

    };


    carregarPresencas();

  }, [
    professor,
    carregandoProfessor,
    mesString
  ]);


  // =====================================================
  // SALVAR ESTADOS VISUAIS
  // =====================================================

  useEffect(() => {

    localStorage.setItem(
      "semanasConcluidas",
      JSON.stringify(
        semanasConcluidas
      )
    );

  }, [
    semanasConcluidas
  ]);


  useEffect(() => {

    localStorage.setItem(
      "mesesConcluidos",
      JSON.stringify(
        mesesConcluidos
      )
    );

  }, [
    mesesConcluidos
  ]);


  // =========================
  // AULAS DO DIA
  // =========================

  const aulasDoDia =
    aulas
      .filter(
        (aula) =>
          Number(
            aula.diaSemana
          ) ===
          diaSelecionado
      )
      .sort(
        (a, b) =>
          a.horario.localeCompare(
            b.horario
          )
      );


  // =========================
  // ENCONTRAR ALUNO
  // =========================

  const encontrarAluno = (
    alunoId
  ) => {

    return alunos.find(
      (aluno) =>
        Number(aluno.id) ===
        Number(alunoId)
    );

  };


  // =========================
  // ENCONTRAR PRESENÇA
  // =========================

  const encontrarPresenca = (
    aulaId
  ) => {

    return presencas.find(
      (presenca) =>
        Number(
          presenca.aulaId
        ) ===
        Number(aulaId) &&
        presenca.data ===
        dataString
    );

  };


  // =====================================================
  // CADASTRAR HORÁRIO
  // =====================================================

  const cadastrarAula = async () => {

    if (
      !novaAula.alunoId ||
      novaAula.diaSemana === "" ||
      !novaAula.horario
    ) {

      alert(
        "Selecione o aluno, o dia e o horário."
      );

      return;

    }


    try {

      const response =
        await fetch(
          `${API_URL}/aulas`,
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "include",

            body:
              JSON.stringify({
                alunoId:
                  Number(
                    novaAula.alunoId
                  ),

                diaSemana:
                  Number(
                    novaAula.diaSemana
                  ),

                horario:
                  novaAula.horario
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        alert(
          data.mensagem ||
          "Não foi possível configurar o horário."
        );

        return;

      }


      const aula =
        data.aula;


      const aulaFormatada = {

        id:
          Number(aula.id),

        alunoId:
          Number(aula.aluno_id),

        diaSemana:
          Number(aula.dia_semana),

        horario:
          aula.horario

      };


      setAulas(
        (atuais) => [
          ...atuais,
          aulaFormatada
        ]
      );


      setNovaAula({
        alunoId: "",
        diaSemana: "",
        horario: ""
      });


      setMostrarFormAula(
        false
      );


    } catch (error) {

      console.error(
        "❌ Erro ao cadastrar horário:",
        error
      );

      alert(
        "Erro de conexão com o servidor."
      );

    }

  };


  // =====================================================
  // EXCLUIR HORÁRIO
  // =====================================================

  const excluirAula = async (
    aulaId
  ) => {

    const confirmar =
      window.confirm(
        "Deseja realmente excluir este horário?"
      );


    if (!confirmar) {
      return;
    }


    try {

      const response =
        await fetch(
          `${API_URL}/aulas/${aulaId}`,
          {

            method: "DELETE",

            credentials:
              "include"

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        alert(
          data.mensagem ||
          "Não foi possível excluir o horário."
        );

        return;

      }


      setAulas(
        (atuais) =>
          atuais.filter(
            (aula) =>
              Number(aula.id) !==
              Number(aulaId)
          )
      );


      // O backend usa ON DELETE CASCADE
      // para apagar as presenças relacionadas.

      setPresencas(
        (atuais) =>
          atuais.filter(
            (presenca) =>
              Number(
                presenca.aulaId
              ) !==
              Number(aulaId)
          )
      );


    } catch (error) {

      console.error(
        "❌ Erro ao excluir horário:",
        error
      );

      alert(
        "Erro de conexão com o servidor."
      );

    }

  };


  // =====================================================
  // REGISTRAR PRESENÇA
  // =====================================================

  const registrarPresenca = async (
    aula,
    status
  ) => {


    if (!dataString) {
      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/presencas`,
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "include",

            body:
              JSON.stringify({

                aulaId:
                  Number(
                    aula.id
                  ),

                alunoId:
                  Number(
                    aula.alunoId
                  ),

                data:
                  dataString,

                status

              })

          }
        );


      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.mensagem ||
          "Não foi possível registrar a presença."
        );

        return;

      }


      const novaPresenca = {

        id:
          Number(
            data.presenca.id
          ),

        aulaId:
          Number(
            data.presenca.aula_id
          ),

        alunoId:
          Number(
            data.presenca.aluno_id
          ),

        data:
          typeof data.presenca.data ===
          "string"
            ? data.presenca.data.split("T")[0]
            : data.presenca.data,

        status:
          data.presenca.status

      };


      setPresencas(
        (atuais) => {

          const existe =
            atuais.some(
              (presenca) =>
                Number(
                  presenca.aulaId
                ) ===
                Number(
                  novaPresenca.aulaId
                ) &&
                presenca.data ===
                novaPresenca.data
            );


          if (existe) {

            return atuais.map(
              (presenca) =>
                Number(
                  presenca.aulaId
                ) ===
                Number(
                  novaPresenca.aulaId
                ) &&
                presenca.data ===
                novaPresenca.data

                  ? novaPresenca

                  : presenca
            );

          }


          return [
            ...atuais,
            novaPresenca
          ];

        }
      );


    } catch (error) {

      console.error(
        "❌ Erro ao registrar presença:",
        error
      );

      alert(
        "Erro de conexão com o servidor."
      );

    }

  };


  // =========================
  // TROCAR SEMANA
  // =========================

  const selecionarSemana = (
    index
  ) => {

    setSemanaSelecionada(
      index
    );


    const novaSemana =
      semanas[index];


    if (!novaSemana) {
      return;
    }


    for (
      let dia = 1;
      dia <= 6;
      dia++
    ) {

      const data =
        obterDataDoDia(
          novaSemana,
          dia
        );


      if (
        data >= primeiroDiaMes &&
        data <= ultimoDiaMes
      ) {

        setDiaSelecionado(
          dia
        );

        break;

      }

    }

  };


  // =====================================================
  // CONCLUIR / REABRIR SEMANA
  // =====================================================

  const alternarConclusaoSemana =
    () => {

      const idSemana =
        obterIdSemana(
          semanaSelecionada
        );


      if (
        semanasConcluidas.includes(
          idSemana
        )
      ) {

        setSemanasConcluidas(
          (atuais) =>
            atuais.filter(
              (item) =>
                item !== idSemana
            )
        );

        return;

      }


      const novasConcluidas = [

        ...semanasConcluidas,

        idSemana

      ];


      const todasConcluidas =
        semanas.every(
          (_, index) =>
            novasConcluidas.includes(
              obterIdSemana(index)
            )
        );


      if (todasConcluidas) {

        const confirmar =
          window.confirm(
            `Todas as semanas de ${nomeMes} foram concluídas.\n\nDeseja concluir o mês?`
          );


        if (confirmar) {

          concluirMes(false);

        }

      }


      setSemanasConcluidas(
        novasConcluidas
      );

    };


  // =====================================================
  // TROCAR MÊS
  // =====================================================

  const trocarMes = (
    quantidade
  ) => {

    setMesSelecionado(
      new Date(
        anoAtual,
        mesAtual + quantidade,
        1
      )
    );


    setSemanaSelecionada(
      0
    );


    setDiaSelecionado(
      1
    );

  };


  // =========================
  // NOME DO MÊS
  // =========================

  const nomeMes =
    mesSelecionado.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric"
      }
    );


  // =====================================================
  // CONCLUIR MÊS
  // =====================================================

  const concluirMes = (
    confirmarAntes = true
  ) => {

    if (confirmarAntes) {

      const confirmar =
        window.confirm(
          `Concluir ${nomeMes}?`
        );


      if (!confirmar) {
        return;
      }

    }


    const idMes =
      `${anoAtual}-${mesAtual}`;


    setMesesConcluidos(
      (atuais) => {

        if (
          atuais.includes(
            idMes
          )
        ) {
          return atuais;
        }


        return [
          ...atuais,
          idMes
        ];

      }
    );


    setMesSelecionado(
      new Date(
        anoAtual,
        mesAtual + 1,
        1
      )
    );


    setSemanaSelecionada(
      0
    );


    setDiaSelecionado(
      1
    );

  };


  // =====================================================
  // CARREGAMENTO
  // =====================================================

  if (carregando) {

    return (

      <div className="presenca">

        <p>
          Carregando presença...
        </p>

      </div>

    );

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="presenca">

      {/* CABEÇALHO */}

      <div className="presenca-header">

        <div>

          <h1>
            Presença
          </h1>

          <p>
            Controle das aulas individuais
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            setMostrarFormAula(
              !mostrarFormAula
            )
          }
        >

          {mostrarFormAula
            ? "Fechar"
            : "+ Configurar horário"}

        </button>

      </div>


      {/* FORMULÁRIO */}

      {mostrarFormAula && (

        <div className="presenca-form">

          <h2>
            Configurar horário do aluno
          </h2>


          <select
            value={
              novaAula.alunoId
            }
            onChange={(e) =>
              setNovaAula({
                ...novaAula,
                alunoId:
                  e.target.value
              })
            }
          >

            <option value="">
              Selecione o aluno
            </option>


            {alunos.map(
              (aluno) => (

                <option
                  key={aluno.id}
                  value={aluno.id}
                >
                  {aluno.nome}
                </option>

              )
            )}

          </select>


          <select
            value={
              novaAula.diaSemana
            }
            onChange={(e) =>
              setNovaAula({
                ...novaAula,
                diaSemana:
                  e.target.value
              })
            }
          >

            <option value="">
              Selecione o dia
            </option>


            {dias.map(
              (dia) => (

                <option
                  key={dia.numero}
                  value={
                    dia.numero
                  }
                >
                  {dia.nome}
                </option>

              )
            )}

          </select>


          <input
            type="time"
            value={
              novaAula.horario
            }
            onChange={(e) =>
              setNovaAula({
                ...novaAula,
                horario:
                  e.target.value
              })
            }
          />


          <div>

            <button
              type="button"
              onClick={
                cadastrarAula
              }
            >
              Salvar horário
            </button>


            <button
              type="button"
              onClick={() =>
                setMostrarFormAula(
                  false
                )
              }
            >
              Cancelar
            </button>

          </div>

        </div>

      )}


      {/* SEMANAS */}

      <Semanas
        semanas={
          semanas
        }

        semanaSelecionada={
          semanaSelecionada
        }

        nomeMes={
          nomeMes
        }

        trocarMes={
          trocarMes
        }

        concluirMes={
          concluirMes
        }

        semanasConcluidas={
          semanasConcluidas
        }

        obterIdSemana={
          obterIdSemana
        }

        formatarData={
          formatarData
        }

        selecionarSemana={
          selecionarSemana
        }

        semanaAtualConcluida={
          semanaAtualConcluida
        }

        alternarConclusaoSemana={
          alternarConclusaoSemana
        }

      />


      {/* ABAS DOS DIAS */}

      <div className="presenca-abas">

        {dias.map(
          (dia) => {

            const disponivel =
              diaEstaDisponivel(
                dia.numero
              );


            return (

              <button
                key={
                  dia.numero
                }

                type="button"

                disabled={
                  !disponivel
                }

                className={

                  diaSelecionado ===
                    dia.numero &&
                  disponivel

                    ? "aba ativa"

                    : !disponivel

                    ? "aba desabilitada"

                    : "aba"

                }

                onClick={() => {

                  if (
                    !disponivel
                  ) {
                    return;
                  }


                  setDiaSelecionado(
                    dia.numero
                  );

                }}

              >

                <span>

                  {dia.nome.replace(
                    "-feira",
                    ""
                  )}

                </span>


                <small>

                  {formatarData(
                    obterDataDoDia(
                      semanas[
                        semanaSelecionada
                      ],
                      dia.numero
                    )
                  )}

                </small>

              </button>

            );

          }
        )}

      </div>


      {/* DIA */}

      <div className="presenca-dia">

        <div className="presenca-dia-header">

          <div>

            <h2>

              {
                dias.find(
                  (dia) =>
                    dia.numero ===
                    diaSelecionado
                )?.nome
              }

            </h2>


            <p>

              {formatarData(
                dataSelecionada
              )}

            </p>

          </div>


          <span>

            {aulasDoDia.length}{" "}

            {aulasDoDia.length === 1
              ? "aula"
              : "aulas"}

          </span>

        </div>


        {/* LISTA */}

        <div className="presenca-lista">

          {aulasDoDia.length === 0 ? (

            <div className="presenca-vazia">

              <p>
                Nenhuma aula cadastrada
                para este dia.
              </p>

            </div>

          ) : (

            aulasDoDia.map(
              (aula) => {

                const aluno =
                  encontrarAluno(
                    aula.alunoId
                  );


                if (!aluno) {
                  return null;
                }


                const presenca =
                  encontrarPresenca(
                    aula.id
                  );


                return (

                  <div
                    key={
                      aula.id
                    }

                    className="registro-presenca"
                  >

                    <div className="registro-horario">

                      <strong>
                        {aula.horario}
                      </strong>

                    </div>


                    <div className="registro-aluno">

                      <strong>
                        {aluno.nome}
                      </strong>


                      <span>
                        {aluno.instrumento}
                      </span>

                    </div>


                    <div className="registro-acoes">

                      <button
                        type="button"

                        className={
                          presenca?.status ===
                          "presente"

                            ? "presente ativo"

                            : "presente"
                        }

                        onClick={() =>
                          registrarPresenca(
                            aula,
                            "presente"
                          )
                        }

                      >
                        ✓ Presente
                      </button>


                      <button
                        type="button"

                        className={
                          presenca?.status ===
                          "falta"

                            ? "falta ativo"

                            : "falta"
                        }

                        onClick={() =>
                          registrarPresenca(
                            aula,
                            "falta"
                          )
                        }

                      >
                        ✕ Falta
                      </button>


                      <button
                        type="button"

                        className="excluir-horario"

                        title="Excluir horário"

                        onClick={() =>
                          excluirAula(
                            aula.id
                          )
                        }

                      >

                        <GoTrash />

                      </button>

                    </div>

                  </div>

                );

              }

            )

          )}

        </div>

      </div>

    </div>

  );

}

export default Presenca;