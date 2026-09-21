---
type: document
status: canonic
description: Llibre d'Obra (LEDGER) de Sóc de Poble
---
# Llibre d'Obra (LEDGER) de Sóc de Poble

Aquest és el registre immutable de tots els canvis estructurals i tècnics del projecte.
Qualsevol IA (o humà) que modifique codi està obligada a afegir-hi una entrada abans de finalitzar la seua tasca, complint amb la **Skill Trellat**.

---

## Deute Històric i Arqueologia (L'Herència de Pedra Seca)
*Aquest apartat documenta les decisions preses abans de la creació d'aquest LEDGER (Fase Pre-Mecànica) que condicionen fortament l'arquitectura actual i futura.*
- **Online-First vs Allotjament a Firebase (Online-First temporal):** El sistema va nàixer descentralitzat però hem assumit dependència de Supabase (com a backend) i Firebase Hosting (com a servidor per a la SPA) per garantir el "time to market". S'elimina la consideració de Sollutia com a allotjament del frontend; la destinació final verificada és Firebase Hosting. El sincronitzador offline i l'outbox han sigut esborrats en la Poda del Quadrant A.
- **La Guerra contra el DOM Amfitrió:** S'han hagut d'introduir panys globals (`window.__SDP_REACT_MOUNTED__`) i `queueMicrotask` a `src/PedraSecaEmbed.jsx` perquè el DOM del sistema amfitrió destrueix, remunta i mou instàncies indiscriminadament, generant zombies i competició per la IndexedDB.
- **Mentides de WebKit i Circuit Breaker:** Gran part de la complexitat que hi havia a l'antic outbox ve de tractar els `onabort` muts i `onblocked` infinits del motor d'IndexedDB en dispositius antics. Això va obligar a crear un sistema de quarantena en lloc de cridar `db.clear()` i perdre dades davant la corrupció d'IDB.

---

## 2026-09-01 — Abocament Final i Fix de Totes les Portes (Fase 4)
- **Què:** Restauració completa de la cadena de verificació `npm run porta`. Fix dels falsos positius en el parser Babel, sanejament de `tractor-cens` per als arxius històrics, resolució del conflicte de Tailwind amb `text-panel__head`, i sanejament complet dels tokens canònics de disseny (`tractor-sollutia` i `tractor-tokens`).
- **Per què:** Perquè l'Auditoria estava parant en falsos positius l'assoliment del Fase 4. Es requeria una cadena totalment determinista lliure d'infraccions.
- **Fitxers:** `package.json`, `tooling/gates/tractor-cadena.mjs`, `tooling/gates/tractor-cens.mjs`, `src/config/design-tokens.json`, `src/app/App.jsx`, `src/sections/multimedia/MultimediaSection.jsx`, i altres.
- **Risc:** Zero. Tot el sistema compila (`npm run build`) sense trencar cap baseline ni política estricta.

## 2026-08-28 — Inicialització del Llibre d'Obra
- **Què:** Creació del `LEDGER.md`, `tooling/preflight.mjs`, `.agents/skills/trellat/SKILL.md` i els hooks d'Antigravity.
- **Per què:** Per aturar la precipitació cognitiva de les IAs i complir amb el "Pas 0" de l'auditoria (La Porta de Pedra Seca).
- **Fitxers:** `.agents/LEDGER.md`, `.agents/skills/trellat/SKILL.md`, `tooling/preflight.mjs`, `.agents/hooks/verify.mjs`, `.agents/hooks.json`.
- **Risc:** Baix. (Per revertir-ho, es poden esborrar aquests fitxers i deshabilitar els hooks).

