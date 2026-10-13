import { useAuth } from "../../context/AuthContext";
import "./GoogleSheets.css";

const GoogleSheets = () => {
  const { professor } = useAuth();

  return (
    <main className="google-sheets-page">
      <header className="google-sheets-header">
        <div>
          <h1>Google Sheets</h1>
          <p>
            Consulte sua planilha de horários integrada
            ao Som Renovo Manager.
          </p>
        </div>
      </header>

      <section className="google-sheets-content">
        <div className="google-sheets-status">
          <h2>Planilha de horários</h2>

          <p>
            Usuário: {professor?.nome || "Não identificado"}
          </p>

          <p>
            E-mail: {professor?.email || "Não informado"}
          </p>

          <p>
            A integração será vinculada à planilha
            correspondente ao professor autenticado.
          </p>
        </div>
      </section>
    </main>
  );
};

export default GoogleSheets;