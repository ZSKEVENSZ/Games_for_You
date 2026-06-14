/**
 * menu.js — JUEGOS ForYou
 * Lógica completa del menú principal.
 */

const JUEGOS_NOMBRES = {
  carrera:       '🏎️ Carreras de Autos',
  spaceinvaders: '👾 Space Invaders',
  snake:         '🐍 La Serpiente',
  pingpong:      '🏓 Ping Pong',
  memorama:      '🃏 Memorama',
  buscaminas:    '💣 Buscaminas',
  rompecabezas:  '🧩 Rompecabezas',
  sopa:          '🔤 Sopa de Letras',
  tresenraya:    '❌ Tres en Raya',
};

let _usuario = null; // Objeto usuario activo

/* ─── Init ───────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

  // Guard: si no hay sesión, redirigir al login
  const sesion = Storage.getSesion();
  if (!sesion) {
    window.location.href = 'index.html';
    return;
  }

  _usuario = Storage.getUsuario(sesion.nombre);
  if (!_usuario) {
    Storage.cerrarSesion();
    window.location.href = 'index.html';
    return;
  }

  renderizarPerfil();
  renderizarStats();
  renderizarMejoresPuntuaciones();
  renderizarScoresCards();
});

/* ─── Perfil de usuario ──────────────────────────────────────────────── */

function renderizarPerfil() {
  const nombre = _usuario.nombre;
  const nivel  = Storage.calcularNivel(_usuario.xp || 0);

  const avatarEl = document.getElementById('userAvatar');
  const nameEl   = document.getElementById('headerUserName');
  const levelEl  = document.getElementById('headerUserLevel');

  if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();
  if (nameEl)  nameEl.textContent  = nombre;
  if (levelEl) levelEl.textContent = 'Nivel ' + nivel;
}

/* ─── Barra de estadísticas ──────────────────────────────────────────── */

function renderizarStats() {
  const scores  = Storage.getTodosScores(_usuario.nombre);
  const nivel   = Storage.calcularNivel(_usuario.xp || 0);

  // Suma de mejores puntuaciones
  let totalPuntos = 0;
  Object.values(scores).forEach(s => totalPuntos += (s.mejor || 0));

  // Total de partidas
  let totalPartidas = _usuario.partidas || 0;

  const elPuntos   = document.getElementById('statPuntuacion');
  const elPartidas = document.getElementById('statPartidas');
  const elNivel    = document.getElementById('statNivel');
  const elMonedas  = document.getElementById('statMonedas');

  if (elPuntos)   elPuntos.textContent   = totalPuntos.toLocaleString();
  if (elPartidas) elPartidas.textContent = totalPartidas;
  if (elNivel)    elNivel.textContent    = nivel;
  if (elMonedas)  elMonedas.textContent  = (_usuario.monedas || 0).toLocaleString();
}

/* ─── Puntuaciones en las tarjetas de juego ──────────────────────────── */

function renderizarScoresCards() {
  const scores = Storage.getTodosScores(_usuario.nombre);
  Object.keys(JUEGOS_NOMBRES).forEach(id => {
    const el = document.getElementById('score-' + id);
    if (!el) return;
    const mejor = (scores[id] || {}).mejor || 0;
    el.textContent = 'Mejor: ' + (mejor > 0 ? mejor.toLocaleString() : '—');
  });
}

/* ─── Tabla de mejores puntuaciones ──────────────────────────────────── */

function renderizarMejoresPuntuaciones() {
  const tbody  = document.getElementById('scoresBody');
  if (!tbody) return;

  const scores = Storage.getTodosScores(_usuario.nombre);
  const entradas = Object.entries(scores)
    .filter(([, v]) => v.mejor > 0)
    .sort(([, a], [, b]) => b.mejor - a.mejor);

  if (!entradas.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="no-scores">Aún no hay puntuaciones guardadas</td></tr>';
    return;
  }

  tbody.innerHTML = entradas.map(([juego, data]) => {
    const nombre = JUEGOS_NOMBRES[juego] || juego;
    const fecha  = data.fecha ? new Date(data.fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'short' }) : '—';
    return `<tr>
      <td>${nombre}</td>
      <td style="color:#ffd700;font-weight:bold">${data.mejor.toLocaleString()}</td>
      <td style="color:#888">${fecha}</td>
    </tr>`;
  }).join('');
}

/* ─── Limpiar puntuaciones ───────────────────────────────────────────── */

function limpiarPuntuaciones() {
  if (!confirm('¿Resetear todas tus puntuaciones? Esta acción no se puede deshacer.')) return;

  // Limpiar en Storage global
  const all = JSON.parse(localStorage.getItem('foryou_scores') || '{}');
  const key = _usuario.nombre.toLowerCase();
  delete all[key];
  localStorage.setItem('foryou_scores', JSON.stringify(all));

  // Resetear también los localStorage individuales de cada juego (legacy)
  ['carrera','snake','spaceinvaders','pingpong','memorama','buscaminas','rompecabezas','sopa','tresenraya'].forEach(j => {
    localStorage.removeItem('score_' + j);
  });

  // Resetear monedas/partidas del usuario
  Storage.actualizarUsuario(_usuario.nombre, { partidas: 0, monedas: 0, xp: 0, nivel: 1 });
  _usuario = Storage.getUsuario(_usuario.nombre);

  renderizarStats();
  renderizarMejoresPuntuaciones();
  renderizarScoresCards();
  showToast('Puntuaciones reseteadas 🗑️');
}

function imprimirPuntuaciones() {
  const tabla = document.getElementById('scoresTable');
  const usuario = _usuario ? _usuario.nombre : 'Jugador';
  let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Puntuaciones de ${usuario}</title>`;
  html += `<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:20px;color:#111}h1{font-size:24px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border:1px solid #ccc;text-align:left}th{background:#f6f6f6}caption{margin-bottom:12px;font-weight:700;text-align:left}</style>`;
  html += `</head><body><h1>Puntuaciones de ${usuario}</h1>`;
  html += `<p>Fecha de impresión: ${new Date().toLocaleString('es-MX')}</p>`;
  html += tabla ? tabla.outerHTML : '<p>No hay tabla disponible.</p>';
  html += '</body></html>';

  const win = window.open('', '_blank');
  if (!win) {
    alert('No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes e inténtalo de nuevo.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

/* ─── Abrir juego ────────────────────────────────────────────────────── */

function abrirJuego(id) {
  // Animación de click en la card
  const card = document.getElementById('card-' + id);
  if (card) {
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.style.transform = '', 200);
  }
  setTimeout(() => {
    window.location.href = 'jugar.html?juego=' + id;
  }, 200);
}

/* ─── Callback desde iframes de juego ───────────────────────────────── */

window.guardarPuntuacion = function (juego, puntos) {
  if (!_usuario) return;
  Storage.guardarPuntuacion(_usuario.nombre, juego, puntos);
  // Actualizar referencia local
  _usuario = Storage.getUsuario(_usuario.nombre);
  renderizarStats();
  renderizarMejoresPuntuaciones();
  renderizarScoresCards();
};

/* ─── Toast ──────────────────────────────────────────────────────────── */

function showToast(msg, tipo) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (tipo || '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
