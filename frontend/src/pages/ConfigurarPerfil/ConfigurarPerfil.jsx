import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ConfigurarPerfil.css";

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

const ConfigurarPerfil = () => {
  const { professor, setProfessor } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState(professor?.nome || "");
  const [instrumentos, setInstrumentos] = useState(
    professor?.instrumentos || []
  );
  const [fotoUrl, setFotoUrl] = useState(professor?.foto_url || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

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
        setErro(data.mensagem || "Não foi possível salvar o perfil.");
        return;
      }

      // Atualiza o professor dentro do AuthContext
      setProfessor(data.professor);

      // Vai para a tela inicial
      navigate("/");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="configurar-perfil-page">
      <div className="configurar-perfil-card">

        <div className="configurar-perfil-header">
          <h1>Configure seu perfil</h1>

          <p>
            Antes de começar, conte um pouco sobre você.
          </p>
        </div>

        <form onSubmit={salvarPerfil}>

          <div className="foto-perfil">

            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="Foto do professor"
              />
            ) : (
              <div className="foto-placeholder">
                {nome ? nome.charAt(0).toUpperCase() : "?"}
              </div>
            )}

            <input
              type="url"
              placeholder="URL da sua foto (opcional)"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
            />

          </div>

          <div className="campo">

            <label>Como devemos chamar você?</label>

            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
            />

          </div>

          <div className="campo">

            <label>Quais instrumentos você ensina?</label>

            <div className="instrumentos-grid">

              {instrumentosDisponiveis.map((instrumento) => (
                <button
                  type="button"
                  key={instrumento}
                  className={
                    instrumentos.includes(instrumento)
                      ? "instrumento selecionado"
                      : "instrumento"
                  }
                  onClick={() =>
                    alternarInstrumento(instrumento)
                  }
                >
                  {instrumento}
                </button>
              ))}

            </div>

          </div>

          {erro && (
            <div className="erro-perfil">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="btn-continuar"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar e continuar"}
          </button>

        </form>

      </div>
    </div>
  );
};

export default ConfigurarPerfil;