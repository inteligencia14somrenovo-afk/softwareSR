import { useCallback, useEffect, useState } from "react";
import {
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { GrSchedules } from "react-icons/gr";
import { SiGooglesheets } from "react-icons/si";
import API_URL from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./Horarios.css";

// Converte letras de coluna em números: A = 1, Z = 26, AA = 27...
const colunaParaNumero = (letras) =>
  letras
    .toUpperCase()
    .split("")
    .reduce(
      (total, letra) => total * 26 + letra.charCodeAt(0) - 64,
      0
    );

// Converte números em letras de coluna.
const numeroParaColuna = (numero) => {
  let resultado = "";
  let n = numero;

  while (n > 0) {
    const resto = (n - 1) % 26;
    resultado = String.fromCharCode(65 + resto) + resultado;
    n = Math.floor((n - 1) / 26);
  }

  return resultado;
};

// Interpreta intervalos como A69:G81 ou $A$69:$G$81.
const interpretarIntervalo = (intervalo) => {
  const limpo = String(intervalo || "")
    .replace(/\$/g, "")
    .trim();

  const correspondencia = limpo.match(
    /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i
  );

  if (!correspondencia) {
    throw new Error(
      `Intervalo inválido ou não reconhecido: ${intervalo || "(vazio)"}`
    );
  }

  const [, colunaInicial, linhaInicial, colunaFinal, linhaFinal] =
    correspondencia;

  const inicioColuna = colunaParaNumero(colunaInicial);
  const fimColuna = colunaParaNumero(colunaFinal);
  const inicioLinha = Number(linhaInicial);
  const fimLinha = Number(linhaFinal);

  if (
    inicioColuna > fimColuna ||
    inicioLinha > fimLinha ||
    inicioLinha < 1
  ) {
    throw new Error("O intervalo cadastrado possui limites inválidos.");
  }

  const quantidadeCelulas =
    (fimColuna - inicioColuna + 1) *
    (fimLinha - inicioLinha + 1);

  if (quantidadeCelulas > 5000) {
    throw new Error(
      "O intervalo cadastrado é grande demais para exibição."
    );
  }

  return {
    inicioColuna,
    fimColuna,
    inicioLinha,
    fimLinha,
  };
};

const Horarios = () => {
  const { professor } = useAuth();

  const podeSincronizar = ["admin", "dev"].includes(
    String(professor?.role || "").trim().toLowerCase()
  );

  const [sincronizando, setSincronizando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoProfessores, setCarregandoProfessores] =
    useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  const [planilha, setPlanilha] = useState(null);
  const [celulas, setCelulas] = useState([]);
  const [erroHorarios, setErroHorarios] = useState("");

  const [professoresPlanilha, setProfessoresPlanilha] = useState([]);
  const [professorSelecionado, setProfessorSelecionado] = useState("");

  // Lista os professores com intervalos cadastrados.
  // Endpoint protegido no backend para admin/dev.
  const carregarProfessores = useCallback(async () => {
    if (!podeSincronizar) return;

    try {
      setCarregandoProfessores(true);

      const resposta = await fetch(
        `${API_URL}/planilha/professores`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.mensagem ||
            dados.erro ||
            "Não foi possível listar os professores."
        );
      }

      const lista = Array.isArray(dados.dados) ? dados.dados : [];

      setProfessoresPlanilha(lista);

      // Mantém a seleção atual se ela ainda existir.
      setProfessorSelecionado((selecionadoAtual) => {
        if (
          selecionadoAtual &&
          lista.some(
            (item) =>
              String(item.professor_id) === String(selecionadoAtual)
          )
        ) {
          return selecionadoAtual;
        }

        // Não seleciona automaticamente para evitar exibir
        // o horário de outra pessoa sem escolha do administrador.
        return "";
      });
    } catch (error) {
      setProfessoresPlanilha([]);
      setMensagem(
        error.message || "Erro ao carregar a lista de professores."
      );
      setErro(true);
    } finally {
      setCarregandoProfessores(false);
    }
  }, [podeSincronizar]);

  useEffect(() => {
    if (podeSincronizar) {
      carregarProfessores();
    }
  }, [podeSincronizar, carregarProfessores]);

  // Define qual professor será consultado.
  // Admin/dev consulta o selecionado; professor comum, somente a si próprio.
  const idParaConsultar = podeSincronizar
    ? professorSelecionado
    : professor?.id
      ? String(professor.id)
      : "";

  const carregarHorarios = useCallback(async () => {
    if (!idParaConsultar) {
      setPlanilha(null);
      setCelulas([]);
      setErroHorarios(
        podeSincronizar
          ? ""
          : "Não foi possível identificar o professor conectado."
      );
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErroHorarios("");
      setPlanilha(null);
      setCelulas([]);

      const resposta = await fetch(
        `${API_URL}/planilha/horarios/${idParaConsultar}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.mensagem ||
            dados.erro ||
            "Não foi possível carregar a planilha."
        );
      }

      if (!dados.professor_planilha?.intervalo) {
        throw new Error(
          "O servidor não retornou o intervalo cadastrado para este professor."
        );
      }

      setPlanilha(dados.professor_planilha);
      setCelulas(Array.isArray(dados.dados) ? dados.dados : []);
    } catch (error) {
      setPlanilha(null);
      setCelulas([]);
      setErroHorarios(
        error.message || "Erro ao consultar a planilha."
      );
    } finally {
      setCarregando(false);
    }
  }, [idParaConsultar, podeSincronizar]);

  useEffect(() => {
    carregarHorarios();
  }, [carregarHorarios]);

  const selecionarProfessor = (event) => {
    setProfessorSelecionado(event.target.value);
    setMensagem("");
    setErro(false);
    setPlanilha(null);
    setCelulas([]);
    setErroHorarios("");
  };

  const sincronizarPlanilha = async () => {
    try {
      setSincronizando(true);
      setMensagem("");
      setErro(false);

      const resposta = await fetch(
        `${API_URL}/planilha/sincronizar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const texto = await resposta.text();
      let dados = {};

      try {
        dados = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error(
          "O servidor retornou uma resposta inválida."
        );
      }

      if (!resposta.ok || dados.sucesso === false) {
        throw new Error(
          dados.mensagem ||
            dados.erro ||
            "Não foi possível sincronizar a planilha."
        );
      }

      setMensagem(
        dados.mensagem || "Planilha sincronizada com sucesso!"
      );

      // Atualiza a lista e a grade após sincronizar.
      if (podeSincronizar) {
        await carregarProfessores();
      }

      await carregarHorarios();
    } catch (error) {
      setErro(true);
      setMensagem(
        error.message || "Erro ao conectar com o servidor."
      );
    } finally {
      setSincronizando(false);
    }
  };

  // Reconstrói a grade completa, inclusive células vazias.
  const grade = (() => {
    if (!planilha?.intervalo) return null;

    try {
      const limites = interpretarIntervalo(planilha.intervalo);
      const mapaCelulas = new Map();

      celulas.forEach((item) => {
        const endereco = String(item.celula || "")
          .replace(/\$/g, "")
          .trim()
          .toUpperCase();

        const correspondencia = endereco.match(/^([A-Z]+)(\d+)$/);

        if (!correspondencia) return;

        const [, coluna, linha] = correspondencia;

        mapaCelulas.set(
          `${coluna}${Number(linha)}`,
          item.conteudo ?? ""
        );
      });

      const colunas = [];

      for (
        let numero = limites.inicioColuna;
        numero <= limites.fimColuna;
        numero++
      ) {
        colunas.push(numeroParaColuna(numero));
      }

      const linhas = [];

      for (
        let numero = limites.inicioLinha;
        numero <= limites.fimLinha;
        numero++
      ) {
        linhas.push({
          numero,
          celulas: colunas.map((coluna) => ({
            endereco: `${coluna}${numero}`,
            conteudo:
              mapaCelulas.get(`${coluna}${numero}`) ?? "",
          })),
        });
      }

      return { colunas, linhas };
    } catch (error) {
      return { erro: error.message };
    }
  })();

  return (
    <main className="horarios-page">
      <header className="horarios-header">
  <div>
    <h1>Horários</h1>
    <p>
      Consulte os horários das aulas organizados por professor.
    </p>
  </div>
</header>

      <section className="horarios-card">
        <div className="horarios-card-header">
          <div className="horarios-icon">
            <SiGooglesheets />
          </div>

          <div className="horarios-info">
            <h2>Planilha de horários</h2>
            <p>
              Visualização dos dados sincronizados com o banco do Manager.
            </p>
          </div>
        </div>

        <div className="horarios-divider" />

        <div className="horarios-status">
          <span className="horarios-status-dot" />
          <span>Dados locais do sistema</span>
        </div>

        <p className="horarios-description">
          {podeSincronizar
            ? "Selecione um professor para visualizar o intervalo de horários importado."
            : "Esta visualização mostra somente o intervalo autorizado para o professor conectado."}
        </p>

        {podeSincronizar && (
          <div className="horarios-professor-selector">
            <label
              className="horarios-professor-label"
              htmlFor="professor-planilha"
            >
              Professor
            </label>

            <select
              id="professor-planilha"
              className="horarios-professor-select"
              value={professorSelecionado}
              onChange={selecionarProfessor}
              disabled={carregandoProfessores}
            >
              <option value="">
                {carregandoProfessores
                  ? "Carregando professores..."
                  : "Selecione um professor"}
              </option>

              {professoresPlanilha.map((item) => (
                <option
                  key={item.professor_id}
                  value={String(item.professor_id)}
                >
                  {item.nome}
                  {item.intervalo ? ` — ${item.intervalo}` : ""}
                </option>
              ))}
            </select>

            {!carregandoProfessores &&
              professoresPlanilha.length === 0 && (
                <p className="horarios-permission">
                  Nenhum professor com planilha ativa foi encontrado.
                </p>
              )}
          </div>
        )}

        {podeSincronizar ? (
          <button
            type="button"
            className="horarios-sync-button"
            onClick={sincronizarPlanilha}
            disabled={sincronizando}
          >
            <FaSyncAlt
              className={sincronizando ? "girando" : ""}
            />
            {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        ) : (
          <p className="horarios-permission">
            A sincronização manual está disponível somente para
            administradores e desenvolvedores.
          </p>
        )}

        {mensagem && (
          <div
            className={`horarios-message ${
              erro ? "erro" : "sucesso"
            }`}
            role="status"
          >
            {erro ? <FaExclamationCircle /> : <FaCheckCircle />}
            <span>{mensagem}</span>
          </div>
        )}
      </section>

      <section className="horarios-card horarios-next">
        <div className="horarios-schedule-header">
          <div>
            <h2>
              <GrSchedules /> Grade de Horários
            </h2>
            <p>
              {planilha
                ? `${planilha.nome} • Intervalo ${planilha.intervalo}`
                : podeSincronizar && !professorSelecionado
                  ? "Selecione um professor para visualizar o horário."
                  : "Intervalo cadastrado para o professor"}
            </p>
          </div>

          <button
            type="button"
            className="horarios-refresh-button"
            onClick={carregarHorarios}
            disabled={carregando || !idParaConsultar}
          >
            <FaSyncAlt
              className={carregando ? "girando" : ""}
            />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p className="horarios-empty">
            Carregando planilha...
          </p>
        ) : podeSincronizar && !professorSelecionado ? (
          <div className="horarios-empty">
            <SiGooglesheets />
            <p>Selecione um professor acima para visualizar a grade.</p>
          </div>
        ) : erroHorarios ? (
          <div className="horarios-message erro" role="alert">
            <FaExclamationCircle />
            <span>{erroHorarios}</span>
          </div>
        ) : grade?.erro ? (
          <div className="horarios-message erro" role="alert">
            <FaExclamationCircle />
            <span>{grade.erro}</span>
          </div>
        ) : grade ? (
          <div className="horarios-grid-wrapper">
            <table className="horarios-grid">
              <thead>
                <tr>
                  <th className="horarios-row-number">#</th>
                  {grade.colunas.map((coluna) => (
                    <th key={coluna} scope="col">
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {grade.linhas.map((linha) => (
                  <tr key={linha.numero}>
                    <th
                      className="horarios-row-number"
                      scope="row"
                    >
                      {linha.numero}
                    </th>

                    {linha.celulas.map((celula) => (
                      <td key={celula.endereco}>
                        <div
                          className="horarios-cell-content"
                          title={String(celula.conteudo)}
                        >
                          {String(celula.conteudo)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="horarios-empty">
            <SiGooglesheets />
            <p>Nenhuma planilha configurada para este professor.</p>
          </div>
        )}

        {!carregando && !erroHorarios && grade && !grade.erro && (
          <p className="horarios-grid-footer">
            {celulas.length} célula(s) recebida(s) do banco de dados.
            Células vazias são preservadas na visualização.
          </p>
        )}
      </section>
    </main>
  );
};

export default Horarios;