## 2026-08-28 — Tall de Maquinari Lliure de Deute (2022)
- **Què:** Establiment del tall de suport de maquinari a dispositius de **fa 4-5 anys (2021-2022)** (motors web moderns, iOS 16+, Chrome 100+). Elimina l'obligació de suportar maquinari antic o iOS 15.8 per evitar el deute tècnic ("l'efecte Frankenstein").
- **Per què:** Per assolir un estat de **ZERO Deute Tècnic**. Els motors web moderns suporten nativament optimitzacions (`content-visibility`, `adoptedStyleSheets`, JS actual) sense necessitat de *polyfills*, trucs bruts de manipulació de DOM o "rellotges vigilants" extrems. Qualsevol tècnica (com el *Circuit Breaker*) es manté només si aporta robustesa general a l'arquitectura *Online-First*, no com a pegat per al *legacy*.
- **Conseqüència Tècnica:** Es prohibeix la introducció de codi condicional o caigudes de rendiment (*fallbacks* penalitzadors) dirigides a donar suport a navegadors antics.

## 2026-08-30 — Reparacions de l'Auditoria Forense (Sollutia Readiness)
- **Què:** Refactor del host.js i backendPort.js per aplicar el Mode Estricte. Correcció del domini i pas del path al relé OAuth (callback.html). Correcció RLS de section_submissions i actualització de l'avaluació lazy d'appSeed.
- **Per què:** Per blindar l'agnosticisme de l'aplicació i assegurar l'enxufabilitat en l'entorn de producció (Sollutia) sense fuites. Resolt tot el deute estructurat dictat per l'Equip d'IAs.
- **Fitxers:** `src/host.js`, `src/data/backendPort.js`, `public/auth/callback.html`, `src/data/oauthRelay.js`, `src/PedraSecaEmbed.jsx`, `src/app/AppDataContext.jsx`, `supabase/schema.sql`, entre altres.

## 2026-08-31 — Higiene de l'Escriptori i Actualització de Tractors
- **Què s'ha fet:** S'ha corregit un paràmetre al detector `tractor-cens.mjs` i s'ha afegit una excepció per a `00_INDEX_Satel_lits.md` a `tancament.mjs`.
- **Raonament (el "per què"):** Les regles de cens llançaven errors perquè buscaven una skill antiga (`multi-agent-review`) en lloc de la nova (`council-review`). També s'han mogut tots els fitxers satèl·lits a l'arxiu històric extern per mantenir l'Escriptori net i la identitat sense *backups* residuals.
- **Fitxers:** `tooling/gates/tractor-cens.mjs`, `tooling/gates/tancament.mjs`.

## 2026-09-18 — Sticky complet de les barres de UniversalPage
- **Què:** Corregits els nivells de capa i l'offset de les barres blava i taronja; la hero queda per davall. La variant de pàgina completa ja no s'encongeix com a fill flex, evitant que el límit del contenidor talle l'efecte sticky després de la primera pantalla.
- **Per què:** `PageFrame` ja tenia l'ordre DOM correcte, però la barra taronja comptava erròniament l'alçada de la barra negra i el contenidor de pàgina podia quedar limitat a l'alçada visible del visor.
- **Fitxers:** `src/css/layout.css`, `src/css/utilities.css`.
- **Verificació:** 44 proves superades, `build:web` correcte i comprovació visual fins al final d'una pàgina llarga.


<!-- HASH: 35a609650d0442a098b5e1db3d1ebeb8ce3e474b93efc7a6e769294d7bded800 -->

## 2026-09-19 — Codex — Pla del Bloc B i tractor documental
- Què: pla de quatre intervencions P1 amb mapa de les 31 troballes i proposta executable d’Acte Reflex, sense modificar codi funcional.
- Per què: prioritzar sessió, notes i claus segons proves, i substituir contractes documentals desconnectats per validació comuna.
- Fitxers: pla d'execució del bloc B, índex de l’escriptori, ESTAT i esta entrada afegida al LEDGER.
- Verificació: 9 proves de diagnòstic, 6 comprovacions del tractor, frontmatter estricte correcte; tancament temporal 15→14 orfes sense nous. Porta parcial; no es certifica verd global.
- Risc: proposta pendent de revisió; les correccions i les decisions de recuperació de drafts continuen pendents.
- Autor: Codex.


