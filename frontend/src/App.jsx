import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import Dashboard from "./layouts/Dashboard";
import TelaInicial from "./pages/TelaInicial/TelaInicial";
import Alunos from "./pages/Alunos/Alunos";
import Turmas from "./pages/Turmas/Turmas";
import Presenca from "./pages/Presenca/Presenca";
import Horarios from "./pages/Horarios/Horarios";
import Relatorio from "./pages/Relatorio/Relatorio";
import GoogleSheets from "./pages/Conexoes/GoogleSheets";

import Instalar from "./pages/Instalar/Instalar";
import PullToRefresh from "./components/PullToRefresh/PullToRefresh";

import Professores from "./pages/Professores/Professores";
import ProfessorDetalhes from "./pages/Professores/ProfessorDetalhes";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Configuração from "./pages/Configuração/Configuração";
import PoliticaPrivacidade from "./pages/Configuração/componentes/PoliticaPrivacidade";
import TermosDeUso from "./pages/Configuração/componentes/TermosDeUso";
import TratamentoDeDados from "./pages/Configuração/componentes/TratamentoDeDados";
import CentralAjuda from "./pages/Configuração/componentes/CentralAjuda";
import RelatarProblema from "./pages/Configuração/componentes/RelatarProblema";
import ContatoSuporte from "./pages/Configuração/componentes/ContatoSuporte";

import "./App.css";

function App() {

  return (
    <BrowserRouter>
    <PullToRefresh />
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* INSTALAR */}
        <Route path="/instalar" element={<Instalar />} />

        {/* ÁREA DO SISTEMA */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >

          <Route index element={<TelaInicial />} />

          <Route path="alunos" element={<Alunos />} />

          <Route path="turmas" element={<Turmas />} />

          <Route path="professores" element={<Professores />} />
          <Route
                path="professores/:id"
                element={<ProfessorDetalhes />}
              />


          <Route path="presenca" element={<Presenca />} />

          <Route path="horarios" element={<Horarios />} />

          <Route
            path="relatorio"
            element={<Relatorio />}
          />

          <Route
            path="conexoes/google-sheets"
            element={<GoogleSheets />}
          />

         <Route path="config" element={<Configuração />} />

              <Route
                path="config/politica-de-privacidade"
                element={<PoliticaPrivacidade />}
              />

              <Route
                path="config/termos-de-uso"
                element={<TermosDeUso />}
              />

              <Route
                path="config/tratamento-de-dados"
                element={<TratamentoDeDados />}
              />

              <Route
                path="config/central-de-ajuda"
                element={<CentralAjuda />}
              />

              <Route
                path="config/relatar-problema"
                element={<RelatarProblema />}
              />

              <Route
                path="config/contato-suporte"
                element={<ContatoSuporte />}
              />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;