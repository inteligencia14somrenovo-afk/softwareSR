import { useEffect, useState } from "react";
import "./Instalar.css";

function Instalar() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [instalado, setInstalado] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    // Verifica se o aplicativo já está instalado
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setInstalado(standalone);

    // Detecta iPhone/iPad
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setIsIOS(ios);

    // Captura o evento nativo de instalação
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    // Detecta quando o PWA foi instalado
    const handleAppInstalled = () => {
      setInstalado(true);
      setInstallPrompt(null);
      setMensagem("");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const instalarAplicativo = async () => {
    setMensagem("");

    // iOS
    if (isIOS) {
      setMensagem(
        "No iPhone ou iPad, toque em Compartilhar e depois em “Adicionar à Tela de Início”."
      );
      return;
    }

    // Navegador não disponibilizou o prompt
    if (!installPrompt) {
      setMensagem(
        "A instalação automática não está disponível neste momento. Abra o menu do navegador e procure por “Instalar aplicativo” ou “Instalar Som Renovo Manager”."
      );
      return;
    }

    // Abre o instalador nativo
    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
      setMensagem("Instalação iniciada.");
    }
  };

  const abrirAplicativo = () => {
    window.location.href = "/";
  };

  if (instalado) {
    return (
      <main className="instalar-page">
        <section className="instalar-card">
          <div className="instalar-logo">
            SR
          </div>

          <div className="instalar-status">
            ✓
          </div>

          <h1>Aplicativo instalado</h1>

          <p className="instalar-description">
            O Som Renovo Manager já está instalado neste dispositivo.
          </p>

          <button
            className="instalar-button"
            onClick={abrirAplicativo}
          >
            Abrir aplicativo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="instalar-page">
      <section className="instalar-card">

        <div className="instalar-logo">
          SR
        </div>

        <h1>Som Renovo Manager</h1>

        <p className="instalar-description">
          Instale o aplicativo para ter acesso rápido ao
          Som Renovo Manager diretamente pelo seu dispositivo.
        </p>

        <button
          className="instalar-button"
          onClick={instalarAplicativo}
        >
          Instalar aplicativo
        </button>

        {mensagem && (
          <div className="instalar-message">
            {mensagem}
          </div>
        )}

        {isIOS && (
          <div className="instalar-help">
            <h2>Instalar no iPhone ou iPad</h2>

            <ol>
              <li>
                Abra esta página pelo <strong>Safari</strong>.
              </li>

              <li>
                Toque no botão <strong>Compartilhar</strong>.
              </li>

              <li>
                Selecione <strong>Adicionar à Tela de Início</strong>.
              </li>

              <li>
                Confirme tocando em <strong>Adicionar</strong>.
              </li>
            </ol>
          </div>
        )}

        {!isIOS && (
          <div className="instalar-help">
            <h2>Depois de instalar</h2>

            <p>
              O aplicativo ficará disponível na tela inicial
              do dispositivo e poderá ser aberto como um aplicativo normal.
            </p>
          </div>
        )}

      </section>
    </main>
  );
}

export default Instalar;