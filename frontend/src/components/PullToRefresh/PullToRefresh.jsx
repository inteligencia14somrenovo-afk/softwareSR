import { useEffect, useRef, useState } from "react";
import "./PullToRefresh.css";

const DISTANCIA_ATUALIZACAO = 75;
const DISTANCIA_MAXIMA = 100;

function encontrarAreaRolavel(elemento) {
  let atual = elemento instanceof Element ? elemento : null;

  while (atual && atual !== document.body && atual !== document.documentElement) {
    const estilo = window.getComputedStyle(atual);
    const permiteRolagem = /auto|scroll/.test(estilo.overflowY);

    if (
      permiteRolagem &&
      atual.scrollHeight > atual.clientHeight + 1
    ) {
      return atual;
    }

    atual = atual.parentElement;
  }

  return document.scrollingElement;
}

export default function PullToRefresh() {
  const [distancia, setDistancia] = useState(0);
  const inicio = useRef(null);
  const areaRolavel = useRef(null);
  const atualizando = useRef(false);

  useEffect(() => {
    let distanciaAtual = 0;

    const iniciar = (evento) => {
      if (window.innerWidth > 768 || atualizando.current) return;
      if (evento.touches.length !== 1) return;

      const alvo = evento.target;

      if (
        alvo instanceof Element &&
        alvo.closest(
          ".sidebar, .sidebar-overlay, .mobile-menu-button, " +
          "input, textarea, select, [contenteditable='true']"
        )
      ) {
        inicio.current = null;
        return;
      }

      const area = encontrarAreaRolavel(alvo);

      if (!area || area.scrollTop > 0) {
        inicio.current = null;
        return;
      }

      inicio.current = {
        x: evento.touches[0].clientX,
        y: evento.touches[0].clientY,
      };

      areaRolavel.current = area;
      distanciaAtual = 0;
    };

    const mover = (evento) => {
      if (!inicio.current || atualizando.current) return;
      if (evento.touches.length !== 1) return;

      const toque = evento.touches[0];
      const deltaY = toque.clientY - inicio.current.y;
      const deltaX = toque.clientX - inicio.current.x;
      const area = areaRolavel.current;

      if (
        deltaY <= 0 ||
        Math.abs(deltaX) > Math.abs(deltaY) ||
        !area ||
        area.scrollTop > 0
      ) {
        return;
      }

      if (deltaY > 5) {
        evento.preventDefault();

        distanciaAtual = Math.min(deltaY * 0.55, DISTANCIA_MAXIMA);
        setDistancia(distanciaAtual);
      }
    };

    const finalizar = () => {
      inicio.current = null;
      areaRolavel.current = null;

      if (distanciaAtual >= DISTANCIA_ATUALIZACAO * 0.55) {
        atualizando.current = true;
        setDistancia(DISTANCIA_ATUALIZACAO);

        window.location.reload();
        return;
      }

      distanciaAtual = 0;
      setDistancia(0);
    };

    const cancelar = () => {
      inicio.current = null;
      areaRolavel.current = null;
      distanciaAtual = 0;
      setDistancia(0);
    };

    document.addEventListener("touchstart", iniciar, { passive: true });
    document.addEventListener("touchmove", mover, { passive: false });
    document.addEventListener("touchend", finalizar, { passive: true });
    document.addEventListener("touchcancel", cancelar, { passive: true });

    return () => {
      document.removeEventListener("touchstart", iniciar);
      document.removeEventListener("touchmove", mover);
      document.removeEventListener("touchend", finalizar);
      document.removeEventListener("touchcancel", cancelar);
    };
  }, []);

  if (distancia === 0) return null;

  return (
    <div
      className="pull-refresh-indicator"
      style={{ transform: `translate(-50%, ${distancia}px)` }}
      role="status"
      aria-live="polite"
    >
      <span className="pull-refresh-spinner" />
      <span>
        {distancia >= DISTANCIA_ATUALIZACAO * 0.55
          ? "Atualizando..."
          : "Puxe para atualizar"}
      </span>
    </div>
  );
}