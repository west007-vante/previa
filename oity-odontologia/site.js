(() => {
  const ZAP = "https://wa.me/5516992161691?text=" +
    encodeURIComponent("Olá! Vi o site da Oity Odontologia e gostaria de agendar uma avaliação.");
  document.querySelectorAll("[data-zap]").forEach(a => { a.href = ZAP; a.target = "_blank"; a.rel = "noopener"; });

  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // cada palavra ganha uma máscara (.pl) e um miolo que sobe (.pi)
  document.querySelectorAll("[data-palavras]").forEach(el => {
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="pl" aria-hidden="true"><span class="pi">${w}</span></span>`).join(" ");
  });

  if (calmo || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("anima");

  // a única curva da página (Noho: CustomEase "0.17, 0.17, 0.0, 1.0")
  let CURVA = "expo.out";
  if (window.CustomEase) { gsap.registerPlugin(CustomEase); CustomEase.create("oity", "0.17,0.17,0,1"); CURVA = "oity"; }

  // rolagem suave
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const mm = gsap.matchMedia();
  mm.add({ largo: "(min-width: 861px)", estreito: "(max-width: 860px)" }, c => {
    const largo = c.conditions.largo;

    // 1 · entrada: as metades do título saem pelas margens, a janela redonda cresce
    gsap.from(".m-a", { x: -70, opacity: 0, duration: 1.5, ease: CURVA, delay: 0.1 });
    gsap.from(".m-b", { x: 70, opacity: 0, duration: 1.5, ease: CURVA, delay: 0.2 });
    gsap.from(".olho", { opacity: 0, duration: 1.7, ease: CURVA, delay: 0.05 });

    const te = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".entrada", start: "top top", end: "bottom bottom", scrub: 0.5 }
    });
    te.to(".m-a", { xPercent: -125, duration: 0.42 }, 0.02)
      .to(".m-b", { xPercent: 125, duration: 0.42 }, 0.02)
      .to(".entrada-topo .sublinha, .entrada-pe", { opacity: 0, duration: 0.08 }, 0.04)
      .to(".olho-janela", { clipPath: "circle(50% at 50% 50%)", duration: 0.5, ease: "power2.inOut" }, 0)
      .to(".olho-janela img", { scale: 1, duration: 0.5, ease: "power2.inOut" }, 0)
      .to(".olho", largo ? { x: "21vw", y: "8vh", duration: 0.5, ease: "power2.inOut" } : { y: "-13vh", duration: 0.5, ease: "power2.inOut" }, 0.05)
      .to(".entrada-frase .pi", { y: 0, yPercent: 0, stagger: 0.012, duration: 0.14, ease: "power3.out" }, 0.46)
      .to(".frase-sub", { opacity: 1, duration: 0.1 }, 0.66)
      .to(".entrada-frase .botao", { opacity: 1, duration: 0.1 }, 0.72);

    // 2 · manifesto: palavras sobem por máscara, do desfoque ao foco (Moto Finance)
    gsap.utils.toArray(".manifesto [data-palavras]").forEach(p => {
      const de = largo ? { yPercent: 110, filter: "blur(10px)" } : { yPercent: 110 };
      const para = largo ? { yPercent: 0, filter: "blur(0px)" } : { yPercent: 0 };
      gsap.fromTo(p.querySelectorAll(".pi"), de, {
        ...para, stagger: 0.035, duration: 0.9, ease: CURVA,
        scrollTrigger: { trigger: p, start: "top 86%", once: true }
      });
    });

    // 3 · ortodontia: a foto entra por cortina e sobe mais devagar que o texto
    gsap.utils.toArray(".faixa-foto").forEach(f => {
      gsap.fromTo(f, { clipPath: "inset(0% 0% 100% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: CURVA,
        scrollTrigger: { trigger: f, start: "top 85%", once: true }
      });
      gsap.fromTo(f, { y: largo ? 50 : 22 }, {
        y: largo ? -50 : -22, ease: "none",
        scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
    gsap.utils.toArray(".faixa-texto > *").forEach(el => {
      gsap.from(el, { opacity: 0, y: 30, duration: 1.2, ease: CURVA, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });

    // 4 · com estilo: cada coluna anda numa velocidade (White Desert, data-scroll-speed)
    const curso = largo ? 150 : 46;
    gsap.utils.toArray(".col").forEach(col => {
      const v = parseFloat(col.dataset.vel || "0.5");
      gsap.fromTo(col, { y: v * curso }, {
        y: -v * curso, ease: "none",
        scrollTrigger: { trigger: ".colunas", start: "top bottom", end: "bottom top", scrub: true }
      });
      const foto = col.querySelector(".col-foto");
      gsap.fromTo(foto, { clipPath: "inset(100% 0% 0% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: CURVA,
        scrollTrigger: { trigger: col, start: "top 88%", once: true }
      });
      gsap.fromTo(foto.querySelector("img"), { scale: 1.18 }, {
        scale: 1, duration: 1.9, ease: CURVA,
        scrollTrigger: { trigger: col, start: "top 88%", once: true }
      });
    });

    // 5 · casos: as três cartas saem de trás da carta do meio e abrem em leque
    const cartas = gsap.utils.toArray(".carta");
    if (largo) {
      const tc = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".leque", start: "top 100%", end: "top 48%", scrub: 0.5 }
      });
      tc.fromTo(cartas[0], { xPercent: 100, rotate: -5 }, { xPercent: 0, rotate: 0 }, 0)
        .fromTo(cartas[2], { xPercent: -100, rotate: 5 }, { xPercent: 0, rotate: 0 }, 0)
        .fromTo(cartas[1], { scale: 0.94 }, { scale: 1 }, 0);
    } else {
      cartas.forEach(carta => gsap.from(carta, {
        opacity: 0, y: 40, duration: 1.2, ease: CURVA,
        scrollTrigger: { trigger: carta, start: "top 88%", once: true }
      }));
    }

    // 7 · convite: o ponto do logo cresce de baixo até virar a tela
    gsap.fromTo(".convite", { clipPath: "circle(0% at 50% 100%)" }, {
      clipPath: "circle(150% at 50% 100%)", ease: "none",
      scrollTrigger: { trigger: ".convite", start: "top bottom", end: "top 15%", scrub: 0.4 }
    });
  });

  // títulos de seção: as palavras sobem por máscara uma vez
  gsap.utils.toArray(".estilo .t-xl, .casos .t-xl, .trata .t-l, .convite .t-xl").forEach(el => {
    gsap.fromTo(el, { yPercent: 35, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, {
      yPercent: 0, opacity: 1, clipPath: "inset(0% 0% -25% 0%)", duration: 1.4, ease: CURVA,
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
  gsap.utils.toArray(".lista details, .google, .col figcaption").forEach(el => {
    gsap.from(el, { opacity: 0, y: 26, duration: 1.1, ease: CURVA, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
  });

  // botão flutuante só depois da entrada
  ScrollTrigger.create({
    trigger: ".manifesto", start: "top 80%",
    onEnter: () => document.querySelector(".zap-flutua").classList.add("on"),
    onLeaveBack: () => document.querySelector(".zap-flutua").classList.remove("on")
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
