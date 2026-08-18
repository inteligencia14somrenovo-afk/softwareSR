import { useState } from "react";
import { useLocation } from "react-router-dom";

import { MdDarkMode, MdNotifications } from "react-icons/md";

import { FaCalendarAlt } from "@react-icons/all-files/fa/FaCalendarAlt";
import { FaUserGraduate } from "@react-icons/all-files/fa/FaUserGraduate";
import { FaDrum } from "@react-icons/all-files/fa/FaDrum";
import { FaBook } from "@react-icons/all-files/fa/FaBook";

import { useAuth } from "../../context/AuthContext";

import "./Header.css";


const Header = () => {

  const location = useLocation();

  const { professor } = useAuth();


  const titles = {
    "/": "Tela Inicial",
    "/alunos": "Alunos",
    "/bandas": "Bandas",
    "/presenca": "Presença",
    "/planos-de-aula": "Planos de Aula",
    "/relatorio": "Relatórios",
    "/config": "Configuração",
  };


  const [showNotifications, setShowNotifications] = useState(false);


  const horaAtual = new Date().getHours();

  let saudacao;

  if (horaAtual < 12) {
    saudacao = "Bom dia";
  } else if (horaAtual < 18) {
    saudacao = "Boa tarde";
  } else {
    saudacao = "Boa noite";
  }


  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });


  // Pega somente o primeiro nome do professor
  const primeiroNome = professor?.nome
    ? professor.nome.trim().split(/\s+/)[0]
    : "Professor";


  return (

    <header className="header">


      <div className="header-left">

        <p className="page-title">
          {titles[location.pathname] || "Dashboard"}
        </p>


        <h1>
          {saudacao}, {primeiroNome}!
        </h1>


        <time>
          {dataAtual}
        </time>

      </div>



      <div className="header-right">


        <button className="header-icon theme-button">
          <MdDarkMode />
        </button>


        <div className="divider"></div>


        <button
          className="header-icon notification"
          onClick={() =>
            setShowNotifications(!showNotifications)
          }
        >
          <MdNotifications />
        </button>


      </div>



      {showNotifications && (

        <div className="notification-panel">

          <h3>Notificações</h3>


          <div className="notification-item">
            <FaCalendarAlt />
            Hoje você possui 6 aulas.
          </div>


          <div className="notification-item">
            <FaBook />
            2 planos de aula pendentes.
          </div>


          <div className="notification-item">
            <FaDrum />
            Ensaio da banda jovem às 19h.
          </div>


          <div className="notification-item">
            <FaUserGraduate />
            João faltou na última aula.
          </div>


        </div>

      )}


    </header>

  );

};


export default Header;