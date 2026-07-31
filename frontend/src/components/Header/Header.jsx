import React from 'react'

import "./Header.css";

const Header = () => {
  return (
    <header className="header">

      <div className="header-left">
        <p className="page-title">Dashboard</p>

        <h1>Bom dia, (user) 👋</h1>

        <time>** de ** de 2026</time>
      </div>

      <div className="header-right">
        (🌙/sol) - (notificação) - (perfil)
      </div>

    </header>
  );
};

export default Header;