# Encaixe da abertura em vídeo — Dra. Katia Miyoshi

## Estado em 24/09/2026
O agente da Station **não entregou os clipes**. A pasta
`~/steve-site/work/station/katia/` existe, mas `clipes/`, `pranchas/`,
`quadros/` e `logs/` estão **vazias**. Não há `DIRECAO.md`.

Por isso a abertura roda hoje **só com pôster**: o `scrub-engine` aceita
seção sem `clip` (`loadClip()` retorna cedo quando `!s.clip`) e faz a
travessia por dissolução entre os `still`. Isso é comportamento nativo do
motor, não gambiarra.

## O motor é o da casa, sem terceira versão
`scrub-engine.js` aqui é **cópia byte a byte** de
`~/esteira-sites/previa/saida/_mundos/pet/scrub-engine.js`.

    sha256 = 3db45068aa34f06f281d38a7d5822e43664f117042e98654137550f93caf0d2a

Confira antes de mexer:

    shasum -a 256 abertura/scrub-engine.js

## Para ligar o vídeo quando os clipes chegarem
1. Copie os `.mp4/.webm` de `~/steve-site/work/station/katia/clipes/` para `abertura/`.
2. Em `cadeia.json`, troque `"clip": null` pelo nome do arquivo desktop e
   `"clipMobile": null` pelo encode leve de celular (720p, `-g 4`).
3. Se houver clipes de ligação entre as cenas, ponha-os em `connectors`
   (o vetor tem de ter `sections.length - 1` posições).
4. Troque os `still` pelos **primeiros quadros reais** de cada clipe, para
   o pôster não piscar uma imagem diferente da do vídeo.

Nada mais precisa mudar: `index.html` desta pasta lê o `cadeia.json`.

## Por que a abertura não está embutida no site principal
O motor é **tomada de página inteira**: `.sw-sky`, `.sw-stage`,
`.sw-copylayer`, `.sw-topbar` e `.sw-route` são todos `position:fixed`.
Montá-lo dentro do `index.html` do site faria as camadas fixas vazarem por
cima do conteúdo do documento. Então a abertura mora nesta rota própria, e
o site principal usa a **prancha estática** no lugar dela — que é
exatamente o que a instrução mandou fazer enquanto os clipes não chegam.
