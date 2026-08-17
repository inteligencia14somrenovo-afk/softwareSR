import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
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
  const [instrumentos, setInstrumentos] = useState([]);

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  // Carrega os dados atuais do professor
  useEffect(() => {
    if (!professor) return;

    setNome(professor.nome || "");
    setFotoUrl(professor.foto_url || "");
    setInstrumentos(professor.instrumentos || []);
  }, [professor]);

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
      setErro("Digite seu nome.");
      return;
    }

    if (instrumentos.length === 0) {
      setErro("Selecione pelo menos um instrumento.");
      return;
    }

    try {
      setSalvando(true);

      const response = await fetch(
        "http://localhost:3000/professores/perfil",
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
          data.mensagem || "Não foi possível salvar as alterações."
        );
        return;
      }

      // Atualiza os dados globais do professor
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


      {/* MEU PERFIL */}

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

          {/* FOTO */}

          <div className="perfil-foto-area">

            <div className="perfil-foto">

              {fotoUrl ? (

                <img
                  src={fotoUrl}
                  alt={nome || "Professor"}
                />

              ) : (

                <span>
                  {nome
                    ? nome.charAt(0).toUpperCase()
                    : "?"}
                </span>

              )}

            </div>

            <div className="foto-info">

              <strong>Foto do perfil</strong>

              <p>
                Você pode adicionar uma URL de imagem.
              </p>

              <input
                type="url"
                value={fotoUrl}
                onChange={(e) =>
                  setFotoUrl(e.target.value)
                }
                placeholder="https://..."
              />

            </div>

          </div>


          {/* NOME */}

          <div className="campo-configuracao">

            <label htmlFor="nome">
              Nome
            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Seu nome"
              maxLength={100}
            />

          </div>


          {/* EMAIL */}

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


          {/* INSTRUMENTOS */}

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


          {/* MENSAGENS */}

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


          {/* BOTÃO */}

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


      {/* PREFERÊNCIAS */}

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


      {/* CONTA */}

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