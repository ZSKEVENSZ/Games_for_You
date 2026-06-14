/**
 * storage.js — JUEGOS ForYou
 * Maneja toda la persistencia de datos: usuarios, sesión y puntuaciones.
 */

const Storage = (() => {

  const KEYS = {
    USUARIOS:  'foryou_usuarios',
    SESION:    'foryou_sesion',
    SCORES:    'foryou_scores',
  };

  /* ─── Utilidades internas ─────────────────────────────────────────── */

  function _getAll(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }

  function _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ─── Usuarios ────────────────────────────────────────────────────── */

  function getUsuarios() { return _getAll(KEYS.USUARIOS); }

  function existeUsuario(usuario) {
    return !!getUsuarios()[usuario.toLowerCase()];
  }

  function registrarUsuario(usuario, password) {
    const usuarios = getUsuarios();
    const key = usuario.toLowerCase();
    if (usuarios[key]) return { ok: false, msg: 'El usuario ya existe.' };
    usuarios[key] = {
      nombre: usuario,
      password,               // En producción real se hashearía
      creadoEn: Date.now(),
      partidas: 0,
      monedas: 0,
      nivel: 1,
      xp: 0,
    };
    _save(KEYS.USUARIOS, usuarios);
    return { ok: true };
  }

  function verificarUsuario(usuario, password) {
    const u = getUsuarios()[usuario.toLowerCase()];
    if (!u) return { ok: false, msg: 'Usuario no encontrado.' };
    if (u.password !== password) return { ok: false, msg: 'Contraseña incorrecta.' };
    return { ok: true, usuario: u };
  }

  function getUsuario(nombre) {
    return getUsuarios()[nombre.toLowerCase()] || null;
  }

  function actualizarUsuario(nombre, cambios) {
    const usuarios = getUsuarios();
    const key = nombre.toLowerCase();
    if (!usuarios[key]) return;
    Object.assign(usuarios[key], cambios);
    _save(KEYS.USUARIOS, usuarios);
  }

  /* ─── Sesión activa ───────────────────────────────────────────────── */

  function getSesion() {
    try { return JSON.parse(sessionStorage.getItem(KEYS.SESION)) || null; } catch { return null; }
  }

  function iniciarSesion(nombre) {
    sessionStorage.setItem(KEYS.SESION, JSON.stringify({ nombre, ts: Date.now() }));
  }

  function cerrarSesion() {
    sessionStorage.removeItem(KEYS.SESION);
  }

  function estaAutenticado() {
    return !!getSesion();
  }

  /* ─── Puntuaciones ────────────────────────────────────────────────── */

  function _getScoresGlobal() { return _getAll(KEYS.SCORES); }

  function getScoresUsuario(nombre) {
    const all = _getScoresGlobal();
    return all[nombre.toLowerCase()] || {};
  }

  function guardarPuntuacion(usuario, juego, puntos) {
    const all = _getScoresGlobal();
    const key = usuario.toLowerCase();
    if (!all[key]) all[key] = {};
    const prev = all[key][juego] || {};
    const mejor = Math.max(prev.mejor || 0, puntos);
    all[key][juego] = {
      mejor,
      ultima: puntos,
      fecha: Date.now(),
      partidas: (prev.partidas || 0) + 1,
    };
    _save(KEYS.SCORES, all);

    // Actualizar estadísticas del usuario
    const usuarios = getUsuarios();
    const u = usuarios[key];
    if (u) {
      u.partidas = (u.partidas || 0) + 1;
      u.monedas  = (u.monedas  || 0) + Math.floor(puntos / 10);
      u.xp       = (u.xp       || 0) + Math.floor(puntos / 5);
      u.nivel    = calcularNivel(u.xp);
      _save(KEYS.USUARIOS, usuarios);
    }

    return all[key][juego];
  }

  function getMejorPuntuacion(usuario, juego) {
    return (getScoresUsuario(usuario)[juego] || {}).mejor || 0;
  }

  function getTodosScores(usuario) {
    return getScoresUsuario(usuario);
  }

  /* ─── Nivel / XP ──────────────────────────────────────────────────── */

  function calcularNivel(xp) {
    // Nivel sube cada 500 XP
    return Math.floor(xp / 500) + 1;
  }

  function xpParaSiguienteNivel(xp) {
    const nivel = calcularNivel(xp);
    return nivel * 500 - xp;
  }

  /* ─── Exportar API ────────────────────────────────────────────────── */

  return {
    // Usuarios
    existeUsuario,
    registrarUsuario,
    verificarUsuario,
    getUsuario,
    actualizarUsuario,
    // Sesión
    getSesion,
    iniciarSesion,
    cerrarSesion,
    estaAutenticado,
    // Puntuaciones
    guardarPuntuacion,
    getMejorPuntuacion,
    getTodosScores,
    getScoresUsuario,
    // Utilidades
    calcularNivel,
    xpParaSiguienteNivel,
  };

})();
