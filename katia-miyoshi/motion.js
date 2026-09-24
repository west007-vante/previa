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
  var grade = document.getElementById('galeria'), fonteGal = document.getElementById('galeria-fonte');
  if (grade && window.fetch) {
    fetch('midia/galeria/galeria.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var fotos = (j && j.fotos) || [];
        // sem fotos, some também a legenda de fonte — nada de frase órfã
        if (!fotos.length) { if (fonteGal) fonteGal.style.display = 'none'; return; }
        grade.innerHTML = fotos.map(function (f, i) {
          var alt = (f.alt || 'Foto da Dra. Katia Miyoshi').replace(/"/g, '&quot;');
          return '<li><button type="button" data-i="' + i + '" aria-label="Ampliar: ' + alt + '">' +
                 '<img src="midia/galeria/' + encodeURIComponent(f.arq) + '?v=1" alt="' + alt +
                 '" width="' + (f.w || 1200) + '" height="' + (f.h || 900) + '" loading="lazy" decoding="async"></button></li>';
        }).join('');
        ligarLupa(fotos);
        grade.classList.remove('galeria--vazia');
      })
      .catch(function () { if (fonteGal) fonteGal.style.display = 'none'; });
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

    var corpoPuxado = 0;
    function passo() {
      pedido = false;
      var vh = window.innerHeight;
      // A pista é `totalW*vh + vh`. Essa sobra de 1 vh era tela parada — o dono
      // leu como travamento. Puxo o conteúdo para cima exatamente 1 vh: a
      // última cena entrega direto no pouso, sem respiro.
      if (corpoPuxado !== vh) {
        corpoPuxado = vh;
        var m = document.querySelector('main');
        if (m) m.style.marginTop = (-vh) + 'px';
      }
      var y = window.scrollY || window.pageYOffset;
      // ATENÇÃO: a pista do motor é `totalW*vh + vh` — ele guarda 1 vh de
      // sobra no fim "so the last flight completes". Os SEGMENTOS acabam 1 vh
      // antes da altura da pista; usar offsetHeight direto deixava 1 vh de
      // tela em branco (as cenas já em opacidade 0) no meio da travessia.
      var fimCadeia = (raiz.offsetHeight || (4.6 * vh)) - vh;

      // o palco entra por baixo do vídeo e chega a 1 exatamente no fim da cadeia
      var p = (y - (fimCadeia - 0.5 * vh)) / (0.5 * vh);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      if (p > 0 && !carregouPalco) {         // só baixa a imagem quando ela vai servir
        carregouPalco = true;
        palcoImg.src = REPOUSO;
        palco.classList.add('on');
      }
      palco.style.opacity = pouco ? String(p > 0 ? 1 : 0) : String(p);

      // a câmera parou: a legenda da cena sai devagar, sobrando a sala parada.
      // É o vão de respiro que o +1 vh da pista virou — a desaceleração do
      // clipe 3 entregue ao CSS, como pede o DIRECAO.md.
      // a legenda sai enquanto o palco entra: um gesto só, sem pausa
      swRoot.classList.toggle('quieto', p > 0.28);
      swRoot.classList.toggle('fim', y > fimCadeia + 0.25 * vh);

      // o palco só precisa existir enquanto o véu do pouso não fechou.
      // ATENÇÃO: offsetTop do #pouso é relativo ao <main> (position:relative),
      // não à página — dava 0 e derrubava o palco ainda dentro da cadeia.
      var pouso = document.getElementById('pouso');
      var fimPouso = fimCadeia + 1.5 * vh;
      if (pouso) {
        var topoAbs = pouso.getBoundingClientRect().top + y;
        fimPouso = topoAbs + pouso.offsetHeight * 0.70;   // 70% = onde o véu vira papel sólido
      }
      if (y > fimPouso) { palco.classList.remove('on'); } else if (carregouPalco) { palco.classList.add('on'); }

      // a marca entra quando o nome pousa
      if (topo) topo.classList.toggle('oculto', y < fimCadeia - 0.1 * vh);

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

  /* =========================================================================
     LUPA — o gesto que o dono desenhou, nesta ordem:
       1. clica na imagem
       2. ela expande CENTRALIZADA (FLIP a partir da miniatura, ~0,9 s)
       3. desliza para o lado, abrindo espaço
       4. a descrição entra ao lado — a legenda REAL da publicação
     Soma ~2 s, como ele pediu. Fecha por clique fora, Esc e botão; o foco
     fica preso enquanto está aberta. Sob prefers-reduced-motion vai direto
     para o estado final, sem percurso.
     ========================================================================= */
  function ligarLupa(fotos) {
    var lupa = document.getElementById('lupa');
    if (!lupa) return;
    var fig = document.getElementById('lupa-fig'), img = document.getElementById('lupa-img');
    var elQuando = document.getElementById('lupa-quando'), elTit = document.getElementById('lupa-titulo');
    var elCorpo = document.getElementById('lupa-corpo'), elFonte = document.getElementById('lupa-fonte');
    var fechar = document.getElementById('lupa-x');
    var devolverFoco = null, t1 = null, t2 = null;

    function abrir(i, origem) {
      var f = fotos[i]; if (!f) return;
      clearTimeout(t1); clearTimeout(t2);
      lupa.classList.remove('aberto');
      devolverFoco = origem;
      img.src = 'midia/galeria/' + encodeURIComponent(f.arq) + '?v=1';
      img.alt = f.alt || '';
      elQuando.textContent = f.quando || '';
      elTit.textContent = f.titulo || '';
      elCorpo.innerHTML = (f.texto || []).map(function (t) {
        return '<p>' + String(t).replace(/[&<>]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]; }) + '</p>';
      }).join('');
      elFonte.textContent = f.fonte || '';
      lupa.hidden = false;
      document.documentElement.setAttribute('data-lupa', '1');
      if (origem) origem.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      if (pouco) { lupa.classList.add('on', 'aberto'); fechar.focus(); return; }

      // FLIP: parte exatamente de onde a miniatura está
      var mini = origem && origem.getBoundingClientRect();
      lupa.classList.add('on');
      // Os tempos NÃO ficam dentro do rAF: em aba automatizada/segundo plano o
      // rAF pode não disparar e a fase 2 (a descrição) nunca abria — o QA pegou
      // isso como "controle clicado e nada mudou". O percurso visual é enfeite;
      // o estado final é obrigação.
      t1 = setTimeout(function () { lupa.classList.add('aberto'); }, 900);
      t2 = setTimeout(function () { try { fechar.focus(); } catch (e) {} }, 950);
      requestAnimationFrame(function () {
        var alvo = fig.getBoundingClientRect();
        if (mini && alvo.width) {
          var ex = mini.width / alvo.width, ey = mini.height / alvo.height;
          var dx = (mini.left + mini.width / 2) - (alvo.left + alvo.width / 2);
          var dy = (mini.top + mini.height / 2) - (alvo.top + alvo.height / 2);
          fig.style.transition = 'none';
          fig.style.transform = 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(' + ex + ',' + ey + ')';
          fig.getBoundingClientRect();           // força o reflow
          fig.style.transition = '';
          fig.style.transform = 'translate(-50%,-50%)';
        }
      });
    }

    function fecharLupa() {
      clearTimeout(t1); clearTimeout(t2);
      lupa.classList.remove('on', 'aberto');
      document.documentElement.removeAttribute('data-lupa');
      if (devolverFoco) devolverFoco.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      var esconde = function () { lupa.hidden = true; fig.style.transform = ''; };
      if (pouco) esconde(); else setTimeout(esconde, 420);
      if (devolverFoco) { try { devolverFoco.focus(); } catch (e) {} }
    }

    grade.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-i]') : null;
      if (b) abrir(parseInt(b.getAttribute('data-i'), 10), b);
    });
    fechar.addEventListener('click', fecharLupa);
    lupa.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-fechar')) fecharLupa();
    });
    document.addEventListener('keydown', function (e) {
      if (lupa.hidden) return;
      if (e.key === 'Escape') { fecharLupa(); return; }
      if (e.key === 'Tab') {                      // foco preso no diálogo
        var f = lupa.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var pri = f[0], ult = f[f.length - 1];
        if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
        else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
      }
    });
  }
})();
