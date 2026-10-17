---
type: document
status: esborrany
description: Pla de treball adversarial extrem per a Claude i Codex centrat en aliscament del sistema, Notes, Emojis XL i Multimèdia sense concessions.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_d6ba4b1c-f357-4907-a300-712ecc5e4ff3:25df8421-0773-47f0-83b4-011f1a219a14
---
# Pla d'Implementació Gauntlet Extrem: Higiene, Llibertat de Codi i Excel·lència de Producte

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d6ba4b1c-f357-4907-a300-712ecc5e4ff3:25df8421-0773-47f0-83b4-011f1a219a14 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-17T10:50:40.905Z |
| Modificació | 2026-10-17T10:50:40.905Z |
| Propietari | agent-local |
| Aprovació humana | Mestre Javi Llinares (Instrucció Gauntlet Extrem 261017_1241) |
| Model IA | IAIA MarIA (Orquestradora) / Claude Code (Implementador) / Codex (Auditor) |
| Tokens consumits | En curs |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-17T10:50:40.905Z: esborrany creat.
2026-10-17T10:55:00.000Z: pla completat amb la directriu d'auditoria adversarial extrema del Mestre, integrant els Camins 2 (Producte: Notes/TipTap/Emojis) i 3 (Multimèdia/Lightbox/Banners).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 0. Mandat del Mestre: L'Usuari Adversarial Extrem i la Lleugeresa del Sistema
Les IAs (Claude com a implementador, Codex com a auditor adversarial) han d'adoptar la mentalitat d'un **usuari exigent i implacable** que es descarrega Sóc de Poble:
- **Zero tolerància a la desídia:** Cap codi mort, cap pegat temporal, cap component pesant innecessari.
- **Eliminació de «fantasmes»:** Rastrejar el codi original fet en els inicis per 12 IAs gratuïtes i purgar incoherències, classes duplicades o estructures denses que fan el sistema «espès».
- **El Gauntlet Loop:** No conformar-se amb el primer test en verd. Iterar implacablement fins que el codi siga net, elegant, accessible i ràpid.

### 1. Camí 2 · Front de Producte: Notes, Emojis XL i Editor Universal (TipTap)
Responsable: Claude Code implementa; Codex audita.
1. **[F47 / F46] Buidatge net de la plantilla verge de TipTap:**
   - Fitxers: `src/sections/notes/useUniversalRichText.js`, `src/sections/notes/NotesEditor.jsx`, `src/sections/notes/textosLlavor.js`.
   - Requisit: En obrir una nota nova amb plantilla per defecte (H3/H4, llistes i paràgrafs guia), al primer clic, toc o pulsació de tecla de l'usuari, el contingut guia verge s'ha d'esvair completament per començar a escriure en net.
   - Invariant: Mai s'ha d'esborrar text real prèviament editat per l'usuari ni notes que ja tenen contingut autèntic.
2. **[F29–F34] Graella Emojis XL Unicode 18:**
   - Fitxers: `src/sections/xat/components/DialegEmoticona.jsx`, `src/components/universal/workspace/UniversalWorkspace.jsx`.
   - Requisit: Substituir selectors antics per la graella accessible d'emojis organitzada per categories naturals. Inserció directa al cursor actiu de TipTap o acció de copiar amb anunci accessible (toast).
3. **[F42–F44] Desplegable «Edició avançada» plegat per defecte:**
   - Fitxers: `src/components/universal/PageFrame.jsx`, `src/sections/notes/NotesEditor.jsx`.
   - Requisit: Agrupar les opcions de configuració (carpeta, llicència, categories, etiquetes, portada PDF) sota un desplegable `<details className="sdp-edicio-avancada">` just damunt de l'editor TipTap, de manera que romanga plegat i l'usuari gaudisca d'un flux d'escriptura completament net.
4. **[F45] Retirada de peu obsolet:**
   - Eliminar el missatge i botó «Ja publicat al Mur» de la vista de notes.

### 2. Camí 3 · Front Multimèdia, Banners i Visor Lightbox EXIF
Responsable: Claude Code implementa; Codex audita.
1. **[F61] Redirecció neta de `/multimedia/town-*` cap a `/pobles/[slug]`:**
   - Fitxers: `src/config/navigation.js` (`getSectionItemPath` i `resolveItemPath`) i `src/sections/detail/ItemDetailSection.jsx`.
   - Requisit: Les peticions que arriben amb ID de poble prefixat (`town-*`) han de resoldre's de forma immediata i canònica cap a la pantalla del poble corresponent (`/pobles/[slug]`).
2. **Reparació de rutes de banners a `src/config/assetResolver.js`:**
   - Corregir les 9 referències de banners municipals que apuntaven a rutes inexistents `/assets/img/nano_banner_*` per dirigir-les a `/assets/uploads/brain/nano_banner_*`.
