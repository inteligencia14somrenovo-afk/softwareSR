import Modal from "../../../components/UI/Modal/Modal";
import Responsaveis from "./Responsaveis";

function AlunoDetalhes({
  aluno,
  nomesInstrumentos,
  calcularIdade,
  formatarAniversario,
  onClose,
  onAdicionarResponsavel,
  onExcluirResponsavel,
  onEditarResponsavel
}) {

  if (!aluno) {
    return null;
  }

  const idade =
    aluno.nascimento
      ? calcularIdade(aluno.nascimento)
      : null;

  const instrumento =
    nomesInstrumentos[aluno.instrumento] ||
    aluno.instrumento ||
    "Não informado";

  return (
    <Modal onClose={onClose}>

      <div className="aluno-detalhes">

        {/* CABEÇALHO */}

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

          </div>

        </div>


        {/* INFORMAÇÕES */}

        <div className="detalhes-section">

          <h3>
            Informações do aluno
          </h3>


          <p>
            🎸 <strong>Instrumento:</strong>{" "}
            {instrumento}
          </p>


          <p>
            🎂 <strong>Idade:</strong>{" "}
            {idade !== null
              ? `${idade} anos`
              : "Não informado"}
          </p>


          <p>
            📍 <strong>Unidade:</strong>{" "}
            {aluno.unidade || "Não informado"}
          </p>


          <p>
            🎉 <strong>Aniversário:</strong>{" "}
            {aluno.nascimento
              ? formatarAniversario(aluno.nascimento)
              : "Não informado"}
          </p>

        </div>


        {/* RESPONSÁVEIS */}

        <div className="detalhes-section">

          <h3>
            Responsáveis
          </h3>

          <Responsaveis
            aluno={aluno}
            onAdicionar={onAdicionarResponsavel}
            onExcluir={onExcluirResponsavel}
            onEditar={onEditarResponsavel}
          />

        </div>

      </div>

    </Modal>
  );
}


export default AlunoDetalhes;