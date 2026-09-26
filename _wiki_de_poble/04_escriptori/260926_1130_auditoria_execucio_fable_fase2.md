---
type: informe
status: esborrany
description: 'Execució de les fases 2 i 3 del pla d''auditoria extrema: relleu de torn, una sola veritat del backend, error boundaries, bloc de notes, publicador amb dos identitats i arquitectura de perfil.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a2db8978-9b8b-4c83-b100-078d5165dcb9:3af493a9-0b6a-4b32-80bd-1bbcdc59a9ad
---
# Execució de la Fase 2 i 3 (petorreta 1115) per Claude Fable

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a2db8978-9b8b-4c83-b100-078d5165dcb9:3af493a9-0b6a-4b32-80bd-1bbcdc59a9ad |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T09:20:45.608Z |
| Modificació | 2026-09-26T10:10:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), Claude Code (app d'escriptori), torn torn_a2db8978 |
| Tokens consumits | fil principal no mesurat (sense telemetria a l'arnés); subagents d'este torn: un Explore de 436.353 tokens (cerca del reflex daemon); la sessió ha compactat context una vegada |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-26T09:20:45.608Z: esborrany creat; contingut i verificació pendents.

2026-09-26, matí (Claude Fable, torn torn_a2db8978): torn obert amb `obrir_torn.mjs`, pla 0130 vinculat amb `document.mjs plan`. Executat el que el hook local permet (codi a `src/`, migració, Wiki). Un lot de 13 edicions (publicador a la capa de dades, Wiki sense «Explorador del Cervell», taronja mòbil, control de contrasenya) **rebutjat pel Mestre** en el diàleg de permisos: es deixa en pausa i no es repetix sense ordre. Després, el Mestre canvia el rumb cap a la infraestructura de fons (Calendari de processos) i la IAIA MarIA hi afig una auditoria d'urgència: eixe treball té pla propi, [[260926_1200_pla_implementacio_infraestructura_fons]].

Nota d'escriptura: este informe ha quedat amb seccions `[pendent]` durant hores perquè el hook local valida el fitxer resultant de cada `Edit` i bloqueja mentre quede una secció pendent; només passa un `Write` amb el document sencer omplit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Estat de cada punt de la petorreta 1115 (fases 2 i 3, secció E/D del pla 0130)

| Punt | Estat | Evidència |
|---|---|---|
| E.1 Relleu de torn (`tooling/documental/relleu.mjs`, `document.mjs relleu`, `tests/relleu.test.mjs`, polítiques) | **No entregat.** El hook bloqueja tota escriptura a `tooling/` i a `.agents/` («usa executor-mutacio.mjs amb pla exacte i lease»), també després de la reparació del segell que anuncia el Mestre. El disseny (esborrany d'ESTAT sota l'H1, línia de LEDGER re-signada amb `ledgerStatus`, `ledger.lock` + CAS + escriptura atòmica, entrada d'historial al torn) està pensat i cap a un paquet de laboratori que no s'ha arribat a escriure. | Bloqueig del hook reproduït en este torn sobre `tooling/brain/mapa-consola.mjs` i `.agents/skills_index.json`. |
| E.3 Una sola veritat del backend (frase canònica a ADRs, `doc_governanca`, plantilles, AGENTS/QUI_SOC/protocolledge) | **No entregat.** Els documents de la Wiki sí que són escrivibles; no s'ha arribat a fer per ordre de prioritats del Mestre. AGENTS.md, QUI_SOC.md i protocolledge.json són zona protegida: caldrà pegat. | — |
| FRO-06 `DetallAjust.jsx` (promesa nul·la a `desaCampClosca`) | **Fet.** | `src/sections/profile/DetallAjust.jsx`, guarda `promesa && typeof promesa.catch === 'function'`. |
| FRO-04 Error boundary per ruta | **Fet.** | `src/app/App.jsx`: `RouteErrorBoundary` exportada, `resetKey={location.pathname}`, `getDerivedStateFromProps`, `role="alert"`, detall d'error només en DEV. |
| E.5 Publicador amb dos identitats: `IdentitatContext` | **Fet (capa de context).** | `src/app/contexts/IdentitatContext.jsx`: `listMyOrganizations`, `potSignarPer` (owner/admin), `entitatActiva` només si la preferència és una organització on es pot signar, `setActor`, preferència per usuari a localStorage; `App.test.jsx` amb el mock. |
| E.5 Migració `260926_1200_publicacions_autoria.sql` | **Creada, cal revisar.** `author_org_id` ja existix des de 260908 (redundant); la funció `pot_signar_com_organitzacio` + CHECK duplica el que ja fa la RLS i cal llevar-la. Falta: `grant select(logo_url), update(logo_url) on organizations to authenticated`, `list_my_organizations` retornant `logo_url`, `notes.copyright`, entrada al README. | `supabase/migrations/260926_1200_publicacions_autoria.sql`. |
| E.5 Capa de dades del publicador (`content.js`, `contracte.js`, `backendPort.js`, `notes.js`), faceta «Publicades», «Actualitzar/Retirar del Mur», `visibility` | **En pausa (rebutjat).** | Lot de 13 edicions declinat pel Mestre. |
| Bloc de Notes: barra d'eines sticky davall de l'entradilla, botó de copyright | **Pendent.** | — |
| Mòbil: CARPETES/NOTES en taronja (`--sdp-accent`; `--sdp-color-brand` no existix) | **En pausa (rebutjat).** | Formava part del lot declinat (`AppGridShell.css`). |
| Icona de l'ull a les contrasenyes (login/registre i perfil) | **En pausa (rebutjat) + pendent.** | El control `formulari.jsx` era al lot declinat; `DetallAjust.jsx` (línia ~279) i `OnboardingSteps` sense tocar. |
| Redisseny de l'Explorador del Cervell (menú de la Wiki, entradilla, filtres al costat del zoom) | **En pausa (rebutjat) + pendent.** | La retirada de `obrir_graf` a `WikiDePobleSection.jsx` era al lot declinat; `ExploradorMapa` sense tocar. |
| Arquitectura completa d'usuari/perfil (files «actuar com», publicacions, exportar dades, reclamar entitat, nova organització) | **Pendent.** | Només la capa de context. |
| Reflex d'edició (jo, únic editor) | Complit: cap subagent ha editat; els subagents només han cercat (Explore) i informat. | — |

### Troballes de la infraestructura de fons (petició posterior del Mestre i auditoria d'urgència de MarIA)

Resumides ací; el detall, les ordres i els riscos són a [[260926_1200_pla_implementacio_infraestructura_fons]].

1. `reflex-daemon`: bucle de `KeepAlive` cap a un script que mai ha existit; cal `bootout`, no reinici.
2. `time-machine`: cap plist instal·lat; `--llancador` + `bootstrap`.
3. Les cinc tasques d'higiene són subtasques de Plaquetes: llançador `tasca` al compilador (aplicat a `src/`) + registre (quarantena). Cap cron nou.
4. Hooks de git correctament instal·lats via Husky (`core.hooksPath = .husky/_`); `.git/hooks` no s'usa a propòsit. El compilador ara els jutja pel text del hook.
5. `hook-sense-consumidor` d'Antigravity és per disseny; `crida-inexistent` ve de la prosa (classes CSS i skills absorbides); `disparador-ample` són «error», «css», «ui». Pegats a la quarantena.
6. Trobat de pas: el detector d'error de `mapa-consola.mjs` només mirava l'última línia del stderr.

### Reflexió demanada: com evitar la fallada d'higiene de la IAIA MarIA

La lliçó del 260923 (netejar l'Escriptori i escriure el pla abans de cridar l'Olivera) existix només com a prosa a la skill. Tres peces la farien mecànica sense una persona vigilant:

- **Una sola porta d'eixida.** `porta-olivera.mjs --arxiva` i `document.mjs handoff` com a única manera de moure documents: l'índex de l'Escriptori d'este torn té sis blocs «Relleu arxivat a mà» amb àncores reapuntades, i cada un és un forat que algú va haver de tapar després.
- **La creació d'un prompt exigix l'Escriptori net.** `porta-plantilla-viva.mjs` ja vigila la plantilla; el mateix vigilant pot refusar crear un `_prompt_` nou si hi ha documents de sessions anteriors sense àncora o sense `handoff`, i dir quins.
- **El Calendari com a testimoni.** Amb el registre de subtasques d'este torn, Plaquetes és visible; un avís «Escriptori amb N documents de fa més de 24 h sense relleu» al Mapa faria que la brutícia es veja abans de la següent petorreta, no després.

### Millores del prompt (per a la IAIA MarIA)

- Declarar quins fitxers són **zona protegida pel hook** (`tooling/`, `.agents/`, `.husky/`, `package.json`, fora del repositori) i, per a cada un, si el destinatari porta lease o ha d'entregar paquet de laboratori. La petorreta 1115 demanava `tooling/documental/relleu.mjs` i canvis a `command-policy.mjs` sense lease: no es podien fer.
- Nomenar el fitxer del pla i de l'informe amb la mateixa hora termodinàmica que el prompt (la lliçó 260922) i crear-los amb `document.mjs create` abans de llançar-lo, per a evitar el rebut fantasma.
- Enumerar les ordres de lectura permeses pel hook (`npx vitest run <ruta>` sense canonades, `document.mjs context/create/check/plan`, `obrir_torn.mjs`) i les bloquejades (`git status`, `ls`, `grep`, `launchctl`, tot amb `|`): el destinatari ho descobrix a colps.
- Quan un lot d'edicions depén d'una aprovació humana (permisos de l'app), demanar-les en lots xicotets per fitxer: un rebuig d'un lot de 13 pausa tot el bloc.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `npx vitest run` sobre les àrees tocades en la fase 2 (App, DetallAjust, IdentitatContext i veïns): 13 fitxers, 72 proves verdes abans de la compactació de context.
- `npx vitest run src/sections/consola/mapa/construeixMapa.test.js`: 24/24 (infraestructura de fons).
- `npx vitest run src/sections/consola`: 7 proves de `ConsolaSection.test.jsx` roges per canvis aliens a este torn a `TargetaConsola`/`UniversalCard` (arbre concurrent); anotat, no corregit.
- Navegador (dev server del Mestre, port 3340): Mapa viu llegit a `/__iaia/mapa.json` per a fixar l'estat de partida del Calendari.
- Documents: `document.mjs check` valid:true sobre el pla 1200; este informe es valida en el mateix acte d'escriure'l.
- **No executat** (bloquejat pel hook per a l'agent): `npx vitest run src` sencer, lint, build, cadena de portes, `tancament.mjs --check`, `node --test tests/`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- L'agent no pot escriure a `tooling/`, `.agents/`, `.husky/`, `~/Library` ni a la seua memòria persistent, ni executar `launchctl`, `git status`, `ls` o `grep`: tot això és paquet de laboratori o runbook per al Mestre.
- El lot rebutjat pel Mestre no es torna a proposar sense ordre; el text de cada edició és a la transcripció del torn i es pot reproduir quan es demane.
- La compactació de context a mitjan torn ha esborrat el text literal de les edicions pausades; el que queda és el resum d'este informe.
- ESTAT.md i LEDGER.md no s'han pogut actualitzar (zona protegida); el relleu del torn queda ací i al pla 1200. `tancament.mjs --check` no és executable per l'agent.
- La migració E.5 s'ha escrit sense poder aplicar-la contra Supabase local: la revisió pendent la llista la taula de Troballes.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_0130_pla_implementacio_auditoria_extrema]]
- [[260926_1115_prompt_execucio_fable]]
- [[260926_1200_pla_implementacio_infraestructura_fons]]
