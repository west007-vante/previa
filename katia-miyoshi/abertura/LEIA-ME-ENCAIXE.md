# Encaixe da abertura em vídeo — Dra. Katia Miyoshi

## Estado medido em 24/09/2026

A Station entregou **parcial**: das três cenas, **uma** está servível.
Fonte dos números: `~/steve-site/work/station/katia/logs/laudos.jsonl`.

| Cena | Laudo do portão | Arquivo servível | Situação aqui |
|---|---|---|---|
| 1 — A luz | `aprovado: true` · `costura_ok: true` · `derretendo: false` | `clipes/cena1.webm` | **LIGADA** (`cena1.mp4` + `cena1.webm` + pôster) |
| 2 — O vão | `aprovado: true` | **nenhum** | pôster geométrico |
| 3 — A passagem | `aprovado: FALSE` | **nenhum** | pôster geométrico |

**Por que a 2 não entrou:** o laudo aprovou o render
`conector/cena2_wan22i2v_s7_p4.webm`, mas esse arquivo **não existe mais**. O que sobrou é
`reprovados/cena2_v1_k2antigo.webm`, feito com o keyframe k2 antigo — e o próprio
`ENCAIXE.md` da Station manda não servir nada de `reprovados/`.

**Por que a 3 não entrou:** ela **reprovou** de verdade — `derretendo: true`,
`cor_salto_max 0.324` (as aprovadas ficam em ~0.08) e `ssim_vizinho_min 0.374`.
Um v2 começou às 05:14:57 e o `run_cena3.log` ficou com **0 bytes**: o agente morreu no meio.

A Station também descreve uma pasta `entrega/` (com `.mp4`, pôsteres conformados e `QA.md`)
que **nunca chegou a ser criada**. Os únicos vídeos no disco são os crus a 16 fps.

## O que foi feito com a cena 1
O cru (`VP9 · 832×480 · 16 fps · 5,06 s`) foi transcodificado aqui, sem custo e sem nuvem,
para o contrato de ativo do motor (`crf 20`, `-g 8`, `+faststart`, sem áudio):

    cena1.mp4         773 KB   H.264 — é o que o motor carrega
    cena1.webm        943 KB   VP9 original, para quem servir com <source>
    cena1_poster.jpg   23 KB   primeiro quadro do clipe

O motor busca **um** arquivo por cena (`fetch` → Blob), então não há `<source>`: entra o
`.mp4`, porque **VP9/WebM não é confiável no Safari/iOS** (aviso da própria Station).

## A emenda: `crossfade: 0`
O `ENCAIXE.md` da Station é explícito — o último quadro de cada cena **é** o primeiro da
seguinte, medido em PSNR/SSIM. Qualquer dissolução entre elas destrói essa emenda.
Por isso `cadeia.json` traz `"crossfade": 0` e o mount respeita esse valor.
**Não volte para o padrão de 0.12 quando ligar as cenas 2 e 3.**

## Para completar a cadeia
1. Rodar de novo a cena 3 na Station até `aprovado: true` (o v2 ficou pela metade).
2. Recuperar ou refazer o render aprovado da cena 2.
3. Conformar as três (a pasta `entrega/` que o `ENCAIXE.md` descreve) e copiá-las para cá.
4. Em `cadeia.json`, preencher `clip` e `clipMobile` (720p, `-g 4`) de cada cena.
5. Trocar cada `still` pelo **primeiro quadro real** do respectivo clipe.

## O motor é o da casa, sem terceira versão
`scrub-engine.js` é **cópia byte a byte** de
`~/esteira-sites/previa/saida/_mundos/pet/scrub-engine.js`:

    sha256 = 3db45068aa34f06f281d38a7d5822e43664f117042e98654137550f93caf0d2a

## Por que a abertura não está embutida no site principal
O motor é **tomada de página inteira**: `.sw-sky`, `.sw-stage`, `.sw-copylayer`, `.sw-topbar`
e `.sw-route` são todos `position:fixed`. Montá-lo dentro do `index.html` faria as camadas
fixas vazarem por cima do documento. Então a abertura mora nesta rota, e o site usa a
prancha estática — que é o que a instrução mandou fazer enquanto a cadeia não fecha.

## Proibições que vêm com o material (da Station, mantidas)
1. **Não legendar a abertura como foto da clínica dela.** É ambiente gerado, não registro do
   lugar real. Sem "nossa clínica", sem "nossa fachada". A foto real entra na galeria do site,
   marcada como foto — as 119 do perfil do Google.
2. **Nenhum rosto, nenhum antes-e-depois**, em lugar nenhum.
3. **Inter, Roboto, Arial e fonte de sistema são proibidas.** Aqui se usa Fraunces + Figtree.
