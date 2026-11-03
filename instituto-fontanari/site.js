(() => {
  const ZAP = "https://wa.me/5517991374224?text=" +
    encodeURIComponent("Olá! Vi a prévia do site do Instituto Odontológico Fontanari e gostaria de agendar uma avaliação.");
  document.querySelectorAll("[data-zap]").forEach(a => { a.href = ZAP; a.target = "_blank"; a.rel = "noopener"; });

  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // topo: troca de cor conforme o fundo que está atrás dele
  const topo = document.getElementById("topo");
  const blocos = [...document.querySelectorAll("main > section, .faixa, .rodape")];
  let pedidoTopo = 0;
  const confereTopo = () => {
    pedidoTopo = 0;
    const b = blocos.find(el => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    topo.classList.toggle("claro", !!b && !b.classList.contains("escuro") && !b.classList.contains("rodape"));
  };
  addEventListener("scroll", () => { if (!pedidoTopo) pedidoTopo = requestAnimationFrame(confereTopo); }, { passive: true });
  confereTopo();

  // vídeos curtos: só baixam e tocam quando aparecem
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!calmo) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "200px 0px" });
  document.querySelectorAll("video[data-src]").forEach(v => vio.observe(v));
  // pôsteres só quando o vídeo se aproxima (não pesam na primeira pintura)
  const pio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.poster = e.target.dataset.poster; pio.unobserve(e.target); }
  }), { rootMargin: "900px 0px" });
  document.querySelectorAll("video[data-poster]").forEach(v => pio.observe(v));

  // manifesto: cada letra vira um span
  document.querySelectorAll("[data-palavras]").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="p">${[...w].map(ch => `<span class="c">${ch}</span>`).join("")}</span>`).join(" ");
  });

  // números: o HTML já traz o valor final (modo calmo fica nele)
  const contadores = [...document.querySelectorAll("[data-conta]")];
  const escreve = (el, v) => { el.textContent = v.toFixed(+el.dataset.casas).replace(".", ","); };
  contadores.forEach(el => escreve(el, +el.dataset.conta));

  if (calmo || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const CURVA = "expo.out";

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]:not([data-zap])').forEach(a => a.addEventListener("click", e => {
      const alvo = document.querySelector(a.getAttribute("href"));
      if (alvo) { e.preventDefault(); lenis.scrollTo(alvo, { offset: 0 }); }
    }));
  }

  // 1 · entrada: o instituto por dentro, em sequência de quadros no canvas
  const TOTAL = 90, canvas = document.getElementById("tour"), ctx = canvas.getContext("2d");
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
  // quadros-chave primeiro (1 a cada 8), depois o resto
  carrega(0);
  const chaves = () => {
    for (let i = 0; i < TOTAL; i += 8) carrega(i);
    setTimeout(() => { for (let i = 0; i < TOTAL; i++) carrega(i); }, 600);
  };
  if (document.readyState === "complete") setTimeout(chaves, 200); else addEventListener("load", () => setTimeout(chaves, 200));
  const perto = i => { for (let d = 0; d < TOTAL; d++) { if (desenha(i - d)) return; if (desenha(i + d)) return; } };

  const tl = gsap.timeline({ scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.4 } });
  const seq = { f: 0 };
  tl.to(seq, { f: TOTAL - 1, ease: "none", duration: 1, onUpdate: () => { atual = Math.round(seq.f); if (!desenha(atual)) perto(atual); } }, 0)
    .to(".janela-entrada", { scale: 1.03, ease: "none", duration: 1 }, 0);
  // texto sem atraso de scrub: nunca fica parado no meio do esmaecer
  const tt = gsap.timeline({ scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: true } });
  tt.to(".passo-1", { autoAlpha: 0, y: -40, duration: 0.05 }, 0.26)
    .fromTo(".passo-2", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.34)
    .to(".passo-2", { autoAlpha: 0, y: -40, duration: 0.05 }, 0.6)
    .fromTo(".passo-3", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.68)
    .to(".rolar", { opacity: 0, duration: 0.05 }, 0.04)
    .to({}, { duration: 0.27 }, 0.73);
  // a janela abre de baixo para cima na chegada
  gsap.fromTo(".janela-entrada", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: CURVA, delay: 0.1 });
  gsap.from(".passo-1 .titulo-xl", { y: 60, opacity: 0, duration: 1.4, ease: CURVA, delay: 0.2 });

  // 2 · manifesto: letra a letra
  gsap.to(".manifesto-texto .c", {
    color: "#0F2328", stagger: 0.25, ease: "none",
    scrollTrigger: { trigger: ".manifesto-texto", start: "top 88%", end: "center 45%", scrub: true }
  });

  // 3 · jornada: trilho horizontal fixado + o fio que se desenha junto
  const trilho = document.getElementById("trilho"), fio = document.getElementById("fio");
  const comp = fio.getTotalLength();
  fio.style.strokeDasharray = comp; fio.style.strokeDashoffset = comp;
  const dist = () => Math.max(0, trilho.scrollWidth - innerWidth);
  const tj = gsap.timeline({
    scrollTrigger: { trigger: ".jornada", start: "top top", end: () => "+=" + Math.max(dist(), innerHeight * 0.8), pin: ".jornada-pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
  });
  tj.to(trilho, { x: () => -dist(), ease: "none", duration: 1 }, 0)
    .to(fio, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);

  // 4 · detalhe: a janela da consulta abre até a tela cheia
  const td = gsap.timeline({ scrollTrigger: { trigger: ".detalhe", start: "top top", end: "bottom bottom", scrub: 0.5 } });
  td.to(".detalhe-janela", { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.5 }, 0)
    .to(".detalhe-janela video", { scale: 1, ease: "power2.inOut", duration: 0.6 }, 0)
    .to(".detalhe-palavras li", { opacity: 1, y: 0, stagger: 0.08, duration: 0.12 }, 0.42)
    .fromTo(".detalhe-legenda", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.78);

  // 5 · prevenção: o tema ativo troca o diagrama
  const artes = gsap.utils.toArray(".sa");
  gsap.utils.toArray(".tema").forEach(t => {
    ScrollTrigger.create({
      trigger: t, start: "top 60%", end: "bottom 40%",
      onToggle: s => {
        t.classList.toggle("on", s.isActive);
        if (s.isActive) artes.forEach(a => a.classList.toggle("on", a.dataset.f === t.dataset.f));
      }
    });
  });

  // o espaço respira ao passar
  gsap.fromTo(".m1 video", { scale: 1 }, { scale: 1.1, ease: "none",
    scrollTrigger: { trigger: ".mosaico", start: "top bottom", end: "bottom top", scrub: true } });

  // faixa corre com a rolagem
  gsap.fromTo(".faixa-trilho", { xPercent: 0 }, {
    xPercent: -50, ease: "none",
    scrollTrigger: { trigger: ".faixa", start: "top bottom", end: "bottom top", scrub: true }
  });

  // 6 · números contam ao entrar
  contadores.forEach(el => {
    const alvo = +el.dataset.conta, o = { v: 0 };
    escreve(el, 0);
    gsap.to(o, { v: alvo, duration: 2, ease: CURVA, onUpdate: () => escreve(el, o.v),
      scrollTrigger: { trigger: el, start: "top 85%", once: true } });
  });

  // fotos das pessoas entram por cortina
  gsap.utils.toArray(".pessoa-foto").forEach(f => {
    gsap.fromTo(f, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none",
      scrollTrigger: { trigger: f, start: "top 95%", end: "top 45%", scrub: 0.4 } });
  });

  // convite final abre por máscara
  gsap.fromTo(".convite", { clipPath: "inset(26% 6% 0% 6%)" }, {
    clipPath: "inset(0% 0% 0% 0%)", ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top bottom", end: "top 25%", scrub: 0.4 }
  });

  // títulos sobem por trás de uma máscara
  gsap.utils.toArray(".titulo-l, .convite .titulo-xl, .pessoa h3, .insta-link").forEach(el => {
    if (el.closest(".entrada")) return;
    gsap.fromTo(el, { yPercent: 40, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, opacity: 1, clipPath: "inset(0% 0% -20% 0%)", duration: 1.4, ease: CURVA,
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
  gsap.utils.toArray(".lista-duvidas details, .pessoa ul, .pessoa blockquote, .numero p, .m").forEach(el => {
    gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: CURVA, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
