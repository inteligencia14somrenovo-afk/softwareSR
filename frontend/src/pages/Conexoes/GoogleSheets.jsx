import { useCallback, useEffect, useState } from "react";
import {
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { SiGooglesheets } from "react-icons/si";
import API_URL from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./GoogleSheets.css";

// Converte letras de coluna em números:
// A = 1, Z = 26, AA = 27...
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

  // Evita renderizar acidentalmente uma área excessivamente grande.
  const quantidadeCelulas =
    (fimColuna - inicioColuna + 1) *
    (fimLinha - inicioLinha + 1);

  if (quantidadeCelulas > 5000) {
    throw new Error("O intervalo cadastrado é grande demais para exibição.");
  }

  return {
    inicioColuna,
    fimColuna,
    inicioLinha,
    fimLinha,
  };
};

const GoogleSheets = () => {
  const { professor } = useAuth();

  const podeSincronizar = ["admin", "dev"].includes(
    String(professor?.role || "").trim().toLowerCase()
  );

  const [sincronizando, setSincronizando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);

  const [planilha, setPlanilha] = useState(null);
  const [celulas, setCelulas] = useState([]);
  const [erroHorarios, setErroHorarios] = useState("");

  const carregarHorarios = useCallback(async () => {
    if (!professor?.id) {
      setPlanilha(null);
      setCelulas([]);
      setErroHorarios(
        "Não foi possível identificar o professor conectado."
      );
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErroHorarios("");

      const resposta = await fetch(
        `${API_URL}/planilha/horarios/${professor.id}`,
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
  }, [professor?.id]);

  useEffect(() => {
    carregarHorarios();
  }, [carregarHorarios]);

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
            conteudo: mapaCelulas.get(`${coluna}${numero}`) ?? "",
          })),
        });
      }

      return { colunas, linhas };
    } catch (error) {
      return { erro: error.message };
    }
  })();

  return (
    <main className="google-sheets-page">
      <header className="google-sheets-header">
        <div>
          <h1>Google Sheets</h1>
          <p>
            Consulte a grade de horários importada para o Som Renovo Manager.
          </p>
        </div>
      </header>

      <section className="google-sheets-card">
        <div className="google-sheets-card-header">
          <div className="google-sheets-icon">
            <SiGooglesheets />
          </div>

          <div className="google-sheets-info">
            <h2>Planilha de horários</h2>
            <p>
              Visualização dos dados sincronizados com o banco do Manager.
            </p>
          </div>
        </div>

        <div className="google-sheets-divider" />

        <div className="google-sheets-status">
          <span className="google-sheets-status-dot" />
          <span>Dados locais do sistema</span>
        </div>

        <p className="google-sheets-description">
          Esta visualização mostra somente o intervalo autorizado para o
          professor conectado. Ela não abre nem compartilha a planilha
          original do Google.
        </p>

        {podeSincronizar ? (
          <button
            type="button"
            className="google-sheets-sync-button"
            onClick={sincronizarPlanilha}
            disabled={sincronizando}
          >
            <FaSyncAlt
              className={sincronizando ? "girando" : ""}
            />
            {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        ) : (
          <p className="google-sheets-permission">
            A sincronização manual está disponível somente para
            administradores e desenvolvedores.
          </p>
        )}

        {mensagem && (
          <div
            className={`google-sheets-message ${
              erro ? "erro" : "sucesso"
            }`}
            role="status"
          >
            {erro ? <FaExclamationCircle /> : <FaCheckCircle />}
            <span>{mensagem}</span>
          </div>
        )}
      </section>

      <section className="google-sheets-card google-sheets-next">
        <div className="google-sheets-schedule-header">
          <div>
            <h2>
              <SiGooglesheets /> Grade de horários
            </h2>
            <p>
              {planilha
                ? `${planilha.nome} • Intervalo ${planilha.intervalo}`
                : "Intervalo cadastrado para o professor"}
            </p>
          </div>

          <button
            type="button"
            className="google-sheets-refresh-button"
            onClick={carregarHorarios}
            disabled={carregando}
          >
            <FaSyncAlt
              className={carregando ? "girando" : ""}
            />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p className="google-sheets-empty">
            Carregando planilha...
          </p>
        ) : erroHorarios ? (
          <div className="google-sheets-message erro" role="alert">
            <FaExclamationCircle />
            <span>{erroHorarios}</span>
          </div>
        ) : grade?.erro ? (
          <div className="google-sheets-message erro" role="alert">
            <FaExclamationCircle />
            <span>{grade.erro}</span>
          </div>
        ) : grade ? (
          <div className="google-sheets-grid-wrapper">
            <table className="google-sheets-grid">
              <thead>
                <tr>
                  <th className="google-sheets-row-number">#</th>
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
                      className="google-sheets-row-number"
                      scope="row"
                    >
                      {linha.numero}
                    </th>

                    {linha.celulas.map((celula) => (
                      <td key={celula.endereco}>
                        <div
                          className="google-sheets-cell-content"
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
          <div className="google-sheets-empty">
            <SiGooglesheets />
            <p>Nenhuma planilha configurada para este professor.</p>
          </div>
        )}

        {!carregando && !erroHorarios && grade && !grade.erro && (
          <p className="google-sheets-grid-footer">
            {celulas.length} célula(s) recebida(s) do banco de dados.
            Células vazias são preservadas na visualização.
          </p>
        )}
      </section>
    </main>
  );
};

export default GoogleSheets;