import React from "react";

import "./TelaInicial.css";

function TelaInicial() {
    return (
        <div className="tela-inicial">

            <div className="welcome">
                <h1>Olá, Professor! 👋</h1>
                <p>Bem-vindo ao sistema da Escola de Música.</p>
            </div>

            <div className="cards">
                <div className="card">
                    <h2>42</h2>
                    <p>Alunos</p>
                </div>

                <div className="card">
                    <h2>8</h2>
                    <p>Aulas Hoje</p>
                </div>

                <div className="card">
                    <h2>5</h2>
                    <p>Bandas</p>
                </div>

                <div className="card">
                    <h2>2</h2>
                    <p>Faltas</p>
                </div>
            </div>

            <div className="section">
                <h2>Próximas Aulas</h2>

                <div className="lesson">
                    <span>09:00</span>
                    <p>João Silva - Violão</p>
                </div>

                <div className="lesson">
                    <span>10:00</span>
                    <p>Maria Souza - Piano</p>
                </div>

                <div className="lesson">
                    <span>14:00</span>
                    <p>Lucas Oliveira - Guitarra</p>
                </div>
            </div>

        </div>
    );
}

export default TelaInicial;