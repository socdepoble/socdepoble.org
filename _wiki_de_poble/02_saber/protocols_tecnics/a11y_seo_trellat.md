---
type: document
status: canonic
description: Contracte verificable d’accessibilitat, SEO i rendiment per a les interfícies públiques.
tags:
  - maquina
---
# A11y i SEO amb Trellat

Guia de qualitat per a l’accessibilitat, el SEO tècnic i el rendiment de les interfícies públiques. No és un executor automàtic: cada afirmació de compliment necessita evidència del codi i de les proves, i el text per si sol no certifica cap pantalla.

## Quan s’aplica

- En crear o modificar una ruta pública, component interactiu, formulari o navegació.
- En canviar contingut indexable, metadades socials o dades estructurades.
- En homologar una vista als navegadors del Baseline 2022 (Safari/iOS 16, Chrome 100, Firefox 100).

## Accessibilitat

1. Usa HTML semàntic abans que rols ARIA: `button`, `nav`, `main`, `form`, `label` i encapçalaments amb jerarquia comprensible.
2. Tot control ha de funcionar amb teclat, mostrar el focus i tindre un nom accessible en la llengua visible de la interfície.
3. Cap control interactiu té una àrea tàctil menor que `var(--sdp-touch)`, i el text de lectura no baixa de 16 px. Els tokens semàntics `--sdp-*` de `src/css/tokens.css` són la font de veritat visual.
4. El color no pot ser l’únic indicador d’estat. Contrast, errors i missatges s’han de comprovar sobre el resultat renderitzat.
5. Evita l’scroll infinit quan impedisca orientar-se o arribar al final. Si hi ha llistes llargues, ofereix paginació, càrrega explícita o una alternativa equivalent.
6. Una interacció dona feedback perceptible sense dependre només de `hover`.

## SEO tècnic

1. El contingut essencial ha d’existir en un DOM comprensible i no dependre d’una cascada de JavaScript client per adquirir significat.
2. Cada ruta pública defineix títol i descripció propis. Les URL indexables declaren la canònica quan puga haver-hi duplicats.
3. Open Graph i altres metadades socials s’usen en pàgines compartibles i es validen amb URL absolutes desplegables.
4. JSON-LD només s’afegeix quan correspon a una entitat real i les dades visibles sostenen el marcatge. No s’inventa Schema.org per omplir camps.
5. Les imatges porten dimensions conegudes i text alternatiu segons la seua funció; la càrrega diferida només s’aplica fora del contingut inicial visible.

## Rendiment

Els navegadors del Baseline 2022 són el tribunal pràctic. La doctrina d’un dispositiu de referència únic (l’A10) es va retirar amb l’[[ADR-2026-08-ONLINE-FIRST]], i per això cada mesura declara el perfil de dispositiu on s’ha pres. LCP, INP, CLS, pes transferit i memòria són mètriques a mesurar, no garanties documentals. Qualsevol llindar de release ha de declarar dispositiu o perfil, xarxa, nombre de mostres i ferramenta; no es pot convertir una estimació puntual en una promesa universal.

## Evidència mínima d’homologació

- Inspecció de semàntica, noms accessibles i ordre de focus.
- Prova manual només amb teclat i, per a fluxos crítics, amb lector de pantalla.
- Auditoria automàtica si la ferramenta està instal·lada; no substituïx la prova manual.
- Build correcte i mesura de rendiment sobre una configuració reproduïble.
- Registre dels errors pendents sense declarar «100% accessible» o «SEO perfecte».

## Vincles

- [[00_index]]
- [[00_portada]]
- [[00_arquitectura_tecnica_unificada]]
- [[index_trellat]]
- [[ADR-2026-08-ONLINE-FIRST]]
