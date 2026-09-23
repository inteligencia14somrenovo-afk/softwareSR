import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { IoReloadSharp } from "react-icons/io5";
import { FaRegHourglassHalf } from "react-icons/fa6";
import Semanas from "./components/Semanas";
import API_URL from "../../config/api";
import { nomesInstrumentos } from "../Alunos/utils/instrumentos";

import "./Presenca.css";

function Presenca() {
  const {
    professor,
    carregando: carregandoProfessor,
  } = useAuth();

 
  // =========================
  // AULAS / HORÁRIOS
  // =========================

  const [carregandoAulas, setCarregandoAulas] = useState(true);
  const [horariosPlanilha, setHorariosPlanilha] = useState([]);

  // =========================
  // PRESENÇAS
  // =========================

  const [presencas, setPresencas] = useState([]);
  const [carregandoPresencas, setCarregandoPresencas] = useState(true);

  // =========================
  // SINCRONIZAÇÃO
  // =========================

  const [sincronizando, setSincronizando] = useState(false);

  // =========================
  // SEMANA E DIA
  // =========================

  const [semanaSelecionada, setSemanaSelecionada] = useState(0);
  const [diaSelecionado, setDiaSelecionado] = useState(1);

  const [mesSelecionado, setMesSelecionado] = useState(new Date());


  // =========================
  // ESTADO DE CARREGAMENTO
  // =========================

  const carregando =
    carregandoProfessor ||
    carregandoAulas ||
    carregandoPresencas;

  // =========================
  // DIAS
  // =========================

  const dias = [
    {
      numero: 1,
      nome: "Segunda-feira",
    },
    {
      numero: 2,
      nome: "Terça-feira",
    },
    {
      numero: 3,
      nome: "Quarta-feira",
    },
    {
      numero: 4,
      nome: "Quinta-feira",
    },
    {
      numero: 5,
      nome: "Sexta-feira",
    },
    {
      numero: 6,
      nome: "Sábado",
    },
  ];

  // =========================
  // MÊS ATUAL
  // =========================

  const anoAtual = mesSelecionado.getFullYear();

  const mesAtual = mesSelecionado.getMonth();

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
    const novaData = new Date(data);

    const dia = novaData.getDay();

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
    const fim = new Date(inicio);

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

    let inicio = obterInicioSemana(
      primeiroDiaMes
    );

    while (
      inicio <= ultimoDiaMes
    ) {
      const fim = obterFimSemana(
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
        inicio: new Date(inicio),
        fim: new Date(fim),
        inicioVisivel,
        fimVisivel,
      });

      inicio = new Date(inicio);

      inicio.setDate(
        inicio.getDate() + 7
      );
    }

    return semanas;
  };

  const semanas =
    obterSemanasDoMes();

  // =========================
  // ABRIR NA SEMANA E DIA ATUAIS
  // =========================

  useEffect(() => {
    const hoje = new Date();

    if (
      hoje.getFullYear() !== anoAtual ||
      hoje.getMonth() !== mesAtual
    ) {
      return;
    }

    const diaSemanaHoje =
      hoje.getDay();

    if (diaSemanaHoje === 0) {
      return;
    }

    const dia = diaSemanaHoje;

    const indiceSemana =
      semanas.findIndex((semana) => {
        const dataInicio =
          new Date(semana.inicio);

        const dataFim =
          new Date(semana.fim);

        return (
          hoje >= dataInicio &&
          hoje <= dataFim
        );
      });

    if (indiceSemana === -1) {
      return;
    }

    setSemanaSelecionada(
      indiceSemana
    );

    setDiaSelecionado(dia);
  }, []);

  // =========================
  // IDENTIFICADOR DA SEMANA
  // =========================

  const obterIdSemana = (index) => {
    return `${anoAtual}-${mesAtual}-${index}`;
  };

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

    const data = new Date(
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
        month: "2-digit",
      }
    );
  };

  

  // =====================================================
  // CARREGAR HORÁRIOS DA PLANILHA
  // =====================================================

  const carregarHorariosPlanilha =
    async (
      mostrarCarregamento = true
    ) => {
      if (
        carregandoProfessor ||
        !professor
      ) {
        return;
      }

      try {
        if (mostrarCarregamento) {
          setCarregandoAulas(true);
        }

        const response =
          await fetch(
            `${API_URL}/planilha/horarios/${professor.id}/organizados`,
            {
              credentials:
                "include",
            }
          );

        const data =
          await response.json();


        if (!response.ok) {
          throw new Error(
            data.erro ||
              "Não foi possível carregar os horários da planilha."
          );
        }

        const mapaDias = {
          SEGUNDA: 1,
          TERÇA: 2,
          QUARTA: 3,
          QUINTA: 4,
          SEXTA: 5,
          SÁBADO: 6,
        };

        const horarios =
  (data.dados || []).map(
    (item) => ({
      id: item.celula,
      alunoId: item.codigoAluno,
      nome: item.nome,
      instrumento: item.instrumento,
      diaSemana: mapaDias[item.diaSemana],
      horario: item.horario,
      dataExperimental: item.dataExperimental,
      dataBloqueada: item.dataBloqueada,
      tipo: item.tipo,
      cancelado: item.cancelado,
      foto: item.foto,
      conteudoOriginal: item.conteudoOriginal,
    })
  );

        setHorariosPlanilha(
          horarios
        );
      } catch (error) {
        console.error(
          "❌ Erro ao carregar horários da planilha:",
          error
        );

        if (mostrarCarregamento) {
          setHorariosPlanilha([]);
        }
      } finally {
        if (mostrarCarregamento) {
          setCarregandoAulas(false);
        }
      }
    };



  // =====================================================
  // CARREGAR PLANILHA AO ABRIR
  // =====================================================

  useEffect(() => {
    carregarHorariosPlanilha();
  }, [
    professor,
    carregandoProfessor,
  ]);

  // =====================================================
  // ATUALIZAÇÃO AUTOMÁTICA DA TELA
  // =====================================================

  useEffect(() => {
    if (
      carregandoProfessor ||
      !professor
    ) {
      return;
    }

    const intervalo =
      setInterval(() => {
        carregarHorariosPlanilha(
          false
        );
      }, 65 * 1000);

    return () => {
      clearInterval(intervalo);
    };
  }, [
    professor,
    carregandoProfessor,
  ]);

  // =====================================================
  // SINCRONIZAR PLANILHA AGORA
  // =====================================================

  const sincronizarAgora = async () => {
    if (sincronizando) {
      return;
    }

    try {
      setSincronizando(true);

      const response =
        await fetch(
          `${API_URL}/planilha/sincronizar`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro ||
            "Erro ao sincronizar planilha."
        );
      }

      console.log(
        "✅ Sincronização concluída:",
        data
      );

      await carregarHorariosPlanilha(
        false
      );
    } catch (error) {
      console.error(
        "❌ Erro ao sincronizar:",
        error
      );

      alert(
        "Não foi possível sincronizar a planilha."
      );
    } finally {
      setSincronizando(false);
    }
  };

  // =====================================================
  // CARREGAR PRESENÇAS DO MÊS
  // =====================================================

  const carregarPresencas = async () => {
  if (
    carregandoProfessor ||
    !professor
  ) {
    return;
  }

  try {
    setCarregandoPresencas(true);

    const response = await fetch(
      `${API_URL}/presencas?mes=${mesString}`,
      {
        credentials: "include",
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
      (
        data.presencas ||
        []
      ).map((presenca) => ({
        id: Number(
          presenca.id
        ),

        celula:
          presenca.celula,

        data:
          typeof presenca.data ===
          "string"
            ? presenca.data.split(
                "T"
              )[0]
            : presenca.data,

        status:
          presenca.status,
      }));

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

useEffect(() => {
  carregarPresencas();
}, [
  professor,
  carregandoProfessor,
  mesString,
]);

  // =========================
  // AULAS DO DIA
  // =========================
const aulasDoDia =
  horariosPlanilha
    .filter((aula) => {

      // ==========================================
      // AULA EXPERIMENTAL
      // Só aparece na data específica
      // ==========================================

      if (aula.tipo === "experimental") {
        if (!aula.dataExperimental) {
          return false;
        }

        const [dia, mes] =
          aula.dataExperimental.split("/");

        const dataAE =
          `${dataSelecionada.getFullYear()}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

        return dataAE === dataString;
      }

      // ==========================================
      // ALUNO NORMAL
      // Continua recorrente semanalmente
      // ==========================================

      // Se esse aluno foi substituído por uma AE
      // nessa data, ele não aparece nesse dia.
      if (aula.dataBloqueada) {
        const [dia, mes] =
          aula.dataBloqueada.split("/");

        const dataBloqueada =
          `${dataSelecionada.getFullYear()}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

        if (dataBloqueada === dataString) {
          return false;
        }
      }

      return (
        Number(aula.diaSemana) ===
        diaSelecionado
      );
    })
    .sort(
      (a, b) =>
        a.horario.localeCompare(
          b.horario
        )
    );
 // =========================
// ENCONTRAR PRESENÇA
// =========================

const encontrarPresenca = (aulaId) => {
  return presencas.find(
    (presenca) =>
      presenca.celula === aulaId &&
      presenca.data === dataString
  );
};

  // =====================================================
  // REGISTRAR PRESENÇA
  // =====================================================

  const registrarPresenca = async (
  aula,
  status
) => {

  try {

    if (!aula?.id) {
      console.error(
        "❌ Aula sem célula da planilha:",
        aula
      );

      return;
    }


    // =================================================
    // DATA DA CHAMADA
    // Usa o dia que esta selecionado na lista
    // =================================================

    const data = dataString;

    // =================================================
    // REGISTRAR
    // =================================================

    const response =
      await fetch(
        `${API_URL}/presencas`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            celula: aula.id,
            data,
            status,
          }),
        }
      );


    const resultado =
      await response.json();


    if (!response.ok) {

      throw new Error(
        resultado.mensagem ||
        "Erro ao registrar presença."
      );
    }


    console.log(
      "✅ Presença registrada:",
      resultado
    );


    // =================================================
    // ATUALIZAR PRESENÇAS DA TELA
    // =================================================

    setPresencas((anteriores) => {
  const dataAtual = data;

  const existente = anteriores.find(
    (presenca) =>
      presenca.celula === aula.id &&
      presenca.data === dataAtual
  );

  if (existente) {
    return anteriores.map((presenca) =>
      presenca.id === existente.id
        ? {
            ...presenca,
            status,
          }
        : presenca
    );
  }

  return [
    ...anteriores,
    {
      id: resultado.presenca.id,
      celula: aula.id,
      data: dataAtual,
      status,
    },
  ];
});


  } catch (error) {

    console.error(
      "❌ Erro ao registrar presença:",
      error
    );

    alert(
      error.message ||
      "Não foi possível registrar a presença."
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
        data >=
          primeiroDiaMes &&
        data <=
          ultimoDiaMes
      ) {
        setDiaSelecionado(
          dia
        );

        break;
      }
    }
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
        mesAtual +
          quantidade,
        1
      )
    );

    setSemanaSelecionada(
      0
    );

    setDiaSelecionado(1);
  };

  // =========================
  // NOME DO MÊS
  // =========================

  const nomeMes =
    mesSelecionado.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    );

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

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

              <button
          type="button"
          className="btn-sincronizar"
          onClick={sincronizarAgora}
          disabled={sincronizando}
        >
          {sincronizando ? (
            <>
              <FaRegHourglassHalf />
              Atualizando...
            </>
          ) : (
            <>
              <IoReloadSharp />
              Atualizar Alunos
            </>
          )}
        </button>

         

        </div>

      </div>


      {/* SEMANAS */}

      <Semanas
        semanas={semanas}
        semanaSelecionada={
          semanaSelecionada
        }
        nomeMes={nomeMes}
        trocarMes={trocarMes}
        obterIdSemana={
          obterIdSemana
        }
        formatarData={
          formatarData
        }
        selecionarSemana={
          selecionarSemana
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
            {aulasDoDia.length ===
            1
              ? "aula"
              : "aulas"}
          </span>

        </div>

        {/* LISTA */}

        <div className="presenca-lista">

          {aulasDoDia.length ===
          0 ? (
            <div className="presenca-vazia">

              <p>
                Nenhuma aula cadastrada
                para este dia.
              </p>

            </div>
          ) : (
            aulasDoDia.map(
              (aula) => {
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
                        {aula.nome}
                      </strong>

                     <span>
                      {nomesInstrumentos[aula.instrumento] ||
                        aula.instrumento ||
                        "Não informado"}
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