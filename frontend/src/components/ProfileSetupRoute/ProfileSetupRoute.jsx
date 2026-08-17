import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProfileSetupRoute = ({ children }) => {
  const { professor, carregando } = useAuth();

  if (carregando) {
    return <div>Carregando...</div>;
  }

  // Não está autenticado
  if (!professor) {
    return <Navigate to="/login" replace />;
  }

  // Já configurou o perfil
  if (professor.perfil_configurado) {
    return <Navigate to="/" replace />;
  }

  // Está autenticado e precisa configurar o perfil
  return children;
};

export default ProfileSetupRoute;