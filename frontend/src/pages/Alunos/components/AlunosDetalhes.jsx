import Button from "../../../components/UI/Button/Button";
import Modal from "../../../components/UI/Modal/Modal";
import Responsaveis from "./Responsaveis";

function AlunoDetalhes({
  aluno,
  nomesInstrumentos,
  calcularIdade,
  formatarAniversario,
  statusAluno,
  onClose,
  onEditar,
  onExcluir,
  onAdicionarResponsavel,
  onExcluirResponsavel,
  onEditarResponsavel
}) {

  if (!aluno) {
    return null;
  }

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


            <span
              className={`status-badge ${
                statusAluno(aluno.status).classe
              }`}
            >

              {statusAluno(aluno.status).texto}

            </span>

          </div>

        </div>


        {/* INFORMAÇÕES */}

        <div className="detalhes-section">

          <h3>
            Informações do aluno
          </h3>


          <p>
            🎸 <strong>Instrumento:</strong>{" "}
            {
              nomesInstrumentos[aluno.instrumento]
            }
          </p>


          <p>
            🎂 <strong>Idade:</strong>{" "}
            {calcularIdade(aluno.nascimento)} anos
          </p>


          <p>
            📍 <strong>Unidade:</strong>{" "}
            {aluno.unidade}
          </p>


          <p>
            🎉 <strong>Aniversário:</strong>{" "}
            {formatarAniversario(aluno.nascimento) ||
              "Não informado"}
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


        {/* AÇÕES */}

        <div className="detalhes-actions">

          <Button onClick={onEditar}>
            ✏️ Editar
          </Button>


          <button
            className="btn-excluir"
            onClick={onExcluir}
          >
            🗑️ Excluir
          </button>

        </div>

      </div>

    </Modal>
  );
}


export default AlunoDetalhes;