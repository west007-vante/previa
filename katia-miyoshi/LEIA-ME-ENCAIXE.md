# Dra. Katia Miyoshi — site em página única

Uma URL: `https://west007-vante.github.io/previa/katia-miyoshi/`
`/abertura/` deixou de ser página e virou **redirecionamento** para a raiz, para
não existir duas versões vivas do mesmo site.

## A travessia — como a cadeia vira site sem corte

A cadeia de vídeo é a **entrada** do site, na mesma página e na mesma rolagem.
A passagem tem cinco tempos, todos presos à posição de rolagem:

| # | Onde | O que acontece |
|---|---|---|
| 1 | `0 → fimCadeia` | as 3 cenas rolam scrubadas pelo motor |
| 2 | últimos 0,5 vh | o `#palco` entra **por baixo** do vídeo |
| 3 | `fimCadeia` | o vídeo zera; fica o `#palco`. A troca é invisível |
| 4 | +1 vh | a legenda da cena sai; a sala fica parada (o respiro) |
| 5 | `.pouso` | o nome sobe no terço esquerdo; o véu vira página |

**O `#palco` é o ÚLTIMO QUADRO REAL da cena 3**, extraído com
`ffmpeg -sseof -0.05 -i cena3.mp4 -vframes 1`, servido com o **mesmo**
`object-fit:cover` / `object-position:center 42%` do motor. Vídeo e imagem são o
mesmo pixel na mesma posição: quando um sai e o outro fica, não há o que piscar.

### Por que NÃO usei `repouso_k3_sala_1672x941.png`
A entrega da Station traz esse quadro "de repouso", e a instrução era usá-lo.
**Medi antes de usar** e ele **não é** o último quadro da cena 3 — é um
enquadramento mais aberto da mesma sala:

    PSNR 20,57 · SSIM 0,669   (o limiar de costura da própria Station é ~36 / 0,93)

Cruzar o vídeo para ele produziria exatamente o pulo que o pedido mandava evitar.
O último quadro real entrega a mesma intenção (fundo estático, terço esquerdo
vazio para o nome) com costura pixel a pixel — e pesa **48 KB** contra 154 KB.

## Três armadilhas do motor que custaram caro

1. **`crossfade: 0` apaga a tela.** O motor faz `smooth(1 - outside/fade)` com
   `fade = crossfade * vh`; zero vira divisão por zero, `opacity: NaN`, e **todas**
   as cenas somem. Use `0.01` — a ~800 px de viewport são ~8 px de sobreposição
   (corte seco), contra ~96 px do padrão `0.12`. O mount trava com `Math.max(0.01, …)`.

2. **A pista tem 1 vh de sobra no fim.** `track.style.height = totalW*vh + vh`
   ("so the last flight completes"). Os **segmentos acabam 1 vh antes** da altura
   da pista. Usar `offsetHeight` direto deixava 1 vh de tela branca no meio da
   travessia. O certo é `fimCadeia = raiz.offsetHeight - vh`.

3. **`seedParticles()` roda mesmo com `atmosphere:false`.** A opção só tira o
   gradiente e o brilho. As partículas saem por CSS (`.sw-particles{display:none}`).

E uma do site: **`offsetTop` do `#pouso` é relativo ao `<main>`** (que é
`position:relative`), não à página — dava `0` e derrubava o palco ainda dentro da
cadeia. Usar `getBoundingClientRect().top + scrollY`.

E outra: as seções carregam `.env` (máx. 1240 px), então **o fundo delas não cobre
a viewport** e a sala vazava pelas laterais. Por isso existe o invólucro
`.corpo`, full-bleed, com o fundo da página.

## Camadas (o motor vai até 60)

    motor: sky 0 · stage 10 · copy 20 · hint 30 · route 40 · topbar 50
    #palco 250 · <main> 300 · .topo 500 · .aviso 600 · marca d'água 9000

## Travas que não podem cair

1. **`crossfade` nunca 0** (ver acima).
2. **`AMBIENTE RECRIADO — NÃO É FOTO DO CONSULTÓRIO`** fica visível enquanto houver
   imagem gerada na tela, e só sai quando o véu do pouso vira papel sólido (74 %).
3. **O nome entra no fim.** Lei 3.5: nenhuma cena da cadeia traz "Dra. Katia
   Miyoshi", e o cabeçalho só aparece quando o nome pousa. Não ponha a marca no
   canto desde o primeiro quadro.
4. **Nada apresenta as cenas como o espaço real dela.** São ambiente recriado; a
   foto real entra na galeria de `midia/galeria/`, marcada como foto.
5. **Texto sobre vídeo tem fundo sólido a 73 %** (Biblioteca 8.6) — é o painel do
   `.pouso__copy`.

## Peso medido no celular (375×812)

| | |
|---|---|
| Primeira pintura | **625,7 KB** · 14 requisições (só `cena1.mp4`) |
| Rolando a página inteira | **1.689,4 KB** · 17 requisições |

A fila do motor busca **um clipe por vez**; `repouso.jpg` só baixa quando a
travessia se aproxima. O conteúdo abaixo é HTML estático — não espera vídeo.

## Motor
`scrub-engine.js` é cópia byte a byte de
`~/esteira-sites/previa/saida/_mundos/pet/scrub-engine.js`:

    sha256 = 3db45068aa34f06f281d38a7d5822e43664f117042e98654137550f93caf0d2a
