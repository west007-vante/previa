(() => {
  const ZAP = "https://wa.me/5534998979595?text=" +
    encodeURIComponent("Olá! Vi o site da CIOR Clínica Odontológica e gostaria de agendar uma avaliação.");
  document.querySelectorAll("[data-zap]").forEach(a => { a.href = ZAP; a.target = "_blank"; a.rel = "noopener"; });

  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // vídeos curtos: só baixam e tocam quando aparecem
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!calmo) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: "200px 0px" });
  document.querySelectorAll("video[data-src]").forEach(v => vio.observe(v));

  // a aba de contato sai de cena quando o convite final está na tela
  const aba = document.querySelector(".aba-zap");
  new IntersectionObserver(es => es.forEach(e => aba.classList.toggle("fora", e.isIntersecting)),
    { threshold: 0.25 }).observe(document.querySelector(".convite-dentro"));

  if (calmo || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const CURVA = "power2.out"; // a única curva da página (= cubic-bezier(.215,.61,.355,1) no CSS)

  // fala da Dra.: cada palavra ganha uma máscara
  document.querySelectorAll("[data-palavras]").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="w"><span class="wi">${w}</span></span>`).join(" ");
  });

  // rolagem suave
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // sequência de quadros num canvas, baixada em passadas (8 em 8 → 4 → 2 → 1)
  const sequencia = (canvas, total, url) => {
    const ctx = canvas.getContext("2d"), quadros = new Array(total);
    let atual = 0, pedido = false;
    const desenha = i => {
      const img = quadros[i];
      if (!img || !img.complete || !img.naturalWidth) return false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return true;
    };
    const perto = i => { for (let d = 0; d < total; d++) { if (desenha(i - d) || desenha(i + d)) return; } };
    const carrega = i => {
      if (quadros[i]) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { if (i === atual) desenha(i); };
      img.src = url(i);
      quadros[i] = img;
    };
    return {
      baixa() {
        if (pedido) return;
        pedido = true;
        [8, 4, 2, 1].forEach((passo, n) => setTimeout(() => {
          for (let i = 0; i < total; i += passo) carrega(i);
        }, n * 500));
      },
      mostra(p) {
        atual = Math.round(p * (total - 1));
        if (!desenha(atual)) perto(atual);
      }
    };
  };
  const num = i => String(i + 1).padStart(3, "0");

  const mm = gsap.matchMedia();

  // 1 · entrada: o corredor se alarga, o título se parte para as margens
  // (Halo Dental: mídia emoldurada que abre por clip-path inset)
  const tour = sequencia(document.getElementById("tour"), 113, i => `assets/seq/e${num(i)}.webp`);
  tour.baixa();
  mm.add({ largo: "(min-width: 861px)", estreito: "(max-width: 860px)" }, c => {
    const { largo } = c.conditions;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.4 }
    });
    const s = { p: 0 };
    tl.to(s, { p: 1, ease: "none", duration: 1, onUpdate: () => tour.mostra(s.p) }, 0)
      .to(".corredor", { clipPath: "inset(0% 0% 0% 0%)", ease: CURVA, duration: 0.26 }, 0.02)
      .to(".pt-e", largo ? { xPercent: -60, opacity: 0, ease: CURVA, duration: 0.24 } : { xPercent: -30, opacity: 0, ease: CURVA, duration: 0.2 }, 0.04)
      .to(".pt-d", largo ? { xPercent: 60, opacity: 0, ease: CURVA, duration: 0.24 } : { xPercent: 30, opacity: 0, ease: CURVA, duration: 0.2 }, 0.04)
      .to(".role", { opacity: 0, duration: 0.05 }, 0.02)
      .fromTo(".leg-1", { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: CURVA, duration: 0.12 }, 0.28)
      .to(".leg-1", largo ? { opacity: 0.999, duration: 0.01 } : { opacity: 0, y: -24, ease: CURVA, duration: 0.1 }, 0.56)
      .fromTo(".leg-2", { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: CURVA, duration: 0.12 }, 0.64);
    gsap.from(".pt-e", { y: 50, opacity: 0, duration: 1.2, ease: CURVA, delay: 0.1 });
    gsap.from(".pt-d", { y: 50, opacity: 0, duration: 1.2, ease: CURVA, delay: 0.2 });
  });

  // 2 · a pergunta da Dra.: palavras sobem por máscara, o retrato desliza
  // (LAVA Dental: título revelado palavra a palavra, com atraso por palavra)
  gsap.utils.toArray("[data-palavras]").forEach(el => {
    gsap.fromTo(el.querySelectorAll(".wi"), { yPercent: 115 }, {
      yPercent: 0, ease: CURVA, stagger: 0.12, duration: 0.6,
      scrollTrigger: { trigger: el, start: "top 88%", end: "top 38%", scrub: 0.5 }
    });
  });
  gsap.fromTo(".doutora-retrato video", { yPercent: -10 }, {
    yPercent: 0, ease: "none",
    scrollTrigger: { trigger: ".doutora", start: "top bottom", end: "bottom top", scrub: true }
  });

  // 3 · bio: cada linha abre por máscara lateral
  gsap.utils.toArray(".bl").forEach((l, i) => {
    gsap.fromTo(l, { clipPath: "inset(0% 100% 0% 0%)", x: -24 }, {
      clipPath: "inset(0% 0% 0% 0%)", x: 0, duration: 1.3, ease: CURVA, delay: i * 0.1,
      scrollTrigger: { trigger: l, start: "top 86%", once: true }
    });
  });

  // 4 · tratamentos: as salas rolam quadro a quadro e o índice acompanha
  const salas = sequencia(document.getElementById("salas"), 131, i => `assets/sal/s${num(i)}.webp`);
  new IntersectionObserver((es, o) => {
    if (es.some(e => e.isIntersecting)) { salas.baixa(); o.disconnect(); }
  }, { rootMargin: "150% 0px" }).observe(document.querySelector(".salas"));
  const itens = gsap.utils.toArray(".indice li");
  // instante em que cada rótulo entra no reel (s), medido quadro a quadro; o trecho vai de 11,5 s a 33,4 s
  const INICIO = 11.5, DURA = 21.9;
  const ENTRADAS = [11.5, 12.5, 14, 15.5, 17, 18.5, 20.25, 21.75, 23.5, 25].map(t => (t - INICIO) / DURA);
  const FIM_INDICE = (26.5 - INICIO) / DURA;
  const st = { p: 0 };
  gsap.timeline({
    scrollTrigger: { trigger: ".salas-trilho", start: "top top", end: "bottom bottom", scrub: 0.4 }
  })
    .to(st, {
      p: 1, ease: "none", duration: 1,
      onUpdate: () => {
        salas.mostra(st.p);
        let a = -1;
        if (st.p < FIM_INDICE) ENTRADAS.forEach((e, i) => { if (st.p >= e) a = i; });
        itens.forEach((li, i) => li.classList.toggle("on", i === a));
      }
    }, 0)
    .to(".indice", { opacity: 0, y: -30, ease: CURVA, duration: 0.05 }, FIM_INDICE)
    .fromTo(".frase-1", { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: CURVA, duration: 0.06 }, 0.73)
    .to(".frase-1", { opacity: 0, y: -40, ease: CURVA, duration: 0.05 }, 0.84)
    .fromTo(".frase-2", { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: CURVA, duration: 0.06 }, 0.89);

  // 6 · confiança: colunas em velocidades diferentes (só onde há colunas)
  mm.add("(min-width: 861px)", () => {
    [[".col-google", 60], [".col-avaliacao", -90], [".col-caneca", 130]].forEach(([q, y]) => {
      gsap.fromTo(q, { y }, {
        y: -y, ease: "none",
        scrollTrigger: { trigger: ".confianca", start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  });

  // 7 · cuidar de si: linhas sobem por máscara
  gsap.fromTo(".ln>span", { yPercent: 110 }, {
    yPercent: 0, duration: 1.2, ease: CURVA, stagger: 0.1,
    scrollTrigger: { trigger: ".cuidar", start: "top 80%", once: true }
  });

  // 8 · convite: abre em círculo, como o símbolo da marca
  // (LAVA Dental: bloco que se revela do centro por clip-path)
  gsap.fromTo(".convite", { clipPath: "circle(9% at 50% 34%)" }, {
    clipPath: "circle(150% at 50% 34%)", ease: "none",
    scrollTrigger: { trigger: ".convite", start: "top 92%", end: "top 8%", scrub: 0.4 }
  });

  // entradas de bloco
  gsap.utils.toArray(".titulo, .lista details, .perguntas-midia, .convite-midia").forEach(el => {
    gsap.from(el, { opacity: 0, y: 28, duration: 1.1, ease: CURVA, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
