import "./Turmas.css";

const Turmas = () => {
  return (
    <div className="turmas-page">
      <div className="turmas-header">
        <div>
          <h1>Turmas</h1>
          <p>Gerencie as turmas da escola.</p>
        </div>

        <button className="turmas-nova-button">
          + Nova turma
        </button>
      </div>

      <div className="turmas-lista">
        <div className="turmas-vazio">
          <h3>Nenhuma turma cadastrada</h3>
          <p>
            As turmas cadastradas aparecerão aqui.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Turmas;