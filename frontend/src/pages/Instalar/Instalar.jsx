import { useEffect, useState } from "react";
import "./Instalar.css";

function Instalar() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [instalado, setInstalado] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navegador, setNavegador] = useState("");

  useEffect(() => {
    const verificarInstalacao = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.navigator.standalone === true;

      setInstalado(standalone);
    };

    const userAgent = navigator.userAgent || "";

    const ios =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    const android = /Android/i.test(userAgent);

    const mobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(mobile);

    if (/Edg/i.test(userAgent)) {
      setNavegador("Edge");
    } else if (/Chrome/i.test(userAgent)) {
      setNavegador("Chrome");
    } else if (/Firefox/i.test(userAgent)) {
      setNavegador("Firefox");
    } else if (/Safari/i.test(userAgent)) {
      setNavegador("Safari");
    } else {
      setNavegador("navegador");
    }

    verificarInstalacao();

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setInstalado(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    const mediaQuery = window.matchMedia(
      "(display-mode: standalone)"
    );

    const handleDisplayModeChange = () => {
      verificarInstalacao();
    };

    mediaQuery.addEventListener(
      "change",
      handleDisplayModeChange
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );

      mediaQuery.removeEventListener(
        "change",
        handleDisplayModeChange
      );
    };
  }, []);

  const instalarAplicativo = async () => {
    if (!installPrompt) return;

    try {
      installPrompt.prompt();

      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error(
        "Não foi possível abrir o instalador do PWA:",
        error
      );
    }
  };

  const abrirAplicativo = () => {
    window.location.href = "/";
  };

  if (instalado) {
    return (
      <main className="instalar-page">
        <section className="instalar-card">
          <div className="instalar-icon success">
            ✓
          </div>

          <h1>Aplicativo instalado</h1>

          <p className="instalar-subtitle">
            O Som Renovo Manager já está instalado neste
            dispositivo.
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

        <p className="instalar-subtitle">
          Instale o aplicativo para acessar o Manager
          rapidamente pelo seu dispositivo.
        </p>

        {installPrompt && (
          <button
            className="instalar-button"
            onClick={instalarAplicativo}
          >
            Instalar aplicativo
          </button>
        )}

        {isIOS && (
          <div className="instalar-instrucoes">
            <h2>Instalar no iPhone ou iPad</h2>

            <p>
              <strong>1.</strong> Abra esta página no
              Safari.
            </p>

            <p>
              <strong>2.</strong> Toque no botão
              <strong> Compartilhar</strong>.
            </p>

            <p>
              <strong>3.</strong> Selecione
              <strong> Adicionar à Tela de Início</strong>.
            </p>

            <p>
              <strong>4.</strong> Toque em
              <strong> Adicionar</strong>.
            </p>
          </div>
        )}

        {!installPrompt && !isIOS && isAndroid && (
          <div className="instalar-instrucoes">
            <h2>Instalação pelo navegador</h2>

            <p>
              O navegador ainda não disponibilizou o botão
              automático de instalação.
            </p>

            <p>
              Toque no menu do navegador e procure por
              <strong> Instalar aplicativo</strong> ou
              <strong> Adicionar à tela inicial</strong>.
            </p>
          </div>
        )}

        {!installPrompt && !isIOS && !isAndroid && (
          <div className="instalar-instrucoes">
            <h2>Instalar no computador</h2>

            <p>
              Você está usando o {navegador}.
            </p>

            <p>
              Procure o ícone de instalação na barra de
              endereço ou abra o menu do navegador e procure
              por <strong>Instalar aplicativo</strong>.
            </p>
          </div>
        )}

        {isMobile && !installPrompt && !isIOS && (
          <p className="instalar-ajuda">
            Se a opção de instalação não aparecer,
            verifique se esta página está sendo aberta em um
            navegador compatível.
          </p>
        )}

      </section>
    </main>
  );
}

export default Instalar;