/**
 * app.js — JUEGOS ForYou
 * Inicialización de la página de acceso (index.html).
 * - Redirige al menú si ya hay sesión activa.
 * - Genera partículas decorativas.
 */

document.addEventListener('DOMContentLoaded', function () {

  // Si ya hay sesión, ir directo al menú
  if (Storage.estaAutenticado()) {
    window.location.href = 'menu.html';
    return;
  }

  generarParticulas();
});

/* ─── Partículas decorativas ─────────────────────────────────────────── */

function generarParticulas() {
  const container = document.getElementById('particles');
  if (!container) return;

  const TOTAL = 22;
  const EMOJIS = ['🎮', '🕹️', '⭐', '🏆', '🎯', '👾', '🐍', '🃏', '❌', '⭕', '🏎️', '🏓'];

  for (let i = 0; i < TOTAL; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    el.style.cssText = `
      position: fixed;
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      font-size: ${10 + Math.random() * 18}px;
      opacity: ${0.04 + Math.random() * 0.10};
      pointer-events: none;
      user-select: none;
      animation: floatParticle ${8 + Math.random() * 12}s ease-in-out infinite;
      animation-delay: ${-Math.random() * 10}s;
    `;
    container.appendChild(el);
  }

  // Inyectar keyframe si no existe
  if (!document.getElementById('particleStyle')) {
    const style = document.createElement('style');
    style.id = 'particleStyle';
    style.textContent = `
      @keyframes floatParticle {
        0%   { transform: translateY(0px) rotate(0deg); }
        33%  { transform: translateY(-18px) rotate(8deg); }
        66%  { transform: translateY(10px) rotate(-6deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);
  }
}
