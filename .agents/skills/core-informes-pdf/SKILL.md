---
name: core-informes-pdf
description: Tractor per a la creació, maquetació editorial i renderitzat de PDF professionals a Sóc de Poble (informes, memòries i lliurables).
---
# Tractor: Generació d'Informes PDF Editorials

Aquest tractor defineix el flux de treball, l'estil i l'arquitectura necessària per a crear documents PDF professionals per a l'administració, usuaris o arxiu, garantint la màxima llegibilitat i bellesa.

## 1. El motor de renderitzat
Els PDF MAI es generen amb eines com `pdftoppm` o llibreries antigues que no respecten CSS modern. La conversió d'HTML a PDF a Sóc de Poble es realitza OBLIGATÒRIAMENT amb el Chromium headless integrat, cridant l'script:
`sh tooling/pdf/render_pdf.sh [entrada.html] [eixida.pdf]`
Aquest script accepta `--replace` per a sobreescriure. L'script confia cegament en les regles `@media print` de l'HTML.

## 2. Tipografia i Maquetació (Regla de la Lectura en Mòbil)
1. **Mida Gegant (Regla d'or):** Els PDF sovint s'obren al mòbil o es passen per WhatsApp. Qualsevol informe ha de portar el text base a un mínim de **15pt** (mai menys). Penseu que val més gastar 4 folis més que deixar-se la vista fent zoom a columnes estretes.
2. **Font Corporativa:** L'informe ha de descarregar i utilitzar **Source Sans 3**.
3. **Format Multicolumna:** S'ha de maquetar el contingut en columnes pures de CSS (ex. `column-count: 2; column-gap: 8mm;`) per a donar ritme editorial i facilitar el salt d'ull.

## 3. Paginació i Capçaleres (El Detall Professional)
En tots els lliurables i informes de Sóc de Poble cal assegurar l'estructura documental següent per donar serietat institucional:
1. **Portada i Títol a la capçalera:** El nom complet de l'informe ha de figurar de manera clara i prominent (e.g. en la capçalera de les pàgines o en la pròpia portada).
2. **Numeració de pàgines al peu:** És ABSOLUTAMENT OBLIGATORI afegir numeració al peu de pàgina, utilitzant el format relatiu (ex. `Pàgina 1 de 20`). Com que l'script `render_pdf.sh` executa Chromium en headless, açò s'ha de forçar via les pseudo-classes de CSS (`@page { @bottom-right { content: "Pàgina " counter(page) " de " counter(pages); } }`) o afegint els paràmetres escaients (`--display-header-footer` al cridar el renderitzador si s'actualitza l'script per suportar-ho).

## 4. Components Semàntics i Identitat Visual (CSS)
S'han d'utilitzar caixes i components de disseny per emfatitzar la informació important, mai abocar el text de colp. El sistema de disseny es troba com a referència a: `_wiki_de_poble/04_escriptori/02_investigacio_ia/261012_0040_sistema_informes_claude/`.

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
