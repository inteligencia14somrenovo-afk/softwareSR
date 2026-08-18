import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [professor, setProfessor] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const verificarAutenticacao = async () => {
    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setProfessor(null);
        return;
      }

      const data = await response.json();

      if (data.autenticado) {
        setProfessor(data.professor);
      } else {
        setProfessor(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setProfessor(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        professor,
        setProfessor,
        carregando,
        verificarAutenticacao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};