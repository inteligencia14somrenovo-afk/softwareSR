import { Link } from "react-router-dom";
import "../Configuração.css";

const PoliticaPrivacidade = () => {
return (
<div className="documento-configuracao">
<div className="documento-header">
<Link to="/config" className="documento-voltar">
← Voltar para Configurações
</Link>

    <h1>Política de Privacidade</h1>

    <p>
      Entenda como as informações são utilizadas e protegidas no
      Som Renovo Manager.
    </p>
  </div>

  <div className="documento-card">

    <div className="documento-aviso">
      <strong>Sobre este documento</strong>

      <p>
        Esta política apresenta, de forma transparente, como os dados
        pessoais podem ser tratados durante a utilização do sistema
        Som Renovo Manager.
      </p>
    </div>

    <div className="documento-secao">
      <h2>1. Coleta de dados</h2>

      <p>
        O Som Renovo Manager pode coletar e armazenar informações
        necessárias para o funcionamento do sistema e para a gestão
        interna da Som Renovo Escola de Música.
      </p>
    </div>

    <div className="documento-secao">
      <h2>2. Dados utilizados</h2>

      <p>
        Dependendo das funcionalidades utilizadas, podem ser tratados
        dados como nome, endereço de e-mail, foto de perfil e
        informações relacionadas às atividades administrativas,
        pedagógicas e operacionais da escola.
      </p>
    </div>

    <div className="documento-secao">
      <h2>3. Finalidade do tratamento</h2>

      <p>
        As informações são utilizadas para permitir o funcionamento
        do sistema, autenticar usuários, organizar informações,
        administrar atividades da escola e disponibilizar os recursos
        necessários aos usuários autorizados.
      </p>
    </div>

    <div className="documento-secao">
      <h2>4. Segurança das informações</h2>

      <p>
        A Som Renovo busca adotar medidas técnicas e administrativas
        adequadas para proteger as informações armazenadas no sistema
        contra acessos não autorizados, perda, alteração ou divulgação
        indevida.
      </p>
    </div>

    <div className="documento-secao">
      <h2>5. Compartilhamento de dados</h2>

      <p>
        Os dados podem ser acessados por pessoas autorizadas pela
        escola conforme suas funções e permissões no sistema.
        Informações também poderão ser compartilhadas quando isso
        for necessário para o funcionamento dos serviços ou quando
        houver obrigação legal aplicável.
      </p>
    </div>

    <div className="documento-secao">
      <h2>6. Direitos dos titulares</h2>

      <p>
        Os titulares de dados pessoais possuem os direitos previstos
        na legislação brasileira de proteção de dados, incluindo
        aqueles estabelecidos pela Lei Geral de Proteção de Dados
        Pessoais (LGPD).
      </p>
    </div>

    <div className="documento-secao">
      <h2>7. Alterações desta política</h2>

      <p>
        Esta política poderá ser atualizada quando houver mudanças
        relevantes no sistema, nos procedimentos internos ou na
        legislação aplicável.
      </p>
    </div>

    <div className="documento-secao">
      <h2>8. Contato</h2>

      <p>
        Para dúvidas, solicitações ou informações relacionadas à
        privacidade e proteção de dados, entre em contato com a
        administração da Som Renovo Escola de Música.
      </p>
    </div>

    <div className="documento-footer">
      Última atualização: 21 de setembro de 2026.
    </div>

  </div>
</div>

);
};

export default PoliticaPrivacidade;