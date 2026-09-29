/* ===========================================================================
   prévia — validade real, telemetria e montagem do mundo.
   O mundo só é montado se a prévia estiver dentro do prazo: a validade é de
   verdade, é ela que sustenta o prazo que o vendedor promete no WhatsApp.
   =========================================================================== */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var dados = null;          // previa.json (fonte da verdade do prazo)
  var mundo = lerJSON('previa-mundo');
  var inline = lerJSON('previa-dados') || {};

  function lerJSON(id) {
    var n = document.getElementById(id);
    if (!n) return null;
    try { return JSON.parse(n.textContent); } catch (e) { return null; }
  }

  /* ---------------- telemetria ----------------
     GANCHO, não backend. Só dispara se previa.json trouxer
     telemetria.endpoint preenchido. Vazio = desligada, zero requisição.
     Para ligar: aponte o endpoint para qualquer coisa que aceite POST de JSON
     (Edge Function do Supabase, webhook do n8n, Cloudflare Worker). Corpo:
     { evento, codigo, negocio, ts, ref, ua, largura } */
  var alvo = '';
  function sinal(evento, extra) {
    try {
      if (!alvo) return false;
      var corpo = {
        evento: evento,
        codigo: (dados && dados.codigo) || inline.codigo || '',
        negocio: (dados && dados.negocio) || inline.negocio || '',
        ts: new Date().toISOString(),
        ref: document.referrer || '',
        ua: navigator.userAgent,
        largura: window.innerWidth
      };
      if (extra) for (var k in extra) corpo[k] = extra[k];
      var pacote = new Blob([JSON.stringify(corpo)], { type: 'application/json' });
      if (navigator.sendBeacon) return navigator.sendBeacon(alvo, pacote);
      fetch(alvo, { method: 'POST', body: pacote, keepalive: true, mode: 'no-cors' });
      return true;
    } catch (e) { return false; }
  }
  window.previaSinal = sinal;   // gancho exposto para quem quiser instrumentar mais

  function amarrarCliques() {
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('[data-evento]');
      if (a) sinal(a.getAttribute('data-evento'), { destino: a.getAttribute('href') || '' });
    }, true);
  }

  /* ---------------- prazo ---------------- */
  function expirou(iso) {
    if (!iso) return false;
    var t = Date.parse(iso);
    if (isNaN(t)) return false;
    return Date.now() > t;
  }

  function matar() {
    raiz.classList.add('pv-morta');
    sinal('previa_expirada');
  }

  function montar() {
    if (!mundo || typeof window.mountScrollWorld !== 'function') return;
    var host = document.getElementById('mundo');
    if (host) window.mountScrollWorld(host, mundo);
  }

  function seguir() {
    var iso = (dados && dados.expira_em) || inline.expira_em || '';
    if (expirou(iso)) { matar(); return; }
    montar();
    amarrarCliques();
    sinal('previa_aberta', { dias_restantes: Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86400000)) });
  }

  /* previa.json manda. Se ele não puder ser lido (aberta do disco, sem servidor),
     cai para a cópia embutida no HTML — e avisa no console. */
  fetch('previa.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (j) {
      dados = j;
      if (j && j.telemetria && j.telemetria.endpoint) alvo = j.telemetria.endpoint;
    })
    .catch(function (e) {
      console.warn('[prévia] previa.json não lido (' + e.message + '); usando a data embutida no HTML.');
    })
    .then(seguir);
})();
