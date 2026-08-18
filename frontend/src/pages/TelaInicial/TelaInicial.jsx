import { useEffect, useState } from "react";

import "./TelaInicial.css";

function TelaInicial() {

    const [totalAlunos, setTotalAlunos] = useState(0);

    useEffect(() => {

        const atualizarAlunos = () => {

            const alunosSalvos =
                localStorage.getItem("alunos");

            const alunos =
                alunosSalvos
                    ? JSON.parse(alunosSalvos)
                    : [];

            setTotalAlunos(alunos.length);

        };

        atualizarAlunos();

        window.addEventListener(
            "alunosAtualizados",
            atualizarAlunos
        );

        return () => {
            window.removeEventListener(
                "alunosAtualizados",
                atualizarAlunos
            );
        };

    }, []);

    return (
        <div className="tela-inicial">

            <div className="welcome">
                <h1>Olá, Professor! 👋</h1>
                <p>Bem-vindo(a) ao sistema da Escola de Música Som Renovo.</p>
            </div>

            <div className="cards">

                <div className="card">
                    <h2>{totalAlunos}</h2>
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