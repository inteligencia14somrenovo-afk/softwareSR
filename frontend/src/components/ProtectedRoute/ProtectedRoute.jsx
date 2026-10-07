import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { professor, carregando } = useAuth();

  if (carregando) {
    return <div>Carregando App...</div>;
  }

  // Não está logado
  if (!professor) {
    return <Navigate to="/login" replace />;
  }

  // Tudo certo
  return children;
};

export default ProtectedRoute;