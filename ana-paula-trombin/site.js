(() => {
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // vídeos reais: só baixam e tocam quando aparecem (e o do quadro só se estiver ativo)
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster;
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!calmo && (!v.classList.contains("tm") || v.classList.contains("on"))) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "200px 0px" });
  document.querySelectorAll("video[data-src]").forEach(v => vio.observe(v));

  // manifesto: cada letra vira um span (a rolagem pinta uma por uma)
  document.querySelectorAll("[data-letras]").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="p">${[...w].map(ch => `<span class="c">${ch}</span>`).join("")}</span>`).join(" ");
  });

  /* ---------- 1 · entrada: o arco desenhado em canvas ----------
     Arte própria em código (não é foto): 14 peças fora do lugar que se alinham
     conforme a rolagem; depois o contorno do alinhador e as guias de proporção. */
  const canvas = document.getElementById("arco");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, P = calmo ? 1 : 0;
  const N = 14;
  // desordem determinística (mesma arte em todo aparelho)
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647 - 0.5;
  const caos = Array.from({ length: N }, () => ({ x: rnd(), y: rnd(), r: rnd() }));
  const cl = v => Math.max(0, Math.min(1, v));
  const suave = t => 1 - Math.pow(1 - t, 3);

  const medidas = () => {
    const mob = W < 861;
    const cx = mob ? W * 0.5 : W * 0.64;
    const cy = mob ? H * 0.3 : H * 0.54;
    const R = mob ? Math.min(W * 0.34, H * 0.17) : Math.min(H * 0.3, W * 0.19);
    return { cx, cy, R };
  };
  const ponto = (cx, cy, R, th, k = 1) => [cx + R * 1.05 * k * Math.sin(th), cy - R * 1.25 * k * Math.cos(th) + R * 0.5];
  const ferradura = (cx, cy, R, k, ini, fim) => {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const th = ini + (fim - ini) * i / 60;
      const [x, y] = ponto(cx, cy, R, th, k);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
  };
  const peca = (w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
    ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
    ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
    ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
    ctx.closePath();
  };

  const desenha = p => {
    const { cx, cy, R } = medidas();
    ctx.clearRect(0, 0, W, H);
    const a = suave(cl((p - 0.03) / 0.55));   // alinhamento das peças
    const g = suave(cl((p - 0.32) / 0.38));   // contorno do alinhador
    const f = suave(cl((p - 0.7) / 0.28));    // guias de proporção

    // curvas de nível (sobem devagar com a rolagem)
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = `rgba(43,33,27,${0.075 - i * 0.0032})`;
      const k = 1.55 + i * 0.32;
      ctx.save(); ctx.translate(0, -p * 14 * i);
      ferradura(cx, cy, R, k, -1.45, 1.45); ctx.stroke();
      ctx.restore();
    }

    // luz cobre
    const luz = ctx.createRadialGradient(cx, cy - R * 0.1, 0, cx, cy - R * 0.1, R * (1.7 + p * 0.9));
    luz.addColorStop(0, `rgba(217,164,126,${0.34 + 0.18 * p})`);
    luz.addColorStop(1, "rgba(217,164,126,0)");
    ctx.fillStyle = luz;
    ctx.fillRect(0, 0, W, H);

    // contorno do alinhador: nasce no centro e corre para os dois lados
    if (g > 0) {
      ctx.strokeStyle = `rgba(156,91,55,${0.9 * g})`;
      ctx.lineWidth = 1.4;
      [1.16, 0.84].forEach(k => {
        ferradura(cx, cy, R, k, 0, 1.32 * g); ctx.stroke();
        ferradura(cx, cy, R, k, 0, -1.32 * g); ctx.stroke();
      });
    }

    // as peças
    for (let i = 0; i < N; i++) {
      const th = -1.2 + 2.4 * i / (N - 1);
      const [x0, y0] = ponto(cx, cy, R, th);
      const ang = Math.atan2(R * 1.25 * Math.sin(th), R * 1.05 * Math.cos(th));
      const d = 1 - a, c = caos[i];
      const sp = W < 861 ? 0.34 : 0.5;
      const x = x0 + c.x * R * sp * d, y = y0 + c.y * R * sp * d;
      const w = R * 0.15 * (1 + 0.3 * Math.abs(th)), h = R * 0.21 * (1 - 0.12 * Math.abs(th));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + c.r * 1.3 * d);
      ctx.translate(2, 4); peca(w, h, w * 0.32);
      ctx.fillStyle = "rgba(43,33,27,.08)"; ctx.fill();
      ctx.translate(-2, -4); peca(w, h, w * 0.32);
      ctx.fillStyle = "#F8F4EE"; ctx.fill();
      ctx.strokeStyle = "rgba(43,33,27,.55)"; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.restore();
    }

    // guias de proporção: face e sorriso no mesmo eixo
    if (f > 0) {
      ctx.strokeStyle = `rgba(156,91,55,${0.75 * f})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 1.9 * f); ctx.lineTo(cx, cy + R * 1.2 * f);
      ctx.moveTo(cx - R * 1.9 * f, cy - R * 0.75); ctx.lineTo(cx + R * 1.9 * f, cy - R * 0.75);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy - R * 0.2, R * 1.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      ctx.stroke();
    }
  };

  const etapas = [...document.querySelectorAll(".etapas-arco li")];
  const marca = p => etapas.forEach((li, i) => li.classList.toggle("on", p >= 0.06 + i * 0.22));

  const ajusta = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenha(P);
  };
  addEventListener("resize", ajusta);
  ajusta();
  marca(P);

  if (calmo || !window.gsap || !window.ScrollTrigger) {
    P = 1; desenha(1); marca(1);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // rolagem suave
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis; // para o QA rolar sem animação
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const alvo = document.querySelector(a.getAttribute("href"));
      if (alvo) { e.preventDefault(); lenis.scrollTo(alvo, { offset: 0 }); }
    }));
  }

  const tl = gsap.timeline({
    scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.5 }
  });
  const prog = { p: 0 };
  tl.to(prog, { p: 1, ease: "none", duration: 1, onUpdate: () => { P = prog.p; desenha(P); marca(P); } }, 0);
  tl.to(".passo-1", { autoAlpha: 0, y: -40, duration: 0.12 }, 0.22)
    .fromTo(".passo-2", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.32)
    .to(".passo-2", { autoAlpha: 0, y: -40, duration: 0.12 }, 0.6)
    .fromTo(".passo-3", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.7)
    .to(".rolar", { opacity: 0, duration: 0.05 }, 0.04);
  // abertura: o título entra por máscara, o arco chega de lado
  gsap.from(".passo-1 .titulo-xl", { yPercent: 30, opacity: 0, clipPath: "inset(0 0 100% 0)", duration: 1.5, ease: "expo.out", delay: 0.2 });
  gsap.from(".passo-1 .entrada-sub, .passo-1 .rotulo", { opacity: 0, y: 20, duration: 1.2, ease: "expo.out", delay: 0.45 });
  gsap.from("#arco", { x: () => innerWidth * 0.08, opacity: 0, duration: 1.8, ease: "expo.out", delay: 0.1 });

  // 2 · manifesto: letra por letra
  gsap.to(".manifesto-texto .c", {
    color: "#2B211B", stagger: 0.25, ease: "none",
    scrollTrigger: { trigger: ".manifesto-texto", start: "top 88%", end: "center 45%", scrub: true }
  });

  // 3 · detalhe: a janela de luz abre até a tela cheia
  const td = gsap.timeline({
    scrollTrigger: { trigger: ".detalhe", start: "top top", end: "bottom bottom", scrub: 0.5 }
  });
  td.fromTo(".detalhe-janela", { clipPath: "inset(30% 38% 30% 38%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.5 }, 0)
    .to(".detalhe-janela img", { scale: 1, ease: "power2.inOut", duration: 0.6 }, 0)
    .to(".detalhe-topo", { opacity: 1, duration: 0.1 }, 0.38)
    .to(".detalhe-palavras li", { y: 0, stagger: 0.08, duration: 0.12 }, 0.44)
    .to(".detalhe-palavras li", { opacity: 1, stagger: 0.08, duration: 0.015 }, 0.44)
    .to(".detalhe-legenda", { opacity: 1, duration: 0.1 }, 0.78);

  // 4 · tratamentos: o capítulo ativo desenha o traço da área
  const artes = gsap.utils.toArray(".tm");
  gsap.utils.toArray(".capitulo").forEach(c => {
    ScrollTrigger.create({
      trigger: c, start: "top 62%", end: "bottom 38%",
      onToggle: st => {
        c.classList.toggle("on", st.isActive);
        if (st.isActive) artes.forEach(t => {
          const on = t.dataset.t === c.dataset.t;
          t.classList.toggle("on", on);
          if (t.tagName === "VIDEO") {
            if (on && t.offsetParent) { if (!t.src) t.src = t.dataset.src; t.play().catch(() => {}); } else t.pause();
          }
        });
      }
    });
  });

  // faixa: as três palavras correm com a rolagem
  gsap.fromTo(".faixa-trilho", { xPercent: 0 }, {
    xPercent: -33.33, ease: "none",
    scrollTrigger: { trigger: ".faixa", start: "top bottom", end: "bottom top", scrub: true }
  });

  // 5 · frases: trilho horizontal fixado
  const trilho = document.getElementById("trilho");
  const dist = () => Math.max(0, trilho.scrollWidth - innerWidth);
  gsap.to(trilho, {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: ".frases", start: "top top", end: () => "+=" + dist(), pin: ".frases-pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
  });

  // 6 · calendário: novembro sai, dezembro entra
  const tc = gsap.timeline({
    scrollTrigger: { trigger: ".calendario", start: "top top", end: "bottom bottom", scrub: 0.5 }
  });
  tc.to(".mes-nov", { xPercent: -18, opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.15)
    .fromTo(".mes-dez", { xPercent: 22, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.5, ease: "power2.inOut" }, 0.3)
    .from(".cal-frase, .cal-texto", { y: 36, stagger: 0.1, duration: 0.3 }, 0.4);

  // 9 · convite abre por máscara, a arte acomoda
  gsap.fromTo(".convite", { clipPath: "inset(30% 0% 0% 0%)" }, {
    clipPath: "inset(0% 0% 0% 0%)", ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top bottom", end: "top 30%", scrub: 0.4 }
  });
  gsap.fromTo(".convite-fundo", { scale: 1.12 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top bottom", end: "bottom bottom", scrub: true }
  });
  // história: o vídeo abre por cortina e as fotos andam em velocidades diferentes (parallax)
  gsap.fromTo(".historia-video", { clipPath: "inset(18% 12% 18% 12%)" }, {
    clipPath: "inset(0% 0% 0% 0%)", ease: "none",
    scrollTrigger: { trigger: ".historia", start: "top 90%", end: "top 20%", scrub: 0.4 }
  });
  gsap.fromTo(".hf-1", { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".historia-fotos", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".hf-2", { yPercent: 18 }, { yPercent: -14, ease: "none", scrollTrigger: { trigger: ".historia-fotos", start: "top bottom", end: "bottom top", scrub: true } });

  // títulos sobem por trás de uma máscara
  gsap.utils.toArray(".titulo-l, .convite .titulo-xl").forEach(el => {
    if (el.closest(".entrada")) return;
    gsap.fromTo(el, { yPercent: 40, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, opacity: 1, clipPath: "inset(0% 0% -20% 0%)", duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
  gsap.utils.toArray(".google, .insta, .lista-duvidas details, .capitulo h3").forEach(el => {
    gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
