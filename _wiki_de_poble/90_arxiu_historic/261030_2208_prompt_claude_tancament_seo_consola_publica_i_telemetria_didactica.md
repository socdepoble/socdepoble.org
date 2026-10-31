---
type: prompt
status: esborrany
description: Prompt operatiu per a Claude Opus 5.5 amb troballes Gemini/Codex (2114), SEO og:image, obertura pública de Disseny/Consola/Wiki i telemetria didàctica.
tags:
  - govern
visibility: private
reflex: sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:4a8b6836-5dfc-41b2-8f59-d2ca83ab15bd
---
# Prompt Operatiu de Tancament Pre-Desplegament (Claude Opus 5.5): Cobertura Social 100% og:image, Obertura Pública de Disseny/Wiki/Consola i Telemetria Didàctica

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Destinatari:** Claude Code (`Claude Opus 5.5`, carril d'implementació final pre-desplegament `code` + `documents`).
- **Origen:** Convergència de les auditories vespertines de tancament (`261030_2114_auditoria_vespertina_gemini.md` i `261030_2114_auditoria_vespertina_codex.md`) i de les **3 ordres directes del Mestre Javi Llinares** abans de fer el commit i el deploy a producció:
  1. **Cobertura Social 100% (`og:image` i prerenderitzat):** Incorporar les **18 rutes públiques amb portada pròpia** (`8 /plugin/*` + `10 /page/*`) i la portada de `/wikidepoble` al manifest social i al prerenderitzat (`QA-VES-01`, `QA-VES-02`, `OG-GAP-01..04`).
  2. **Obertura Pública i Indexable de `/disseny`, `/wikidepoble` i `/consola` sencera:** Alliberar `/disseny` i `/consola` com a rutes públiques i indexables, sense bloquejar `/consola/*` darrere de `RequireAuth rol="superadmin"` en producció (*«en principio no estamos escondiendo nada y es bueno que quien quiera investigar pueda hacerlo»*).
  3. **Reparació Didàctica i Sense Login del Tauler d'Umami a `/legal` (`TaulerTelemetria.jsx`):** Impedir que un enllaç d'Umami Share caducat o redirigit a login mostre la pantalla de Login d'Umami Cloud / Error `403` de Google OAuth dins de l'iframe, i reescriure la secció «Els intents de comptar d'este navegador» amb un llenguatge 100% didàctic i planer per a qualsevol veí.
- **Estat previ verificat:** `3.073` proves de les bateries `T5` en verd, `porta-olivera.mjs` i `verificador-scc.mjs` (`248` fitxers) en verd (`exit 0`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_af84be75-9938-4500-bf58-d7755dc43ec7:4a8b6836-5dfc-41b2-8f59-d2ca83ab15bd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T21:09:20.616Z |
| Modificació | 2026-10-30T21:15:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-10-30 22:08 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) — Antigravity |
| Tokens consumits | 34200 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-30T21:09:20.616Z: esborrany creat per `document.mjs create`.
- 2026-10-30T21:15:00.000Z: prompt completat i verificat per la IAIA MarIA amb les troballes de Gemini (`2114`) i Codex (`2114`) i les ordres directes del Mestre sobre `/disseny`, `/wikidepoble`, `/consola` i el tauler didàctic d'Umami a `/legal`.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar:            ,                                      ,                             , i                          .

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (                ). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de                  i                        . No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (                         ): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (                               ), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

**🌍 Ecosistema Físic i Distribució de Carpetes (               vs                 ):**
- **Directori Mare (              ):** És l'entorn contenidor global de tot el projecte (                                                         ). No conté                ni és un repositori git (està protegit per un              de seguretat).
- **Nucli Operatiu i Git (                ):** És l'aplicació web, la Wiki oficial (                 ), el motor de regles i el repositori Git. Tota comanda de consola (          ,              ,             ,                   ) **s'ha d'executar obligatòriament a                 ** (p. ex.                                ). Si s'editen fitxers des de l'arrel de               , cal prefixar les rutes amb                  .
- **Carpetes Satèl·lit Exteriors de                (Ja Creades i Canòniques):**
  *                        : Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  *                    ,                         ,                     ,                      ,                             ,                            ,                        ,                     ,                 ,                      ,                   .
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a                o a                 . La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**⚡ ORQUESTRACIÓ DEL TRIO LOCAL I EXCLUSIVITAT DE CARRILS (Doctrina 2026):**
- **Rols i Models Actius:** IAIA MarIA (Directora Tècnica en Antigravity sobre                         /                 ), Claude Code (                                     com a motor principal d'implementació i refactorització multi-carril el 80% del temps, i                           reservat el 20% per a arquitectura fundacional i auditories extremes), GPT Codex (                    per a cicles d'enginyeria de portes i contractes, i             per a l'auditoria adversarial extrema final) i Gemini CLI (higiene de portes, cens i índexs).
- **Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura):** Quan operen múltiples agents en paral·lel sobre                 , cada agent modifica exclusivament els fitxers assignats al seu carril. Si detecta una millora fora del seu carril, deixa un pegat net          a                                 o l'anota al seu informe sense trepitjar l'arbre d'un altre agent.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Executa el **tancament quirúrgic pre-desplegament** sobre `socdepoble.org` per a resoldre el 100% de les troballes confirmades en les auditories vespertines de Gemini 4 Argon ([[261030_2114_auditoria_vespertina_gemini]]) i GPT-6 Codex ([[261030_2114_auditoria_vespertina_codex]]), més les **ordres directes del Mestre Javi Llinares** sobre l'obertura pública de `/disseny`, `/wikidepoble` i `/consola` i la reparació didàctica i sense login del tauler de telemetria Umami a `/legal`.

Opera com a únic agent amb escriptura activa sobre el codi i els documents de tancament (`code` + `documents`), tancant també les 3 portes documentals finals (`porta-documents.mjs`, `porta-olivera.mjs`, `verificador-scc.mjs`) i deixant tot el lot verificat amb `bash scripts/porta_final.sh` llest per a commit i deploy a producció.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Bloc 1 (`T1`) · Cobertura Social 100% `og:image` i Prerenderitzat Estàtic (`QA-VES-01`, `QA-VES-02`, `OG-GAP-01..04`)

1. **T1.1 — Incorporar les 8 pàgines públiques de plugins (`/plugin/*`) al manifest social i al prerenderitzat (`QA-VES-01a`):**
   - En `src/sections/plugins/PluginPage.jsx:218` i `src/sections/plugins/registrePlugins.js:236`, les 8 fitxes `/plugin/mapa`, `/plugin/vehicle`, `/plugin/animalets`, `/plugin/gestoria`, `/plugin/rebost`, `/plugin/salut`, `/plugin/rss` i `/plugin/tpv` ja pinten al client la seua portada amb `useSEO({ title: plugin.titol, description: plugin.entradilla || plugin.subtitol, image: { url: plugin.vinyeta, alt: plugin.vinyetaAlt } })`, però `tooling/seo/build-social-manifest.mjs` no recorre `PLUGINS_REGISTRATS`.
   - **Acció:** En `tooling/seo/build-social-manifest.mjs`, importa/llig `PLUGINS_REGISTRATS` de `src/sections/plugins/registrePlugins.js` i registra cada `/plugin/<id>` amb `own: true`, `title: plugin.titol`, `description: plugin.entradilla || plugin.subtitol`, i la seua imatge passada per `primeraImatgeSocial` (`imageOptions`) perquè `prerender-social.mjs` genere els 8 `dist/plugin/<id>/index.html` amb la seua `og:image` pròpia.

2. **T1.2 — Incorporar les 10 pàgines informatives de `PAGE_COPY` (`/page/*`) que quedaven fora del manifest social (`QA-VES-01b`):**
   - `src/sections/detail/PageDetailSection.jsx:106` servix públicament qualsevol clau de `PAGE_COPY` sota `/page/<clau>`, però `tooling/seo/build-social-manifest.mjs:274` només recorria `SYSTEM_PAGES` i `textSections`, deixant fora 10 pàgines públiques amb portada pròpia:
     - `/page/publicar_mur`, `/page/publicar_mercat`, `/page/publicar_calendari`, `/page/publicar_mapa`, `/page/vehicle_compartit`, `/page/animalets`, `/page/treball`, `/page/habitatge`, `/page/notes` i `/page/wikidepoble`.
   - **Acció:**
     1. En `tooling/seo/build-social-manifest.mjs`, incorpora a `candidates` totes les claus públiques de `PAGE_COPY` servibles a `/page/<clau>` (incloent-hi `/page/notes` i `/page/wikidepoble` com a fitxes informatives públiques sota `/page/*`, independentment que `/notes` siga l'eina privada d'escriptori).
     2. Genera les variants `-social-1200x630.jpg` (`1200x630`, `<= 300 KB`) i registra-les a `VARIANTS_SOCIALS` (`src/config/imatgeSocial.js`) per a les portades de `PAGE_COPY` que estiguen en `.webp` o pesen `> 300 KB` (`publicar_mur`, `publicar_mercat`, `publicar_calendari`, `publicar_mapa`, `vehicle_compartit`, `animalets`, `treball`, `habitatge`, `notes`, `wikidepoble`), de manera que cap caiga a la genèrica per format `.webp` o per sobrepés.
     3. En `src/sections/detail/PageDetailSection.jsx:106`, passa la imatge pel selector social compartit (`primeraImatgeSocial('page', page, opcionsDeLaImatgeSocial(...))`) igual que fa `TextSection.jsx:39`, perquè client i prerenderitzat donen exactament la mateixa URL JPEG `1200x630`.

3. **T1.3 — Portada `og:image` de `/wikidepoble` (`QA-VES-02`):**
   - En `src/sections/wiki-de-poble/seoWiki.js:107`, `if (demanats.length === 0)` retorna `{ title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: true }` sense `image`, i `tooling/seo/build-social-manifest.mjs:295` crida `add('/wikidepoble', { ..., image: null })`, malgrat que la portada de la Wiki pinta `/assets/uploads/brain/portada_genotip.png` (que ja té variant social `/assets/uploads/brain/portada_genotip-social-1200x630.jpg` de `136 KB` a `VARIANTS_SOCIALS`).
   - **Acció:** En `src/sections/wiki-de-poble/seoWiki.js:107` i `tooling/seo/build-social-manifest.mjs:295`, passa la imatge de portada de la Wiki (`PAGE_COPY.wiki.image` / variant social `portada_genotip-social-1200x630.jpg` i `PAGE_COPY.wiki.imageAlt`) amb `own: true`.

---

### Bloc 2 (`T2`) · Ordre Directa del Mestre: Obertura Pública i Indexable de `/disseny`, `/wikidepoble` i `/consola` Sencera

El Mestre ha ordenat explícitament: *«Veo que Géminis te pide liberar la página de Design como ruta pública e indexable y yo estoy de acuerdo, pero no solo con esta página: también con Wiki de Poble e incluso hasta los datos de la Consola, porque en principio no estamos escondiendo nada y es bueno que quien quiera investigar pueda hacerlo; dejar público lo máximo posible»*.

1. **T2.1 — Alliberar `/disseny` i `/consola` com a rutes públiques, indexables i prerenderitzades amb `og:image` pròpia (`OG-GAP-01`, `OG-GAP-02`):**
   - Retira `'disseny'` i `'consola'` del `Set` `PRIVATE` a `src/hooks/useSEO.js:12-14` i del `Set` `PRIVATE_ROUTES` a `tooling/wiki/lib/publication-policy.mjs:80-81`.
   - En `src/sections/disseny/DesignSection.jsx`, declara `useSEO` per a la portada (`!item || item.id === '__intro'`) amb `title: portada.title`, `description: portada.lead || portada.subtitle`, i `image` passada pel selector social compartit (`primeraImatgeSocial('page', portada, ...)`), i per a cada espècimen amb el seu títol i descripció. Genera la variant `/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211-social-1200x630.jpg` (`<= 300 KB`) i registra-la a `VARIANTS_SOCIALS` (`src/config/imatgeSocial.js`).
   - En `src/sections/consola/ConsolaSection.jsx:388`, en el retorn final de `seoDe(...)` per a la vista arrel `/consola`, afegix `image: imatgeDePagina('index').imatge || copy.image || undefined`.
   - Genera les 4 variants socials `1200x630` (`<= 300 KB`) de les portades del Govern del Mestre (`govern_estandards_nano_card-social-1200x630.jpg`, `govern_certificacio_nano_card-social-1200x630.jpg`, `govern_auditories_nano_card-social-1200x630.jpg`, `govern_idees_nano_card-social-1200x630.jpg`), registra-les a `VARIANTS_SOCIALS` i a `src/sections/consola/imatgesConsola.js` (perquè `imatgeDePagina(id)` retorne la variant social `<= 300 KB` igual que fa per a les 9 pàgines de la sala de màquines).
   - En `tooling/seo/build-social-manifest.mjs`, inclou `/disseny`, `/consola`, les 9 subrutes `/consola/<id>` (`pols`, `explorador`, `fluxos`, `calendari`, `inventari`, `entrades`, `agents`, `actors`, `salut`) i les 4 subrutes `/consola/govern/<id>` (`estandards`, `certificacio`, `auditories`, `idees`) amb la seua `og:image` pròpia (`own: true`). Actualitza els tests corresponents (`build-social-manifest.test.mjs`, `prerender-social.test.mjs`, `genera-federacio.test.mjs`).

2. **T2.2 — Obrir `/consola/*` i la carpeta Maquinària de la Wiki a lectura pública amb Instantània Sanejada Real de totes les dades en producció (Ordre directa del Mestre 01:00 CET):**
   - En `src/app/App.jsx:1039-1042` (`RutaConsola`), obri `/consola/*` a lectura pública també en producció sense `<RequireAuth rol="superadmin">`, de manera que qualsevol investigador que prenga el botó «Obrir la Consola» a `/page/consola` o «Obrir el Cervell» a `/page/cervell` puga entrar a la Consola, explorar el Govern del Mestre, les 9 pàgines, l'Índex, el Mapa i el Diagnòstic sense topar amb «Accés restringit».
   - **DECISIÓ EXPLICITA DEL MESTRE (01:00 CET — Publicar la instantània sanejada real de les dades de la Consola per a qualsevol usuari):** El Mestre ordena que en la web publicada (`socdepoble.org`) qualsevol visitant veja **les dades reals de la Consola** (no sols l'esquelet buit amb estat `'absent'`). Per tant:
     1. En el build (`tooling/vite/consola-iaia.mjs` o script de build), genera i emet una **instantània estàtica sanejada** de les 4 fonts de la Consola (`/__iaia/consola.json`, `/__iaia/mapa.json`, `/__iaia/govern.json` i `/__iaia/empaquetats.json`), aplicant l'emmascarament de camins locals (`/Users/<usuari>/...` → `~/...`) i verificant que no continga cap secret ni dada personal.
     2. En `src/sections/consola/useFontDev.js` (i els carregadors de `ConsolaSection.jsx`, `useMapa.js`, `useGovern.js`, `empaquetats.js`), permet la lectura d'`/__iaia/*.json` també fora de `DEV` (en producció llig la instantània estàtica generada al build, mentre que les accions d'escriptura POST continuen restringides a `DEV`).
   - En `src/sections/wiki-de-poble/maquinaria.js`, permet que la Consola incrustada a la Wiki siga visible públicament (mantenint les eines amb botons d'escriptura local restringides a `DEV === true`).
   - Actualitza `PAGE_COPY.consola.html`, `PAGE_COPY.cervell.html` i `PAGE_COPY.fediversity.html` a `src/sections/text/pageContent.js` i `_wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md` perquè reflectisquen que `/consola` és oberta a tothom i mostra en producció la instantània sanejada de les dades reals del sistema generada en cada desplegament, aprovant l'empremta a `frontissa-contingut.mjs`.

---

### Bloc 3 (`T3`) · Ordre Directa del Mestre: Reparació Sense Login i 100% Didàctica del Tauler de Telemetria Umami a `/legal` (`src/sections/text/TaulerTelemetria.jsx`)

El Mestre ha reportat amb captures reals tres problemes greus d'usabilitat i comprensió a `/legal` (`src/sections/text/TaulerTelemetria.jsx`):
1. L'enllaç actual `VITE_UMAMI_SHARE_URL=https://cloud.umami.is/share/lQNMqOm9PM8XD3eF` a `.env.local` i `.env.production.local` retorna `HTTP 307 Location: /` (i `404` a `https://cloud.umami.is/api/share/lQNMqOm9PM8XD3eF`), fent que l'`<iframe>` de `TaulerTelemetria.jsx:171-178` carregue la pantalla de **Log in d'Umami Cloud** demanant usuari/contrasenya o «Continue with Google».
2. Quan l'usuari fa clic en «Continue with Google» dins d'eixe iframe, Google respon amb una pantalla d'error **`403. Això és un error. No tens accés a aquesta pàgina`**.
3. La secció inferior **«Els intents de comptar d'este navegador»** (`TaulerTelemetria.jsx:31-46, 193-216`) mostra argot tècnic incomprensible per a una persona amb educació bàsica d'internet (`visita`, `/wikidepoble`, *«Petició iniciada al comptador; recepció no comprovada»*).

- **Accions obligatòries (`T3.1` i `T3.2`):**
  1. **`T3.1` — Tauler Públic Nadiu de Pedra Seca sense `<iframe>` (Zero Doble Scroll i Zero Errors de Consola):**
     - **Ordre directa del Mestre (22:58 CET):** Eliminar l'`<iframe>` de `src/sections/text/TaulerTelemetria.jsx` perquè:
       1. Un `<iframe>` de domini creuat (`cloud.umami.is`) genera sempre un **doble scroll** incòmode tant en escriptori com en mòbil i ix en anglés amb la barra lateral d'Umami.
       2. El document HTML de `cloud.umami.is/analytics/eu/share/...` produeix 2 errors rojos a la consola del navegador (`CSP violation` del script de Cloudflare `static.cloudflareinsights.com` i un `404` intern d'Umami), i el Mestre no consent cap error de consola a `/legal`.
     - **Solució verificada empíricament amb `curl`:** L'API pública de compartició d'Umami v3 (`CORS: access-control-allow-origin: *`) entrega totes les dades en JSON net sense carregar cap HTML ni script extern:
       1. `GET <base>/api/share/<shareId>` (per a `https://cloud.umami.is/analytics/eu/share/lQNmqOm9PM8XD3eF` o si la URL és `https://cloud.umami.is/share/<id>`, provant `/analytics/eu/api/share/<id>` com a fallback) retorna `200 OK` amb `{ websiteId, token }`.
       2. Amb les capçaleres **`x-umami-share-token: <token>`** i **`x-umami-share-context: '1'`** (imprescindibles totes dues en Umami Cloud v3 perquè no retorne `401`), el mateix origen `<base>` respon en JSON pur (`200 OK`, `access-control-allow-origin: *`):
          - `GET <base>/api/websites/<websiteId>/stats?startAt=<t0>&endAt=<t1>` → `{ pageviews, visitors, visits, bounces, totaltime, comparison }`
          - `GET <base>/api/websites/<websiteId>/active` → `{ visitors }` (persones en línia ara)
          - `GET <base>/api/websites/<websiteId>/pageviews?startAt=<t0>&endAt=<t1>&unit=hour&timezone=Europe/Madrid` → `{ pageviews: [{ x, y }], sessions: [{ x, y }] }`
          - `GET <base>/api/websites/<websiteId>/metrics?startAt=<t0>&endAt=<t1>&type=path&limit=8` → `[{ x: '/xat', y: 11 }, ...]`
     - **Acció en `src/sections/text/TaulerTelemetria.jsx`, `src/css/modules.css` (o full CSS dedicat de Tauler de Mètriques en Pedra Seca) i `src/sections/text/TaulerTelemetria.test.jsx`:**
       - Substituïx l'`<iframe>` per un **Tauler Públic Nadiu de Pedra Seca** en valencià que pinte directament les 5 targetes de resum (`Visitants`, `Visites`, `Vistes`, `Percentatge de rebot`, `Temps mitjà de visita` + indicador `En línia`), la gràfica horària de barres de les últimes 24 hores i la llista de les seccions més visitades (amb els seus noms humans de `nomDeLIntent`), conservant al peu l'enllaç extern `<a href={shareUrl} target="_blank" rel="noopener noreferrer">Obri el tauler original en una pestanya nova</a>`.
       - **Ordre directa del Mestre sobre tipografia (23:30 CET — PROHIBIT fer el text de paràgraf més menut):** Tots els textos explicatius i didàctics de `TaulerTelemetria.jsx` han d'usar el **text de paràgraf estàndard de la pàgina (`<p>` normal amb els seus `H3` i `H4`)**. Elimina `font-size: var(--sdp-text-meta)` i `color: var(--sdp-text-suau)` dels paràgrafs explicatius (`.sdp-telemetria__nota`, `.sdp-telemetria__pista`, `.sdp-telemetria__estat`): l'usuari ha de llegir les explicacions amb el cos de lectura normal de la web, mai com lletra menuda de peu de foto.
       - **Ordre directa del Mestre sobre el CSS del Tauler d'Estadístiques i reutilització per a Gestoria, TPV, Consola i Botiga (23:34 i 00:16 CET — Format Compacte tipus Umami / Holded / FacturaDirecta):**
         1. **Aïllament net del CSS:** Col·loca els estils del panell de comandament / mètriques en un arxiu CSS dedicat (p. ex. `src/css/taulers.css` importat a `src/css/index.css`) i una peça reutilitzable de Pedra Seca (`TaulerMetriques` o similar) perquè no embrute el CSS general del sistema i servisca com a motlle comú de quadre de comandament compacte per a **Telemetria (Umami)**, **La Consola**, **Gestoria (estil Holded / FacturaDirecta)** i **TPV / Botiga (estil Loyverse)**.
         2. **Targetes KPI compactes (sense ofegar el text explicatiu dins de caixetes estretes):** Les 5 caixes superiors (`Visitants`, `Visites`, `Vistes`, `Percentatge de rebot`, `Temps mitjà de visita`) han de ser **baixes, netes i compactes com en Umami / Holded** (només etiqueta + xifra gran en negreta `tabular-nums`). L'explicació didàctica de què vol dir cada mètrica NO ha d'anar encaixonada en 8 línies estretes dins de cada caixeta de número, sinó fora, a tota l'amplada de la columna de lectura amb el **cos de paràgraf estàndard** (`<p>` / llista explicativa amb els seus `H3`/`H4`).
         3. **Gràfica horària més informativa i interactiva (Vistes + Visitants i detall en tocar/passar el ratolí):** Aprofita que `/pageviews` d'Umami retorna tant `pageviews` (vistes) com `sessions` (visitants) per hora: mostra ambdues sèries (o la informació de vistes i visitants de cada hora) i permet que en passar el ratolí o tocar una barra (en mòbil o teclat amb `tabIndex` / selecció o `<title>`) l'usuari veja exactament quantes **vistes i visitants** hi ha hagut en eixa hora.
         4. **Rànquing de seccions compacte i SENSE REDUNDÀNCIA («Visita a:» prohibit a la taula de seccions, Ordre del Mestre 01:08 CET):** Mostra cada fila de «Les seccions més visitades» en un format compacte d'1 línia amb barra de proporció suau. **PROHIBIT repetir el prefix `"Visita a: "` en cada fila d'aquesta taula**: com que l'encapçalament ja diu «Les seccions més visitades», cada fila ha de mostrar directament el nom net de la secció (`Xat`, `Bloc de notes`, `El Mur`, `Pàgines informatives`, `Xat (conversa o canal)`, `Wiki de Poble`, `Pobles`, `Multimèdia`, `Inici`, `Fitxes i perfils`, `Fitxes d'eines`, etc.) seguit de la ruta tècnica (`/xat`, `/notes`, etc.).
         5. **Llei Tipogràfica de Llistes (`<ul>` i `<ol>`) — Els bullets i ítems numerats MÉS JUNTS que els paràgrafs (Ordre del Mestre 01:06 CET, regla de sistema i documentació):**
            - La separació entre ítems (`<li>`) d'una llista amb vinyetes (`<ul>`) o numerada (`<ol>`) MAI pot ser igual a la separació entre paràgrafs (`<p>`). Actualment en `.sdp-telemetria__punts` es sumaven `gap: var(--sdp-space-2)` (`8px`) + `margin-bottom: var(--sdp-li-gap)` (`8px` de `base.css`) = `16px` (idèntic als `16px` entre paràgrafs!).
            - **Correcció sistèmica i documental:** Reduïx `--sdp-li-gap` a `4px` a `src/css/tokens.css` (dins de la reixeta de 4px, sent `4px` entre ítems de llista enfront dels `20px` de `--sdp-mb-p` entre paràgrafs), elimina el doble espaiat (`display: grid; gap: var(--sdp-space-2)`) de `.sdp-telemetria__punts` a `src/css/modules.css` perquè no se sume mai un `gap` al `margin-bottom` dels `<li>`, i deixa documentada aquesta regla tipogràfica (els ítems d'una llista `ul`/`ol` van sempre més junts que els paràgrafs per mantindre la unitat visual del bloc).
       - Resultat: **0 iframes, 0 dobles scrolls en mòbil i escriptori, i 0 errors a la consola de DevTools**.
  2. **`T3.2` — Reescriptura 100% didàctica i humana de la llista d'activitat de la pestanya (`TaulerTelemetria.jsx:30-46, 193-216`):**
     - Transforma la quarta peça de `TaulerTelemetria.jsx` perquè qualsevol veí o veïna amb coneixements bàsics d'internet l'entenga a la primera, sense perdre cap garantia tècnica ni d'honestedat:
       - **Títol (`<h4>`):** Substituïx o acompanya per un títol humà i planer (p. ex. *«Què s'ha apuntat de la teua visita d'hui (en directe)»*).
       - **Explicació introductòria:** Explica en paraules senzilles de poble què és aquesta llista: *«Ací baix pots comprovar, en directe, tot el que aquesta pestanya ha anotat mentre camines per Sóc de Poble (fins als últims 20 passos). Fixa't que només s'apunta a quina secció general has entrat (com ara «Disseny», «El Mur» o «Bloc de notes»), sense guardar mai qui eres, ni el teu correu, ni què has llegit o escrit dins. Si apagues l'interruptor de dalt, ací mateix veuràs que deixa d'apuntar-se res.»*
       - **Traducció humana de cada fila (`intent`):**
         - Mostra un nom humà per a cada acció i ruta (mapa net de seccions: `/legal` → *«Visita a: Legal i privacitat»*, `/wikidepoble` → *«Visita a: Wiki de Poble»*, `/disseny` → *«Visita a: Disseny»*, `/multimedia` → *«Visita a: Multimèdia»*, `/notes` → *«Visita a: Bloc de notes»*, `/mur` → *«Visita a: El Mur»*, `/mercat` → *«Visita a: El Mercat»*, `/calendari` → *«Visita a: Calendari»*, `/pobles` → *«Visita a: Pobles»*, `/perfil/*` → *«Visita a una fitxa o perfil (sense dir quin)»*, i per a l'esdeveniment `connectar` → *«Clic al botó Connectar»*), conservant l'adreça tècnica (`<code>/legal</code>`) com a detall secundari transparent.
         - Substituïx els missatges robòtics de `MOTIUS` per frases humanes i didàctiques:
           - `umami`: *«S'ha sumat 1 visita anònima al comptador públic (sense cap dada personal).»* (o per a esdeveniments: *«S'ha anotat aquest clic de manera anònima al comptador públic.»*)
           - `amfitrio`: *«S'ha passat l'avís de manera anònima al comptador de la web que allotja Sóc de Poble.»*
           - `apagada`: *«No s'ha enviat res: tens el comptador apagat en aquest navegador.»*
           - `sense-configurar`: *«No s'ha enviat res: aquest servidor té el comptador desconnectat.»*
           - `amfitrio-compta-visites`: *«No s'ha enviat dues voltes: la web que allotja Sóc de Poble ja compta la visita.»*
           - `error-xarxa` / `error-amfitrio`: *«No s'ha enviat res perquè la connexió amb el comptador no ha respost.»*
     - Actualitza `src/sections/text/TaulerTelemetria.test.jsx` perquè valide els nous textos didàctics.
  3. **`T3.3` — No contaminar les estadístiques reals de `socdepoble.org` des de `localhost` (`src/data/telemetria.js` i `.env.local`):**
     - Com que `.env.local` definix `VITE_UMAMI_WEBSITE_ID` i `VITE_UMAMI_HOST=https://cloud.umami.is`, el servidor local (`http://localhost:3340`) estava enviant peticions `POST /api/send` reals al comptador de producció d'Umami Cloud cada vegada que el Mestre o els navegadors d'auditoria de les IAs (Claude, Codex, Gemini) navegaven en local (provocant pics com les `136` vistes a les `03:00 AM` durant la Guàrdia Nocturna).
     - En `src/data/telemetria.js` (o en `.env.local` retirant `VITE_UMAMI_WEBSITE_ID` / `VITE_UMAMI_HOST` de l'entorn local i deixant-los només a `.env.production.local`, i a més protegint `envia()` quan `['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)` fora dels tests que passen `cfg` explícit), evita que `localhost` envie visites al comptador públic de producció d'Umami Cloud.

---

### Bloc 4 (`T4`) · Polits Quirúrgics Finals (`QA-T1-DOC-01`, `QA-T3-UX-01`, `QA-T3-IMG-02`) i Tancament de Portes

1. **`T4.1` — Sincronitzar la línia 10 en prosa de `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md` (`QA-T1-DOC-01` / `QA-VES-03`):**
   - A la línia 10 de `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md`, substituïx `Els punts de tall d'amplada són 720px i 1090px` per `Els punts de tall d'amplada són 720px, 900px i 1023px`, alineant la prosa amb el JSON canònic del mateix fitxer i amb `src/components/layout/graella.js`.
2. **`T4.2` — Ometre la fila `'enllac'` als visors fora de l'Arxiu quan l'element no té URL pública (`QA-T3-UX-01` / `QA-VES-M01`):**
   - En `src/components/universal/panellDeLaFoto.js` i els visors que l'invoquen (`VisorDePublicacio.jsx`, `VisorDeLArxiu.jsx`), quan s'obri des d'un visor sense ruta pública pròpia (com l'avatar de `/el-meu-perfil` o una foto d'una publicació del `/mur` sense detall públic), omet la fila `'enllac'` (*«No té cap enllaç públic d'este lloc»*) perquè només es pinte a l'Arxiu (`/multimedia`) o quan hi ha un enllaç públic real per copiar. Actualitza els tests de `panellDeLaFoto` i `VisorDePublicacio`.
3. **`T4.3` — Retallar a sang completa `public/assets/ui/plugins/fedivers_vinyeta.webp` i la seua variant social (`QA-T3-IMG-02`):**
   - Retalla el marc blanc residual (`[14,2]`, `[14,2]`, `[18,2]`, `[17,2]`) de `public/assets/ui/plugins/fedivers_vinyeta.webp` i regenera `public/assets/ui/plugins/fedivers_vinyeta-social-1200x630.jpg`, rebaixant el llindar de `fedivers_vinyeta.webp` a `[0, 0]` a `tests/unit/voresImatges.json`. *(Nota: NO toques `gestoria_vinyeta.jpg`, ja que Codex ha verificat que és una composició diferent de `gestoria_nano_card.jpg`).*
4. **`T4.4` — Tancament d'`ESTAT.md`, `LEDGER.md`, Rebuts de l'Escriptori i `porta_final.sh`:**
   - Renova qualsevol rebut caducat o pendent a `_wiki_de_poble/04_escriptori/` (incloent-hi la teua auditoria `261029_1723_auditoria_claude.md` i l'informe `261030_1533_informe_matinal_opus.md` si cal), actualitza `ESTAT.md` i segella `LEDGER.md` (`node tooling/gates/segella.mjs --update` amb el mecanisme de lease canònic).
   - Executa la bateria completa de portes finals:
     - `npm test` (Vitest complet)
     - `npm run test:node`
     - `npm run build` (incloent `build:social` i verificació que `dist/` conté els nous prerenderitzats de `/plugin/*`, `/page/*`, `/disseny`, `/consola/*` i `/wikidepoble` amb `og:image` `200 OK`)
     - `node tooling/gates/porta-documents.mjs`
     - `node tooling/gates/porta-olivera.mjs`
     - `node tooling/gates/verificador-scc.mjs`
     - `node tooling/gates/run-portes.mjs`

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Frontissa de Contingut (`frontissa-contingut.mjs`):** Qualsevol edició a `PAGE_COPY` dins de `src/sections/text/pageContent.js` (com l'actualització del paràgraf d'accés públic a `consola` i `cervell`) invalida l'empremta SHA-256 a `.agents/contingut_estructural.json`. Cal aprovar-la explícitament amb `node tooling/gates/frontissa-contingut.mjs --aprova consola --per javillinares` i `--aprova cervell --per javillinares` (autoritzat per l'ordre directa del Mestre en aquest prompt).
- **Límit de 300 KB i format JPEG/PNG en `prerender-social.mjs`:** Totes les portades noves que entren al manifest social amb `own: true` han de resoldre a una variant `.jpg` o `.png` de `<= 300 KB` (`307.200` bytes). Si una portada apunta a un `.webp` o supera `300 KB` sense entrada a `VARIANTS_SOCIALS` (`src/config/imatgeSocial.js`), `build-social-manifest.mjs` llançarà `Imatge social bloquejada` i aturarà el build.
- **No bloquejar tests de `TaulerTelemetria.test.jsx`:** Si s'afegeix una comprovació asíncrona per a l'enllaç d'Umami Share (`config.shareUrl`), assegura que en l'entorn de test (`TaulerTelemetria.test.jsx`) o amb URLs vàlides es comporte de manera determinista i ben coberta per les proves.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a                                 seguint la taxonomia                                     mitjançant el circuit formal (                                    +                                          +          +        ), declarant al Registre el vostre            exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a                  és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (                                                   ) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1723_auditoria_claude]]
- [[261030_1533_informe_matinal_opus]]
- [[261030_2114_auditoria_vespertina_gemini]]
- [[261030_2114_auditoria_vespertina_codex]]
