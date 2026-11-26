---
type: skill
status: actiu
description: Tractor documental per garantir el format llegible (jerarquia H1-H6) i l'escaneig ràpid amb negretes en tots els textos del sistema.
name: core-llegibilitat-text
tags:
  - disseny
  - tractors
triggers_on:
  - redactar text
  - formatar contingut
  - revisar pàgina
  - copy
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - .agents/skills/sdp-universal-page/SKILL.md
  - _wiki_de_poble/00_index.md
contracte.escriu:
  - _wiki_de_poble/00_index.md
motors:
  - tooling/gates/tractor-maquetacio-canonica.mjs
---
# Tractor de llegibilitat i flux de text (Pedra Seca)

Aquest tractor governa la llegibilitat de components, HTML i pàgines pintades a l'aplicació. El fitxer Markdown font seguix [[core-maquetacio-markdown/SKILL|core-maquetacio-markdown]], l'anatomia de pàgina seguix [[sdp-universal-page/SKILL|sdp-universal-page]] i l'encaminament documental seguix [[core-taxonomia-estricta/SKILL|core-taxonomia-estricta]].

## 1. Flux lliure del text i redacció humana

No es pot limitar artificialment l'amplada del text amb contenidors que tallen la lectura a mitja pantalla (`--sdp-measure` prohibit en prosa per `tractor-maquetacio-canonica.mjs`). El text ha de **fluir de forma natural ocupant tot l'espai disponible**, respectant només els marges del contenidor de Pedra Seca.

La prosa pública i de la Wiki es redacta sempre per a **persones humanes amb to càlid, amable i didàctic**, mai amb estil sec, telegràfic o esquemàtic de màquina. Val sempre la **Regla Didàctica d'Or**: *«Un paràgraf més mai està de més quan és didàctic.»*

## 2. Regla d'or editorial (H1 → H2 centrat → Entradilla → H3..H6)

Tota `UniversalPage` i publicació de Sóc de Poble respecta aquesta escala tipogràfica i semàntica completa d'`H1` a `H6` (`IDEA-319` i `IDEA-344`):

- **Capçalera de pàgina (`H1` → `H2` centrat → `.lead`):** `PageFrame` pinta un únic **`H1`** dins del bloc blanc superior, seguit sobre el fons de lectura per l'**`H2` centrat** (subtítol breu en taronja) i l'**Entradilla (`.lead`)** centrada que resumeix tot el propòsit de la pàgina.
- **Cos ordinari (`H3` a `H6` alineats a l'inici):** Dins del cos del document, **totes les seccions principals comencen en `H3`** alineat a l'inici amb filet inferior (inclòs el `Quadre de Comandament ISO` i cada `##` del cos Markdown). Els subapartats i fitxes empren **`H4`**, **`H5`** i **`H6`** sense saltar cap nivell ni disfressar un `H3` amb `class="h2"`.
- **Excepcionalitat estricta de l'`H2` dins del cos (`H2` → `.lead` → `H3`):** Només es pot posar un **`H2` centrat dins del cos** quan cal obrir un gran bloc temàtic excepcional, i **sempre ha d'anar seguit obligatòriament de la seua pròpia entradilla (`.lead`) i tot seguit d'un `H3`**. Un `H2` centrat nu sense `.lead` i `H3` és una infracció bloquejada per `tractor-maquetacio-canonica.mjs` (`MC1` en `PAGE_COPY` i `MC2` en JSX/HTML).
- **Llistes numerades vs. encapçalaments:** Reserva `H3–H6` per a seccions amb contingut propi que entren a l'Índex de la Barra Blava. Els passos seqüencials van en llista numerada `<ol>`, sense convertir-los en títols només pel número.

## 3. Escanejabilitat visual a salts de vista (6 a 8 negretes per paràgraf)

Sóc de Poble està pensat perquè qualsevol veí puga comprendre un text tant en lectura calmada com en **lectura diagonal a salts de vista**.

- En cada paràgraf de prosa desenvolupada (4 o 5 línies), és **obligatori marcar entre 6 i 8 paraules o sintagmes breus en negreta** (`<strong>` / `**...**`).
- **Norma d'or ergonòmica:** Si la persona lectora llig únicament els sintagmes en negreta saltant d'un paràgraf al següent, ha d'entendre el **missatge complet i fidel de tota la pàgina** d'un sol colp d'ull.

## 4. Algoritme lèxic «de poble vs. del poble» i «utilitza vs. usa»

Abans d'escriure o revisar qualsevol entradeta, subtítol o paràgraf editorial, aplica aquest filtre de tres passos (`IDEA-157` · Regla del Cosí Guillermo):

1. **Substitució d'`usa / usen` per `utilitza / utilitzen` (o `fa servir`):** En valencià viu de les nostres comarques escrivim sempre **«La IAIA utilitza...»**, mai *«La IAIA usa...»*.
2. **Distinció `de poble` vs. `del poble` (test «De quin poble?»):** **`de poble`** (sense article) és el concepte d'identitat i cultura a tot el sistema (`Sóc de Poble`, `Wiki de Poble`, `eines de poble`, `veu de poble`, `vida de poble`). **`del poble`** només és vàlid quan el context assenyala un municipi físic concret (ex. La Torre de les Maçanes) que respon *«de quin poble?»*.
3. **Precisió entre `imaginari` i `imatges`:** Quan parlem de metàfores rurals o il·lustracions arquetípiques (Bruguera/Ibáñez), escrivim sempre **«l'imaginari de poble»**, mai *«les imatges del poble»*.

## 5. Mesa editorial i safata de propostes del Node 0

Les **4 IAIAs del Node 0 (`Mac mini M4`)** actuen com a **Mesa de Revisió Editorial** (`IDEA-164` i `IDEA-344`):

1. **Rols 4×4 (`revisorEditorialNode0.js`):** `iaia-maria:latest` vetla pel to humà, el Trellat i la llei `de poble`; `qwen3:8b` polix ortotipografia i sintaxi; `qwen2.5-coder:14b` verifica jerarquia `H1→H2→.lead→H3..H6`, duplicitats i les **6–8 negretes**; `nemotron-mini:latest` emet el dictamen de claredat lectora.
2. **Safata per lots (`261124_propostes_editorials_node0`):** El generador del Node 0 detecta pàgines amb baixa densitat de negreta (`< 5` per paràgraf) o prosa telegràfica i diposita les **propostes humanitzades amb diff** en safata externa perquè la IAIA MarIA valide que conserven el **100 % dels fets tècnics i enllaços** abans d'integrar-les en lots CAS.

## 6. Quadre blanc editorial vs. fals tauler en columnes

Dins de quadres informatius blancs (`.sdp-admin-taxonomia__panel`, `.sdp-card`), tota explicació de més d'una línia es maqueta amb **encapçalaments semàntics (`h3`, `h4`, `h5`) i paràgrafs `<p>` o llistes `<ul>`/`<ol>` d'amplària completa**, mai fingint una consola en dues columnes `<dl>` que escanye la lectura a la dreta.

## 7. Deure d'avís i abast de les portes

Si detectes text telegràfic, títols en majúscules cridaneres, absència de negretes o un `H2` sense entradilla, cita la superfície i corregix-lo dins de l'encàrrec autoritzat; fora d'abast, registra'l.

`tractor-maquetacio-canonica.mjs`, `design_guard.mjs` i les suites Vitest comproven l'estructura del DOM, l'amplada lliure i la regla `H2 → .lead → H3`, però no substitueixen la revisió humana de calidesa didàctica i lectura en pantalla real.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-maquetacio-markdown/SKILL]]
- [[sdp-universal-page/SKILL]]
