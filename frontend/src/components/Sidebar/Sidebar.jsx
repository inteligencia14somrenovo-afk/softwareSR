import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaClipboardCheck } from "@react-icons/all-files/fa/FaClipboardCheck";
import { FaBook } from "@react-icons/all-files/fa/FaBook";
import { FaChartBar } from "@react-icons/all-files/fa/FaChartBar";
import { FaCog } from "@react-icons/all-files/fa/FaCog";
import { FaDrum } from "@react-icons/all-files/fa/FaDrum";

import { MdMenu, MdMenuOpen } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import logo from "../../assets/logo.png";
import "./Sidebar.css";


const Sidebar = () => {

  const [collapsed, setCollapsed] = useState(false);

  const { professor } = useAuth();


  return (

    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

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

        <NavLink to="/">
          <FaHome />
          {!collapsed && <span>Tela inicial</span>}
        </NavLink>


        <NavLink to="/alunos">
          <FaUserGraduate />
          {!collapsed && <span>Alunos</span>}
        </NavLink>


        <NavLink to="/bandas">
          <FaDrum />
          {!collapsed && <span>Bandas</span>}
        </NavLink>


        <NavLink to="/presenca">
          <FaClipboardCheck />
          {!collapsed && <span>Presença</span>}
        </NavLink>


        <NavLink to="/planos-de-aula">
          <FaBook />
          {!collapsed && <span>Planos de aula</span>}
        </NavLink>


        <NavLink to="/relatorio">
          <FaChartBar />
          {!collapsed && <span>Relatório</span>}
        </NavLink>


        <NavLink to="/config">
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
        {professor?.nome ? professor.nome.trim().split(/\s+/)[0]: "Professor"} (Instrutor)
      </h4>

      <p>
        {professor?.email || ""}
      </p>

    </div>

  )}

</div>


    </aside>

  );

};


export default Sidebar;