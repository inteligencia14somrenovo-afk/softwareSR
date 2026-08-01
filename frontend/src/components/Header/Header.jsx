import React from 'react'
import { MdDarkMode, MdNotifications } from 'react-icons/md';
import "./Header.css";

const Header = () => {

  const horaAtual = new Date().getHours();

    let saudacao;

    if (horaAtual < 12) {
      saudacao = " Olá Bom dia";
    } else if (horaAtual < 18) {
      saudacao = "Olá Boa tarde";
    } else {
      saudacao = "Olá Boa noite";
    }

    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const usuario = "user";

  return (
    <header className="header">

      <div className="header-left">
        <p className="page-title">Dashboard</p>

        <h1>{saudacao}, {usuario} !</h1>

        <time>{dataAtual}</time>
      </div>

      <div className="header-right">
       
       <button
        className="header-icon
        theme-button">
          <MdDarkMode />
       </button>

          <div className="divider"></div>

       <button 
       className="header-icon
       notification">
          <MdNotifications />
          <span></span>
       </button>


      </div>

    </header>
  );
};

export default Header;