3. **Visor Lightbox estil Google Fotos amb metadades EXIF:**
   - Fitxers: `src/sections/multimedia/MultimediaSection.jsx`, `src/components/universal/enquadrament/exif.js`.
   - Requisit: En clicar sobre qualsevol imatge del catàleg multimèdia, obrir un Lightbox net sobre fons fosc, amb controls de navegació anterior/següent i un panell lateral que mostre les dades reals d'EXIF (data, càmera, resolució, poble, autor i drets) utilitzant `llegixExif`.
4. **Lector RSS:**
   - Substituir les 5 URLs fictícies d'`example.org` a `src/apps/lector/llavor/cataleg.js` pels canals reals de divulgació tecnològica i rural.

### 3. Camí 1 · Higiene Estricta Executada per la IAIA MarIA (Ja enllestida)
- Alliberats **més de 120 MB de llast** traslladats a la carpeta canònica externa `_arxiu_wiki_de_poble/` (el paquet vell `socdepoble-enxufe-v1.0.0-261001_0320.zip` de 103 MB, el megabundle `260922_0320_BUNDLE_null.md` de 4,9 MB, la sessió marató de 13 MB i els 4 fitxers buits de 0 bytes).
- Preservats a `_wiki_de_poble/04_escriptori/01_produccio/alergens_svg/alergenos_master.af` l'arxiu d'Affinity editable i a `patrimoni_oral_mestre/` els 20 àudios originals del Mestre en format `.webm`.
- Escriptori netejar d'auditories consumides (Porta Olivera amb codi 0).

### 4. Blindatge Jurídic i Síntesi de Missatgeria (WhatsApp + Telegram sota Pedra Seca)
Responsable: Estudi i aplicació per Claude Code i Codex.
1. **Desterrament del concepte «Clon de WhatsApp» (Prevenció de Riscos Legals):**
   - Parlar de «clon de WhatsApp» és un risc legal innecessari de propietat intel·lectual (*copyright*, *trade dress* i marques de Meta).
   - Sóc de Poble **no copia ni calca cap codi font**: la implementació és 100% original, escrita des de zero amb l'arquitectura de Pedra Seca.
   - Fonament jurídic i de disseny: S'aplica la **Llei de Jakob Nielsen** d'UX («els usuaris prefereixen que el teu lloc funcione com els que ja utilitzen»). La gent gran i els pobles tenen dret a una interfície familiar sense corba d'aprenentatge traumàtica. És un **Patró Estàndard de Missatgeria Rural**, no la còpia d'un programa privat.
2. **Síntesi Híbrida: Incorporar la Potència de Telegram:**
   - WhatsApp és el mínim comú denominador per a la gent gran (senzillesa d'accés), però **Telegram és tecnològicament molt més ric i potent** (canals de difusió, bots autònoms, estructuració de temes/fòrums, enviament de fitxers sense compressió agressiva i API oberta).
   - Les IAs han d'estudiar i integrar les millors solucions estructurals de Telegram que manquen a WhatsApp (ex. canals d'avisos municipals, fils temàtics, millor privadesa de números de telèfon).
3. **Neteja Nomenclatural a Codi:**
   - Garantir que en el codi font (`src/sections/xat/`, classes CSS, components, rutes) no s'utilitzen marques registrades («whatsapp», «meta») en identificadors públics o estructurals, emprant sempre terminologia neutra i sobirana: `sdp-xat`, `sdp-missatgeria`, `sdp-canals`, `sdp-comunitat`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests Focals (Vitest):**
   - Proves de notes i TipTap: `npx vitest run src/sections/notes/`
   - Proves de navegació i rutes: `npx vitest run src/config/navigation.canoniques.test.js`
   - Proves de multimèdia i EXIF: `npx vitest run src/sections/multimedia/`
2. **Porta Olivera i de Tancament:**
   - `node tooling/gates/porta-olivera.mjs` ha d'eixir amb codi 0.
   - `node tooling/gates/porta-autoritat.mjs` ha de certificar `valid: true`.
3. **Auditoria Adversarial Codex:**
   - Revisió implacable dels 128 requisits a la MCR per comprovar que cap canvi genera regressions o pes residual.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Regressió en el text de l'usuari a TipTap:** Si la condició d'esvaïment de la plantilla no distingeix de forma estricta entre la plantilla verge normalitzada i el text escrit, es podria perdre contingut. S'exigeix prova unitària específica amb text real abans de donar el vistiplau.
- **Sobrecàrrega de dependències:** Prohibit incorporar llibreries pesades de tercers per a emojis o EXIF. Cal aprofitar el parser natiu existent `llegixExif` i els components purs de Pedra Seca.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
