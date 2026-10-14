import { useAuth } from "../../context/AuthContext";
import "./BackendUnavailable.css";

const BackendUnavailable = () => {
  const {
    apiIndisponivel,
    verificandoApi,
    verificarDisponibilidade,
  } = useAuth();

  if (!apiIndisponivel) {
    return null;
  }

  return (
    <div className="backend-unavailable">
      <div className="backend-unavailable-card">
        <img
          src="/logo.png"
          alt="Som Renovo"
          className="backend-unavailable-logo"
        />

        <div className="backend-unavailable-icon">
          <span>!</span>
        </div>

        <h1>Estamos reconectando</h1>

        <p>
          Não conseguimos nos comunicar com o servidor
          do Som Renovo Manager neste momento.
        </p>

        <p className="backend-unavailable-detail">
          Sua sessão não será encerrada por causa
          desta falha. Aguarde um instante ou tente
          novamente.
        </p>

        <button
          type="button"
          className="backend-unavailable-button"
          onClick={verificarDisponibilidade}
          disabled={verificandoApi}
        >
          {verificandoApi
            ? "Verificando conexão..."
            : "Tentar novamente"}
        </button>

        <span className="backend-unavailable-status">
          Nova verificação automática a cada 15 segundos
        </span>
      </div>
    </div>
  );
};

export default BackendUnavailable;