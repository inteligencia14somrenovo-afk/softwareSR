import { useState } from "react";


function Responsaveis({
  aluno,
  alunos,
  setAlunos,
  setAlunoSelecionado
}) {

  const [showForm, setShowForm] = useState(false);


  const [novoResponsavel, setNovoResponsavel] = useState({
    nome: "",
    telefone: "",
    foto: ""
  });


  // =========================
  // ADICIONAR
  // =========================

  const salvar = () => {

    if (
      !novoResponsavel.nome.trim() ||
      !novoResponsavel.telefone.trim()
    ) {

      alert(
        "Preencha o nome e o telefone do responsável."
      );

      return;
    }


    const responsavel = {

      id: Date.now(),

      nome: novoResponsavel.nome,

      telefone: novoResponsavel.telefone,

      foto: novoResponsavel.foto || ""

    };


    const alunosAtualizados = alunos.map(
      (item) => {

        if (item.id !== aluno.id) {
          return item;
        }


        return {

          ...item,

          responsaveis: [

            ...(item.responsaveis || []),

            responsavel

          ]

        };

      }
    );


    setAlunos(alunosAtualizados);


    const alunoAtualizado =
      alunosAtualizados.find(
        (item) => item.id === aluno.id
      );


    setAlunoSelecionado(alunoAtualizado);


    setNovoResponsavel({

      nome: "",

      telefone: "",

      foto: ""

    });


    setShowForm(false);

  };


  // =========================
  // EXCLUIR
  // =========================

  const excluir = (responsavelId) => {

    const confirmar = window.confirm(
      "Deseja realmente excluir este responsável?"
    );


    if (!confirmar) {
      return;
    }


    const alunosAtualizados = alunos.map(
      (item) => {

        if (item.id !== aluno.id) {
          return item;
        }


        return {

          ...item,

          responsaveis:
            (item.responsaveis || []).filter(
              (responsavel) =>
                responsavel.id !== responsavelId
            )

        };

      }
    );


    setAlunos(alunosAtualizados);


    const alunoAtualizado =
      alunosAtualizados.find(
        (item) => item.id === aluno.id
      );


    setAlunoSelecionado(alunoAtualizado);

  };


  // =========================
  // CANCELAR
  // =========================

  const cancelar = () => {

    setShowForm(false);


    setNovoResponsavel({

      nome: "",

      telefone: "",

      foto: ""

    });

  };


  // =========================
  // RENDER
  // =========================

  return (

    <div className="responsaveis-lista">


      {(aluno.responsaveis || []).map(
        (responsavel) => (

          <div
            className="responsavel-card"
            key={responsavel.id}
          >

            <div className="responsavel-foto">

              {responsavel.foto ? (

                <img
                  src={responsavel.foto}
                  alt={responsavel.nome}
                />

              ) : (

                "👤"

              )}

            </div>


            <div className="responsavel-dados">

              <strong>
                {responsavel.nome}
              </strong>


              <span>
                📱 {responsavel.telefone}
              </span>

            </div>


            <button
              type="button"
              className="responsavel-menu"
              onClick={() =>
                excluir(responsavel.id)
              }
            >
              ⋮
            </button>

          </div>

        )
      )}


      {!showForm && (

        <button
          type="button"
          className="btn-adicionar-responsavel"
          onClick={() =>
            setShowForm(true)
          }
        >
          + Adicionar responsável
        </button>

      )}


      {showForm && (

        <div className="responsavel-form">

          <h4>
            Novo responsável
          </h4>


          <input
            type="text"
            placeholder="Nome completo"
            value={novoResponsavel.nome}
            onChange={(e) =>
              setNovoResponsavel({
                ...novoResponsavel,
                nome: e.target.value
              })
            }
          />


          <input
            type="tel"
            placeholder="Telefone"
            value={novoResponsavel.telefone}
            onChange={(e) =>
              setNovoResponsavel({
                ...novoResponsavel,
                telefone: e.target.value
              })
            }
          />


          <input
            type="file"
            accept="image/*"
            onChange={(e) => {

              const arquivo =
                e.target.files[0];


              if (!arquivo) {
                return;
              }


              const leitor =
                new FileReader();


              leitor.onloadend = () => {

                setNovoResponsavel({

                  ...novoResponsavel,

                  foto: leitor.result

                });

              };


              leitor.readAsDataURL(arquivo);

            }}
          />


          <div className="responsavel-form-acoes">

            <button
              type="button"
              onClick={salvar}
            >
              Salvar responsável
            </button>


            <button
              type="button"
              onClick={cancelar}
            >
              Cancelar
            </button>

          </div>

        </div>

      )}

    </div>

  );

}


export default Responsaveis;