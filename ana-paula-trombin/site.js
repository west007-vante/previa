(() => {
  const ZAP = "https://wa.me/5517996299995?text=" +
    encodeURIComponent("Olá, Dra. Ana Paula! Vim pelo site e gostaria de agendar uma avaliação.");
  const MAPA = "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Dra. Ana Paula Trombin") + "&query_place_id=ChIJMdbFcm2zvZQR9BpM1UuCQHY";
  document.querySelectorAll("[data-zap]").forEach(a => { a.href = ZAP; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("[data-mapa]").forEach(a => { a.href = MAPA; });

  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lenis = null;

  // MENU de tela cheia: abre/fecha pelo botão, por Esc e ao escolher uma seção
  // (montado no primeiro clique: antes disso não existe no DOM)
  const SECOES = [["#inicio", "Início"], ["#consultorio", "Por dentro"], ["#quem", "Quem é ela"], ["#duvidas", "O que ela responde"], ["#tratamentos", "O que ela trata"], ["#agendar", "Como agendar"]];
  const botao = document.querySelector(".menu-botao"), rotulo = botao.querySelector(".menu-rotulo");
  let menu = null, aberto = false, yAbriu = 0;
  const monta = () => {
    menu = document.createElement("nav");
    menu.className = "menu"; menu.id = "menu"; menu.setAttribute("aria-label", "Seções");
    menu.innerHTML = `<ol class="menu-lista">${SECOES.map(([h, t], i) => `<li><a href="${h}"><span>0${i + 1}</span>${t}</a></li>`).join("")}</ol>
      <div class="menu-pe"><p>Av. Romeu Strazzi, 325 · Sala 418 · São José do Rio Preto-SP</p>
      <p><a href="tel:+5517996299995">(17) 99629-9995</a> · <a href="https://www.instagram.com/draanapaulatrombin/" target="_blank" rel="noopener">@draanapaulatrombin</a></p></div>`;
    menu.style.clipPath = "inset(0 0 100% 0)";
    menu.style.display = "none";
    document.body.appendChild(menu);
    menu.querySelectorAll("a[href^='#']").forEach(a => a.addEventListener("click", e => {
      e.preventDefault(); abre(false);
      const alvo = document.querySelector(a.getAttribute("href"));
      if (lenis) lenis.scrollTo(alvo, { offset: 0, immediate: calmo }); else alvo.scrollIntoView();
    }));
  };
  const abre = (sim, ja) => {
    if (!menu) monta();
    aberto = sim; yAbriu = scrollY;
    botao.setAttribute("aria-expanded", sim);
    rotulo.textContent = sim ? "Fechar" : "Menu";
    document.body.classList.toggle("menu-aberto", sim);
    document.querySelectorAll("main, .rodape, .zap-flutuante, .pular").forEach(el => { el.inert = sim; });
    if (sim) { menu.style.display = "flex"; requestAnimationFrame(() => requestAnimationFrame(() => { menu.style.clipPath = "inset(0 0 0 0)"; })); lenis && lenis.stop(); }
    else { menu.style.clipPath = "inset(0 0 100% 0)"; if (ja || calmo) menu.style.display = "none"; else setTimeout(() => { if (!aberto) menu.style.display = "none"; }, 900); lenis && lenis.start(); }
  };
  botao.addEventListener("click", () => abre(!aberto));
  addEventListener("keydown", e => { if (e.key === "Escape" && aberto) { abre(false); botao.focus(); } });
  // se a página rolar com o menu aberto (barra de rolagem, atalho), o menu fecha
  addEventListener("scroll", () => { if (aberto && Math.abs(scrollY - yAbriu) > 40) abre(false, true); }, { passive: true });

  // vídeos curtos: pôster e vídeo só baixam quando aparecem
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.poster && v.dataset.poster) v.poster = v.dataset.poster;
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!calmo) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "300px 0px" });
  document.querySelectorAll("video[data-src]").forEach(v => vio.observe(v));

  // TRATAMENTOS: a foto real do item sob o mouse segue o cursor (só com mouse; no celular a foto fica sob o item)
  const seguidor = document.querySelector(".cursor-foto"), segImg = seguidor.querySelector("img");
  const comMouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.querySelectorAll(".trat").forEach(t => {
    t.addEventListener("mouseenter", () => {
      document.querySelectorAll(".trat.ativo").forEach(o => o.classList.remove("ativo"));
      t.classList.add("ativo");
      if (comMouse) { segImg.src = t.dataset.img; seguidor.style.opacity = 1; }
    });
    t.addEventListener("mouseleave", () => { t.classList.remove("ativo"); seguidor.style.opacity = 0; });
  });

  /* 1 · ENTRADA — vídeo real dela no consultório (post /p/DdJZONjOPiv/, 0–12 s), 120 quadros webp a 10 fps,
     recortados acima da legenda queimada. Quadro 1 já está na tela como pôster; quadros-chave (1 a cada 8)
     depois da primeira pintura, o resto em seguida; o canvas desenha o quadro carregado mais próximo. */
  const TOTAL = 120, canvas = document.getElementById("tour"), ctx = canvas.getContext("2d");
  const quadros = new Array(TOTAL);
  const url = i => `assets/seq/a${String(i + 1).padStart(3, "0")}.webp`;
  let atual = 0;
  const desenha = i => {
    const img = quadros[i];
    if (!img || !img.complete || !img.naturalWidth) return false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return true;
  };
  const carrega = i => {
    if (quadros[i]) return;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { if (i === atual) desenha(i); };
    img.src = url(i);
    quadros[i] = img;
  };
  const depois = () => {
    carrega(0);
    for (let i = 0; i < TOTAL; i += 8) carrega(i);
    setTimeout(() => { for (let i = 0; i < TOTAL; i++) carrega(i); }, 600);
  };
  if (document.readyState === "complete") depois(); else addEventListener("load", depois, { once: true });
  const perto = i => { for (let d = 0; d < TOTAL; d++) { if (desenha(i - d)) return; if (desenha(i + d)) return; } };

  if (calmo || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const CURVA = "expo.out";

  // palavras da fala viram spans (antes de medir)
  document.querySelectorAll("[data-palavras]").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
  });

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const alvo = document.querySelector(id);
      if (alvo) { e.preventDefault(); lenis.start(); lenis.scrollTo(alvo, { offset: 0 }); }
    }));
  }

  // 1 · entrada: o vídeo da metade fixa anda com a rolagem da outra metade
  const seqp = { f: 0 };
  gsap.to(seqp, { f: TOTAL - 1, ease: "none",
    scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.5 },
    onUpdate: () => { atual = Math.round(seqp.f); if (!desenha(atual)) perto(atual); } });
  gsap.from(".passo:first-child .titulo-xl", { yPercent: 30, opacity: 0, duration: 1.6, ease: CURVA, delay: 0.15 });
  gsap.utils.toArray(".passo:not(:first-child) > *").forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: CURVA, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // 2 · galeria: a foto do centro abre até a tela cheia; as outras se afastam
  const centro = document.querySelector(".g-centro");
  const escala = () => { const r = centro.getBoundingClientRect(); return Math.max(innerWidth / r.width, innerHeight / r.height) * 1.02; };
  const desloc = eixo => { const r = centro.getBoundingClientRect();
    return eixo === "x" ? innerWidth / 2 - (r.left + r.width / 2) - (gsap.getProperty(centro, "x") || 0)
                        : innerHeight / 2 - (r.top + r.height / 2) - (gsap.getProperty(centro, "y") || 0); };
  const tg = gsap.timeline({ scrollTrigger: { trigger: ".galeria", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
  tg.to(".galeria-cabeca", { yPercent: -60, opacity: 0, duration: 0.2, ease: "power2.in" }, 0.1)
    .to(".g:not(.g-centro)", { scale: 0.6, opacity: 0, duration: 0.45, ease: "power2.in",
      x: (i, el) => { const r = el.getBoundingClientRect(), c = centro.getBoundingClientRect(); return (r.left - c.left) * 0.9; },
      y: (i, el) => { const r = el.getBoundingClientRect(), c = centro.getBoundingClientRect(); return (r.top - c.top) * 0.9; } }, 0.12)
    .to(centro, { scale: () => escala(), x: () => desloc("x"), y: () => desloc("y"), duration: 0.6, ease: "power2.inOut" }, 0.15)
    .to(".galeria-fim", { opacity: 1, duration: 0.06 }, 0.8);

  // 3 · quem: cada parágrafo sobe ao entrar
  gsap.utils.toArray(".quem-p, .duvidas details, .n").forEach(el => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.2, ease: CURVA, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });
  gsap.fromTo(".quem-foto img", { scale: 1.12 }, { scale: 1, ease: "none",
    scrollTrigger: { trigger: ".quem", start: "top bottom", end: "bottom bottom", scrub: true } });

  // 5 · fala: palavras acendem uma a uma; a foto de fundo acomoda
  const tf = gsap.timeline({ scrollTrigger: { trigger: ".fala", start: "top top", end: "bottom bottom", scrub: 0.5 } });
  tf.to(".fala-texto .w", { opacity: 1, stagger: 0.2, duration: 0.2, ease: "none" }, 0)
    .to(".fala-fundo", { scale: 1, duration: 1, ease: "none" }, 0);

  // 6 · tratamentos: o seguidor anda atrás do mouse com a curva da casa
  if (comMouse) {
    const vx = gsap.quickTo(seguidor, "x", { duration: 0.7, ease: CURVA }), vy = gsap.quickTo(seguidor, "y", { duration: 0.7, ease: CURVA });
    gsap.set(seguidor, { xPercent: 0, yPercent: -50, scale: 0.85 });
    // a foto fica à direita do cursor, para não cobrir o nome do tratamento
    addEventListener("mousemove", e => { vx(Math.min(e.clientX + 40, innerWidth - 300)); vy(e.clientY); }, { passive: true });
  }
  gsap.utils.toArray(".trat").forEach(t => {
    gsap.from(t, { opacity: 0, y: 50, duration: 1.2, ease: CURVA, scrollTrigger: { trigger: t, start: "top 92%", once: true } });
  });
  // o item no meio da tela fica ativo (no celular é o que mostra qual tratamento está em leitura)
  gsap.utils.toArray(".trat").forEach(t => ScrollTrigger.create({ trigger: t, start: "top 55%", end: "bottom 55%", toggleClass: "ativo" }));

  // 7 · números contam ao aparecer
  document.querySelectorAll("[data-conta]").forEach(el => {
    const alvo = +el.dataset.conta, casas = +(el.dataset.casas || 0), o = { v: 0 };
    gsap.to(o, { v: alvo, duration: 1.8, ease: CURVA, scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: () => { el.textContent = o.v.toFixed(casas).replace(".", ","); } });
  });

  // 8 · fechamento: o vídeo de fundo aproxima até o tamanho certo
  gsap.fromTo(".fechamento-fundo", { scale: 1.15 }, { scale: 1, ease: "none",
    scrollTrigger: { trigger: ".fechamento", start: "top bottom", end: "bottom bottom", scrub: true } });

  // títulos sobem por trás de máscara
  gsap.utils.toArray(".quem .titulo-l, .duvidas .titulo-l, .trat-cabeca .titulo-l, .fechamento .titulo-xl").forEach(el => {
    gsap.fromTo(el, { yPercent: 40, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, opacity: 1, clipPath: "inset(0% 0% -20% 0%)", duration: 1.4, ease: CURVA,
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
