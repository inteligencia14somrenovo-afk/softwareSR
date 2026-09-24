import { useEffect, useState } from "react";
import {
  FaUserTie,
  FaUserGraduate,
  FaPlus,
  FaSearch,
  FaEdit,
  FaPowerOff,
  FaTrash,
  FaTable,
  FaTimes,
  FaUserShield,
  FaCode,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config/api";
import { useAuth } from "../../context/AuthContext";

import "./Professores.css";


const formularioInicial = {
  nome: "",
  email: "",
  role: "professor",
  aba: "Horário",
  intervalo: "",
  ativo: true,
};


const Professores = () => {

  const [professores, setProfessores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);

  const [formulario, setFormulario] = useState(
    formularioInicial
  );

  const [salvando, setSalvando] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");

  const navigate = useNavigate();
  const { professor: usuarioAtual } = useAuth();


  const ehDev = usuarioAtual?.role === "dev";
  const ehAdmin = usuarioAtual?.role === "admin";


  // =====================================================
  // CARREGAR USUÁRIOS
  // =====================================================

  const carregarProfessores = async () => {

    try {

      setErro("");

      const response = await fetch(
        `${API_URL}/professores`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
          "Erro ao carregar usuários."
        );
      }

      setProfessores(
        data.professores || []
      );

    } catch (error) {

      console.error(
        "❌ Erro ao carregar usuários:",
        error
      );

      setErro(
        error.message ||
        "Erro ao carregar usuários."
      );

    } finally {

      setCarregando(false);

    }
  };


  useEffect(() => {
    carregarProfessores();
  }, []);


  // =====================================================
  // ABRIR NOVO
  // =====================================================

  const abrirNovoProfessor = () => {

    setModoEdicao(false);
    setProfessorSelecionado(null);

    setFormulario({
      ...formularioInicial,
      role: "professor",
    });

    setMensagemModal("");
    setModalAberto(true);
  };


  // =====================================================
  // ABRIR EDIÇÃO
  // =====================================================

  const abrirEdicao = (professor, event) => {

    event.stopPropagation();

    setModoEdicao(true);
    setProfessorSelecionado(professor);

    setFormulario({
      nome: professor.nome || "",
      email: professor.email || "",
      role: professor.role || "professor",
      aba: "Horário",
      intervalo:
        professor.planilha_intervalo || "",
      ativo:
        professor.planilha_ativa !== false,
    });

    setMensagemModal("");
    setModalAberto(true);
  };


  // =====================================================
  // FECHAR MODAL
  // =====================================================

  const fecharModal = () => {

    if (salvando) {
      return;
    }

    setModalAberto(false);
    setProfessorSelecionado(null);
    setMensagemModal("");
  };


  // =====================================================
  // ALTERAR FORMULÁRIO
  // =====================================================

  const alterarCampo = (campo, valor) => {

    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

  };


  // =====================================================
  // NOME DO TIPO DE ACESSO
  // =====================================================

  const obterNomeRole = (role) => {

    switch (role) {

      case "dev":
        return "Desenvolvedor";

      case "admin":
        return "Administrador";

      case "professor":
      default:
        return "Professor";

    }

  };


  // =====================================================
  // SALVAR
  // =====================================================

  const salvarProfessor = async (event) => {

    event.preventDefault();

    if (!formulario.nome.trim()) {
      setMensagemModal(
        "Informe o nome do usuário."
      );
      return;
    }

    if (!formulario.email.trim()) {
      setMensagemModal(
        "Informe o e-mail do usuário."
      );
      return;
    }

    // Intervalo só é necessário para professores
    if (
      formulario.role === "professor" &&
      !formulario.intervalo.trim()
    ) {
      setMensagemModal(
        "Informe o intervalo da planilha do professor."
      );
      return;
    }


    // Apenas Dev e Admin podem criar/editar conta Dev
    if (
      formulario.role === "dev" &&
      !ehDev &&
      !ehAdmin
    ) {

      setMensagemModal(
        "Você não tem permissão para criar ou alterar uma conta de desenvolvedor."
      );

      return;
    }


    try {

      setSalvando(true);
      setMensagemModal("");

      const url = modoEdicao
        ? `${API_URL}/professores/${professorSelecionado.id}`
        : `${API_URL}/professores`;

      const method = modoEdicao
        ? "PUT"
        : "POST";


      const response = await fetch(
        url,
        {
          method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: formulario.nome.trim(),
            email: formulario.email.trim(),
            role: formulario.role,
            aba: "Horário",
            intervalo:
              formulario.role === "professor"
                ? formulario.intervalo.trim()
                : "",
            ativo: formulario.ativo,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.mensagem ||
          "Erro ao salvar usuário."
        );
      }


      setModalAberto(false);

      await carregarProfessores();


    } catch (error) {

      console.error(
        "❌ Erro ao salvar usuário:",
        error
      );

      setMensagemModal(
        error.message ||
        "Erro ao salvar usuário."
      );


    } finally {

      setSalvando(false);

    }

  };


  // =====================================================
  // ATIVAR / DESATIVAR
  // =====================================================

  const alterarStatus = async (
    professor,
    event
  ) => {

    event.stopPropagation();

    // Admin e Dev podem gerenciar usuários,
    // mas a planilha/status só existe para professores.
    if (professor.role !== "professor") {
      return;
    }

    const estaAtivo =
      professor.planilha_ativa !== false;

    const acao = estaAtivo
      ? "desativar"
      : "ativar";


    const confirmacao = window.confirm(
      estaAtivo
        ? `Deseja desativar ${professor.nome}?`
        : `Deseja ativar ${professor.nome}?`
    );


    if (!confirmacao) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/professores/${professor.id}/desativar`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.mensagem ||
          `Erro ao ${acao} professor.`
        );

      }


      await carregarProfessores();


    } catch (error) {

      console.error(
        "❌ Erro ao alterar status:",
        error
      );


      alert(
        error.message ||
        "Erro ao alterar status do professor."
      );

    }

  };


  // =====================================================
  // EXCLUIR
  // =====================================================

  const excluirProfessor = async (
    professor,
    event
  ) => {

    event.stopPropagation();


    if (!ehDev && !ehAdmin) {
      return;
    }


    // Exclusão definitiva só é permitida
    // quando o usuário estiver desativado.
    if (professor.planilha_ativa !== false) {

      alert(
        "Este usuário precisa estar desativado antes de ser excluído definitivamente."
      );

      return;
    }


    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir definitivamente ${professor.nome}?\n\nEssa ação não poderá ser desfeita.`
    );


    if (!confirmacao) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/professores/${professor.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.mensagem ||
          "Erro ao excluir usuário."
        );

      }


      await carregarProfessores();


      alert(
        "Usuário excluído com sucesso."
      );


    } catch (error) {

      console.error(
        "❌ Erro ao excluir usuário:",
        error
      );


      alert(
        error.message ||
        "Erro ao excluir usuário."
      );

    }

  };


  // =====================================================
  // FILTRO
  // =====================================================

  const professoresFiltrados =
    professores.filter((professor) => {

      const termo =
        busca.trim().toLowerCase();


      if (!termo) {
        return true;
      }


      return (
        professor.nome
          ?.toLowerCase()
          .includes(termo) ||

        professor.email
          ?.toLowerCase()
          .includes(termo) ||

        obterNomeRole(professor.role)
          .toLowerCase()
          .includes(termo)
      );

    });


  // =====================================================
  // SEPARAR POR TIPO DE ACESSO
  // =====================================================

  const administradores =
    professoresFiltrados.filter(
      (professor) =>
        professor.role === "admin"
    );

  const desenvolvedores =
    professoresFiltrados.filter(
      (professor) =>
        professor.role === "dev"
    );

  const professoresNormais =
    professoresFiltrados.filter(
      (professor) =>
        professor.role === "professor"
    );


  // =====================================================
  // RENDERIZAR CARD
  // =====================================================

  const renderizarCard = (professor) => {

    const ativo =
      professor.planilha_ativa !== false;

    const tipoAcesso =
      obterNomeRole(professor.role);

    const ehProfessor =
      professor.role === "professor";


    return (

      <div
        key={professor.id}
        className={`professor-card ${
          !ativo
            ? "professor-card-inativo"
            : ""
        }`}
        onClick={() =>
          navigate(
            `/professores/${professor.id}`
          )
        }
      >

        {/* TOPO */}

        <div className="professor-card-top">

          <div className="professor-avatar">

            {professor.foto_url ? (

              <img
                src={professor.foto_url}
                alt={professor.nome}
              />

            ) : (

              <span>
                {professor.nome
                  ? professor.nome
                      .charAt(0)
                      .toUpperCase()
                  : "?"}
              </span>

            )}

          </div>


          <div className="professor-info">

            <div className="professor-nome-linha">

              <h3>
                {professor.nome ||
                  "Sem nome"}
              </h3>

              <span
                className={`professor-status ${
                  ativo
                    ? "ativo"
                    : "inativo"
                }`}
              >
                {ativo
                  ? "Ativo"
                  : "Inativo"}
              </span>

            </div>


            <p>
              {professor.email}
            </p>


            <span className="professor-tipo-acesso">
              {tipoAcesso}
            </span>

          </div>

        </div>


        {/* DADOS */}

        <div className="professor-card-dados">

          {ehProfessor ? (

            <>
              <div className="professor-dado">

                <FaUserGraduate />

                <div>

                  <strong>
                    {professor.total_alunos}
                  </strong>

                  <span>
                    {professor.total_alunos === 1
                      ? "aluno"
                      : "alunos"}
                  </span>

                </div>

              </div>


              <div className="professor-dado">

                <FaTable />

                <div>

                  <strong>
                    Horário
                  </strong>

                  <span>
                    {professor.planilha_intervalo ||
                      "Sem intervalo"}
                  </span>

                </div>

              </div>
            </>

          ) : (

            <div className="professor-dado professor-dado-acesso">

              {professor.role === "admin"
                ? <FaUserShield />
                : <FaCode />}

              <div>

                <strong>
                  {tipoAcesso}
                </strong>

                <span>
                  Acesso administrativo
                </span>

              </div>

            </div>

          )}

        </div>


        {/* AÇÕES */}

        <div
          className="professor-card-acoes"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          <button
            type="button"
            onClick={(event) =>
              abrirEdicao(
                professor,
                event
              )
            }
          >
            <FaEdit />
            Editar
          </button>


          {ehProfessor && (

            <button
              type="button"
              onClick={(event) =>
                alterarStatus(
                  professor,
                  event
                )
              }
            >
              <FaPowerOff />

              {ativo
                ? "Desativar"
                : "Ativar"}
            </button>

          )}


          {/* Exclusão definitiva só aparece
              para usuários desativados. */}
          {(ehDev || ehAdmin) && !ativo && (

            <button
              type="button"
              className="professor-acao-excluir"
              onClick={(event) =>
                excluirProfessor(
                  professor,
                  event
                )
              }
            >
              <FaTrash />
              Excluir
            </button>

          )}

        </div>

      </div>

    );

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (carregando) {

    return (
      <div className="professores-page">
        <p>Carregando usuários...</p>
      </div>
    );

  }


  // =====================================================
  // ERRO
  // =====================================================

  if (erro) {

    return (
      <div className="professores-page">

        <div className="professores-erro">
          {erro}
        </div>

      </div>
    );

  }


  // =====================================================
  // PÁGINA
  // =====================================================

  return (

    <div className="professores-page">

      <div className="professores-header">

        <div>

          <h1>Professores</h1>

          <p>
            Gerencie usuários, acessos e
            configurações de horários.
          </p>

        </div>


        <button
          className="professores-btn-novo"
          onClick={abrirNovoProfessor}
        >
          <FaPlus />
          Novo usuário
        </button>

      </div>


      {/* BUSCA */}

      <div className="professores-toolbar">

        <div className="professores-busca">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou tipo..."
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
          />

        </div>


        <div className="professores-contador">

          {professoresFiltrados.length}{" "}
          {professoresFiltrados.length === 1
            ? "usuário"
            : "usuários"}

        </div>

      </div>


      {/* =================================================
          RESULTADO DA BUSCA
      ================================================= */}

      {professoresFiltrados.length === 0 ? (

        <div className="professores-vazio">

          <FaUserTie />

          <h3>
            Nenhum usuário encontrado
          </h3>

          <p>
            {busca
              ? "Tente outra busca."
              : "Ainda não existem usuários cadastrados."}
          </p>

        </div>

      ) : (

        <>

          {/* ============================================
              PROFESSORES
          ============================================ */}

          {professoresNormais.length > 0 && (

            <section className="professores-grupo">

              <div className="professores-grupo-header">

                <div className="professores-grupo-titulo">

                  <div className="professores-grupo-icone">
                    <FaUserGraduate />
                  </div>

                  <div>

                    <h2>
                      Professores
                    </h2>

                    <p>
                      Professores e suas configurações de horários.
                    </p>

                  </div>

                </div>


                <span className="professores-grupo-contador">
                  {professoresNormais.length}{" "}
                  {professoresNormais.length === 1
                    ? "professor"
                    : "professores"}
                </span>

              </div>


              <div className="professores-grid">

                {professoresNormais.map(
                  renderizarCard
                )}

              </div>

            </section>

          )}

        </>

      )}


      {/* ============================================
          ADMINISTRADORES
      ============================================ */}

      {administradores.length > 0 && (

        <section className="professores-grupo">

          <div className="professores-grupo-header">

            <div className="professores-grupo-titulo">

              <div className="professores-grupo-icone">
                <FaUserShield />
              </div>

              <div>

                <h2>
                  Administradores
                </h2>

                <p>
                  Contas com acesso administrativo ao sistema.
                </p>

              </div>

            </div>


            <span className="professores-grupo-contador">
              {administradores.length}{" "}
              {administradores.length === 1
                ? "conta"
                : "contas"}
            </span>

          </div>


          <div className="professores-grid">

            {administradores.map(
              renderizarCard
            )}

          </div>

        </section>

      )}


      {/* ============================================
          DESENVOLVEDORES
      ============================================ */}

      {desenvolvedores.length > 0 && (

        <section className="professores-grupo">

          <div className="professores-grupo-header">

            <div className="professores-grupo-titulo">

              <div className="professores-grupo-icone">
                <FaCode />
              </div>

              <div>

                <h2>
                  Desenvolvedores
                </h2>

                <p>
                  Contas com acesso de desenvolvimento.
                </p>

              </div>

            </div>


            <span className="professores-grupo-contador">
              {desenvolvedores.length}{" "}
              {desenvolvedores.length === 1
                ? "conta"
                : "contas"}
            </span>

          </div>


          <div className="professores-grid">

            {desenvolvedores.map(
              renderizarCard
            )}

          </div>

        </section>

      )}


      {/* =================================================
          MODAL
      ================================================= */}

      {modalAberto && (

        <div
          className="professor-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModal();
            }

          }}
        >

          <div className="professor-modal">

            <div className="professor-modal-header">

              <div>

                <h2>
                  {modoEdicao
                    ? "Editar usuário"
                    : "Novo usuário"}
                </h2>

                <p>
                  {modoEdicao
                    ? "Atualize os dados e o nível de acesso."
                    : "Cadastre o usuário e defina seu nível de acesso."}
                </p>

              </div>


              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
              >
                <FaTimes />
              </button>

            </div>


            <form
              className="professor-form"
              onSubmit={salvarProfessor}
            >

              {/* NOME */}

              <label>

                <span>Nome</span>

                <input
                  type="text"
                  value={formulario.nome}
                  onChange={(event) =>
                    alterarCampo(
                      "nome",
                      event.target.value
                    )
                  }
                  placeholder="Nome do usuário"
                  autoFocus
                />

              </label>


              {/* EMAIL */}

              <label>

                <span>E-mail</span>

                <input
                  type="email"
                  value={formulario.email}
                  onChange={(event) =>
                    alterarCampo(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="email@exemplo.com"
                />

              </label>


              {/* TIPO DE ACESSO */}

              <label>

                <span>Tipo de acesso</span>

                <select
                  value={formulario.role}
                  onChange={(event) =>
                    alterarCampo(
                      "role",
                      event.target.value
                    )
                  }
                >

                  <option value="professor">
                    Professor
                  </option>

                  <option value="admin">
                    Administrador
                  </option>

                  {(ehDev || ehAdmin) && (
                    <option value="dev">
                      Desenvolvedor
                    </option>
                  )}

                </select>

              </label>


              {/* PLANILHA */}

              {formulario.role === "professor" && (

                <div className="professor-form-grid">

                  <div className="professor-form-info">

                    <span>Aba da planilha</span>

                    <strong>
                      Horário
                    </strong>

                    <small>
                      A aba utilizada para os horários dos professores.
                    </small>

                  </div>


                  <label>

                    <span>Intervalo</span>

                    <input
                      type="text"
                      value={formulario.intervalo}
                      onChange={(event) =>
                        alterarCampo(
                          "intervalo",
                          event.target.value
                        )
                      }
                      placeholder="A69:G81"
                    />

                  </label>

                </div>

              )}


              {/* STATUS */}

              {formulario.role === "professor" && (

                <label className="professor-form-status">

                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(event) =>
                      alterarCampo(
                        "ativo",
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Usuário ativo para sincronização
                  </span>

                </label>

              )}


              {mensagemModal && (

                <div className="professor-modal-erro">
                  {mensagemModal}
                </div>

              )}


              {/* AÇÕES */}

              <div className="professor-modal-acoes">

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : modoEdicao
                      ? "Salvar alterações"
                      : "Criar usuário"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

};


export default Professores;

