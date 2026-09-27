import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaClipboardCheck } from "@react-icons/all-files/fa/FaClipboardCheck";
import { FaChartBar } from "@react-icons/all-files/fa/FaChartBar";
import { FaCog } from "@react-icons/all-files/fa/FaCog";

import { MdMenu, MdMenuOpen } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaChalkboardTeacher } from "react-icons/fa";

import logo from "../../assets/logo.png";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const { professor } = useAuth();

  const podeGerenciarProfessores =
    professor?.role === "admin" ||
    professor?.role === "dev";

  const fecharMenuMobile = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${
          collapsed ? "" : "active"
        }`}
        onClick={() => setCollapsed(true)}
      />

      <aside
        className={`sidebar ${
          collapsed ? "collapsed" : ""
        }`}
      >

        <div className="logo-menu">

          {!collapsed && (
            <img
              src={logo}
              alt="Som Renovo"
              className="logo"
            />
          )}

          {collapsed ? (
            <MdMenu
              className="menu-icon-2"
              onClick={() => setCollapsed(false)}
            />
          ) : (
            <MdMenuOpen
              className="menu-icon"
              onClick={() => setCollapsed(true)}
            />
          )}

        </div>

        <nav>

          <NavLink
            to="/"
            onClick={fecharMenuMobile}
          >
            <FaHome />
            {!collapsed && <span>Tela inicial</span>}
          </NavLink>

          <NavLink
            to="/alunos"
            onClick={fecharMenuMobile}
          >
            <FaUserGraduate />
            {!collapsed && <span>Alunos</span>}
          </NavLink>

          {podeGerenciarProfessores && (
            <NavLink
              to="/professores"
              onClick={fecharMenuMobile}
            >
              <FaChalkboardTeacher />
              {!collapsed && <span>Professores</span>}
            </NavLink>
          )}

          <NavLink
            to="/presenca"
            onClick={fecharMenuMobile}
          >
            <FaClipboardCheck />
            {!collapsed && <span>Presença</span>}
          </NavLink>

          <NavLink
            to="/relatorio"
            onClick={fecharMenuMobile}
          >
            <FaChartBar />
            {!collapsed && <span>Relatório</span>}
          </NavLink>

          <NavLink
            to="/config"
            onClick={fecharMenuMobile}
          >
            <FaCog />
            {!collapsed && <span>Configuração</span>}
          </NavLink>

        </nav>

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

          {!collapsed && (
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
          )}

        </div>

      </aside>
    </>
  );
};

export default Sidebar;