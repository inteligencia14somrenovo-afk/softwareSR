import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaClipboardCheck } from "@react-icons/all-files/fa/FaClipboardCheck";
import { FaBook } from "@react-icons/all-files/fa/FaBook";
import { FaChartBar } from "@react-icons/all-files/fa/FaChartBar";
import { FaCog } from "@react-icons/all-files/fa/FaCog";

import "./Sidebar.css";
import logo from "../../assets/logo.png";
import { useState } from "react";
import { MdMenu, MdMenuOpen } from "react-icons/md";


const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <div className="logo-menu">
       {!collapsed && ( 
        <img src={logo} alt="Som Renovo" className="logo" />
                   )}
        
        {collapsed ? (
          <MdMenu
          className="menu-icon-2"
          onClick={() =>
            setCollapsed(false)}
            />
          ) : (
        <MdMenuOpen 
          className="menu-icon"
          onClick={() => setCollapsed(true)}
        />
          )}
      </div>

      <nav>
        <a href="#" className="active">
          <FaHome />
                    {!collapsed &&
          <span>Dashboard</span> }
        </a>

        <a href="#">
          <FaUserGraduate />
           {!collapsed &&
          <span>Alunos</span> }
        </a>

        <a href="#">
          <FaClipboardCheck />
           {!collapsed &&
          <span>Presença</span> }
        </a>

        <a href="#">
          <FaBook />
           {!collapsed &&
          <span>Planos de aula</span> }
        </a>

        <a href="#">
          <FaChartBar />
           {!collapsed &&
          <span>Relatório</span> }
        </a>

        <a href="#">
          <FaCog />
           {!collapsed &&
          <span>Configuração</span> }
        </a>
      </nav>

        <div className="profile">
          <div
          className="profile-image">

          </div>
            U
          <div
          className="profile-info">
            <h4>nome de usuario</h4>
            <p>email real de user</p>
          </div>
        </div>

    </aside>
  )
}

export default Sidebar;