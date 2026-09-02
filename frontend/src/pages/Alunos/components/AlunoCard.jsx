function AlunoCard({
  aluno,
  nomesInstrumentos,
  calcularIdade,
  abrirDetalhes
}) {

  // Normaliza o instrumento para usar nas classes do CSS
  const classeInstrumento =
    aluno.instrumento === "teclado/piano"
      ? "teclado"
      : aluno.instrumento || "";

  // Como a planilha atualmente não possui data de nascimento,
  // evita mostrar uma idade inválida.
  const idade =
    aluno.nascimento
      ? calcularIdade(aluno.nascimento)
      : null;

  return (
    <div
      className={`card-aluno ${classeInstrumento}`}
      onClick={() => abrirDetalhes(aluno)}
    >

      {/* NOME + FOTO */}

      <div className="card-top">

        <div className="card-identificacao">

          <h2>
            {aluno.nome}
          </h2>

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


      {/* INFORMAÇÕES */}

      <div className="card-info">

        <p>

          <span>
            Instrumento
          </span>

          {nomesInstrumentos[aluno.instrumento] ||
            aluno.instrumento ||
            "Não informado"}

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


      {/* MAIS */}

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