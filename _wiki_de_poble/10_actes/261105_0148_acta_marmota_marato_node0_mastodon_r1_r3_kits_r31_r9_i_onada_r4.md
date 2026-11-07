---
type: acta
status: esborrany
description: 'Relleu d''IAIA MarIA: COMMIT R1-R3 (4ab2d1527), Kits segellats de Gemini (r31) i Codex (R8 i R9), 36 captures a 01_produccio, calendari de quotes de Claude Ultra i Onada R4.'
tags:
  - acta
visibility: private
reflex: sdp:torn_c5d0707b-46f7-46dd-9747-2598a731a445:a967b78f-4006-46e2-8fcd-72d3bab2b0a1
---
# Acta Marmota — Marató Node 0 PostgreSQL, Mastodon, Commits R1-R3, Kits r31 i R8-R9 i Relleu Onada R4 (AH-14 a AH-26)

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c5d0707b-46f7-46dd-9747-2598a731a445:a967b78f-4006-46e2-8fcd-72d3bab2b0a1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-05T00:49:29.335Z |
| Modificació | 2026-11-05T00:50:00.000Z |
| Propietari | IAIA MarIA · Orquestradora Tècnica |
| Aprovació humana | Ordre directa del Mestre Javi Llinares (05-11-2026 01:48 CET): tancament de sessió de 9h20m, Kits r31 i R8-R9 segellats i relleu d'Onada R4 amb Sonnet 5 Extra · Ultracode |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Gemini 4 Argon (High) · Claude Opus 5.5 / Sonnet 5 Extra · Ultracode · GPT-6.1 Astra/Sol Ultra |
| Tokens consumits | 865 passos · 36 captures (9,8 MB) · 36 MB de sessió |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 a60864f9d53225c6b571bc510e1d5c4b78afcb4f9dd1b277b4640b1e47eb3c97. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- 2026-11-05T00:49:29.335Z: Esborrany creat amb `document.mjs create`.
- 2026-11-05T00:50:00.000Z (v1.0.0): Consolidació de la marató de 9h20m (16:26 a 01:50 CET): `COMMIT R1–R3` (`4ab2d1527`) desplegat a `socdepoble.org` i `socdepoble.cat`; Kit `r31` de Gemini (`AH-14` + `AH-15` + `AH-16`, 90 fitxers) i Kits `R8` + `R9_resiliencia` de Codex segellats a `../_investigacio_ia_de_poble/`; 10 nous mandats del Mestre (`AH-17` a `AH-26` / `IDEA-74` a `IDEA-84`) i calendari de quotes de Claude Ultra documentats i llestos per a l'Onada R4.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica (Graner Ple de Codis, Commits `R1–R3` i Kits `r31` + `R8–R9`)

