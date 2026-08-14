import { BrowserRouter, Routes, Route} from "react-router-dom";

import Dashboard from "./layouts/Dashboard";
import TelaInicial from "./pages/TelaInicial/TelaInicial";
import Alunos from "./pages/Alunos/Alunos";
import Bandas from "./pages/Bandas/Bandas";
import Presenca from "./pages/Presenca/Presenca";
import PlanosDeAula from "./pages/PlanosDeAula/PlanosDeAula";
import Relatorio from "./pages/Relatorio/Relatorio";
import Configuração from "./pages/Configuração/Configuração";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/"
    element={<Dashboard />}>
      <Route index element={<TelaInicial />} />
      <Route path="alunos" element={<Alunos />} />
      <Route path="bandas" element={<Bandas />} />
      <Route path="presenca" element={<Presenca />} />
      <Route path="planos-de-aula" element={<PlanosDeAula />} />
      <Route path="relatorio" element={<Relatorio />} />
      <Route path="config" element={<Configuração />} />


        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;