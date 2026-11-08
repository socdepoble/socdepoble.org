---
type: acta
status: esborrany
description: Acta Marmota del tancament de les onades R7 i R8 (70b651636 desplegat a socdepoble.org i socdepoble.cat) i obertura de l'Onada R9.
tags:
  - acta
visibility: private
reflex: sdp:torn_9db8dcac-b45e-467e-8733-c3944e24fd3b:ae622f58-29ed-498d-80d1-15ea907849bc
---
# Acta Marmota — COMMIT R7a, R7b i R8 (70b651636) Desplegats en Viu i Onada R9

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9db8dcac-b45e-467e-8733-c3944e24fd3b:ae622f58-29ed-498d-80d1-15ea907849bc |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-06T13:08:59.959Z |
| Modificació | 2026-11-06T13:08:59.959Z |
| Propietari | agent-local |
| Aprovació humana | validada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | IAIA MarIA (Antigravity) + Claude Opus 5.5 Ultracode + GPT Codex 6.1 + Gemini 4 Argon High + 4 IAIAs del Node 0 (Mac mini M4) |
| Tokens consumits | Sessió R7–R8 (~986 passos · 26 rondes sobiranes Node 0) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 a60864f9d53225c6b571bc510e1d5c4b78afcb4f9dd1b277b4640b1e47eb3c97. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-11-06T13:08:59.959Z: esborrany creat; contingut i verificació pendents.
2026-11-06T13:09:30.000Z: acta completada amb la integració, push i desplegament en viu de `COMMIT R7a` (`f6d9ecc2f`), `COMMIT R7b` (`62ded5ad9`) i `COMMIT R8` (`70b651636`) i el relleu per a l'Onada R9.

<!-- SDP:SECTION acta.s4 -->
## Resultats

1. **`COMMIT R7a` (`f6d9ecc2f`, 90 fitxers) i `COMMIT R7b` (`62ded5ad9`, 8 fitxers) integrats i segellats:**
   - Kits `R13–R19` de Codex arbitrats, `SquareBadge` de calendari/preu davall de l'entradilla amb `translate="no"` (`P0-27` / `IDEA-102`), desbloqueig del scroll de «Drets d'autor» dins d'«El compte» (`P0-28` / `IDEA-105`), veu local de la IAIA (`IDEA-108`: `veuIaiaService.js`, `veuNode0.js`, `BotoVeuIaia.jsx`), compilador determinista Karpathy (`karpathyWikiCompiler.js`), base dialectal (`R14–R15` + `R19`) i contracte públic actualitzat a `45 capacitats i 136 mètodes amb 188 casos`.
