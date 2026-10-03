---
type: acta
status: esborrany
description: 'Tancament de l''Onada 3 de Claude: tot fet a l''arbre sense commit, proves verdes, bloqueig de la Porta Frontera Auth i passos per a MarIA, el Mestre i l''Onada 4'
tags:
  - acta
visibility: private
reflex: sdp:torn_dba36e21-76fb-4102-b18c-450a601d6787:6a312631-3813-4aba-9b4b-30a3323d8357
---
# Acta Marmota · Onada 3: llavors reals, Model B absolut, Lector RSS, incidències de producció i PWA

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dba36e21-76fb-4102-b18c-450a601d6787:6a312631-3813-4aba-9b4b-30a3323d8357 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T17:20:18.628Z |
| Modificació | 2026-10-03T17:25:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestració multiagent: 14 workflows i 117 agents |
| Tokens consumits | uns 36 M en subagents (xifres dels workflows); l'orquestrador a banda |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 2d5838a987f9ea587784fcffabbd3889bd42c72bce135f63e853343c6cf17cb2. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-03T17:20:18.628Z: esborrany creat; contingut i verificació pendents.
2026-10-03T17:25:00.000Z: acta completa del torn torn_dba36e21 (Onada 3).

<!-- SDP:SECTION acta.s4 -->
## Resultats

L'informe complet, amb la taula de resultats per tasca, la verificació i els textos per a l'ESTAT i el LEDGER, és [[261003_1330_auditoria_claude]] (v1.0.0, validat amb `document.mjs check`). Esta acta en recull el fil i el punt de represa.

### 1. Part tècnica