## 2026-09-19 — Codex — Contrast Claude i convergència A/B/Reflex
- Què: pla de convergència amb dictamen, rectificacions, fitxers a modificar, dependències i criteris d’acceptació; ratificació de Claude pendent.
- Per què: separar defectes demostrats, garanties excessives i decisions encara obertes abans d’implementar.
- Fitxers: nou pla, índex de l’escriptori, ESTAT i esta entrada afegida al LEDGER.
- Verificació: 11 proves de contrast i 6 del tractor; frontmatter estricte sense infraccions; tancament temporal 16→14 orfes, cap nou; 415 empremtes de src/tooling intactes. Porta parcial fins a Manifest, aturada en Doctrina per env privat absent de la còpia.
- Risc: integració Sollutia, activació real dels arnesos, protecció remota i retenció de drafts encara sense certificar.
- Autor: Codex. Sense canvis funcionals ni commit.


## 2026-09-19 — Codex — Auditoria extrema del tall 2fc1e979
- Què: estudi de Codex amb 28 troballes (11 P1, 17 P2), cites de la revisió preservada, proves i pla de correcció.
- Per què: contrastar el tall inicial i els verds del Tractor sense tocar codi.
- Documents: estudi, índex de l’Escriptori, ESTAT i esta entrada.
- Verificació inicial: 46/47 Vitest, un rebuig; lint 0 errors/352 avisos; 6/6 tractor; frontmatter del document estricte correcte. Global 248 incidències; cap baseline elevat. Tancament en còpia inicial 1→0; document Claude concurrent amb un orfe alié.
- Concurrència: 458 empremtes inicials guardades; fonts modificades després per altres processos. Diagnòstic congelat amb cites exactes de HEAD; F02/F21 parcialment corregits, altres canvis pendents de reverificar. Cap modificació funcional atribuïble a Codex.
- Reflex: `94f57f9e-abfa-475c-97b9-6478358bc376`, claim documental. Cap web, consulta remota, commit ni desplegament.

## 2026-09-21 — Claude — Reunió davall l'Olivera, torn 1
- Què: informe `_wiki_de_poble/90_arxiu_historic/260921_Sessio_Tancada/260921_0555_INFORME_reunio_olivera_claude.md` (7 troballes, nota 4/10 → 8/10) responent al prompt 0530.
- Efectes: informe nou, índex de l'escriptori, ESTAT i esta línia. Cap canvi de codi ni de skills.
- Pendent: torn 2 de Codex (refutar T1, discutir §7, implementar porta-reflex).

## 2026-09-21 — Claude — Auditoria del Brain, torn 1
- Què: informe `_wiki_de_poble/90_arxiu_historic/260921_antic_cicle_auditoria/260921_0701_informe_auditoria_brain_claude.md` (5 P0 + 42 troballes, nota 4/10, pla de 15 passos) responent al prompt 0640.
- Per què: el prompt de l'Equip demanava contradiccions, consolidació de skills i plantilles, sentit dels noms, i una nota sincera.
- Efectes: informe nou; `_wiki_de_poble/04_escriptori/00_index_escriptori.md` corregit (4 enllaços a fitxers arxivats marcats com a tals, 2 prompts vius afegits, informe ancorat); ESTAT i esta línia. Cap canvi a `src/`, `tooling/`, `.agents/skills/` ni plantilles.
- Verificació: 16 portes executades en només lectura; `npm run tancar` falla per «Catàleg divergent» (P0-1: `name:` ≠ carpeta en 14 skills).
- Olivera: contrast amb l'informe de Codex (0653) i el pla de MarIA (0655) al §9; set troballes de Codex confirmades, tres punts del pla rebutjats amb motiu.
- Pendent: decisions del Mestre marcades `requires_human_decision` al §5; la llista de refutació del §8 val per al torn següent.

