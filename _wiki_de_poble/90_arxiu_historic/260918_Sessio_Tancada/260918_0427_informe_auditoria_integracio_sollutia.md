---
type: informe
status: actiu
description: Auditoria extrema d'arquitectura, seguretat, accessibilitat, SEO i integració amb Sollutia
---

# Informe — Auditoria extrema d'integració Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-20260918-0427 |
| Respon a | [[20260918_0411_MACRO_PROMPT_auditoria_extrema]] |
| Versió | 1.0.0 |
| Entorn | `entorn-dev-local` |
| Tall auditat | 2026-09-18 04:27 CEST |
| Branca / commit | `backup-notes-publish` · `4aab0420` · arbre de treball amb canvis previs no atribuïbles a esta auditoria |
| Agent auditor | Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Mutacions autoritzades | només este informe, el seu ancoratge i el registre de tancament; cap línia de codi |

## Vincles

- [[00_index_escriptori]]
- [[20260918_0411_MACRO_PROMPT_auditoria_extrema]]
- [[260918_0243_informe_auditoria_extrema_postmigracio]]
- [[260918_0300_informe_auditoria_extrema_postmigracio_claude]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Dictamen executiu

**NO-GO per a un desplegament 100% Online connectat a Sollutia.**

El tall actual ha millorat respecte de les auditories de les 02:43 i 03:00: el build
Vite torna a compilar, els 45 tests passen, les importacions relatives són netes, el
refresc extern ja té consumidors i el fallback global ja s'anuncia amb
`role="status"` (`src/app/App.jsx:56-63`; `src/app/contexts/useRecarregaExterna.jsx:7-19`).
No obstant això, la compilació verda no representa una integració real amb Sollutia:
l'adaptador disponible és un únic *passthrough*, la porta només certifica lectura i
una sola fixture, mentre l'arrencada exigix els 32 mètodes del nucli abans de segellar
el backend (`src/data/adaptadors/sollutia/recursos.js:1-7`;
`tooling/gates/tractor-adaptadors.mjs:5-15,37-57`;
`src/data/contracte.js:2-35`; `src/host.js:160-174`).

Quatre aturadors impedixen donar conformitat:

1. La frontera Sollutia és arquitectura preparada, no una integració executable.
2. La política SEO de rutes privades només s'aplica després d'executar JavaScript;
   el servidor retorna el mateix HTML i `200` per a totes les rutes.
3. `/page/:slug` llança una excepció perquè el context no publica
   `pageDetailLookup`.
4. Les vies de desplegament i qualitat discrepen: CI, Docker i diverses portes estan
   roges o invoquen contractes inexistents.

### Recompte

| Prioritat | Quantitat | Lectura |
| --- | ---: | --- |
| P0 · aturador | 4 | impedix integrar, desplegar o rastrejar de manera fiable |
| P1 · alta | 8 | seguretat, dades, sessió, accessibilitat o disponibilitat |
| P2 · mitjana | 7 | coherència, rendiment, observabilitat o deute de control |

## Abast, límits i mètode

- Auditoria exclusiva del repositori local. No s'ha usat cap cercador, navegador,
  web externa ni font històrica remota.
- “Pedra Seca” significa exclusivament el Sistema de Disseny / UI Kit.
- No s'han llegit `.env`, credencials, claus, `.iaia_auth`, arxius de sessió ni
  artefactes històrics de secrets.
- No s'ha consultat la base de dades desplegada. Quan una conclusió depén de l'ordre
  real de migracions o de configuració de producció, queda marcada `[SUPÒSIT]`.
- No s'ha executat `npm audit`, perquè necessitaria informació externa i el protocol
  anti-cerca ho prohibix.
- No s'ha executat la cadena completa `npm run gate`, perquè la seua Porta Build pot
  regenerar artefactes. S'han executat de manera selectiva les portes de lectura.
- El build s'ha executat directament amb Vite i `outDir` dins de `/tmp`; no ha escrit
  cap artefacte al repositori.

## Matriu d'aturadors

| ID | Àrea | Impacte | Decisió requerida |
| --- | --- | --- | --- |
| P0-01 | Sollutia | No existix implementació real ni cobertura de contracte | no integrar fins a capturar API, DTO, errors i auth reals |
| P0-02 | SEO / privacitat | `noindex` privat no està garantit i el contingut públic és un shell sense SSR | particionar rutes a servidor/edge i definir render públic |
| P0-03 | Ruta de contingut | `/page/:slug` cau abans de poder redirigir o pintar | restaurar el contracte de lookup o retirar la ruta |
| P0-04 | Desplegament | CI, Docker i portes no descriuen una via reproduïble única | triar una canonada canònica i fer-la passar en clon net |

---

## Troballes P0

### P0-01 — La integració Sollutia encara és només una frontera nominal

**Evidència.** El contracte de nucli enumera 32 operacions, incloent dades, escriptura,
autenticació i xat (`src/data/contracte.js:2-35`). L'arrencada prohibix un backend
parcial i només cau a Supabase quan no s'ha injectat cap mètode
(`src/host.js:160-174`). En canvi, `src/data/adaptadors/sollutia/recursos.js` només
conté `perfil.traductor`, que torna el payload sense transformar
(`src/data/adaptadors/sollutia/recursos.js:1-7`). La porta de la frontissa prohibix
escriptures Sollutia i valida únicament les fixtures presents
(`tooling/gates/tractor-adaptadors.mjs:10-15,37-57`); l'única fixture és un perfil
(`tests/frontissa/fixtures/sollutia/perfil.json:1-17`).

**Impacte.** Un verd de `porta:frontera` o `porta:adaptadors` prova separació
arquitectònica, però no prova que Sollutia puga carregar Mur, Notes o Xat, renovar
sessió, resoldre rols, escriure amb idempotència o traduir errors. Una injecció
parcial fallarà en arrencar.

**Acció per a IAIA MarIA.** Exigir a Sollutia una matriu per als 32 mètodes de nucli,
les capacitats opcionals, l'esquema d'errors, timeout/reintent, idempotència,
paginació i identitat; capturar fixtures reals de cada recurs; i sotmetre un backend
complet a proves de contracte abans de canviar el fallback de Supabase.

**Criteri de tancament.** Un backend Sollutia complet arranca sense fallback, supera
proves de lectura, escriptura, auth, rol, caducitat, xat i error, i no necessita cap
coneixement de Supabase a la UI.

### P0-02 — `noindex` privat no està garantit sense SSR o control d'edge

**Evidència.** `robots.txt` permet rastrejar qualsevol ruta
(`public/robots.txt:1-4`) i Vercel reescriu qualsevol pathname a `index.html`
(`vercel.json:13-17`). L'HTML inicial només conté metadades genèriques i una arrel
buida (`index.html:9-29,63-71`). `useSEO` calcula la privacitat de `/jo` i `/e/` dins
d'un `useEffect`, és a dir, després de la hidratació
(`src/hooks/useSEO.js:11-18,53-55`). A més, `/` està al sitemap
(`public/sitemap.xml:3-7`) però el router el redirigix a `/jo/xat`
(`src/app/App.jsx:514-523,569-573`), ruta classificada com a privada pel mateix hook.

**Impacte exacte sobre la incògnita del prompt.** Ometre `/jo` i `/e` del sitemap
reduïx la descoberta, però no impedix la indexació. Un robot que arribe per un
enllaç, historial o URL directa rep `200` amb l'HTML genèric; si no executa
JavaScript, no veu el `noindex`. Alhora, les rutes públiques tampoc tenen HTML propi
abans de JavaScript, de manera que comparteixen title, descripció i Open Graph
inicials. La portada canònica té una contradicció: el sitemap la presenta com a
principal, però el client la porta a una àrea `noindex`.

**Acció per a IAIA MarIA.** Definir al servidor/edge una taxonomia tancada de rutes:
públiques indexables amb HTML renderitzat o prerenderitzat; privades amb
`X-Robots-Tag: noindex, nofollow` i resposta d'autenticació/404 coherent; i
desconegudes amb 404 real. Generar el sitemap exclusivament des d'eixa taxonomia i
decidir una portada pública estable, probablement `/mur` o una portada pròpia.

**Criteri de tancament.** Una petició HTTP sense JavaScript rep metadades, canonical,
estat i política robots correctes per a cada classe de ruta; cap URL privada o
inexistent torna un shell `200` indexable.

### P0-03 — `/page/:slug` cau per un contracte de context inexistent

**Evidència.** La ruta està publicada a `src/app/App.jsx:538-543`. El component
desestructura `pageDetailLookup` i crida `.get()` immediatament
(`src/sections/detail/PageDetailSection.jsx:11-16`). `CoreContentContext` només
publica `towns`, `pages`, `pageCopy`, `agents` i derivats; no publica eixe lookup
(`src/app/contexts/CoreContentContext.jsx:38-55,67-69`). La cerca pot generar
`/page/<slug>` per a qualsevol pàgina no coneguda
(`src/config/navigation.js:48-56`; `src/sections/search/SearchSection.jsx:77-95`).

**Impacte.** Qualsevol resultat de cerca o enllaç a una pàgina no mapejada llança
`TypeError` abans d'arribar al fallback o redirecció. El build no detecta el defecte.

**Acció per a IAIA MarIA.** Unificar la font de pàgines i el seu lookup en el
context, o retirar la ruta fins que existisca. Afegir una prova que navegue a un slug
existent, un desconegut i una pàgina remota.

**Criteri de tancament.** Les tres navegacions resolen sense Error Boundary i amb
canonical/404 coherents.

### P0-04 — No hi ha una canonada de desplegament única i reproduïble

**Evidència.** El workflow de Wiki invoca `npm run gateall`, però no hi ha cap script
`gateall` entre els scripts declarats (`.github/workflows/wiki-integrity.yml:34-47`;
`package.json:10-82`). El workflow principal sí executa `npm run gate`
(`.github/workflows/sdp_lock_ci.yml:19-22`), però en este tall hi ha portes roges:
RLS, catàleg, tokens, Design Guard i graella. El `Dockerfile` intenta copiar un
`pnpm-lock.yaml` absent de l'inventari, copia `.env` dins de la imatge, només copia
`bot/` i acaba amb `pnpm run start` encara que no existix script `start`
(`Dockerfile:6-23`; `package.json:10-82`). Tampoc hi ha `.dockerignore` en l'arrel
[verificació d'inventari local].

**Impacte.** El resultat depén del camí triat: Vite compila, CI no pot donar verd i
Docker no és construïble. Si s'arreglara només el lock, `.env` quedaria en una capa
de la imatge. `[SUPÒSIT]` Si Sollutia usa aquest `Dockerfile`, és un bloqueig directe;
si usa Vercel o un altre host, el fitxer és deute perillós que aparenta suport oficial.

**Acció per a IAIA MarIA.** Fer decidir al Consell una única via canònica
Vercel/WordPress/Docker, retirar o posar en quarantena les altres, i exigir en un clon
net instal·lació, portes, tests, build i arrencada sense secrets dins d'imatges.

**Criteri de tancament.** La mateixa ordre documentada passa localment i en CI des
d'un clon net, produïx els artefactes esperats i no incorpora secrets.

---

## Troballes P1

### P1-01 — El cicle de sessió és incompatible amb un backend sense capacitat `sessio`

**Evidència.** `refrescaSessio` i `elMeuRol` són capacitats opcionals
(`src/data/contracte.js:37-46`). Si no existixen, `renovaAra` executa `logout()`
(`src/app/contexts/SessionContext.jsx:38-43`) i l'efecte de rol ix sense resoldre
`rol` (`src/app/contexts/SessionContext.jsx:83-89`). Una ruta amb rol espera per sempre
mentre `rolActual === null` (`src/app/guards/RequireAuth.jsx:32-46`). La renovació es
programa un minut abans de caducar (`src/app/contexts/SessionContext.jsx:45-63`;
`src/data/identitat.js:196`).

**Impacte.** Un JWT injectat per Sollutia pot ser expulsat pel component encara que
la renovació depenga de l'amfitrió; `/admin` i `/realitat` poden quedar en
“Comprovant la sessió…” indefinidament.

**Acció.** Formalitzar propietari i protocol de renovació, rol per defecte i senyal
de caducitat entre host i component. Cap capacitat opcional pot deixar una promesa
visual infinita ni provocar logout silenciós.

### P1-02 — La migració final del xat reintroduïx una recursió RLS ja diagnosticada

**Evidència.** El pegat de 260908 documenta que consultar `xat_fils` des de la
política d'inserció no pot trobar el creador abans que siga participant
(`supabase/migrations/260908_xat_v2_correccions.sql:7-18`) i ho resol amb
`private.es_creador_del_fil` (`supabase/migrations/260908_xat_v2_correccions.sql:80-110`).
La migració posterior torna a substituir la política per una subconsulta directa a
`xat_fils` (`supabase/migrations/260916_2300_correccions_mur_i_xat.sql:43-58`).

**Impacte.** `[SUPÒSIT: migracions aplicades en ordre de nom]` la política final
torna a rebutjar el primer participant en el camí d'inserció directa. L'RPC
`crea_fil_directe`, en ser `security definer`, pot ocultar el defecte en el flux
principal, però la política queda incoherent i fràgil.

**Acció.** Determinar l'estat efectiu de producció, restaurar una única política
canònica sense recursió i provar tant l'RPC com el camí RLS directe amb dos usuaris.

### P1-03 — El Mur declarat públic no pot llegir aportacions públiques com a anònim

**Evidència.** `/mur` és una ruta pública (`src/app/App.jsx:525-528`) i
`loadAppData` demana `section_submissions` per a construir Mur/Mercat/Events
(`src/data/supabase/content.js:19-24,31-43`). La política SELECT exigix ser membre
del poble fins i tot per a seccions que no són Notes
(`supabase/migrations/260908_0000_initial_schema.sql:763-768`).

**Impacte.** Un visitant anònim veu el seed públic d'`app_content`, però no les
publicacions reals de veïns. El producte, el SEO i la política de dades discrepen
sobre què significa “Mur públic”.

**Acció.** Decidir si les aportacions publicades són públiques o només comunitàries;
alinear ruta, RLS, copy, sitemap i proves anònimes amb eixa decisió.

### P1-04 — L'arrencada global sobrecarrega dades i una fallada Core tomba tot el portal

**Evidència.** Core, Mur, Notes, Xat i Multimèdia es munten abans del router, siga
quina siga la ruta (`src/app/App.jsx:427-444`). Mur i Multimèdia criden cadascun
`loadAppData` (`src/data/supabase/content.js:76-80`), que demana contingut,
submissions i, amb sessió, notes privades (`src/data/supabase/content.js:7-24`).
Notes torna a demanar els tres conjunts (`src/data/supabase/notes.js:11-23`). Una
fallada del Core impedix muntar qualsevol ruta, incloses Legal i Registre
(`src/app/App.jsx:447-475`).

**Impacte.** `[DERIVACIÓ DEL CODI]` una visita autenticada pot iniciar almenys deu
peticions de dades abans de les pròpies del xat, amb contingut i notes repetits.
Augmenten latència, consum, superfície de dades i probabilitat de fallada; una sola
petició Core indisponibilitza tot el portal.

**Acció.** Carregar per domini i ruta, compartir una sola consulta de contingut,
evitar demanar dades privades fora de Notes i mantindre operatives les rutes locals
quan el backend Core falla.

### P1-05 — La confiança de sessió externa no està completa

**Evidència.** L'adopció valida forma, expiració, `sub`, `iss` i `aud`, però declara
explícitament que no comprova la signatura (`src/data/identitat.js:232-242,249-294`).
L'API global exposa `injectaSessio(sessio, opcions)` directament
(`src/host.js:271-299`); només el camí `postMessage` força un emissor esperat de
configuració si no se'n proporciona (`src/host.js:345-364`). Tokens, refresh i usuari
es guarden amb claus globals d'origen en `sessionStorage`
(`src/data/identitat.js:58-62,129-135`; `src/config/storage.js:60-74`).

**Impacte.** La UI pot adoptar temporalment identitat no signada fins que el servidor
la rebutge; una altra instància al mateix origen compartix la mateixa sessió. Açò no
equival a elevar privilegis al backend si Sollutia/RLS valida correctament, però sí a
suplantació visual, errors 401 tardans i confusió multiinstància.

**Acció.** Fixar un únic emissor/audiència des de configuració no controlada pel
caller, definir on es verifica la signatura/JWKS, delimitar sessió per instància o
declarar formalment una sola instància per origen, i provar rebuig abans de pintar UI
autenticada.

### P1-06 — El model multiinstància no és aïllat per backend ni sessió

**Evidència.** El Web Component contempla instàncies secundàries amb `MemoryRouter`
(`src/PedraSecaEmbed.jsx:43-47`), però el client Supabase és un singleton i rebutja
URLs diferents dins del mateix document (`src/data/supabase/config.js:15-17,26-55`).
El port de backend també és estat global de mòdul i es congela una sola vegada
(`src/data/backendPort.js:5-11,29-36`). Les claus de sessió no tenen identificador
d'instància (`src/config/storage.js:9,60-74`).

**Impacte.** Dos embeds poden tindre navegació separada, però no backend, tenant o
sessió realment separats. És especialment rellevant si Sollutia pretén posar diversos
pobles o widgets en una mateixa pàgina.

**Acció.** Decidir i documentar “una instància per document” o convertir backend i
sessió en dependències per instància; incloure esta restricció en el contracte
d'integració.

### P1-07 — La CSP és alhora massa ampla i incompatible amb les dades estructurades

**Evidència.** La CSP permet connexions a qualsevol `https:`/`wss:` i recursos
visuals/frames de qualsevol origen HTTPS, però `script-src 'self'` no autoritza
scripts inline (`index.html:7-8`). El JSON-LD base és inline
(`index.html:29-46`) i `useSEO` crea més scripts JSON-LD inline
(`src/hooks/useSEO.js:81-100`). Vercel només afegix `frame-ancestors`; no acota la
resta de directives (`vercel.json:2-10`).

**Impacte.** Les dades estructurades poden quedar bloquejades per CSP, mentre una
injecció que aconseguisca executar script tindria eixida de xarxa a qualsevol HTTPS.
La política no és de mínim privilegi i la seua eficàcia varia segons el desplegador.

**Acció.** Generar CSP des de la llista real d'orígens de Sollutia/Supabase, usar
hash/nonce o JSON-LD servit de forma compatible, i afegir una prova de capçaleres i
consola en l'entorn canònic.

### P1-08 — La taula de continguts queda oculta a tecnologies d'assistència

**Evidència.** Quan s'obri, l'overlay complet porta `aria-hidden="true"`, però dins
conté el botó de tancar i botons de navegació enfocables
(`src/components/universal/PageFrame.jsx:70-105`). No té rol de diàleg, focus inicial,
retorn de focus ni gestió d'`Escape`.

**Impacte.** Teclat i lector de pantalla poden entrar en controls que l'arbre
d'accessibilitat declara inexistents. És una regressió WCAG funcional en un control
transversal del Sistema de Disseny.

**Acció.** Tractar el calaix com a diàleg/navegació visible, amb nom accessible,
trampa o gestió de focus proporcionada, `Escape`, restauració de focus i fons inert.

---

## Troballes P2

### P2-01 — `useSEO` deixa canonical privat i metadades antigues

**Evidència.** El hook calcula `finalIndex` amb la privacitat, però el canonical usa
la propietat original `index`; per tant, una ruta `/jo` o `/e` amb `index` per defecte
rep `noindex` i canonical alhora (`src/hooks/useSEO.js:53-65`). Quan no hi ha
descripció, conserva la descripció anterior en lloc de restaurar-ne una de ruta
(`src/hooks/useSEO.js:46-51`). No hi ha cleanup de title/metadades en desmuntar
(`src/hooks/useSEO.js:11-103`). Onboarding no invoca `useSEO`
(`src/sections/onboarding/OnboardingSection.jsx:1-15`), però `/registre` figura al
sitemap (`public/sitemap.xml:23-27`).

**Impacte.** Després de navegar dins de la SPA, una ruta pot heretar descripció o
Open Graph d'una altra; les rutes privades emeten senyals contradictoris.

**Acció.** Fer que robots, canonical i metadades deriven d'una sola classificació de
ruta i restablir tots els camps en cada navegació.

### P2-02 — El contingut de pàgines remotes s'ignora al Core

**Evidència.** El mapejador sap llegir `pages` de `app_content`
(`src/data/supabase/runtime.js:78-90`), però `loadCoreContent` només consulta
`towns,agents` i retorna sempre `seed.pages`
(`src/data/supabase/content.js:68-74`).

**Impacte.** Sollutia/Supabase no pot governar pàgines de contingut encara que el DTO
ho preveja. Açò agreuja P0-03 i converteix el backend de continguts en una font
parcial.

**Acció.** Decidir quines pàgines són canòniques al backend, versionar el DTO i provar
precedència, absència i dades malformades.

### P2-03 — El router perd `state` i els detalls no restauren l'scroll real

**Evidència.** `Link` no extrau `state`, el propaga a l'`<a>` i navega sense opcions
(`src/app/contexts/RouterContext.jsx:130-150`). Multimèdia li passa
`state={{preloadedItem}}` (`src/sections/multimedia/MultimediaSection.jsx:48-65,78-84`),
mentre el detall espera `window.history.state.preloadedItem`
(`src/sections/detail/ItemDetailSection.jsx:20-30`). El contenidor que fa scroll és
`.app-main__content` (`src/css/layout.css:29-39`), però els detalls desplacen
`window` o `.app-main` (`src/sections/detail/ItemDetailSection.jsx:28-30`;
`src/sections/detail/PageDetailSection.jsx:17-20`). A més, el Shadow Root és tancat
(`src/PedraSecaEmbed.jsx:286-287`), de manera que `element.shadowRoot` és `null`.

**Impacte.** Les dades precargades de Multimèdia es perden i una fitxa pot obrir-se a
la posició de scroll anterior.

**Acció.** Fer que `Link` respecte el contracte del router i centralitzar la
restauració de scroll sobre el contenidor real, amb prova en Shadow DOM tancat.

### P2-04 — Notes usa un slug d'entitat com si fora UUID i debilita la concurrència a revisió zero

**Evidència.** A `/e/:slug`, `actorId` passa a ser el slug
(`src/app/contexts/IdentitatContext.jsx:12-23`). El proveïdor global el passa a
`loadNotes` (`src/sections/notes/NotesDataContext.jsx:21-48`), que el posa en el
filtre UUID `owner_user_id` i no comprova `tenantId`
(`src/data/supabase/notes.js:11-23`). En actualitzar, `expectedRevision` és obligatori,
però la revisió només s'inclou si és *truthy*; zero elimina la protecció
(`src/data/supabase/notes.js:46-58`).

**Impacte.** Navegar per una entitat pot generar peticions 400 de Notes alienes a la
ruta; una revisió zero evitaria el control optimista.

**Acció.** Separar actor de navegació i propietari autenticat, exigir tenant abans de
consultar i tractar zero com una revisió vàlida o prohibida explícitament.

### P2-05 — Les portes del Sistema de Disseny estan roges

**Evidència.** `tractor-tokens` detecta tokens inexistents i fallbacks prohibits;
exemples concrets són `--sdp-ombra-4` a diàleg i TOC
(`src/css/components.css:170-175`; `src/css/modules.css:1915-1921`), fallbacks privats
de l'error d'arrencada (`src/css/modules.css:864-895`) i una primitiva usada per un
component (`src/components/layout/AppGridShell.css:314-323`). Design Guard detecta
un estil inline (`src/sections/disseny/cataleg/detalls/EspecimenInventariGlobal.jsx:13-16`)
i una classe visual no admesa
(`src/sections/disseny/cataleg/detalls/EspecimenFormulariComplex.jsx:6-11`). La porta
de graella diu que `collapseBtnRef` i `expandBtnRef` no estan documentats; els props
existixen a `src/components/layout/AppGridColumn.jsx:8-23,53-66,80-92`.

**Impacte.** El Sistema de Disseny no compleix les seues pròpies lleis, encara que la
porta de 58 px i la fitxa de gestor passen.

**Acció.** Resoldre contracte i tokens sense elevar baselines; executar les portes en
CI com a criteri de release.

### P2-06 — Les auditories automàtiques de SEO i accessibilitat donen cobertura falsa

**Evidència.** `seo_auditor.mjs` és un stub que sempre imprimeix compliment
(`tooling/wiki/seo_auditor.mjs:1-15`). L'altre auditor només escaneja `.html`, no el
JSX de l'aplicació (`tooling/wiki/core/a11y_seo.mjs:1-5,101-127`). ESLint carrega
React i hooks, però cap plugin de regles d'accessibilitat
(`eslint.config.js:6-13,27-53`). La porta de catàleg cau amb `ENOENT` perquè encara
llig `DesignSectionContent.jsx`, ja absent
(`tooling/gates/tractor-cataleg.mjs:44-53`).

**Impacte.** Un “verd” pot ignorar tota la interfície real; i una porta trencada no
pot discriminar regressions del catàleg.

**Acció.** Substituir stubs per proves DOM reals de rutes representatives, incloure
regles JSX/a11y i fer que cada porta falle amb diagnòstic governat, no amb stack
trace d'un fitxer obsolet.

### P2-07 — Documentació, manifest SEO i modes de dades han divergit

**Evidència.** La configuració standalone afirma que `build:seo` ja ha escrit
`seo-routes.json` (`vite.standalone.config.js:38-43`), però eixe script no existix en
`package.json:63-82`; `tractor-build-previ` confirma que script i generador van ser
retirats mentre un altre tractor encara exigix el manifest
(`tooling/gates/tractor-build-previ.mjs:28-37`). `tractor-rutes-web --avisos` falla
per l'absència del manifest, i `tractor-consell` afirma que sense ell totes les rutes
React donarien 404 (`tooling/scripts/tractor-consell-core.mjs:306-310`), tot i que
`wordpress-plugin/` no conté cap PHP en l'inventari actual. A més, el README admet
`auto|supabase|hybrid|seed|local` (`supabase/README.md:121-132`), però el runtime
només reconeix `remote|seed|local` (`src/data/supabase/runtime.js:25-32`).

**Impacte.** El desplegador i Sollutia poden seguir instruccions que el codi ja no
implementa, i les portes poden bloquejar per un artefacte sense productor/consumidor
real.

**Acció.** Reconciliar documentació, scripts i consumidor efectiu; cada artefacte ha
de tindre un únic productor, consumidor i criteri de frescor.

---

## Seguretat: observacions complementàries

### Controls positius verificats

- La UI només travessa el port de backend i les portes `frontera`, `enxufe` i
  `adaptadors` passen (`src/data/backendPort.js:51-96`).
- Els punts `dangerouslySetInnerHTML` passen la porta de sanejament; el detall de
  pàgina usa `sanitizeHtml` abans d'injectar (`src/sections/detail/PageDetailSection.jsx:58-61`).
- La configuració del Web Component aplica llista blanca a URL sensibles
  (`src/PedraSecaEmbed.jsx:154-201`).
- Les consultes de Notes i Multimèdia tenen `AbortController` i protecció per
  generació (`src/sections/notes/NotesDataContext.jsx:27-48`;
  `src/sections/multimedia/MultimediaContext.jsx:15-36`).
- El registre manual associa labels, errors i `aria-describedby` als camps principals
  (`src/sections/onboarding/OnboardingSteps.jsx:96-198`).

### Riscos que requerixen confirmació humana

- `[SUPÒSIT]` `event.origin.endsWith('.sollutia.cat')` és segur només si Sollutia
  controla tots els seus subdominis; el pont confia en eixe conjunt per a ordres
  d'iframe (`src/host.js:306-320`).
- L'RPC `crea_fil_directe` valida que les dues persones són del poble, però no el
  consentiment del destinatari (`supabase/migrations/260908_xat_v2_correccions.sql:128-163`),
  mentre el directori posterior sí filtra `consentiment_rgpd_at`
  (`supabase/migrations/260914_0100_auditoria_rls_fixes.sql:67-109`). Qui conega un
  UUID podria evitar la selecció del directori. El Consell ha de decidir si el
  consentiment governa també la creació directa de fils.
- Les pantalles d'error mostren `error.message` del backend a l'usuari
  (`src/app/App.jsx:454-465,489-500`). Pot revelar detalls de PostgREST o integració;
  cal separar missatge públic i diagnòstic intern.

## Accessibilitat i usabilitat: balanç

### Fortaleses

- Hi ha enllaç de salt, `main` enfocables i canvi de focus en navegar
  (`src/app/App.jsx:88-93,236-303`).
- El fallback de càrrega té estat viu accessible
  (`src/app/App.jsx:56-63`).
- Els controls principals tenen noms accessibles i el moviment de transició comprova
  `prefers-reduced-motion` (`src/app/App.jsx:323-365`).
- El registre manual té labels visibles, autocomplete, límits i errors associats
  (`src/sections/onboarding/OnboardingSteps.jsx:96-198`).

### Deute obert

- `aria-busy` depén de `status`, però `UIContext` no publica eixe camp
  (`src/app/App.jsx:65-70,297-303`; `src/app/contexts/UIContext.jsx:75-83`). El main
  anuncia sempre que no està ocupat, fins i tot en càrrega.
- La taula de continguts té el defecte P1-08.
- L'scroll de detall no apunta al contenidor real, P2-03.
- El *pull-to-refresh* registra `touchmove` no passiu però no cancel·la l'scroll
  natiu (`src/app/App.jsx:188-227`); en dispositius amb *rubber band* pot combinar
  gest natiu i transformació pròpia `[SUPÒSIT: depén del navegador]`.

## Matriu DAFO

| Fortaleses | Debilitats |
| --- | --- |
| Port de backend únic i segellat | Adaptador Sollutia real inexistent |
| Build Vite i 45 tests en verd | SEO privat/públic només client-side |
| Sanejament d'HTML i URL governat | Providers globals, duplicació i caiguda Core global |
| Base d'accessibilitat millorada | TOC oculta, `aria-busy` inert i cobertura automàtica insuficient |
| RLS extensa i migracions correctives | Regressió final del xat i porta RLS que no modela l'estat final |

| Oportunitats | Amenaces |
| --- | --- |
| Convertir el contracte en proves amb captures reals de Sollutia | Canvi de forma/API de Sollutia sense detecció |
| Prerender/SSR o edge per a rutes públiques | Indexació de shells privats i metadades duplicades |
| Càrrega per ruta i cache compartida | Xarxa rural lenta convertida en caiguda global |
| Canonada única de release des de clon net | Desplegament per una via stale amb secrets o portes omeses |
| Proves DOM amb teclat, lector i CSP | Falsos verds de stubs i gates desincronitzades |

## Pla d'acció per a l'`implementation_plan.md`

| Ordre | Paquet de decisió/treball | Dependència | Evidència d'acceptació |
| ---: | --- | --- | --- |
| 1 | Congelar release i triar host canònic | Consell + Sollutia | una sola canonada documentada en clon net |
| 2 | Tancar contracte Sollutia, auth, rol i renovació | captures/API real | 32 mètodes + capacitats provats, sense fallback |
| 3 | Corregir P0-03 i regressió RLS del xat | esquema de dades | tests de ruta i dos usuaris contra BD efímera |
| 4 | Definir taxonomia pública/privada i portada | decisió SEO/producte | HTTP sense JS amb status, head i robots correctes |
| 5 | Separar providers i degradació del Core | contracte de dades | rutes locals/públiques funcionen amb Core caigut |
| 6 | Tancar sessió, multiinstància, CSP i errors públics | contracte host | proves d'issuer, expiració, iframe i capçaleres |
| 7 | Tancar TOC, `aria-busy`, scroll i auditoria DOM | Sistema de Disseny | teclat + lector + prova automatitzada per rutes |
| 8 | Reconciliar gates, docs i manifest | canonada triada | totes les portes obligatòries verdes, cap stub |

## Incògnites que bloquegen certesa de producció

1. Quina és l'API real de Sollutia per a cada operació del contracte i quines garanties
   dona sobre idempotència, paginació, límits, timeout i errors?
2. Qui emet, firma, renova i revoca el JWT; quins són `iss`, `aud`, JWKS i política de
   rols?
3. El desplegament canònic és Vercel, WordPress, Docker o infraestructura Sollutia?
4. Quines migracions estan aplicades realment i en quin ordre a l'entorn remot?
5. “Mur públic” inclou aportacions de veïns per a anònims o només contingut editorial?
6. Sollutia controla tots els subdominis `*.sollutia.cat` i `*.socdepoble.org`?
7. Cal suportar més d'un poble/usuari incrustat en el mateix document?
8. Quin sistema de telemetria, backups, esborrat RGPD i resposta a incidents hi haurà?

## Bateria mecànica executada

| Comprovació | Resultat |
| --- | --- |
| `npm run test -- --run` | **PASSA** · 11 fitxers, 45/45 tests |
| `npm run lint -- --quiet` | **PASSA** · 0 errors |
| Vite build a `/tmp` | **PASSA** · 2.097 mòduls; avís de `backendPort` estàtic + dinàmic |
| `porta:frontera` | **PASSA** |
| `porta:adaptadors` | **PASSA** · només 1 contracte capturat |
| `porta:frontera-auth` | **PASSA** |
| `porta:innerhtml` | **PASSA** |
| `porta:enxufe` | **PASSA** |
| `porta:importacions` | **PASSA** |
| `porta:manifest` | **PASSA** |
| `porta:58px` | **PASSA** |
| `porta:fitxa` | **PASSA** |
| `tractor-rls.mjs` | **FALLA** · 2 alertes històriques |
| `tractor-rutes-web.mjs --avisos` | **FALLA** · manifest absent + 5 avisos de duplicació |
| `porta:cataleg` | **FALLA** · `ENOENT` sobre `DesignSectionContent.jsx` |
| `tractor-tokens.mjs` | **FALLA** · 14 infraccions |
| `design_guard.mjs` | **FALLA** · estil inline nou + llei visual |
| `porta:graella` | **FALLA** · 2 props no documentats |

### Lectura correcta de la porta RLS

La porta acusa que `private.ajustos` no té RLS i que una migració històrica obri
`profiles` amb `using(true)`. En el mateix esquema, `private.ajustos` revoca tots els
privilegis (`supabase/migrations/260908_0000_initial_schema.sql:1-4,17-21`) i les
migracions posteriors revoquen l'anonimat i restauren la lectura pròpia
(`supabase/migrations/260912_1500_correccio_privacitat_perfils.sql:7-17`;
`supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:90-104`). Per tant,
estes dues alertes no proven una fuita final; proven que l'escàner avalua fitxers
històrics individualment i bloqueja la canonada sense calcular l'estat SQL resultant
(`tooling/gates/tractor-rls.mjs:105-178`). La regressió real i independent és P1-02.

## Bateria de veritat

- [x] S'ha explorat el codi real i el working tree exacte.
- [x] Les afirmacions de codi tenen ruta i línies.
- [x] No s'han inventat fitxers, funcions ni variables.
- [x] Les dependències de l'entorn remot estan marcades `[SUPÒSIT]` o en Incògnites.
- [x] Pedra Seca s'ha interpretat exclusivament com a Sistema de Disseny.
- [x] No s'ha activat cap eina web, navegador ni recuperació externa.
- [x] No s'ha modificat cap línia de codi.
- [x] El document nou té zero troballes quan s'aïlla dins de l'abast estricte de
  `tractor-frontmatter.mjs`; el corpus global continua roig per deute preexistent,
  inclosa la clau `actualitzat` de `.agents/ESTAT.md`.
- [ ] Aprovació humana del Consell.

## Tancament

La recomanació no és “corregir deute menor i desplegar”, sinó convertir tres
ambigüitats en contractes executables: **qui governa la sessió**, **què és públic per
HTTP** i **quina canonada és la de producció**. Fins que les tres tinguen proves
repetibles i la frontissa deixe de ser un passthrough d'una fixture, la integració
amb Sollutia no està demostrada.
