import { useState } from "react";

import Button from "../../components/UI/Button/Button";
import Modal from "../../components/UI/Modal/Modal";

import "./Alunos.css";


function Alunos() {


  const [showModal, setShowModal] = useState(false);


  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    idade: "",
    instrumento: "",
    unidade: ""
  });


  const [alunos, setAlunos] = useState([

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

  ]);



  const salvarAluno = () => {


    const aluno = {

      id: alunos.length + 1,

      nome: novoAluno.nome,

      idade: novoAluno.idade,

      instrumento: novoAluno.instrumento,

      unidade: novoAluno.unidade,

      foto: "",

      cor: "violao"

    };


    setAlunos([...alunos, aluno]);


    setNovoAluno({

      nome: "",

      idade: "",

      instrumento: "",

      unidade: ""

    });


    setShowModal(false);

  };



  return (

    <div className="alunos">


      <div className="alunos-header">

        <h1>Alunos</h1>


        <Button onClick={() => setShowModal(true)}>

          + Novo Aluno

        </Button>


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


          <div

            className={`card-aluno ${aluno.cor}`}

            key={aluno.id}

          >


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




      {showModal && (


        <Modal onClose={() => setShowModal(false)}>


          <h2>Novo Aluno</h2>



          <input
            type="text"
            placeholder="Nome"
            value={novoAluno.nome}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                nome: e.target.value
              })
            }
          />



          <input
            type="number"
            placeholder="Idade"
            value={novoAluno.idade}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                idade: e.target.value
              })
            }
          />



          <input
            type="text"
            placeholder="Instrumento"
            value={novoAluno.instrumento}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                instrumento: e.target.value
              })
            }
          />



          <input
            type="text"
            placeholder="Unidade"
            value={novoAluno.unidade}
            onChange={(e) =>
              setNovoAluno({
                ...novoAluno,
                unidade: e.target.value
              })
            }
          />



          <Button onClick={salvarAluno}>

            Salvar Aluno

          </Button>



        </Modal>


      )}



    </div>

  );

}


export default Alunos;