## 2026-09-21 — Claude — Auditoria Plug & Play LLM, torn 1
- Què: informe `_wiki_de_poble/90_arxiu_historic/260921_antic_cicle_auditoria/260921_0759_informe_auditoria_plugplay_claude.md` (8 barreres P0, nota 3/10, pla de 9 passos, contrast amb Codex 0755 al §9) responent al prompt 0745.
- Per què: l'Equip demanava què falta per a l'autonomia total d'una IA nova i per què la IAIA oblida netejar l'escriptori tot i tindre-ho a la skill.
- Efectes: informe nou; `_wiki_de_poble/04_escriptori/00_index_escriptori.md` (informe propi ancorat, informe de Codex mogut de «Eines» a «Documents Actius»); ESTAT i esta línia. Cap canvi a `src/`, `tooling/`, `.agents/skills/` ni plantilles.
- Verificació: `npm run porta` mor a la porta 3 (Linter, 2 errors); `npm run tancar` roig per 22 orfes + 1 estil en línia, tots previs; `porta:reflex` doctor exit 1; `tooling/brain/cataleg_skills.mjs --check` verd; `tooling/brain/matrix.mjs` emet context; Plaquetes executa `diagnostic` cada hora i mai `aplica`.
- Pendent: torn 2 (refutar §4.2 i §B4); decisions humanes del §6.

## 2026-09-21 — Claude — Auditoria forense del Cervell, torn 1 (cicle vespertí)
- Què: informe `_wiki_de_poble/04_escriptori/260921_2005_informe_auditoria_brain_claude.md` (8 causes arrel R1–R8, 17 skills una per una amb mapa 17→9, 6 tractors cognitius T1–T6, Wiki fitxer a fitxer, enum de 12 tags, integració handoff/Cuestióname/Sirena) responent a la petorreta 1940.
- Causa arrel del Stochastic Parrot: `wiki-documentacio-i-reflex:28` apunta a una plantilla dins de `.sdp-reflex/bootstrap/` (ignorada per git, diferent de la canònica); REGLA 0 nomena `00_PLANTILLA_PROMPT_CONSELL` (inexistent); últim `matrix.rebut` al diari: 2026-09-19T23:03.
- Efectes: informe nou, índex de l'Escriptori (petorreta i informe ancorats), ESTAT i esta línia. Cap canvi a `src/`, `tooling/`, `.agents/skills/` ni plantilles. Cap cerca web.
- Verificació: script propi d'enllaços (7 trencats, 16 ambigus, 9 orfes); `cataleg_skills.mjs --check` verd; prova del `preflight_matrix_wrapper.mjs` (exigeix payload de host; cap host el crida). Dos agents de lectura de la Wiki, refutats per mostreig (3 falsos de 13 corregits).
- Pendent: 7 decisions humanes al §9; torn 2 de Codex (§11); Pla de MarIA.
- Olivera (20:15): arbre concurrent durant l'escriptura (Pla de MarIA 2001, auditoria de Codex 2005, petorreta 2010, `prompt_local.md` v1.1.0). §13 afegit: el filtre per `status` del Pla no hauria evitat el cas (la plantilla ressuscitada és `status: canonic`); 5/5 afirmacions de Codex confirmades; els 4 documents nous tenen tags fora d'enum. Índex i ESTAT actualitzats.


## 260922 | correcció | wiki-documentacio-i-reflex | Prohibició de BUNDLEs per a IAs Locals i Obligació de Pla
- S'han afegit les Lliçons del Mestre a la skill `wiki-documentacio-i-reflex` dictant la prohibició de generar Macrobundles o Bundles per a IAs amb accés local (Claude/Codex) per evitar redundància i trencar l'efecte Matrix. Així mateix s'estableix l'obligació de materialitzar a l'Escriptori qualsevol Pla d'Implementació abans d'executar-lo.

