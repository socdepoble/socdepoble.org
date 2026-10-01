---
type: prompt
status: esborrany
description: Auditoria de Seguretat i Enxufabilitat
tags:
  - govern
visibility: private
reflex: sdp:torn_0a24c0cd-9dc8-4316-b35c-cc43b71dc206:1e56a15a-f6f5-4dbf-b7f0-8eeec95d7338
---
# Prompt Codex

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0a24c0cd-9dc8-4316-b35c-cc43b71dc206:1e56a15a-f6f5-4dbf-b7f0-8eeec95d7338 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T18:05:20.767Z |
| Modificació | 2026-10-01T18:05:20.767Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T18:05:20.767Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Hola Codex. Necessite que t'encarregues d'una auditoria crítica sobre la part de **Seguretat** i la seua integració a través de l'**Enxufabilitat amb Sollutia**. És vital seguir millorant tot el connector (plugin) de WordPress perquè es veja i funcione exactament igual que a `localhost`.

Ara mateix estem tenint alguns errors i volem blindar la capa de dades, evitant riscos al desplegar les modificacions i garantint que l'adaptador WP mantinga el mateix comportament que Vite al 100%.

L'error actual que es produeix a `https://gentdelatorre.net` amb el connector instal·lat és que les peticions a Supabase llancen un **400 Bad Request**. El motiu és que `tenant_id` arriba a la petició com a `undefined` (`GET .../rest/v1/section_s... tenant_id=eq.undefined`). 

No obstant això, **a l'administrador de WordPress**, la configuració "Abast de dades del poble" mostra correctament el UUID del tenant: `11111111-2222-3333-4444-555555555555`. 
Hem revisat el flux i pareix que `configAmfitrio.js` no exporta el `tenantId` (només exporta `nomPoble` i `poble`), o la injecció de `configura` des del marcatge de WP no li passa adequadament eixe camp al `backendConfig`. La font d'on proveeix la UI del component (Vite/React) no pot ser `VITE_TENANT_ID` des d'un enviroment local en un escenari SPA enxufat, sinó que ha de venir injectat per l'amfitrió en el global. Però a l'arxiu `marcatge.php` del plugin WP l'UUID tampoc no sembla arribar correctament al DOM o `window.SocDePobleConfig`.

### Pla d'Implementació

**Objectius**
1. **Auditoria del Brain i Tractors (Claude):** Revisió d'errors a consola i avaluació de l'estat dels tractors d'higiene i telemetria de l'AIIA, així com dels textos legals.
2. **Seguretat i Enxufabilitat de Sollutia (Codex):** Avaluació del connector de WordPress, per resoldre l'error 400 Bad Request i assegurar que la paritat amb `localhost` siga total i indistingible.
3. **Sincronització de Rutes i SEO (Codex):** Aconseguir que les rutes de l'SPA se sincronitzen amb la barra d'adreces de WordPress (recuperar la URL real de cada subpàgina, ex. `/enxufe/mercat`) per a permetre els enllaços profunds i el SEO, evitant que WordPress retorne 404 per a les subrutes de l'SPA quan s'insereix el shortcode.

**Passos (Checklist)**
- [ ] Claude: Executar auditoria de consola i de tractors a l'Escriptori.
- [ ] Claude: Revisar la política de privacitat i textos legals per equiparar-los a estàndards globals (tipus WhatsApp).
- [ ] Codex: Inspeccionar com es resol i s'injecta el `tenantId` des de WordPress/Sollutia. Actualment s'està injectant com a `undefined` a l'entorn de producció malgrat estar present al panell d'administració de WordPress.
- [ ] Codex: Proposar refactorització a l'adaptador WP (marcatge.php o configAmfitrio.js) per garantir que `tenantId` estiga disponible al boot.
- [ ] Codex: Proposar una arquitectura d'enrutament (rewrite rules a WordPress + History API a l'SPA) per a resoldre el problema de les adreces web reals, permetent el SEO i evitant que tot transcórrega de forma oculta a `gentdelatorre.net/enxufe`.
- [ ] MarIA: Aplicar el consens i desplegar el paquet a WordPress per verificar-ho en viu.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Auditar a fons la capa de seguretat del Plugin de WordPress (especialment l'adaptador `marcatge.php` i `src/config/configAmfitrio.js` on s'insereixen les dades/estat en l'HTML enxufat). Descobrir per què `tenantId` es perd i per què es produeix la crida amb `tenant_id=eq.undefined`.
- T2: Confirmar l'enxufabilitat (Pluggability) per a Sollutia, validant que no tenim cap lògica frontend altament acoblada a `.env` que impedeixi que Sollutia o WordPress injectin dinàmicament el tenant id necessari a la consola.
- T3: Analitzar i reportar les línies de codi i solucions tècniques necessàries perquè el comportament tècnic sota WordPress es clone de forma indistingible a l'entorn de `localhost`.
- T4: Dissenyar el mecanisme per a sincronitzar l'estat del router de React amb la URL de WordPress, assegurant que les subrutes (ex. `/mur`, `/mercat`) modifiquen la URL visible sense recarregar i que WordPress puga rebre l'enllaç profund inicial sense retornar un 404.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Trencament d'estils o accessos a dades en WordPress si les rutes o la resolució d'amfitrió confon el `tenantId` (Supabase) amb el `poble` (slug visual).
- Exposar dades incorrectes si el proxy no aïlla correctament els tenants per culpa del valor `undefined`.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
