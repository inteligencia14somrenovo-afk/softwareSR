import { Link } from "react-router-dom";
import "../Configuração.css";

const ContatoSuporte = () => {
const whatsapp = "5569992826734";
const email = "suporte@somrenovo.com.br";

const mensagemWhatsApp = encodeURIComponent(
"Olá! Preciso de ajuda com o Som Renovo Manager."
);

return (
<div className="documento-configuracao">
<div className="documento-header">
<Link to="/config" className="documento-voltar">
← Voltar para Configurações
</Link>

    <h1>Contato do Suporte</h1>

    <p>
      Precisa de ajuda com o sistema? Entre em contato com o
      responsável pelo Som Renovo Manager.
    </p>
  </div>

  <div className="documento-card">

    <div className="suporte-perfil">
      

      <div>
        <h2>Suporte Tecnico</h2>

        <p>
          Desenvolvimento e suporte do sistema
        </p>
      </div>
    </div>

    <div className="suporte-contatos">

      <div className="suporte-contato">
        <div className="suporte-contato-icone">
          💬
        </div>

        <div className="suporte-contato-texto">
          <span>WhatsApp</span>
          <strong>Atendimento pelo WhatsApp</strong>
        </div>

        <a
          href={`https://wa.me/${whatsapp}?text=${mensagemWhatsApp}`}
          target="_blank"
          rel="noreferrer"
          className="suporte-contato-botao"
        >
          Conversar
        </a>
      </div>

      <div className="suporte-contato">
        <div className="suporte-contato-icone">
          ✉
        </div>

        <div className="suporte-contato-texto">
          <span>E-mail</span>
          <strong>{email}</strong>
        </div>

        <a
          href={`mailto:${email}`}
          className="suporte-contato-botao"
        >
          Enviar e-mail
        </a>
      </div>

    </div>

    <div className="suporte-aviso">
      <strong>Antes de entrar em contato</strong>

      <p>
        Se você encontrou um erro no sistema, também pode utilizar
        a opção "Relatar um problema". Isso ajuda a registrar todas
        as informações necessárias para análise.
      </p>
    </div>

    <div className="suporte-acoes">
      <Link
        to="/config/relatar-problema"
        className="suporte-acao-secundaria"
      >
        Relatar um problema
      </Link>
    </div>

    <div className="documento-footer">
      Som Renovo Manager · Desenvolvimento e suporte
    </div>

  </div>
</div>

);
};

export default ContatoSuporte;