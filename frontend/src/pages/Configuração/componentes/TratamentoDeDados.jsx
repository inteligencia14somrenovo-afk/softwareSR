import { Link } from "react-router-dom";
import "../Configuração.css";

const TratamentoDeDados = () => {
return (
<div className="documento-configuracao">
<div className="documento-header">
<Link to="/config" className="documento-voltar">
← Voltar para Configurações
</Link>

    <h1>Tratamento de Dados</h1>

    <p>
      Informações sobre o tratamento e a proteção de dados pessoais
      no Som Renovo Manager.
    </p>
  </div>

  <div className="documento-card">

    <div className="documento-aviso">
      <strong>Proteção de dados</strong>

      <p>
        O tratamento de dados pessoais deve ser realizado de forma
        responsável, observando as finalidades do sistema e a
        legislação brasileira aplicável.
      </p>
    </div>

    <div className="documento-secao">
      <h2>1. Quais dados podem ser tratados</h2>

      <p>
        Dependendo das funcionalidades utilizadas, o sistema pode
        tratar informações como nome, e-mail, foto de perfil e
        informações relacionadas à rotina administrativa e pedagógica
        da escola.
      </p>
    </div>

    <div className="documento-secao">
      <h2>2. Finalidade</h2>

      <p>
        O tratamento dos dados tem como finalidade permitir a execução
        das atividades administrativas e operacionais da Som Renovo
        Escola de Música, além de possibilitar o funcionamento das
        funcionalidades disponibilizadas pelo sistema.
      </p>
    </div>

    <div className="documento-secao">
      <h2>3. Acesso às informações</h2>

      <p>
        O acesso aos dados deve ocorrer de acordo com as funções e
        permissões atribuídas a cada usuário dentro do sistema.
      </p>
    </div>

    <div className="documento-secao">
      <h2>4. Armazenamento</h2>

      <p>
        As informações são armazenadas em sistemas e serviços
        utilizados para manter o funcionamento do Som Renovo Manager,
        observando as medidas de segurança aplicáveis.
      </p>
    </div>

    <div className="documento-secao">
      <h2>5. Proteção dos dados</h2>

      <p>
        São adotadas medidas técnicas e administrativas destinadas
        a reduzir os riscos de acesso, alteração, perda ou divulgação
        não autorizada das informações.
      </p>
    </div>

    <div className="documento-secao">
      <h2>6. LGPD</h2>

      <p>
        O tratamento de dados pessoais deve observar a Lei Geral de
        Proteção de Dados Pessoais (Lei nº 13.709/2018) e demais
        normas aplicáveis à proteção de dados pessoais no Brasil.
      </p>
    </div>

    <div className="documento-secao">
      <h2>7. Solicitações relacionadas aos dados</h2>

      <p>
        Caso exista alguma dúvida ou solicitação relacionada ao uso
        de dados pessoais, o usuário ou titular poderá procurar a
        administração da Som Renovo Escola de Música pelos canais
        disponibilizados pela instituição.
      </p>
    </div>

    <div className="documento-secao">
      <h2>8. Atualizações</h2>

      <p>
        As informações desta página poderão ser atualizadas para
        acompanhar alterações no funcionamento do sistema, nos
        procedimentos internos ou na legislação aplicável.
      </p>
    </div>

    <div className="documento-footer">
      Última atualização: 21 de setembro de 2026.
    </div>

  </div>
</div>

);
};

export default TratamentoDeDados;