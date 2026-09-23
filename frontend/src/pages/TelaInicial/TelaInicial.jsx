import { useAuth } from "../../context/AuthContext";

import TelaInicialProfessor from "./Professor/TelaInicialProfessor";
import TelaInicialAdmin from "./Admin/TelaInicialAdmin";
import TelaInicialDev from "./Dev/TelaInicialDev";

function TelaInicial() {
  const { professor } = useAuth();

  if (professor?.role === "dev") {
    return <TelaInicialDev />;
  }

  if (professor?.role === "admin") {
    return <TelaInicialAdmin />;
  }

  return <TelaInicialProfessor />;
}

export default TelaInicial;