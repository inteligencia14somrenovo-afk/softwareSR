import { FaHome } from "@react-icons/all-files/fa/FaHome";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaChalkboardTeacher } from "@react-icons/all-files/fa/FaChalkboardTeacher";
import { FaClipboardCheck } from "@react-icons/all-files/fa/FaClipboardCheck";
import { FaBook } from "@react-icons/all-files/fa/FaBook";
import { FaChartBar } from "@react-icons/all-files/fa/FaChartBar";
import { FaCog } from "@react-icons/all-files/fa/FaCog";

import "./Sidebar.css";
import logo from "../../assets/logo.png";

const Sidebar = () => {
  return (
   <div className="sidebar">

    <img src={logo} alt="Som Renovo" className="logo" />
    <h2>Manager</h2>

     <nav>
    <a href="#" className="active">
        <FaHome />
        <span>Dashboard</span>
    </a>
    <a href="#">
        <FaUserGraduate />
        <span>Alunos</span>
    </a>
    {/*<a href="#">
        <FaChalkboardTeacher />
        <span>Professores</span>
    </a>*/}
    <a href="#">
        <FaClipboardCheck />
        <span>Presença</span>
    </a>
    <a href="#">
        <FaBook />
        <span>Planos de aula</span>    
    </a> 
    <a href="#">
        <FaChartBar />
        <span>Relatorio</span>
    </a>
    <a href="#">
        <FaCog />
        <span>Configuração</span>
    </a>
     </nav>
   </div>
  )
}

export default Sidebar
