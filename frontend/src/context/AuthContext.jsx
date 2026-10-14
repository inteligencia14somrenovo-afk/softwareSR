import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import API_URL from "../config/api";

const AuthContext = createContext(null);

const INTERVALO_VERIFICACAO = 15000;
const TEMPO_LIMITE = 8000;

export const AuthProvider = ({ children }) => {
  const [professor, setProfessor] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [apiIndisponivel, setApiIndisponivel] = useState(false);
  const [verificandoApi, setVerificandoApi] = useState(false);

  const verificarAutenticacao = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });

      // Erros do servidor podem indicar indisponibilidade.
      if (response.status >= 500) {
        setApiIndisponivel(true);
        return false;
      }

      if (!response.ok) {
        // Resposta recebida: a API está acessível,
        // mas a sessão pode ser inválida.
        setApiIndisponivel(false);
        setProfessor(null);
        return true;
      }

      const data = await response.json();

      setApiIndisponivel(false);
      setProfessor(data.autenticado ? data.professor : null);

      return true;
    } catch (error) {
      console.error("Falha ao verificar autenticação:", error);

      // Não apagar professor em caso de falha de conexão.
      setApiIndisponivel(true);

      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  const verificarDisponibilidade = useCallback(async () => {
    setVerificandoApi(true);

    try {
      const response = await fetch(`${API_URL}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });

      if (!response.ok) {
        setApiIndisponivel(true);
        return false;
      }

      const estavaIndisponivel = apiIndisponivel;

      setApiIndisponivel(false);

      // Se a API voltou, validar novamente a sessão.
      if (estavaIndisponivel) {
        await verificarAutenticacao();
      }

      return true;
    } catch (error) {
      setApiIndisponivel(true);
      return false;
    } finally {
      setVerificandoApi(false);
    }
  }, [apiIndisponivel, verificarAutenticacao]);

  useEffect(() => {
    verificarAutenticacao();
  }, [verificarAutenticacao]);

  useEffect(() => {
    let ativo = true;

    const verificarPeriodicamente = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(TEMPO_LIMITE),
        });

        if (!ativo) return;

        if (!response.ok) {
          setApiIndisponivel(true);
          return;
        }

        if (apiIndisponivel) {
          await verificarAutenticacao();
        } else {
          setApiIndisponivel(false);
        }
      } catch (error) {
        if (ativo) {
          setApiIndisponivel(true);
        }
      }
    };

    const intervalo = window.setInterval(
      verificarPeriodicamente,
      INTERVALO_VERIFICACAO
    );

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [apiIndisponivel, verificarAutenticacao]);

  return (
    <AuthContext.Provider
      value={{
        professor,
        setProfessor,
        carregando,
        verificarAutenticacao,
        apiIndisponivel,
        verificandoApi,
        verificarDisponibilidade,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);