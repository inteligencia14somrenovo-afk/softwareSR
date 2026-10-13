import { useCallback, useEffect, useState } from "react";
import {
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa";
import { SiGooglesheets } from "react-icons/si";
import API_URL from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./GoogleSheets.css";

const DIAS = [
  "SEGUNDA",
  "TERÇA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÁBADO",
];

const GoogleSheets = () => {
  const { professor } = useAuth();

  const podeSincronizar = ["admin", "dev"].includes(
    String(professor?.role || "").trim().toLowerCase()
  );

  const [sincronizando, setSincronizando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [erroHorarios, setErroHorarios] = useState("");

  const carregarHorarios = useCallback(async () => {
    if (!professor?.id) {
      setHorarios([]);
      setErroHorarios("Não foi possível identificar o professor conectado.");
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErroHorarios("");

      const resposta = await fetch(
        `${API_URL}/planilha/horarios/${professor.id}/organizados`,
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
            "Não foi possível carregar os horários."
        );
      }

      setHorarios(Array.isArray(dados.dados) ? dados.dados : []);
    } catch (error) {
      setErroHorarios(
        error.message || "Erro ao consultar os horários."
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
      dados.mensagem ||
        "Planilha sincronizada com sucesso!"
    );

    // Atualiza a grade somente depois da resposta da sincronização.
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

  const horariosPorDia = DIAS.map((dia) => ({
    dia,
    itens: horarios.filter(
      (item) =>
        String(item.diaSemana || "").toUpperCase() === dia
    ),
  }));

  return (
    <main className="google-sheets-page">
      <header className="google-sheets-header">
        <div>
          <h1>Google Sheets</h1>
          <p>
            Consulte os horários importados para o Som Renovo Manager.
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
            <p>Dados sincronizados com o banco de dados do Manager.</p>
          </div>
        </div>

        <div className="google-sheets-divider" />

        <div className="google-sheets-status">
          <span className="google-sheets-status-dot" />
          <span>Dados locais do sistema</span>
        </div>

        <p className="google-sheets-description">
          A grade abaixo exibe os horários que já estão armazenados no
          banco de dados. Para confirmar se a conexão com o Google está
          funcionando, execute uma sincronização.
        </p>

        {podeSincronizar && (
          <button
            type="button"
            className="google-sheets-sync-button"
            onClick={sincronizarPlanilha}
            disabled={sincronizando}
          >
            <FaSyncAlt className={sincronizando ? "girando" : ""} />
            {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        )}

        {!podeSincronizar && (
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
              <FaCalendarAlt /> Horários sincronizados
            </h2>
            <p>
              {horarios.length} registro(s) encontrado(s) no banco.
            </p>
          </div>

          <button
            type="button"
            className="google-sheets-refresh-button"
            onClick={carregarHorarios}
            disabled={carregando}
          >
            <FaSyncAlt className={carregando ? "girando" : ""} />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p className="google-sheets-empty">Carregando horários...</p>
        ) : erroHorarios ? (
          <div className="google-sheets-message erro" role="alert">
            <FaExclamationCircle />
            <span>{erroHorarios}</span>
          </div>
        ) : horarios.length === 0 ? (
          <div className="google-sheets-empty">
            <FaCalendarAlt />
            <p>Nenhum horário encontrado para este professor.</p>
          </div>
        ) : (
          <div className="google-sheets-days">
            {horariosPorDia.map(({ dia, itens }) => (
              <div className="google-sheets-day" key={dia}>
                <h3>{dia}</h3>

                {itens.length === 0 ? (
                  <p className="google-sheets-no-items">
                    Nenhum horário registrado.
                  </p>
                ) : (
                  <div className="google-sheets-schedule-list">
                    {itens.map((item, index) => (
                      <article
                        className="google-sheets-schedule-item"
                        key={`${item.celula || dia}-${index}`}
                      >
                        <div className="google-sheets-schedule-time">
                          {item.horario || "Horário não informado"}
                        </div>

                        <div className="google-sheets-schedule-details">
                          <strong>
                            {item.nome || "Nome não informado"}
                          </strong>
                          <span>
                            {item.instrumento_especifico ||
                              item.instrumento ||
                              "Instrumento não informado"}
                          </span>
                          {item.tipo && (
                            <small>
                              {String(item.tipo).replaceAll("_", " ")}
                            </small>
                          )}
                        </div>

                        <FaUser className="google-sheets-student-icon" />
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default GoogleSheets;