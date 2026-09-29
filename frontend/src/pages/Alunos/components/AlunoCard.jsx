function AlunoCard({
  aluno,
  nomesInstrumentos,
  calcularIdade,
  abrirDetalhes
}) {

  // =====================================================
  // INSTRUMENTO → CLASSE CSS
  //
  // Quando existe instrumento_especifico, ele tem
  // prioridade sobre o instrumento base da planilha.
  //
  // Isso permite que a cor do card acompanhe a escolha
  // feita pelo professor.
  // =====================================================

  const mapaInstrumentos = {
    // Instrumentos específicos
    guitarra: "guitarra",
    violao: "violao",
    ukulele: "ukulele",
    contrabaixo: "contrabaixo",

    teclado: "teclado",
    piano: "piano",

    violino: "violino",
    canto: "canto",
    bateria: "bateria",

    // Categorias vindas da planilha
    "teclado/piano": "teclado",
    "guitarra/violao/ukulele/contrabaixo": "guitarra",
    "guitarra/violao": "guitarra"
  };


  const instrumentoParaCor =
    aluno.instrumento_especifico ||
    aluno.instrumento ||
    "";


  const classeInstrumento =
    mapaInstrumentos[instrumentoParaCor] ||
    "";


  // =====================================================
  // INSTRUMENTO EXIBIDO
  // =====================================================

  let nomeInstrumento =
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

    nomeInstrumento =
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

    nomeInstrumento =
      aluno.instrumento_especifico === "teclado"
        ? "Teclado"
        : aluno.instrumento_especifico === "piano"
          ? "Piano"
          : "Teclado ou Piano";
  }


  // =====================================================
  // IDADE
  // =====================================================

  const idade =
    aluno.nascimento
      ? calcularIdade(aluno.nascimento)
      : null;


  return (

    <div
      className={`card-aluno ${classeInstrumento}`}
      onClick={() => abrirDetalhes(aluno)}
    >

      {/* =====================================================
          NOME + CÓDIGO + FOTO
      ===================================================== */}

      <div className="card-top">

        <div className="card-identificacao">

          <h2>
            {aluno.nome}
          </h2>


          {/* =================================================
              CÓDIGO DO ALUNO
          ================================================= */}

          <p className="codigo-aluno">

            Código:{" "}

            {aluno.codigoAluno ??
              aluno.codigo_aluno ??
              "Não informado"}

          </p>

        </div>


        <div className="foto-aluno">

          {aluno.foto ? (

            <img
              src={aluno.foto}
              alt={aluno.nome}
            />

          ) : (

            "👤"

          )}

        </div>

      </div>


      {/* =====================================================
          INFORMAÇÕES
      ===================================================== */}

      <div className="card-info">

        <p>

          <span>
            Instrumentoㅤ
          </span>

          {nomeInstrumento}

        </p>


        <p>

          <span>
            Idade
          </span>

          {idade !== null
            ? `${idade} anos`
            : "Não informado"}

        </p>


        <p>

          <span>
            Local
          </span>

          📍 {aluno.unidade || "Não informado"}

        </p>

      </div>


      {/* =====================================================
          MAIS
      ===================================================== */}

      <button
        className="card-more"
        type="button"
        onClick={(e) => {

          e.stopPropagation();

          abrirDetalhes(aluno);

        }}
      >

        ⋮ Mais

      </button>

    </div>

  );

}


export default AlunoCard;