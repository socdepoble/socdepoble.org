---
type: skill
status: actiu
description: Propaga i assegura l'actualització sincronitzada del Dossier Institucional de Sóc de Poble.
name: core-portaveu-institucional
tags:
  - govern
  - identitat
triggers_on:
  - dossier institucional
  - dossier complet
  - missatge de presentació
  - presentació del projecte
contracte.llig:
  - _wiki_de_poble/01_ser/01_identitat.md
  - _wiki_de_poble/00_index.md
  - src/sections/text/pageContent.js
  - README.md
  - wordpress-plugin/readme.txt
contracte.escriu:
  - _wiki_de_poble/00_index.md
  - src/sections/text/pageContent.js
  - README.md
  - wordpress-plugin/readme.txt
---
# Portaveu institucional

Usa esta skill per actualitzar el dossier i la presentació del projecte. La font de missió és `_wiki_de_poble/01_ser/01_identitat.md`; el model d'arquitectura és el d'AGENTS: Supabase és el backend propi vigent i Sollutia un amfitrió de lectura GET. La modularitat i el Fedivers són objectius que s'han de descriure segons l'estat verificat, sense presentar una integració prevista com a desplegada.

## Superfícies i actualització

1. Declara la decisió de comunicació i els fitxers afectats. Si l'encàrrec és el dossier complet, contrasta les tres superfícies següents; una publicació puntual no autoritza editar-les totes ni publicar en serveis externs.
2. SPA: `src/sections/text/pageContent.js`, clau `projecte` de `PAGE_COPY`. Conserva l'estructura HTML i les infografies que continuen vigents.
3. GitHub: `README.md`, introducció i arquitectura. Explica el port neutral i el connector d'amfitrió sense afirmar que Supabase ja s'ha substituït.
4. WordPress: `wordpress-plugin/readme.txt`, `Description` i serveis externs. Contrasta cada promesa d'autonomia o privacitat amb el connector i les dades que realment usa.
5. Si hi ha altres textos vius que han de reflectir la decisió, aplica `wiki-propagar-veritat` sobre la llista autoritzada. Les coincidències fora d'ella són pendents.

## Redacció i evidència

Escriu en valencià clar per a públic general, amb el detall necessari per entendre l'arquitectura. Per a negretes, ritme i extensió aplica `core-llegibilitat-text`; no hi ha una quota fixa de fragments ressaltats per paràgraf.

Revisa el diff de les superfícies acordades i els enllaços que toques amb el circuit de `certifica-enllacos.mjs`. La certificació comprova el seu contracte tècnic, no la veracitat del discurs institucional. El tancament declara què s'ha sincronitzat i què queda pendent: no presuposa que s'ha desplegat o enviat el text.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-llegibilitat-text/SKILL]]
- [[wiki-propagar-veritat/SKILL]]
