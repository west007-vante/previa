(() => {
  const ZAP = "https://wa.me/5517991907118?text=" +
    encodeURIComponent("Olá! Vim pelo site e gostaria de agendar uma avaliação com a Dra. Karen Nogueira.");
  const MAPA = "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Clínica Dra. Karen Nogueira") + "&query_place_id=ChIJP9hXFgCzvZQR8oENqtyBgn4";
  document.querySelectorAll("[data-zap]").forEach(a => { a.href = ZAP; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("[data-mapa]").forEach(a => { a.href = MAPA; });

  // topo: transparente só no alto da entrada; depois de 80px vira faixa sólida com a cor da seção que está embaixo
  const topo = document.querySelector(".topo");
  const escuras = [...document.querySelectorAll(".fatos, .detalhe, .convite, .rodape")];
  const topoCor = () => {
    const y = topo.offsetHeight / 2;
    topo.classList.toggle("solido", scrollY > 80);
    topo.classList.toggle("escuro", escuras.some(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
  };
  addEventListener("scroll", topoCor, { passive: true });
  topoCor();

  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // manifesto: cada letra vira um span (palavra inteira não quebra)
  document.querySelectorAll("[data-letras]").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="p">${[...w].map(ch => `<span class="c">${ch}</span>`).join("")}</span>`).join(" ");
  });

  // vídeos curtos: só baixam e tocam quando aparecem
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!calmo && (!v.classList.contains("hf") || v.classList.contains("on"))) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "200px 0px" });
  document.querySelectorAll("video[data-src]").forEach(v => vio.observe(v));

  /* 1 · ENTRADA — vídeo real da clínica (post /p/DcWOGdFBXFo/, 0,5–12,9 s) em 124 quadros webp, 10 fps.
     Quadros-chave primeiro (1 a cada 8), depois o resto; o canvas desenha o quadro mais próximo já carregado. */
  const TOTAL = 124, canvas = document.getElementById("tour"), ctx = canvas.getContext("2d");
  const quadros = new Array(TOTAL);
  const url = i => `assets/seq/k${String(i + 1).padStart(3, "0")}.webp`;
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
  // o quadro 0 já está na tela como pôster; o resto só começa depois da primeira pintura
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

  // rolagem suave
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const alvo = document.querySelector(id);
      if (alvo) { e.preventDefault(); lenis.scrollTo(alvo, { offset: 0 }); }
    }));
  }

  // 1 · entrada: o canvas é redesenhado pelo progresso da rolagem; os 3 passos trocam
  const tl = gsap.timeline({ scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.5 } });
  const seqp = { f: 0 };
  tl.to(seqp, { f: TOTAL - 1, ease: "none", duration: 1, onUpdate: () => { atual = Math.round(seqp.f); if (!desenha(atual)) perto(atual); } }, 0)
    .fromTo(".tela", { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(4% 0% 4% 0%)", ease: "none", duration: 1 }, 0)
    .to(".passo-1", { opacity: 0, y: -40, duration: 0.1 }, 0.24)
    .fromTo(".passo-2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1 }, 0.33)
    .to(".passo-2", { opacity: 0, y: -40, duration: 0.1 }, 0.6)
    .fromTo(".passo-3", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1 }, 0.68);
  gsap.from(".tela", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.6, ease: CURVA, delay: 0.1 });
  gsap.from(".passo-1 .titulo-xl", { yPercent: 30, opacity: 0, duration: 1.6, ease: CURVA, delay: 0.15 });
  gsap.from(".passo-1 .rotulo", { opacity: 0, duration: 1.2, ease: CURVA, delay: 0.35 });

  // 2 · manifesto: letra a letra (Aventura B1.1)
  gsap.to(".manifesto-texto .c", {
    color: "#22171A", stagger: 0.25, ease: "none",
    scrollTrigger: { trigger: ".manifesto-texto", start: "top 88%", end: "center 40%", scrub: true }
  });

  // 3 · fatos: trilho horizontal fixado (Bryhel B3 / Spaço Nobre casos)
  const trilho = document.getElementById("trilho");
  const dist = () => Math.max(0, trilho.scrollWidth - innerWidth);
  const corre = gsap.to(trilho, {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: ".fatos", start: "top top", end: () => "+=" + dist(), pin: ".fatos-pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
  });
  // números gigantes andam mais devagar que o painel (parallax dentro do trilho)
  gsap.utils.toArray(".numero").forEach(n => {
    gsap.fromTo(n, { xPercent: 30 }, { xPercent: -20, ease: "none",
      scrollTrigger: { trigger: n.parentElement, containerAnimation: corre, start: "left right", end: "right left", scrub: true } });
  });
  // régua se desenha quando o painel 01 chega (Truekind B2: linha que se desenha)
  document.querySelectorAll(".regua .traco").forEach(t => {
    const L = t.getTotalLength();
    gsap.fromTo(t, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: "none",
      scrollTrigger: { trigger: ".regua", containerAnimation: corre, start: "left 85%", end: "left 35%", scrub: true } });
  });

  // 4 · detalhe: a janela abre até a tela cheia
  const td = gsap.timeline({ scrollTrigger: { trigger: ".detalhe", start: "top top", end: "bottom bottom", scrub: 0.5 } });
  td.to(".detalhe-janela", { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.5 }, 0)
    .to(".detalhe-janela img", { scale: 1, ease: "power2.inOut", duration: 0.6 }, 0)
    .to(".detalhe-palavras li", { opacity: 1, y: 0, stagger: 0.08, duration: 0.12 }, 0.42)
    .to(".detalhe-legenda", { opacity: 1, duration: 0.1 }, 0.8);

  // 6 · cuidados: o item ativo troca a foto/vídeo da coluna fixa (Aventura B1.3); zonas exclusivas (50%)
  const fotos = gsap.utils.toArray(".hf");
  gsap.utils.toArray(".cuidado").forEach(c => {
    ScrollTrigger.create({
      trigger: c, start: "top 50%", end: "bottom 50%",
      onToggle: s => {
        c.classList.toggle("on", s.isActive);
        if (!s.isActive) return;
        fotos.forEach(f => {
          const on = f.dataset.c === c.dataset.c;
          f.classList.toggle("on", on);
          if (f.tagName === "VIDEO") { if (on) { if (!f.src) f.src = f.dataset.src; f.play().catch(() => {}); } else f.pause(); }
        });
      }
    });
  });

  // 5 · sorrisos: colunas em velocidades diferentes (Truekind B2, parallax)
  gsap.utils.toArray(".coluna").forEach(col => {
    gsap.fromTo(col, { yPercent: -(+col.dataset.vel) }, { yPercent: +col.dataset.vel, ease: "none",
      scrollTrigger: { trigger: ".colunas", start: "top bottom", end: "bottom top", scrub: true } });
  });
  gsap.utils.toArray(".sorriso img").forEach(img => {
    gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "center center", scrub: true } });
  });

  // faixa de palavras corre com a rolagem (Bryhel B3)
  gsap.fromTo(".faixa-trilho", { xPercent: 0 }, { xPercent: -50, ease: "none",
    scrollTrigger: { trigger: ".faixa", start: "top bottom", end: "bottom top", scrub: true } });

  // instagram: as arrobas deslizam em sentidos opostos
  gsap.utils.toArray(".insta-arroba").forEach((el, i) => {
    gsap.fromTo(el, { x: i % 2 ? -60 : 60 }, { x: 0, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "center 45%", scrub: true } });
  });

  // convite abre por máscara (Studio Brusco B4) e o fundo respira (Aventura B1.4)
  gsap.fromTo(".convite", { clipPath: "inset(30% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top bottom", end: "top 25%", scrub: 0.4 } });
  gsap.fromTo(".convite-fundo", { scale: 1.12 }, { scale: 1, ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top bottom", end: "bottom bottom", scrub: true } });

  // títulos sobem por trás de máscara (Aventura B1.2 / Truekind B2)
  gsap.utils.toArray(".titulo-l, .convite .titulo-xl").forEach(el => {
    if (el.closest(".entrada") || el.closest(".fatos")) return;
    gsap.fromTo(el, { yPercent: 40, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, opacity: 1, clipPath: "inset(0% 0% -20% 0%)", duration: 1.4, ease: CURVA,
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
  gsap.utils.toArray(".fala, .google, .insta-chamada, .cuidado h3").forEach(el => {
    gsap.from(el, { opacity: 0, y: 30, duration: 1.2, ease: CURVA, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
