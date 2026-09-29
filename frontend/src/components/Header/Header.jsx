import { useState, useEffect, useRef } from "react";
import { MdDarkMode, MdNotifications } from "react-icons/md";
import API_URL from "../../config/api";
import notificacaoAudio from "../../assets/sounds/notificacao.mp3"

import "./Header.css";

const Header = () => {

  // =====================================================
  // ESTADOS
  // =====================================================

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notificacoes, setNotificacoes] =
    useState([]);

  const [carregandoNotificacoes, setCarregandoNotificacoes] =
    useState(true);

  const [notificacaoToast, setNotificacaoToast] =
    useState(null);

  const [notificacoesAtivas, setNotificacoesAtivas] =
    useState(() => {
      const valor =
        localStorage.getItem("som-renovo-notificacoes");

      return valor !== "false";
    });

 // =====================================================
  // TOCAR SOM NOTIFICAÇÂO
  // =====================================================

    const tocarSomNotificacao = () => {
  const audio = new Audio(notificacaoAudio);

  audio.volume = 0.7;

  audio.play().catch((error) => {
    console.warn(
      "Não foi possível reproduzir o som da notificação:",
      error
    );
  });
};

const solicitarPermissaoNotificacoes = async () => {
  if (!("Notification" in window)) {
    alert(
      "Este navegador não oferece suporte a notificações."
    );
    return;
  }

  const permissao =
    await Notification.requestPermission();

  if (permissao === "granted") {
    localStorage.setItem(
      "som-renovo-permissao-notificacoes",
      "true"
    );

    console.log("🔔 Notificações permitidas.");
  }
};

  // =====================================================
  // CONTROLE DAS NOTIFICAÇÕES JÁ CONHECIDAS
  // =====================================================

  const notificacoesConhecidas =
    useRef(new Set());

  const primeiraBusca =
    useRef(true);


  // =====================================================
  // BUSCAR NOTIFICAÇÕES
  // =====================================================

  const buscarNotificacoes = async () => {

    // Se notificações estiverem desativadas,
    // não fazemos nenhuma consulta ao backend.

    if (!notificacoesAtivas) {

      setNotificacoes([]);

      setNotificacaoToast(null);

      setCarregandoNotificacoes(false);

      return;
    }


    try {

      setCarregandoNotificacoes(true);

      const resposta =
        await fetch(
          `${API_URL}/notificacoes`,
          {
            credentials: "include",
          }
        );


      if (!resposta.ok) {

        throw new Error(
          "Erro ao buscar notificações."
        );

      }


      const dados =
        await resposta.json();


      if (!dados.sucesso) {

        setNotificacoes([]);

        return;

      }


      const novasNotificacoes =
        dados.notificacoes || [];


      // =================================================
      // PRIMEIRA BUSCA
      // =================================================

      if (primeiraBusca.current) {

        novasNotificacoes.forEach(
          (notificacao) => {

            notificacoesConhecidas.current.add(
              notificacao.id
            );

          }
        );

        primeiraBusca.current = false;

      } else {


        // ===============================================
        // BUSCAR NOTIFICAÇÕES REALMENTE NOVAS
        // ===============================================

        const novas =
          novasNotificacoes.filter(
            (notificacao) =>
              !notificacoesConhecidas.current.has(
                notificacao.id
              )
          );


  
        // ===============================================
        // NOTIFICAÇÃO NATIVA + MOSTRAR TOAST
        // ===============================================

        if (novas.length > 0) {

  const novaNotificacao = novas[0];

  setNotificacaoToast(
    novaNotificacao
  );

  tocarSomNotificacao();

  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {

    const registro =
      await navigator.serviceWorker.ready;

    await registro.showNotification(
      novaNotificacao.titulo ||
        "Som Renovo Manager",
      {
        body:
          novaNotificacao.mensagem ||
          "Você recebeu uma nova notificação.",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: {
          url: "/",
        },
        vibrate: [200, 100, 200],
      }
    );

  }

}





        // ===============================================
        // ATUALIZAR REGISTRO
        // ===============================================

        novasNotificacoes.forEach(
          (notificacao) => {

            notificacoesConhecidas.current.add(
              notificacao.id
            );

          }
        );

      }


      // =================================================
      // ATUALIZAR LISTA
      // =================================================

      setNotificacoes(
        novasNotificacoes
      );


    } catch (error) {

      console.error(
        "Erro ao carregar notificações:",
        error
      );

    } finally {

      setCarregandoNotificacoes(false);

    }

  };


  // =====================================================
  // OUVIR ALTERAÇÃO DA CONFIGURAÇÃO
  // =====================================================

  useEffect(() => {

    const atualizarPreferencia =
      () => {

        const valor =
          localStorage.getItem(
            "som-renovo-notificacoes"
          );

        const ativas =
          valor !== "false";

        setNotificacoesAtivas(ativas);

        if (!ativas) {

          setNotificacoes([]);

          setNotificacaoToast(null);

          setShowNotifications(false);

        }

      };


    window.addEventListener(
      "som-renovo-notificacoes-alteradas",
      atualizarPreferencia
    );


    return () => {

      window.removeEventListener(
        "som-renovo-notificacoes-alteradas",
        atualizarPreferencia
      );

    };

  }, []);

  // =====================================================
  // PRIMEIRA BUSCA
  // =====================================================

  useEffect(() => {

    buscarNotificacoes();

  }, [notificacoesAtivas]);


  // =====================================================
  // ATUALIZAÇÃO AUTOMÁTICA
  // =====================================================

  useEffect(() => {

    if (!notificacoesAtivas) {
      return;
    }


    const intervalo =
      setInterval(
        buscarNotificacoes,
        60 * 1000
      );


    return () => {

      clearInterval(
        intervalo
      );

    };

  }, [notificacoesAtivas]);


  // =====================================================
  // FECHAR TOAST AUTOMATICAMENTE
  // =====================================================

  useEffect(() => {

    if (!notificacaoToast) {
      return;
    }


    const timer =
      setTimeout(() => {

        setNotificacaoToast(null);

      }, 5000);


    return () => {

      clearTimeout(timer);

    };

  }, [notificacaoToast]);


  // =====================================================
  // EXISTEM NOTIFICAÇÕES?
  // =====================================================

  const temNotificacoes =
    notificacoesAtivas &&
    notificacoes.length > 0;


  // =====================================================
  // ABRIR / FECHAR PAINEL
  // =====================================================

  const abrirNotificacoes = () => {

    if (!notificacoesAtivas) {
      return;
    }

    setShowNotifications(
      (estado) => !estado
    );

  };


  // =====================================================
  // FECHAR TOAST
  // =====================================================

  const fecharToast = () => {

    setNotificacaoToast(null);

  };


  return (

    <header className="header">

      {/* ================================================
          ONDAS
      ================================================= */}

      <div className="header-waves">

        <div className="wave wave-1"></div>

        <div className="wave wave-2"></div>

        <div className="wave wave-3"></div>

      </div>


      {/* ================================================
          CONTEÚDO
      ================================================= */}

      <div className="header-content">


        {/* ==============================================
            LADO ESQUERDO
        =============================================== */}

        <div className="header-left">

          <p className="header-brand">

            Som Renovo{" "}

            <span>
              Manager
            </span>

          </p>

        </div>


        {/* ==============================================
            LADO DIREITO
        =============================================== */}

        <div className="header-right">


          {/* ============================================
              NOTIFICAÇÕES
          ============================================= */}

          <button
            className={`header-icon notification ${
              showNotifications
                ? "notification-active"
                : ""
            } ${
              !notificacoesAtivas
                ? "notifications-disabled"
                : ""
            }`}
            type="button"
            aria-label={
              notificacoesAtivas
                ? "Notificações"
                : "Notificações desativadas"
            }
            onClick={abrirNotificacoes}
          >

            <MdNotifications />


            {temNotificacoes && (

              <span className="notification-dot"></span>

            )}

          </button>


          {/* ============================================
              DIVISOR
          ============================================= */}

          <div className="divider"></div>


          {/* ============================================
              TEMA
          ============================================= */}

        
        </div>

      </div>


      {/* =================================================
          TOAST DE NOVA NOTIFICAÇÃO
      ================================================= */}

      {notificacaoToast && notificacoesAtivas && (

        <div
          className="notification-toast"
          onClick={() => {

            abrirNotificacoes();
            fecharToast();

          }}
        >

          <div className="notification-toast-icon">

            {notificacaoToast.icone}

          </div>


          <div className="notification-toast-content">

            <strong>

              {notificacaoToast.titulo}

            </strong>


            <span>

              {notificacaoToast.mensagem}

            </span>

          </div>


          <button
            type="button"
            className="notification-toast-close"
            aria-label="Fechar notificação"
            onClick={(e) => {

              e.stopPropagation();

              fecharToast();

            }}
          >

            ×

          </button>

        </div>

      )}


      {/* =================================================
          PAINEL DE NOTIFICAÇÕES
      ================================================= */}

      {showNotifications && notificacoesAtivas && (

        <div className="notification-panel">


          {/* ============================================
              CABEÇALHO
          ============================================= */}

          <div className="notification-panel-header">

  <h3>
    Notificações
  </h3>

  <div className="notification-panel-header-actions">

    <span>
      {notificacoes.length}
    </span>

    {"Notification" in window &&
      Notification.permission !== "granted" && (

        <button
          type="button"
          className="notification-permission-button"
          onClick={solicitarPermissaoNotificacoes}
        >
          🔔 Permitir
        </button>

      )}

  </div>

</div>


          {/* ============================================
              LISTA
          ============================================= */}

          <div className="notification-list">


            {carregandoNotificacoes ? (

              <div className="notification-empty">

                <MdNotifications />

                <strong>
                  Carregando...
                </strong>

              </div>

            ) : notificacoes.length === 0 ? (

              <div className="notification-empty">

                <MdNotifications />

                <strong>
                  Nenhuma notificação
                </strong>

                <span>
                  Você está em dia por enquanto.
                </span>

              </div>

            ) : (

              notificacoes.map(
                (notificacao) => (

                  <div
                    className="notification-item"
                    key={notificacao.id}
                  >

                    <div className="notification-item-icon">

                      {notificacao.icone}

                    </div>


                    <div className="notification-item-content">

                      <strong>

                        {notificacao.titulo}

                      </strong>


                      <span>

                        {notificacao.mensagem}

                      </span>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      )}

    </header>

  );

};


export default Header;