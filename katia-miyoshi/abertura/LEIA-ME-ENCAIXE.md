# Abertura em vídeo — Dra. Katia Miyoshi

## Estado: cadeia COMPLETA (24/09/2026)

As três cenas vieram de `~/steve-site/work/station/katia/entrega/` e estão ligadas.

| Cena | Arquivo | Pôster | Duração | Quadros |
|---|---|---|---|---|
| 1 — A luz | `cena1.mp4` 447 KB | `cena1_poster.jpg` 30 KB | 3,375 s | 81 |
| 2 — O vão | `cena2.mp4` 551 KB | `cena2_poster.jpg` 21 KB | 3,375 s | 81 |
| 3 — A passagem→sala | `cena3.mp4` 466 KB | `cena3_poster.jpg` 46 KB | 3,375 s | 81 |

Todas H.264, 832×480, 24 fps, **sem trilha de áudio**. A cadeia inteira dura **10,125 s**.

QA da Station, sem afrouxar limiar (`logs/qa.jsonl`): nitidez mínima 0,397 / 0,926 / 0,882 ·
salto de cor máximo 0,083 / 0,085 / 0,030 · costura 12 de 12 medidas batendo ou superando a
cadeia paga. A cena 3 que antes reprovava por derretimento foi refeita — a causa raiz eram os
quadros-chave (K2 com maca plana, K3 com cadeira reclinável: salas diferentes), não o modelo.

## Duas leis que não podem ser afrouxadas

**1. `crossfade: 0`.** O último quadro de cada cena **é** o primeiro da seguinte, medido em
PSNR/SSIM. Qualquer dissolução entre elas destrói a emenda que a fábrica pagou GPU para
construir. `cadeia.json` traz `"crossfade": 0` e o mount respeita esse valor. **Não volte para
o padrão 0.12 do motor.**

**2. `.mp4`, não `.webm`.** O motor busca **um** arquivo por cena (`fetch` → Blob), então não há
`<source>`. VP9/WebM não é confiável no Safari/iOS, então entra o H.264. Os `.webm` irmãos
continuam em `entrega/` para quem for servir com `<source>` fora do motor.

## TRAVA DE LEGENDA — vale para o site inteiro

A Station **não gerou a fachada do prédio, de propósito**. Fachada gerada publicada sob o
endereço real ("Av. Braz Olaia Acosta, 727 — Sala 108") afirmaria "este é o prédio dela", e não
é. As cenas são **registro, não documento**: luz, material e soleira — sem placa, sem rua, sem
identidade de lugar.

**Por isso a abertura não pode ser legendada como o espaço real dela.** Nada de "nossa clínica",
"nosso consultório", "nosso espaço", "conheça nossa estrutura" — em legenda, `alt`, `title` ou
`aria-label`. A página traz o aviso explícito *"Ambiente recriado para a abertura — não é foto do
consultório"*.

As fotos reais entram na **galeria do site** (`midia/galeria/`), marcadas como foto — são as 119
do perfil do Google dela.

## Celular
Sem encode mobile separado: o motor cai no arquivo de desktop, que já é pequeno (447–551 KB).
Ele carrega **um clipe por vez** no celular e usa janela de prefetch curta, então a cena que
está na tela chega primeiro. Lei de 23/09 (`scroll-world-celular-e-zoopet`): clipe pesado mata a
animação no 3G. **Se trocar por versão maior, meça no 3G antes.**

## O motor é o da casa, sem terceira versão
`scrub-engine.js` é cópia byte a byte de
`~/esteira-sites/previa/saida/_mundos/pet/scrub-engine.js`:

    sha256 = 3db45068aa34f06f281d38a7d5822e43664f117042e98654137550f93caf0d2a

## Por que a abertura não está embutida no site principal
O motor é **tomada de página inteira** (`.sw-sky`, `.sw-stage`, `.sw-copylayer`, `.sw-topbar`,
`.sw-route` são todos `position:fixed`). Montá-lo dentro do `index.html` faria as camadas fixas
vazarem por cima do documento. Por isso a abertura mora nesta rota e o site usa a prancha
geométrica — que não afirma lugar nenhum.
