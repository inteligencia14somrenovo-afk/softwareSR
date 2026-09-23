import { useState } from "react";
import { Link } from "react-router-dom";
import "../Configuração.css";

const perguntas = [
{
pergunta: "Como editar os dados de um aluno?",
resposta:
"Na página Alunos, localize o aluno desejado e utilize a opção de edição. Após alterar as informações, salve as mudanças.",
},
{
pergunta: "Como registrar a presença?",
resposta:
"Acesse a seção Presença pelo menu principal. Selecione a turma ou o período correspondente e registre a presença dos alunos.",
},
{
pergunta: "Como consultar um relatório?",
resposta:
"Acesse a seção Relatório no menu principal. Utilize os filtros disponíveis para consultar as informações desejadas.",
},
{
pergunta: "Como alterar meu nome ou foto?",
resposta:
"Acesse Configurações pelo menu do sistema. Na seção Meu perfil, você pode alterar seu nome e atualizar sua foto.",
},
{
pergunta: "Como sair da minha conta?",
resposta:
"Acesse Configurações e procure a seção Conta. Depois, clique em Sair da conta.",
},
{
pergunta: "Não consigo acessar o sistema. O que faço?",
resposta:
"Confira sua conexão com a internet e tente acessar novamente. Se o problema continuar, utilize a opção Relatar um problema ou entre em contato com o suporte.",
},
{
pergunta: "Encontrei um erro no sistema. O que faço?",
resposta:
"Você pode utilizar a opção Relatar um problema para informar o que aconteceu. Se possível, informe em qual página ocorreu o problema e descreva os passos realizados.",
},
];

const CentralAjuda = () => {
const [aberta, setAberta] = useState(null);

const alternarPergunta = (index) => {
setAberta(aberta === index ? null : index);
};

return (
<div className="documento-configuracao">
<div className="documento-header">
<Link to="/config" className="documento-voltar">
← Voltar para Configurações
</Link>

    <h1>Central de Ajuda</h1>

    <p>
      Encontre respostas para as dúvidas mais comuns sobre o
      Som Renovo Manager.
    </p>
  </div>

  <div className="documento-card">

    <div className="documento-aviso">
      <strong>Precisa de ajuda?</strong>

      <p>
        Confira as perguntas abaixo. Se não encontrar o que procura,
        você pode relatar um problema ou entrar em contato com o suporte.
      </p>
    </div>

    <div className="ajuda-lista">
      {perguntas.map((item, index) => {
        const estaAberta = aberta === index;

        return (
          <div
            className={`ajuda-item ${
              estaAberta ? "aberto" : ""
            }`}
            key={item.pergunta}
          >
            <button
              type="button"
              className="ajuda-pergunta"
              onClick={() => alternarPergunta(index)}
            >
              <span>{item.pergunta}</span>

              <span className="ajuda-icone">
                {estaAberta ? "−" : "+"}
              </span>
            </button>

            {estaAberta && (
              <div className="ajuda-resposta">
                {item.resposta}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <div className="ajuda-acoes">
      <Link
        to="/config/relatar-problema"
        className="ajuda-acao"
      >
        Relatar um problema
      </Link>

      <Link
        to="/config/contato-suporte"
        className="ajuda-acao"
      >
        Falar com o suporte
      </Link>
    </div>

    <div className="documento-footer">
      A Central de Ajuda poderá receber novos conteúdos conforme o
      sistema ganhar novas funcionalidades.
    </div>

  </div>
</div>

);
};

export default CentralAjuda;