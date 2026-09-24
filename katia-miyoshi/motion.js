/* ===========================================================================
   motion.js — camada 2 do movimento: só CSS/SVG, zero vídeo.
   Sóbrio de propósito: é clínica, e o dono limitou a animação ("não muito,
   para não confundir nem dispersar a atenção").
   Tudo aqui degrada para PARADO sob prefers-reduced-motion.
   =========================================================================== */
(function () {
  'use strict';
  var pouco = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- estrelas da nota: 5 de 5, desenhadas, sem emoji (emoji é proibido) ---- */
  var estrelas = document.querySelector('.estrelas');
  if (estrelas) {
    var d = 'M8 1.2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.9 3.8 14.2l.8-4.7L1.2 6.2l4.7-.7z';
    estrelas.innerHTML = new Array(5).join('|').split('|').map(function () {
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + d + '"/></svg>';
    }).join('');
    estrelas.setAttribute('role', 'img');
    estrelas.setAttribute('aria-label', 'nota 5 de 5');
  }

  /* ---- revelação por rolagem ----
     O atraso de cada elemento vem do --d escrito no HTML, na escala medida do
     acervo (Tempos-do-Criativo §4.1): 100 ms dentro de uma mesma frase,
     833 ms entre blocos independentes. Aqui só se liga a classe. */
  var alvos = document.querySelectorAll('.re, .traco, .secao, .quique');
  if (pouco || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(alvos, function (n) { n.classList.add('vis'); });
    contarTudo(true);
  } else {
    var obs = new IntersectionObserver(function (ent) {
      ent.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vis');
        obs.unobserve(e.target);
        if (e.target.hasAttribute('data-conta')) contar(e.target);
        Array.prototype.forEach.call(e.target.querySelectorAll('[data-conta]'), contar);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    Array.prototype.forEach.call(alvos, function (n) { obs.observe(n); });
    // o herói está na dobra: entra já (regra dos 3 s — "tudo tem que começar já")
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.hero .re, .hero .traco'), function (n) {
        n.classList.add('vis');
      });
      Array.prototype.forEach.call(document.querySelectorAll('.hero [data-conta]'), contar);
    });
  }

  /* ---- contadores. Só sobem até o número REAL escrito no HTML.
         Nenhum número nasce aqui. ---- */
  function contar(el) {
    if (!el || el.__contado) return; el.__contado = true;
    var alvo = el.getAttribute('data-conta');
    if (alvo == null) return;
    var dec = alvo.indexOf(',') > -1;
    var fim = parseFloat(alvo.replace(',', '.'));
    if (isNaN(fim)) return;
    if (pouco) { el.textContent = alvo; return; }
    var ini = performance.now(), dur = 1100, atraso = parseFloat(el.style.getPropertyValue('--d')) || 0;
    function passo(t) {
      var x = (t - ini - atraso) / dur;
      if (x < 0) { requestAnimationFrame(passo); return; }
      if (x > 1) x = 1;
      var e = 1 - Math.pow(1 - x, 3);              // saída suave, sem quique no número
      var v = fim * e;
      el.textContent = dec ? v.toFixed(1).replace('.', ',') : Math.round(v).toString();
      if (x < 1) requestAnimationFrame(passo); else el.textContent = alvo;
    }
    requestAnimationFrame(passo);
  }
  function contarTudo(direto) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-conta]'), function (el) {
      if (direto) { el.textContent = el.getAttribute('data-conta'); el.__contado = true; }
      else contar(el);
    });
  }

  /* ---- tema claro/escuro ---- */
  var bt = document.getElementById('tema');
  function lerTema() { try { return localStorage.getItem('km-tema'); } catch (e) { return null; } }
  function porTema(t) {
    if (t) document.documentElement.setAttribute('data-tema', t);
    else document.documentElement.removeAttribute('data-tema');
    var escuro = t === 'escuro' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (bt) { bt.textContent = escuro ? 'Tema claro' : 'Tema escuro'; bt.setAttribute('aria-pressed', String(escuro)); }
  }
  porTema(lerTema());
  if (bt) bt.addEventListener('click', function () {
    var escuro = bt.getAttribute('aria-pressed') === 'true';
    var novo = escuro ? 'claro' : 'escuro';
    try { localStorage.setItem('km-tema', novo); } catch (e) {}
    porTema(novo);
  });

  /* ---- galeria das FOTOS REAIS ----
     Lê midia/galeria/galeria.json. Lista vazia = fica o espaço marcado.
     Cada foto declara w/h para a grade não pular quando as imagens chegarem. */
  var grade = document.getElementById('galeria'), vazio = document.getElementById('galeria-vazia');
  if (grade && window.fetch) {
    fetch('midia/galeria/galeria.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var fotos = (j && j.fotos) || [];
        if (!fotos.length) return;
        grade.innerHTML = fotos.map(function (f) {
          var alt = (f.alt || 'Foto do consultório').replace(/"/g, '&quot;');
          return '<li><img src="midia/galeria/' + encodeURIComponent(f.arq) + '" alt="' + alt +
                 '" width="' + (f.w || 1200) + '" height="' + (f.h || 900) + '" loading="lazy" decoding="async"></li>';
        }).join('');
        grade.classList.remove('galeria--vazia');
        if (vazio) vazio.style.display = 'none';
      })
      .catch(function () { /* sem galeria: o espaço marcado continua na tela */ });
  }

  /* =========================================================================
     A CADEIA DE VÍDEO COMO ENTRADA DO SITE — uma página só.

     A travessia é desenhada para NÃO ter corte:
       1. o motor rola as 3 cenas (pista = 3,6 vh);
       2. no último quarto da cena 3 o #palco entra por baixo — ele é o
          ÚLTIMO QUADRO REAL da cena 3, com o mesmo object-fit do motor, então
          vídeo e imagem são o mesmo pixel e a troca é invisível;
       3. o vídeo sai; fica a imagem parada. A câmera desacelerou e parou —
          é a costura que o DIRECAO.md pediu;
       4. o .pouso sobe por cima com o véu em gradiente: a sala vira página.
          Isso é rolagem pura, sem listener, então não tem como dessincronizar;
       5. passada a travessia, o motor é desligado (display:none) e o aviso
          da trava some, porque não há mais imagem gerada na tela.
     ========================================================================= */
  var raiz = document.getElementById('abertura');
  var palco = document.getElementById('palco');
  var palcoImg = document.getElementById('palco-img');
  var aviso = document.getElementById('aviso');
  var topo = document.querySelector('.topo');
  var REPOUSO = 'midia/repouso.jpg';

  if (topo) topo.classList.add('oculto');   // a marca não fica no canto desde o 1º quadro

  function montarCadeia(cfg) {
    var wa = document.querySelector('a[href*="wa.me"]');
    var secoes = cfg.sections.map(function (x) {
      var o = { id: x.id, label: x.label, still: x.still, eyebrow: x.eyebrow,
                title: x.title, body: x.body, accent: '#8A5638' };
      if (x.clip) o.clip = x.clip;
      if (x.clipMobile) o.clipMobile = x.clipMobile;
      return o;
    });
    window.mountScrollWorld(raiz, {
      sections: secoes,
      connectors: (cfg.connectors || []).filter(Boolean),
      // TRAVA: crossfade 0 faz o motor dividir por zero (fade = crossfade*vh)
      // e zerar a opacidade de TODAS as cenas. 0,01 é o corte seco equivalente.
      crossfade: Math.max(0.01, (cfg.crossfade != null ? cfg.crossfade : 0.12)),
      diveScroll: 1.2, connScroll: 0.9,
      nav: false,          // o cabeçalho do site é o único
      atmosphere: false,   // partículas sobre imagem real = ruído; é clínica
      hint: 'role para entrar'
    });
    if (wa) { /* o CTA mora no pouso, não na cadeia */ }
    ligarTravessia();
  }

  function ligarTravessia() {
    var swRoot = raiz.querySelector('.sw-root') || raiz;
    var pedido = false, carregouPalco = false;

    function passo() {
      pedido = false;
      var vh = window.innerHeight;
      var y = window.scrollY || window.pageYOffset;
      var fimCadeia = raiz.offsetHeight || (3.6 * vh);

      // o palco entra no último quarto da cadeia, por baixo do vídeo
      var p = (y - (fimCadeia - 0.55 * vh)) / (0.5 * vh);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      if (p > 0 && !carregouPalco) {         // só baixa a imagem quando ela vai servir
        carregouPalco = true;
        palcoImg.src = REPOUSO;
        palco.classList.add('on');
      }
      palco.style.opacity = pouco ? String(p > 0 ? 1 : 0) : String(p);

      // passada a travessia o motor não tem mais nada a fazer na tela
      var fora = y > fimCadeia + 0.35 * vh;
      swRoot.classList.toggle('fim', fora);
      if (fora && carregouPalco === false) { carregouPalco = true; palcoImg.src = REPOUSO; palco.classList.add('on'); }

      // o palco só precisa existir enquanto o véu do pouso não fechou
      var pouso = document.getElementById('pouso');
      var fimPouso = pouso ? pouso.offsetTop + pouso.offsetHeight * 0.78 : fimCadeia + 1.5 * vh;
      if (y > fimPouso) { palco.classList.remove('on'); } else if (carregouPalco) { palco.classList.add('on'); }

      // a marca entra quando o nome pousa
      if (topo) topo.classList.toggle('oculto', y < fimCadeia - 0.25 * vh);

      // o aviso da trava vale enquanto houver imagem gerada na tela
      if (aviso) aviso.classList.toggle('off', y > fimPouso);
    }

    function agenda() { if (!pedido) { pedido = true; requestAnimationFrame(passo); } }
    window.addEventListener('scroll', agenda, { passive: true });
    window.addEventListener('resize', agenda);
    window.addEventListener('load', agenda);
    passo();
  }

  if (raiz && window.fetch) {
    fetch('cadeia.json?v=7', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        if (c && window.mountScrollWorld) montarCadeia(c);
        else semCadeia();
      })
      .catch(semCadeia);
  } else { semCadeia(); }

  // se a cadeia não carregar, o site continua: o pouso vira o topo da página
  function semCadeia() {
    if (raiz) raiz.style.display = 'none';
    if (aviso) aviso.classList.add('off');
    if (topo) topo.classList.remove('oculto');
    var pouso = document.getElementById('pouso');
    if (pouso) { pouso.style.minHeight = '0'; pouso.classList.add('sem-cadeia'); }
  }
})();
