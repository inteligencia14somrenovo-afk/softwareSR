import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaCamera,
  FaCheck,
  FaGoogle,
  FaSignOutAlt,
} from "react-icons/fa";
import API_URL from "../../config/api";
import "./Configuração.css";

const Configuração = () => {
  const { professor, setProfessor } = useAuth();

  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoPreview, setFotoPreview] = useState("");

  const [notificacoes, setNotificacoes] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const inputFotoRef = useRef(null);

  useEffect(() => {
    if (!professor) return;

    setNome(professor.nome || "");
    setFotoUrl(professor.foto_url || "");
    setFotoPreview(professor.foto_url || "");
  }, [professor]);

  useEffect(() => {
    const notificacoesSalvas =
      localStorage.getItem("som-renovo-notificacoes");

    if (notificacoesSalvas !== null) {
      setNotificacoes(notificacoesSalvas === "true");
    }
  }, []);

  const selecionarFoto = (event) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem válido.");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setErro("");
    setMensagem("");

    const novaPreview = URL.createObjectURL(arquivo);

    setFotoPreview(novaPreview);
  };

  const salvarPerfil = async (event) => {
    event.preventDefault();

    setMensagem("");
    setErro("");

    try {
      setSalvando(true);

      const response = await fetch(
        `${API_URL}/professores/perfil`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nome.trim() || null,
            foto_url: fotoUrl || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErro(
          data.mensagem ||
            "Não foi possível salvar as alterações."
        );
        return;
      }

      setProfessor(data.professor);

      setMensagem(
        "Perfil atualizado com sucesso."
      );

    } catch (error) {
      console.error(
        "Erro ao salvar perfil:",
        error
      );

      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setSalvando(false);
    }
  };

  const alterarNotificacoes = () => {
    const novoValor = !notificacoes;

    setNotificacoes(novoValor);

    localStorage.setItem(
      "som-renovo-notificacoes",
      String(novoValor)
    );

    window.dispatchEvent(
      new Event(
        "som-renovo-notificacoes-alteradas"
      )
    );
  };

  const sairDaConta = async () => {
    const confirmar = window.confirm(
      "Tem certeza que deseja sair da sua conta?"
    );

    if (!confirmar) return;

    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Erro ao sair:",
        error
      );
    } finally {
      setProfessor(null);
      window.location.href = "/login";
    }
  };

  if (!professor) {
    return (
      <div className="configuracao-page">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const primeiroNome = nome.trim()
    ? nome.trim().split(/\s+/)[0]
    : "Professor";

  return (
    <div className="configuracao-page">

      {/* CABEÇALHO */}

      <div className="configuracao-header">

        <div>
          <h1>Configurações</h1>

          <p>
            Gerencie seu perfil e as preferências
            do sistema.
          </p>
        </div>

      </div>


      {/* 1. MEU PERFIL */}

      <section className="configuracao-card">

        <div className="card-title">

          <div className="card-icon">
            👤
          </div>

          <div>
            <h2>Meu perfil</h2>

            <p>
              Personalize as informações exibidas
              no sistema.
            </p>
          </div>

        </div>


        <form onSubmit={salvarPerfil}>

          <div className="perfil-principal">

            <div className="foto-container">

              <div
                className="perfil-foto"
                onClick={() =>
                  inputFotoRef.current?.click()
                }
                title="Alterar foto"
              >

                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt={
                      nome ||
                      "Professor"
                    }
                  />
                ) : (
                  <span>
                    {primeiroNome
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <div className="foto-editar">
                  <FaCamera />
                </div>

              </div>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                onChange={selecionarFoto}
                style={{
                  display: "none",
                }}
              />

            </div>


            <div className="perfil-identidade">

              <h3>
                {nome.trim() ||
                  "Seu nome"}
              </h3>

              <span>
                Professor
              </span>

            </div>

          </div>


          <div className="campo-configuracao">

            <label htmlFor="nome">
              Nome completo
            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Digite seu nome completo"
              maxLength={100}
            />

            <small>
              Opcional. Esse nome será
              exibido no sistema.
            </small>

          </div>


          <div className="campo-configuracao">

            <label htmlFor="email">
              E-mail da conta Google
            </label>

            <div className="input-com-icone">

              <FaGoogle />

              <input
                id="email"
                type="email"
                value={
                  professor.email || ""
                }
                readOnly
              />

            </div>

            <small>
              O e-mail é usado para
              identificar sua conta e não
              pode ser alterado aqui.
            </small>

          </div>


          {erro && (
            <div className="mensagem-erro">
              {erro}
            </div>
          )}


          {mensagem && (
            <div className="mensagem-sucesso">
              <FaCheck />
              {mensagem}
            </div>
          )}


          <div className="configuracao-acoes">

            <button
              type="submit"
              className="btn-salvar"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : "Salvar alterações"}
            </button>

          </div>

        </form>

      </section>


      {/* 2. CONTA */}

      <section className="configuracao-card">

        <div className="card-title">

          <div className="card-icon">
            🔐
          </div>

          <div>
            <h2>Conta</h2>

            <p>
              Informações relacionadas à
              sua conta.
            </p>
          </div>

        </div>


        <div className="conta-info">

          <div className="conta-detalhe">

            <span className="conta-label">
              Conta Google
            </span>

            <strong>
              {professor.email}
            </strong>

          </div>


          <div className="conta-detalhe">

            <span className="conta-label">
              Tipo de acesso
            </span>

            <strong>
              Professor
            </strong>

          </div>


          <div className="conta-status-container">

            <span className="conta-status">
              <span>●</span>
              Conta ativa
            </span>

          </div>

        </div>


        <div className="conta-acoes">

          <button
            type="button"
            className="btn-sair"
            onClick={sairDaConta}
          >
            <FaSignOutAlt />
            Sair da conta
          </button>

        </div>

      </section>


      {/* 3. NOTIFICAÇÕES */}

      <section className="configuracao-card">

        <div className="card-title">

          <div className="card-icon">
            🔔
          </div>

          <div>
            <h2>Notificações</h2>

            <p>
              Controle como você deseja
              receber avisos do sistema.
            </p>

          </div>

        </div>


        <div className="configuracao-opcao">

          <div className="opcao-texto">

            <strong>
              Notificações do sistema
            </strong>

            <span>
              Permitir avisos e atualizações
              importantes.
            </span>

          </div>


          <button
            type="button"
            className={`switch ${
              notificacoes
                ? "ativo"
                : ""
            }`}
            onClick={
              alterarNotificacoes
            }
            aria-label="Ativar ou desativar notificações"
          >

            <span />

          </button>

        </div>


        <div className="aviso-configuracao">
          As notificações poderão ser
          conectadas aos eventos do sistema
          posteriormente.
        </div>

      </section>


      {/* 4. SOBRE O SISTEMA */}

      <section className="configuracao-card configuracao-sobre">

        <div className="card-title">

          <div className="card-icon">
            ℹ️
          </div>

          <div>
            <h2>
              Sobre o sistema
            </h2>

            <p>
              Informações sobre o
              Som Renovo Manager.
            </p>
          </div>

        </div>


        <div className="sobre-conteudo">

          

          <div className="sobre-texto">

            

            <p>
              Sistema de gestão interna
              da Som Renovo Escola de Música.
            </p>

            <span>
              Sistema de gestão interna
            </span>

          </div>

        </div>


        {/* INFORMAÇÕES */}

        <div className="sobre-secao">


          <div className="sobre-detalhes">

            <div>
              <span>Versão</span>
              <strong><span> - </span>
                1.0.0
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="sobre-status">
                <span> ● </span>
                 Operacional
              </strong>

            </div>

            <div>
              <span>
                Última atualização
              </span>

              <strong>
                <span> - </span>
                  21/09/2026
              </strong>
            </div>

          </div>

        </div>

        





      {/* DOCUMENTOS */}

<div className="sobre-secao">

  <h3>
    Privacidade e documentos
  </h3>

  <div className="sobre-links">

    <Link
      to="/config/politica-de-privacidade"
      className="sobre-link"
    >
      <span className="sobre-link-icone">
        🔒
      </span>

      <span className="sobre-link-texto">
        Política de Privacidade
      </span>

      <span className="sobre-link-seta">
        →
      </span>
    </Link>


    <Link
      to="/config/termos-de-uso"
      className="sobre-link"
    >
      <span className="sobre-link-icone">
        📄
      </span>

      <span className="sobre-link-texto">
        Termos de Uso
      </span>

      <span className="sobre-link-seta">
        →
      </span>
    </Link>


    <Link
      to="/config/tratamento-de-dados"
      className="sobre-link"
    >
      <span className="sobre-link-icone">
        🛡️
      </span>

      <span className="sobre-link-texto">
        Tratamento de Dados / LGPD
      </span>

      <span className="sobre-link-seta">
        →
      </span>
    </Link>

  </div>

</div>

      {/* AJUDA E SUPORTE */}

<div className="sobre-secao">

  <h3>
    Ajuda e suporte
  </h3>

  <div className="sobre-links">

    <Link
      to="/config/central-de-ajuda"
      className="sobre-link"
    >
      <span className="sobre-link-icone">
        ❓
      </span>

      <span className="sobre-link-texto">
        Central de Ajuda
      </span>

      <span className="sobre-link-seta">
        →
      </span>
    </Link>


    <Link
      to="/config/relatar-problema"
      className="sobre-link"
    >
      <span className="sobre-link-icone">
        🐛
      </span>

      <span className="sobre-link-texto">
        Relatar um Problema
      </span>

      <span className="sobre-link-seta">
        →
      </span>
    </Link>


    <Link
      to="/config/contato-suporte"
      className="sobre-link"
    >
      <span className="sobre-link-icone">
        💬
      </span>

      <span className="sobre-link-texto">
        Contato do Suporte
      </span>

      <span className="sobre-link-seta">
        →
      </span>
    </Link>

  </div>

</div>


        {/* RODAPÉ */}

        <div className="sobre-rodape">

          <strong>
            Som Renovo Manager
          </strong>

          <span>
            Feito para facilitar a gestão
            e organização da escola.
          </span>

          <small>
            © 2026 Som Renovo Escola de Música
          </small>

        </div>

      </section>

    </div>
  );
};

export default Configuração;