import "./Semanas.css";

function Semanas({
  semanas,
  semanaSelecionada,
  nomeMes,
  trocarMes,
  concluirMes,
  semanasConcluidas,
  obterIdSemana,
  formatarData,
  selecionarSemana,
  semanaAtualConcluida,
  alternarConclusaoSemana
}) {

  return (
    <>

        <div className="mes-controle">
            <button
                type="button"
                onClick={() => trocarMes(-1)}
            >
                ‹
            </button>

            <strong>
                {nomeMes}
            </strong>

            <button
                type="button"
                onClick={() => trocarMes(1)}
            >
                ›
            </button>
            </div>

      <div className="presenca-semanas">

        {semanas.map((semana, index) => {

          const ativa =
            semanaSelecionada === index;

          const concluida =
            semanasConcluidas.includes(
              obterIdSemana(index)
            );

          return (
            <button
              key={index}
              type="button"
              className={
                ativa
                  ? "semana ativa"
                  : "semana"
              }
              onClick={() =>
                selecionarSemana(index)
              }
            >
              <span>
                Semana {index + 1}
              </span>

              <small>
                {formatarData(
                  semana.inicioVisivel
                )}
                {" - "}
                {formatarData(
                  semana.fimVisivel
                )}
              </small>

              {concluida && (
                <em>✓ Concluída</em>
              )}
            </button>
          );

        })}

      </div>

      <div className="semana-controle">

        <span>
          {semanaAtualConcluida
            ? "✓ Semana concluída"
            : "Semana em andamento"}
        </span>

        <button
          type="button"
          onClick={alternarConclusaoSemana}
        >
          {semanaAtualConcluida
            ? "Reabrir semana"
            : "Concluir semana"}
        </button>

      </div>

      <button
        type="button"
        className="concluir-mes"
        onClick={concluirMes}
        >
        Concluir mês
        </button>
    </>
  );
}

export default Semanas;