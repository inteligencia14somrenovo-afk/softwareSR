import { useAuth } from "../../context/AuthContext";

import RelatorioProfessor from "./Professor/RelatorioProfessor";
import RelatorioAdmin from "./Admin/RelatorioAdmin";
import RelatorioDev from "./Dev/RelatorioDev";

function Relatorio() {
  const { professor } = useAuth();

  if (professor?.role === "dev") {
    return <RelatorioDev />;
  }

  if (professor?.role === "admin") {
    return <RelatorioAdmin />;
  }

  return <RelatorioProfessor />;
}

export default Relatorio;