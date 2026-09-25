import { FaGoogle } from "react-icons/fa";
import { useEffect, useState } from "react";
import API_URL from "../../config/api";

import "./Login.css";
import logo from "../../assets/logo.png";
import fundo from "../../assets/fundo.png";


const slides = [
  {
    id: "organizacao",
    eyebrow: "ORGANIZAÇÃO",
    title: "Tudo mais simples para a rotina da escola.",
    description:
      "Uma experiência pensada para deixar a gestão da Som Renovo mais organizada e prática.",
  },
  {
    id: "acompanhamento",
    eyebrow: "ACOMPANHAMENTO",
    title: "Tenha uma visão clara do dia a dia.",
    description:
      "Informações importantes apresentadas de forma simples, visual e fácil de acompanhar.",
  },
  {
    id: "gestao",
    eyebrow: "GESTÃO",
    title: "Uma nova forma de cuidar da escola.",
    description:
      "Centralize a rotina e tenha as ferramentas certas para acompanhar tudo em um só lugar.",
  },
];


const Login = () => {

  const [slideAtual, setSlideAtual] = useState(0);

  const [carregando, setCarregando] =
    useState(false);


  useEffect(() => {

    const intervalo = setInterval(() => {

      setSlideAtual((atual) =>
        (atual + 1) % slides.length
      );

    }, 6500);


    return () => {
      clearInterval(intervalo);
    };

  }, []);


  const handleGoogleLogin = () => {

    if (carregando) {
      return;
    }

    setCarregando(true);

    window.location.href =
      `${API_URL}/auth/google`;

  };


  const slide = slides[slideAtual];


  return (

    <main
      className="login-page"
      style={{
        backgroundImage:
          `url(${fundo})`
      }}
    >

      <div className="login-background-glow glow-one" />

      <div className="login-background-glow glow-two" />


      {/* =====================================================
          APRESENTAÇÃO
      ===================================================== */}

      <section className="login-showcase">

        <div className="showcase-content">

          {/* MARCA */}

          <div className="showcase-brand">

            <img
              src={logo}
              alt="Som Renovo"
            />

            <div>

              <span>
                SOM RENOVO
              </span>

              <strong>
                Manager
              </strong>

            </div>

          </div>


          {/* TEXTO */}

          <div
            className="showcase-copy"
            key={slide.id}
          >

            <span className="showcase-eyebrow">
              {slide.eyebrow}
            </span>

            <h1>
              {slide.title}
            </h1>

            <p>
              {slide.description}
            </p>

          </div>


          {/* =================================================
              VISUAL DO PRODUTO
          ================================================= */}

          <div
            className={`manager-preview preview-${slide.id}`}
            key={`preview-${slide.id}`}
          >

            <div className="preview-window">

              {/* BARRA SUPERIOR */}

              <div className="preview-window-top">

                <div className="window-dots">

                  <span />
                  <span />
                  <span />

                </div>

                <div className="window-line" />

                <div className="window-avatar" />

              </div>


              {/* ORGANIZAÇÃO */}

              {slide.id === "organizacao" && (

                <div className="visual-organization">

                  <div className="visual-sidebar">

                    <span className="sidebar-logo">
                      SR
                    </span>

                    <span className="sidebar-item active" />
                    <span className="sidebar-item" />
                    <span className="sidebar-item" />
                    <span className="sidebar-item" />

                  </div>


                  <div className="visual-main">

                    <div className="visual-header">

                      <span className="visual-title" />

                      <span className="visual-action" />

                    </div>


                    <div className="organization-grid">

                      <div className="organization-card large">

                        <span className="card-label" />

                        <div className="calendar">

                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />

                        </div>

                      </div>


                      <div className="organization-column">

                        <div className="organization-card">

                          <span className="card-icon" />

                          <span className="card-line long" />
                          <span className="card-line" />

                        </div>

                        <div className="organization-card">

                          <span className="card-icon second" />

                          <span className="card-line long" />
                          <span className="card-line" />

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              )}


              {/* ACOMPANHAMENTO */}

              {slide.id === "acompanhamento" && (

                <div className="visual-progress">

                  <div className="visual-sidebar">

                    <span className="sidebar-logo">
                      SR
                    </span>

                    <span className="sidebar-item" />
                    <span className="sidebar-item active" />
                    <span className="sidebar-item" />
                    <span className="sidebar-item" />

                  </div>


                  <div className="visual-main">

                    <div className="visual-header">

                      <span className="visual-title" />

                      <span className="visual-action" />

                    </div>


                    <div className="progress-layout">

                      <div className="progress-ring-area">

                        <div className="progress-ring">

                          <div>
                            <strong>
                              82
                            </strong>

                            <small>
                              %
                            </small>
                          </div>

                        </div>

                        <span className="progress-caption" />

                      </div>


                      <div className="progress-bars">

                        <div className="progress-row">

                          <span />

                          <div>
                            <i />
                            <b />
                          </div>

                        </div>

                        <div className="progress-row">

                          <span />

                          <div>
                            <i />
                            <b />
                          </div>

                        </div>

                        <div className="progress-row">

                          <span />

                          <div>
                            <i />
                            <b />
                          </div>

                        </div>

                        <div className="progress-row">

                          <span />

                          <div>
                            <i />
                            <b />
                          </div>

                        </div>

                      </div>

                    </div>


                    <div className="music-elements">

                      <span>♪</span>
                      <span>♫</span>
                      <span>♩</span>
                      <span>♪</span>

                    </div>

                  </div>

                </div>

              )}


              {/* GESTÃO */}

              {slide.id === "gestao" && (

                <div className="visual-dashboard">

                  <div className="visual-sidebar">

                    <span className="sidebar-logo">
                      SR
                    </span>

                    <span className="sidebar-item" />
                    <span className="sidebar-item" />
                    <span className="sidebar-item active" />
                    <span className="sidebar-item" />

                  </div>


                  <div className="visual-main">

                    <div className="visual-header">

                      <span className="visual-title" />

                      <span className="visual-action" />

                    </div>


                    <div className="dashboard-top">

                      <div className="metric-card">

                        <span />

                        <strong />

                        <small />

                      </div>

                      <div className="metric-card">

                        <span />

                        <strong />

                        <small />

                      </div>

                      <div className="metric-card">

                        <span />

                        <strong />

                        <small />

                      </div>

                    </div>


                    <div className="dashboard-bottom">

                      <div className="abstract-chart">

                        <span className="chart-title" />

                        <div className="chart-lines">

                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />

                        </div>

                      </div>


                      <div className="abstract-list">

                        <span className="list-title" />

                        <div />
                        <div />
                        <div />
                        <div />

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>


          {/* NAVEGAÇÃO */}

          <div className="showcase-navigation">

            <div className="showcase-dots">

              {slides.map((item, index) => (

                <button
                  key={item.id}
                  type="button"
                  className={
                    index === slideAtual
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSlideAtual(index)
                  }
                  aria-label={
                    `Mostrar ${item.eyebrow.toLowerCase()}`
                  }
                />

              ))}

            </div>

            <span>
              {String(slideAtual + 1).padStart(2, "0")}
              {" / "}
              {String(slides.length).padStart(2, "0")}
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          LOGIN
      ===================================================== */}

      <section className="login-panel">

        <div className="login-content">

          <div className="login-mobile-brand">

            <img
              src={logo}
              alt="Som Renovo"
            />

          </div>


          <div className="login-heading">

            <span>
              BEM-VINDO
            </span>

            <h2>
              Acesse o Manager
            </h2>

            <p>
              Entre com sua conta Google
              autorizada pela escola.
            </p>

          </div>


          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={carregando}
          >

            <FaGoogle />

            <span>
              {carregando
                ? "Redirecionando..."
                : "Continuar com Google"}
            </span>

          </button>


          <p className="login-security">
            🔒 Acesso seguro e exclusivo
            para a equipe Som Renovo.
          </p>


          <div className="login-footer">

            <span>
              Som Renovo
            </span>

            <span>
              •
            </span>

            <span>
              Manager
            </span>

          </div>

        </div>

      </section>

    </main>

  );

};


export default Login;