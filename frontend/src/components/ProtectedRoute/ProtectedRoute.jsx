import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { professor, carregando } = useAuth();

  if (carregando) {
    return <div>Carregando...</div>;
  }

  // Não está logado
  if (!professor) {
    return <Navigate to="/login" replace />;
  }

  // Está logado, mas ainda não configurou o perfil
  if (!professor.perfil_configurado) {
    return <Navigate to="/configurar-perfil" replace />;
  }

  // Tudo certo
  return children;
};

export default ProtectedRoute;