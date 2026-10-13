import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaClipboardCheck } from "@react-icons/all-files/fa/FaClipboardCheck";
import { FaChartBar } from "@react-icons/all-files/fa/FaChartBar";
import { FaCog } from "@react-icons/all-files/fa/FaCog";
import { FaUsers } from "react-icons/fa";
import { FaPlug } from "react-icons/fa";
import { SiGooglesheets } from "react-icons/si";
import { MdExpandMore } from "react-icons/md";
import { MdMenu, MdMenuOpen } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaChalkboardTeacher } from "react-icons/fa";

import logo from "../../assets/logo.png";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [conexoesAberto, setConexoesAberto] = useState(false);

  const { professor } = useAuth();

  const podeGerenciarProfessores =
    professor?.role === "admin" ||
    professor?.role === "dev";

  const fecharMenuMobile = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  const alternarMenu = () => {
    setCollapsed((estado) => !estado);
  };

  return (
    <>
      {/* =================================================
          BOTÃO HAMBÚRGUER MOBILE
      ================================================= */}

      <button
        type="button"
        className={`mobile-menu-button ${
          collapsed ? "visible" : ""
        }`}
        onClick={() => setCollapsed(false)}
        aria-label="Abrir menu"
      >
        <MdMenu />
      </button>


      {/* =================================================
          OVERLAY MOBILE
      ================================================= */}

      <div
        className={`sidebar-overlay ${
          collapsed ? "" : "active"
        }`}
        onClick={() => setCollapsed(true)}
      />


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${
          collapsed ? "collapsed" : ""
        }`}
      >

        {/* =================================================
            LOGO + BOTÃO
        ================================================= */}

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


        {/* =================================================
            MENU
        ================================================= */}

        <nav>

          <NavLink
            to="/"
            onClick={fecharMenuMobile}
          >
            <FaHome />
            <span>Tela inicial</span>
          </NavLink>


          <NavLink
            to="/alunos"
            onClick={fecharMenuMobile}
          >
            <FaUserGraduate />
            <span>Alunos</span>
          </NavLink>

          <NavLink
            to="/turmas"
            onClick={fecharMenuMobile}
          >
            <FaUserGraduate />
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


          <NavLink
            to="/presenca"
            onClick={fecharMenuMobile}
          >
            <FaClipboardCheck />
            <span>Presença</span>
          </NavLink>


          <NavLink
            to="/relatorio"
            onClick={fecharMenuMobile}
          >
            <FaChartBar />
            <span>Relatório</span>
          </NavLink>

          <div className="sidebar-group">
  <button
    type="button"
    className="sidebar-group-button"
    onClick={() => {
      if (collapsed) {
        setCollapsed(false);
        setConexoesAberto(true);
      } else {
        setConexoesAberto((estado) => !estado);
      }
    }}
    aria-expanded={conexoesAberto}
  >
    <FaPlug />
    <span>Conexões</span>
    <MdExpandMore
      className={`submenu-arrow ${
        conexoesAberto ? "open" : ""
      }`}
    />
  </button>

  {conexoesAberto && !collapsed && (
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


          <NavLink
            to="/config"
            onClick={fecharMenuMobile}
          >
            <FaCog />
            <span>Configuração</span>
          </NavLink>

        </nav>


        {/* =================================================
            PERFIL
        ================================================= */}

        <div className="profile">

          <div className="profile-image">

            {professor?.foto_url ? (

              <img
                src={professor.foto_url}
                alt={professor.nome}
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


            <p>
              {professor?.email || ""}
            </p>

          </div>

        </div>

      </aside>
    </>
  );
};

export default Sidebar;