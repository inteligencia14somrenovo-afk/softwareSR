import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { professor, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="loading-screen">
        <div className="loading-content">

          {/* Logo / ícone */}
          <div className="loading-logo">
            ♪
          </div>

          {/* Nome do sistema */}
          <h1>Som Renovo</h1>
          <span className="loading-subtitle">Manager</span>

          {/* Indicador */}
          <div className="loading-spinner"></div>

          <p>Carregando seu ambiente...</p>
        </div>
      </div>
    );
  }

  // Não está logado
  if (!professor) {
    return <Navigate to="/login" replace />;
  }

  // Tudo certo
  return children;
};

export default ProtectedRoute;
