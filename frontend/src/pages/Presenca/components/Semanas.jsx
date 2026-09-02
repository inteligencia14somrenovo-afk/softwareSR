import "./Semanas.css";

function Semanas({
  semanas,
  semanaSelecionada,
  nomeMes,
  trocarMes,
  formatarData,
  selecionarSemana
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
            </button>
          );
        })}
      </div>
    </>
  );
}

export default Semanas;