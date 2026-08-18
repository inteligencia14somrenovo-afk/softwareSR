import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaCamera } from "react-icons/fa";
import API_URL from "../../config/api";
import "./Configuração.css";

const instrumentosDisponiveis = [
  "Violão",
  "Guitarra",
  "Baixo",
  "Ukulele",
  "Teclado",
  "Piano",
  "Bateria",
  "Canto",
  "Saxofone",
  "Outro",
];

const Configuração = () => {
  const { professor, setProfessor } = useAuth();

  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoPreview, setFotoPreview] = useState("");
  const [instrumentos, setInstrumentos] = useState([]);

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const inputFotoRef = useRef(null);

  // Carrega os dados atuais do professor
  useEffect(() => {
    if (!professor) return;

    setNome(professor.nome || "");
    setFotoUrl(professor.foto_url || "");
    setFotoPreview(professor.foto_url || "");
    setInstrumentos(professor.instrumentos || []);
  }, [professor]);

  // Selecionar nova foto
  const selecionarFoto = (event) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem válido.");
      return;
    }

    // Limite inicial de 5 MB
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setErro("");
    setMensagem("");

    const novaPreview = URL.createObjectURL(arquivo);

    setFotoPreview(novaPreview);

    /*
      Por enquanto mantemos a imagem apenas como preview.
      O upload permanente será implementado posteriormente
      através do backend/Storage.
    */
  };

  const alternarInstrumento = (instrumento) => {
    setInstrumentos((atual) => {
      if (atual.includes(instrumento)) {
        return atual.filter((item) => item !== instrumento);
      }

      return [...atual, instrumento];
    });
  };

  const salvarPerfil = async (event) => {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (!nome.trim()) {
      setErro("Digite seu nome completo.");
      return;
    }

    if (instrumentos.length === 0) {
      setErro("Selecione pelo menos um instrumento.");
      return;
    }

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
            nome: nome.trim(),
            foto_url: fotoUrl || null,
            instrumentos,
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

      setMensagem("Perfil atualizado com sucesso.");

    } catch (error) {
      console.error("Erro ao salvar perfil:", error);

      setErro(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setSalvando(false);
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

      <div className="configuracao-header">
        <div>
          <h1>Configuração</h1>

          <p>
            Gerencie suas informações e preferências.
          </p>
        </div>
      </div>


      {/* =========================
          MEU PERFIL
      ========================= */}

      <section className="configuracao-card">

        <div className="card-title">

          <div className="card-icon">
            👤
          </div>

          <div>
            <h2>Meu perfil</h2>

            <p>
              Essas informações serão usadas no sistema.
            </p>
          </div>

        </div>


        <form onSubmit={salvarPerfil}>

          {/* =========================
              FOTO + NOME
          ========================= */}

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
                    alt={nome || "Professor"}
                  />

                ) : (

                  <span>
                    {primeiroNome.charAt(0).toUpperCase()}
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
                style={{ display: "none" }}
              />

            </div>


            <div className="perfil-identidade">

              <h3>
                {nome.trim() || "Seu nome"}
              </h3>

              <span>
                Professor
              </span>

              {instrumentos.length > 0 && (

                <p>
                  {instrumentos.join(" • ")}
                </p>

              )}

            </div>

          </div>


          {/* =========================
              NOME COMPLETO
          ========================= */}

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
              Esse é o nome que aparecerá no seu perfil.
            </small>

          </div>


          {/* =========================
              EMAIL
          ========================= */}

          <div className="campo-configuracao">

            <label htmlFor="email">
              E-mail da conta Google
            </label>

            <input
              id="email"
              type="email"
              value={professor.email || ""}
              readOnly
            />

            <small>
              O e-mail é a identidade da sua conta e não
              pode ser alterado por aqui.
            </small>

          </div>


          {/* =========================
              INSTRUMENTOS
          ========================= */}

          <div className="campo-configuracao">

            <label>
              Instrumentos que você ensina
            </label>

            <div className="instrumentos-config-grid">

              {instrumentosDisponiveis.map(
                (instrumento) => (

                  <button
                    key={instrumento}
                    type="button"
                    className={
                      instrumentos.includes(instrumento)
                        ? "instrumento-config selecionado"
                        : "instrumento-config"
                    }
                    onClick={() =>
                      alternarInstrumento(instrumento)
                    }
                  >
                    {instrumento}
                  </button>

                )
              )}

            </div>

          </div>


          {/* =========================
              MENSAGENS
          ========================= */}

          {erro && (
            <div className="mensagem-erro">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="mensagem-sucesso">
              {mensagem}
            </div>
          )}


          {/* =========================
              BOTÃO
          ========================= */}

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


      {/* =========================
          PREFERÊNCIAS
      ========================= */}

      <section className="configuracao-card configuracao-futura">

        <div className="card-title">

          <div className="card-icon">
            ⚙️
          </div>

          <div>
            <h2>Preferências</h2>

            <p>
              Configurações gerais do sistema.
            </p>
          </div>

        </div>

        <div className="em-breve">
          Mais opções de personalização estarão
          disponíveis aqui.
        </div>

      </section>


      {/* =========================
          CONTA
      ========================= */}

      <section className="configuracao-card">

        <div className="card-title">

          <div className="card-icon">
            🔐
          </div>

          <div>
            <h2>Conta</h2>

            <p>
              Informações relacionadas à sua conta.
            </p>
          </div>

        </div>

        <div className="conta-info">

          <span>
            Conta autenticada pelo Google
          </span>

          <span className="conta-status">
            ● Ativa
          </span>

        </div>

      </section>

    </div>
  );
};

export default Configuração;