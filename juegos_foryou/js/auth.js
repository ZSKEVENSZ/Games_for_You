/**
 * auth.js — JUEGOS ForYou
 * Lógica de autenticación: registro, inicio de sesión, validaciones.
 */

/* ─── Validaciones ────────────────────────────────────────────────────── */

function validarUsuario(nombre) {
  if (!nombre || nombre.length < 3) return 'Mínimo 3 caracteres.';
  if (nombre.length > 30) return 'Máximo 30 caracteres.';
  if (/\s/.test(nombre)) return 'No se permiten espacios.';
  if (!/^[a-zA-Z0-9_.-]+$/.test(nombre)) return 'Solo letras, números, _ . -';
  return null;
}

function validarPassword(pass) {
  if (!pass || pass.length < 4) return 'Mínimo 4 caracteres.';
  return null;
}

function calcularFortaleza(pass) {
  if (!pass) return { nivel: 0, label: '', color: '' };
  let puntos = 0;
  if (pass.length >= 6) puntos++;
  if (pass.length >= 10) puntos++;
  if (/[A-Z]/.test(pass)) puntos++;
  if (/[0-9]/.test(pass)) puntos++;
  if (/[^a-zA-Z0-9]/.test(pass)) puntos++;
  if (puntos <= 1) return { nivel: 1, label: 'Débil',   color: '#ef4444', pct: 25  };
  if (puntos <= 2) return { nivel: 2, label: 'Regular', color: '#f97316', pct: 50  };
  if (puntos <= 3) return { nivel: 3, label: 'Buena',   color: '#eab308', pct: 75  };
  return               { nivel: 4, label: 'Fuerte',  color: '#22c55e', pct: 100 };
}

/* ─── Helpers UI ─────────────────────────────────────────────────────── */

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg || ''; }
}

function setAlert(id, msg, tipo) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-alert ' + (tipo || 'error');
  el.classList.remove('hidden');
}

function clearAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.className = 'form-alert hidden'; el.textContent = ''; }
}

function showToast(msg, tipo) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (tipo || '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.textContent = isPass ? '🙈' : '👁️';
}

function switchTab(tab) {
  const loginForm  = document.getElementById('formLogin');
  const regForm    = document.getElementById('formRegistro');
  const loginTab   = document.getElementById('tabLoginBtn');
  const regTab     = document.getElementById('tabRegistroBtn');
  if (!loginForm || !regForm) return;

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    clearAlert('loginAlert');
  } else {
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    clearAlert('registroAlert');
  }
}

/* ─── Medidor de contraseña ──────────────────────────────────────────── */

const regPassInput = document.getElementById('regPass');
if (regPassInput) {
  regPassInput.addEventListener('input', function () {
    const f = calcularFortaleza(this.value);
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (fill)  { fill.style.width = (f.pct || 0) + '%'; fill.style.background = f.color || '#333'; }
    if (label) { label.textContent = f.label || ''; label.style.color = f.color || '#aaa'; }
  });
}

/* ─── Iniciar Sesión ─────────────────────────────────────────────────── */

function iniciarSesion() {
  const usuario  = (document.getElementById('loginUsuario')?.value || '').trim();
  const password = (document.getElementById('loginPass')?.value || '');
  clearAlert('loginAlert');
  setError('loginUsuarioError', '');
  setError('loginPassError', '');

  let ok = true;
  const errU = validarUsuario(usuario);
  if (errU) { setError('loginUsuarioError', errU); ok = false; }
  if (!password) { setError('loginPassError', 'Escribe tu contraseña.'); ok = false; }
  if (!ok) return;

  const res = Storage.verificarUsuario(usuario, password);
  if (!res.ok) {
    setAlert('loginAlert', res.msg, 'error');
    return;
  }

  Storage.iniciarSesion(usuario);
  showToast('¡Bienvenido, ' + usuario + '! 🎮', 'success');
  setTimeout(() => window.location.href = 'menu.html', 700);
}

/* ─── Registrar Usuario ──────────────────────────────────────────────── */

function registrarUsuario() {
  const usuario   = (document.getElementById('regUsuario')?.value || '').trim();
  const pass      = (document.getElementById('regPass')?.value || '');
  const passConf  = (document.getElementById('regPassConfirm')?.value || '');
  clearAlert('registroAlert');
  setError('regUsuarioError', '');
  setError('regPassError', '');
  setError('regPassConfirmError', '');

  let ok = true;
  const errU = validarUsuario(usuario);
  if (errU) { setError('regUsuarioError', errU); ok = false; }
  const errP = validarPassword(pass);
  if (errP) { setError('regPassError', errP); ok = false; }
  if (pass && pass !== passConf) { setError('regPassConfirmError', 'Las contraseñas no coinciden.'); ok = false; }
  if (!ok) return;

  const res = Storage.registrarUsuario(usuario, pass);
  if (!res.ok) {
    setAlert('registroAlert', res.msg, 'error');
    return;
  }

  showToast('¡Cuenta creada! Iniciando sesión... ✨', 'success');
  Storage.iniciarSesion(usuario);
  setTimeout(() => window.location.href = 'menu.html', 800);
}

/* ─── Cerrar Sesión ──────────────────────────────────────────────────── */

function cerrarSesion() {
  Storage.cerrarSesion();
  window.location.href = 'index.html';
}

/* ─── Enter en inputs ────────────────────────────────────────────────── */

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  const activeForm = document.getElementById('formLogin');
  if (activeForm && !activeForm.classList.contains('hidden')) {
    iniciarSesion();
  } else {
    registrarUsuario();
  }
});
