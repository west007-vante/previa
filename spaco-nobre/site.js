(() => {
  const ZAP = "https://wa.me/5534998895120?text=" +
    encodeURIComponent("Olá! Vi o site do Instituto Spaço Nobre e gostaria de agendar uma avaliação.");
  document.querySelectorAll("[data-zap]").forEach(a => { a.href = ZAP; a.target = "_blank"; a.rel = "noopener"; });

  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // vídeos curtos: só tocam quando aparecem (e só baixam nessa hora)
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!calmo) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "200px 0px" });
  document.querySelectorAll("video[data-src]").forEach(v => vio.observe(v));

  // manifesto: cada palavra vira um span
  document.querySelectorAll("[data-palavras]").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="p">${[...w].map(ch => `<span class="c">${ch}</span>`).join("")}</span>`).join(" ");
  });

  if (calmo || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // rolagem suave
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const alvo = document.querySelector(a.getAttribute("href"));
      if (alvo) { e.preventDefault(); lenis.scrollTo(alvo, { offset: 0 }); }
    }));
  }

  // 1 · entrada: sequência de quadros do tour real no canvas
  const TOTAL = 124, canvas = document.getElementById("tour"), ctx = canvas.getContext("2d");
  const quadros = new Array(TOTAL);
  const url = i => `assets/seq/t${String(i + 1).padStart(3, "0")}.webp`;
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
  // primeiro os quadros-chave (1 a cada 8), depois o resto — o scroll nunca fica sem imagem
  for (let i = 0; i < TOTAL; i += 8) carrega(i);
  const resto = () => { for (let i = 0; i < TOTAL; i++) carrega(i); };
  setTimeout(resto, 600);
  carrega(0);

  const perto = i => { for (let d = 0; d < TOTAL; d++) { if (desenha(i - d)) return; if (desenha(i + d)) return; } };

  const tl = gsap.timeline({
    scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.4 }
  });
  const seq = { f: 0 };
  tl.to(seq, {
    f: TOTAL - 1, ease: "none", duration: 1,
    onUpdate: () => { atual = Math.round(seq.f); if (!desenha(atual)) perto(atual); }
  }, 0);
  tl.to(".passo-1", { opacity: 0, y: -40, duration: 0.12 }, 0.2)
    .fromTo(".passo-2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.12 }, 0.3)
    .to(".passo-2", { opacity: 0, y: -40, duration: 0.12 }, 0.58)
    .fromTo(".passo-3", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.12 }, 0.66)
    .to(".rolar", { opacity: 0, duration: 0.05 }, 0.05)
    .to(".arco", { scale: 1.04, duration: 1, ease: "none" }, 0);
  // (Aventura, B1.6: o painel de mídia entra de lado enquanto o título se abre)
  gsap.from(".arco", { x: () => innerWidth * 0.18, opacity: 0.2, duration: 1.6, ease: "expo.out", delay: 0.15 });
  gsap.from(".passo-1 .titulo-xl", { x: -60, opacity: 0, duration: 1.4, ease: "expo.out", delay: 0.25 });

  // 2 · manifesto: palavra por palavra
  // (Aventura, B1.1: o texto se preenche caractere a caractere)
  gsap.to(".manifesto-texto .c", {
    color: "#171512", stagger: 0.25, ease: "none",
    scrollTrigger: { trigger: ".manifesto-texto", start: "top 90%", end: "center center", scrub: true }
  });

  // 3 · detalhe: a janela abre até a tela cheia, as quatro palavras entram
  const td = gsap.timeline({
    scrollTrigger: { trigger: ".detalhe", start: "top top", end: "bottom bottom", scrub: 0.5 }
  });
  td.to(".detalhe-janela", { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.5 }, 0)
    .to(".detalhe-janela img", { scale: 1, ease: "power2.inOut", duration: 0.6 }, 0)
    .to(".detalhe-palavras li", { opacity: 1, y: 0, stagger: 0.07, duration: 0.12 }, 0.42)
    .to(".detalhe-legenda", { opacity: 1, duration: 0.1 }, 0.8);

  // 4 · história: o capítulo ativo troca a foto
  const fotos = gsap.utils.toArray(".hf");
  gsap.utils.toArray(".capitulo").forEach(c => {
    ScrollTrigger.create({
      trigger: c, start: "top 60%", end: "bottom 40%",
      onToggle: s => {
        c.classList.toggle("on", s.isActive);
        if (s.isActive) fotos.forEach(f => f.classList.toggle("on", f.dataset.f === c.dataset.f));
      }
    });
  });

  // 5 · casos: trilho horizontal fixado
  const trilho = document.getElementById("trilho");
  const dist = () => Math.max(0, trilho.scrollWidth - innerWidth);
  gsap.to(trilho, {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: ".casos", start: "top top", end: () => "+=" + dist(), pin: ".casos-pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
  });

  // faixa dos pilares corre com a rolagem (Bryhel, B3)
  gsap.fromTo(".faixa-trilho", { xPercent: 0 }, {
    xPercent: -33.33, ease: "none",
    scrollTrigger: { trigger: ".faixa", start: "top bottom", end: "bottom top", scrub: true }
  });

  // processo: cada foto entra por cortina e o zoom se acomoda (Aventura, B1.3)
  gsap.utils.toArray(".etapa-midia").forEach(m => {
    gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", ease: "none",
      scrollTrigger: { trigger: m, start: "top 95%", end: "top 45%", scrub: 0.4 }
    });
    gsap.fromTo(m.firstElementChild, { scale: 1.4 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: m, start: "top 95%", end: "bottom 40%", scrub: 0.4 }
    });
  });

  // o instituto respira ao passar (Aventura, B1.4)
  gsap.fromTo(".m1 video", { scale: 1 }, {
    scale: 1.1, ease: "none",
    scrollTrigger: { trigger: ".mosaico", start: "top bottom", end: "bottom top", scrub: true }
  });

  // convite final abre por máscara (Studio Brusco, B4)
  gsap.fromTo(".convite", { clipPath: "inset(30% 0% 0% 0%)" }, {
    clipPath: "inset(0% 0% 0% 0%)", ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top bottom", end: "top 30%", scrub: 0.4 }
  });

  // entradas suaves de blocos
  // títulos sobem por trás de uma máscara (Aventura, B1.2 / Truekind, B2)
  gsap.utils.toArray(".titulo-l, .convite .titulo-xl").forEach(el => {
    if (el.closest(".entrada")) return;
    gsap.fromTo(el, { yPercent: 40, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, opacity: 1, clipPath: "inset(0% 0% -20% 0%)", duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
  gsap.utils.toArray(".depoimento, .google, .lista-duvidas details, .m, .etapa h3, .etapa p").forEach(el => {
    gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
