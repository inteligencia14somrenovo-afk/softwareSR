function AlunoCard({
  aluno,
  nomesInstrumentos,
  calcularIdade,
  abrirDetalhes
}) {

  return (
    <div
      className={`card-aluno ${aluno.cor}`}
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
            aluno.instrumento}

        </p>


        <p>

          <span>
            Idade
          </span>

          {calcularIdade(aluno.nascimento)} anos

        </p>


        <p>

          <span>
            Local
          </span>

          📍 {aluno.unidade}

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