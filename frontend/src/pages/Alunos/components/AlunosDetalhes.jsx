import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Modal from "../../../components/UI/Modal/Modal";
import API_URL from "../../../config/api";

function AlunoDetalhes({
  aluno,
  nomesInstrumentos,
  calcularIdade,
  formatarAniversario,
  onClose,
  onAlunoAtualizado
}) {

  const { professor } = useAuth();


  // =====================================================
  // NASCIMENTO
  // =====================================================

  const [editandoNascimento, setEditandoNascimento] =
    useState(false);

  const [nascimento, setNascimento] = useState(
    aluno?.nascimento
      ? String(aluno.nascimento).split("T")[0]
      : ""
  );

  const [salvandoNascimento, setSalvandoNascimento] =
    useState(false);


  // =====================================================
  // INSTRUMENTO
  // =====================================================

  const [editandoInstrumento, setEditandoInstrumento] =
    useState(false);

  const [instrumentoSelecionado, setInstrumentoSelecionado] =
    useState(
      aluno?.instrumento_especifico || ""
    );

  const [salvandoInstrumento, setSalvandoInstrumento] =
    useState(false);


  // =====================================================
  // MENSAGENS
  // =====================================================

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");


  if (!aluno) return null;


  // =====================================================
  // DADOS
  // =====================================================

  const idade =
    aluno.nascimento
      ? calcularIdade(aluno.nascimento)
      : null;


  const podeEditarNascimento =
    professor?.role === "admin" ||
    professor?.role === "dev";


  const podeEditarInstrumento =
    professor?.role === "admin" ||
    professor?.role === "dev";


  const nascimentoCadastrado =
    Boolean(aluno.nascimento);


  const instrumentoAmbiguo =
    aluno.instrumento ===
      "guitarra/violao/ukulele/contrabaixo" ||
    aluno.instrumento === "guitarra/violao" ||
    aluno.instrumento === "teclado/piano";


  // =====================================================
  // NOME DO INSTRUMENTO
  // =====================================================

  let instrumento =
    nomesInstrumentos[aluno.instrumento] ||
    aluno.instrumento ||
    "Não informado";


  // =====================================================
  // 🎸 GUITARRA / VIOLÃO / UKULELE / CONTRABAIXO
  // =====================================================

  if (
    aluno.instrumento ===
      "guitarra/violao/ukulele/contrabaixo" ||
    aluno.instrumento === "guitarra/violao"
  ) {

    instrumento =
      aluno.instrumento_especifico === "guitarra"
        ? "Guitarra"
        : aluno.instrumento_especifico === "violao"
          ? "Violão"
          : aluno.instrumento_especifico === "ukulele"
            ? "Ukulele"
            : aluno.instrumento_especifico === "contrabaixo"
              ? "Contrabaixo"
              : "Guitarra, Violão, Ukulele ou Contrabaixo";
  }


  // =====================================================
  // 🎹 TECLADO / PIANO
  // =====================================================

  if (
    aluno.instrumento === "teclado/piano"
  ) {

    instrumento =
      aluno.instrumento_especifico === "teclado"
        ? "Teclado"
        : aluno.instrumento_especifico === "piano"
          ? "Piano"
          : "Teclado ou Piano";

  }


  // =====================================================
  // OPÇÕES DE INSTRUMENTO
  // =====================================================

  const opcoesInstrumento =
    aluno.instrumento ===
      "guitarra/violao/ukulele/contrabaixo" ||
    aluno.instrumento === "guitarra/violao"

      ? [
          {
            valor: "guitarra",
            nome: "Guitarra"
          },
          {
            valor: "violao",
            nome: "Violão"
          },
          {
            valor: "ukulele",
            nome: "Ukulele"
          },
          {
            valor: "contrabaixo",
            nome: "Contrabaixo"
          }
        ]

      : aluno.instrumento === "teclado/piano"

        ? [
            {
              valor: "teclado",
              nome: "Teclado"
            },
            {
              valor: "piano",
              nome: "Piano"
            }
          ]

        : [];


  // =====================================================
  // SALVAR NASCIMENTO
  // =====================================================

  const salvarNascimento = async () => {

    setErro("");
    setMensagem("");


    if (!nascimento) {

      setErro(
        "Informe a data de nascimento."
      );

      return;

    }


    try {

      setSalvandoNascimento(true);


      const response = await fetch(
        `${API_URL}/alunos/${aluno.id}`,
        {
          method: "PUT",

          credentials: "include",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            nascimento
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.mensagem ||
          data.erro ||
          "Não foi possível salvar a data de nascimento."
        );

      }


      const alunoAtualizado = {
        ...aluno,
        ...data.aluno,
        nascimento:
          data.aluno?.nascimento ||
          nascimento
      };


      if (onAlunoAtualizado) {
        onAlunoAtualizado(
          alunoAtualizado
        );
      }


      setNascimento(
        String(
          alunoAtualizado.nascimento
        ).split("T")[0]
      );


      setEditandoNascimento(false);


      setMensagem(
        "Data de nascimento salva com sucesso."
      );


    } catch (error) {

      console.error(
        "❌ Erro ao salvar nascimento:",
        error
      );


      setErro(
        error.message ||
        "Erro ao salvar data de nascimento."
      );


    } finally {

      setSalvandoNascimento(false);

    }

  };


  // =====================================================
  // SALVAR INSTRUMENTO
  // =====================================================

  const salvarInstrumento = async () => {

    setErro("");
    setMensagem("");


    if (!instrumentoSelecionado) {

      setErro(
        "Selecione o instrumento."
      );

      return;

    }


    try {

      setSalvandoInstrumento(true);


      const response = await fetch(
        `${API_URL}/alunos/${aluno.id}/instrumento`,
        {
          method: "PUT",

          credentials: "include",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            instrumento_especifico:
              instrumentoSelecionado
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.mensagem ||
          data.erro ||
          "Não foi possível salvar o instrumento."
        );

      }


      const alunoAtualizado = {
        ...aluno,
        ...data.aluno,
        instrumento_especifico:
          data.aluno?.instrumento_especifico ||
          instrumentoSelecionado
      };


      if (onAlunoAtualizado) {
        onAlunoAtualizado(
          alunoAtualizado
        );
      }


      setInstrumentoSelecionado(
        alunoAtualizado.instrumento_especifico
      );


      setEditandoInstrumento(false);


      setMensagem(
        "Instrumento definido com sucesso."
      );


    } catch (error) {

      console.error(
        "❌ Erro ao salvar instrumento:",
        error
      );


      setErro(
        error.message ||
        "Erro ao salvar instrumento."
      );


    } finally {

      setSalvandoInstrumento(false);

    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <Modal onClose={onClose}>

      <div className="aluno-detalhes">


        {/* =====================================================
            CABEÇALHO
        ===================================================== */}

        <div className="detalhes-header">

          <div className="detalhes-foto">

            {aluno.foto ? (

              <img
                src={aluno.foto}
                alt={aluno.nome}
              />

            ) : (

              "👤"

            )}

          </div>


<div>

  <h2>
    {aluno.nome}
  </h2>

  <p className="codigo-aluno">
    Código:{" "}
    {aluno.codigoAluno ??
      aluno.codigo_aluno ??
      "Não informado"}
  </p>

</div>

        </div>


        {/* =====================================================
            INFORMAÇÕES
        ===================================================== */}

        <div className="detalhes-section">

          <h3>
            Informações do aluno
          </h3>


          {/* =====================================================
              INSTRUMENTO
          ===================================================== */}

          <div className="campo-instrumento">

            <p>
              🎸 <strong>Instrumento:</strong>{" "}
              {instrumento}
            </p>


            {instrumentoAmbiguo && (
              <>

                {/* =================================================
                    AINDA NÃO DEFINIDO
                ================================================= */}

                {!aluno.instrumento_especifico &&
                !editandoInstrumento && (

                  <div className="instrumento-escolha">

                    <p>
                      Selecione o instrumento
                      deste aluno:
                    </p>


                    <div className="instrumento-opcoes">

                      {opcoesInstrumento.map(
                        (opcao) => (

                          <button
                            key={opcao.valor}
                            type="button"
                            className={
                              `instrumento-opcao ${
                                instrumentoSelecionado ===
                                opcao.valor
                                  ? "selecionado"
                                  : ""
                              }`
                            }
                            onClick={() => {

                              setInstrumentoSelecionado(
                                opcao.valor
                              );

                              setErro("");
                              setMensagem("");

                            }}
                          >

                            {opcao.nome}

                          </button>

                        )
                      )}

                    </div>


                    {instrumentoSelecionado && (

                      <div className="instrumento-acoes">

                        <button
                          type="button"
                          className="instrumento-btn-salvar"
                          onClick={
                            salvarInstrumento
                          }
                          disabled={
                            salvandoInstrumento
                          }
                        >

                          {salvandoInstrumento
                            ? "Salvando..."
                            : "Salvar instrumento"}

                        </button>

                      </div>

                    )}

                  </div>

                )}


                {/* =================================================
                    ADMIN / DEV EDITANDO
                ================================================= */}

                {aluno.instrumento_especifico &&
                editandoInstrumento && (

                  <div className="instrumento-escolha">

                    <p>
                      Alterar instrumento:
                    </p>


                    <div className="instrumento-opcoes">

                      {opcoesInstrumento.map(
                        (opcao) => (

                          <button
                            key={opcao.valor}
                            type="button"
                            className={
                              `instrumento-opcao ${
                                instrumentoSelecionado ===
                                opcao.valor
                                  ? "selecionado"
                                  : ""
                              }`
                            }
                            onClick={() =>
                              setInstrumentoSelecionado(
                                opcao.valor
                              )
                            }
                          >

                            {opcao.nome}

                          </button>

                        )
                      )}

                    </div>


                    <div className="instrumento-acoes">

                      <button
                        type="button"
                        className="instrumento-btn-salvar"
                        onClick={
                          salvarInstrumento
                        }
                        disabled={
                          salvandoInstrumento
                        }
                      >

                        {salvandoInstrumento
                          ? "Salvando..."
                          : "Salvar"}

                      </button>


                      <button
                        type="button"
                        className="instrumento-btn-cancelar"
                        onClick={() => {

                          setInstrumentoSelecionado(
                            aluno.instrumento_especifico
                          );

                          setEditandoInstrumento(
                            false
                          );

                          setErro("");
                          setMensagem("");

                        }}
                        disabled={
                          salvandoInstrumento
                        }
                      >

                        Cancelar

                      </button>

                    </div>

                  </div>

                )}


                {/* =================================================
                    ADMIN / DEV — BOTÃO EDITAR
                ================================================= */}

                {aluno.instrumento_especifico &&
                !editandoInstrumento &&
                podeEditarInstrumento && (

                  <button
                    type="button"
                    className="instrumento-btn-editar"
                    onClick={() => {

                      setInstrumentoSelecionado(
                        aluno.instrumento_especifico
                      );

                      setEditandoInstrumento(
                        true
                      );

                      setErro("");
                      setMensagem("");

                    }}
                  >

                    ✏️ Editar instrumento

                  </button>

                )}

              </>
            )}

          </div>



          {/* =====================================================
              NASCIMENTO / IDADE
          ===================================================== */}

          {!nascimentoCadastrado ||
          editandoNascimento ? (

            <div
              className="campo-nascimento"
            >

              <label
                htmlFor="nascimento-aluno"
              >
                🎂 Data de nascimento
              </label>


              <input
                id="nascimento-aluno"
                type="date"
                value={nascimento}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) =>
                  setNascimento(
                    e.target.value
                  )
                }
                disabled={
                  salvandoNascimento
                }
              />


              <div
                className="nascimento-acoes"
              >

                <button
                  className="nascimento-btn-salvar"
                  type="button"
                  onClick={
                    salvarNascimento
                  }
                  disabled={
                    salvandoNascimento
                  }
                >

                  {salvandoNascimento
                    ? "Salvando..."
                    : "Salvar"}

                </button>


                {editandoNascimento && (

                  <button
                    className="nascimento-btn-cancelar"
                    type="button"
                    onClick={() => {

                      setNascimento(
                        aluno.nascimento
                          ? String(
                              aluno.nascimento
                            ).split("T")[0]
                          : ""
                      );

                      setEditandoNascimento(
                        false
                      );

                      setErro("");
                      setMensagem("");

                    }}
                    disabled={
                      salvandoNascimento
                    }
                  >

                    Cancelar

                  </button>

                )}

              </div>

            </div>

          ) : (

            <>

              <p>
                🎂 <strong>Idade:</strong>{" "}
                {idade !== null
                  ? `${idade} anos`
                  : "Não informado"}
              </p>


              <p>
                🎉 <strong>Aniversário:</strong>{" "}
                {formatarAniversario(
                  aluno.nascimento
                )}
              </p>


              {podeEditarNascimento && (

                <button
                  type="button"
                  onClick={() => {

                    setErro("");
                    setMensagem("");

                    setEditandoNascimento(
                      true
                    );

                  }}
                  className="nascimento-btn-editar"
                >

                  ✏️ Editar data de nascimento

                </button>

              )}

            </>

          )}

           {/* =====================================================
              UNIDADE
          ===================================================== */}

          <p>
            📍 <strong>Unidade:</strong>{" "}
            {aluno.unidade ||
              "Não informado"}
          </p>



          {/* =====================================================
              MENSAGENS
          ===================================================== */}

          {mensagem && (

            <p
              className="nascimento-mensagem nascimento-sucesso"
            >
              {mensagem}
            </p>

          )}


          {erro && (

            <p
              className="nascimento-mensagem nascimento-erro"
            >
              {erro}
            </p>

          )}

        </div>

      </div>

    </Modal>

  );

}


export default AlunoDetalhes;