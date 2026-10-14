import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaClipboardCheck } from "@react-icons/all-files/fa/FaClipboardCheck";
import { FaChartBar } from "@react-icons/all-files/fa/FaChartBar";
import { FaCog } from "@react-icons/all-files/fa/FaCog";
import { FaUsers, FaPlug, FaChalkboardTeacher } from "react-icons/fa";
import { SiGooglesheets } from "react-icons/si";
import { MdExpandMore, MdMenu, MdMenuOpen } from "react-icons/md";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import logo from "../../assets/logo.png";
import "./Sidebar.css";

const Sidebar = () => {
const [collapsed, setCollapsed] = useState(false);
const [gestaoAberta, setGestaoAberta] = useState(false);
const [conexoesAberto, setConexoesAberto] = useState(false);

const { professor } = useAuth();
const location = useLocation();

const podeGerenciarProfessores =
professor?.role === "admin" ||
professor?.role === "dev";

const rotasGestao = [
"/alunos",
"/turmas",
"/presenca",
...(podeGerenciarProfessores ? ["/professores"] : []),
];

const gestaoAtiva = rotasGestao.includes(location.pathname);
const conexoesAtiva = location.pathname.startsWith("/conexoes");

useEffect(() => {
if (gestaoAtiva) setGestaoAberta(true);
if (conexoesAtiva) setConexoesAberto(true);
}, [location.pathname, gestaoAtiva, conexoesAtiva]);

const fecharMenuMobile = () => {
if (window.innerWidth <= 768) {
setCollapsed(true);
}
};

const alternarMenu = () => {
setCollapsed((estado) => !estado);
};

const abrirGestao = () => {
if (collapsed) {
setCollapsed(false);
setGestaoAberta(true);
return;
}

setGestaoAberta((estado) => !estado);

};

const abrirConexoes = () => {
if (collapsed) {
setCollapsed(false);
setConexoesAberto(true);
return;
}

setConexoesAberto((estado) => !estado);

};

return (
<>
{/* BOTÃO HAMBÚRGUER MOBILE */}
<button
type="button"
className={`mobile-menu-button ${collapsed ? "visible" : ""}`}
onClick={() => setCollapsed(false)}
aria-label="Abrir menu">
<MdMenu />
</button>

 {/* OVERLAY MOBILE */}
    <div
      className={`sidebar-overlay ${collapsed ? "" : "active"}`}
      onClick={() => setCollapsed(true)}
    />

  {/* SIDEBAR */}
  <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
    {/* LOGO + BOTÃO */}
    <div className="logo-menu">
      {!collapsed && (
        <img
          src={logo}
          alt="Som Renovo"
          className="logo"
        />
      )}

      <MdMenuOpen
        className="menu-icon"
        onClick={alternarMenu}
      />
    </div>

    {/* MENU PRINCIPAL */}
    <nav className="sidebar-nav">
      <NavLink
        to="/"
        end
        onClick={fecharMenuMobile}
      >
        <FaHome />
        <span>Tela inicial</span>
      </NavLink>

      {/* GESTÃO ACADÊMICA */}
      <div className="sidebar-group">
        <button
          type="button"
          className="sidebar-group-button"
          onClick={abrirGestao}
          aria-expanded={gestaoAberta || gestaoAtiva}
        >
          <FaUserGraduate />
          <span>Gestão acadêmica</span>
          <MdExpandMore
            className={`submenu-arrow ${
              gestaoAberta || gestaoAtiva ? "open" : ""
            }`}
          />
        </button>

        {(gestaoAberta || gestaoAtiva) && !collapsed && (
          <div className="sidebar-submenu">
            <NavLink to="/alunos" onClick={fecharMenuMobile}>
              <FaUserGraduate />
              <span>Alunos</span>
            </NavLink>

            <NavLink to="/turmas" onClick={fecharMenuMobile}>
              <FaUsers />
              <span>Turmas</span>
            </NavLink>

            {podeGerenciarProfessores && (
              <NavLink
                to="/professores"
                onClick={fecharMenuMobile}
              >
                <FaChalkboardTeacher />
                <span>Pessoas</span>
              </NavLink>
            )}

            <NavLink to="/presenca" onClick={fecharMenuMobile}>
              <FaClipboardCheck />
              <span>Presença</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* CONEXÕES */}
      <div className="sidebar-group">
        <button
          type="button"
          className="sidebar-group-button"
          onClick={abrirConexoes}
          aria-expanded={conexoesAberto || conexoesAtiva}
        >
          <FaPlug />
          <span>Conexões</span>
          <MdExpandMore
            className={`submenu-arrow ${
              conexoesAberto || conexoesAtiva ? "open" : ""
            }`}
          />
        </button>

        {(conexoesAberto || conexoesAtiva) && !collapsed && (
          <div className="sidebar-submenu">
            <NavLink
              to="/conexoes/google-sheets"
              onClick={fecharMenuMobile}
            >
              <SiGooglesheets />
              <span>Google Sheets</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* RELATÓRIOS */}
      <NavLink
        to="/relatorio"
        onClick={fecharMenuMobile}
      >
        <FaChartBar />
        <span>Relatório</span>
      </NavLink>
    </nav>

    {/* RODAPÉ: CONFIGURAÇÃO + PERFIL */}
    <div className="sidebar-bottom">
      <NavLink
        to="/config"
        className="sidebar-config-link"
        onClick={fecharMenuMobile}
      >
        <FaCog />
        <span>Configuração</span>
      </NavLink>

      <div className="profile">
        <div className="profile-image">
          {professor?.foto_url ? (
            <img
              src={professor.foto_url}
              alt={professor.nome || "Perfil"}
            />
          ) : (
            <span>
              {professor?.nome
                ? professor.nome.charAt(0).toUpperCase()
                : "?"}
            </span>
          )}
        </div>

        <div className="profile-info">
          <h4>
            {professor?.nome
              ? professor.nome.trim().split(/\s+/)[0]
              : "Usuário"}{" "}
            (
            {professor?.role === "dev"
              ? "Dev"
              : professor?.role === "admin"
              ? "Admin"
              : "Instrutor"}
            )
          </h4>

          <p>{professor?.email || ""}</p>
        </div>
      </div>
    </div>
  </aside>
</>

);
};

export default Sidebar;