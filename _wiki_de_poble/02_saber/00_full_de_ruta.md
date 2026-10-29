---
type: document
status: canonic
description: Registre històric de les llavors de Sóc de Poble, des del que ja funciona fins a les idees per sembrar, amb les retirades per l'online-first.
tags:
  - saber
  - pla
reflex: sdp:teoria
---
# 🗺️ Full de ruta de Sóc de Poble

Registre de les llavors de Sóc de Poble, des del que ja funciona fins a les idees que encara s'han de sembrar. Els estats són declaracions històriques, no proves: el que depenia de l'arquitectura offline es va retirar amb l'ADR-2026-08.

La presència de codi o una bateria local verda no acredita el desplegament d’una versió ni un paquet publicat. L’estat d’execució, els commits i els pendents es contrasten amb [[03_llibre_mestre_tasques_i_idees]].

Cada llavor porta el trimestre previst i la seua categoria. La direcció general és a [[00_visio_i_pilars]], i una llavor només es dona per implementada quan complix els criteris de [[00_arquitectura_tecnica_unificada]].

## 🟢 En producció

- La versió desplegada a `https://socdepoble.org` és la del canal `live` de Firebase Hosting (release de les 02:46 del 261029, fotos d'identitat sense GPS i OpenGraph prerenderitzat). Qualsevol altra funcionalitat d'esta pàgina està en codi fins que el Mestre la passe a `live`: la font de l'estat real és [[03_llibre_mestre_tasques_i_idees]].

## 🍏 Collita tancada (fet)

- **Connector WordPress de Sóc de Poble i Port Neutral Model B** [Fedivers / Integracions]: el codi del connector per als pobles i les millores `T5.1` tenen verificació local. La versió del ZIP, la publicació i els pendents de distribució de Sóc de Poble es comproven al Llibre Mestre; esta fila no declara un paquet desplegat.
- **Sistema Documental Reflex i Portes Mecàniques de Sóc de Poble** [Governança]: taxonomia termodinàmica de la Wiki de Poble, Porta Olivera v4, verificador SCC i blindatge de les 42 skills (`SKILLS_SEAL.json`).

## 🍊 Sementeres vives (beta)

- **Arquitectura Online-First i Pedra Seca per als pobles** [en codi, commit `e36606db2`; desplegament pendent del Mestre] [Nucli]: lectura pública sense compte al poble, disseny editorial monocrom amb accent verd AAA (`#0e662e`, contrast $\ge 7:1$) i taronja socarrat, mode fosc i suport multilingüe en 5 idiomes (`ca`, `es`, `eu`, `gl`, `en`).
- **Editor Universal (`/notes`) i Lector de la Wiki de Poble** [en codi, commit `e36606db2`; desplegament pendent del Mestre] [Contingut]: TipTap amb autoguardat, selector d'emojis a columna completa (`PaginaEmojis`), Proposa Card (`IDEA-41`) i compartició OpenGraph per ruta amb prerender estàtic (`P1-61`) per a cada poble.
- **Identitat Sobirana (`@username`) i Mapa Fotogràfic EXIF del poble (`P1-64`)** [en codi, commit `e36606db2`; desplegament pendent del Mestre] [Comunitat]: reclamació atòmica d'àlies amb resolució d'homònims per poble (`P1-68`) i georeferenciació de patrimoni rural dels pobles.

- **Xat E2EE del poble (`P1-12`) amb Frase de 12 Paraules i Recuperació Social Shamir $k=3$ (`IDEA-48`)** [Criptografia]: primitives WebCrypto P-256 + HKDF + AES-256-GCM, formats binaris `SDP*`, magatzem IndexedDB xifrat i migració SQL RPC-only (`2610290400_xat_e2ee_claus_i_sobres.sql`) per als pobles, apagat per defecte darrere de flag fins a completar la UI.

## 🌱 Llavors (totes les idees)

Les idees que depenen de xarxes sense internet (Bluetooth, malles locals o IA sense núvol) són recerca: no formen part de l'arquitectura online-first.

- **Bàscula de Cooperativa** (sense data) [Cooperatives]: les pesades de la collita de cada soci a la cooperativa (pes brut, tara i net) i l'albarà. Descartada per ara el 261007 per ordre del Mestre («No té sentit en aquest moment»): s'ha llevat de la interfície i no té cap implementació; es conserva només com a llavor.

## 🍂 Retirades per l'ADR-2026-08 (història superada)

Estes llavors es van declarar collides o en beta sobre la pila offline: doctrina A10, Y.js i malla local. L'[[ADR-2026-08-ONLINE-FIRST]] va retirar la sincronització offline general, mentre que la PWA instal·lable (`P1-69`, [[ADR-2026-10-APPS-DEL-DISPOSITIU]]) i les dades del dispositiu en IndexedDB de l’ADR-2026-10 continuen vigents. El cofre BYOP per a apps amb dades locals sensibles té el seu abast propi a [[ADR-2026-13-BYOP-XIFRAT-LOCAL]]; no és una autorització exclusiva de claus o safata E2EE. La matriu viva d'execució és a [[03_llibre_mestre_tasques_i_idees]].

## Vincles

- [[00_index]]
- [[00_visio_i_pilars]]
- [[00_arquitectura_tecnica_unificada]]
- [[el_projecte]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[03_llibre_mestre_tasques_i_idees]]
