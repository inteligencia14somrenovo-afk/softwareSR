import {FaUser, FaLock} from 'react-icons/fa';
import { useState , useRef } from 'react';

import './Login.css';
import logo from "../../assets/logo.png";

const Login = () => {

    const [ username, setUsername ] = useState("");
    const [password, setPassword ] = useState("");
    const [darkMode, setDarkMode] = useState(true);


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

    alert("Login realizado com sucesso!");
    console.log({
        email: username,
        password: password,
    });
};
  return (


    <div className="login-page">
      <div className={`container ${darkMode ? "dark" : "light"}`}>
         <form onSubmit={handleSubmit}>
           <img src={logo} alt="Som Renovo" className="logo" />
           <h2>
          SR#
           </h2>
            <h1>Manager</h1>

            <button
             type="button"
              className="theme-btn"
               onClick={() => setDarkMode(!darkMode)} >
             {darkMode ? "☀️ Tema Claro" : "🌙 Tema Escuro"}
            </button>
           
            <div className="input-field">
              <input type="email" placeholder="E-mail" 
                  onChange={ (e) => setUsername(e.target.value) } onKeyDown={
                    (e) => {if (e.key === "Enter") {e.preventDefault();
                       passwordRef.current.focus();                      
                    }
                  }}
               />
              <FaUser className="icon" />
            </div>
             <div className="input-field">
               <input ref={passwordRef} type="password" placeholder="Senha"
                    onChange={ (e) => setPassword(e.target.value) }
               />
               <FaLock className="icon" />
             </div>

            <div className="recall-forget">
                <label>
                    <input type="checkbox" />
                    Lembre de mim
               </label>
                <a href="#">Esqueceu a senha?</a>
            </div>

         <button type="submit">Entrar</button>

         <div className="signup-link">
            <p> Não tem uma conta? <a href="#"> Registrar </a> </p>
         </div>
         </form>
      </div>
      </div>  
  )
}

export default Login;
