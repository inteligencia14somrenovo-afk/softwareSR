import { Link } from "react-router-dom";
import "../Configuração.css";

const TermosDeUso = () => {
return (
<div className="documento-configuracao">
<div className="documento-header">
<Link to="/config" className="documento-voltar">
← Voltar para Configurações
</Link>

    <h1>Termos de Uso</h1>

    <p>
      Condições gerais para utilização do Som Renovo Manager.
    </p>
  </div>

  <div className="documento-card">

    <div className="documento-aviso">
      <strong>Sobre este documento</strong>

      <p>
        Estes termos estabelecem as condições gerais para utilização
        do Som Renovo Manager por usuários autorizados pela
        Som Renovo Escola de Música.
      </p>
    </div>

    <div className="documento-secao">
      <h2>1. Finalidade do sistema</h2>

      <p>
        O Som Renovo Manager é uma ferramenta destinada a auxiliar
        na organização e gestão das atividades internas da
        Som Renovo Escola de Música.
      </p>
    </div>

    <div className="documento-secao">
      <h2>2. Acesso ao sistema</h2>

      <p>
        O acesso ao sistema é destinado exclusivamente a usuários
        autorizados pela escola. Cada usuário deve utilizar sua
        própria conta e respeitar as permissões associadas ao seu
        perfil.
      </p>
    </div>

    <div className="documento-secao">
      <h2>3. Uso adequado</h2>

      <p>
        O sistema deve ser utilizado exclusivamente para finalidades
        relacionadas às atividades da escola. O usuário não deve
        utilizar a plataforma para atividades ilícitas, prejudiciais
        ao sistema ou incompatíveis com suas funções.
      </p>
    </div>

    <div className="documento-secao">
      <h2>4. Responsabilidade do usuário</h2>

      <p>
        O usuário é responsável pelas informações inseridas no sistema
        dentro de suas atribuições e deve procurar mantê-las corretas,
        atualizadas e adequadas à finalidade do sistema.
      </p>
    </div>

    <div className="documento-secao">
      <h2>5. Segurança da conta</h2>

      <p>
        O usuário deve manter seus meios de acesso protegidos e não
        compartilhar suas credenciais ou permitir que terceiros
        utilizem sua conta.
      </p>
    </div>

    <div className="documento-secao">
      <h2>6. Disponibilidade do sistema</h2>

      <p>
        A escola poderá realizar manutenções, atualizações ou ajustes
        técnicos que possam causar indisponibilidade temporária de
        determinadas funcionalidades.
      </p>
    </div>

    <div className="documento-secao">
      <h2>7. Alterações dos termos</h2>

      <p>
        Estes termos poderão ser atualizados quando necessário para
        refletir mudanças no sistema, nos procedimentos internos ou
        na legislação aplicável.
      </p>
    </div>

    <div className="documento-secao">
      <h2>8. Encerramento de acesso</h2>

      <p>
        O acesso de um usuário poderá ser alterado, suspenso ou
        encerrado conforme as necessidades administrativas da escola
        ou quando houver descumprimento das regras de utilização.
      </p>
    </div>

    <div className="documento-footer">
      Última atualização: 21 de setembro de 2026.
    </div>

  </div>
</div>

);
};

export default TermosDeUso;