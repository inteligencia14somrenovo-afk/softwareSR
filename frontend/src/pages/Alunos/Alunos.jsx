import React from 'react'

import "./Alunos.css";

function Alunos() {

  const alunos = [
    {
      id: 1,
      nome: "João Silva",
      instrumento: "Violão",
      unidade: "Centro",
      idade: 15,
      foto: "",
      cor: "violao"
    },
    {
      id: 2,
      nome: "Maria Souza",
      instrumento: "Piano",
      unidade: "Norte",
      idade: 20,
      foto: "",
      cor: "piano"
    },
    {
      id: 3,
      nome: "Lucas Oliveira",
      instrumento: "Guitarra",
      unidade: "Sul",
      idade: 12,
      foto: "",
      cor: "guitarra"
    },
    {
      id: 4,
      nome: "Ana Santos",
      instrumento: "Bateria",
      unidade: "Centro",
      idade: 14,
      foto: "",
      cor: "bateria"
    }
  ];


  return (
    <div className="alunos">

      <div className="alunos-header">

        <h1>Alunos</h1>

        <button>
          + Novo Aluno
        </button>

      </div>


      <div className="alunos-tools">

        <input 
          type="text"
          placeholder="🔍 Pesquisar aluno..."
        />


        <select>
          <option>Unidade</option>
        </select>


        <select>
          <option>Instrumento</option>
        </select>


        <select>
          <option>Idade</option>
        </select>

      </div>


      <div className="cards-alunos">

        {alunos.map((aluno) => (

          <div className={`card-aluno ${aluno.cor}`} key={aluno.id}>

            <div className="aluno-info">

              <div className="foto-aluno">
                {aluno.foto ? (
                  <img src={aluno.foto} alt={aluno.nome}/>
                ) : (
                  "👤"
                )}
              </div>


              <h2>{aluno.nome}</h2>

            </div>


            <p>🎸 {aluno.instrumento}</p>

            <p>📍 {aluno.unidade}</p>

            <p>🎂 {aluno.idade} anos</p>


          </div>

        ))}

      </div>

    </div>
  );
}

export default Alunos;