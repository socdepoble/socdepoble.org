---
name: core-informes-pdf
type: skill
status: actiu
description: Tractor per a la creació, maquetació editorial i renderitzat de PDF professionals a Sóc de Poble (informes, memòries i lliurables).
triggers_on:
  - informe pdf
  - renderitzat pdf
  - document editorial
  - pdf professional
  - exportar a pdf
contracte.llig:
  - _wiki_de_poble/02_saber/identitat_visual.md
  - _wiki_de_poble/04_escriptori
  - tooling/pdf/render_pdf.sh
  - tests/render-pdf.test.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---
# Tractor: Generació d'Informes PDF Editorials

Aquest tractor defineix el flux de treball, l'estil i l'arquitectura necessària per a crear documents PDF professionals per a l'administració, usuaris o arxiu, garantint la màxima llegibilitat i bellesa.

## 1. El motor de renderitzat
Per als informes HTML/CSS del projecte, usa el renderer existent amb Chrome/Chromium headless. `pdftoppm` és una eina de rasterització per a inspeccionar un PDF existent, no un motor de generació HTML; es pot usar en el QA visual. La comanda del renderer és:
`sh tooling/pdf/render_pdf.sh [entrada.html] [eixida.pdf]`
L'API és `[--replace] [entrada.html] [eixida.pdf]`. Sense --replace rebutja un destí existent; amb la bandera conserva una còpia .bak abans de publicar el PDF nou. Comprova capçalera i mida mínima de l'eixida; no valida tipografia, salts ni el contingut del document.

## 2. Tipografia i Maquetació (Estil de Llibre)
1. **Mida i Font (Estalvi i Llegibilitat):** El text base ha de tindre una mida de **14pt o 15pt**, i s'utilitzarà obligatòriament la família tipogràfica **Noto Sans SemiCondensed** (semi-condensada) per encabir més text sense sacrificar la lectura ni malgastar paper.
2. **Format de Llibre (Marginació):** S'ha d'aplicar CSS de pàgina A4 (`@page { size: A4; margin: 25mm 20mm; }`) per assegurar marges generosos per dalt (per la capçalera) i pels costats, emulant l'estètica d'un llibre. Es pot mantenir el format multicolumna si afavoreix el salt d'ull.

## 3. Paginació i Capçaleres (El Detall Professional)
En tots els lliurables i informes de Sóc de Poble cal assegurar aquesta estructura documental perquè l'usuari sàpiga sempre on és:
1. **Capçalera recurrent:** El títol de l'informe ha d'aparèixer imprès "en xicotet" a la capçalera superior de TOTES les pàgines.
2. **Numeració de pàgines al peu:** És ABSOLUTAMENT OBLIGATORI afegir numeració a la vora inferior (ex. `14`, o `14/20`).
Tot això s'ha de forçar via CSS Print (`@page { @top-center { content: "Títol"; font-size: 10pt; } @bottom-right { content: counter(page); } }`) en l'arxiu CSS i comprovant l'eixida real. `render_pdf.sh` no admet --display-header-footer; no li passes una opció d'un altre wrapper. El títol recurrent i la numeració són criteris visuals del PDF, no una garantia de l'exit code del renderer.

## 4. Components Semàntics i Identitat Visual (CSS)
S'han d'utilitzar caixes i components de disseny per emfatitzar la informació important, mai abocar el text de colp. El sistema de disseny es troba com a referència a: `../_investigacio_ia_de_poble/261012_0040_sistema_informes_claude/`.

Alguns patrons de referència inclouen:
- `.alert`: Caixes cridaneres amb fons marí corporatiu per a dates límit i avisos greus.
- `.box.accent`: Caixes per a explicacions i llistes.
- `.crit`: Fitxes de criteria o puntuació amb maquetació de targeta, encapçalament numerat gran i graella interna de clau-valor.

## 5. Flux de Creació (Col·laboració IA)
La complexitat semàntica de prendre text brut i encapsular-lo en components rics com `.crit` o `.card` generalment excedeix les capacitats d'un script de Python per regex. 
Per tant, l'ordre d'execució és:
1. Subministrar l'esborrany brut del text a un model LLM (Claude o equivalent).
2. Demanar expressament l'aplicació d'aquest "Sistema de Disseny Sóc de Poble per a informes".
3. Renderitzar l'HTML complet retornat.
4. Revisar visualment (via captures de pantalla o programari extern) per assegurar que el PDF ha absorbit els canvis.

## Aïllament i comprovació del lliurament

El renderer usa perfils i memòria cau absoluts i efímers, sense compartir-los amb el navegador de la persona, i les banderes de clauer del workflow. Una prova amb stub comprova les opcions, el tractament del destí i la neteja davant èxit o error; no acredita que Chrome haja maquetat una pàgina.

Renderitza l'informe real, rasteritza'n les pàgines si cal i inspecciona títol recurrent, numeració, llegibilitat, talls de taules, imatges i pàgines en blanc. No afirmes QA visual si només has llegit la capçalera `%PDF-` o el log. Si no hi ha Chrome, declara el render no executat en lloc d'inventar un PDF vàlid.

## Vincles
- [[00_INDEX_SKILLS]]