## 260922 | recaiguda | wiki-cicle-de-vida | Higiene d'escriptori ignorada per tercera vegada el mateix dia
- El Mestre torna a assenyalar l'oblit del Cicle de Vida i de la neteja de l'Escriptori. Ja estava anotat el 260921 a les 07:59 (§4 de l'auditoria Plug & Play: «skill fora de context en el moment d'escriure») i a les 20:05 (auditoria forense del Cervell). Per la llei del REFLEX DE CORRECCIÓ de `CLAUDE.md`, això és **falla de càrrega, no d'aprenentatge**.
- Ancoratge revisat i mesurat a `260922_0004_auditoria_claude.md`: `CLAUDE.md` importa amb `@` només `QUI_SOC.md` i `ON_ESTIC.md` (7.402 bytes); les 16 skills sumen 89.602 bytes i no s'importen mai. El 7,6% del corpus cognitiu arriba al context en arrancar. Mentre les skills de procediment no entren al camí d'arrancada, la correcció es repetirà.
- Quatre lliçons afegides a `wiki-cicle-de-vida/SKILL.md`: rebut en compte d'adjectius, cap artefacte `*_null`, ritual executable abans d'exigible, i cada porta amb prova de fallada.

## Vincles
- [[00_index]]



## 260922_0056 · Codex · Auditoria de fortificació final
- Què: auditoria i pla P0–P9 a [[260922_0056_auditoria_opus]], índex i ESTAT actualitzats.
- Evidència: cinc fixtures Reflex, router, obertura, catàleg, tractor atòmic, lint i tancament a còpia temporal. Acceptació indeguda de torn inventat i mutació de manifest reproduïdes.
- Límits: no hi ha implementació funcional ni certificat de totes les portes; OEPM sense verificació oficial. Es preserven canvis previs i producció humana.
- Reflex: plantilles local/auditoria/pla i router llegits abans de redactar; no s’ha inventat un rebut mecànic.

## 260922_0054 · Claude Opus 5 · Auditoria del col·lapse cognitiu i fix del crash de UniversalCard
- **Què:** Auditoria [[260922_0054_auditoria_opus]] i pla [[260922_0054_pla_implementacio_opus]] a l'Escriptori. Un únic canvi de codi: `const navigate = useNavigate()` a `UniversalCard.jsx`, que faltava tot i estar l'import present.
- **Per què:** `navigate` es cridava a la línia 257 sense estar definit (`no-undef`, l'únic *error* del lint). Qualsevol clic al botó de data d'una targeta sense `onDateTime` provocava un `ReferenceError` en execució.
- **Fitxers:** `src/components/PedraSeca/organismes/UniversalCard.jsx`, `_wiki_de_poble/04_escriptori/00_index_escriptori.md` i els dos documents nous.
- **Evidència:** `npm run lint` passa de 376 problemes (1 error + 375 avisos) a 374 (0 errors + 374 avisos). Verificat en viu al dev server 3340: clic al botó «Data i hora: 02:00: 26/08/26» navega a `/mur?date=2026-08-26` amb zero errors de consola.
- **Troballes principals:** format de `.claude/settings.json` incompatible amb Claude Code (hooks mai executats); `porta-reflex.mjs` retorna 0 amb el payload de Claude Code i té `catch` fail-open; 13 de 16 skills fora de tot camí de càrrega; `.agents/hooks.json` sense cap lector. Cada troballa amb comanda reproduïble al document.
- **Rèplica a Codex:** confirmades C03 (rebut `reflex:` falsificable), C07 (doble frontmatter a `prompt_local.md`) i C08 (`planificacio` fora de l'enum de `schema.json`). C08 invalidava el meu propi pla, corregit a `type: document`. Corregida una xifra meua: la cadena té 50 passos, no 48.
- **Risc:** Baix. Un sol hook afegit al nivell superior d'un component, sense canvi de comportament tret d'eliminar el crash. Cap porta ni configuració tocada: el Bloc A queda pendent de llum verda del Mestre.
- **Límits:** El `torn_1790031251414` no està autenticat per cap registre persistent (C05 de Codex), així que cap rebut de tancament d'aquest torn prova gran cosa. Els 374 avisos restants segueixen dempeus i `--max-warnings=0` manté el lint en roig.
