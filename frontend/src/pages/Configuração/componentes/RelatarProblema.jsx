import { useState } from "react";
import { Link } from "react-router-dom";
import "../Configuração.css";

const RelatarProblema = () => {
const [assunto, setAssunto] = useState("");
const [pagina, setPagina] = useState("");
const [descricao, setDescricao] = useState("");
const [enviado, setEnviado] = useState(false);

const enviarRelato = (event) => {
event.preventDefault();

if (!assunto.trim() || !descricao.trim()) {
  return;
}

setEnviado(true);
setAssunto("");
setPagina("");
setDescricao("");

};

return (
<div className="documento-configuracao">
<div className="documento-header">
<Link to="/config" className="documento-voltar">
← Voltar para Configurações
</Link>

    <h1>Relatar um problema</h1>

    <p>
      Encontrou algum erro ou comportamento inesperado?
      Conte o que aconteceu para que possamos verificar.
    </p>
  </div>

  <div className="documento-card">

    {enviado ? (
      <>
        <div className="problema-sucesso">
          <div className="problema-sucesso-icone">
            ✓
          </div>

          <div>
            <strong>Relato registrado</strong>

            <p>
              Obrigado por informar o problema. Sua mensagem foi
              registrada para análise.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="problema-novo"
          onClick={() => setEnviado(false)}
        >
          Relatar outro problema
        </button>
      </>
    ) : (
      <form
        className="problema-formulario"
        onSubmit={enviarRelato}
      >
        <div className="problema-campo">
          <label htmlFor="assunto">
            Assunto
          </label>

          <input
            id="assunto"
            type="text"
            value={assunto}
            onChange={(event) => setAssunto(event.target.value)}
            placeholder="Ex.: Erro ao cadastrar aluno"
            required
          />
        </div>

        <div className="problema-campo">
          <label htmlFor="pagina">
            Em qual página aconteceu?
          </label>

          <select
            id="pagina"
            value={pagina}
            onChange={(event) => setPagina(event.target.value)}
          >
            <option value="">
              Selecione uma opção
            </option>

            <option value="Tela Inicial">
              Tela Inicial
            </option>

            <option value="Alunos">
              Alunos
            </option>

            <option value="Bandas">
              Bandas
            </option>

            <option value="Presença">
              Presença
            </option>

            <option value="Relatório">
              Relatório
            </option>

            <option value="Configurações">
              Configurações
            </option>

            <option value="Outra">
              Outra
            </option>
          </select>
        </div>

        <div className="problema-campo">
          <label htmlFor="descricao">
            O que aconteceu?
          </label>

          <textarea
            id="descricao"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Descreva o problema, o que você estava fazendo e o que aconteceu."
            rows={7}
            required
          />
        </div>

        <div className="problema-aviso">
          <strong>Dica</strong>

          <p>
            Quanto mais detalhes você fornecer, mais fácil será
            identificar e corrigir o problema.
          </p>
        </div>

        <div className="problema-acoes">
          <Link
            to="/config"
            className="problema-cancelar"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="problema-enviar"
          >
            Enviar relato
          </button>
        </div>
      </form>
    )}

    <div className="documento-footer">
      Se o problema impedir o uso do sistema, entre em contato
      diretamente com o suporte.
    </div>

  </div>
</div>

);
};

export default RelatarProblema;