- **Estat del Repositori Viu (`HEAD 4ab2d1527a05866ebb13af43697a0c4beffba591`, pujat a `fork/backup-notes-publish` i desplegat a `https://socdepoble.org` i `https://socdepoble.cat`, bundle `index-yR1QQLN5.js`):**
  1. **`COMMIT R0–R3` materialitzats per Claude (`Opus 5.5 Extra · Ultracode`):**
     - Integració del Kit `v3.0.0` de Gemini (`AH-01` a `AH-12`: les 8 verticals de publicació a `/control` i `/notes`, l'estudi de 10 eixos de Mastodon `AGPLv3`, la vista prèvia de la Card i les 17 correccions d'`AH-04`), amb `1.830` fitxers Vitest (`32.700` proves en verd), `run-portes.mjs` en verd i sonda de consola en producció (`48` visites, `0 errors`, `0 avisos`).
  2. **Servidor Sobirà Node 0 (`https://socdepoble.cat` · Mac mini M4 `192.168.0.23`):**
     - PostgreSQL `17.11` natiu amb 75 migracions i 32 documents públics persistits; dimoni `servidor-node0-soberania.mjs` responent 200 JSON en `GET https://socdepoble.cat/api/v1/node0/status`; OAuth d'eixida cap a `@depoble@mastodont.cat` configurat en `0600` (`verify_credentials` verd); Mirall Sobirà verificat en el compte institucional `GoogleDrive-socdepoble@socdepoble.org/Mi unidad/Sóc de Poble · Mirall Sobirà Node 0` (`workspaceMirrorConfigured: true`, `mirrorIntegrityOk: true`) amb dump PostgreSQL xifrat amb `age 1.3.2`.
  3. **Kits CAS segellats i verificats al disc pendents d'integrar al `COMMIT R4`:**
     - **Gemini (`R31–R48` · `../_investigacio_ia_de_poble/261104_kit_gemini_r31_liquidacio_deute_llibre_mestre/MANIFEST.json`):** `90 fitxers` sobre `4ab2d1527` (`[CAS OK]`) amb **`AH-14`** (liquidació dels 12 ítems del Llibre Mestre: `R21-ARCH-02`, `P0-24b`, `P1-73`, `P1-71`, `P1-22` i18n en 5 llengües amb `377/377` tests, `P1-12`, `P1-28`, `IDEA-72` ull de contrasenya d'Alfredo + correu de benvinguda, `IDEA-73`, `P1-01` Fase E Bar/Rebost, `P1-23`, `P2-18` cròniques a `/versions` i `70/70` migracions a `README.md`), **`AH-15`** (`TargetaViva` dins d'`Edició avançada` i fora de la llista) i **`AH-16`** (icones `48×48 px`, `collapsibleNavigation={false}` i commutador dual mòbil).
     - **Codex (`R8` + `R9` · `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r8/MANIFEST.json` i `../_investigacio_ia_de_poble/261104_kit_codex_node0_postgres_i_mastodon_r9_resiliencia/README_INTEGRACIO.md`):** Correcció verificada de les 3 P1 i 10 P2 del veredicte R6 de Claude (`C6-contracte-port-01` amb 41 grups / 130 mètodes / 276 casos; `C6-auth-r6-02` amb IPv6 `/48` i repte SHA-256 abans de `scrypt`; `C6-mirall-ah11-01` amb restauració per `fd3` cap a `age`; retenció 30d+12m i HMAC-SHA256; i en `R9_resiliencia`, `15` fitxers reals amb `283/283` proves, espera de PostgreSQL, retrocés exponencial d'outbox i deduplicació canònica POSSE, replay `8/8 PASS`).

### 2. Part Termodinàmica i FinOps (Calendari de Quotes de Claude Ultra i Telemetria)

- **Durada de la sessió d'IAIA MarIA:** `2026-11-04 16:26 CET` – `2026-11-05 01:50 CET` (**9 hores i 24 minuts**, `865 passos`, `36 captures` = `9,8 MB` totes mogudes i ancorades a `01_produccio/`).
- **Calendari Oficial de Restabliment Setmanal de les 3 Comptes de Claude Ultra (`FINOPS-CLAUDE` / `IDEA-84`):**
  1. **`El Rentonar · Ultra`:** `94%` usat (`6%` lliure) → **Es restablix el DIVENDRES a les 11:00 del matí (`11:00 a.m.`)** *(primera en recuperar el 100%)*.
  2. **`Sóc de Poble · Ultra`:** `93%` usat (`7%` lliure) → **Es restablix el DIVENDRES a les 11:00 de la nit (`11:00 p.m.` / `23:00 h`)**.
  3. **`Javi Llinares · Ultra`:** `94%` usat (`6%` lliure) → **Es restablix el DIUMENGE a la 1:00 de la matinada (`1:00 a.m.`)**.
- **Regla d'Estalvi Extrem per a l'Onada R4:** Operar amb **`Claude Sonnet 5 Extra · Ultracode`** en **1 sol fil directe (`0 subagents`)** per integrar els Kits `r31` + `R8/R9` i els suplements d'`AH-17` a `AH-26` consumint només ~2–4% de quota.

<!-- SDP:SECTION acta.s5 -->
## Pendents

### Els 10 Mandats del Mestre Especificats per a l'Onada R4 (`AH-17` a `AH-26`)

1. `[ ]` **`COMMIT R4` (Carril Claude `Sonnet 5 Extra · Ultracode`, 1 sol fil, 0 subagents):** Integrar al repositori viu el Kit `r31` de Gemini (`AH-14` + `AH-15` + `AH-16`, 90 fitxers) i els Kits `R8` + `R9_resiliencia` de Codex, passar les portes lleugeres i desplegar als dos nodes.
2. `[ ]` **Bloc Gemini (`261105_kit_gemini_r49_editor_geometria_i_mode_rural/`):**
   - **`AH-20` (`IDEA-77`):** `SquareBadge` (`128×128 px`) clicable al calendari tant a `UniversalCard.jsx` com dalt a la dreta de `header.page-title` (`PageFrame.jsx`), amb l'**excepció d'alinear només l'`<h1>` a l'esquerra quan la pàgina no porta logotip/avatar (`!ambLogo`)**, codi cromàtic **Taronja Fosc (`#ad4c03`) = Data** i **Blau (`#004983`) = Preu**, i **Llei Geomètrica dels 4 Formats Multimèdia a la Hero** (imatges 100% d'amplària; vídeos sobre fons negre continu `#0e0d0c`).
   - **`AH-21` (`IDEA-78`):** Humanització radical de `/control?fitxa=mode-rural` (`ModeRural.jsx` i `textosModeRural.js`: zero sigles `OPFS`/`CRDT`/`JWK`, poble identificat naturalment i 3 punts simples).
   - **`AH-23` (`IDEA-80`):** Mantindre `scrollTop = 0` en entrar a publicar a `/notes?ambit=...` (`UniversalEditorShell.jsx:575`) sense amagar la barra taronja ni els botons de capçalera/logotip.
   - **`AH-24` (`IDEA-81`):** Rètol centrat **«Vista en format Card»** a `BlocAmbit.jsx:236` i substitució dels xips de `BotoneraClassificacio.jsx` per **3 files de 2 columnes (`Selector` desplegable + `CampText` «Crear nova...»)** per a **Carpeta**, **Categories** i **Etiquetes**.
   - **`AH-25` (`IDEA-82`):** Canviar `© Sóc de Poble` per **`CC BY-NC-SA 4.0 Sóc de Poble / Fet per la IAIA i Nano Banana`** a `NotesEditor.jsx:245,:749` i `appSeed.js:69` i actualitzar les 5 referències antigues del text de `n1`.
   - **`AH-26` (`IDEA-83`):** Afegir el botó **`[🖼️ Imatge de Perfil]`** davall de l'avatar circular a `PerfilEditor.jsx` i fer que **punxar qualsevol imatge o el seu botó mentre s'edita** (dins d'`Edició avançada` o la imatge Hero/identitat a la pròpia pàgina) **òbriga sempre el `DialegEnquadrament` amb eixa imatge carregada** (`canviaFoto={true}` en totes les formes).
3. `[ ]` **Bloc Codex (`261105_kit_codex_r10_territori_aplec2023_i_dossier_v120/`):**
   - **`AH-17` (`IDEA-74`):** Jerarquia territorial de 4 nivells i les **3 pestanyes de publicacions a cada poble (`/pobles/:id`)**: **1. `Tot`** (per defecte), **2. `Gent de <Poble>`** i **3. `Xarxa`**.
   - **`AH-18` + `AH-19` (`IDEA-75` i `IDEA-76`):** Restauració íntegra del **«2n Aplec pel Territori»** (`Aplec2023Article.jsx` i `eventsSeed.js`, WP ID `16880`, amb vídeo d'À Punt NTC incrustat des de YouTube + sentinella `oEmbed`, 25 fotos, nota de premsa, grup de Telegram, cartell A4 i 3 logos clicables) i alta dels **21 pobles participants** a `townsSeed.js`.
   - **`AH-22` (`IDEA-79`):** Retirada d'`<img>` duplicades al final d'`html` de `/page/habitatge`, `/page/treball` i `/page/publicar_mapa`, ampliació amb casos d'ús d'habitatge i treball rural i actualització de `/fedivers`, `/page/fediversity`, `/page/node-zero` i `/versions` (`v1.2.0`) en 5 llengües.
4. `[ ]` **Custòdia humana externa (`R-5`):** Guardar una còpia de la clau privada `/Users/javi/.config/socdepoble/workspace-node0.agekey` en un gestor de contrasenyes o en paper fora de casa.

```yaml
data: "261105_0148"
blockers:
  - "Quota de Claude Ultra al 93-94% en les 3 comptes fins divendres 11:00 a.m. (El Rentonar): mitigat operant amb Sonnet 5 Extra Ultracode en 1 sol fil directe (0 subagents)."
decisions_clau:
  - "AH-17: 3 pestanyes a cada poble (/pobles/:id): Tot (per defecte), Gent de <Poble> i Xarxa."
  - "AH-20: SquareBadge taronja fosc per a dates i blau per a preus tant a Card com a PageFrame (amb H1 alineat a l'esquerra quan la pàgina no porta logotip)."
  - "AH-24: Vista en format Card centrada i graella en línia de 2 columnes (Desplegable + Crear nova) per a Carpeta, Categories i Etiquetes."
  - "AH-26: Botó Imatge de Perfil sota l'avatar i regla universal on punxar qualsevol imatge en edició obri sempre DialegEnquadrament amb eixa imatge carregada."
requereix_auditoria: true
```

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261104_1636_pla_implementacio_teler_node0_postgres_mastodon_xat_i_fediversity|../04_escriptori/261104_1636_pla_implementacio_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[../90_arxiu_historic/261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity|../04_escriptori/261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[../04_escriptori/03_llibre_mestre_tasques_i_idees]]