- **Estat del repositori**: tot el codi d'avui és a l'arbre de treball SENSE COMMIT, uns 200 fitxers entre modificats i nous (`git status --short`). No hi ha cap canvi nostre a `.agents/`, `.claude/`, `tooling/` ni `01_produccio/`. Els laboratoris viuen a `02_investigacio_ia/261003_1330_*` (skills de disseny, anticipació, La Parròquia, Lector RSS, producció, empaquetat mòbil, Onada 4) i `261003_1330_llicons_claude.txt`.
- **Ordres executades**: obertura del torn (`obrir_torn.mjs --actor claude-opus --scope code`), `document.mjs context/create/check` per a l'auditoria i l'acta, `vitest` i `node --test` per abast i suite ampla, `tractor-enxufe`, `tractor-rls`, `design_guard` i `porta-olivera --informe`.
- **Resum de desenvolupament**:
  - Encàrrec de MarIA (T1–T6): fonament de fulls (XLSX, CSV i DEFLATE purs), carta real de La Parròquia amb un importador Loyverse genèric, 592 productes de Mercadona a la Nevera, importació del diari miccional a la Salut, regla transversal de fronteres per a totes les apps i dos laboratoris (skills de disseny i tractor d'anticipació).
  - Decisions del Mestre durant el torn: Model B absolut (WordPress sense Tenant ID; tenant, backend i serveis propis només de la capa del paquet), indicadors d'admin amb grups petits protegits, temporalitat agrícola i pestanya «Temporada» a la Nevera, Lector RSS 1.0 (estructura de Feedly, estil Pedra Seca, targetes 16:9 com a única excepció).
  - Incidències de producció del Mestre: OAuth sense dominis fixats (Google i l'alta per correu tornen a la pàgina de l'amfitrió), causa de les imatges en 404 (infografies fora de `public/`), avatars del Xat, regressió de Notes, Dispositius en foraster, vista Mes estil Google a /calendari, recuperació de contrasenya a prova de Safe Links, mestre-detall en mòbil a la closa compartida, Snippet amb destinació (Bloc o Lector) i fitxa del Snippet a Control.
  - Fase 0 PWA (manifest i service worker prudent, només a l'entrada pròpia) i pla de Capacitor per a les Fases 1 i 2.
  - Integració: `.sdp-boto` del Perfil encapsulat (el botó gran torna a 58 px), clau `snippetChromeUrl`, bookmarklet sense domini, PWA instal·lada sense finestra emergent i proves de tenant amb UUID sintètics.
  - Proves finals: suite ampla 9460 de 9464 (3 roges conegudes), 8 bateries de node en verd, tractor-enxufe E1–E4, design_guard en la línia de base.

### 2. El temps, les incidències i el trellat

- **Temps**: el torn es va obrir a les 13:30 (hora local) i es tanca a les 19:20, unes 5 hores i 50 minuts. No s'inventen mètriques d'estat humà ni d'eficiència.
- **Incidències**:
  - La recerca web està bloquejada pel hook local: les afirmacions sobre eines externes (T1) i polítiques de les botigues queden marcades com a NO VERIFICAT.
  - Un agent (R2, recuperació a prova de Safe Links) es va aturar pel límit de sessió després d'haver escrit el canvi; la integració final el va revisar i n'hi va corregir tres forats.
  - El Mestre va corregir una conducta de disseny («estil Feedly» volia dir estructura, mai estil): la lliçó està redactada per a `sdp-pedra-seca` a `261003_1330_llicons_claude.txt`, pendent de lease.
  - Els revisors adversarials van trobar problemes reals en gairebé totes les tasques (per exemple, el relé d'OAuth configurable per l'amfitrió, noms reals de la llista de Mercadona copiats a les proves, la sessió de recuperació utilitzable sense contrasenya nova, la fuga global de `.sdp-boto`): cap entrega s'ha donat per bona sense eixa segona mirada.
- **Patrons detectats**:
  - Les violacions del Model B no viuen només al flux principal: van aparéixer al relé d'OAuth, a l'alta per correu, al bookmarklet i en codi mort amb dominis de producció.
  - La recaiguda d'higiene de MarIA (sisena en dotze dies) no és de memòria: «Activitat en curs» és una exempció que l'agent es declara sense caducitat. El laboratori T6 proposa la porta que ho impedix.
  - L'arrel de diversos defectes de producció és l'empaquetat i el desplegament, no el render: el bundle publicat és el 1.0.1 i les infografies no són a `public/`.
- **Decisions de trellat**: el retallador d'avatars passa a l'Onada 4 (la peça `DialegEnquadrament` ja existix i només cal endollar-la); no s'arregla deute aliè que canviaria píxels (`--sdp-radi-base` a la Consola, el `null` d'Admin en ample); cap prova roja preexistent es «corregix» afluixant comportament.

### 3. Part Marmota (punt de represa)

- **On es queda la boga**: totes les tasques de l'Onada 3 estan implementades, revisades i integrades a l'arbre, sense commit. Res no està a mitges en cap fitxer. Producció (gentdelatorre.net) continua en el bundle 1.0.1.
- **Tasques immediates**:
  1. `[ ]` MarIA: lease per reescriure `tooling/wiki/tractor-frontera-auth.mjs` (`P1.txt` §7.1). Sense això, cap commit (i mai `--no-verify`).
  2. `[ ]` MarIA: pegar el bloc d'ESTAT i les línies de LEDGER de l'auditoria; `tancament.mjs --check` del torn.
  3. `[ ]` Mestre: `git mv` de les 4 infografies a `public/assets/img/`.
  4. `[ ]` MarIA: commits per lots, bundle i ZIP del connector (core-empaquetat-wp).
  5. `[ ]` Mestre: configuració de Supabase (Redirect URLs, plantilla «Reset password», SMTP, Site URL al final) i desplegament.
  6. `[ ]` Onada 4: endollar `DialegEnquadrament` 1:1 a l'avatar del Perfil (estrena amb la Pastaora per a la IAIA), ADR multimèdia de font única, Capacitor F1–F2.

### 4. Metadades per a màquines

```yaml
data: "261003_1920"
torn: "torn_dba36e21-76fb-4102-b18c-450a601d6787"
blockers:
  - "Porta Frontera Auth (tooling) exigix el relé d'OAuth retirat: cap commit fins a la lease"
  - "Producció en el bundle 1.0.1: cap correcció d'avui desplegada"
  - "Infografies de /projecte fora de public/: cal git mv humà"
  - "Shell confinada: sense web, sense build, sense escriptura a .agents/ ni tooling/"
decisions_clau:
  - "Model B absolut: l'SPA és cega a l'amfitrió; tenant, backend i serveis propis només del paquet"
  - "Clonar una UX externa és copiar-ne l'estructura, mai l'estil: 100% Pedra Seca"
  - "Mestre-detall en mòbil a la closa compartida: carpetes primer"
  - "Recuperació de contrasenya verificada en prémer Desa (Safe Links) i missatge genèric"
  - "Onada 4: font única multimèdia, retall al client, GPS opcional en columnes"
  - "Una sola app nativa per a tots els pobles; Apple i Google Play com a organització; Capacitor aprovat"
requereix_auditoria: false
```

<!-- SDP:SECTION acta.s5 -->
## Pendents

Els pendents complets, ordenats i exactes, són a [[261003_1330_auditoria_claude]]: «Pendents de MarIA», «Accions humanes i externes» i «Decisions obertes del Mestre» (dotze, entre les quals els botons que l'encapsulament de `.sdp-boto` ha revelat com a secundaris a /registre i /control, la vista del Calendari del Mur, el transport entre aparells de Dispositius i la privacitat del catàleg de Mercadona). La neteja de la història de git (CSV de Mercadona, XLSX de salut i sessió de WhatsApp) s'ha de fer abans de cap push.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261003_1330_auditoria_claude]]
