import { FaUser, FaLock, FaGoogle } from "react-icons/fa";
import { useState, useRef } from "react";

import "./Login.css";
import logo from "../../assets/logo.png";
import fundo from "../../assets/fundo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const passwordRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (username.trim() === "") {
      alert("Digite seu e-mail.");
      return;
    }

    if (password.trim() === "") {
      alert("Digite sua senha.");
      return;
    }

    console.log({
      email: username,
      password: password,
    });

    alert("Login temporário realizado!");
  };

  const handleGoogleLogin = () => {
    // Será implementado quando configurarmos o backend + Google OAuth
    console.log("Login com Google");
  };

  return (
    <main
      className="login-page"
      style={{ backgroundImage: `url(${fundo})` }}
    >
      <section className="login-panel">

        <div className="login-content">

          <img
            src={logo}
            alt="Som Renovo"
            className="logo"
          />

          <div className="brand-title">
            <span>SOM RENOVO</span>
            <h1>Professor</h1>
          </div>

          <p className="login-subtitle">
            Organize suas aulas, alunos e planejamentos
          </p>

          <form onSubmit={handleSubmit}>

            <div className="input-field">
              <input
                type="email"
                placeholder="E-mail"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
              />

              <FaUser className="icon" />
            </div>

            <div className="input-field">
              <input
                ref={passwordRef}
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <FaLock className="icon" />
            </div>

            <div className="recall-forget">

              <label>
                <input type="checkbox" />
                Lembre de mim
              </label>

              <a href="#">
                Esqueceu a senha?
              </a>

            </div>

            <button
              type="submit"
              className="login-button"
            >
              Entrar
            </button>

          </form>

          <div className="divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
          >
            <FaGoogle />
            <span>Continuar com Google</span>
          </button>

          <p className="login-footer">
            Sistema de gestão <strong>Som Renovo</strong>
          </p>

        </div>

      </section>
    </main>
  );
};

export default Login;