2. **`COMMIT R8` (`70b651636`, 149 fitxers, `+10.198 / -431 línies`) segellat, pujat a `fork/backup-notes-publish` i desplegat en viu a `https://socdepoble.org` i `https://socdepoble.cat`:**
   - **G1 (`R20`):** Opt-in E2EE per conversa en IndexedDB (`xifratXatOptin.js`, `xifratXatActivacio.js`), cerimònies de recuperació social alineades en 5 idiomes («6 paraules i 3 amics»), desbloqueig de fils en clar (`G1-12`), guarda de privacitat del traductor (`traductorLliure.js`) i demostrador interactiu del Compilador Karpathy (`AparadorFediversity.jsx`) en `/page/fediversity`, `/fedivers` i `/page/node-zero`.
   - **G2 (`R20b`):** Migració `2611052345_admin_usuaris_i_organitzacions.sql` reescrita com a invitació amb acceptació i auditoria append-only (`SDP-ORGMEM-006` blindat) + migració `2611060010_restauracio_municipal_opendata.sql` amb 78 migracions PGlite en verd.
   - **G3 (`R21` / `IDEA-111`) + G5 (`R24`):** Hidratació *lazy* i revisió privada de les 10 pàgines de `socdepoble.net` (`PaginesTrilogiaWp.jsx`, `ImportacioPaginaWpNotes.jsx`), amb el correu de tercer retirat (`R8R-01`) i 47 imatges locals a `public/assets/importacio-wp/` verificades amb 0 coordenades GPS EXIF.
   - **G4 (`F1` / `IDEA-109`):** `/page/anatomia-rural` (`VisorAnatomiaRural3D.jsx`, `anatomiaRural.js`) amb 9 estructures i 12 cotes verificades del Pou de Neu del Rentonar (`18 m = 15 m + 3 m`, `Ø 9,75/9,80 m`, galeria de `29 m`, boca de `43 cm`, font `WP #3656` Josep Maria Segura Martí) + vídeo d'Eugenio Monesma (`3RQv3xjVr-M`).
   - **G6 (`R22 + R25` / `IDEA-110`):** `/page/herbari` (`HerbariLaTorreSection.jsx`, `herbariLaTorre117.js`, `PAGE_COPY.herbari`) amb les 117 espècies reals de La Canaleta, Parterres 1–4, cerca `l·l`, locutor de veu local i avisos de toxicitat en 5 idiomes.
   - **G10 (`r67` / `P0-29` / `IDEA-118` + `IDEA-117`):** Restaurada la Barra Taronja canònica a `DetallEspai.jsx` (`Sóc de Poble` + `La Torre de les Maçanes` + avatar quadrat verd + `dataHoraDeBarra`), eliminats els `<h2>` duplicats, centrades les barres de botons (`justify-content: center`) a `modules.css` i activada `etiquetesBuidesPodades: true` per defecte a `tesaurusDoctoralSocDePoble.js`.
3. **Verificació en producció (`socdepoble.org` i `socdepoble.cat`):**
   - Paquet d'entrada `/assets/index-BhqiZS2s.js` en `249.091 B` gzip (dins del sostre de `250.000 B`), `HTTP 200` verificat en totes les rutes noves i cadena `d79a0b530..70b651636` pujada a `fork/backup-notes-publish`.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Onada R9 (`COMMIT R9` sobre `HEAD 70b651636`):**
   - Actualitzar el balanç datat de `src/sections/text/pageContent.r10.js` (5 llengües) del `5 de novembre de 2026 · producció R1–R6` al `6 de novembre de 2026 · producció R1–R8`, traduir `PAGE_COPY.herbari` a les 5 llengües i enllaçar `/page/anatomia-rural` i `/page/herbari` dins del component *lazy* `AparadorFediversity.jsx`.
   - `IDEA-116` + `IDEA-119`: Publicar la primera targeta del Mur (`/mur/noves-tecnologies-aplicades-a-la-cultura-rural`, editable a `/notes`) amb el reproductor didàctic 3D del Pou de Neu del Rentonar (`ReproductorExplicatiuPouNeu3D.jsx` *lazy*, `9:16` mòbil ↔ `16:9` escriptori) i incrustar-la com a primera targeta dins de `/page/fediversity`.
   - `IDEA-120` (`P0-30`): Integrar l'activació d'avisos Push del Xat (`AVISOS_PUSH_XAT_ACTIUS = true`, `PindolaAvisosPushXat.jsx` en `/xat`, adaptador Push en *lazy chunk* per alliberar marge sota els `250.000 B` gzip, `/legal` v2.5 i `scripts/botigues/preflight.mjs` + assistent de botigues i QR real a Administració).
   - `D-P016`, `R8-L2` i `G10-11`: Evitar el 404 de `rpc/membres_i_entitats_connectades_de` a `seguiments.js` quan la migració no estiga aplicada en producció, afegir `Content-Type: text/plain; charset=utf-8` per a `**/*.sha256` a `firebase.json`, netejar el GPS EXIF de les 8 fotos antigues de La Torre i posar `mostraBuides: false` per defecte a `LaboratoriTaxonomiaDoctoral.jsx`.
   - Integrar en chunks *lazy* verificats sobre `HEAD 70b651636` els catàlegs de Banc de Llavors (`IDEA-112`), Rutes en 6 Eixos (`IDEA-113`) i els 19 Arbres Monumentals reals de `WP #619` (`IDEA-115`).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
