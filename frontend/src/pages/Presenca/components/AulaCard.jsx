function AulaCard({
  aula,
  aluno,
  presenca,
  onRegistrarPresenca,
  onExcluirAula
}) {

  if (!aluno) {
    return null;
  }

  return (
    <div className="aula-presenca">

      {/* HORÁRIO */}

      <strong>
        {aula.horario}
      </strong>


      {/* ALUNO */}

      <div className="aula-aluno">

        <h3>
          {aluno.nome}
        </h3>

        <p>
          {aluno.instrumento}
        </p>

      </div>


      {/* PRESENÇA */}

      <div className="aula-status-acoes">

        <button
          type="button"
          onClick={() =>
            onRegistrarPresenca(
              aula,
              "presente"
            )
          }
        >
          Presente
        </button>


        <button
          type="button"
          onClick={() =>
            onRegistrarPresenca(
              aula,
              "falta"
            )
          }
        >
          Falta
        </button>


        <button
          type="button"
          onClick={() =>
            onRegistrarPresenca(
              aula,
              "justificada"
            )
          }
        >
          Justificada
        </button>

      </div>


      {/* STATUS ATUAL */}

      {presenca && (

        <span className="aula-status">

          Status: {presenca.status}

        </span>

      )}


      {/* EXCLUIR */}

      <button
        type="button"
        className="btn-excluir-aula"
        onClick={() =>
          onExcluirAula(aula.id)
        }
      >
        Excluir horário
      </button>

    </div>
  );
}

export default AulaCard;