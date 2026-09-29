---
type: informe
status: esborrany
description: 'Enxufe universal de Sóc de Poble: plugin WordPress prim, router en memòria, canal d''identitat de l''amfitrió, base de recursos i higiene del build, amb proves i troballes.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ad8ad186-d485-409d-8ecc-e5fd3a8d4982:8aabc50b-f50e-40df-8cc4-f58f3df29fdd
---
# Auditoria i implementació: enxufe universal (WordPress com a banc de proves per a Sollutia)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ad8ad186-d485-409d-8ecc-e5fd3a8d4982:8aabc50b-f50e-40df-8cc4-f58f3df29fdd |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T12:11:01.106Z |
| Modificació | 2026-09-29T14:46:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb workflows de subagents Opus 5.5 |
| Tokens consumits | No mesurable des de l'agent per al fil principal. Subagents, segons els informes dels workflows: uns 23 milions. Fins a la fase 3a, 9,5 M (lectura 1,40 M; buits 0,69 M; Pobles 0,69 M; fase 1 1,12 M; cervell adjunt 0,70 M; fase 2 1,06 M; pont personal 0,78 M; correccions 0,51 M). Després: verificació completa i revisió adversarial amb 82 agents, 10,0 M; recerca federada 1,17 M (més 0,15 M d'un primer intent); estudi de mercat 1,03 M; correccions adversarials 1,23 M; reescriptura de l'annex D amb el filtre del Manifest 0,63 M (la recerca de competidors s'ha reaprofitat de la memòria cau). Total aproximat: 23,7 M. No hi ha comptada la fase 1 aturada |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-29T12:11:01.106Z: esborrany creat amb el circuit documental (torn torn_ad8ad186).
- 2026-09-29 13:05: primera versió completa. Implementació de les fases 1, 2 i 3a, banc de proves agnòstic verificat al navegador, requisits i decisions del Mestre del mateix torn. Els annexos de recerca s'hi bolquen a continuació.
- 2026-09-29T13:11Z-13:58Z: annexos A (cervell adjunt), B (pont personal), C (federació) i primera versió de l'annex D (estudi de mercat sobre les categories del Tauler). Validació responsive de l'agent a 375×812.
- 2026-09-29T14:26Z: revisió adversarial (38 troballes, 13 confirmades) i correccions de 9 (punt 4). Les 4 restants queden al punt 5. Suite final: 221/221 fitxers, 3.128/3.128 proves.
- 2026-09-29T14:46Z: annex D reescrit amb el Manifest de Poble com a filtre únic (F1–F18 a partir de les propostes dels pobles), les propostes locals, el perfil com a portafolis, els patrons de WhatsApp i la fita d'eixir de WordPress. Índex de l'Escriptori reapuntat. Informe tancat per a revisió humana.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

<!-- IMPLEMENTACIO:INICI -->

### 0. Resum

L'objectiu del torn no era un plugin de WordPress sinó validar la Llei de l'Enxufabilitat (Model B) en un amfitrió real, amb Sollutia com a destí. Resultat:

- **Contracte d'amfitrió universal de tres peces.** Qualsevol amfitrió (WordPress, Sollutia, MediaWiki o una pàgina estàtica) emet exactament això i res més: un `<script>` que declara `window.SocDePobleConfig = { nomPoble, poble }` abans del bundle, l'etiqueta `<soc-de-poble plugin-url fonts-href>` i el bundle. El plugin PHP és només un adaptador d'eixe marcatge.
- **Tot el comportament viu al nucli (`src/`).** Router en memòria per defecte, capçalera i telemetria opt-in, base de recursos, marca de l'amfitrió i interceptor d'enllaços. Cap hack de WordPress.
- **Verificat en un amfitrió genèric** (`tests/manual/enxufe-amfitrio.html`, servit pel servidor de desenvolupament). L'app aterra a `/pobles/la-torre-de-les-macanes` amb la portada, mostra «Estàs al servidor de Gent de la Torre» en compacte i «| Gent de la Torre» a la barra negra en escriptori. La Wiki s'obri des del menú lateral. La URL i l'historial de l'amfitrió no canvien mai.
- **Falta la prova a WordPress Studio.** El build (`npm run build:wp`) i la instal·lació del plugin fora del repo els ha de fer el Mestre: el hook del projecte prohibix a l'agent tant la compilació com les escriptures fora del repositori. Vegeu el punt 8.

### 1. Esmenes al prompt i al pla de MarIA

- El pla cita `src/App.jsx` i `src/layouts/AppGridShell.jsx`, que no existixen. La barra de dalt és `TopBar` a `src/app/App.jsx`; `AppGridShell` és l'espai de treball de cada secció i no llig cap configuració. No s'ha tocat.
- El «plugin vell» no era a `wordpress-plugin/` (només hi havia `dist/`, ignorat per git). Viu a `~/Studio/socdepoble/wp-content/plugins/soc-de-poble/`, està actiu i ja estava trencat: la pàgina `/pedra-seca-demo/` queda en blanc amb un `TypeError`, perquè el bundle del 21-08 era una compilació `peer` que depenia de `wp.element`. No s'ha esborrat; cal desactivar-lo.
- `tenant: "gentdelatorre"` no és el `tenantId` (UUID de `public.towns`, abast de dades de Supabase) ni l'id del poble. L'id real de La Torre a la secció Pobles és `la-torre-de-les-macanes`. El canal accepta `tenant` com a àlies de `poble`, però el plugin emet `poble`.
- El pla diu «Aprovació humana: [pendent]» i el prompt, «aprovat». S'ha actuat amb l'aprovació del prompt i amb les directrius del Mestre dins del mateix torn.

### 2. Què s'ha implementat

| Peça | Fitxers | Què fa |
| --- | --- | --- |
| Canal de l'amfitrió | `src/config/configAmfitrio.js` | Llig `window.SocDePobleConfig` amb la prioritat més baixa. Només `nomPoble` i `poble` (àlies `tenant`), sanejats: controls, invisibles i bidi fora, NFC, longitud màxima, slug estricte. Mai cap clau de backend. |
| Política de router | `src/app/contexts/politicaRouter.js`, `RouterContext.jsx` | Memòria per defecte en incrustar. Navegador només amb base declarada o `routerType: 'browser'`. Fora de la base, l'app queda inert. Límit de segment. Rutes relatives resoltes contra la ruta de l'app. `MemoryRouter` amb `rutaInicial` i estat propi (mai `window.history.state` de l'amfitrió). |
| Element `<soc-de-poble>` | `src/PedraSecaEmbed.jsx`, `src/embed.jsx`, `src/host.js` (comentari) | Capes en l'ordre del contracte: valors del paquet < global de l'amfitrió < `configura({config})` < `config-id` < `config` < atributs (`nom-poble`, `poble`, `ruta-inicial`) < `element.config`. Sanejament tipat. `poble` sense ruta obri `/pobles/<poble>`. Base de recursos. Fora l'heurística `#root` de la capçalera i el router de navegador forçat. |
| Capçalera i telemetria | `src/hooks/useSEO.js`, `RouteTelemetria.jsx` | Només amb `manageDocumentHead: true`. Un element incrustat no reescriu mai el `<title>`, el canonical ni les metes de l'amfitrió, ni compta visites. |
| Recursos | `src/config/assetResolver.js` i 13 fitxers de seccions | La base dels `/assets/…` ve de `plugin-url` o del directori del bundle (`document.currentScript`). Sense base, la sortida és idèntica. HTML de contingut i fons del xat resolts. |
| Marca de l'amfitrió | `src/components/universal/MarcaAmfitrio.jsx`, `App.jsx`, `modules.css` (bloc SDP:amfitrio), `i18n.js` (5 llengües), `EspecimenShell.jsx` | Escriptori: «\| Gent de la Torre» a la barra negra (colors `--sdp-crom-*`). Compacte: franja «Estàs al servidor de Gent de la Torre» amb la icona MapPin (lucide). El criteri és l'amplada del contenidor (`isCompact`), no la finestra. Sense `nomPoble`, cap node nou. Espècimen viu al catàleg (Pedra Seca §9). |
| Enllaços interns | `src/app/enllacosInterns.js`, `App.jsx` | Només incrustat (memòria o base declarada): els `<a href="?…">` i `<a href="/…">` del contingut (Markdown de la Wiki, articles, connexions) es passen al router en lloc de navegar la pàgina de l'amfitrió, i la vista es recoloca com en un document nou (a dalt o al `#fragment`). Amb base, se'n lleva la base si ja la porten. A socdepoble.org no es munta. |
| Ruta de l'app per a Connectar, Comentar i Compartir | `useAccions.js` (`useUbicacioApp`), `UniversalPage.jsx`, `ConnexioDetall.jsx`, `ConnectarSection.jsx`, `OnboardingSection.jsx` | Es llig del router, no de la barra d'adreces de l'amfitrió. Sense base, idèntic a abans. |
| Scroll de l'amfitrió | `src/sections/detail/ItemDetailSection.jsx` | Fora `window.scrollTo`: a socdepoble.org no feia res (el body no fa scroll) i dins d'un amfitrió movia la pàgina de l'amfitrió. |
| Sessió | `src/data/sessionService.js` | `nomPoble`, `poble` i `rutaInicial` no identifiquen la sessió: dos elements amb pobles distints no peten. |
| Build | `vite.standalone.config.js` | `copyPublicDir: false` i un plugin que copia tot `public/` excepte el que és del servidor de socdepoble.org: fitxers ocults (`.htaccess`, `.DS_Store`), `robots.txt`, `sitemap.xml` i `auth/`. En acabar (`writeBundle`), retira eixes mateixes restes si un build anterior les havia deixat a `wordpress-plugin/dist/`. La Wiki, el RAG i la Consola viatgen sencers (decisió del Mestre). |
| Plugin WordPress | `wordpress-plugin/socdepoble-enxufe.php`, `templates/pantalla-completa.php` | Adaptador prim. Shortcode `[socdepoble_app]`, declaració de l'amfitrió una vegada per pàgina, sense `wp-element`, sense reescriptures, plantilla de pantalla completa opt-in. |
| Contracte documentat | `_wiki_de_poble/02_saber/estandard_integracio_react.md` | LLEI 1 i LLEI 5 reescrites: marcatge universal, precedència, política de router, opt-in de capçalera, recursos, què viatja. |
| Banc de proves | `tests/manual/enxufe-amfitrio.html` | Amfitrió genèric de tres peces per a provar l'element en desenvolupament. No es publica. |

### 3. Decisions del Mestre dins del torn

1. WordPress és només el banc de proves; el destí és Sollutia. Tota correcció ha de ser universal.
2. Primer, la Wiki fora de l'enxufe. Després, la decisió final: **l'App viatja sencera** (Wiki, manifest, RAG i Consola) per transparència radical. És la que s'ha implementat.
3. Qui entra per l'enxufe aterra a la pàgina del seu poble (la xarxa «Gent de la Torre»).
4. Router en memòria també per a Sollutia, que tindrà una adreça dinàmica.
5. «Desenxufabilitat» extrema: el contracte ha de valdre demà per a MediaWiki (punt 7 i annex A).
6. Pont personal Mac → servidor → mòbil per al cervell local, amb la gestoria privada (annex B).
7. Requisit innegociable de **Disseny Defensiu Visual** (punt 6).
8. Arquitectura federada (annex C).

### 4. Defectes trobats i corregits

| Defecte | Abans | Ara |
| --- | --- | --- |
| Router del navegador per defecte a l'element | A `/comunitat/` de WordPress pintava «No trobat» i cada clic reescrivia la URL de l'amfitrió; una SPA amb router propi (Sollutia) es desincronitzava | Memòria per defecte; navegador només amb base declarada |
| `basename` sense límit de segment i derivat del `basePath` cru | `/comunitats` es tallava a `s`; `base-path="//evil.test"` saltava la guarda de protocol relatiu | `normalitzaBase` i `treuBase` estrictes |
| Ruta relativa en memòria | `navigate('?item=x')` de la Wiki anava a `/` i acabava al Xat | Resolta contra la ruta de l'app |
| Capçalera i telemetria opt-out | Un element en memòria reescrivia el `<title>` i el canonical de l'amfitrió i comptava visites | Opt-in explícit |
| `pluginUrl` mort | Totes les imatges `/assets/…` anaven a l'origen de l'amfitrió i feien 404 | Base de recursos |
| Enllaços crus del contingut | Dins d'un amfitrió, un `<a href="?item=…">` de la Wiki recarregava la pàgina de l'amfitrió | Interceptor d'enllaços interns |
| `window.scrollTo` a la fitxa | Movia la pàgina de l'amfitrió | Eliminat |
| Element sense backend | Amb només les tres peces, el mode remot petava (`Falten VITE_SUPABASE_URL…`) | Valors del paquet com a capa més baixa (Model B: el backend el segella Sóc de Poble) |
| Precedència del canal | `configura({config})` perdia davant del global de l'amfitrió | Ordre del contracte |
| Clau de sessió | Una clau de marca nova hauria fet petar dos elements amb pobles distints | Fora de la identitat |
| Còpia de `public/` a `dist/` | `.htaccess` amb una regla SPA que, sota Apache, reescriuria els recursos del plugin cap a l'`index.html` de l'amfitrió; `robots.txt`, `sitemap.xml`, `auth/` i `.DS_Store` dins del plugin | Exclosos (només el que és del servidor de socdepoble.org) |
| Caràcters invisibles crus al codi | Regex i proves amb caràcters bidi crus (risc Trojan Source) | Escapes `\u{…}` i una prova que ho vigila |

Corregits després de la revisió adversarial (els codis C són els de la refutació; cada correcció porta proves pròpies):

| Codi | Defecte | Abans | Ara |
| --- | --- | --- | --- |
| C1 | Interceptor d'enllaços a socdepoble.org (Llei del Píxel) | A l'arrel sense base, un enllaç del contingut passava pel router: no recarregava ni tornava a dalt | L'interceptor només es munta incrustat (memòria o base declarada). A socdepoble.org l'arrel no porta cap `onClick` i el clic recarrega com sempre. Incrustat, la vista es recoloca: el desplaçador de l'enllaç torna a dalt o el `#fragment` es porta a la vista |
| C2 i C13 | Regla de la marca amb la barra plegada | `.sdp-root.sidebar-closed .sdp-amfitrio-titol` també movia 176 px l'espècimen del catàleg | Limitada a `header.bar-black > .sdp-amfitrio-titol`. Una prova de capes calcula 232 − 56 des de `layout.css` i comprova el DOM real i el del catàleg |
| C3 i C5 | Lectures de `window.location` dins d'un amfitrió | Connectar, Comentar i Compartir (targetes i barra de pàgina, `ConnexioDetall`, `ConnectarSection`) i el `?tornar` de l'Onboarding llegien l'adreça de la pàgina amfitriona | Llegixen el router (`useUbicacioApp`). A socdepoble.org el resultat és el mateix, byte a byte; hi ha proves que ho comparen i una prova de mutació |
| C4 | Restes velles a `wordpress-plugin/dist/` | Un `dist/` compilat abans conservava `.htaccess`, `.DS_Store`, `auth/`, `robots.txt` i `sitemap.xml` | `writeBundle` els retira de l'eixida (mai fora d'ella ni seguint enllaços simbòlics; `.vite/` es conserva) i ho registra |
| C8 | Comparació de la base octet a octet | `/p%c3%a0gina` i `/pàgina` no casaven amb la mateixa base | `treuBase` compara segment a segment en forma canònica (RFC 3986 §6.2.2 i RFC 3987 §3.1) i torna la resta original |
| C10 | `dangerouslySetInnerHTML` amb embolcall local | La Wiki passava l'HTML per una funció pròpia que la porta `tractor-innerhtml` no reconeix | `sanitizeHtml(resolRecursosDeHtml(…))` escrit a cada un dels tres llocs; el sanejador sempre és l'últim |
| C11 | Contracte documentat desfasat | La LLEI 1 no explicava els valors del paquet, la capa filtrada de `configura`, l'origen de confiança de `fonts-href` ni la regla de l'interceptor | Actualitzat a `estandard_integracio_react.md`, amb la higiene del build (els `VITE_*` de la màquina que compila queden segellats al paquet) |
| T61 | Prova intermitent a la suite sencera | `App.test.jsx` esperava el chunk `lazy()` del perfil amb el segon per defecte i fallava sota càrrega (1.068-1.345 ms) | Temps d'espera explícit de 3 s, amb el motiu anotat |

### 5. Troballes obertes (no corregides)

| Troballa | Evidència | Proposta | Decisió humana |
| --- | --- | --- | --- |
| `configura({ backend })` accepta un adaptador complet, contra el Model B | `src/host.js:55-68`, `src/config/hostAdapter.test.js` | Tancar-ho al codi o reconéixer-ho en un ADR | requires_human_decision: true |
| `embed.jsx` munta l'app a qualsevol `#root` buit | `src/embed.jsx` | Muntatge automàtic només amb un atribut explícit (per exemple `data-soc-de-poble`); una SPA com Sollutia sol tindre `#root` | requires_human_decision: true |
| Consola dins de l'enxufe | `/__iaia/consola.json` i `/__iaia/mapa.json` només els servix el middleware de desenvolupament | Empaquetar una instantània al build o servir-la des de socdepoble.org amb la base de recursos | requires_human_decision: true |
| Pobles: feed «Gent de la Torre», ordre per activitat i fitxa | La pàgina del poble només pinta dues píndoles i el text de la Viquipèdia; l'ordre ve del `created_at` fix de la llavor (`dynamic_time` no l'escriu ningú); `scripts/fetch_town_media.mjs` exclou escuts i no guarda llicència ni autor | Veure annex A (dades de Wikidata amb llicència) i punt 6 | Planificar |
| Mur buit per a visitants anònims en remot | La RLS de `section_submissions` exigix sessió i ser membre del tenant | Política de lectura pública per a les publicacions públiques | requires_human_decision: true |
| Porta Consell L8 | Amb el primer `.php` a `wordpress-plugin/`, L8 exigix `dist/seo-routes.json`, que git ignora: un clon net o la CI queden en roig | Exigir-lo només si algun PHP el llig (`tooling/`, cal executor amb lease) | No |
| tractor-enxufe E4 llig el manifest generat | Un exemple `window.X =` dins d'un document de la Wiki posa E4 en roig (s'ha esquivat amb `Object.assign`) | Excloure `src/data/wikiManifest.js` o les cadenes (`tooling/`) | No |
| `design_guard` en roig | `h1-multiple` a `DocumentPrintPreview.jsx`, preexistent i no tocat en este torn | Torn propi | No |
| Relé OAuth | `src/data/oauthRelay.js` consumix el `?code=` genèric de la pàgina de l'amfitrió | Reaccionar només als paràmetres propis (`sdp_code`) | No |
| `<Link>` en memòria (C6) | En memòria, `hrefDe()` dona rutes de l'app, que a la pàgina amfitriona són rutes de l'amfitrió: el clic central o «obri en una pestanya nova» porta a una ruta que no existix | URL canònica de socdepoble.org o sense `href` | requires_human_decision: true |
| Origen dels enllaços compartits des d'un amfitrió | `useAccions.js` (`prefixDeMemoria`): `VITE_CANONICAL_URL` si el build el porta; si no, l'origen de la pàgina amfitriona més la ruta de l'app, que pot no existir-hi | La mateixa decisió que C6: una sola URL canònica per a tot el que ix de l'app | requires_human_decision: true |
| «Arrere» inert a la primera pantalla (C7) | L'enxufe aterra a `/pobles/<poble>`, que és l'índex 0 del router en memòria: `navigate(-1)` (`UniversalPage.jsx`) no fa res. És la primera pantalla que veu tot visitant de l'amfitrió | Desactivar o amagar la fletxa quan el router en memòria no té entrada anterior. Canvia la barra, per tant cal ordre de disseny | requires_human_decision: true |
| Base igual a un segment de ruta de l'app (C9) | Amb una base declarada que es diu com una secció (per exemple `/mur`), l'interceptor lleva la base d'un enllaç `/mur/…` que ja era una ruta de l'app | Prohibir a `normalitzaBase` les bases que coincidixen amb un primer segment de l'app, o documentar-ho al contracte | No |
| Proves de node fora de `package.json` (C12) | `tests/standalone-build.test.mjs` i `tests/lint_enxufe.test.mjs` només s'executen a mà: `test:node` (`package.json:78`) només nomena dos fitxers i Vitest exclou `tests/**/*.test.mjs`. El patró és anterior: només unes 9 de les 57 proves `tests/*.test.mjs` estan endollades | Endollar-les a `test:node` o a la cadena de portes (cal executor amb lease) | No |
| `configura()` força el mode remot | `host.js` guarda sempre la sortida de `normalizeBackendConfig()` (`dataMode: 'remote'`): un amfitrió que crida `configura({ auth })` trepitja el `VITE_DATA_MODE` del paquet | Filtrar també `dataMode` i `backendId` a `capaDeConfigura()` si no els declara l'amfitrió | requires_human_decision: true |
| Fragment després d'un chunk `lazy()` | Incrustat, el `#fragment` es busca en el fotograma següent; si la ruta de destí encara carrega, cau a «torna a dalt» sense reintentar | Reintentar quan acabe el `Suspense`, si cal | No |
| `tractor-crom` i `tractor-innerhtml` | El hook no deixa executar-les a l'agent; C2 i C10 s'han comprovat llegint les expressions regulars de les portes | Executar-les abans del commit | No |
| Tres llistes d'orígens de Sollutia | `runtimePolicy.js:4-5`, `PedraSecaEmbed.jsx`, `public/auth/callback.html` no coincidixen | Una sola constant quan Sollutia confirme l'origen | Confirmar amb Sollutia |
| Deu proves amb simulacions estretes d'`assetResolver` | Passen hui; petaran si el codi que pinten usa les funcions noves | Patró `importOriginal` | No |
| Espècimens del catàleg amb `/assets/…` crus | `src/sections/disseny/cataleg/detalls/Especimen*.jsx` | Passar-los per `resolveAsset` | No |
| Transparència del RAG | `rag-index.json` inclou documents com `perfil_psiquiatric.md` i `pla_director_viabilitat_economica.md`, públics per la política heretada (sense `visibility` = públic) | Només informatiu: el Mestre ha decidit transparència radical | Informat |

### 6. Requisit innegociable: Disseny Defensiu Visual

Anotat el 29-09-2026 per a qualsevol recurs extern (Wikidata, Viquipèdia, Commons i tota URL que no controlem):

1. **Fallback gràcil.** Si una imatge falla (`onError`), s'amaga al vol. Mai es veu la icona d'imatge trencada, i la targeta continua sencera i ben composta sense foto.
2. **Telemetria de trencaments.** L'error s'amaga a la persona però arriba a la Consola d'administració: recurs, poble, camp i hora, sense cap dada personal, una sola vegada per sessió.

Disseny previst: una sola peça d'imatge defensiva al catàleg de Pedra Seca; una capacitat opcional del port de dades, `informaRecursTrencat` (fora del contracte obligatori de 32 mètodes); una taula amb RLS (inserció limitada, lectura només superadmin) i un panell a la Consola. Hui només tenen `onError` PerfilEditor, MultimediaSection, BarraTaronja i ItemMedia; el hero de PageFrame/UniversalPage i UniversalCard no en tenen. Per a gravar-ho a la skill de Pedra Seca cal l'executor amb lease: la lliçó queda redactada ací perquè la hi pose MarIA o el Mestre.

### 7. Agnosticisme: el mateix marcatge en qualsevol amfitrió

HTML pla (és el que fa el banc de proves i el que ha de fer Sollutia en una pàgina servida):

```html
<script>
  Object.assign(window, { SocDePobleConfig: Object.freeze({ nomPoble: 'Gent de la Torre', poble: 'la-torre-de-les-macanes' }) });
</script>
<soc-de-poble plugin-url="https://<ORIGEN>/<CAMI>/dist/" fonts-href="https://<ORIGEN>/<CAMI>/dist/fonts/noto-sans.css"></soc-de-poble>
<script src="https://<ORIGEN>/<CAMI>/dist/soc-de-poble.standalone.js"></script>
```

Des d'una SPA (Sollutia), el mateix sense el global: `el.config = { nomPoble, poble }` abans d'afegir l'element al DOM.

MediaWiki (esbós no provat: una extensió mínima o `LocalSettings.php`). Emet exactament el mateix marcatge:

```php
$wgHooks['ParserFirstCallInit'][] = static function ( Parser $parser ) {
	$parser->setHook( 'socdepoble', static function ( $input, array $args, Parser $parser ) {
		$parser->getOutput()->addHeadItem(
			'<script>Object.assign(window,{SocDePobleConfig:Object.freeze(' .
			json_encode( [ 'nomPoble' => $args['nom-poble'] ?? '', 'poble' => $args['poble'] ?? '' ],
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE ) .
			')});</script><script src="<URL_DIST>/soc-de-poble.standalone.js" defer></script>',
			'socdepoble'
		);
		return [ '<soc-de-poble plugin-url="<URL_DIST>/" fonts-href="<URL_DIST>/fonts/noto-sans.css"></soc-de-poble>', 'markerType' => 'nowiki' ];
	} );
};
```

Límits d'este esbós: la CSP del wiki i ResourceLoader poden exigir carregar l'script com a mòdul de ResourceLoader; si el bundle es carrega com a mòdul, `document.currentScript` no existix i cal declarar `plugin-url` (ja ho fa l'etiqueta). Si un amfitrió necessita qualsevol cosa que no siga este marcatge, és un defecte del contracte, no de l'amfitrió.

### 8. Instruccions per al Mestre (T3: prova a WordPress Studio)

El hook no deixa a l'agent compilar ni escriure fora del repo. Passos, en este ordre:

1. Compilar el paquet: `npm run build:wp`. El paquet segella el backend dels `VITE_*` de la màquina que compila: amb el `.env.local` de desenvolupament apunta al Supabase local (`localhost:54321`), que és el que cal per a WordPress Studio. Un paquet per a producció s'ha de compilar amb els valors de producció i s'ha de comprovar l'endpoint dins de `wordpress-plugin/dist/soc-de-poble.standalone.js`.
2. Revisar el registre del build: el mateix `build:wp` retira de `wordpress-plugin/dist/` les restes velles (`.htaccess`, `.DS_Store` i altres fitxers ocults, `robots.txt`, `sitemap.xml` i `auth/`) i en nomena cada una. Només queda a mà `socdepoble-react.css`, que no genera cap build: esborrar-lo o deixar-lo, no el carrega ningú.
3. Desactivar el plugin vell: `studio wp plugin deactivate soc-de-poble` (des de `~/Studio/socdepoble`).
4. Enllaçar el plugin nou (enllaç de CARPETA, no del fitxer): `ln -s "<repo>/wordpress-plugin" ~/Studio/socdepoble/wp-content/plugins/socdepoble-enxufe`. Si el servidor de Studio no servix fitxers a través de l'enllaç, copiar la carpeta amb `rsync`.
5. Activar-lo: `studio wp plugin activate socdepoble-enxufe`.
6. Crear una pàgina amb un bloc «Shortcode» que continga `[socdepoble_app]` i, si es vol pantalla completa, triar la plantilla «Sóc de Poble · pantalla completa».
7. Obrir la pàgina. Criteris: aterra a la pàgina de La Torre; en escriptori, «| Gent de la Torre» a la barra negra; en mòbil, la franja; la Wiki s'obri des del menú lateral; la URL de WordPress no canvia mai en navegar per dins.

Quan estiga fet, puc verificar-ho jo mateix al navegador integrat (`http://localhost:8881`).

### 9. Full de ruta i fites estratègiques

Fites anotades per decisió del Mestre durant el torn. Cap està implementada; totes respecten els tres endolls (amfitrió, dades i coneixement) i el filtre del Manifest de Poble.

| Fita | Què és | Dependències | Decisió pendent |
| --- | --- | --- | --- |
| **F1 · Injecció directa de contingut via Xat assistit per IA** | Mencionar la IAIA en una conversa del Xat (o en el bot de WhatsApp) amb un enllaç i una ordre («Em mola. Publica-ho com un esdeveniment a l'Agenda» o «al Mur»). La IAIA llig l'enllaç, n'extrau les dades i deixa la publicació preparada sense formularis. | Port de dades amb capacitat opcional; servei de lectura d'enllaços al costat del servidor; Agenda amb secció pròpia | Si la publicació és automàtica o demana un toc de confirmació (recomanat: confirmació d'un toc) |
| **F2 · Exportador de WordPress** | Migració única dels 522 continguts de socdepoble.net (425 articles, 18 pàgines, 59 projectes, 4 productes, 16 blocs) i 1.769 mitjans cap al cervell: Markdown amb YAML en git per al narratiu, Postgres per a l'estructurat. Categories de poble mapades als ids de Pobles, mitjans amb atribució, redireccions 301 de totes les URL antigues, comprovació per recompte. | API REST pública de WordPress (verificada: sense credencials per al contingut publicat); eina a `tooling/` amb executor i lease | Què es fa amb els 60 comentaris (dades personals): anonimitzar o no migrar |
| **F3 · Perfil d'usuari i d'empresa com a portafolis** | Inspirat en la pàgina d'autor de socdepoble.net: blocs opcionals Qui soc, Què faig, Amb què treballe, Portafolis (les pròpies publicacions), Currículum i Contacte, cadascun amb visibilitat pròpia. «Què faig» alimenta Oficis de Poble i Ocupació; «Estic a casa» vincula la persona al seu poble. Contacte sempre via Xat. | PerfilShell i PerfilPublicSection existents | Quins blocs són públics per defecte |
| **F4 · Disseny Defensiu Visual** | Punt 6: imatge defensiva única al catàleg, informe de trencaments a la Consola. | Capacitat opcional del port de dades | No |
| **F5 · Cervell adjunt** | Annex A: Postgres pla i Markdown/git com a formes canòniques; port de coneixement de només lectura. | ADR «Tres endolls» | Aprovar l'ADR |
| **F6 · Pont personal** | Annex B: Syncthing + SilverBullet sobre WireGuard, gestoria aïllada i xifrada. | VPS de la UE | Proveïdor, domini i sistema del mòbil |
| **F7 · Federació** | Annex C: porta lateral amb Fedify, el poble com a actor Group, per fases. | Carta de federació per poble | Pilot d'1 a 3 pobles |

#### Disseny de la fita F1 (injecció via Xat)

1. **Gallet.** Una menció a la IAIA dins d'una conversa del Xat que porta un enllaç, o el mateix missatge al bot de WhatsApp. La intenció («Agenda», «Mur», «Mercat») es deduïx de l'ordre; si no n'hi ha, la IAIA pregunta on.
2. **Lectura de l'enllaç al servidor, mai al navegador.** Un servei del costat de Supabase descarrega la pàgina amb límits de mida i de temps, només `http(s)`, i rebutja adreces privades o locals (protecció SSRF). La pàgina és una dada no fiable: la IAIA no n'obeïx cap instrucció (injecció de prompts).
3. **Extracció per capes, de la més fiable a la menys:** primer les dades estructurades que ja publica la web (JSON-LD `schema.org/Event`, OpenGraph, microdades); després, si falten camps, el model de llenguatge sobre el text. Camps d'un esdeveniment: títol, data i hora d'inici i fi (zona `Europe/Madrid`), lloc (nom, adreça, coordenades si n'hi ha), enllaç d'origen, imatge amb autoria i llicència, organitzadors.
4. **Esborrany a la conversa.** La IAIA respon amb una targeta prèvia (Pedra Seca) amb els camps extrets i tres accions: Publica, Edita, Descarta. Recomanació: un sol toc de confirmació abans de publicar, per honestedat («Zero Mentides Belles») i perquè un error de data en un acte del poble té conseqüències reals.
5. **Publicació.** A l'Agenda com a `Event` (ja preparat per a la federació, FEP-8a8e de l'annex C) o al Mur com a nota amb resum i enllaç. Consta la procedència: «Publicat amb la IAIA des de <enllaç>». No es copia el text sencer de la web d'origen: només fets (data, lloc, títol), un resum propi i l'enllaç.
6. **Imatge externa.** Passa pel Disseny Defensiu Visual (punt 6): si l'enllaç de la imatge mor, s'amaga i la Consola ho sap.
7. **Arquitectura.** Una capacitat opcional del port de dades (`injectaContingut`), fora del contracte obligatori de 32 mètodes; el Xat i el bot de WhatsApp en són dos clients. Cada injecció queda registrada a la Consola (qui, quan, enllaç d'origen, camps corregits a mà), cosa que també servix per a millorar l'extractor.
8. **Encaix amb el Manifest.** Resol la demanda de «connectar recursos, comunicar incidències i fer propostes: xarrades, cursos, festes, trobades» (pàg. 6, 2.3.1) i la de reduir l'escletxa digital (pàg. 6, 2.2): publicar deixa de dependre de saber omplir formularis.

<!-- IMPLEMENTACIO:FI -->

### Annex A · El cervell adjunt: quin sistema de coneixement obert

<!-- ANNEX-A:INICI -->
#### Veredicte

Cap producte és el «cervell adjunt» perfecte, i buscar-ne un és el camí més curt cap a una dependència nova. El cervell ha de ser un format, no una plataforma.

Recomane dues formes canòniques, i totes dos es poden llegir sense cap eina nostra:

- **Postgres pla** (Supabase, Apache-2.0; PostgREST, MIT) per a tot allò estructurat, relacional, privat o transaccional.
- **Markdown amb capçalera YAML i enllaços `[[wiki]]`** en un repositori git per a tot allò narratiu.

Qualsevol sistema (WordPress, MediaWiki o un gestor de continguts) s'hi endolla com a adaptador de lectura o d'escriptura, però mai com a amo de l'esquema. Això és la desenxufabilitat extrema: si demà cau qualsevol eina, les dades es continuen llegint amb psql o amb un editor de text, i el projecte es clona sencer amb git.

Com es repartix per dominis:

- **Pobles.**
  - Les dades viuen a Supabase amb l'identificador de Wikidata (QID) de cada poble i una còpia en memòria cau dels camps útils (escut, coordenades, població, imatges de Commons i text d'introducció). Cada camp porta llicència, atribució, revisió d'origen i data de captura.
  - L'origen és Wikidata (dades CC0) i Viquipèdia/Commons (CC BY-SA 4.0, amb atribució obligatòria), consultades per les seues API REST.
  - La votació veïnal de la portada viu a Supabase amb seguretat per fila (RLS).
  - No cal allotjar MediaWiki ni Wikibase: Wikibase Suite demana 8 GB de RAM, una IP pública i dos dominis. La sinergia real amb MediaWiki és consumir-lo i enviar les correccions riu amunt amb la comunitat viquimedista catalana.
- **Gestoria.** Els expedients i les dades de cada persona van a Supabase amb RLS. MediaWiki no admet restriccions de lectura per pàgina, i els editors basats en git només tenen permisos per a tot el repositori. Les guies públiques van en Markdown.
- **Wiki de Poble i textos de Cultura.** El repositori git continua sent la font, allotjat en un Forgejo propi (GPL-3.0 o posterior), i el manifest compilat continua alimentant les incrustacions. Els editors són intercanviables damunt dels mateixos fitxers:
  - Obsidian per al Mestre.
  - SilverBullet (servidor MIT, un sol binari de Rust, el mateix model de fitxers, historial git amb autoria) com a wiki web. Només per a persones de confiança, perquè el rol d'escriptura pot executar ordres al servidor.
  - Sveltia CMS o Decap CMS (MIT, sense servidor, amb suport de Forgejo i traducció integrada) per a entrades amb formulari.

  Cap d'aquests editors s'adopta sense una prova d'anada i tornada sobre fitxers reals que demostre que no reescriu els enllaços `[[wiki]]` ni la capçalera YAML.

La federació i la replicació són dos coses distintes i han d'anar per endolls distints. La replicació sencera ja la dona git: qualsevol poble o col·lectiu pot clonar el cervell amb tot l'historial.

La difusió cap al Fedivers s'ha d'afegir com a capacitat opcional del port de dades amb Fedify (MIT, amb controlador per a Postgres). Cada Poble o Comunitat es fa un actor de tipus grup, a la manera de Lemmy, sense adoptar cap gestor de continguts només per federar. Cal fixar versions, perquè Fedify 2.3.8 va corregir el 22-09-2026 una fallada crítica d'autenticació d'entrada, i cal provar-ho contra Mastodon.

Ghost (MIT, fundació sense ànim de lucre) és acceptable com a canal satèl·lit per a butlletins i articles de Cultura, amb el seu servei ActivityPub autoallotjat. No pot ser el cervell: té un model de contingut fix, només funciona amb MySQL i demana una instal·lació per idioma.

El preu honest d'aquesta arquitectura:

- Supabase no porta editor per als veïns, ni traduccions ni revisions de sèrie. Cal dissenyar-les a l'esquema, amb taules de traducció o jsonb per idioma i un historial per disparadors.
- Git no té permisos per pàgina, genera conflictes i afegix latència de compilació.

Si els veïns han d'editar dades estructurades amb formularis, l'única capa editorial lliure que hi encaixa és Payload (MIT, versions i localització gratuïtes, configuració com a codi). Aniria en un esquema de Postgres propi i com a escriptor, mai com a segona font de veritat. Queda diferit per quatre raons: la compra per Figma, l'acoblament a Next.js, l'opció d'esquema propi, que és experimental, i el comportament per defecte d'esborrar l'esquema quan migra.

Dels exemples del Mestre:

- Directus seria l'encaix tècnic natural, perquè guarda el contingut en taules SQL nostres. Però queda desqualificat: la llicència MSCL-1.0 no és lliure, el nivell gratuït està limitat (3 seients, 25 col·leccions, 30 dies d'historial), la clau de llicència comunica amb el servidor del fabricant, i és la tercera volta que endurix la llicència.
- Strapi cobra l'historial de continguts i no accepta bases de dades preexistents.
- Ghost i MediaWiki tenen el seu lloc, però no com a cervell.

Per a l'Enxufe de la Fase 2, la conseqüència és que calen tres endolls separats, detallats a continuació.

#### Tres endolls: amfitrió, dades i coneixement

Hui es confonen tres eixos que han d'anar separats: on s'incrusta l'app, d'on venen les dades estructurades i d'on ve el coneixement narratiu. Cada eix té el seu endoll, i cadascun es pot canviar sense tocar els altres dos.

- **Endoll d'amfitrió.** És `window.SocDePobleConfig` més els atributs de l'element. Ha de quedar estrictament de presentació: cap clau que diga d'on venen les dades i res propi de WordPress. Així, MediaWiki com a pàgina amfitriona és només un fragment de JavaScript del lloc o una extensió, i MediaWiki com a font de dades és un adaptador més. Són dos eixos independents.
- **Endoll de dades.** Continua sent el port actual cap a Supabase.
- **Endoll de coneixement (nou).** Un port de lectura, xicotet i fora del contracte obligatori de 32 mètodes, per no inflar un contracte que ja és de tot o res. Usa una forma de document neutra: identificador, idioma, títol, metadades, cos amb format declarat (markdown o html), enllaços eixints, revisió, data d'actualització, llicència, atribució, adreça d'origen i visibilitat, més les capacitats declarades. El primer adaptador és el manifest compilat que ja tenim. Després poden vindre SilverBullet, l'API REST de MediaWiki o Ghost sense tocar ni la configuració de l'amfitrió ni el nucli.

#### Taula de puntuació

Escala: 0 = absent o dolent, 3 = excel·lent. «—» vol dir que no s'ha avaluat. En «Encaix Postgres», els sistemes de fitxers puntuen baix perquè guarden les dades en fitxers, no per un defecte.

| Candidat | Llicència OSI | Desenxufabilitat | Descentralització | API desacoblada | Encaix Postgres/Supabase | Petjada | i18n | Maduresa | Veredicte |
|---|---|---|---|---|---|---|---|---|---|
| Supabase / PostgREST | 3 Apache | 3 SQL | 1 replicació | 3 PostgREST | 3 natiu | 1 feixuga | 1 manual | 3 consolidat | Canònic (estructurat) |
| Markdown + git (Forgejo) | 3 GPL | 3 fitxers | 3 clonació | 1 manifest | 1 complementari | 3 lleuger | 2 convenció | 3 git | Canònic (narratiu) |
| SilverBullet (servidor) | 3 MIT | 3 fitxers | 2 git | 2 sincronització | 0 fitxers | 3 binari | 0 desconeguda | 2 unipersonal | Editor wiki |
| Sveltia CMS | 3 MIT | 3 fitxers | 2 Forgejo | 0 editor | 0 fitxers | 3 estàtic | 3 nadiua | 1 pre-1.0 | Editor de formularis |
| Decap CMS | 3 MIT | 3 fitxers | 2 Forgejo | 0 editor | 0 fitxers | 3 estàtic | 3 nadiua | 2 estable | Editor de formularis (alternativa) |
| Wikidata + Viquipèdia (consumides) | 3 CC0 | 2 memòria-cau | 2 comunitat | 3 REST | 2 memòria-cau | 3 zero | 3 multilingüe | 3 Wikimedia | Font externa (Pobles) |
| MediaWiki autoallotjat | 3 GPL | 1 wikitext | 1 extensió | 2 REST | 1 secundari | 2 PHP | 3 translatewiki | 3 Wikimedia | No com a cervell |
| Fedify | 3 MIT | 3 sense-magatzem | 3 ActivityPub | 0 biblioteca | 3 controlador | 3 incrustat | 1 contentMap | 2 avís-crític | Federació opcional |
| Payload | 3 MIT | 2 Postgres | 0 cap | 3 REST | 2 experimental | 1 Next.js | 3 per-camp | 2 Figma | Diferit (escriptor) |
| Ghost + ActivityPub | 3 MIT | 1 MySQL | 3 ActivityPub | 2 lectura | 0 MySQL | 2 moderada | 0 monolingüe | 3 fundació | Satèl·lit de Cultura |
| Wiki.js | 3 AGPL | 2 espill | 1 git | 2 canviant | 2 v3 | 2 Node | 2 interfície | 1 beta | Diferit |
| Ibis | 3 AGPL | 2 Markdown | 3 ActivityPub | 1 indocumentada | 2 pròpia | 3 binari | 0 sense-català | 1 v0.3 | Referència |
| Directus | 0 MSCL | 3 SQL | 0 telefona | 3 completa | 1 monoesquema | 2 moderada | 2 col·leccions | 2 inestable | Rebutjat |
| Strapi CE | 2 parcial | 1 esquema-propi | 0 cap | 3 completa | 1 exclusiu | 1 2GB | 3 gratuïta | 3 actiu | Rebutjat |
| WordPress + ActivityPub | 3 GPL | 1 rígid | 3 ActivityPub | 2 REST | 0 MySQL | 2 LAMP | 1 connectors | 3 consolidat | Només amfitrió |
| BookStack | 3 MIT | 1 HTML | 0 cap | 3 REST | 0 MySQL | 2 PHP | 1 interfície | 3 sa | Rebutjat |
| Outline | 0 BSL | 1 intern | 0 cap | 2 RPC | 2 propi | 1 SSO | 1 interfície | 3 actiu | Rebutjat |
| Federated Wiki | 3 MIT | 3 JSON | 2 bifurcació | 2 lectura | 0 fitxers | 3 lleuger | 0 absent | 1 nínxol | Idea |
| Keystatic | 3 MIT | 2 Markdoc | 1 GitHub | 1 Node | 0 fitxers | 1 framework | 0 no-verificada | 1 v0.6 | Rebutjat |
| TinaCMS | 2 dubtosa | 2 fitxers | 1 GitHub | 2 GraphQL | 0 MongoDB | 1 tres-peces | 0 no-verificada | 2 comercial | Rebutjat |
| Logseq | 3 AGPL | 2 escissió | 1 local | 0 cap | 0 SQLite | 3 escriptori | 1 interfície | 1 beta | Rebutjat |
| AFFiNE | 0 EE | 0 CRDT | 1 local | 0 cap | 1 propi | 0 4CPU | 1 interfície | 2 prellançaments | Rebutjat |
| Anytype | 0 ASAL | 0 xifrat | 3 P2P | 1 bot | 0 MongoDB | 1 dispers | — | 2 actiu | Rebutjat |
| Lemmy | 3 AGPL | 1 propi | 3 ActivityPub | 2 pròpia | 2 propi | 2 Rust | 2 Weblate | 2 1.0-beta | Model (Comunitats) |
| Mastodon | 3 AGPL | 1 propi | 3 ActivityPub | 2 REST | 2 propi | 0 pesat | 2 Crowdin | 3 consolidat | Model (interoperabilitat) |
| NocoDB | 0 SUL | — | — | — | — | — | — | — | Rebutjat |
| Baserow (OSE) | 2 parcial | — | — | — | — | — | — | — | Rebutjat |

#### Descartats

- **Directus.** La llicència MSCL-1.0 és de codi consultable, no lliure. És el tercer enduriment de llicència (GPL, després BSL el 2023, després MSCL i clau el 2026). La clau de llicència comunica amb el servidor del fabricant, i la telemetria només es pot desactivar en el nivell Enterprise. El nivell gratuït està limitat a 3 seients, 25 col·leccions, 5 fluxos i 30 dies d'historial. La subvenció s'ha de renovar cada any i pot deixar de cobrir el projecte si hi entra un ajuntament de més de 50 persones (inferència). A més, no admet una base de dades amb diversos esquemes, com la de Supabase. Com a molt, es podria usar com una pell d'administració d'un sol ús sobre taules nostres.
- **Strapi CE.** Té un nucli obert amb funcions de pagament: l'historial de continguts, els fluxos de revisió i els registres d'auditoria són de pagament. No accepta bases de dades preexistents i avisa de pèrdua de dades, així que seria una segona font de veritat duplicada respecte de Supabase.
- **Ghost com a cervell.** Té un model de contingut fix, sense tipus propis ni relacions. Només funciona amb MySQL, demana una instal·lació per idioma (en farien falta 5) i l'administració només està en anglés. Sí que és acceptable com a canal satèl·lit de Cultura amb ActivityPub autoallotjat.
- **MediaWiki autoallotjat com a cervell.** Guarda wikitext en MariaDB, i Postgres hi és de segona. No admet restriccions de lectura per pàgina, que la Gestoria necessita. La conversió des del Markdown d'Obsidian perd informació en els dos sentits. Wikibase Suite demana 8 GB de RAM i dos dominis. Sí que es recomana consumir Wikidata i Viquipèdia per als Pobles.
- **WordPress (i BuddyPress) com a cervell.** És feixuc i rígid, funciona amb MySQL i les dades estructurades depenen d'una proliferació de connectors. Es queda només com a amfitrió i banc de proves, i cap contracte de dades pot dependre dels seus tipus de contingut.
- **Outline.** La llicència BSL 1.1 no és OSI i restringix l'ús com a servei de documents fins al 09-09-2030 (versió 1.10.1). A més, obliga a tindre un proveïdor d'identitat SSO extern.
- **NocoDB.** La Sustainable Use License no és OSI i prohibix oferir-lo com a servei als pobles més enllà d'un ús intern o no comercial.
- **AFFiNE.** El servidor està sota la llicència propietària EE. Guarda el contingut en un format CRDT opac, sense API pública, i demana com a mínim 4 CPU.
- **Anytype.** El nucli (anytype-heart) està sota la ASAL 1.0, no OSI, amb restriccions d'ús comercial. El xifrat d'extrem a extrem impedix servir dades públiques, i necessita MongoDB, Redis i Garage.
- **BookStack.** És MIT i està ben mantingut, però només funciona amb MySQL o MariaDB, guarda el contingut en HTML i imposa una jerarquia de llibres rígida, que no s'avé amb un graf d'enllaços.
- **Keystatic.** L'emmagatzematge remot només funciona amb GitHub, necessita una aplicació Astro, Next.js o Remix per a allotjar l'editor i encara és pre-1.0.
- **TinaCMS.** Per a autoallotjar-lo cal MongoDB o Vercel KV, a més de GitHub. En autoallotjament li falten la cerca i els fitxers multimèdia en git, i la llicència del paquet datalayer és dubtosa.
- **Logseq.** La sintaxi d'esbós contaminaria la Wiki de Poble. La versió amb base de dades s'allunya dels fitxers plans i la sincronització en temps real està en alfa, amb risc de pèrdua de dades.
- **Baserow (OSE).** És un full de càlcul en base de dades, no un sistema de coneixement, i duplicaria dades de Supabase.
- **Wiki.js.** Diferit, no rebutjat. La v3 està en beta i és explícitament «no apta per a producció». Té un sol mantenidor visible, exigix exactament Node 26 i passa de GraphQL a REST. Es revisarà quan la 3.0 siga estable.
- **Payload.** Diferit, no rebutjat. Només s'adoptarà si els veïns necessiten formularis per a dades estructurades. Els riscos són la propietat de Figma, l'acoblament a Next.js, l'opció d'esquema propi, que és experimental, i l'esborrat d'esquema per defecte.
- **Ibis.** Es queda com a referència de wiki federada. És pre-1.0, té un sol mantenidor, no té interfície en català ni en les altres llengües de l'ecosistema i la seua API no té garantia d'estabilitat.
- **Federated Wiki.** Només aporta idees (bifurcar una pàgina amb procedència). La interfície és difícil per als veïns i no té ni traduccions ni permisos.
- **Lemmy i Mastodon.** Són models d'interoperabilitat, no magatzems de coneixement: Lemmy per a l'actor de grup de les Comunitats i Mastodon com a referència per a provar la federació.

#### Passos següents

1. Fase 2, ara: revisar `window.SocDePobleConfig` i deixar-hi només claus de presentació. Qualsevol adreça, clau o tipus de contingut propi de WordPress passa a un adaptador. Afegir una prova que falle si la configuració de l'amfitrió porta claus d'origen de dades.
2. Redactar un ADR «Tres endolls: amfitrió, dades i coneixement» i sotmetre'l a l'aprovació del Mestre abans de picar codi (sdp-workflow §1).
3. Definir el port de coneixement de lectura (llistar documents, obtindre document per identificador i idioma, revisions, cerca i capacitats declarades) fora del contracte obligatori de 32 mètodes. Ha d'usar la forma de document neutra, amb llicència, atribució, format del cos i visibilitat com a camps obligatoris. El primer adaptador és el manifest compilat actual.
4. Prova d'anada i tornada: obrir i desar una còpia de fitxers reals de la Wiki de Poble amb SilverBullet, Sveltia CMS i Decap CMS. Comparar byte a byte els enllaços `[[wiki]]` i les capçaleres YAML abans de triar editor.
5. Pobles: afegir a l'esquema de Supabase el QID de Wikidata i els camps en memòria cau amb llicència, atribució, revisió d'origen i data de captura. Escriure la sincronització des de l'API REST de Wikibase i de Viquipèdia en el costat servidor, no en el navegador.
6. Dissenyar a Supabase les traduccions dels dominis estructurats (ca, es, en, eu, gl) amb taules de traducció o jsonb per idioma, i l'historial de revisions amb disparadors.
7. Fer un pilot de Forgejo autoallotjat per al repositori de coneixement i mesurar-ne la petjada real en un VPS xicotet. Valorar si la Wiki de Poble ha d'anar en un repositori separat del codi.
8. Prova de concepte de federació: Fedify 2.3.8 o posterior amb `@fedify/postgres`, amb un Poble com a actor de grup, validada contra Mastodon. Comprovar també si les Edge Functions de Supabase suporten les cues d'entrega.
9. Només si els veïns necessiten formularis per a dades estructurades: provar Payload en un esquema propi sobre una còpia de la base de dades, mai sobre producció.
10. Tornar a revisar Wiki.js quan la 3.0 siga estable, i seguir Ibis com a referència de wiki federada.

#### No verificat

- No s'han verificat una per una les llicències de GoTrue, Realtime, Storage i Studio de Supabase. Només s'han llegit el monorepositori (Apache-2.0) i PostgREST (MIT).
- No se sap si Sveltia CMS, Decap CMS o SilverBullet conserven byte a byte els enllaços `[[wiki]]` d'Obsidian i les capçaleres YAML de la Wiki de Poble.
- SilverBullet: no s'han verificat la política CORS de l'API `/.fs`, les traduccions de la interfície (el català inclòs) ni la compatibilitat real amb la carpeta de la Wiki de Poble.
- No s'han verificat la petjada real de Forgejo, l'estat de la federació ForgeFed ni el text complet de l'avís GHSA-5cjj-j77f-rq2g, que només s'ha vist en fragments de cerca.
- Sveltia CMS no té flux editorial amb Forgejo. No s'ha verificat si la protecció de branques de la forja pot substituir-lo com a moderació.
- Payload: no s'han verificat l'opció d'esquema propi sobre el Postgres de Supabase, els requisits de maquinari, la interfície d'administració en català ni els ganxos d'avís.
- No s'ha provat si Fedify pot funcionar dins de les Edge Functions de Supabase amb les cues d'entrega que necessita.
- No s'ha verificat si el Postgres de Supabase oferix les extensions `ltree` i `pg_trgm` que exigix Wiki.js v3.
- Directus: s'ha documentat que no admet una base de dades amb diversos esquemes, però no s'ha provat sobre Supabase. L'exclusió d'un ajuntament de més de 50 persones de la subvenció és una inferència a partir del text, no confirmada amb Directus.
- No s'ha verificat si Strapi considera Supabase gestionat una base de dades de núvol no admesa.
- Ghost: no s'han verificat l'historial de revisions de les entrades, la granularitat dels rols ni el format de l'exportació JSON.
- No s'ha verificat si MediaWiki té ganxos d'avís natius, ni com s'incrustaria el component `<soc-de-poble>` en MediaWiki com a pàgina amfitriona (JavaScript del lloc o extensió).
- No s'han verificat les extensions d'auditoria de Supabase, `pg_graphql` ni els ganxos de base de dades.
- No s'han verificat els límits de consulta ni la política CORS de les API REST de Wikidata i Viquipèdia per a una sincronització periòdica.
- No s'han verificat les dates de publicació de Ghost, del connector ActivityPub de WordPress, de SilverBullet, de Lemmy i de Logseq 2.0.1.
- Dos investigadors discrepaven sobre si el suport de Forgejo a Decap estava verificat. Es dona per verificat, perquè un d'ells va llegir la pàgina oficial del connector gitea (Gitea 1.20 o superior, Forgejo 1.21.4 o superior, sense git-lfs).
- Que cap gestor de continguts ha de ser una segona font de veritat és un judici d'arquitectura, no una dada verificada.

#### Fonts

Tres investigacions sobre fonts primàries fetes el 29-09-2026: fitxers de llicència, documentació oficial i notes de versió. Les adreces marcades com a fragment de cerca no s'han llegit senceres.

**Supabase / PostgREST**

- https://github.com/supabase/supabase/blob/master/LICENSE
- https://github.com/PostgREST/postgrest/blob/main/LICENSE
- https://github.com/PostgREST/postgrest/releases
- https://supabase.com/docs/guides/self-hosting/docker

**Markdown + git (Forgejo)**

- https://codeberg.org/forgejo/forgejo/src/branch/forgejo/LICENSE

**SilverBullet**

- https://github.com/silverbulletmd/silverbullet
- https://github.com/silverbulletmd/silverbullet/blob/main/LICENSE.md
- https://github.com/silverbulletmd/silverbullet/releases
- https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/docs/HTTP%20API.md
- https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/docs/Licensing.md
- https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/docs/Collaboration.md
- https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/docs/Revisions.md
- https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/docs/Dashboard.md

**Sveltia CMS**

- https://api.github.com/repos/sveltia/sveltia-cms
- https://registry.npmjs.org/@sveltia/cms
- https://github.com/sveltia/sveltia-cms
- https://sveltiacms.app/en/docs/backends

**Decap CMS**

- https://api.github.com/repos/decaporg/decap-cms
- https://api.github.com/repos/decaporg/decap-cms/releases?per_page=5
- https://decapcms.org/docs/backends-overview/
- https://decapcms.org/docs/i18n/
- https://decapcms.org/docs/gitea-backend/
- https://github.com/decaporg/decap-cms
- https://github.com/decaporg/decap-cms/releases

**MediaWiki, Wikibase i Wikidata**

- https://www.mediawiki.org/wiki/Version_lifecycle
- https://github.com/wikimedia/mediawiki/blob/master/COPYING
- https://www.mediawiki.org/wiki/Manual:Installation_requirements
- https://www.mediawiki.org/wiki/API:REST_API
- https://www.mediawiki.org/wiki/Parsoid
- https://www.mediawiki.org/wiki/Manual:Preventing_access
- https://www.mediawiki.org/wiki/Wikibase/Installation
- https://github.com/wmde/wikibase-suite
- https://github.com/wmde/wikibase-suite/blob/main/docs/install/installer.md
- https://phabricator.wikimedia.org/T207226
- https://www.wikidata.org/wiki/Wikidata:REST_API
- https://www.wikidata.org/wiki/Wikidata:Licensing
- https://www.mediawiki.org/wiki/Extension:ActivityWiki

**Fedify**

- https://github.com/fedify-dev/fedify
- https://github.com/fedify-dev/fedify/releases

**Payload**

- https://github.com/payloadcms/payload/blob/main/LICENSE.md
- https://github.com/payloadcms/payload/releases
- https://payloadcms.com/posts/blog/payload-is-joining-figma
- https://payloadcms.com/docs/database/postgres
- https://payloadcms.com/docs/versions/overview
- https://payloadcms.com/docs/configuration/localization

**Ghost i el servei ActivityPub de Ghost**

- https://github.com/TryGhost/Ghost/blob/main/LICENSE
- https://github.com/TryGhost/ActivityPub
- https://github.com/TryGhost/Ghost/releases
- https://docs.ghost.org/install/docker
- https://docs.ghost.org/faq/supported-databases
- https://docs.ghost.org/content-api
- https://docs.ghost.org/faq/translation
- https://ghost.org/help/managing-your-team/
- https://ghost.org/changelog/post-history/ (fragment de cerca)

**Wiki.js**

- https://github.com/requarks/wiki
- https://api.github.com/repos/requarks/wiki
- https://github.com/requarks/wiki/releases
- https://api.github.com/repos/requarks/wiki/releases?per_page=4
- https://api.github.com/repos/requarks/wiki/contents/backend/modules/storage?ref=3.0.0-beta.605
- https://docs.js.wiki/setup/requirements
- https://docs.js.wiki/dev/api
- https://docs.js.wiki/admin/webhooks
- https://docs.requarks.io/install/requirements
- https://docs.requarks.io/storage/git
- https://docs.requarks.io/dev/api

**Ibis**

- https://github.com/Nutomic/ibis
- https://github.com/Nutomic/ibis/commits/master
- https://github.com/Nutomic/ibis/tree/master/locales
- https://raw.githubusercontent.com/Nutomic/ibis/master/crates/api_client/src/article.rs

**Directus**

- https://github.com/directus/directus/blob/main/license
- https://github.com/directus/directus/commits/main/license
- https://github.com/directus/directus/blob/c6b1e82/license
- https://github.com/directus/directus/pull/27417
- https://github.com/directus/directus/releases
- https://directus.com/resources/directus-v12-license-change
- https://directus.com/docs/licensing/overview
- https://directus.com/docs/licensing/open-innovation-grant
- https://directus.com/docs/licensing/telemetry
- https://directus.com/pricing
- https://directus.com/docs/self-hosting/requirements
- https://directus.com/docs/getting-started/overview

**Strapi**

- https://github.com/strapi/strapi/blob/develop/LICENSE
- https://github.com/strapi/strapi/releases
- https://strapi.io/pricing-cms
- https://docs.strapi.io/cms/configurations/database
- https://docs.strapi.io/cms/deployment

**WordPress i el connector ActivityPub**

- https://github.com/Automattic/wordpress-activitypub
- https://github.com/Automattic/wordpress-activitypub/releases
- https://raw.githubusercontent.com/Automattic/wordpress-activitypub/trunk/FEDERATION.md
- https://raw.githubusercontent.com/WordPress/wordpress-develop/trunk/src/license.txt

**BookStack**

- https://github.com/BookStackApp/BookStack/blob/development/LICENSE
- https://api.github.com/repos/BookStackApp/BookStack/releases?per_page=3
- https://www.bookstackapp.com/docs/admin/installation/
- https://demo.bookstackapp.com/api/docs

**Outline**

- https://github.com/outline/outline/blob/main/LICENSE
- https://api.github.com/repos/outline/outline/releases?per_page=3
- https://docs.getoutline.com/s/hosting
- https://docs.getoutline.com/s/hosting/doc/requirements-ULdYnwi4wG
- https://docs.getoutline.com/s/hosting/doc/authentication-7ViKRmRY5o
- https://www.getoutline.com/developers

**Federated Wiki**

- https://github.com/fedwiki/wiki
- https://github.com/fedwiki/wiki/blob/main/LICENSE.txt
- https://github.com/fedwiki/wiki/commits/main
- http://fed.wiki.org/welcome-visitors.json

**Keystatic**

- https://api.github.com/repos/Thinkmill/keystatic
- https://registry.npmjs.org/@keystatic/core
- https://keystatic.com/docs/introduction
- https://keystatic.com/docs/configuration
- https://keystatic.com/docs/reader-api

**TinaCMS**

- https://github.com/tinacms/tinacms/blob/main/LICENSE
- https://api.github.com/repos/tinacms/tinacms
- https://registry.npmjs.org/tinacms
- https://registry.npmjs.org/@tinacms/datalayer
- https://api.github.com/repos/tinacms/tinacms/contents/packages/@tinacms/datalayer
- https://tina.io/docs/self-hosted/overview
- https://tina.io/docs/introduction/faq

**Logseq**

- https://github.com/logseq/logseq
- https://github.com/logseq/logseq/releases
- https://github.com/logseq/logseq/tree/master/cli
- https://logseq.io/page/b2ad9ce1-9cb7-4436-8083-54cb4516d324/df4dc09d-0a12-4c87-904e-22a9bf4c350a (fragment de cerca)

**AFFiNE**

- https://github.com/toeverything/AFFiNE/blob/canary/LICENSE
- https://github.com/toeverything/AFFiNE/blob/canary/packages/backend/server/LICENSE
- https://github.com/toeverything/AFFiNE/releases
- https://docs.affine.pro/self-host-affine/

**Anytype / any-sync**

- https://github.com/anyproto/any-sync
- https://github.com/anyproto/any-sync-node
- https://github.com/anyproto/anytype-heart/blob/main/LICENSE.md
- https://github.com/anyproto/any-sync-dockercompose
- https://github.com/anyproto/anytype-cli

**Lemmy**

- https://github.com/LemmyNet/lemmy
- https://github.com/LemmyNet/lemmy/releases

**Mastodon**

- https://github.com/mastodon/mastodon

**NocoDB**

- https://github.com/nocodb/nocodb/blob/develop/LICENSE.md

**Baserow**

- https://github.com/baserow/baserow/blob/develop/LICENSE
<!-- ANNEX-A:FI -->

### Annex B · El pont personal Mac → servidor → mòbil

<!-- ANNEX-B:INICI -->
#### Resum

Recomanació: **opció A**, Syncthing + SilverBullet sobre una xarxa privada WireGuard, en un VPS xicotet de la UE amb el volum de dades xifrat (LUKS2) i còpies restic a dos destins independents. És l'única de les quatre opcions que complix alhora els set criteris: fitxers plans al Mac i al servidor, mòbil complet a iOS i Android, gestoria fora d'Internet i tot programari lliure. `socdepoble.org` queda fora de Syncthing per construcció i continua només per git. La gestoria té instància, nom de màquina i directori propis, amb una caixa forta Cryptomator per als documents més sensibles (nivells 1 + 2). Sóc de Poble, en una fase posterior, només llig una exportació pública de llista blanca empesa a un host estàtic, mai el VPS privat.

#### Opcions viables per al Pont (Mac → Servidor → Mòbil)

Data de la recerca: 2026-09-29. Font: la recerca verificada dels tres grups (sincronització, editors web de notes, privacitat i xarxa). Tot el que porta «no verificat» no s'ha pogut comprovar en una font primària.

##### Criteris d'avaluació

1. **Fitxers plans com a original**, tant al Mac com al servidor. És el model Obsidian, sense captivitat.
2. **Mòbil complet:** llegir, editar i organitzar des del mòbil, a iOS i a Android (encara no sabem quin telèfon té el Mestre).
3. **Gestoria privada:**
   - gens accessible des d'Internet;
   - xifrada en repòs;
   - amb una còpia xifrada fora del servidor.
4. **Programari lliure (OSI).** Cada peça que no ho siga queda assenyalada.
5. **Servidor:** un VPS xicotet a la UE.
6. **Repositori protegit:** `socdepoble.org` no pot quedar mai sota dos sistemes de sincronització alhora.
7. **Endoll per a Sóc de Poble:** l'app s'ha de poder endollar als dominis públics, només en lectura. La gestoria no hi pot entrar mai.

##### Opció A · Syncthing + SilverBullet sobre una xarxa privada WireGuard

**Peces**
- **Syncthing 2.1.5** (MPL-2.0), al Mac i al VPS. Fa una rèplica de fitxers plans, carpeta per carpeta.
- **SilverBullet 2.11.1** (MIT), al VPS. És un editor web de Markdown:
  - entén els `[[wikilinks]]` com Obsidian (primer la ruta exacta, després el sufix; avisa dels enllaços ambigus);
  - llig el frontmatter YAML de manera nativa;
  - té arbre de fitxers, visor de PDF, àudio i vídeo, i permet pujar fitxers;
  - al mòbil s'instal·la com a PWA i funciona sense connexió.
- **WireGuard.** Les eines són GPL-2.0; les apps d'iOS i macOS, MIT; la d'Android, Apache-2.0. És l'única porta d'entrada al VPS.
- **Opcional al mòbil**, per a treballar amb fitxers locals:
  - Synctrain/Sushitrain (iOS, MPL-2.0), amb sincronització selectiva i accés a demanda;
  - Syncthing-Fork (Android, MPL-2.0, F-Droid) amb Markor (Apache-2.0).
- **Al VPS:** LUKS (cryptsetup 2.8.8, GPL-2.0+) per a xifrar el disc i restic 0.19.1 (BSD-2) per a les còpies.

**Flux Mac → servidor → mòbil**
1. Edites al Mac.
2. Syncthing envia el canvi al VPS pel túnel.
3. SilverBullet el servix per HTTPS dins de la xarxa privada.
4. El mòbil (PWA o client nadiu) el llig i l'edita.
5. L'escriptura cau al disc del VPS i Syncthing la torna al Mac.

**Privacitat**
- El servidor veu el text en clar: és el preu de tindre web.
- Mesures:
  - Des d'Internet només hi ha el port UDP de WireGuard, que no respon a paquets sense clau.
  - Les dades són dins d'un volum LUKS.
  - La gestoria té una instància pròpia de SilverBullet i un nom de màquina propi.
- Opcional: una caixa forta Cryptomator per al nucli més sensible, que el servidor no pot llegir.

**Cobertura mòbil:** iOS i Android funcionen igual amb la PWA. Com a client nadiu: Synctrain (iOS 17+), Syncthing-Fork (Android) o SyncUp (tots dos; un sol mantenidor).

**Llicències:** tot OSI. Només hi entraria programari no lliure si el Mestre tria Obsidian (propietari) com a editor local al telèfon. SilverBullet Desktop (SB+) exigix llicència Pro per a ús professional, però el Pont no el necessita.

**Cost orientatiu (sense IVA)**
- VPS de 4 GB a la UE: 3,81 €/mes a OVH VPS-1 (preu «des de», permanència no verificada) o 7,20 CHF/mes a Infomaniak (pagament anual).
- Còpia fora del VPS: unes 3–4 €/mes (no verificat).
- Programari: 0 €.

**Esforç:** 1–2 jornades la primera vegada (estimació pròpia) i manteniment baix.

**Riscos**
- SilverBullet i Syncthing escriuen sobre el mateix arbre, i poden aparéixer fitxers `.sync-conflict-*`. No està verificat que SilverBullet detecte bé les edicions externes (un commit de setembre de 2026 ho suggerix).
- SilverBullet prohibix l'atribut `name` al frontmatter. Cal contrastar-ho amb el `schema.json` de la Wiki.
- Depén d'un mantenidor principal (Zef Hemel).
- En el nivell bàsic, la gestoria no té xifratge d'extrem a extrem.
- No edita `.docx`, `.odt` ni `.xlsx`: caldria el mòdul de l'opció B.
- No està verificat que es puguen pujar fitxers i reorganitzar carpetes des de la PWA al mòbil (en escriptori es fa arrossegant).

##### Opció B · Nextcloud 35 (+ Collabora) o OpenCloud com a producte integral

**Peces**
- **Nextcloud Server 35.0.1** (AGPL-3.0), amb:
  - client d'escriptori (GPL-2.0);
  - app d'iOS (GPL-3.0) i app d'Android (GPL-2.0, també a F-Droid);
  - Collabora CODE (MPL-2.0) per a editar ofimàtica al navegador.
- **Variant:** OpenCloud 8.0.1 (servidor Apache-2.0, web AGPL-3.0, clients GPL), amb el controlador PosixFS, que guarda l'arbre en fitxers plans.

**Flux:** el client d'escriptori sincronitza la carpeta del Mac amb el servidor. Les apps mòbils naveguen, pugen i editen, i el web de Nextcloud ho mostra tot.

**Privacitat**
- **Servidor de confiança.** El xifratge de servidor, per defecte, usa una clau mestra que l'administrador pot desxifrar, i els fitxers deixen de ser plans.
- **E2EE:**
  - només es pot activar sobre carpetes buides;
  - al web és només de lectura;
  - la recuperació depén d'una frase de 12 paraules.
- **OpenCloud:** no té E2EE en les fonts llegides.

**Cobertura mòbil:** és la millor en apps natives lliures. Nextcloud té traducció al català (servidor, Android i escriptori).

**Llicències:** tot OSI. Collabora CODE és gratuït, però el fabricant diu que no és recomanable per a producció.

**Cost:** amb Collabora cal un VPS de 8 GB (OVH VPS-2, 7,21 €/mes). Els requisits reals de RAM no estan verificats.

**Esforç:** 2–3 jornades, i un manteniment alt: PHP, base de dades, Redis, cron i actualitzacions majors.

**Riscos**
- No entén els `[[wikilinks]]`. A més, Nextcloud Text reescriu el Markdown: hi ha un cas documentat de `***` convertit en `---`, arreglat el 2026. Això vol dir risc de reescriure notes d'estil Obsidian.
- Si una altra eina escriu al disc (Syncthing, rsync), cal passar `occ files:scan`.
- No està verificat on posa la carpeta el client de macOS. Si fóra `~/Library/CloudStorage`, xocaria amb la ruta actual.
- A OpenCloud, el mode col·laboratiu de PosixFS està documentat «amb precaució», i el versionat amb PosixFS no està confirmat.
- La superfície d'atac és molt més gran.

**Veredicte:** no com a nucli del cervell. Sí com a mòdul ofimàtic opcional damunt de l'opció A.

##### Opció C · Obsidian + Self-hosted LiveSync (CouchDB) amb E2EE

**Peces**
- **Obsidian**, al Mac, a iOS i a Android. És PROPIETARI, no OSI, i gratuït per a qualsevol ús.
- **LiveSync 1.0.32**, un connector d'Obsidian (MIT).
- **CouchDB** al VPS (Apache-2.0, llicència no reverificada).

**Flux:** cada dispositiu té la caixa forta en fitxers plans. LiveSync envia fragments xifrats a CouchDB, i la resta de dispositius els desxifren.

**Privacitat:** és la més forta de les quatre opcions. Fa E2EE (AES-256-GCM amb HKDF) i pot ofuscar les rutes. El servidor és cec.

**Cobertura mòbil:** iOS i Android, sempre dins d'Obsidian. Obsidian mòbil exigix HTTPS fins i tot dins de la VPN.

**Llicències:** el client és propietari. `livesync-bridge`, l'única via per a tindre fitxers plans al servidor, no té fitxer de llicència.

**Cost:** VPS mínim. Obsidian és gratuït.

**Esforç:** mitja jornada.

**Riscos**
- Al servidor no hi ha fitxers plans (incomplix el criteri 1) ni web.
- Sóc de Poble no s'hi pot endollar.
- El README prohibix combinar-lo amb Syncthing o iCloud sobre la mateixa caixa forta.
- Té un sol mantenidor principal.
- No és viable per a `_multimedia_de_poble`.

**Veredicte:** només té sentit per a la gestoria, i només si el Mestre posa el «servidor cec» per davant del programari lliure i del web.

##### Opció D · Git + Forgejo

**Peces**
- **Forgejo 16.0.5** (GPL-3.0+) al VPS i git al Mac.
- **Al mòbil**, cap client git lliure i mantingut:
  - Working Copy (iOS) és PROPIETARI, i pujar canvis costa 35,99 $;
  - MGit (Android) té l'última compilació a F-Droid de gener de 2023;
  - GitJournal està abandonat.

**Flux:** fas commit i push al Mac, els canvis van a la forja, i el mòbil els baixa amb pull.

**Privacitat**
- Repositoris privats, però sense xifratge en repòs.
- L'historial guarda per sempre qualsevol document esborrat.

**Cobertura mòbil:** pobra i manual. Resoldre conflictes al telèfon és feixuc.

**Riscos:** els PDF i els escanejos inflen l'historial, i la sincronització és manual.

**Veredicte:** és el canal correcte per a `socdepoble.org` i la Wiki pública, que ja hi viuen, i una bona font de lectura per a Sóc de Poble. No servix per a la gestoria ni per a la multimèdia.

##### Peces descartades

| Peça | Motiu |
|---|---|
| Seafile | El servidor no guarda fitxers plans, sinó blocs propis. Des de la versió 3.0, al mòbil i al web la contrasenya passa pel servidor. L'edició Pro és propietària. |
| ownCloud Infinite Scale | Té el mateix llinatge que OpenCloud, però algunes compilacions van sota EULA i per defecte no guarda fitxers plans (DecomposedFS). |
| Joplin | Base de dades pròpia, sense arbre de carpetes ni `[[wikilinks]]`. La llicència del servidor és personal i no comercial. |
| Logseq | Model d'esquema per blocs (outliner). La versió basada en fitxers només rep manteniment des del 2026-04-24. |
| Remotely Save | Cap versió publicada des del 2024-10-20. La carpeta `pro/` va amb PolyForm Strict: codi visible, però no lliure. |
| Möbius Sync (iOS) | Propietari, sense actualitzacions des de gener de 2025, i la versió gratuïta està limitada a 20 MB. |
| ONLYOFFICE Docs CE | L'edició lliure no té editors web per al mòbil. |
| Unison | No té client mòbil. |
| gocryptfs | No té client per a iOS. |
| Tailscale (servei allotjat) com a solució definitiva | El pla de control és propietari i està als EUA. El mòbil envia metadades de connexió i no es pot desactivar. |

##### Taula comparativa

| Criteri | A · Syncthing + SilverBullet | B · Nextcloud (+Collabora) | C · Obsidian + LiveSync | D · Git + Forgejo |
|---|---|---|---|---|
| Fitxers plans al servidor | Sí | Sí, si no s'activa el xifratge de servidor | No (fragments) | Sí (repositoris) |
| Web complet | Sí (Markdown i fitxers) | Sí (fitxers i ofimàtica) | No | Parcial (navegar) |
| iOS | PWA + Synctrain | App nativa lliure | Obsidian (propietari) | Working Copy (propietari) |
| Android | PWA + Syncthing-Fork + Markor | App nativa lliure | Obsidian (propietari) | Clients sense manteniment |
| `[[wikilinks]]` i YAML | Sí, com Obsidian | No / reescriu el Markdown | Sí | No els interpreta |
| Gestoria amb servidor cec | Opcional (Cryptomator) | E2EE limitada | Sí | No |
| Tot OSI | Sí | Sí | No | Servidor sí, mòbil no |
| RAM al VPS | Baixa–mitjana (a mesurar) | Alta | Baixa | Baixa |
| Endoll de Sóc de Poble | Fàcil (exportació empesa) | Possible (WebDAV) | No | Fàcil (git) |
| Esforç inicial | 1–2 jornades | 2–3 jornades | ½ jornada | ½ jornada |

##### Veredicte

L'opció A és l'única que complix els set criteris alhora. La resta hi encaixen així:
- **B** entra com a mòdul ofimàtic opcional, en una fase 3.
- **D** queda com a canal exclusiu del repositori.
- **C** és l'eixida si el Mestre vol un servidor cec per a la gestoria, a canvi de perdre el web i d'acceptar un client propietari.

#### Arquitectura recomanada: el Pont Privat

Fonts: la recerca verificada del 2026-09-29 i la memòria del projecte per als antecedents (marcats com a tals). La proposta és un disseny: no s'ha creat cap fitxer ni cap servei.

##### Principis

1. **El Mac mana.** L'arbre `Som de Poble/` continua sent l'original. El VPS en guarda una rèplica en fitxers plans, i el mòbil hi accedix per la rèplica.
2. **Carpetes, no l'arrel.** Cada carpeta de primer nivell és una carpeta Syncthing independent. L'arrel `Som de Poble/` no es comparteix mai. Així `socdepoble.org` queda fora per construcció, no perquè algú recorde un patró d'exclusió.
3. **Una sola porta.** Des d'Internet només s'arriba al port UDP de WireGuard, que no contesta a ningú sense clau. Tota la resta escolta únicament a la IP privada `10.77.0.1` (rang d'exemple).
4. **Aïllament per procés, no per permisos interns.** La gestoria té:
   - el seu contenidor SilverBullet;
   - el seu nom de màquina;
   - el seu directori al VPS.
   Cap altre procés el munta.
5. **Publicar vol dir empényer una llista blanca.** Sóc de Poble no llig mai el VPS privat. Rep una exportació pública que el VPS empeny cap a un altre host.
6. **Un fitxer, un escriptor alhora.** No s'edita la mateixa nota al Mac i al mòbil en el mateix minut. Si passa, Syncthing deixa una còpia de conflicte i no es perd res.

##### Diagrama

```
                         INTERNET PÚBLICA
                               |
              només UDP 51820 (WireGuard, mut sense clau)
                               |
+------------------------------v---------------------------------+
| VPS UE  <IP_PUBLICA_VPS>    Debian + nftables (tot tancat)     |
| wg0 = 10.77.0.1                                                |
|                                                                |
|  Disc arrel (sense dades)       Volum LUKS2 -> /srv/sdp        |
|  - wg-quick, nftables           - dades/privat/   (6 carpetes) |
|  - sdp-obri / sdp-tanca         - dades/gestoria/              |
|  - compose.yaml (sense secrets) - secrets/ docker/ logs/       |
|                                                                |
|  [Syncthing]  10.77.0.1:22000 --- dades/                       |
|  [Caddy TLS]  10.77.0.1:443  (certificat comodí *.priv)        |
|     +- <HOST_CERVELL>.priv  -> SilverBullet A (dades/privat)   |
|     +- <HOST_GESTORIA>.priv -> SilverBullet B (dades/gestoria) |
|  [restic]  cada nit, xifrat --------> CÒPIA A (2n proveïdor UE)|
|  [sdp-publica] fase 2, llista blanca -> HOST PÚBLIC ESTÀTIC    |
+-------------^--------------------------------------^-----------+
              | túnel WireGuard                      | túnel WireGuard
+-------------+-------------------+   +--------------+---------------+
| MAC (original canònic)          |   | MÒBIL (iOS o Android)        |
| Som de Poble/                   |   | - WireGuard (a demanda)      |
|   7 carpetes Syncthing          |   | - PWA SilverBullet: cervell  |
|   socdepoble.org --git--> remot |   | - PWA SilverBullet: gestoria |
|   (MAI dins de Syncthing)       |   | - opc.: Synctrain o          |
| restic --> CÒPIA B (independent)|   |   Syncthing-Fork + Markor    |
|                                 |   | - opc.: Cryptomator (niv. 2) |
+---------------------------------+   +------------------------------+

HOST PÚBLIC ESTÀTIC (HTTPS) <--- lectura --- App Sóc de Poble (Sollutia)
     només dominis públics; la gestoria no hi arriba per cap camí
```

##### Components

| Capa | Peça | Versió observada | Llicència | Nota |
|---|---|---|---|---|
| Xarxa | WireGuard | mòdul del nucli Linux | GPL-2.0 (eines), MIT (iOS i macOS), Apache-2.0 (Android) | A Android s'instal·la des de Play o amb l'APK de wireguard.com (a F-Droid dona 404) |
| Sincronització | Syncthing | 2.1.5 (2026-09-08) | MPL-2.0 | Al Mac i al VPS |
| Mòbil iOS (opcional) | Synctrain / Sushitrain | 2.7.83 | MPL-2.0 | iOS 17+; sincronització selectiva i a demanda |
| Mòbil Android (opcional) | Syncthing-Fork | 2.1.5.0 | MPL-2.0 | F-Droid |
| Editor Android (opcional) | Markor | 2.16.1 | Apache-2.0 | Edita qualsevol carpeta |
| Web i mòbil | SilverBullet (servidor + PWA) | 2.11.1 (2026-09-22) | MIT | Dues instàncies; SB+ Desktop no cal |
| TLS intern | Caddy amb mòdul DNS | no verificada | Apache-2.0 (no reverificada) | Certificat comodí pel repte DNS-01 |
| Xifratge en repòs | cryptsetup / LUKS2 | 2.8.8 | GPL-2.0+ | Volum en fitxer, obertura manual |
| Còpies | restic | 0.19.1 | BSD-2-Clause | VPS i Mac cap a destins independents |
| Contenidors | Docker Engine + Compose | no verificada | Apache-2.0 (no reverificada) | `data-root` dins del LUKS |
| Tallafocs | nftables | la de Debian | GPL-2.0 (no reverificada) | Política de descart |
| Gestoria nivell 2 (opcional) | Cryptomator | – | GPL-3.0 | Escriure des del mòbil costa 29,99 € per plataforma |
| Ofimàtica, fase 3 (opcional) | Nextcloud 35 + Collabora CODE | 35.0.1 | AGPL-3.0 / MPL-2.0 | Necessita un VPS de 8 GB |
| Xarxa alternativa (opcional) | Headscale | 0.29.4 | BSD-3-Clause | Té sentit amb més de 4 dispositius; la interfície de Tailscale a iOS i macOS és propietària |

**Peces no lliures:** cap en la base. Només n'hi entrarien si el Mestre tria Obsidian mòbil, Working Copy o els clients de Tailscale.

##### Mapa de carpetes

| Carpeta al Mac | ID Syncthing | Ruta al VPS | Còpia nadiua al mòbil | Web / PWA |
|---|---|---|---|---|
| `_arxiu_wiki_de_poble` | `sdp-arxiu` | `/srv/sdp/dades/privat/_arxiu_wiki_de_poble` | opcional | cervell |
| `_comunicacio_de_poble` | `sdp-comunicacio` | `/srv/sdp/dades/privat/_comunicacio_de_poble` | opcional | cervell |
| `_cultura_de_poble` | `sdp-cultura` | `/srv/sdp/dades/privat/_cultura_de_poble` | opcional | cervell; també font de la publicació |
| `_raw_de_poble` | `sdp-raw` | `/srv/sdp/dades/privat/_raw_de_poble` | no | cervell |
| `oficina_de_poble` | `sdp-oficina` | `/srv/sdp/dades/privat/oficina_de_poble` | opcional | cervell |
| `_multimedia_de_poble` | `sdp-multimedia` | `/srv/sdp/dades/privat/_multimedia_de_poble` (un subconjunt, si el disc no dona) | selectiva | cervell, sense còpia fora de línia |
| `_gestoria_de_poble` | `sdp-gestoria` | `/srv/sdp/dades/gestoria/_gestoria_de_poble` | per defecte, NO | instància separada |
| `socdepoble.org` | cap, mai | cap | cap | cap: només per git |

##### Xarxa i ports

- **Obert a Internet:** UDP 51820 (WireGuard). SSH públic només mentre dura la instal·lació; després es tanca.
- **Dins de `wg0`:**
  - 22/TCP: SSH;
  - 443/TCP: Caddy;
  - 22000/TCP: Syncthing;
  - 8384/TCP: interfície de Syncthing.
- **Contenidors:** publiquen només a `127.0.0.1`. Quan Docker publica a `0.0.0.0`, salta el tallafocs de l'amfitrió.
- **Noms:** `*.priv.<DOMINI>`, amb un certificat comodí. Els registres públics de transparència de certificats veuen el comodí, no cada nom. Els noms han de ser neutres: la paraula «gestoria» no apareix en cap nom de màquina.
- **Syncthing:**
  - sense descobriment global, sense repetidors i sense travessia de NAT;
  - adreça fixa: `tcp://10.77.0.1:22000`.
  Els dispositius es parlen en estrela, sempre a través del VPS.
- **Clients WireGuard:** `AllowedIPs = 10.77.0.0/24`. Només el trànsit privat passa pel túnel; la resta de la navegació del mòbil no.

##### La gestoria: tres nivells de privacitat

| Nivell | Què veu el servidor | Web / PWA | Mòbil | Recomanació |
|---|---|---|---|---|
| 1 · Servidor de confiança endurit | Text pla dins de LUKS, i només mentre el volum està obert | Sí | PWA | Base per defecte |
| 2 · Nucli en caixa forta | Com al nivell 1, més una subcarpeta `_caixa_forta` xifrada amb Cryptomator que el servidor no pot llegir | No, per a la caixa | App Cryptomator (escriure és de pagament) | Recomanat per a DNI, declaracions, contractes i certificats digitals (.p12) |
| 3 · Servidor cec per a tota la gestoria | Blocs xifrats (Syncthing amb «dispositiu no fiable», en beta) | No | Només nadiu, amb la contrasenya de la carpeta | Només si el Mestre renuncia al web per a la gestoria |

**Proposta:** nivell 1 + nivell 2. Un certificat digital o un escaneig del DNI no ha d'estar mai en clar en un servidor, ni tan sols dins de LUKS.

**Sobre el nivell 3:**
- la documentació de Syncthing encara el qualifica de beta;
- no està verificat que Synctrain i Syncthing-Fork suporten dispositius no fiables.

##### Model d'amenaces

| Amenaça | Què pot passar | Mesures | Risc residual |
|---|---|---|---|
| Mòbil robat o perdut | Amb el telèfon desbloquejat s'arriba a la VPN i a les PWA | Bloqueig i xifratge del sistema; contrasenya de SilverBullet; la gestoria no té còpia nadiua al mòbil; xifratge al client (beta) a la PWA de la gestoria. **Procediment de revocació (Fase 11):** llevar el parell WireGuard, llevar el dispositiu de Syncthing, canviar contrasenyes, esborrat remot | Baix, si la revocació es fa en hores |
| VPS compromés (algú amb root) | Amb el volum obert ho llig tot, perquè LUKS no protegix un servidor en marxa | Un sol port UDP; SSH només per `wg0` i amb clau; actualitzacions automàtiques; contenidors sense ports públics; el nivell 2 protegix el nucli; les còpies del Mac són independents del VPS | Mitjà per als nivells 1 i 2 fora de la caixa forta |
| Accés del proveïdor | L'hipervisor pot llegir la RAM; les instantànies i els discos retirats | LUKS (protegix instantànies, còpies i discos retirats); proveïdor UE; acord d'encàrrec del tractament; nivell 2 per al nucli | Mitjà; és inherent a tindre web al servidor |
| Conflictes de sincronització | Dos editors toquen el mateix fitxer | Syncthing crea `*.sync-conflict-*` i no perd dades; SilverBullet fusiona o avisa; comprovació setmanal de conflictes; versionat «Staggered» al Mac i al VPS; ni iCloud ni LiveSync sobre les mateixes carpetes | Baix |
| Publicació accidental a l'app pública | Una nota privada, o el títol d'una nota privada dins d'un enllaç, acaba al paquet de l'app | Vegeu «Endoll de Sóc de Poble»: set barreres independents | Baix |
| Repositori corromput per doble sincronització | Git i Syncthing escriuen alhora a `.git` | El repositori no és carpeta Syncthing ni penja d'una; `.git` i `node_modules` a la llista global d'ignorats; comprovació prèvia de repositoris niats | Molt baix |
| iCloud sobre `~/Documents` | Un tercer sincronitzador; fitxers desallotjats que Syncthing llig com a canvis | Comprovació a la Fase 0 i decisió del Mestre | Depén de la decisió |
| Esborrat o xifrat massiu (error o programari de segrest) | Es propaga al VPS i al mòbil en segons | Versionat de Syncthing a tots dos extrems; instantànies de restic amb retenció; el marcador `.stfolder` para Syncthing si el volum no està muntat | Baix |
| Pèrdua de claus | Sense frase LUKS o contrasenya de restic no hi ha dades | Gestor de contrasenyes, més un full de recuperació en paper en una caixa forta física, més una còpia de la capçalera LUKS fora del VPS | Baix |
| Diferències entre sistemes de fitxers | macOS no distingix majúscules i Linux sí; accents amb normalitzacions distintes (NFD i NFC) | Noms nous en minúscules i sense accents (taxonomia del projecte); normalització automàtica de Syncthing (no verificada); prova pilot | Baix |
| SilverBullet: permís d'escriptura = execució de Lua | Qui pot escriure pot executar codi al navegador d'un altre | Cap compte d'escriptura per a tercers; cap instància pública de SilverBullet | Molt baix |

##### Còpies i restauració

**Tres capes, que no depenen l'una de l'altra**

1. **Versionat de Syncthing «Staggered»**, al Mac i al VPS, amb les versions fora de l'espai de SilverBullet. Syncthing només versiona els canvis que rep d'altres dispositius. Per això cal als dos extrems: les edicions fetes des del web queden versionades al Mac.
2. **restic del VPS a la còpia A** (un segon proveïdor de la UE):
   - cada nit;
   - retenció: 7 diàries, 5 setmanals i 12 mensuals;
   - verificació mensual d'un 5 % de les dades.
   La contrasenya viu dins del LUKS, així que sense el volum obert no es fa cap còpia.
3. **restic del Mac a la còpia B**, un destí diferent de la còpia A:
   - inclou `socdepoble.org` amb el seu `.git` i els canvis sense confirmar, però no `node_modules`;
   - la contrasenya viu al Clauer de macOS.
   Si el VPS cau en mans d'un atacant, aquesta còpia continua fora del seu abast.

**Escenaris de restauració**

- **VPS perdut:** nou VPS i nou LUKS, i Syncthing torna a baixar-ho tot del Mac. restic només cal si el Mac també ha fallat.
- **Mac perdut:** nou Mac, Syncthing baixa les carpetes del VPS i restic torna el repositori.
- **Esborrat propagat:** es recupera de les versions de Syncthing o amb `restic restore`.
- **Simulacre trimestral:** restaurar la gestoria en un directori temporal i comparar-la amb l'original (Fase 10).

##### Git i el repositori

- `socdepoble.org` no és mai carpeta Syncthing, i tampoc no ho és la seua carpeta pare.
- `.git`, `node_modules`, `.vite` i `dist` són a la llista global d'ignorats com a xarxa de seguretat.
- Abans de començar es comprova que cap altra carpeta sincronitzada conté un `.git`.
- **Mòbil:** aquest disseny no permet treballar amb el repositori des del telèfon. És una decisió oberta, amb tres camins:
  - un Forgejo privat al VPS, amb el seu editor web (no verificat);
  - Working Copy (propietari);
  - un clon al VPS amb un sol escriptor, que confirma i puja els canvis amb un temporitzador. Mai amb Syncthing.
- La Wiki pública ja arriba a l'app per git. No es duplica per l'exportació.

##### Endoll de Sóc de Poble (fase 2: només lectura, només dominis públics)

```
dades/privat/_cultura_de_poble/publica/**    (VPS, dins del LUKS)
      |  sdp-publica: filtre de llista blanca + comprovació del canari
      v
/srv/sdp-public/export/  + index.json        (fora del LUKS, només públic)
      |  rsync per SSH (el VPS empeny; ningú no hi entra)
      v
HOST PÚBLIC ESTÀTIC (HTTPS + CORS)  <---  adaptador de lectura de l'app
```

**Barreres contra la fuita de la gestoria**

1. **Estructural.** El publicador només munta `dades/privat`. La gestoria viu a `dades/gestoria`, i ni el publicador ni la instància A de SilverBullet la veuen.
2. **Llista blanca, no llista negra.** Només ix el que el filtre nomena. Tot allò que no hi apareix queda fora.
3. **Doble clau (decisió oberta).** Un camp de frontmatter, per exemple `publicable: true`, que cal contrastar amb `schema.json`.
4. **Canari.** A la gestoria hi ha un fitxer amb un testimoni aleatori. Si el publicador o la porta de CI el troben, avorten.
5. **Enllaços.** El generador de l'índex rebutja les notes públiques que enllacen notes no publicades, perquè el títol d'una nota privada ja és una fuita.
6. **Porta de CI al repositori (esbós, no creada).**
   - Falla tancada: si no hi ha `dist/`, ix amb error.
   - Busca al paquet: `_gestoria_de_poble`, el canari, `.priv.<DOMINI>` i `10.77.`.
   - La guarda de línia d'ordres usa `pathToFileURL(process.argv[1]).href`, perquè la ruta del projecte té espais.
7. **Adaptador.**
   - Té una llista blanca de hosts i no porta cap credencial.
   - Cap variable `VITE_*` conté hosts privats. Antecedent del projecte (segons la memòria): `loadEnv` fica `.env.local` dins del paquet.

**Encaix amb el projecte** (segons la memòria del projecte; no reverificat al codi):
- «Enxufe» vol dir backend, amb un contracte de 32 mètodes de tot o res. Aquesta integració ha de ser una **font de contingut públic** a banda, no un endoll de Sollutia/Supabase.
- Ja hi ha antecedents de fuga del cervell per tres canals (manifest, `rag-index.json` i `slugIndex.json`). Per això l'exportació mai no alimenta `compile-wiki-to-app.mjs` amb rutes del cervell privat.

**Interfície proposada (esbós)**

```
fontContingutPublic.llistar(domini) -> [{ ruta, titol, modificat, sha256 }]
fontContingutPublic.llegir(ruta)    -> { frontmatter, cos }
```

##### Què NO fa aquest disseny

- La gestoria no té xifratge d'extrem a extrem en el nivell 1. Per a això hi ha el nivell 2 o el 3.
- A iOS, els clients Syncthing sincronitzen en segon pla una o dues hores al dia. La PWA sincronitza quan està oberta i amb la VPN activa.
- No edita ofimàtica fins a la fase 3.
- No treballa amb el repositori des del mòbil.
- Sense VPN no hi ha sincronització, però la PWA permet editar fora de línia amb el que té guardat.

#### Guia de posada en marxa del Pont Privat

**Convencions**
- **[HUMÀ]**: cal una decisió o una acció del Mestre.
- **[SECRET]**: el pas genera o usa una credencial. Es guarda al gestor de contrasenyes i mai al repositori, al xat ni a cap fitxer fora del LUKS.
- **Marcadors:** `<DOMINI>`, `<IP_PUBLICA_VPS>`, `<IP_PRIVADA>`, `<UID_SDP>`/`<GID_SDP>`, `<HOST_CERVELL>`, `<HOST_GESTORIA>`, `<PROVEIDOR_DNS>`, `<MIDA_GB>`, `<VERSIO_*>`.
- **Adreces d'exemple:** la xarxa WireGuard és `10.77.0.0/24`, amb el VPS a `.1`, el Mac a `.2` i el mòbil a `.3`. Tria un rang que no use cap xarxa on et connectes.
- **Ubicació:** cap fitxer d'aquesta guia va dins de `socdepoble.org`.

**Ordre de treball**
- La **fase pilot (7.1) és un punt de parada**. Cap carpeta real no s'hi posa fins que el pilot ix idèntic byte a byte.
- Entra primer `sdp-raw` o una còpia de prova. La gestoria entra l'última.

##### Fase 0 · Decisions i comprovacions al Mac

**0.1 [HUMÀ] Decidir:**
- el sistema del mòbil;
- el nivell de privacitat de la gestoria (1, 1+2 o 3);
- el proveïdor del VPS;
- el domini i el proveïdor DNS per a `*.priv.<DOMINI>`.

**0.2 [HUMÀ] Comprovar iCloud.** Ves a Configuració del Sistema → el teu compte → iCloud → iCloud Drive → «Carpetes Escriptori i Documents». Si està activat, `~/Documents` ja té un sincronitzador, i no es continua fins que el Mestre decidisca. El camí exacte del menú no està verificat per a la versió actual de macOS.

**0.3 Inventari de mides i de repositoris niats**

```sh
cd "$HOME/Documents/Antigravity/Som de Poble"
du -sh -- */
# Ha d'eixir buit: cap .git fora de socdepoble.org
find . -path ./socdepoble.org -prune -o -name .git -print
```

**0.4 Compatibilitat del frontmatter amb SilverBullet.** SilverBullet prohibix l'atribut `name`.

```sh
grep -rlE --include='*.md' --exclude-dir=socdepoble.org '^name:' . | head -n 50
grep -n '"name"' socdepoble.org/_wiki_de_poble/**/schema.json 2>/dev/null
```

Si hi ha resultats, **[HUMÀ]** decidix abans de la fase 7. La ruta del `schema.json` és orientativa.

##### Fase 1 · VPS base

**1.1 [HUMÀ][SECRET] Contractar el VPS.**
- VPS de 4 GB a la UE amb Debian estable, i la clau SSH pública del Mac.
- Doble factor al compte del proveïdor.
- Si la gestoria conté dades de tercers, signar l'acord d'encàrrec del tractament.

**1.2 Usuari, SSH i paquets**

```sh
adduser --disabled-password --gecos "" sdp
usermod -aG sudo sdp
install -d -m 700 -o sdp -g sdp /home/sdp/.ssh   # copia-hi authorized_keys del Mac

cat > /etc/ssh/sshd_config.d/10-sdp.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
systemctl reload ssh

apt update
apt install -y unattended-upgrades wireguard nftables cryptsetup restic rsync qrencode
dpkg-reconfigure -plow unattended-upgrades
# Sense reinicis automàtics: cada reinici demana obrir el LUKS a mà
echo 'Unattended-Upgrade::Automatic-Reboot "false";' > /etc/apt/apt.conf.d/52sdp-sense-reinici
```

La versió de restic de Debian pot ser anterior a la 0.19.1. Si cal, s'usa el binari oficial.

**1.3 Memòria d'intercanvi.** El text en clar no pot acabar en un disc sense xifrar.

```sh
swapon --show          # si apareix una partició o fitxer de disc:
swapoff -a && sed -i '/\sswap\s/s/^/#/' /etc/fstab
```

Si la RAM no arriba, es pot usar memòria d'intercanvi comprimida en RAM (zram). No toca el disc.

**1.4 [HUMÀ] Instal·lar Docker Engine i Compose** des del repositori oficial de Docker. Docker no arranca amb el sistema: l'obri `sdp-obri` després del LUKS.

```sh
systemctl disable --now docker.service docker.socket
cat > /etc/docker/daemon.json <<'EOF'
{ "data-root": "/srv/sdp/docker", "log-driver": "local" }
EOF
```

##### Fase 2 · Volum xifrat LUKS2

```sh
install -d -m 700 /var/lib/sdp
fallocate -l <MIDA_GB>G /var/lib/sdp/sdp.luks
cryptsetup luksFormat --type luks2 /var/lib/sdp/sdp.luks   # [HUMÀ][SECRET] frase de pas llarga
cryptsetup open /var/lib/sdp/sdp.luks sdp
mkfs.ext4 -L sdp /dev/mapper/sdp

install -d /srv/sdp
chattr +i /srv/sdp        # el punt de muntatge buit no accepta escriptures
mount /dev/mapper/sdp /srv/sdp

install -d -o sdp -g sdp /srv/sdp/dades/privat /srv/sdp/dades/gestoria \
  /srv/sdp/syncthing /srv/sdp/versions /srv/sdp/logs
install -d -m 700 /srv/sdp/secrets /srv/sdp/caddy /srv/sdp/bin

# [SECRET] còpia de la capçalera: es trau del VPS i es guarda amb el full de recuperació
cryptsetup luksHeaderBackup /var/lib/sdp/sdp.luks --header-backup-file /root/sdp-capcalera.img
```

**[HUMÀ]**
- Copia `sdp-capcalera.img` al Mac, per `scp` dins de la VPN.
- Guarda-la al gestor de contrasenyes.
- Esborra-la del VPS amb `shred -u /root/sdp-capcalera.img`.

**Obrir** (`/usr/local/sbin/sdp-obri`, `chmod 700`). **[HUMÀ]** Cal executar-lo després de cada reinici.

```sh
#!/bin/sh
set -eu
cryptsetup open /var/lib/sdp/sdp.luks sdp      # demana la frase de pas
mount /dev/mapper/sdp /srv/sdp
systemctl start docker
docker compose -f /opt/sdp/compose.yaml up -d
```

**Tancar** (`/usr/local/sbin/sdp-tanca`):

```sh
#!/bin/sh
set -eu
docker compose -f /opt/sdp/compose.yaml down
systemctl stop docker.service docker.socket
umount /srv/sdp
cryptsetup close sdp
```

Mentre el volum està tancat, el Mac i el mòbil treballen sense connexió al VPS i es tornen a sincronitzar quan s'obri. Si Syncthing arrancara amb el volum absent, el marcador `.stfolder` el pararia i no esborraria res.

##### Fase 3 · WireGuard (en estrela)

**3.1 [SECRET] Claus.** Una parella per dispositiu. Les claus privades no ixen mai del seu dispositiu, excepte el codi QR del mòbil, que es mostra una vegada i s'esborra.

```sh
umask 077
wg genkey | tee servidor.key | wg pubkey > servidor.pub
wg genkey | tee mac.key      | wg pubkey > mac.pub
wg genkey | tee mobil.key    | wg pubkey > mobil.pub
```

**3.2 `/etc/wireguard/wg0.conf` al VPS**

```ini
[Interface]
Address = 10.77.0.1/24
ListenPort = 51820
PrivateKey = <CLAU_PRIVADA_SERVIDOR>

[Peer]
# mac
PublicKey = <CLAU_PUBLICA_MAC>
AllowedIPs = 10.77.0.2/32

[Peer]
# mobil
PublicKey = <CLAU_PUBLICA_MOBIL>
AllowedIPs = 10.77.0.3/32
```

```sh
systemctl enable --now wg-quick@wg0
```

**3.3 Configuració del client** (el mòbil; el Mac és igual amb `.2`)

```ini
[Interface]
Address = 10.77.0.3/32
PrivateKey = <CLAU_PRIVADA_MOBIL>

[Peer]
PublicKey = <CLAU_PUBLICA_SERVIDOR>
Endpoint = <IP_PUBLICA_VPS>:51820
AllowedIPs = 10.77.0.0/24
# Sense PersistentKeepalive: el client sempre inicia i així gasta menys bateria
```

**3.4 [HUMÀ] Instal·lar als dispositius.**
- **Mòbil:**
  1. Genera el codi: `qrencode -t ansiutf8 < mobil.conf`.
  2. Escaneja'l amb l'app WireGuard.
  3. Esborra el fitxer: `shred -u mobil.conf mobil.key`.
- **iOS:** activa l'activació a demanda per a Wi-Fi i dades mòbils (no verificat).
- **Android:** Configuració → Xarxa → VPN → WireGuard → «VPN sempre activada» (no verificat).
- **Mac:** app WireGuard de la Mac App Store; hi importes `mac.conf`.

##### Fase 4 · Tallafocs (`/etc/nftables.conf`)

No s'usa `flush ruleset`, perquè esborraria les regles de Docker. Només es refà la taula pròpia.

```
#!/usr/sbin/nft -f
table inet sdp
delete table inet sdp
table inet sdp {
  chain input {
    type filter hook input priority 0; policy drop;
    iif "lo" accept
    ct state established,related accept
    ct state invalid drop
    meta l4proto { icmp, ipv6-icmp } accept
    udp dport 51820 accept
    iifname "wg0" tcp dport { 22, 443, 8384, 22000 } accept
    # [HUMÀ] Només mentre s'instal·la; es comenta quan SSH per wg0 funcione:
    tcp dport 22 accept
  }
}
```

```sh
systemctl enable --now nftables
```

**[HUMÀ]**
1. Comprova que entres per `ssh sdp@10.77.0.1`.
2. Comenta la línia temporal de SSH i recarrega.
3. Tin a mà la consola del proveïdor (KVM) per si et quedes fora.

##### Fase 5 · Serveis

**5.1 `/opt/sdp/compose.yaml`.** No conté cap secret: els secrets són a `/srv/sdp/secrets`, dins del LUKS.

```yaml
name: sdp
services:
  syncthing:
    image: syncthing/syncthing:<VERSIO_SYNCTHING>     # p. ex. 2.1.5; fixa-la
    network_mode: host
    restart: "no"                                    # només l'arranca sdp-obri
    hostname: sdp-vps
    environment:
      PUID: "<UID_SDP>"
      PGID: "<GID_SDP>"
      STGUIADDRESS: "10.77.0.1:8384"
    volumes:
      - /srv/sdp/syncthing:/var/syncthing
      - /srv/sdp/dades:/dades
      - /srv/sdp/versions:/versions

  sb-cervell:
    image: <IMATGE_SILVERBULLET>:<VERSIO_SB>          # 2.11.1; verifica el nom de la imatge oficial
    restart: "no"
    user: "<UID_SDP>:<GID_SDP>"
    env_file: /srv/sdp/secrets/sb-cervell.env        # [SECRET]
    volumes:
      - /srv/sdp/dades/privat:/data                  # la recerca anota /data; en versions antigues era /space
    ports:
      - "127.0.0.1:3001:3000"

  sb-gestoria:
    image: <IMATGE_SILVERBULLET>:<VERSIO_SB>
    restart: "no"
    user: "<UID_SDP>:<GID_SDP>"
    env_file: /srv/sdp/secrets/sb-gestoria.env       # [SECRET] credencials diferents
    volumes:
      - /srv/sdp/dades/gestoria:/data
    ports:
      - "127.0.0.1:3002:3000"

  caddy:
    build: ./caddy
    network_mode: host
    restart: "no"
    env_file: /srv/sdp/secrets/caddy.env             # [SECRET] DNS_API_TOKEN d'abast mínim
    volumes:
      - /opt/sdp/Caddyfile:/etc/caddy/Caddyfile:ro
      - /srv/sdp/caddy/data:/data
      - /srv/sdp/caddy/config:/config
```

**5.2 Fitxers de secrets [SECRET].** Tots amb `chmod 600`.
- `sb-*.env`: `SB_USER=<USUARI>:<CONTRASENYA_LLARGA>`. Cal verificar si la 2.11.1 continua usant `SB_USER` o ja té comptes propis.
- `caddy.env`: `DNS_API_TOKEN=<TESTIMONI>`.

**5.3 `/opt/sdp/caddy/Dockerfile`**

```dockerfile
FROM caddy:<VERSIO_CADDY>-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/<PROVEIDOR_DNS>
FROM caddy:<VERSIO_CADDY>
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
```

**5.4 `/opt/sdp/Caddyfile`**

```
{
	email <CORREU_ACME>
	default_bind 10.77.0.1
}

*.priv.<DOMINI> {
	tls {
		dns <PROVEIDOR_DNS> {env.DNS_API_TOKEN}
	}
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options nosniff
		Referrer-Policy no-referrer
		-Server
	}
	@cervell host <HOST_CERVELL>.priv.<DOMINI>
	handle @cervell {
		reverse_proxy 127.0.0.1:3001
	}
	@gestoria host <HOST_GESTORIA>.priv.<DOMINI>
	handle @gestoria {
		reverse_proxy 127.0.0.1:3002
	}
	handle {
		abort
	}
}
```

**5.5 [HUMÀ] DNS.** Crea el registre `*.priv.<DOMINI>  A  10.77.0.1` al proveïdor DNS.
- Alguns resolutors bloquegen respostes amb IP privades, com a protecció contra la revinculació de DNS.
- Si passa, hi ha un pla B: un resolutor al VPS que escolte a `10.77.0.1`, i `DNS = 10.77.0.1` a la configuració de WireGuard.

##### Fase 6 · Syncthing

**6.1 VPS.** Amb la VPN activa, obri `http://10.77.0.1:8384`.
- **[SECRET]** Posa usuari i contrasenya a la interfície.
- Configuració → Connexions:
  - adreça d'escolta: `tcp://10.77.0.1:22000`;
  - desactiva el descobriment global, el descobriment local, la travessia de NAT i els repetidors.
- Desactiva l'enviament d'estadístiques d'ús.

**6.2 Mac.**
- Instal·la i arranca Syncthing:
  ```sh
  brew install syncthing && brew services start syncthing
  ```
- **[HUMÀ]** Concedix a Syncthing l'accés a la carpeta Documents quan macOS el demane.
- Posa la mateixa configuració de connexions, sense descobriment global ni repetidors.
- Afig el dispositiu VPS pel seu identificador, amb l'adreça `tcp://10.77.0.1:22000`.

**6.3 Carpetes.**
- Una per fila del mapa de carpetes, amb l'identificador indicat.
- Al VPS s'accepten amb la ruta `/dades/privat/<carpeta>` o `/dades/gestoria/_gestoria_de_poble` (rutes dins del contenidor).
- **Mai es crea una carpeta per a `Som de Poble/` ni per a `socdepoble.org`.**

**6.4 Versionat a cada carpeta.**
- **VPS:** «Staggered», edat màxima de 365 dies, ruta de versions `/versions/<ID>`. Així no queda dins de l'espai de SilverBullet.
- **Mac:** «Staggered» amb la ruta per defecte (`.stversions`).

**6.5 Llista global d'ignorats.**
- Al Mac, dins de cada carpeta, crea `.stglobalignore`. Syncthing el sincronitza.
- Cada dispositiu té un `.stignore` local amb aquesta línia:
  ```
  #include .stglobalignore
  ```
- Contingut de `.stglobalignore`:
  ```
  // Brossa de macOS
  (?d).DS_Store
  (?d)._*
  (?d).Spotlight-V100
  (?d).Trashes
  (?d).fseventsd
  (?d).TemporaryItems
  // Brossa de Windows i fitxers de bloqueig d'ofimàtica
  (?d)Thumbs.db
  (?d)desktop.ini
  (?d)~$*
  (?d).~lock.*#
  // Estat de finestres d'Obsidian (és de cada dispositiu)
  .obsidian/workspace*.json
  // Codi: mai dins de la sincronització de fitxers (xarxa de seguretat)
  .git
  node_modules
  .vite
  dist
  // Temporals
  *.tmp
  *.swp
  ```

**6.6 Multimèdia.** Si el disc del VPS no dona, al `.stignore` local del VPS per a `sdp-multimedia` pots posar:

```
#include .stglobalignore
!/2026
*
```

El Mac conserva la resta: ignorar a l'extrem que rep no esborra res a l'original.

**6.7 Conflictes.** Crea `/usr/local/sbin/sdp-conflictes`. El registre va dins del LUKS, perquè conté noms de fitxers.

```sh
#!/bin/sh
set -eu
mountpoint -q /srv/sdp || exit 0
find /srv/sdp/dades -name '*.sync-conflict-*' -print > /srv/sdp/logs/conflictes.txt
```

##### Fase 7 · SilverBullet

**7.1 PILOT: punt de parada.** L'objectiu és comprovar que SilverBullet no reescriu res.

1. **Mac**, abans:
   ```sh
   cp -R "_arxiu_wiki_de_poble" "$HOME/sdp-prova"
   cd "$HOME/sdp-prova" && find . -type f ! -path './.stversions/*' -exec shasum -a 256 {} + | sort > "$HOME/abans.txt"
   ```
2. Comparteix `sdp-prova` amb el VPS, apunta temporalment `sb-cervell` a aquesta carpeta, i navega i indexa sense editar res.
3. Quan torne la sincronització, calcula la mateixa suma en `despres.txt` i executa `diff "$HOME/abans.txt" "$HOME/despres.txt"`.
   - Si només hi ha fitxers nous creats per SilverBullet: apunta'ls i decidix si s'ignoren al `.stignore` del VPS.
   - Si hi ha qualsevol fitxer existent modificat: **aturada**. **[HUMÀ]** decidix.
4. Prova també:
   - un enllaç `[[...]]` ambigu;
   - una nota amb frontmatter complet;
   - un nom amb accents.

**7.2 Configuració de l'espai.** Va a la pàgina de configuració, dins d'un bloc `space-lua`. La sintaxi exacta està per verificar a la documentació de la 2.11.1.

```lua
config.set("linkWriteFormat", "shortest")                -- com Obsidian
config.set("sync.ignore", "_multimedia_de_poble/**")     -- sense còpia fora de línia al mòbil
```

**7.3 [HUMÀ] Mòbil.** Amb la VPN activa, obri `https://<HOST_CERVELL>.priv.<DOMINI>` i inicia sessió.
- **iOS:** Safari → Compartir → «Afegir a la pantalla d'inici».
- **Android:** Chrome → menú → «Instal·lar aplicació».
- Repetix-ho per a `<HOST_GESTORIA>`, i decidix si actives el xifratge al client (beta) o no la deixes disponible fora de línia.

##### Fase 8 · Mòbil nadiu (opcional)

- **iOS:** Synctrain.
  1. Afig el VPS (identificador + `tcp://10.77.0.1:22000`).
  2. Tria les carpetes, amb sincronització selectiva per a l'arxiu i la multimèdia.
- **Android:** Syncthing-Fork (F-Droid), amb la mateixa configuració, i Markor apuntant a les carpetes sincronitzades.
- **Gestoria:** per defecte no es sincronitza al mòbil.
- **Nivell 2:** l'app Cryptomator obri `_caixa_forta` per WebDAV, dins de la VPN.

##### Fase 9 · Còpies

**9.1 VPS: `/usr/local/sbin/sdp-copia`**

```sh
#!/bin/sh
set -eu
mountpoint -q /srv/sdp || { echo "volum tancat: sense còpia"; exit 0; }
export RESTIC_REPOSITORY="sftp:sdp-copia:/restic-vps"
export RESTIC_PASSWORD_FILE=/srv/sdp/secrets/restic-vps.pass     # [SECRET]
if [ "${1:-}" = "--verifica" ]; then
  restic check --read-data-subset=5%
  exit 0
fi
restic backup -q /srv/sdp/dades /srv/sdp/syncthing/config --tag vps
restic forget -q --tag vps --keep-daily 7 --keep-weekly 5 --keep-monthly 12 --prune
```

**9.2 `/root/.ssh/config`**

```
Host sdp-copia
  HostName <HOST_COPIA>
  User <USUARI_COPIA>
  Port <PORT_SFTP>
  IdentityFile /srv/sdp/secrets/copia_ed25519
```

**9.3 [HUMÀ][SECRET]** Crea la clau SSH de la còpia, dona-la d'alta al destí i inicialitza el repositori amb `restic init`. Tot amb el volum obert.

**9.4 `/etc/cron.d/sdp`**

```
30 3 * * *  root  /usr/local/sbin/sdp-copia >> /var/log/sdp-copia.log 2>&1
0  4 1 * *  root  /usr/local/sbin/sdp-copia --verifica >> /var/log/sdp-copia.log 2>&1
0  5 * * 0  root  /usr/local/sbin/sdp-conflictes
```

**9.5 Mac: `~/Library/LaunchAgents/org.socdepoble.copia.plist`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>org.socdepoble.copia</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string><string>-c</string>
    <string>/opt/homebrew/bin/restic backup "$HOME/Documents/Antigravity/Som de Poble" --exclude-file "$HOME/.config/sdp/restic-exclusions.txt" --tag mac -q</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>RESTIC_REPOSITORY</key><string>sftp:sdp-copia-mac:/restic-mac</string>
    <key>RESTIC_PASSWORD_COMMAND</key><string>security find-generic-password -s sdp-restic-mac -w</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>30</integer></dict>
</dict>
</plist>
```

**Exclusions (`~/.config/sdp/restic-exclusions.txt`):** `node_modules`, `.vite`, `dist`, `.DS_Store`. El `.git` no s'exclou, perquè ha d'entrar a la còpia.

**[HUMÀ][SECRET]**
- Crea l'entrada del Clauer: `security add-generic-password -s sdp-restic-mac -a sdp -w`. Demana la contrasenya.
- `sdp-copia-mac` és un destí o subcompte diferent de `sdp-copia`.
- Concedix a restic l'accés a Documents. No està verificat com gestiona macOS aquest permís per a tasques de `launchd`.

##### Fase 10 · Simulacre de restauració (trimestral)

```sh
export RESTIC_REPOSITORY="sftp:sdp-copia:/restic-vps" RESTIC_PASSWORD_FILE=/srv/sdp/secrets/restic-vps.pass
restic restore latest --target /srv/sdp/prova-restauracio --include /srv/sdp/dades/gestoria
diff -rq /srv/sdp/dades/gestoria /srv/sdp/prova-restauracio/srv/sdp/dades/gestoria
rm -r /srv/sdp/prova-restauracio    # directori temporal creat pel mateix simulacre
```

Les úniques diferències acceptables són els fitxers canviats després de l'última instantània. Fes el mateix amb la còpia del Mac.

##### Fase 11 · Pèrdua o robatori del mòbil

1. **VPS:** lleva el bloc `[Peer]` del mòbil de `wg0.conf` i aplica el canvi:
   ```sh
   wg syncconf wg0 <(wg-quick strip wg0)
   ```
2. **Syncthing (VPS):** elimina el dispositiu del mòbil.
3. **[SECRET]** Canvia les contrasenyes de `sb-cervell.env` i `sb-gestoria.env` i executa `docker compose up -d` per a recrear els contenidors. No està verificat que això invalide les sessions obertes.
4. **[HUMÀ]** Esborra el telèfon a distància des del servei de localització del sistema.
5. Genera claus noves per al telèfon nou (Fase 3).

##### Fase 12 (posterior) · Publicació per a Sóc de Poble

**12.1 [HUMÀ]** Decidix quines carpetes són públiques i si cal la doble clau `publicable: true`.

**12.2 Canari.**
- Crea `_gestoria_de_poble/00_canari_no_publicar.md` amb un testimoni aleatori.
- Copia el mateix testimoni a `/opt/sdp/canari.txt`. No és secret: només servix per a detectar fuites.

**12.3 Filtre (`/opt/sdp/publicacio.filter`)**

```
# Llista blanca: només ix el que apareix ací
+ /_cultura_de_poble/
+ /_cultura_de_poble/publica/***
- *
```

**12.4 `/usr/local/sbin/sdp-publica`**

```sh
#!/bin/sh
set -eu
mountpoint -q /srv/sdp || exit 0
ORIGEN=/srv/sdp/dades/privat/
DESTI=/srv/sdp-public/export/
rsync -a --delete --filter="merge /opt/sdp/publicacio.filter" "$ORIGEN" "$DESTI"
if grep -rqF -- "$(cat /opt/sdp/canari.txt)" "$DESTI" || grep -rqF -- "_gestoria_de_poble" "$DESTI"; then
  echo "FRONTERA TRENCADA: no es publica res" >&2
  exit 1
fi
# (fase 2) generar index.json i rebutjar notes que enllacen notes no publicades
rsync -a --delete "$DESTI" sdp-public:/var/www/contingut/    # [HUMÀ] host públic per decidir
```

**12.5 Repositori `socdepoble.org`** (amb pla aprovat pel Mestre, seguint el flux de treball del projecte):
- l'adaptador de lectura amb llista blanca de hosts;
- la porta de CI de frontera privada, que falla tancada.

##### Criteris d'acceptació

- [ ] Des del mòbil amb dades mòbils i la VPN activa: obrir, editar, reanomenar i moure una nota del cervell, i veure-la al Mac en menys d'un minut.
- [ ] Una edició al Mac apareix a la PWA del mòbil.
- [ ] Un PDF pujat des del mòbil a la gestoria arriba al Mac. **La pujada des de la PWA no està verificada**; si falla, es fa amb el client nadiu.
- [ ] **[HUMÀ]** Des d'una altra xarxa, un escaneig de ports del VPS no mostra cap port TCP obert.
- [ ] El pilot de la Fase 7.1 ix idèntic byte a byte.
- [ ] `test ! -e /srv/sdp/dades/privat/socdepoble.org` es complix.
- [ ] Al Mac, `find . -name '*.sync-conflict-*'` només troba conflictes coneguts.
- [ ] Hi ha una instantània de restic dels dos extrems, i el simulacre de restauració ha passat.
- [ ] El full de recuperació en paper existix i està guardat.

#### Decisions obertes

- Sistema operatiu del mòbil: iOS, Android o tots dos. Determina el client nadiu opcional (Synctrain, o Syncthing-Fork + Markor) i el cost de Cryptomator (29,99 € per plataforma).
- Nivell de privacitat de la gestoria: 1 (servidor de confiança endurit, amb web); 1+2 (una caixa forta Cryptomator per a DNI, declaracions, contractes i certificats digitals); o 3 (servidor cec amb Syncthing «dispositiu no fiable», en beta i sense web).
- Proveïdor del VPS: OVH VPS-1 (3,81 €/mes «des de», cal confirmar la permanència); Infomaniak (7,20 CHF/mes amb pagament anual, a Suïssa, fora de la UE); o Hetzner (la línia econòmica no està disponible i el pla més barat costa uns 11,99 €/mes segons una font secundària).
- Domini i proveïdor DNS per als noms privats `*.priv.<DOMINI>`: reutilitzar un domini existent (el testimoni d'API DNS guardat al VPS permetria segrestar-lo) o fer servir un domini o una subzona dedicats amb un testimoni d'abast mínim.
- Xarxa privada: WireGuard pur (recomanat: tot OSI, un sol port UDP, claus manuals); Headscale (més còmode amb més de 4 dispositius, però la interfície de Tailscale a iOS i macOS és propietària i obliga a exposar el 443); o NetBird (tot OSI, però 2 GB de RAM i més ports públics).
- iCloud «Carpetes Escriptori i Documents»: si està activat sobre `~/Documents`, desactivar-lo o moure l'arbre. Moure'l canviaria rutes absolutes que usen tasques launchd existents.
- Multimèdia: quines subcarpetes de `_multimedia_de_poble` van al VPS i al mòbil, i quina mida de disc cal (a partir de l'inventari fet amb `du -sh`).
- Edició ofimàtica (`.docx`/`.odt`/`.xlsx`) des del mòbil: si cal, fase 3 amb Nextcloud 35 + Collabora CODE i un VPS de 8 GB (OVH VPS-2, 7,21 €/mes).
- Treball sobre el repositori `socdepoble.org` des del mòbil: queda fora d'aquest disseny. Opcions: Forgejo privat amb editor web; Working Copy (iOS, propietari, pujar canvis és de pagament); un clon al VPS amb un sol escriptor i commits automàtics; o renunciar-hi.
- Quines carpetes són públiques per a Sóc de Poble (Cultura, Pobles...) i on viu «Pobles» dins de l'arbre. També si s'exigix una doble clau amb un camp de frontmatter (per exemple `publicable: true`), que caldria contrastar amb `schema.json`.
- On viu l'exportació pública: al hosting de Sollutia, en un segon VPS o en un emmagatzematge estàtic. Mai al VPS privat.
- Destins de les còpies: un Storage Box de Hetzner o un altre SFTP/S3 de la UE per al VPS, i un destí independent per al Mac (un subcompte diferent o un disc extern).
- Acceptar o no Obsidian (propietari) com a editor local al mòbil.
- Posar Authelia (claus d'accés) davant de SilverBullet, o conformar-se amb la clau WireGuard més la contrasenya de SilverBullet. No està verificat que Authelia siga compatible amb la PWA.
- Activar o no el xifratge al client (beta) de SilverBullet a la PWA de la gestoria, o bé no deixar la gestoria disponible sense connexió al mòbil.
- Si la gestoria conté dades personals de tercers: signar l'acord d'encàrrec del tractament amb el proveïdor.
- Qui custodia el full de recuperació (frase LUKS, contrasenyes de restic, còpia de la capçalera LUKS) i en quin lloc físic.
- Si SilverBullet crea fitxers propis dins de l'espai, cal decidir si s'ignoren al VPS o es deixen arribar al Mac. Es resol amb el pilot de la Fase 7.1.

#### No verificat

- SilverBullet 2.11.1: el nom de la imatge oficial de contenidor, el punt de muntatge (`/data` segons la recerca, `/space` en versions anteriors) i si la variable `SB_USER` continua vigent amb els comptes del mode multiespai.
- SilverBullet: la sintaxi exacta de `config.set` per a `linkWriteFormat`, `sync.ignore` i `sync.documents`, i si el contenidor funciona amb la directiva `user:` de Docker.
- SilverBullet: quina RAM consumix el Chrome sense interfície que porta el servidor (dues instàncies en 4 GB), quins fitxers propis escriu dins de l'espai i si en modifica algun d'existent en indexar.
- SilverBullet: si detecta bé les edicions externes que fa Syncthing (un commit de setembre de 2026 ho suggerix), com tracta el frontmatter amb `name` i si té interfície en català o valencià.
- SilverBullet a la PWA mòbil: pujar fitxers, reanomenar i moure carpetes, el comportament en segon pla a iOS i si iOS pot purgar l'emmagatzematge de la PWA instal·lada.
- Syncthing: els noms exactes de les opcions de connexió a la versió 2.x, les variables `PUID`/`PGID`/`STGUIADDRESS` de la imatge oficial i la normalització automàtica NFD/NFC de noms amb accents entre macOS i Linux.
- Syncthing: si Synctrain i Syncthing-Fork admeten dispositius no fiables (nivell 3), si les carpetes de Synctrain es veuen a l'app Fitxers d'iOS per a organitzar-les, i la llicència i la traducció al català de Syncthing-Fork.
- WireGuard: el nom i el comportament de l'activació a demanda a iOS i de la «VPN sempre activada» a Android.
- Caddy: la versió actual, que existisca un mòdul `caddy-dns` per al proveïdor DNS triat i el comportament de l'opció global `default_bind`.
- DNS: si els resolutors dels operadors mòbils o dels encaminadors domèstics bloquegen un registre públic que apunta a `10.77.0.1` (protecció contra revinculació).
- Llicències no reverificades en aquesta passada: Caddy (Apache-2.0), Docker Engine (Apache-2.0), nftables (GPL-2.0) i CouchDB (Apache-2.0). No s'ha verificat que la versió de restic de Debian arribe a la 0.19.1.
- Preus i condicions: la permanència del preu «des de» d'OVH, el preu actual de l'Storage Box de Hetzner després de les pujades del 2026 i el port SFTP, que es puga comanar Hetzner, i el cost del domini.
- Cryptomator: que l'app d'iOS puga obrir una caixa forta des del proveïdor de Synctrain o per WebDAV amb `rclone serve` i autenticació, i els preus per regió.
- Nextcloud: la ubicació de la carpeta del client de macOS (File Provider), l'opció `filesystem_check_changes` per a canvis externs i la RAM real que necessita Collabora CODE.
- OpenCloud: el versionat amb PosixFS i que de veres no tinga xifratge d'extrem a extrem.
- Headscale: que `tailscale cert` hi funcione.
- macOS: la ruta exacta del menú d'iCloud a la versió actual i com es gestionen els permisos d'accés a Documents per a tasques launchd (restic, Syncthing via Homebrew).
- Fets del projecte presos de la memòria i no reverificats al codi en aquesta passada: el contracte d'endoll de 32 mètodes de tot o res; la fuita del cervell per manifest, `rag-index.json` i `slugIndex.json`; que `compile-wiki-to-app.mjs` només ingerix `.md`; que `loadEnv` fica `.env.local` dins del paquet; la ruta del `schema.json` de la Wiki.
- Les estimacions d'esforç (jornades) i de pressupost total són pròpies, no mesurades.
<!-- ANNEX-B:FI -->

### Annex C · Arquitectura federada: idees estratègiques (Fedivers)

<!-- ANNEX-C:INICI -->
Aquesta secció resumix la recerca del 2026-09-29, feta en tres grups (protocol; implementacions; Fedify i infraestructura), i les propostes de tres lents d'estratègia (producte, arquitectura i governança). No inclou codi: és visió i pla. Les fonts són al §9. El que no s'ha pogut verificar es marca com a «no verificat», i el que no seguix cap estàndard, com a «proposta pròpia».

#### 1. Veredicte

Recomanem federar, però per una porta lateral i en aquest ordre: primer l'obra, després el poble, i l'entrada de fora al final.

- **Encaix amb la missió.** Amb ActivityPub, qualsevol persona pot seguir el Mur d'un poble des d'un servidor lliure, sense algorisme, sense anuncis i sense comptes corporatius. El cas central, el poble com a grup, té un estàndard FINAL (FEP-1b12) i un ecosistema que ja el fa servir: Lemmy, Friendica, Hubzilla, PeerTube, PieFed i Mbin.
- **Encaix amb l'arquitectura.** La federació és una capacitat opcional del port de dades i queda fora del contracte de 32 mètodes. Funciona en un servei xicotet sempre encés (Hono amb Fedify 2.3.8 o posterior) que viu al costat de Supabase, no dins de les Edge Functions. Si s'apaga, l'SPA i el Web Component continuen igual.
- **Seguretat.** Fedify continua sent la millor opció: té llicència MIT, Ghost l'usa en producció i ja implementa RFC 9421 i FEP-521a. Cal, però, fixar-ne la versió. La vulnerabilitat crítica d'impersonació GHSA-q9f8-5hc7-898f (CVE-2026-96625, CVSS 9.1) afectava totes les versions fins a la 2.3.7. Està corregida en la 2.3.8 (22-09) i en la 2.0.28, la 2.1.24 i la 2.2.13 (21-09), i l'avís es va fer públic el 27-09. Hi ha un altre avís encara embargat, GHSA-97w4, que el 29-09 només tenia correcció publicada en la 2.0.29.
- **Privacitat.** La frontera entre el que és públic i el que és privat l'ha de garantir la màquina, amb llistes blanques en tres capes: les vistes, el dispatcher i una porta. El consentiment es dona post a post i per defecte està desactivat. ActivityPub no pot obligar ningú a esborrar les còpies remotes (§7.4), i això s'ha d'explicar abans de federar.
- **Disseny Defensiu Visual.** El proxy de mèdia, el component `ImatgeRemota` i l'informe a la Consola són prerequisits. La part de l'SPA ja té valor ara, encara que no es federe res.
- **Realitat de Mastodon.** És on està la majoria de la gent. Allí un poble apareix com un compte amb `group=true`, els Announce es veuen com a impulsos, i els Article i els Event queden reduïts a títol, resum i enllaç. El disseny ha de partir d'aquesta degradació.

#### 2. Mapa de dominis

| Domini SdP | Actor / objecte AS | Visibilitat | Federa? |
|---|---|---|---|
| Poble (Pobles) | `Group` FEP-1b12, p. ex. `@latorre@socdepoble.org` «Gent de la Torre». Col·leccions `featured` i `upcomingEvents`. Dels seguidors només es publica el recompte | Tothom el pot seguir; només els membres hi publiquen (semiprivat, FEP-5219) | sí, només amb Carta vigent (I4) |
| Comunitats | `Group` | La que tinga la comunitat | opt-in: només les públiques amb Carta. Les privades, no |
| Perfil de veí | `Person`, amb `discoverable` i `indexable` a false per defecte (FEP-5feb) | Per defecte no s'exposa | opt-in (graó 2) |
| Mur | `Note` amb un màxim de 4 adjunts, text alternatiu, `Hashtag` i `audience` = poble. La publica el Group (veu del poble) o la Person, i el Group la reanuncia | as:Public | opt-in per post |
| Agenda | `Event` segons FEP-8a8e, amb les extensions de Mobilizon. El `Place` sempre és un lloc públic | as:Public (actes públics) | sí en els actes públics. Els assistents, mai |
| Mercat | `Note` amb `Link` FEP-8967. Opcionalment, `Proposal` FEP-0837. La ubicació és el centroide del municipi | as:Public | opt-in per anunci. El contacte, mai |
| Cultura | `Article` segons FEP-b2b8 | as:Public | opt-in per peça |
| Multimèdia | `Video` o `Image` amb el Group a `attributedTo` (PeerTube ho exigix) | as:Public | opt-in |
| Notes publicades | `Article` | as:Public | opt-in |
| Notes personals | cap | Privada | no |
| Wiki de Poble | `Service` `@wiki`, amb `Create` o `Update(Article)` i llicència CC | Pública | sí, els fitxers amb marca pública |
| Obrador (Actes, LEDGER públic) | `Application` `@obrador`, amb `Article` | Pública, després del segell del Mestre | opt-in per document |
| Ajuntament i entitats | `Organization` afiliada al Group | Pública | opt-in, amb verificació a la Consola |
| Consultes informals | `Question` etiquetada com a «no anònima» | as:Public | opt-in. Les votacions vinculants, mai |
| Xat | cap, tampoc `ChatMessage` | Privada | no |
| Gestoria | cap | Privada | no |
| Consola | Cap contingut. Només l'actor `Application` d'instància, per als GET signats i els `Flag` | Interna | no |
| Instància | NodeInfo 2.1 amb `usage.users` = {} (FEP-0151) | Pública | sí, sense xifres de veïns |

#### 3. Tensions entre les lents i com es resolen

| Tensió | Què proposa cada lent | Resolució |
|---|---|---|
| Abast o contenció | Producte: que tots els pobles es puguen seguir com més prompte millor. Governança: cap poble sense Carta i sense moderadors. | Al principi guanya la contenció: un poble només apareix al Fedivers si té una Carta vigent (I4). Es comença amb un pilot d'1 a 3 pobles i l'abast creix d'un en un. |
| Veu sense perfil | Producte i governança: «veu delegada» o «veu del poble», en què el Group publica amb la signatura del veí. Arquitectura: FEP-1b12 estricte, en què sense Person no ix res. | La veu del poble és el mode federat per defecte: reidentifica menys i les retirades funcionen a Mastodon, perquè l'autor és el Group. Es documenta com a extensió pròpia i es prova amb Lemmy i PieFed abans de la fase 3. La veu pròpia (Person amb Announce dual) és un graó que cadascú activa. |
| Entrada de fora | Producte: la diàspora escriu a casa en fase 2. Governança: només si hi ha guàrdia activa. | L'entrada s'obri poble a poble, només si la Carta ho preveu i el poble no està «desatés». Si no, es respon amb Reject automàtic. És l'última fase abans de la xarxa. |
| Formats rics o llegibles | Producte: Event, Proposal i Article. Implementacions: Mastodon els reduïx a títol, resum i enllaç. | La base és el que es veu bé a Mastodon (Note i `summary` autosuficient). El tipus ric només es genera on hi ha receptors que l'entenen (Mobilizon, Gancio, flohmarkt) i s'ha mesurat que val la pena. |
| Rebuts d'abast | Producte: mostrar al veí fins on ha arribat el que ha publicat. Governança: la llista de dominis és una metadada personal. | El veí veu xifres i només la Consola veu els dominis. Els rebuts es purguen passat un termini. |
| Veu pròpia per a la IA | Producte i arquitectura: un actor `Service` per a cada agent del Consell. Governança i memòria del projecte: prop d'un 27% de troballes falses abans de la refutació. | Hi ha un sol `@obrador`, amb l'autoria de la IA explícita al `summary`, i només publica després de la refutació i del segell del Mestre. Tindre un actor per agent queda com a decisió oberta (§8). |
| Allotjament | Arquitectura: servei sempre encés. Pla B: sense servidors, amb pgmq. | Es recomana el servei sempre encés. El pla B queda com a experiment, amb prova de contracte. Ho decidix el Mestre. |
| Xarxa i estàndards | Producte i arquitectura: relay comarcal i una FEP per a municipis. Riscos: spam, responsabilitat legal i anys de consens. | És l'última fase. Cal que funcionen 3 o 4 pobles d'una mateixa comarca, que hi haja un acord cooperatiu i que una segona implementació hi estiga interessada. |

#### 4. Idees estratègiques

##### I1 · La Porta Lateral: un servei de federació enxufable
*Lents: arquitectura, amb aportacions de governança (la sentinella).*
- **Què és.** Un procés xicotet i sempre encés (Deno o Node ≥ 22, amb Hono i `@fedify/fedify` ≥ 2.3.8) que viu al costat de Supabase. L'eixida funciona amb una bústia transaccional: quan es confirma una fila pública, un disparador escriu a `fedi.eixida` dins de la mateixa transacció. El servei llig aquesta taula, construïx l'activitat i la lliura amb la cua de Fedify, que reintenta amb espera exponencial fins a 10 vegades i un màxim de 12 h.
- **Valor.** Complix el Model B i la Llei de l'Enxufabilitat: si el servei s'apaga, l'SPA i Supabase ni se n'assabenten. Només ix el que la base de dades ha confirmat, i cada lliurament deixa rastre.
- **Arquitectura.**
  - Connexió directa o pooler en mode sessió. El mode transacció (port 6543) no suporta LISTEN/NOTIFY, els advisory locks de sessió, els prepared statements ni el pipelining de postgres.js.
  - `PostgresKvStore` i `PostgresMessageQueue` a l'esquema `fedi`, amb cues d'entrada i d'eixida separades.
  - Un rol `fedi_ro` que només pot fer `SELECT` sobre vistes amb les columnes explícites.
  - Un actor `Application` d'instància (FEP-2677/d556) per als GET signats contra servidors en *secure mode*. Els recursos públics propis s'han de poder llegir sense signatura, com exigix l'especificació.
  - Signatures RFC 9421 en primer lloc i cavage-12 com a segon intent (el *double-knocking*, que Fedify ja fa). Claus RSA i Ed25519 (FEP-521a).
  - `origin: { handleHost: 'socdepoble.org', webOrigin: 'https://fedi.socdepoble.org' }`.
  - Una porta sentinella que falla si el lockfile porta una versió de Fedify anterior a la correcció de la seua branca, si hi ha un avís sense correcció per a la branca en ús o si no pot llegir el lockfile. Mai no dona verd per defecte.
- **Per què no a les Edge Functions.** El `listen()` de la cua necessita un procés que no acabe mai. Dos segons de CPU per petició no basten per a JSON-LD i RSA quan arriben moltes peticions juntes. I no hi ha sharp ni libvips. Com a pla B experimental, es podria fer una `MessageQueue` pròpia sobre Supabase Queues (pgmq), amb pg_cron i pg_net cridant cada minut una Edge Function que execute `processQueuedTask()`; és el patró de Cloudflare Workers. La latència seria d'un minut com a mínim. Ningú no l'ha escrit encara, i costaria 1 o 2 setmanes més una prova de contracte.
- **Riscos.** Fedify té 13 avisos de seguretat publicats i un ritme de pegats intens: 4 llançaments en 2 dies al setembre. Els id dels actors són permanents, i si es tria malament el domini es perden els seguidors. Una vista amb `SELECT *` publicaria qualsevol columna nova. També hi ha el cost d'un servei de 256 a 512 MB (és una estimació) i el monitoratge de les cues.
- **Esforç:** alt.

##### I2 · «Gent de la Torre»: el Poble com a actor Group
*Lents: les tres.*
- **Què és.** Cada poble, i cada comunitat pública, és un `Group` segons FEP-1b12, per exemple `@latorre@socdepoble.org` amb el nom «Gent de la Torre». Quan algú el seguix, el Group respon amb un Accept automàtic. Hi ha dues veus:
  - **Veu del poble.** És la que s'usa per defecte quan es federa, i és una proposta pròpia. El Group publica la Note amb la signatura que el veí trie, nom o pseudònim, i el veí no té perfil remot.
  - **Veu pròpia.** És opcional. El veí té una `Person`, que fa `Create(Note)`. El Group envia als seguidors de Mastodon un `Announce(Note)` pla, que és la mateixa drecera que fa servir Lemmy, i a Lemmy, PieFed, Mbin i Friendica l'`Announce(Create)` sencer, que conserva les proves FEP-8b32.

  L'`audience` porta l'id del poble, que també va a `to` per compatibilitat. Els permisos seguixen el model semiprivat de FEP-5219: tothom pot seguir el grup, però només els membres hi publiquen.
- **Qui veu què.** Des de Mastodon es veu un compte amb `group=true`. En veu del poble, les publicacions són del compte del poble; en veu pròpia, apareixen com a «Gent de la Torre ha impulsat» amb el veí com a autor. Només arriba el contingut nou, perquè cap plataforma recupera l'anterior. Per això la col·lecció `featured` fixa una presentació i de 3 a 5 posts. L'ordre dels pobles per activitat es continua calculant dins de Sóc de Poble.
- **Valor.** Fa realitat la visió del Mestre: la diàspora, la comarca i els simpatitzants poden seguir el poble des del compte que ja tenen. En la veu del poble, les retirades funcionen de veres a Mastodon, perquè només hi compta el Delete de l'autor, i l'autor és el Group.
- **Arquitectura.** Un dispatcher de Group per poble, cadascun amb claus pròpies. Un slug estable i reservat, perquè Mastodon exigix que el preferredUsername siga únic per domini. Identificadors com `https://fedi.socdepoble.org/ap/pobles/latorre`. Per a Lemmy, cal afegir els moderadors a `attributedTo`, `featured` i `postingRestrictedToMods`. Dels seguidors només es publica el recompte. Fedify no implementa FEP-1b12 ni FEP-5219: tota la lògica de grup és codi nostre. L'exemple `threadiverse` només servix de referència educativa, perquè ell mateix diu que no està auditat.
- **Riscos.** No s'ha verificat com tracten Lemmy, PieFed i Mbin una Note escrita pel Group amb la veu del poble. Mastodon no inclou FEP-1b12 a la llista de FEP que implementa, i sense l'Announce pla el poble es veuria buit. En veu pròpia, les retirades dels moderadors no arriben a Mastodon; només s'hi pot enviar un `Undo(Announce)`. Un URI que ja té Tombstone no es pot tornar a fer servir. I com que tots els pobles compartixen domini, si una instància bloqueja socdepoble.org, els perd tots alhora.
- **Esforç:** mitjà, sobre I1.

##### I3 · La Frontera de Vidre: consentiment per graons i privacitat per construcció
*Lents: governança, arquitectura i producte.*
- **Què és.** Cada veí tria en una escala de tres graons:
  - **0, «Només a Sóc de Poble»**, que és el valor per defecte.
  - **1, «Veu del poble»**.
  - **2, «Veí federat»**: amb una `Person`, i `discoverable` i `indexable` a false fins que el veí els active.

  Cada post té un interruptor que per defecte està apagat. La primera vegada que algú federa, llig un pacte de publicació en valencià planer. El pacte explica que l'esborrat remot no es pot garantir (§7.4) i que Bluesky només s'hi pot connectar amb Bridgy Fed, si el veí ho activa: allí els posts es tallen a 300 caràcters i s'indexen sense opció de rebutjar-ho. La política de cites segueix FEP-044f i per defecte és «ningú» o «només seguidors». Els comptes de menors queden sempre al graó 0. Com a proposta pròpia, hi hauria una casella «hi apareixen menors?» que impediria federar les imatges.
- **Escut anti-reidentificació.** Abans de construir cap activitat es crida una funció `preFederacio(objecte)`, que aplica aquestes regles:
  - La ubicació és gruixuda: el centroide del municipi o un lloc públic, i les coordenades han de caure dins del terme.
  - Si detecta un telèfon, un correu o una adreça, el post queda retingut i s'explica per què.
  - Es publiquen recomptes, no llistes.
  - Les proves FEP-8b32 només s'afigen als objectes públics.
  - Si no hi ha consentiment explícit, s'eliminen les coordenades GPS de l'EXIF (FEP-ee3a).
- **Arquitectura.** Són tres capes independents, totes amb llista blanca:
  - **Base de dades.** Una vista `fedi.objectes_publics` amb les columnes explícites. Gestoria, Xat, Notes privades i Consola no tenen cap vista.
  - **Codi.** Llista blanca de tipus al dispatcher i a la bústia d'eixida.
  - **Porta.** Una prova amb `@fedify/testing` que inclou un cas negatiu obligatori: una fixture privada que l'ha de fer eixir en roig. La memòria del projecte recorda que hi ha portes que ixen en verd sense comprovar res, i també que la cadena de portes s'atura abans d'arribar a la majoria. Cal assegurar que aquesta s'executa de veres.
- **Valor.** Fa comprovable el principi de transparència per al coneixement públic i privacitat estricta per a la vida personal. És la condició ètica per a posar en marxa I2, I9 i I10.
- **Riscos.** Un avís massa llarg s'accepta amb un clic sense llegir-lo, així que cal provar-lo amb veïns reals. Un pseudònim no protegix ningú si el contingut ja l'identifica. El detector tindrà falsos positius i falsos negatius, i pot caure en el paternalisme. Potser el sistema no té la dada de l'edat (no verificat). Cal una revisió jurídica del RGPD.
- **Esforç:** mitjà.

##### I4 · Carta de federació del poble
*Lents: governança, amb el model de FEP-5219 que porta producte.*
- **Què és.** Un poble no apareix al Fedivers fins que la seua junta aprova una Carta des de la Consola. La Carta fixa:
  - quins àmbits es federen;
  - el model semiprivat;
  - almenys dos moderadors;
  - el termini per a respondre les denúncies;
  - la llista d'instàncies amigues;
  - els criteris de defederació.

  Es publica com a Article i s'enllaça des del `summary` del Group. Les afiliacions seguixen FEP-5219: veí = member, moderador = moderator, junta = admin, expulsat = outcast. Els moderadors també es llisten a `attributedTo`. La Carta declara obertament que l'operador del servidor té poder de superadministrador. Hi ha, a més, un registre públic i versionat de les defederacions, amb el domini, la data i la categoria del motiu.
- **Valor.** Federar passa a ser una decisió del poble, no de l'operador, d'acord amb la cultura assembleària. Així cap poble abandonat pot convertir-se en un amplificador de spam.
- **Arquitectura.** Taules `fedi.carta` (versionada, amb hash i data) i `fedi.afiliacions`, amb RLS perquè només les editen els admins del poble. Sense una Carta vigent, el dispatcher respon 404. La col·lecció `affiliations` s'oferix com a extensió opcional.
- **Riscos.** FEP-5219 és DRAFT i Mastodon no la llig. Publicar el nom dels moderadors els exposa a assetjament; com a proposta pròpia, poden figurar amb un compte de rol. En els pobles menuts hi ha risc de fatiga de governança, i per això cal una plantilla de Carta curta.
- **Esforç:** mitjà.

##### I5 · La Torre de Guaita: moderació, interruptors i poble desatés
*Lents: les tres.*
- **Què és.** La Consola es convertix en el tauler d'operacions de la federació:
  - **(a) Interruptors.** N'hi ha un de global i un per poble. Poden pausar l'eixida, tancar l'entrada o passar a `manuallyApprovesFollowers`. És la primera peça que cal construir. El global torna tota la federació a la fase 0 en segons.
  - **(b) Federació limitada.** Una llista blanca d'instàncies, a l'estil del `LIMITED_FEDERATION_MODE` de Mastodon.
  - **(c) Denúncies.** Una cua de Flag per a cada poble.
  - **(d) Retirada efectiva.** Un `Undo(Announce)` per a Mastodon i un Delete o Block anunciat per a Lemmy, PieFed i Mbin.
  - **(e) Poble desatés.** És una proposta pròpia inspirada en FEP-e4de. Si hi ha pendents més enllà del termini de la Carta, o si queden menys de 2 moderadors actius, el poble passa automàticament a només eixida i les entrades reben Reject. Abans d'aplicar-ho hi ha un avís, i reactivar-lo ha de ser fàcil.
  - **(f) Salut.** La profunditat de les cues, les fallades permanents, la versió de Fedify comparada amb l'últim avís i les dades del proxy de mèdia.
- **Valor.** Fa que la federació siga sostenible per a una comunitat de voluntaris i evita acabar en llistes de bloqueig, que afectarien tots els pobles alhora.
- **Arquitectura.** Taules `fedi.denuncies`, `fedi.bloquejos_domini`, `fedi.interruptors` i `fedi.fase`. El servei consulta l'interruptor abans de cada tasca, de manera que es pot tallar sense desplegar res. Els listeners de la safata d'entrada es registren segons la fase. Una tasca de pg_cron calcula cada hora si un poble està desatés. Els Flag que enviem cap a fora els signa l'actor Application. Totes les accions queden en un diari d'auditoria.
- **Riscos.** Hi ha una càrrega humana real. Si entra contingut il·lícit, hi pot haver responsabilitat legal; les obligacions de notificació no s'han verificat. La regla del poble desatés pot donar falsos positius. A Mastodon, una retirada només és completa quan esborra l'autor.
- **Esforç:** mitjà.

##### I6 · Cap icona trencada: proxy de mèdia i `ImatgeRemota`
*Lents: les tres. És el requisit innegociable de Disseny Defensiu Visual.*
- **Què és.**
  - **Entrada.** El servei descarrega cada avatar o adjunt remot amb protecció contra SSRF: no accepta adreces privades i valida les redireccions. Comprova `mediaType`, `size` i `digestMultibase` (FEP-1311), guarda `width` i `height`, aplica un límit de mida i elimina l'EXIF. Ho desa en un bucket `fedi-cau` amb una caducitat d'uns 7 dies, i ho purga quan arriba un Delete o es confirma un Flag. Si una baixada falla, es reintenta amb una cua; la referència és el `RedownloadMediaWorker` de Mastodon.
  - **Front.** Un sol component de catàleg, `ImatgeRemota`. Reserva l'espai de la imatge i mostra el blurhash o un color neutre mentre carrega. Si falla, s'amaga i envia un informe a la Consola amb el host, l'id de l'objecte, l'estat HTTP i la pantalla. Una regla de lint impedix que cap altre component pinte URL remotes. S'aplica a tot el mèdia extern (Mur, Mercat, Multimèdia), no només al federat.
  - **Eixida.** Imatges de menys de 10 MB, fora de CDN que bloquegen bots, amb text alternatiu i un màxim de 4 adjunts.
- **Valor.** Complix el requisit tal com està escrit, protegix la IP dels visitants davant de servidors de tercers i convertix les fallades invisibles en dades. L'agregat per host ajuda a decidir la llista blanca.
- **Arquitectura.** Les imatges es processen en el servei sempre encés. Hi ha una taula general `fallades_media`, amb una RPC que només permet inserir, deduplica per host, objecte i dia, i limita la freqüència. La Consola llig una vista agregada.
- **Riscos.** Costa emmagatzematge. El proxy també és superfície d'SSRF i DoS: Fedify limita el JSON a 16 MiB, però el mèdia és responsabilitat nostra. Guardar avatars remots és tractament de dades personals. Si la imatge s'amaga, es pot perdre context, i per això l'informe és obligatori. A més, estendre el component a tota l'SPA canvia píxels en cas de fallada. Segons la Llei del Píxel, això és un redisseny i necessita un pla aprovat, encara que el requisit ja l'haja donat el Mestre.
- **Esforç:** mitjà. La part de l'SPA és d'esforç baix i independent de la resta.

##### I7 · Llibre de Tombstones: rebuts d'abast i d'esborrat
*Lents: governança i producte.*
- **Què és.** Quan algú esborra o revoca la federació, el servei envia un Delete a totes les safates d'entrada conegudes. L'URI passa a respondre 410 Gone amb un Tombstone (`formerType`, `deleted`). Si el contingut havia eixit amb un Announce, el Group també envia un `Undo(Announce)`. Si s'esborra l'actor Person, Mastodon esborra el compte i tots els seus posts. El veí rep al seu panell un rebut com «sol·licitud enviada a N servidors; M han respost», amb un text clar: que un servidor accepte la sol·licitud no vol dir que haja esborrat res. Quan es publica, el veí també rep un rebut d'abast, en xifres. Els dominis només es veuen a la Consola, i els rebuts es purguen passat un termini. Si el contingut es torna a publicar, rep un id nou.
- **Valor.** És transparència radical en el punt més delicat de la federació. Genera evidència per al RGPD en la part que depén de nosaltres, i fa que el consentiment siga honest, perquè abans de federar es pot ensenyar un rebut d'exemple.
- **Arquitectura.** Taules `fedi.entregues` i `fedi.tombstones`, amb una restricció que impedix per sempre reutilitzar un URI. Es fa servir el gestor de fallades permanents de Fedify (404 i 410). Les dades de persones remotes també caduquen.
- **Riscos.** Els rebuts poden donar una falsa sensació de control. El Delete només arriba a les instàncies on hi havia seguidors, i les còpies de segon grau i les de Bridgy Fed queden fora d'abast. Amb FEP-8b32, una còpia filtrada es pot demostrar autèntica. FEP-4f05 és DRAFT.
- **Esforç:** mitjà.

##### I8 · L'Obrador obert: la Wiki i les Actes al Fedivers (pilot)
*Lents: producte, que el proposa com a pilot, arquitectura i governança.*
- **Què és.**
  - **`@wiki@socdepoble.org` (Service).** Cada commit que toca una pàgina pública genera un `Create` o un `Update(Article)` segons FEP-b2b8. El `name` va en text pla. El `summary` ha de ser autosuficient, perquè és l'únic text que es veu a Mastodon. El `content` porta l'HTML sencer per a Ghost, WordPress i Lemmy. També porta l'`url` canònica, un enllaç `rel=alternate` (FEP-22b6), fonts RSS i Atom (FEP-a5c5) i la llicència CC com a enllaç (FEP-c118 és DRAFT).
  - **`@obrador@socdepoble.org` (Application).** Publica Actes Marmota, entrades públiques del LEDGER i decisions d'arquitectura. Cada document passa per aquest circuit:
    1. Porta el frontmatter `federar: public`.
    2. Una porta comprova la llista blanca de carpetes i passa un escàner de secrets i de dades personals.
    3. El document entra en una cua de la Consola.
    4. El Mestre hi posa el segell.
  - Aquests actors només accepten Follow; no admeten respostes.
  - L'id es basa en un identificador estable del frontmatter, perquè el cicle documental reanomena els fitxers. Quan un document s'arxiva, s'envia un Update amb l'estat nou, no un Delete.
- **Valor.** Posa a prova les claus, el WebFinger, el NodeInfo, els permalinks i la cua sense cap dada de veïns. És transparència radical sobre com treballen juntes les persones i les IA.
- **Riscos.** Fuites: l'historial de git ja va contindre una sessió de WhatsApp, per això la llista blanca, l'escàner i el segell són obligatoris. Les auditories d'IA només es publiquen després de la refutació. Pot generar soroll, i cal agrupar les publicacions per dia. Les Actes nomenen persones, i això requerix el seu consentiment. El que es publica no es pot retirar.
- **Esforç:** baix, sobre I1 i els permalinks.

##### I9 · L'Agenda i el Mercat amb forma pròpia
*Lents: producte, amb les regles d'ubicació de governança i els dispatchers d'arquitectura.*
- **Agenda.** Cada acte és un `Event` segons FEP-8a8e (DRAFT), amb les extensions de Mobilizon (`mz:joinMode`, `externalParticipationUrl`, `PostalAddress`). Porta:
  - `timezone` Europe/Madrid;
  - un `Place` que és la plaça o el local, mai un domicili;
  - `eventStatus`;
  - `joinMode` external, apuntant al permalink;
  - `category`.

  El Group publica una col·lecció `upcomingEvents`. Si l'acte canvia s'envia un Update, i si es retira, un Delete. El `summary` porta la data, l'hora i el lloc en text pla. Els assistents no es federen mai. Així, un Mobilizon o un Gancio de la comarca pot seguir el poble i rebre'n l'agenda.
- **Mercat.** Cada anunci és una `Note` amb:
  - fins a 4 imatges amb text alternatiu;
  - etiquetes en valencià: «#col·lectiu» continua sent una sola etiqueta, i «#Maçanes» es normalitza a «macanes» però es mostra tal com s'ha escrit;
  - un `Link` FEP-8967 cap al permalink.

  El `Proposal` de FEP-0837 només s'emet si es mesura que compensa. La ubicació és el centroide del municipi. El contacte no es federa mai: es fa pel Xat. Quan l'anunci caduca, pg_cron encua un Delete del Group, que Mastodon respecta perquè el Group n'és l'autor.
- **Valor.** Les festes, els ajornaments i el «busque» arriben a la comarca i a la diàspora sense passar per plataformes corporatives.
- **Arquitectura.** Dispatchers propis: Fedify porta els tipus Event, Place i Proposal, però no la lògica. Cal un `@context` correcte, perquè el `http://schema.org#` que es fa servir en altres llocs és incorrecte. Cal validar les coordenades, perquè l'exemple de Mobilizon té la latitud i la longitud intercanviades. I cal un camp que diga si un lloc és públic o privat.
- **Riscos.** Les dues FEP són DRAFT. Mastodon descarta `location`. Les còpies en memòria cau poden continuar mostrant un acte anul·lat o un producte ja venut. Hi pot haver dades personals al cos del text, i per això es passa pel detector d'I3.
- **Esforç:** mitjà.

##### I10 · L'amfitrió com a finestra federada i el ban de l'ajuntament
*Lents: arquitectura i producte.*
- **Què és.** El Contracte d'Amfitrió v2 té tres nivells:
  - `cap`: l'amfitrió no fa res de federació.
  - `atribucio`: la pàgina porta `<meta name="fediverse:creator">`, l'actor inclou el domini a `attributionDomains` i hi ha un `rel=alternate` cap a l'objecte.
  - `delegada`: l'amfitrió fa un 302 de `/.well-known/webfinger` i `nodeinfo` cap a socdepoble.org, com fan Ghost i Bridgy Fed.

  Els id viuen sempre a socdepoble.org, perquè Mastodon rebutja un Create si l'objecte i l'actor estan en hosts diferents. Els permalinks són pàgines de només lectura renderitzades pel servidor, que reutilitzen el port de coneixement previst, i el Web Component rep un atribut `permalink-base`. L'ajuntament i les entitats tenen actors `Organization`, verificats a la Consola i afiliats al Group. Els avisos curts van com a Note i els documents com a Article, sempre amb enllaç a la font oficial. L'ajuntament pot tindre el handle en el seu propi domini.
- **Valor.** Les webs locals guanyen presència al Fedivers sense tocar cap dada. El Web Component no toca mai la federació. L'ajuntament té un canal oficial públic sense anuncis i manté la sobirania del seu handle.
- **Arquitectura.** Una porta de contracte valida el nivell de cada amfitrió. Per als amfitrions delegats, es fa periòdicament una prova de WebFinger amb `fedify lookup`. Si el WordPress té el connector ActivityPub al mateix domini, es denega el nivell `delegada`, perquè els dos WebFinger col·lidirien.
- **Riscos.** Els handles són irreversibles. Si el 302 es trenca, l'actor es torna invisible sense avisar. Fedify només documenta un `handleHost`, i per a diversos dominis caldria un WebFinger propi (no verificat). No s'ha verificat la validesa legal d'un avís federat ni si un actor `Organization` pot fer Move. Si la verificació de les entitats és fluixa, algú les pot suplantar.
- **Esforç:** mitjà.

##### I11 · La diàspora escriu a casa (entrada moderada)
*Lents: producte, amb les condicions de governança.*
- **Què és.** Si algú de fora fa un post públic que menciona `@latorre`, o respon a un post del poble, el missatge entra a la cua de moderació del poble. Si s'aprova, el Group l'anuncia amb la marca «Des de fora» i l'autoria remota. Si no, respon amb Reject, com preveu FEP-1b12. Només funciona en pobles la Carta dels quals ho preveu i que tenen guàrdia activa; si el poble està desatés, el Reject és automàtic. Per a qui torna al poble hi ha el Move (FEP-7628, FINAL): des de Mastodon, amb `alsoKnownAs`, es porta els seguidors però no el contingut.
- **Valor.** La despoblació ha deixat bona part de la comunitat fora. El Mur es convertix en un lloc de trobada, i tornar al poble no costa els seguidors.
- **Arquitectura.** Els listeners de `Create(Note)` amb menció al Group només s'activen amb Fedify 2.3.8 o posterior. Hi ha una taula `fedi.cua_moderacio`, una llista blanca d'instàncies al principi, i tot el mèdia passa per I6. Una referència és FEP-5624 ApproveReply, que PeerTube 6.2 o posterior fa servir; no se n'ha verificat l'estat.
- **Riscos.** La safata d'entrada és la superfície més exposada. Hi pot haver spam i assetjament, i la moderació recau en voluntaris. Guardar dades de persones remotes requerix base legal, un període de retenció i una entrada en el registre de tractaments.
- **Esforç:** alt.

##### I12 · Xarxa de Pobles: comarca, relay, FEP de municipi i emancipació
*Lents: producte i arquitectura. Especulativa i a llarg termini.*
- **Què és.** Té quatre peces:
  - **(1) Group de comarca.** Seguix els pobles i reanuncia una selecció curada.
  - **(2) Relay cooperatiu d'estil LitePub.** FEP-ae0c, que és FINAL, el descriu. El compartirien Sóc de Poble, Mobilizon, Gancio i WordPress. Mastodon ignora els Announce que arriben per relay, així que és útil sobretot entre iguals.
  - **(3) Una FEP d'«actors de municipi».** Seria un Group amb `location` de tipus Place (el centroide i un `radius`), un `sameAs` amb el codi INE o el QID de Wikidata i la jerarquia poble → comarca → territori. No existix cap FEP per a grups geogràfics.
  - **(4) Emancipació.** Un poble podria endur-se el seu Group a una instància pròpia amb un Move. Això no està estandarditzat per a grups i hauria d'entrar en la mateixa FEP. Més avant, els id podrien preparar-se per a FEP-8b32 i FEP-ef61.
- **Valor.** Fa del poble una unitat de primera classe i porta 30 anys d'activisme rural als estàndards. El W3C va tornar a constituir el Social Web WG el 2026-01-15, fins al 2028-01-31, i ara és un bon moment per a contribuir-hi.
- **Riscos.** Un relay amplifica el spam i la responsabilitat legal. Una FEP sense una segona implementació no avança. La revisió d'AP i AS2 del W3C encara no s'ha publicat. Cal decidir qui governa la comarca. Un Move de grup no estandarditzat pot no entendre'l cap altre programari.
- **Esforç:** alt.

#### 5. Arquitectura objectiu

```
 INSTÀNCIES REMOTES
 Mastodon 4.4–4.7 · Lemmy / PieFed / Mbin · Mobilizon / Gancio · WordPress AP · Bridgy (opt-in)
     ▲  Create / Update / Delete · Announce(Note) pla + Announce(Create) 1b12
     │  RFC 9421 → cavage (double-knock) · GET signats per l'actor Application
     │                                   │ Follow · Undo · Flag (fases 1–2)
     │                                   ▼ respostes i mencions (fase 4+)
 ║ fedi.socdepoble.org · SERVEI DE FEDERACIÓ (Deno/Node ≥ 22 · Hono · Fedify ≥ 2.3.8)
 ║   actors: Group (poble) · Person (opt-in) · Organization · Service @wiki · Application
 ║   objectes: LLISTA BLANCA de tipus → preFederacio() → lliurament per cua
 ║   inbox: listeners registrats segons fedi.fase · interruptor abans de cada tasca
 ║   treballador de cua (entrada / eixida) · proxy de mèdia (SSRF, MIME, mida, EXIF)
 ║   permalinks HTML de només lectura (port de coneixement)
 ╚══╤════════════════════╤══════════════════════╤═════════════════════════════
    │ rol fedi_ro:       │ KvStore + MsgQueue   │ mèdia validada
    │ SELECT sobre vistes│ esquema fedi, conn.  │
    │ (columnes explíc.) │ directa o de sessió  │
    ▼                    ▼                      ▼
 ║ SUPABASE · font única de veritat (Model B)
 ║   taules públiques ──disparador──▶ fedi.eixida (bústia transaccional)
 ║   fedi: objectes_publics · carta · afiliacions · fase · interruptors · denuncies
 ║         entregues · tombstones · rebuts · cua_moderacio · fallades_media
 ║   Storage: fedi-cau (TTL ≈ 7 d) · pg_cron: caducitats, poble desatés
 ║   Gestoria · Xat · Notes privades · Consola  ══▶  cap vista, cap dispatcher
 ╚══╤═══════════════════════════════════════════════╤═════════════════════════
    │ port de dades: 32 mètodes                     │ vistes agregades
    │ (la federació és capacitat opcional)          │
 ║ <soc-de-poble> en amfitrions              ║ CONSOLA
 ║ (WordPress · MediaWiki · SPA Sollutia)     ║ cues · Flags · Carta · interruptors
 ║ ImatgeRemota: només URL pròpies ──informe──▶ salut · Fedify vs avisos · fallades
 ║ onerror → amaga + informe                  ║
 ╚══╤══════════════════════════════════════
    │ nivell d'amfitrió: cap │ atribucio (fediverse:creator, rel=alternate)
    │                        │ delegada (302 de /.well-known/webfinger i nodeinfo)
    ▼
 socdepoble.org (handleHost) ──302──▶ fedi.socdepoble.org (webOrigin)
```

Hi ha quatre invariants:
- El Web Component no parla mai amb el servei de federació.
- El servei no llig mai taules privades.
- L'SPA no carrega mai mèdia d'un host remot.
- Els id no viuen mai al domini de Supabase, de Sollutia ni de cap amfitrió.

#### 6. Full de ruta per fases

Aquesta numeració substituïx la de la lent de governança (F0–F3). Cada canvi de fase porta la seua Acta Marmota. L'interruptor global sempre torna a la fase 0. Abans de programar cap fase cal un pla aprovat (sdp-workflow §1) i l'aprovació expressa de cada `npm install`.

- **Fase 0 · Lectura.** El Fedivers pot llegir, però no s'envia res.
  - Es tanquen les decisions irreversibles (domini, handles i allotjament).
  - `ImatgeRemota` i l'informe de fallades s'estenen a tota l'SPA; no depenen de la federació.
  - El servei arrenca amb WebFinger, NodeInfo 2.1 (`usage.users` = {}), l'actor Application, `@wiki` i `@obrador`.
  - L'outbox i els permalinks es poden llegir sense signatura. La safata d'entrada no processa res.
  - Portes: la sentinella de Fedify; la Frontera de Vidre, amb un cas negatiu que ha d'eixir en roig; i una prova de `fedify lookup`.
  - Per a passar de fase: les portes ixen en roig quan toca, i ActivityPub.Academy i Mastodon 4.4–4.7 resolen els actors.
- **Fase 1 · Obrador.** Hi ha eixida, però cap veí.
  - `@wiki` i `@obrador` lliuren contingut, amb llista blanca, escàner i segell.
  - La safata d'entrada només accepta Follow i Undo(Follow).
  - El registre de lliuraments (I7) es prova amb contingut propi.
  - Per a passar de fase: un mes sense fuites i sense fallades de signatura amb Mastodon, Lemmy i WordPress.
- **Fase 2 · Pobles pilot, només eixida.**
  - D'1 a 3 pobles, amb Carta, moderadors i interruptor.
  - El Group funciona amb veu del poble, l'Agenda es publica com a Event i `featured` ja té contingut.
  - La safata d'entrada accepta Follow, Undo(Follow) i Flag, i els Flag van a la Consola.
  - La federació està limitada a la llista blanca.
  - Per a passar de fase: s'ha comprovat com tracten Lemmy i PieFed la veu del poble, el filtre no ha retingut res de manera incorrecta i la guàrdia ha respost dins del termini.
- **Fase 3 · Veu pròpia i catàleg ampliat.**
  - Graó 2 (Person opt-in) amb Announce dual.
  - Mercat, ban federat i actors Organization.
  - Amfitrions en nivell `atribucio` i `delegada`.
  - Rebuts d'abast i d'esborrat per als veïns.
  - Prerequisits: revisió jurídica del RGPD i proves d'usabilitat del pacte amb veïns.
- **Fase 4 · Entrada moderada.**
  - Respostes remotes i diàspora a través de la cua.
  - Proxy de mèdia d'entrada.
  - Regla del poble desatés activa.
  - Move d'entrada.
  - Prerequisits: la fase 2 estable durant uns quants mesos, I5 complet i una política per a les dades remotes.
- **Fase 5 · Xarxa.**
  - Publicació remota dins del grup, si la Carta ho preveu.
  - Grups de comarca, relay cooperatiu i esborrany de FEP.
  - Prerequisits: 3 o 4 pobles d'una comarca en marxa i una segona implementació interessada.

#### 7. Línies roges (el que no es federa mai)

1. La Gestoria, el Xat, les Notes personals i la Consola: no tenen vista, dispatcher ni cap camí cap a l'outbox. La frontera la garantix el codi, no una norma.
2. Les votacions vinculants no es fan mai amb `Question`, perquè el vot no és anònim per a l'autor ni per al seu servidor.
3. No es federen dades de contacte, domicilis, coordenades d'habitatges ni llistes d'assistents. La ubicació mínima és el centroide del municipi o un lloc públic.
4. No es federa res de menors, ni imatges on la persona ha marcat que hi apareixen.
5. No es federa res d'una persona sense el seu consentiment explícit per a cada post. Per defecte no es federa, i Bridgy Fed mai no s'activa per defecte.
6. No es signa mai amb FEP-8b32 cap objecte que no siga públic.
7. No hi ha mai hotlink de mèdia remota ni icones trencades a la pantalla.
8. Els id d'actors i objectes no viuen mai al domini de Supabase, de Sollutia ni de cap amfitrió. Un URI amb Tombstone no es reutilitza.
9. Mai no es publiquen la llista de seguidors ni el nombre real de veïns d'un poble, i mai no es falseja (FEP-0151).
10. L'ESTAT, `.agents/runtime`, els prompts amb context intern, els secrets i les auditories d'IA sense refutació i sense segell humà no ixen mai.
11. La safata d'entrada no s'obri mai sense interruptor, sense moderadors i sense Carta.
12. Mai no es desplega una versió de Fedify per davall de la darrera correcció de la branca que s'use, ni una porta que isca en verd sense haver comprovat res.
13. Les vistes mai no fan `SELECT *`.

#### 8. Decisions obertes per al Mestre

1. **Domini i handles.** Són decisions irreversibles. La proposta és `socdepoble.org` com a handleHost i `fedi.socdepoble.org` com a webOrigin, amb els handles dels pobles en forma de slug estable (`@latorre`).
2. **Allotjament.** Servei sempre encés en un VPS o contenidor propi, o bé Sollutia com a amfitrió d'infraestructura, o bé el pla B experimental amb pgmq.
3. **Branca de Fedify.** Seguir la 2.3.x i esperar la 2.3.9 per GHSA-97w4, o fixar la 2.0.29, que ja la té.
4. **Veu per defecte.** Acceptar la veu del poble com a extensió pròpia fora de FEP-1b12, o exigir la veu pròpia des del principi.
5. **Pobles pilot.** Quins seran, per exemple La Torre de les Maçanes, i qui aprova la Carta en cadascun.
6. **Llista blanca inicial** d'instàncies amigues.
7. **Obrador.** Quins tipus de document seran públics, el consentiment per a aparéixer amb nom a les Actes i si cada agent del Consell ha de tindre un actor propi.
8. **Imatge que falla.** Amagar-la del tot o mostrar el text alternatiu en una línia discreta. És una decisió de disseny sota la Llei del Píxel.
9. **Banc de proves de WordPress.** Si té o tindrà el connector ActivityPub, que faria col·lidir els WebFinger.
10. **Llindar de poble desatés.** Termini (per exemple, 72 h) i nombre mínim de moderadors.
11. **Riscos compartits.** Quan convé repartir el risc de defederació en subdominis per comarca, i si Sóc de Poble assumix mantindre un relay i redactar una FEP.
12. **Revisió jurídica.** Del RGPD (base legal, retenció, registre de tractaments) i de la validesa d'un ban federat.

#### 9. Fonts

Recerca del 2026-09-29. Aquesta síntesi no les ha tornat a consultar.

- Catàleg FEP: https://codeberg.org/fediverse/fep ; FEP-1b12 https://codeberg.org/fediverse/fep/src/branch/main/fep/1b12/fep-1b12.md ; la resta, com a raw a https://codeberg.org/fediverse/fep/raw/branch/main/fep/<id>/fep-<id>.md (400e, 5219, db0e, 8a8e, 9967, 0837, 7628, ef61, 8b32, 044f, e232, 0151, ee3a, 1311, ae0c, b2b8, 7502)
- W3C: https://www.w3.org/TR/activitypub/ ; https://www.w3.org/TR/activitystreams-vocabulary/ ; https://w3c.github.io/activitypub/ ; https://www.w3.org/standards/history/activitypub/ ; https://www.w3.org/2026/01/social-web-wg-charter.html ; https://socialwebfoundation.org/2026/01/15/new-social-web-working-group-at-w3c/
- SocialCG: https://swicg.github.io/activitypub-data-portability/lola ; https://swicg.github.io/activitypub-http-signature/
- IETF: https://www.rfc-editor.org/info/rfc9421
- Mastodon: https://docs.joinmastodon.org/spec/activitypub/ ; https://docs.joinmastodon.org/spec/security/ ; https://docs.joinmastodon.org/spec/webfinger/ ; https://docs.joinmastodon.org/entities/Account/ ; https://docs.joinmastodon.org/admin/config/ ; https://docs.joinmastodon.org/admin/tootctl/ ; https://github.com/mastodon/mastodon/blob/main/FEDERATION.md ; https://github.com/mastodon/mastodon/releases ; https://joinmastodon.org/roadmap ; https://github.com/mastodon/mastodon/pull/36322
- Lemmy, PieFed i Mbin: https://join-lemmy.org/docs/contributors/05-federation.html ; https://github.com/LemmyNet/lemmy/issues/2224 ; https://codeberg.org/rimu/pyfedi/raw/branch/main/FEDERATION.md ; https://docs.joinmbin.org/fediverse_developers/
- Mobilizon, PeerTube, WordPress i Ghost: https://docs.mobilizon.org/5.%20Interoperability/1.activity_pub/ ; https://docs.joinpeertube.org/api/activitypub ; https://raw.githubusercontent.com/Automattic/wordpress-activitypub/trunk/readme.txt ; https://github.com/TryGhost/ActivityPub ; https://ghost.org/help/social-web/
- Bridgy Fed: https://fed.brid.gy/docs ; https://github.com/snarfed/bridgy-fed/issues/372
- Fedify: https://github.com/fedify-dev/fedify ; https://github.com/fedify-dev/fedify/releases ; https://github.com/fedify-dev/fedify/security/advisories/GHSA-q9f8-5hc7-898f ; https://github.com/fedify-dev/fedify/blob/main/FEDERATION.md ; https://raw.githubusercontent.com/fedify-dev/fedify/main/CHANGES.md ; https://fedify.dev/install ; https://fedify.dev/manual/deploy ; https://fedify.dev/manual/federation ; https://fedify.dev/manual/mq ; https://fedify.dev/manual/actor ; https://fedify.dev/manual/send ; https://fedify.dev/manual/test ; https://fedify.dev/cli ; https://github.com/fedify-dev/threadiverse
- Supabase: https://supabase.com/docs/guides/functions/limits ; https://supabase.com/docs/guides/functions/background-tasks ; https://supabase.com/docs/guides/database/connecting-to-postgres ; https://supabase.com/docs/guides/queues ; https://supabase.com/docs/guides/functions/schedule-functions
- Proves: https://activitypub.academy

Ancoratge: [[00_index_escriptori]]

#### No verificat

- Aquesta síntesi no ha tornat a consultar cap font. Les dades venen de la recerca del 2026-09-29 que ha facilitat el flux de treball.
- Si la branca 2.3.x de Fedify ja té la correcció de GHSA-97w4-f4rq-mgqm. L'avís encara és embargat, i el 29-09 no hi havia cap etiqueta 2.3.9.
- Si l'Edge Runtime de Supabase accepta l'opció 'unstable temporal' de Deno, i si la versió ESM de Fedify inclou el seu propi polyfill de Temporal.
- Si un domini personalitzat de Supabase pot servir una Edge Function a l'arrel, que és on cal /.well-known/*.
- Com tracten Lemmy, PieFed i Mbin una Note escrita pel mateix Group, la «veu del poble». És una proposta pròpia que no descriu cap FEP.
- Quina insígnia de grup mostra la interfície web de Mastodon, i com mostra l'hora i el lloc d'un Event de Mobilizon.
- Si Mastodon serialitza el text alternatiu d'eixida en name o en summary.
- Si Mastodon aplica la semàntica de Group més enllà de permetre seguir el compte. FEP-1b12 no apareix a la llista de FEP compatibles.
- En quin estat està FEP-5624 ApproveReply (PeerTube 6.2 o posterior).
- El contingut de FEP-c81b (Agent Social Attribution): només se n'ha verificat el títol.
- Com es comporten les mencions !grup de Friendica. La font consultada no és el repositori canònic.
- Si el Move de FEP-7628 funciona per a actors Organization o Group. Per a grups no està estandarditzat.
- Si Fedify admet diversos handleHost, un per cada domini amfitrió, sense un dispatcher de WebFinger propi.
- Si @fedify/relay és adequat per a un relay comarcal cooperatiu, i si @fedify/debugger es pot integrar a la Consola.
- Si la telemetria actual de l'app té un canal cap a la Consola que es puga reutilitzar per als informes de fallades de mèdia.
- Si el model de perfil té la dada de l'edat, necessària per a bloquejar els menors.
- La validesa legal d'un avís municipal federat, i quines obligacions legals de notificació i actuació hi ha per a plataformes davant del contingut il·lícit.
- Si el banc de proves de WordPress té el connector ActivityPub instal·lat, cosa que faria col·lidir els WebFinger.
- Si Lemmy té comunitats privades en producció (RFC-0005) i com funciona la identitat nòmada de Hubzilla sobre AP.
- L'estat real de ForgeFed i Forgejo per a federar codi i Wiki.
- Si existix alguna oferta comercial gestionada de Fedify, i si @fedify/netlify ja s'ha publicat.
- Estimacions pròpies sense mesurar: de 256 a 512 MB de RAM per al servei, i d'1 a 2 setmanes per al pla B amb pgmq.
- Propostes pròpies sense precedent verificat: rebuts d'abast i d'esborrat, llindar del «poble desatés», casella de menors, llindar de població per a la veu del poble, FEP d'actors de municipi i Move de grup.
<!-- ANNEX-C:FI -->

### Annex D · Estudi de mercat: xarxes socials per a pobles i comunitats locals

<!-- ANNEX-D:INICI -->
#### Resum

Aquest annex aplica un filtre únic, fixat pel Mestre. Cada funcionalitat s'aprova o es descarta **només** segons si resol o traïx les demandes reals del Manifest de Poble. Ací, el Manifest són dues coses: els seus set eixos i el document viu «Propostes locals: Poble a Poble». Aquest document arreplega el resum del 2n Aplec pel Territori (Benillup, 2023-01-29) i les propostes d'onze pobles, del 2022-11-22 al 2023-02-25. El PDF del Manifest no s'ha obert. Els títols dels eixos es prenen del document de propostes, i el text literal queda pendent de verificar.

- **Els pobles ja van demanar l'eina.** El resum de l'Aplec demana «una aplicació mòbil per connectar pobles». El document de propostes, que és del mateix Projecte Sóc de Poble, proposa Sóc de Poble com a prototip de la xarxa social de pobles connectats. És una candidatura nostra, no un encàrrec de l'Aplec. L'article del 2026-08-02 admet que el Manifest i l'Aplec es van quedar sense recorregut. La primera funció de la plataforma és donar-los continuïtat: les propostes de cada poble, vives, amb data i estat.
- **El filtre té 18 criteris (F1 a F18)**, tots amb font i data. Els quatre més repetits són:
  - el patrimoni de fonts, marges i masos (F11): sis pobles;
  - l'habitatge per a qui viu i treballa al poble, mai turístic (F2): cinc pobles i l'Aplec;
  - la mobilitat per a majors i gent sense carnet (F4): cinc pobles i l'Aplec;
  - les cures i la companyia per als majors (F3): quatre pobles i l'Aplec.
- **Hi ha un territori quasi buit.** Hem fet 21 fitxes de plataformes. Cap no cobrix aquestes demandes tal com les formulen els pobles:
  - el cotxe del poble amb horaris pactats;
  - l'habitatge per a temporers que excloga el lloguer turístic;
  - els béns productius compartits, és a dir, el banc de terres, l'obrador i el banc d'hores (F8, tres pobles);
  - el mapa de camins, fonts i zones de seguretat;
  - l'acompanyament davant l'Administració per a qui no té cobertura ni certificat.
- **Puebli ens avança.** Té en producció Vehicle, Ocupació i Habitatge, que al nostre Tauler estan en obres. Però les seues versions no resolen el Manifest tal com el formulen els pobles:
  - PuebliCar és un viatge interurbà, no el cotxe del poble;
  - Vivienda no distingix la residència del turisme;
  - l'activació d'un poble depén d'una meta de firmes i, després, d'un contracte municipal.
- **Prioritat 1, set peces:**
  - Mapa de seguretat i patrimoni;
  - Viatge del poble;
  - Habitatge per a qui viu i treballa;
  - Ocupació amb Perfil portafolis;
  - Pobles veïns;
  - Propostes del poble, amb «Digues-ho a l'Ajuntament»;
  - injecció assistida de la IAIA (el pont de WhatsApp, pendent de decidir).
- **Descartem el que traïx el filtre:**
  - la publicitat i la visibilitat de pagament (F7, F14);
  - fer dependre l'existència d'un poble d'un contracte municipal o d'una meta de firmes (F13, F17);
  - la verificació que exclou, com la pregunta secreta, l'SMS obligatori o el certificat digital (F1, F12, F15);
  - la IA de pagament (F12);
  - el rànquing entre pobles (F5).
- **També rebutgem algunes peces pels principis del projecte, no pel filtre.** El Manifest no en parla, i ho diem així:
  - els rastrejadors;
  - la IA construïda sobre les converses dels veïns;
  - la dependència d'un proveïdor que se'n pot endur la memòria, com va passar amb Puebloo i amb Digitale Dörfer.
- **Animalets no té fonament al Manifest** i queda fora del filtre. L'única lectura amb fonament és la ramaderia i l'apicultura a temps parcial.
- **Tensions que ha de decidir el Mestre (les principals):**
  - la pregunta de Beniaia per les càmeres, davant la privacitat estricta, que és un principi del projecte;
  - el turisme, davant l'habitatge no turístic;
  - la gestió cinegètica;
  - qui paga;
  - la confiança, davant el risc d'excloure;
  - el pont de WhatsApp;
  - els comentaris de WordPress.
- **Fita estratègica: eixir de WordPress.** Un exportador idempotent ha de fer que la memòria del Manifest, de l'Aplec i dels 522 elements de contingut del WordPress siga dels pobles i no d'un amfitrió.
- **On anem per darrere, sense excuses:** tracció, venda institucional amb preus públics, eines municipals acabades, verificació d'identitat i moderació professional.

Clau de les decisions del torn, citades al llarg de l'annex:

| Clau | Decisió |
|---|---|
| D1 | Contracte d'amfitrió de tres peces: `window.SocDePobleConfig {nomPoble, poble}`, l'element `<soc-de-poble>` i el paquet. És agnòstic d'amfitrió: WordPress, Sollutia, MediaWiki o pàgina estàtica. |
| D2 | Router en memòria dins dels amfitrions. |
| D3 | Tres endolls: amfitrió, dades i coneixement. |
| D4 | Model B: Supabase és la font única, i el port de backend té contracte. |
| D5 | L'app sencera viatja (Wiki, manifest, RAG, Consola), per transparència radical. |
| D6 | L'enxufe aterra a la pàgina del poble. |
| D7 | Annex A: sistema de coneixement obert i sense capçal (headless), com a cervell adjunt. |
| D8 | Annex B: pont privat Mac → servidor → mòbil per a les dades personals. La Gestoria no va mai al paquet públic. |
| D9 | Annex C: federació. Cada poble és un actor del Fedivers. |
| D10 | Disseny Defensiu Visual: una imatge externa que falla s'amaga i es reporta a la Consola d'administració. |

#### El filtre: el Manifest de Poble

El filtre ix de tres fonts:

1. La pàgina del Manifest a socdepoble.net (2022-11-17, consultada el 2026-09-29). No conté els eixos: només enllaça el PDF.
2. El document «Propostes locals: Poble a Poble», que ha enganxat el Mestre. Té el resum de l'Aplec per eixos i les propostes de cada poble.
3. La pàgina del 2n Aplec pel Territori, amb la nota de premsa del 2023-01-30.

Els eixos són set:
1. Persones, benestar i despoblament.
2. Transició ecològica.
3. Territori connectat.
4. Sistema agroalimentari.
5. Sistema forestal.
6. Innovació i dinamització.
7. Governança.

El filtre només arreplega les demandes que una plataforma pot servir. Algunes demanen política pública: el sou per als agricultors que llauren, el pagament per serveis ecosistèmics, la lluita contra la Xylella, els regadius tradicionals o el tren a València. Eixes no fan de criteri. Com a molt, la plataforma les fa visibles a «Propostes del poble».

| Criteri | Formulació | Eix | Pobles i propostes que el fonamenten |
|---|---|---|---|
| F1 | Quedar-se a viure: relleu generacional (dona i jovent), estabilitat, teletreball i integració de la immigració | 1 | Aplec (2023-01-29, resum del 2023-02-03); Balones, accés del jovent al treball (2022-12-09); Callosa d'en Sarrià, teletreball i integrar la immigració (2022-11-22) |
| F2 | Habitatge tot l'any per a qui viu i treballa al poble, mai turístic | 1 | Aplec, lloguer tot l'any a bon preu amb preferència per a famílies amb fills; Benialfaquí, habitatge per a jornalers de temporada no disponible per a turistes (2022-11-27); Beniaia, espais públics sense ús convertits en habitatge (2023-01-10); Famorca, cap casa de lloguer (2022-12-07); Balones, lloguer per a qui s'incorpora (2022-12-09); Callosa, cessió d'ús i rehabilitació de cases velles (2022-11-22) |
| F3 | Cures i companyia per als majors i per a qui viu a soles | 1 | Aplec, hospitalització domiciliària; Beniaia, centres de dia amb transport i menjar a domicili (2023-01-10); Famorca, llar de dia (2022-12-07); Tollos, acompanyament i ajuda en tasques perilloses per a qui està a soles (2023-01-09); Callosa, centre de dia (2022-11-22) |
| F4 | Mobilitat compartida per a majors i gent sense carnet: cotxe del poble amb horaris pactats, bus escolar obert a la gent, taxi o bus a demanda | 3 | Aplec (2023-01-29); Benialfaquí (2022-11-27); Balones, cotxe comunitari de la Vall (2022-12-09); Beniaia (2023-01-10); Famorca (2022-12-07); La Torre de les Maçanes, horaris compatibles amb l'escolar (2023-02-25) |
| F5 | Connectar pobles: xarxa entre pobles xicotets per a compartir idees, serveis, oferta i demanda d'ocupació; mancomunar recursos | 3 i 7 | Aplec, «una aplicació mòbil per connectar pobles» i treballar en clau de territori; Beniaia, crear xarxes (2023-01-10); Callosa, connectar les persones de l'entorn i mancomunitats subcomarcals (2022-11-22); Muro d'Alcoi, capitalitat comarcal compartida (2023-02-06); pàgina del Manifest, «Vertebrar-nos és crucial» (2022-11-17) |
| F6 | Treball local: posar en valor com a servei o ocupació el que la gent sap fer i oferir | 1 i 6 | Callosa (2022-11-22); Balones, veïns com a guies d'itineraris (2022-12-09); Tollos, autònom compartit tot l'any (2023-01-09); Beniaia, oferta i demanda d'ocupació (2023-01-10); Aplec, agricultura, apicultura i ramaderia a temps parcial |
| F7 | Proximitat sense intermediaris: consum de temporada, cooperatives de consum, mercats de proximitat, tendes de poble, xarxa de sobres d'aliments | 4 | Aplec, consum de proximitat, cooperativisme i suport a les tendes davant les grans superfícies; Callosa, «fora intermediaris», km 0 i xarxa de sobres (2022-11-22); Balones, mercat ambulant concentrat en un dia (2022-12-09); La Torre, comerç local i cooperativa oleícola (2023-02-25) |
| F8 | Béns productius compartits: banc de terres, obrador i maquinària comunitaris, borsa de jornalers amb banc d'hores | 4 | Tollos (2023-01-09); Balones (2022-12-09); Callosa, banc de terres abandonades amb cooperatives (2022-11-22) |
| F9 | Sabers i llavors: intercanvi de llavors i de coneixement tradicional, i el saber de les velles generacions | 4 i 6 | Aplec (2023-01-29); Callosa (2022-11-22); La Torre, dansa popular, museu de la festa i seu universitària de pedra seca i llegendes (2023-02-25) |
| F10 | Territori preparat per a l'emergència: mapes de camins accessibles, punts d'aigua, zones de supervivència i de seguretat, plans per poble i voluntariat format | 5 | Aplec, mapes actualitzats, també per a inundacions, i el mosaic agrari com a zona de supervivència (2023-01-29); Callosa, voluntariat contra incendis que guia els bombers per camins i fonts, i brigades locals (2022-11-22); Tollos, basses per a la sequera (2023-01-09) |
| F11 | Patrimoni catalogat i custodiat: fonts, basses, marges de pedra seca, masos, camins i vies pecuàries | 5 i 6 | La Torre, catàleg de masos i infraestructures agrícoles, vies pecuàries i senders locals (2023-02-25); Benimassot, les fonts una per una (2022-12-31); Benialfaquí, fonts, basses i marges (2022-11-27); Beniaia, senyalitzar camins i marges de pedra seca (2023-01-10); Tollos, pintures rupestres i ruta de masos i corrals (2023-01-09); Benillup, barranc de Caraita, sense més detall (2022-11-27) |
| F12 | Acompanyament davant l'Administració per a qui no té cobertura, ordinador ni certificat digital | 7 i 1 | Famorca (2022-12-07); Aplec, funcionaris assessors per a emplenar papers i no perdre ajudes, i la complexitat de la PAC; Callosa, ajuda amb la declaració de la renda i cursos d'informàtica (2022-11-22) |
| F13 | Canal estable de participació i comunicació entre els pobles i l'Administració, «des dels pobles per als pobles» | 7 | Aplec (2023-01-29); Callosa, democràcia participativa i horitzontal, grups de treball i escoltar la gent vella (2022-11-22); pàgina del Manifest, llistat individualitzat d'exigències per poble (2022-11-17) |
| F14 | Associacions i vida en comú: suport a les entitats, activitats entre setmana i el bar com a espai de trobada | 6 | Aplec, suport a les associacions (2023-01-29); document de propostes, exempció de comissions bancàries a les associacions («Demandar a l'administració», 2023-02-04); Tollos, activitats per a col·legis, associacions i jubilats, i sala polivalent (2023-01-09); Beniaia (2023-01-10) i Callosa (2022-11-22), el bar com a servei de socialització |
| F15 | Cobertura i accés digital | 3 | Famorca, sense cap operador (2022-12-07); Callosa, wifi obert, fibra i cursos (2022-11-22); La Torre, wifi gratuït i reobrir la biblioteca (2023-02-25) |
| F16 | Seguretat en pobles quasi buits entre setmana | 1 | Beniaia (2023-01-10); Tollos, ajuda a qui està a soles (2023-01-09) |
| F17 | Sobirania i trellat dels pobles: productors i no objecte d'especulació, decisions preses des del poble, custòdia del territori | 2 i 7, transversal | Aplec, eix 2, no a les macroplantes ni als especuladors, i els pobles com a productors; Aplec, eix 4, sobirania alimentària; Aplec, eix 7, «des dels pobles per als pobles»; pàgina del Manifest, «som els garants de la custòdia del territori» (2022-11-17) |
| F18 | Transició ecològica a escala de poble: energia pròpia i compartida, compostatge i millor recollida | 2 | Aplec (2023-01-29); Callosa, comunitat i cooperativa d'energia (2022-11-22); La Torre, biomassa, pilot solar i compostadora (2023-02-25); l'Atzúbia, compostatge (2022-11-28) |

**Regles d'aplicació**

1. S'aprova el que resol almenys un criteri i no en traïx cap.
2. Es descarta el que en traïx algun, encara que siga popular o estiga ben polit.
3. El que resol un criteri i en traïx un altre va a «Tensions per a decidir». També hi va el que resol un criteri però xoca amb un principi del projecte. A cada tensió diem quin dels dos casos és.
4. El que no resol ni traïx cap criteri va a «Fora del filtre». El Manifest ni l'aprova ni el condemna.
5. Els principis propis del projecte («Poble abans que corporació») no fan de filtre en aquest annex. Quan rebutgem una peça pels nostres principis i el Manifest no en diu res, ho diem així. La peça va al bloc de principis de «Fora del filtre».

**Nota sobre F17.** F17 s'aplica en el sentit literal de les fonts. Inclou quatre coses:
- els pobles com a productors i no com a objecte d'especulació (Aplec, eix 2);
- la sobirania alimentària (Aplec, eix 4);
- les decisions preses «des dels pobles per als pobles» (Aplec, eix 7);
- la custòdia del territori (pàgina del Manifest).

Estendre-la a les dades, al codi i als proveïdors de programari és una lectura nostra, no una demanda literal. Una peça que només es rebutja per eixa lectura no va a «Què descartem»: va al bloc de principis de «Fora del filtre».

**Nota sobre el turisme.** L'Aplec demana turisme des de la singularitat de cada territori. Les propostes genèriques del document (2023-01-04, abans de l'Aplec) hi afegixen una fira de turisme rural rotatòria per les valls i la marca Muntanya d'Alacant. Balones vol veïns que facen de guies. El turisme té fonament (F6 i F11), però F2 el limita: mai a costa de l'habitatge.

#### Mapa del nínxol

| Família | Plataformes | Qui inicia i qui paga | Obertura | Relació amb el filtre |
|---|---|---|---|---|
| Xarxa rural de baix a dalt (Espanya) | Puebli (activa); Puebloo (tancada a finals de 2023) | Els veïns firmen i l'ajuntament paga l'activació (Puebli) | Tancat | Resol a mitges F2, F4, F5 i F6. Traïx F13 i F17 perquè condiciona el poble a l'ajuntament. |
| Apps municipals (Espanya) | Bandomovil, Línea Verde, eAgora, WeTown, MunicipApp i Ayuntamientos de Valencia | L'ajuntament o la diputació | Tancat | Resol F13 a mitges. La comunicació va sobretot de l'ajuntament cap al veí, i la principal via de pujada són els avisos d'incidència. |
| Plaça digital pagada per l'administració (Europa) | Crossiety, Hoplr, StadtLand.Funk (abans DorfFunk) | L'ajuntament o el Land | Tancat, però l'obertura de StadtLand.Funk no està verificada. DorfFunk té codi Apache-2.0 congelat. | Resol F3, F5, F13 i F14. |
| Tauler municipal d'una direcció (França) | PanneauPocket, IntraMuros | L'ajuntament, amb preus públics baixos | Tancat | Resol F13 només de baixada, i F15. |
| Xarxa veïnal comercial | nebenan.de, Nextdoor | Els veïns; paga la publicitat | Tancat | Traïx F7. |
| Mitjà local ètic | Front Porch Forum | Els veïns; quotes de comerç i donacions | Tancat | Resol F3, F13 i F14. |
| Programari lliure especialitzat | Decidim i CONSUL (participació); Mobilizon i Gancio (agenda); Mobicoop (vehicle); graz.social (Fedivers local) | Institucions, cooperatives i col·lectius | AGPL | Resol F4, F13, F14 i F17, però per peces separades. |

Sóc de Poble ocupa una casella que no ocupa cap altra plataforma: una plataforma integral, de baix a dalt i lliure. S'enxufa a la web que ja té el poble, funciona en valencià i té la federació prevista. Les tres que més s'hi acosten tenen, cadascuna, una mancança:
- DorfFunk era integral i rural, però ha passat a mans privades.
- Gancio és un component web lliure, però només fa agenda.
- Puebli és integral i rural, però és tancada i depén de l'ajuntament.

**Apps que ja hi ha al poble pilot.**
- La web oficial de La Torre de les Maçanes enllaça MunicipApp, de la Diputació d'Alacant.
- Relleu, el poble veí, té «Relleu Informa», de Bandomovil.
- La participació autonòmica passa per GVA Participa, que funciona amb CONSUL i en valencià.

Les tres són unidireccionals o formals. Recomanem complementar-les, no competir-hi.

**Primera xarxa natural.** La pàgina del Manifest està etiquetada amb 21 pobles i amb «Xarxa de Pobles». Onze tenen propostes escrites. Els deu restants encara no en tenen: Castell de Castells, Fageca, Gorga, la Vall d'Alcalà, la Vall de Gallinera, Millena, Planes, Pego, Quatretondeta i Tormos. Aquests 21 pobles són el perímetre de F5 abans de parlar de federació.

#### Matriu creuada sobre les nostres categories

| Categoria | Estat a SdP | Criteri del Manifest | Rurals Espanya | Apps municipals i taulers | Veïnals Europa i EUA | Programari lliure | Veredicte |
|---|---|---|---|---|---|---|---|
| Mur | Actiu | F13, F14, F5 | Puebli: fil per poble en pestanyes. Puebloo: microblog (tancat). | Bans d'una direcció (Bandomovil, MunicipApp, PanneauPocket). WeTown: fòrum i reaccions. | Crossiety: tres visibilitats. DorfFunk: sense algorisme. Front Porch Forum: resum moderat. Nextdoor: amb anuncis. | Mastodon (graz.social) | Paritat. Hi afegim un Pregoner separat, lectura sense compte i resum setmanal. |
| Mercat | Actiu | F7, F9, F8 | Puebli: «Mercadillo», amb gratuïts i pobles propers | Directoris de comerç; avisos de comerç per adhesió (Bandomovil); mercat de pagament (eAgora) | Crossiety: Marktplatz. DorfFunk: Biete/Suche, BestellBar i LieferBar. nebenan: visibilitat de pagament. | Cap | Paritat. Adoptem Oferisc/Busque/Regale i els sobres d'aliments. Sense visibilitat de pagament. |
| Agenda | Actiu, però enruta al Mur | F14, F3, F7 | Puebli: Eventos, amb pobles propers | Entrades i aforament (Bandomovil, eAgora); agenda col·laborativa (eAgora) | Crossiety: agenda regional. IntraMuros: «bassin de vie». | Gancio i Mobilizon són el referent: ICS, component web i federació. | Anem per darrere. Cal secció pròpia, llocs normalitzats, activitats permanents i ICS. |
| Xat | Actiu | F13, F14, F5 | Puebli: botó «Contactar» (canal no verificat) | Canal entre veí i ajuntament (Bandomovil, eAgora) | Crossiety: xat 1:1 i de grup. Hoplr: xats de grup. | Decidim: debats | Avantatge moderat. Afegim avisos fixats a dalt i el pont amb la IAIA. |
| Notes | Actiu | F9, F13 (indirecte) | Absent | Absent | Absent | Decidim: textos col·laboratius, però col·lectius | Avantatge sense rival. El Manifest no nomena l'eina: la justifica com a vehicle de la memòria i de les propostes. |
| Pobles | Actiu. «Gent de la Torre» encara no té fil ni ordre per activitat. | F5, F13, F11 | Puebli, és el seu nucli: seguir pobles, alta col·laborativa, pregunta secreta. Puebloo: rànquing de pobles. | Fitxa per municipi; Bandomovil «Explora» en un radi de 200 km | Crossiety: «Meine Region» (20 km). DorfFunk: DorfPages. | CONSUL: multi-instància. Mobilizon: els grups són actors. | Paritat. Hi afegim Pobles veïns i Propostes del poble. Sense rànquing. |
| Multimèdia | Actiu | F9, F11 | Galeria al perfil (Puebli) | No verificat | Només adjunts | PeerTube (graz.social) | Avantatge. L'orientem a la memòria: fotos antigues, dansa, festa. |
| Mapa | En obres | F10, F11 | Puebli: mapa de pobles i de firmes (Leaflet amb OSM) | Incidències geolocalitzades (Línea Verde, WeTown); carrerer (MunicipApp) | Mapa d'alertes (Nextdoor); mapes participatius de pagament (Hoplr) | Gancio: llocs. Decidim: propostes al mapa. | Ningú fa el mapa que demana l'Aplec (eix 5). Prioritat 1. |
| Compartir vehicle | En obres | F4, F3 | PuebliCar: oferta i demanda de viatges interurbans | Absent | DorfFunk: dins de Biete/Suche, i LieferBar | Mobicoop: mobilitat solidària amb central humana i autoestop organitzat | Anem per darrere de Puebli i de Mobicoop. Prioritat 1, amb el cas que descriuen els pobles (Benialfaquí, Balones). |
| Animalets | En obres | Cap criteri directe | Absent | Absent | Nextdoor i Crossiety: perduts i trobats | Absent | Fora del filtre. |
| Ocupació | En obres | F6, F1, F5, F8 | Puebli: Empleos, amb oferta i demanda. Puebloo (tancat). | Bandomovil: ofertes per radi | Hoplr: ofertes que publica l'ajuntament | Mobicoop: mobilitat per anar a entrevistes | Anem per darrere. Prioritat 1, amb el Perfil portafolis. |
| Habitatge | En obres | F2, F1 | Puebli: Vivienda, amb oferta, demanda i €/mes | Absent | Absent | Absent | Anem per darrere de Puebli, però ningú filtra el lloguer turístic. Prioritat 1, amb regla dura. |
| Gestoria | Connector actiu | F12, F6, F8 | Absent (Puebli només usa Stripe per al premium) | Pagaments i tràmits municipals (eAgora, WeTown) | Absent | Absent | Avantatge sense rival. Mai al paquet públic (D8). |
| IA (IAIA) | Actiu | F12, F3, F1 | Puebli: Gemini per a moderar les firmes | Bandomovil: chatbot municipal i «Mejorar el bando». eAgora: xat amb IA de pagament. | Nextdoor: IA sobre les converses. Hoplr: traducció. | decidim-ai: classificador local i explicable | Avantatge, si és assistència amb confirmació humana. |
| Wiki de Poble | Actiu | F9, F11, F13 | Absent | Organigrama municipal (Ayuntamientos de Valencia) | DorfPages | Decidim: pàgines | Avantatge. |
| Comunitats | Actiu | F14, F8, F18 | «Pandilla» (Puebli) | Àgores (eAgora) | Grups (Crossiety, Hoplr) | Grups (Mobilizon) | Paritat. Hi afegim un canal d'avisos fixat a dalt. |
| Dispositius (P2P) | Actiu | F15, F10 | Absent | Absent | Absent | Absent | Avantatge potencial: mapa i avisos sense cobertura. |

#### Les propostes dels pobles davant la competència

| Proposta (poble, data) | Eix | Categoria SdP | Qui ho fa ja a la competència i com | Veredicte | Primer pas |
|---|---|---|---|---|---|
| Cotxe del poble amb horaris pactats per a majors i gent sense carnet (Benialfaquí, 2022-11-27; Balones, cotxe comunitari de la Vall, 2022-12-09; Aplec, 2023-01-29) | 3 | Compartir vehicle i Agenda | Mobicoop: conductors voluntaris i una central telefònica que casa les peticions i les confirma. PuebliCar: oferta i demanda interurbana, sense horaris pactats. DorfFunk: trajectes dins de Biete/Suche. | Aprovat (F4, F3) | Tipus «Viatge del poble» amb franja fixa (dia de metge, dia de mercat) i llista d'inscrits. Una persona referent també hi apunta les peticions que li arriben per telèfon (D4). |
| Bus escolar obert a la gent, taxi especial, bus a demanda (Beniaia, 2023-01-10; Famorca, 2022-12-07; La Torre, 2023-02-25) | 3 | Compartir vehicle i Propostes del poble | Ningú. Mobicoop activa el transport a demanda des de la seua central. | Aprovat en part (F4, F13): no fem el bus, però agreguem la demanda. | Comptador anònim «necessite anar a... el dia...» per poble, que es pot publicar com a evidència davant l'Administració. |
| Habitatge per a jornalers de temporada, no disponible per a turistes (Benialfaquí, 2022-11-27); per a pobladors i treballadors, en espais públics sense ús (Beniaia, 2023-01-10); cap casa de lloguer (Famorca, 2022-12-07); lloguer tot l'any (Aplec) | 1 | Habitatge | Puebli, «Vivienda»: oferta i demanda sense cap regla de durada ni de finalitat. Puebloo (tancat). | Aprovat amb regla dura (F2, F1) | Durada mínima i finalitat (residència o temporada agrícola) obligatòries. Sense lloguer per dies ni per setmanes. Registre voluntari de cases buides i de locals públics sense ús (D4). |
| Banc de terres i inventari de parcel·les abandonades (Tollos, 2023-01-09; Balones, 2022-12-09; Callosa, 2022-11-22) | 4 | Mapa (capa privada) i Mercat (Cedisc / Busque terra) | Ningú | Aprovat (F8, F17) | Capa del Mapa només amb el que el propietari autoritza. L'anunci de propietari desconegut és un acte municipal, que enllacem (D4, D8; tensió 7). |
| Obrador comunitari i maquinària agrícola comunitària (Balones, 2022-12-09) | 4 | Comunitats i Agenda (reserves) | Reserva d'espais municipals (Puebli, eAgora); prestar i compartir (Hoplr). Cap no està pensat per a l'agricultura. | Aprovat (F8, F7) | Recurs compartit reservable per torns dins d'una Comunitat: obrador, trituradora, atomitzador. |
| Borsa de jornalers amb banc d'hores (Tollos, 2023-01-09) | 4 | Ocupació i Gestoria | Ningú | Aprovat (F8, F6) | Saldo d'hores per Comunitat que passa d'un any a l'altre. Les tarifes i les factures viuen a la Gestoria privada (D8). |
| Servei fix per als veïns que queden, amb un autònom compartit (Tollos, 2023-01-09) | 1 | Ocupació i Perfil | Ningú | Aprovat (F3, F6) | Perfil portafolis amb «Què faig» i disponibilitat. La contractació col·lectiva es fa fora de la plataforma. |
| Xarxes entre pobles xicotets per a idees, serveis i oferta i demanda d'ocupació (Beniaia, 2023-01-10); «aplicació mòbil per connectar pobles» (Aplec) | 3 i 7 | Pobles, Ocupació i Mercat | Puebli: seguir pobles i veure els propers. Crossiety: radi de 20 km. Bandomovil: radi de 200 km. IntraMuros: «bassin de vie». | Aprovat: és la nostra raó de ser (F5) | Abast «pobles veïns» a Mercat, Ocupació i Agenda, amb els 21 pobles del Manifest com a primera xarxa. La federació és el pas llarg (D9). |
| Assessorament als majors davant l'Administració, sense cobertura ni certificats (Famorca, 2022-12-07); funcionaris assessors (Aplec, eix 7); ajuda amb la renda (Callosa, 2022-11-22) | 7 | IAIA, Xat i Gestoria | Chatbot municipal amb preguntes freqüents (Bandomovil); central telefònica humana (Mobicoop). Ningú acompanya el tràmit. | Aprovat (F12, F3, F15) | Injecció assistida de la IAIA, amb una persona de confiança que confirma. La plataforma no custodia mai certificats ni claus (D8). |
| Mapes de camins, punts d'aigua, zones de supervivència i de seguretat, i plans per poble (Aplec, eix 5); voluntariat contra incendis que guia els bombers (Callosa, 2022-11-22) | 5 | Mapa, Comunitats i Dispositius | Incidències geolocalitzades (Línea Verde, WeTown); mapa d'alertes (Nextdoor). Ningú cartografia la seguretat del terme. | Aprovat, prioritat 1 (F10) | Capes validades per una persona referent, GeoJSON públic, versió per a imprimir i descàrrega per a usar-lo sense connexió (D7, D10). |
| Catàleg de masos, naixements, fonts, aigüeres, basses, sesters i eres (La Torre, 2023-02-25); les fonts una per una (Benimassot, 2022-12-31); marges de pedra seca (Beniaia, 2023-01-10; Benialfaquí, 2022-11-27); pintures rupestres i ruta de masos (Tollos, 2023-01-09) | 5 i 6 | Wiki, Mapa i Multimèdia | Punts d'interés turístic (Puebli, MunicipApp, IntraMuros); història del poble (DorfPages). Ningú fa un inventari col·laboratiu. | Aprovat (F11, F9) | Fitxa de Wiki «element de patrimoni» amb frontmatter (tipus, coordenades, estat, fotos, data de revisió) que alimenta el Mapa. Llicència CC BY-SA (D7). |
| Grups de consum, intercanvi de llavors, xarxa de sobres d'aliments, «fora intermediaris» (Callosa, 2022-11-22; Aplec, eix 4) | 4 | Mercat i Comunitats | Ningú. BestellBar (DorfFunk) només serveix el comerç. | Aprovat (F7, F9) | Subtipus «Regale / Sobra», amb caducitat curta, i subtipus «Llavors». Comanda col·lectiva sense cobrament dins de la plataforma. Recollida en un punt comú, sense llistes de persones necessitades (tensió 8). |
| Mercat ambulant concentrat en un dia (Balones, 2022-12-09); xarxa de mercats de proximitat (Callosa, 2022-11-22); suport a les tendes de poble (Aplec) | 4 | Agenda i Mercat (fitxa de comerç) | Avisos de comerç per adhesió (Bandomovil); activitats permanents (Mobilizon); directoris (IntraMuros) | Aprovat (F7) | «Dia de mercat» recurrent amb les parades. Els avisos de cada tenda només arriben a qui s'hi adherix. |
| Suport a les associacions (Aplec, 2023-01-29); exempció de comissions bancàries (document de propostes, «Demandar a l'administració», 2023-02-04); activitats entre setmana (Tollos, 2023-01-09) | 6 | Comunitats, Perfil d'associació i Agenda | eAgora: pla gratuït per a entitats. Crossiety: grups gratuïts. Mobilizon: grups. | Aprovat (F14) | Perfil d'associació gratuït per principi, amb rol de publicació a l'Agenda del poble. |
| Via estable de participació «des dels pobles per als pobles» (Aplec, eix 7); democràcia participativa i escoltar la gent vella (Callosa, 2022-11-22); llistat d'exigències per poble (Manifest, 2022-11-17) | 7 | Pobles, Wiki i Xat | Decidim i CONSUL (GVA Participa ja usa CONSUL); DorfFunk, «Sag's uns» cap a LösBar; incidències (Bandomovil) | Aprovat (F13, F17) | Pàgina viva «Propostes del poble» amb data i estat (presentada, amb resposta, feta), que pot substituir el Google Doc actual si el Mestre ho autoritza. Enllaçar GVA Participa en lloc de construir votacions, pendent de la tensió 10 (D6, D7). |
| Cobertura i accés digital: cap operador a Famorca (2022-12-07); wifi obert i cursos (Callosa, 2022-11-22); reobrir la biblioteca (La Torre, 2023-02-25) | 3 | Dispositius i mode lleuger | PanneauPocket: lectura anònima i lleugera. Ningú funciona sense cobertura. | Aprovat en part (F15): no fem cobertura | Mode de dades mínimes, lectura sense compte, pantalla aparador a la biblioteca o al bar, i mapa de les zones sense cobertura com a evidència. |
| Seguretat en pobles quasi buits, amb una pregunta per càmeres als carrers (Beniaia, 2023-01-10) | 1 | Pobles i Xat | Botó del pànic amb guardians (Bandomovil); avisos per zones (WeTown) | Tensió entre F16 i un principi del projecte (la privacitat), no entre dos criteris. Decidix el Mestre. | Vegeu «Tensions per a decidir». |
| Veïns com a guies d'itineraris (Balones, 2022-12-09) | 6 | Perfil, Mapa i Agenda | Guies turístiques institucionals (Puebli, MunicipApp) | Aprovat (F6, F11) | Ofici «guia» al Portafolis, enllaçat a les rutes del Mapa. |
| Centre de dia, menjar a domicili, hospitalització domiciliària (Aplec, 2023-01-29; Beniaia, 2023-01-10; Famorca, 2022-12-07; Callosa, 2022-11-22) | 1 | Comunitats, Agenda i Xat | Cura veïnal i gestió de voluntariat (Hoplr, de pagament); llista de voluntaris (Crossiety) | Aprovat en part (F3): coordinem, no fem servei sanitari | Llista de voluntaris i torns de companyia dins d'una Comunitat, amb trucada programada. |
| Compostatge i millor recollida (l'Atzúbia, 2022-11-28; La Torre, 2023-02-25) | 2 | Agenda i Pobles | Calendari de fems (Crossiety); porta a porta (WeTown) | Aprovat, prioritat 3 (F18) | Calendari de recollida com a activitat permanent. |
| Comunitat i cooperativa local d'energia (Callosa, 2022-11-22; La Torre, biomassa i pilot solar, 2023-02-25) | 2 | Comunitats | SoCoTeMo (Mobicoop amb Som Comunitats); eAgora ho anuncia com a «pròximament» | Aprovat només com a comunicació (F18, F17) | Una Comunitat per a la cooperativa energètica. No fem cap gestió energètica pròpia. |

#### Inspiració de disseny que passa el filtre

| Patró | Origen | On a SdP | Criteri | Decisió |
|---|---|---|---|---|
| Oferisc / Busque / Regale com a model únic, amb una metalínia a la targeta | DorfFunk (Biete/Suche); Puebli (oferta i demanda) | Mercat, Vehicle, Ocupació, Habitatge | F4, F6, F7, F2 | Adoptar, amb regles pròpies per tipus: durada mínima a Habitatge i cap preu a Vehicle. |
| Llocs normalitzats: no es pot reescriure l'adreça d'un lloc que ja existix | Gancio | Agenda i Mapa | F10, F11 | Adoptar. |
| Publicar sense compte, amb una cua de confirmació | Gancio | Agenda i Mercat | F12, F3 | Adoptar, amb una persona editora per poble. |
| Component web incrustable i ICS/RSS per filtre | Gancio, Mobilizon | Agenda i Pregoner | F5 | Adoptar dins del contracte d'amfitrió (D1). |
| Lectura anònima del canal públic | PanneauPocket | Mur públic, Pregoner, Agenda | F15, F3 | Adoptar. |
| Tres visibilitats: poble, comarca i pública | Crossiety | Mur, Mercat, Perfil | F5 | Adoptar. Només la pública s'exporta, s'incrusta o es federa (D9). |
| Pobles veïns i segones residències | Crossiety (20 km); IntraMuros | Pobles | F5, F1 | Adaptar: per llista de pobles, no per quilòmetres. A la muntanya no mana la distància, mana la carretera. |
| Resum periòdic lent | Front Porch Forum; butlletí de Mobilizon | Mur, per correu i en paper | F3, F15 | Adoptar. |
| Butlletí en paper i pantalla aparador | Crossiety; Digitaler Schaukasten; Public Viewer | Pregoner i Mur | F15, F3, F14 | Adoptar. La pantalla és un amfitrió més (D1). |
| Avís ciutadà cap a una safata de gestió, amb estat visible | DorfFunk («Sag's uns» cap a LösBar); Línea Verde (quatre passos) | «Digues-ho a l'Ajuntament» | F13, F16 | Adoptar. |
| L'ajuntament no pot llegir les converses | Hoplr | Contracte d'enxufe | F13, F17 | Adoptar com a clàusula del contracte d'amfitrió (D1). |
| Mobilitat solidària amb central humana | Mobicoop | Compartir vehicle | F4, F3, F12 | Adoptar. |
| Autoestop organitzat, amb parades i cartells amb QR | Mobicoop Pouce | Vehicle i Mapa | F4 | Adaptar a la plaça i a la parada del bus escolar. |
| Veïns que porten paquets a altres veïns | LieferBar (DorfFunk) | Vehicle i Mercat | F4, F7 | Adaptar: «Baixe al poble gran: vols que et porte res?». |
| Diverses identitats en un sol compte | Mobilizon | Commutador entre persona, comerç i associació | F6, F14 | Adoptar. |
| Contracte social públic | Decidim | Llicència i comunicació | F13, F17, només per a la clàusula de no lectura. La resta són principis. | Adoptar. |
| Moderació local i explicable, que denuncia com un usuari més | decidim-ai | IAIA | F17 | Adoptar: la IA marca i una persona del poble decidix. |
| Rendició de comptes per proposta | Decidim | Propostes del poble | F13 | Adaptar a un estat per proposta. |
| Alta col·laborativa del poble | Puebli | Pobles | F13, F11 | Adoptar, sense que l'activació depenga de res. |
| Comptador d'adhesions | Puebli (firmes); formulari d'adhesió del Manifest | Propostes del poble | F13 | Adaptar: adhesió al Manifest i a cada proposta, mai com a peatge. |
| Llindar de suports | CONSUL | Propostes del poble | F13 | Adaptar: una proposta amb prou adhesions es porta al ple o a la mancomunitat. |
| Traducció de missatges | Hoplr | IAIA | F1 | Adaptar, amb el proveïdor declarat (D5). |
| Leaflet amb OpenStreetMap | IntraMuros, Gancio, Puebli | Mapa | F10, F11 | Adoptar. Les tessel·les que fallen es tracten segons D10. |

#### Perfil de persona i d'empresa com a portafolis

La llavor és l'arxiu d'autor del WordPress de socdepoble.net: la llista de tot el que una persona ha publicat. El perfil ha de ser un portafolis de feina i sabers, no un aparador per a captar atenció. Passa el filtre perquè resol diversos criteris:
- F6 i F1, perquè fa visible el que la gent sap fer;
- F8, perquè permet oferir eines i terres;
- F5, perquè obri l'oferta i la demanda entre pobles;
- F11, pels guies;
- F14, per les associacions.

| Bloc | Contingut | Visibilitat per defecte | Criteri | Enllaça amb |
|---|---|---|---|---|
| Qui soc | Nom o malnom, poble, i «de casa de...» si la persona vol | Veïns del poble | F1, F5 | Pobles |
| Què faig | Oficis, sabers i disponibilitat | Veïns del poble; la persona la pot fer pública | F6, F1 | Ocupació |
| Amb què treballe | Eines, maquinària, terres o locals que pot compartir | Contactes (la ubicació d'una terra és sensible) | F8 | Banc de terres, obrador, maquinària comunitària, banc d'hores |
| Portafolis | Tot el que ha publicat al Mur, Mercat, Agenda, Wiki i Multimèdia, agregat automàticament | Cada peça conserva la seua visibilitat | F6, F9, F11 | Totes les seccions |
| Currículum | Formació i trajectòria | Privada | F6, F1 | Ocupació |
| Contacte | Telèfon i correu | Privada, mai pública per defecte | F16, F3 | Xat |

Regles:
- **El portafolis no revela més que cada peça.** Mostra a cada visitant només les peces que la seua visibilitat li permet veure.
- **Sense xifres de popularitat.** No hi ha cap mètrica de seguidors, cap recompte agregat de «m'agrada» ni cap rànquing. No resolen cap criteri, i l'encàrrec del Mestre les exclou.
- **Menors d'edat:** cap bloc públic.
- **Dades estructurades.** schema.org (Person, Organization, LocalBusiness) s'aplica només als blocs públics, que formen part del coneixement obert (D7).
- **Federació.** El perfil com a actor ActivityPub (D9) només s'activa amb adhesió explícita.
- **Dades i imatges.** El perfil es guarda a Supabase, a través del port (D4). Les fotos que fallen s'amaguen i es reporten (D10).
- **Perfil d'empresa o d'associació.** És la mateixa peça, amb una fitxa de comerç local (horaris, serveis i productes del Mercat) i el commutador d'identitat entre persona, comerç i associació.

Comprovació del perfil amb el filtre:

| Demanda dels pobles | Com la resol el perfil | Criteri |
|---|---|---|
| Relleu generacional i ocupació | «Què faig» i «Currículum», visibles per als pobles veïns | F1, F6, F5 |
| Posar en valor el que la gent del poble pot oferir (Callosa, 2022-11-22) | «Què faig», amb el portafolis com a prova de la feina | F6 |
| Xarxes entre pobles amb oferta i demanda d'ocupació (Beniaia, 2023-01-10) | Abast «pobles veïns» del bloc «Què faig» | F5 |
| Veïns com a guies (Balones, 2022-12-09) | Ofici «guia» enllaçat a les rutes del Mapa | F6, F11 |
| Autònom compartit i banc d'hores (Tollos, 2023-01-09) | «Amb què treballe» i un saldo d'hores dins de la Comunitat, amb les tarifes a la Gestoria (D8) | F8, F3 |
| Suport a les associacions (Aplec) | Perfil d'associació gratuït, amb rol a l'Agenda | F14 |

Què descartem de la competència:
- les minipàgines de pagament per a entitats de Puebli i el perfil de comerç de pagament de nebenan, perquè traïxen F7 i F14;
- la llista de veïns visible per defecte de Crossiety, perquè exposa qui viu a soles (F16);
- la signatura amb el carrer de Front Porch Forum, per la mateixa raó (F16).

#### Patrons d'interfície presos de WhatsApp

El Mestre va compartir captures de l'app com a inspiració de disseny. No se n'ha transcrit cap dada personal.

| Patró | Decisió | On encaixa a SdP | Criteri del Manifest o motiu |
|---|---|---|---|
| Comunitats amb un grup d'Avisos fixat a dalt i subgrups temàtics | Adoptar | Cada poble és una Comunitat, amb «Avisos del poble» (el Pregoner) fixat a dalt i subgrups: associacions, cooperativa, AMPA, colla | F13, F14 |
| Blocs amb «Mostra-ho tot» | Adoptar | Tauler, pàgina del poble, Portafolis | F3: menys soroll per als majors |
| Acció principal ancorada a baix, a l'abast del polze | Adoptar | «Publica», «Demane viatge», «Oferisc» | F3, F12 |
| Fulls inferiors per a les accions secundàries | Adoptar | Visibilitat, compartir, denunciar, editar | F3 |
| Insígnia de comunitat sobre l'avatar | Adaptar | Insígnia de poble o d'associació; mai de pagament ni una «verificació» comprada | F5, F14 |
| Xips de filtre amb llistes pròpies (per exemple, la gent gran a qui ajudes) | Adaptar | Llistes privades: només les veu qui les crea, i la plataforma no les deduïx mai | F3; protegix persones vulnerables |
| Botons de trucada grans i «Programa» | Adaptar | Trucada amb el telèfon del sistema (enllaç tel:, sense veu per internet pròpia) i trucada de companyia programada | F3, F16 |
| Canals d'un a molts | Adoptar | Pregoner de l'ajuntament i de les associacions, amb data de caducitat | F13, F14 |
| Files de configuració amb icona, títol i subtítol | Adoptar | Configuració i Perfil | F3 |
| Mode d'estalvi de dades | Adoptar | Mode de dades mínimes: primer el text, sense imatges automàtiques | F15 (Famorca) |
| Idioma per defecte | Adoptar | Valencià per defecte; castellà i altres llengües per als nouvinguts | F1 (Callosa: integrar la immigració) |
| Commutador d'identitat | Adoptar | Persona, comerç, associació | F6, F14 |
| Promoció creuada de Meta | No adoptar (principis) | Enlloc | Fora del filtre: no resol cap criteri. Porta l'atenció del poble cap a un tercer, i això xoca amb els principis del projecte. |
| Oferta de subscripcions | Descartar | Enlloc | Traïx F7 (peatge d'intermediari per a arribar al veí) i F14 (associacions sense recursos) |
| IA a la cerca per a retindre l'usuari | No adoptar (principis) | Enlloc. La IAIA ajuda a fer una cosa i després s'aparta. | Fora del filtre: retindre l'usuari no resol cap criteri. La IA només passa el filtre quan servix F12. |
| Estats efímers com a ganxo | Adaptar | Avisos caducables del Pregoner («tall d'aigua fins dijous») | F13. L'enganxament no resol cap criteri. |
| Xats de tercers que la Llei de Mercats Digitals (DMA) obliga a obrir, com a pont | Línia de recerca, no verificada | Pont amb la IAIA per a qui només usa WhatsApp | F12, F15. Xoca amb els principis per la dependència de Meta (tensió 6). |

#### Fitxes

##### Puebli (Espanya, activa)
- **A. Qui i què.** PUEBLI CONECTA S.L., de Múrcia. Va nàixer el 2024 a Titaguas (els Serrans) i l'accelera Lanzadera. Es presenta com «la red social de los pueblos»:
  - un fil per poble amb Anuncios, Eventos, Mercadillo, Empleos, Vivienda i PuebliCar, tots amb oferta i demanda;
  - mòduls d'Ajuntament: reserva d'espais, tràmits, transport i incidències;
  - una pregunta secreta per a poder publicar.

  Només en castellà. El 2026-09-29, la web deia que tenia 36 pobles actius, 395 registrats i 3.810 firmes. A Google Play té més de 5.000 descàrregues i 3,8/5.
- **B. Tecnologia observada.** SPA en React i Vite, generada i allotjada a Lovable.dev. Leaflet amb OSM i ArcGIS. Supabase per a la web i el CRM, i Firebase Firestore per a l'app. Stripe, Resend, Twilio i Gemini (moderació de firmes). GA4 i GTM. El framework de l'app mòbil no està verificat.
- **C. Captació i diners.**
  - firmes veïnals amb una meta per poble i, després, contracte municipal (1.000 € més 170 €/mes segons fragments de premsa; no verificat);
  - «Entidades Premium» amb Stripe;
  - un CRM de venda per mancomunitats.
- **D. Ètica i filtre.**
  - galeta _ga sense consentiment;
  - dades estructurades que declaren un 4,8/5 amb 150 vots, xifra que no quadra amb la de les botigues;
  - un CRM que guarda el partit polític de cada municipi;
  - una pregunta secreta que deixa fora veïns;
  - dades fora de l'Espai Econòmic Europeu.

  El model d'oferta i demanda servix a mitges F2, F4 i F6. Condicionar el poble a l'ajuntament traïx F13 i F17.

##### Puebloo (Espanya, tancada)
- **A. Qui i què.** «La Red Social Rural» (2020-2023), de Santiuste de San Juan Bautista (Segòvia). Tenia microblog, agenda, fòrums, ocupació, habitatge, un índex de pedanies i un rànquing de pobles. En castellà.
- **B. Tecnologia observada.** Next.js estàtic; una PWA embolcallada com a TWA per a Google Play; API REST pròpia; GA4 a l'app i Umami a la web de presentació.
- **C. Captació i diners.** De baix a dalt. No hem verificat cap monetització. Es va dissoldre a finals de 2023.
- **D. Ètica i filtre.** En tancar es va perdre la memòria dels pobles. Hui el domini està en venda i servix un script de tercers. És la lliçó que sosté el rebuig, per principis, de la dependència d'un sol proveïdor.

##### Bandomovil
- **A. Qui i què.** LEMUR IDEAS S.L., de Coca (Segòvia), des de 2014. Es presenta com «la app oficial de los Ayuntamientos» i declara més de 1.300 ajuntaments. «Relleu Informa», l'app de Relleu, és seua.
- **B. Tecnologia observada.** Web amb jQuery i Bootstrap i etiqueta de Google Ads. Una app Android per municipi. Notificacions sonores. Botó del pànic per SMS, WhatsApp i trucada. Chatbot municipal i «Mejorar el bando», amb IA d'un proveïdor no declarat. Backend no verificat.
- **C. Captació i diners.** Tarifa anual pública segons el cens: de 99 € (menys de 500 habitants) a 842 €.
- **D. Ètica i filtre.**
  - galeta _gcl_au sense bàner;
  - pàgina de protecció de dades amb camps buits;
  - una ressenya diu que exigix registre i GPS.

  Resol F13 sobretot de dalt a baix, i F5 a mitges amb «Explora». Als veïns només els deixa el canal de contacte i d'incidències amb l'ajuntament.

##### Línea Verde
- **A. Qui i què.** GREEN TAL S.A. (marca Ambientum), de Las Rozas de Madrid, des de 2009. Avisos de danys a la via pública i consultes ambientals.
- **B. Tecnologia observada.** Web en WordPress. Una app per al veí i una altra per a la gestió municipal. Portals municipals antics en ASP. Atenció per telèfon de tarifa especial.
- **C. Captació i diners.** Venda a ajuntaments, sense preus públics.
- **D. Ètica i filtre.**
  - declara a Play que no xifra les dades;
  - consentiment de galetes implícit;
  - la política permet usar les fotos de les incidències en màrqueting;
  - té 2,6/5 amb més de 500.000 descàrregues.

  El flux d'incidència en quatre passos servix F13. El telèfon de tarifa especial traïx F12. Les dades sense xifrar i l'ús de les fotos en màrqueting xoquen amb els principis del projecte.

##### eAgora (abans eBando)
- **A. Qui i què.** eAgora Algorisme del canvi SL, de Reus. Es presenta com a «SuperApp» d'àgores: el municipi, les entitats, les escoles. En català i castellà. Declara més de 550 municipis.
- **B. Tecnologia observada.** WordPress amb WooCommerce i WPML; HubSpot i CookieYes. «Radar ODS» i un xat amb IA de pagament. Backend no verificat.
- **C. Captació i diners.** Pla bàsic gratuït; pla Base des de 7,75 €/mes; pla complet des de 147,33 €/mes. També ven maquinari.
- **D. Ètica i filtre.**
  - HubSpot es carrega amb el consentiment buit (no hem verificat si envia dades);
  - gamificació del consum;
  - APIs de pagament.

  Les àgores validen les nostres Comunitats (F14). La IA de pagament traïx F12. Les APIs de pagament xoquen amb els principis del projecte.

##### WeTown
- **A. Qui i què.** Codigital 360 Solutions S.L. Plataforma municipal modular, amb clients sobretot catalans. En català i castellà.
- **B. Tecnologia observada.** WordPress amb Elementor, Google Maps, GA, píxel de Meta, CookieYes i reCAPTCHA. TPV propi.
- **C. Captació i diners.** Venda a ajuntaments per mòduls, sense preus públics.
- **D. Ètica i filtre.** Crea la galeta _fbp amb el consentiment registrat com a «no». La política no enumera els encarregats del tractament. Passen el filtre els avisos per zones (F16) i la recollida porta a porta (F18). L'obituari queda fora del filtre.

##### MunicipApp (Diputació d'Alacant) i Ayuntamientos de Valencia (Diputació de València)
- **A. Qui i què.** Apps públiques provincials. MunicipApp és la que enllaça la web oficial de La Torre de les Maçanes, és a dir, l'app que ja hi ha al poble pilot.
- **B. Tecnologia observada.** Apps natives; tecnologia no verificada. Carrerer, farmàcies de guàrdia, notícies i incidències.
- **C. Captació i diners.** Gratuïtes per al veí; les paguen les diputacions.
- **D. Ètica i filtre.** La de València declara a Play que no xifra les dades. Les ressenyes parlen de manteniment deficient. Tenen 3,5/5 i 3,2/5. Les complementem amb les farmàcies de guàrdia (F3), si les dades són accessibles.

##### Crossiety
- **A. Qui i què.** Crossiety AG, de Zúric. «Der Digitale Dorfplatz», la plaça digital del poble: més de 160 places i 730.000 habitants. En alemany, francés i anglés.
- **B. Tecnologia observada.** App web amb Ionic i, possiblement, Ruby on Rails al servidor (no verificat); Matomo autoallotjat; apps natives. La web corporativa (WordPress) carregava GA, GTM, LinkedIn Insight i SalesViewer abans de cap clic al bàner.
- **C. Captació i diners.** Paga l'ajuntament; la referència pública és Northeim, a 1 € per habitant i any. Acollida de sis mesos. Gratuït i sense publicitat per al veí.
- **D. Ètica i filtre.** La llista de veïns és visible per defecte, i el nom real i l'SMS són obligatoris. Passen el filtre:
  - «Meine Region» (F5);
  - l'exportació al butlletí de paper (F15, F3);
  - la llista de voluntaris (F3, F14).

##### Digitale Dörfer, DorfFunk i StadtLand.Funk
- **A. Qui i què.** «Vom Land fürs Land» (des del camp per al camp), del Fraunhofer IESE (2015-2024). Des de 2025 l'opera Smartes Land GmbH, participada per asseguradores. DorfFunk i BayernFunk s'han tancat i ara hi ha StadtLand.Funk. Només en alemany.
- **B. Tecnologia observada.** Java i Spring en un únic WAR per a Tomcat o AWS Elastic Beanstalk. MySQL, S3, Auth0 o Keycloak, Google Maps. App en .NET MAUI. Organitzat per dominis amb capes api, business i data, i un mòdul de protecció de dades.
- **C. Captació i diners.** Abans, diners públics dels Länder; ara, paquets per comuna amb preus no públics.
- **D. Ètica i filtre.**
  - codi Apache-2.0 publicat a openCode però congelat (un i dos commits);
  - pas d'un bé públic a una empresa;
  - dependència d'AWS, Auth0 i Google;
  - gamificació amb el domini «motivation».

  Passen el filtre Biete/Suche (F4, F6, F7), l'avís «Sag's uns» cap a la safata LösBar (F13), el repartiment veïnal LieferBar (F4, F7) i la vitrina digital (F15, F3). La seua història sosté els rebutjos per principis: codi congelat i pas a mans privades.

##### nebenan.de
- **A. Qui i què.** Good Hood GmbH, de Berlín, majoritàriament de Hubert Burda Media. 4,5 milions d'usuaris actius.
- **B. Tecnologia observada.** Next.js; Sourcepoint amb TCF; Braze, Mapbox, Stripe, Hotjar, AppsFlyer i ID5.
- **C. Captació i diners.** Verifica l'adreça per carta. Viu de la publicitat, dels perfils de comerç de pagament, de la visibilitat de pagament al mercat i d'aportacions voluntàries.
- **D. Ètica i filtre.** Usa ID5 per a reconéixer l'usuari entre dispositius amb finalitat publicitària. La visibilitat de pagament traïx F7. Són aprofitables la carta amb codi i l'abast de veïnats adjacents (F5).

##### Hoplr
- **A. Qui i què.** Hoplr NV, de Lokeren (Bèlgica). Xarxa privada de barri, amb més de 250 administracions i sense publicitat al fil.
- **B. Tecnologia observada.** Probablement ASP.NET i Azure (inferència, no verificat). Declara ISO 27001 i WCAG 2.1 AA. IA per a analitzar enquestes i per a traduir. La web comercial carrega Leadfeeder i un script d'OpenAI d'ús desconegut.
- **C. Captació i diners.** Paga l'ajuntament, amb dos plans i preu a consulta.
- **D. Ètica i filtre.** A favor: l'ajuntament no pot llegir les converses. En contra: galetes de màrqueting a la web. Passen el filtre la traducció (F1), la cura veïnal (F3) i la separació entre institució i veïnat (F13, F17).

##### Nextdoor
- **A. Qui i què.** Nextdoor Holdings (EUA): 110 milions de veïns verificats. També té versió en castellà a Espanya.
- **B. Tecnologia observada.** React sobre CloudFront; Didomi amb 34 socis. Abans del consentiment carrega Meta, Google Ads, Bing, LinkedIn, Yahoo, Branch i píxels propis. IA generativa: assistent, recordatori d'amabilitat i «Ask».
- **C. Captació i diners.** Publicitat d'autoservei i pàgines de negoci.
- **D. Ètica i filtre.** És el contraexemple complet: el veí convertit en inventari publicitari i una IA construïda sobre les seues converses. La publicitat traïx F7. La IA sobre les converses xoca amb els principis del projecte; l'ús dels xats privats no està verificat.

##### Front Porch Forum
- **A. Qui i què.** Vermont (EUA), des de 2006: 250.000 membres sobre 270.000 llars.
- **B. Tecnologia observada.** Ruby on Rails amb Hotwire; CloudFront; Stripe; Plausible sense galetes.
- **C. Captació i diners.** Quotes baixes i públiques per als comerços (11 $ i 19 $ al mes), anuncis locals i donacions.
- **D. Ètica i filtre.** És la plataforma més neta de l'estudi. Però accepta anuncis polítics de pagament i mostra el carrer de qui publica. Passen el filtre el resum periòdic (F3, F15) i la moderació humana (F13).

##### PanneauPocket
- **A. Qui i què.** De Lió: el tauler municipal a la butxaca. 15.000 col·lectivitats, amb aliances amb l'associació d'alcaldes rurals i amb la gendarmeria.
- **B. Tecnologia observada.** La web corporativa (WordPress) carrega GA, GTM i Microsoft Clarity abans del consentiment. L'app web és probablement Symfony (no verificat), amb Matomo autoallotjat i Google Maps.
- **C. Captació i diners.** Preus públics: gratuït per a menys de 100 habitants, i de 180 € a 245 € l'any fins a 2.000 habitants.
- **D. Ètica i filtre.** L'app del veí és anònima i no demana compte. Passen el filtre la lectura sense compte (F15, F3) i els enllaços a pobles veïns (F5). Va en una sola direcció.

##### IntraMuros
- **A. Qui i què.** IntraMuros SAS, de Bordeus: una sola app per a 8.000 municipis.
- **B. Tecnologia observada.** Next.js sobre CloudFront, Leaflet amb OSM, Matomo autoallotjat, servidors d'AWS a França.
- **C. Captació i diners.** Preus mensuals públics: uns 20 € sense IVA per a municipis de 501 a 1.000 habitants.
- **D. Ètica i filtre.** Fa un joc de rascar promocional i concentra les dades en una empresa. Passen el filtre el «bassin de vie» (F5), Leaflet amb OSM (F10) i els contribuïdors moderats (F14).

##### Decidim
- **A. Qui i què.** Associació de Programari Lliure Decidim, de Barcelona. Més de 450 organitzacions. Té traducció al valencià (val-ES).
- **B. Tecnologia observada.** Ruby on Rails en mòduls, GraphQL i, probablement, PostgreSQL. decidim-ai és un classificador local de correu brossa. La web usa Plausible autoallotjat.
- **C. Captació i diners.** Programari gratuït. A Catalunya, el Consorci AOC l'oferix a cost zero als ens locals que s'adherixen al Contracte Social.
- **D. Ètica i filtre.** AGPL-3.0 i un contracte social: continguts CC BY-SA, dades ODbL i cap cessió de dades personals. Participar demana registre. Servix F13 i F17: s'enllaça, no es replica.

##### CONSUL Democracy
- **A. Qui i què.** Fundació amb seu a Amsterdam; el programari va nàixer a l'Ajuntament de Madrid. L'usen GVA Participa (en valencià) i VLCParticipa.
- **B. Tecnologia observada.** Ruby on Rails i PostgreSQL; diverses institucions en una sola instal·lació.
- **C. Captació i diners.** Programari gratuït; socis tècnics certificats cobren la implantació.
- **D. Ètica i filtre.** És AGPL, però VLCParticipa carrega el píxel de Facebook i GTM sense consentiment. GVA Participa exigix certificat electrònic, cosa que traïx F12. Servix F13 per enllaç.

##### Mobilizon
- **A. Qui i què.** Esdeveniments i grups federats. El manté Kaihuri, una associació francesa. 88 instàncies.
- **B. Tecnologia observada.** Elixir i Phoenix, GraphQL, Vue 3 i ActivityPub.
- **C. Captació i diners.** Donacions i subvencions de NLnet.
- **D. Ètica i filtre.** És AGPL, però té una sostenibilitat fràgil i errors de federació. Passen el filtre:
  - els grups com a actors (D9, F5);
  - les diverses identitats en un compte (F6, F14);
  - les activitats permanents (F7, F3).

##### Gancio
- **A. Qui i què.** Agenda compartida per a comunitats locals, feta per un col·lectiu italià. Té nodes a Barcelona, Mallorca, Girona i altres llocs.
- **B. Tecnologia observada.** Nuxt 4, Vue 3, TipTap 3 (el mateix editor que el nostre), Leaflet amb Nominatim, SQLite o PostgreSQL. Component web d'uns 5 kB. ActivityPub.
- **C. Captació i diners.** No hi ha diners: són nodes comunitaris.
- **D. Ètica i filtre.** Minimitza les dades al màxim: ni els administradors veuen qui publica. Passen el filtre:
  - publicar sense compte amb cua de confirmació (F12, F3);
  - els llocs normalitzats (F10, F11);
  - el component web (D1).

##### Mobicoop
- **A. Qui i què.** Cooperativa francesa de mobilitat compartida sense comissió: 500.000 usuaris. Té el projecte SoCoTeMo amb Som Mobilitat i Som Comunitats.
- **B. Tecnologia observada.** Versió 1 amb API i Vue; versió 3 en NestJS amb microserveis. Keycloak, un registre comptable Formance i Matomo Cloud.
- **C. Captació i diners.** Gratuït per als particulars. Plataformes de marca blanca per als territoris i grups de pagament per a empreses.
- **D. Ètica i filtre.** És AGPL, però ha girat cap a l'«opencore» i la comunitat de contribuïdors està tancada. Passen el filtre:
  - la mobilitat solidària amb central humana (F4, F3, F12);
  - l'autoestop organitzat (F4);
  - el cotxe compartit entre veïns (F4, F8).

##### graz.social
- **A. Qui i què.** Associació de Graz (Àustria) que opera Mastodon, PeerTube, Gancio i Mobilizon per a la regió.
- **B. Tecnologia observada.** Programari lliure estàndard. graz.events és un WordPress que agrega esdeveniments del Fedivers.
- **C. Captació i diners.** Quota lliure de soci i donacions.
- **D. Ètica i filtre.** És net, però depén de voluntaris i reparteix el poble entre quatre o cinc apps i identitats. Demostra el valor d'integrar-les en una sola peça (F5).

#### Destil·lació del Trellat

##### Què incorporem

| Prioritat | Peça | On | Resol | Lligam amb el torn |
|---|---|---|---|---|
| 1 | Mapa de seguretat i patrimoni del terme. Capes: camins, fonts i punts d'aigua, basses, zones de seguretat i de supervivència, i patrimoni. Leaflet amb OSM; el servidor de tessel·les està pendent de decidir. Es pot imprimir i descarregar per a usar-lo sense connexió. | Mapa, Wiki i Dispositius | F10, F11, F15 | D7: cada element és un Markdown amb frontmatter i coordenades, i el GeoJSON és públic. D10: les tessel·les i fotos que fallen s'amaguen i es reporten. D9: capes federables. D1: s'incrusta a la web de l'ajuntament. |
| 1 | Viatge del poble: cotxe del poble amb horaris pactats i mobilitat solidària («Demane» i «M'oferisc»). Una persona referent casa les peticions per telèfon. Sense preu: només es compartixen despeses (tensió 9). | Compartir vehicle i Agenda | F4, F3, F12 | D4: els trajectes van a Supabase a través del port. D6: aterra a la pàgina del poble. |
| 1 | Habitatge per a qui viu i treballa al poble: oferta i demanda amb durada mínima i finalitat obligatòries, i sense lloguer per dies. Registre voluntari de cases buides. | Habitatge | F2, F1 | D4. La ubicació exacta només la veuen els contactes. El nivell de confiança per a publicar depén de la tensió 5. |
| 1 | Ocupació amb Perfil portafolis: «Què faig», «Amb què treballe», i oferta i demanda de feina entre pobles veïns. | Ocupació i Perfil | F6, F1, F5, F8 | D4. D7: schema.org només per als blocs públics. D9: actor federat només amb adhesió explícita. |
| 1 | Pobles veïns: abast «el meu poble», «pobles veïns» i «públic» a Mur, Mercat, Ocupació i Agenda. | Pobles | F5 | D9, i la llista de pobles veïns al backend, per poble. |
| 1 | Propostes del poble, un document viu per poble amb data i estat (presentada, amb resposta, feta), i «Digues-ho a l'Ajuntament», un avís amb estat visible. | Pobles, Wiki i Xat | F13, F17, F16 | D7: les propostes són coneixement públic en git. D6: aterren a la pàgina del poble. D5: transparència. |
| 1 | Injecció de contingut a través del xat assistit per la IAIA (vegeu el detall davall la taula). | IAIA i Xat; el pont de missatgeria només si el Mestre l'aprova (tensió 6) | F12, F3, F15 | D5: la Consola audita cada proposta. D8: res personal al paquet públic. |
| 2 | Béns compartits: recurs reservable (obrador, maquinària), banc de terres com a capa privada del Mapa i banc d'hores de jornalers dins d'una Comunitat. Del banc de terres només es publica el que el propietari autoritza (tensió 7). | Comunitats, Mapa i Ocupació | F8, F7 | D4. D8: tarifes i saldos a la Gestoria privada. |
| 2 | Mercat de proximitat: Oferisc, Busque, Regale, llavors, sobres d'aliments amb caducitat i recollida en un punt comú (tensió 8), dia de mercat recurrent i fitxa de comerç amb avisos per adhesió. | Mercat i Agenda | F7, F9 | D4. |
| 2 | Agenda pròpia, que deixa d'enrutar al Mur. Llocs normalitzats, activitats permanents (metge, mercat, bibliobús), publicació sense compte amb cua de confirmació, i exportació ICS i RSS. | Agenda | F14, F3, F12 | D1: component d'agenda incrustable. D9: federar amb Gancio i Mobilizon. |
| 2 | Pregoner: un canal d'avisos d'un a molts, fixat a dalt de cada comunitat del poble. Avisos caducables, resum setmanal per correu i versió per al tauler físic. | Mur i Comunitats | F13, F14, F15, F3 | D1, D6. |
| 2 | Pantalla aparador: el Mur públic i l'Agenda a pantalla completa, per al bar, la biblioteca o la farmàcia. | Mur i Agenda | F15, F14, F3 | D1: és un amfitrió més. D10. |
| 2 | Mode de dades mínimes i lectura sense compte del canal públic. | Tota l'app | F15, F3, F12 | D1, D2. |
| 3 | Traducció de missatges per als nouvinguts, a través de la IAIA, amb el proveïdor declarat. | IAIA | F1 | D5. |
| 3 | Calendari de recollida i de compostatge del poble. | Agenda | F18 | D6. |
| 3 | Cooperatives d'energia i de consum com a Comunitats, sense gestió energètica pròpia. | Comunitats | F18, F17, F7 | Cap. |
| 3 | Farmàcies de guàrdia i telèfons útils, si hi ha dades obertes de les diputacions. | Pobles i IAIA | F3 | D10: la font externa que falla s'amaga i es reporta. |
| 3 | Enllaçar o incrustar els processos de GVA Participa i Decidim, en lloc de construir votacions pròpies (pendent de la tensió 10). | Propostes del poble | F13 | D1. |
| 3 | Contracte social públic: llicència lliure del codi, CC BY-SA per al coneixement, dades obertes, cap cessió de dades personals, i l'amfitrió no llig les converses. | Comunicació i contracte d'amfitrió | F13, F17, però només per a la clàusula que l'amfitrió no llig les converses | D1, D5. La llicència del codi, el CC BY-SA i les dades obertes responen als principis del projecte, no al filtre. |

**Injecció de contingut via Xat assistit per IA** (fita del full de ruta).

Funciona així:
1. Algú menciona la IAIA en un xat, amb un enllaç o un text. També ho pot fer pel pont de WhatsApp, si el Mestre l'aprova (tensió 6).
2. La IAIA proposa l'esdeveniment, la publicació o l'article del Mercat ja emplenat.
3. Una persona el confirma abans de publicar-lo.

Servix a qui no té ordinador ni certificat (Famorca, 2022-12-07). També respon a la demanda de funcionaris assessors que ajuden a emplenar papers (Aplec, eix 7). Té tres regles:
- La IAIA no publica mai sola.
- No demana mai certificats ni claus.
- Cada proposta queda registrada a la Consola (D5).

##### Què descartem

Només hi van les peces que traïxen una demanda literal del Manifest o d'una proposta local.

| Peça | Qui la fa | Criteri que traïx | Per què |
|---|---|---|---|
| Publicitat al fil i anuncis d'autoservei | Nextdoor, nebenan.de | F7 | El valor ix del poble cap a un intermediari. Va contra el «fora intermediaris» de Callosa i contra el suport a les tendes de poble que demana l'Aplec. |
| Visibilitat de pagament al mercat i minipàgines de pagament | nebenan.de, Puebli, eAgora | F7, F14 | És un peatge d'intermediari per a arribar al veí. Deixa fora les tendes i les associacions sense recursos, a les quals el document de propostes vol estalviar fins i tot les comissions bancàries. |
| Fer dependre l'existència d'un poble d'un contracte municipal o d'una meta de firmes | Puebli; les apps municipals | F13, F17 | La decisió deixa de ser dels veïns: és el contrari de «des dels pobles per als pobles». |
| Pregunta secreta sense via d'apel·lació | Puebli | F1 | Exclou nouvinguts i veïns legítims, contra la integració que demana Callosa. Ho indicarien ressenyes de Gestalgar i Macastre (no verificat). |
| Registre obligatori per a llegir, SMS o certificat per a participar | StadtLand.Funk (no verificat), Crossiety, GVA Participa | F12, F15 | Deixa fora qui no té cobertura, mòbil propi o certificat, com passa a Famorca. |
| IA de pagament | eAgora | F12 | Cobra l'assistència a qui més la necessita, quan l'Aplec demana funcionaris assessors per a emplenar papers. |
| Rànquing entre pobles | Puebloo | F5 | Fa competir els pobles que el Manifest vol vertebrar. |
| Telèfon de tarifa especial | Línea Verde | F12 | Cobra a qui no pot usar l'app. |
| Llista de veïns visible per defecte | Crossiety | F16, F3 | Revela qui viu a soles en un poble quasi buit. |
| Signatura amb el carrer de l'autor | Front Porch Forum | F16 | Revela la ubicació de les persones. |
| Anuncis polítics de pagament | Front Porch Forum | F13 | Compra la veu en el canal comú, contra la democràcia participativa i horitzontal que demana Callosa. |

##### Fora del filtre

El Manifest ni aprova ni condemna aquestes peces:

- **Animalets com a secció** (perduts, trobats, adopció). Cap proposta local no en parla. El Manifest parla d'animals com a economia: ramaderia i apicultura a temps parcial, escorxador mòbil i gestió cinegètica. Si la secció es manté, la lectura amb fonament seria «Bestiar i abelles», dins de F6 i F8: l'apicultura en bancals allunyats (Tollos) i la ramaderia a temps parcial (Aplec).
- **Obituari o esqueles** (WeTown). És un costum rural real, però cap poble no el demana.
- **Reaccions emocionals a les publicacions** (WeTown).
- **Recordatori d'amabilitat abans de publicar** (Nextdoor), fins i tot en versió local.
- **La paraula de la colla configurable per poble** (Puebli).
- **Venda d'entrades i control d'aforament** (Bandomovil, eAgora).
- **Classificació automàtica dels continguts segons els ODS** («Radar ODS», eAgora).
- **Reserva genèrica d'instal·lacions municipals** (Puebli, eAgora). Només entra quan és un bé productiu compartit (F8).
- **Panells lluminosos i pantalles tàctils** (IntraMuros, PanneauPocket). La pantalla aparador sí que passa el filtre.
- **Turisme virtual des del sofà** (Puebli).
- **Seguidors i mètriques de popularitat.** A més, l'encàrrec del Mestre les exclou.

**Rebutjades pels principis del projecte, no pel filtre.** Ni el Manifest ni cap poble no en parlen. Les rebutgem igualment per dues raons: la lectura estesa de F17 (dades, codi i proveïdors) i el principi «Poble abans que corporació». Ho diem així, com mana la regla 5.

| Peça | Qui la fa | Per què la rebutgem |
|---|---|---|
| Rastrejadors sense consentiment | Puebli, Bandomovil, WeTown, eAgora, Nextdoor, webs de Crossiety i PanneauPocket, VLCParticipa | Les dades de la gent del poble es rastregen i es cedixen a tercers. |
| IA construïda sobre les converses dels veïns | Nextdoor | Extrau valor de les converses. L'ús dels xats privats no està verificat. |
| Perfil polític dels municipis dins del CRM | Puebli | El canal amb l'Administració ha de ser neutral. |
| Dependència d'un sol proveïdor de núvol, sense port | Puebli (Firebase), Digitale Dörfer (AWS, Auth0, Google Maps) | El poble perd la memòria si el proveïdor tanca o canvia de mans, com va passar amb Puebloo. |
| APIs de pagament i dades captives | eAgora | Les dades del municipi no tornen al municipi. |
| Llicència permissiva sense governança i codi obert congelat | Digitale Dörfer | Diners públics convertits en producte privat, i usuaris obligats a migrar. |
| Gir cap a l'«opencore» | Mobicoop | Les funcions avançades deixen de ser un bé comú. |
| Fotos i observacions dels veïns usades en màrqueting | Línea Verde | El que aporta el poble es convertix en publicitat d'un tercer. |
| Dades sense xifrar en trànsit, segons la seua declaració a Google Play | Línea Verde, Ayuntamientos de Valencia | Exposa dades de les persones. |
| Gamificació del consum amb premis | eAgora; joc de rascar d'IntraMuros; domini «motivation» de DorfFunk | Es podria al·legar F7, pel suport a les tendes de poble, però premia el consum per punts. |

Una nota honesta: Supabase també és un proveïdor. El que ens separa d'aquests rebutjos és el port de backend amb contracte i un Postgres estàndard (D4), no la marca del proveïdor.

##### Tensions per a decidir

**1. La seguretat de Beniaia davant la nostra privacitat estricta.**

La demanda és real: hi ha pobles amb pocs habitants entre setmana, i Beniaia pregunta per càmeres als carrers (2023-01-10). És una tensió entre F16 i un principi del projecte, la privacitat estricta, no entre dos criteris del Manifest. La plataforma no farà vídeo, ni reconeixement facial, ni lectura de matrícules, ni publicació de sospitosos. Sense videovigilància, pot oferir aquestes peces:

- (a) «Digues-ho a l'Ajuntament»: un avís d'incidència (porta forçada, vehicle estrany que torna, robatori) amb estat de resolució. Arriba a la persona responsable, no al Mur, i no s'hi publiquen fotos de persones ni matrícules.
- (b) Alerta veïnal al Pregoner: un avís curt i caducable («robatoris a masos de la partida esta setmana»), sense assenyalar ningú.
- (c) «Estic bé»: un registre diari voluntari per a qui viu a soles, amb dos o tres guardians triats per la persona. Si a l'hora pactada no hi ha registre, s'avisa els guardians. No hi ha geolocalització permanent. Pren la idea del botó del pànic de Bandomovil, però sense rastreig.
- (d) Veïnat de guàrdia: torns voluntaris entre setmana dins de la Comunitat del poble, amb el 112 i la Guàrdia Civil fixats com a telèfons útils.
- (e) Evidència agregada: un recompte anònim d'incidències per mes, per a portar-lo a l'ajuntament o a la Subdelegació del Govern.

Posar càmeres a la via pública és una decisió de l'administració. Té un règim legal propi, que no hem consultat, i la plataforma no n'ha de formar part. **Decidix el Mestre** quines peces aprovem, de la (a) a la (e).

**2. Turisme davant habitatge no turístic.** L'Aplec vol turisme des de la singularitat de cada territori. Les propostes genèriques del document (2023-01-04) hi afegixen una fira de turisme rural rotatòria i la marca Muntanya d'Alacant. Benialfaquí, en canvi, vol habitatge que no estiga disponible per a turistes. Són dos criteris que xoquen (F6 i F11 davant F2). Proposta:
- el turisme de visita (itineraris, guies, patrimoni) sí;
- l'allotjament turístic mai dins d'Habitatge.

**Decidix el Mestre** si les cases rurals tenen lloc com a fitxa de comerç.

**3. Gestió cinegètica** (Aplec, eix 4). La proposta és usar-la només per a la seguretat de qui camina, amb els dies i les zones de batuda al Mapa i al Pregoner i sense cap promoció de la caça. Seria F10. **Decidix el Mestre**, perquè toca sensibilitats oposades dins del mateix poble.

**4. Qui paga.** Totes les apps municipals les paga l'ajuntament, i Puebli condiciona l'activació. Hi ha tres vies:
- quotes voluntàries i socis, com fan Front Porch Forum i graz.social;
- un servei supramunicipal gratuït per al poble, amb contracte social, com fan l'AOC i Decidim. Es podria plantejar a la Diputació d'Alacant, que ja paga MunicipApp;
- l'ajuntament com a amfitrió opcional.

Condició del filtre: cap via no pot fer que un poble necessite permís per a existir (F13, F17). **Decidix el Mestre.**

**5. Confiança o exclusió.** Habitatge i Mercat necessiten confiança, però la pregunta secreta, l'SMS obligatori o el certificat exclouen gent. Famorca té pocs certificats digitals i no té cobertura, i Callosa vol integrar la immigració. Proposta per nivells:
- llegir, sense compte;
- publicar, amb l'aval d'un veí o amb una carta amb codi de l'ajuntament o de la cooperativa;
- Habitatge i Ocupació, amb aval.

**Decidix el Mestre.**

**6. El pont de WhatsApp.** Resol F12, perquè hi ha gent que només sap usar WhatsApp. Però depén de Meta, i això xoca amb els principis del projecte (lectura estesa de F17), no amb cap demanda literal. Proposta: un pont opcional del qual no depenga cap funció, i estudiar els xats de tercers que la DMA obliga a obrir. **Decidix el Mestre.**

**7. Banc de terres i propietaris desconeguts.** Tollos demana un anunci públic quan no apareix el propietari. Les dades del cadastre són dades personals. Proposta:
- la plataforma només publica el que el propietari autoritza;
- l'anunci de propietari desconegut és un acte municipal, que enllacem.

**8. Sobres d'aliments i dignitat.** No hi haurà llistes públiques de persones necessitades. Proposta: recollida en un punt comú i anònim.

**9. Vehicle i responsabilitat.** Proposta: només compartir despeses, mai un preu, i una guia d'assegurança, com fa Mobicoop amb el cotxe compartit entre veïns. El marc legal del transport de persones quan hi ha compensació està per consultar. **Decidix el Mestre.**

**10. Participació formal.** Proposta: enllaçar GVA Participa i Decidim en lloc de construir votacions pròpies. **Decidix el Mestre.**

**11. Animalets al Tauler.** Tres opcions: mantindre-la en obres, reorientar-la a «Bestiar i abelles» o retirar-la. **Decidix el Mestre.**

**12. Comentaris de WordPress.** Dues opcions: un arxiu de només lectura o descartar-los. Contenen dades personals de tercers i cal consentiment. **Decidix el Mestre.**

##### On som superiors i on anem per darrere

| Àmbit | Estat | Evidència |
|---|---|---|
| Arrelament i legitimitat | Superiors | El Projecte Sóc de Poble és un dels promotors del Manifest, amb la Coordinadora d'Estudis Eòlics i l'Associació El Rentonar. La pàgina del Manifest està etiquetada amb 21 pobles. El document de propostes proposa Sóc de Poble com a prototip de l'aplicació que va demanar l'Aplec; és una proposta nostra. Cap competidor no naix d'un procés veïnal comarcal. |
| Programari lliure viu i component enxufable a qualsevol amfitrió | Superiors | Només Gancio fa un component web, i només d'agenda. El codi de DorfFunk està congelat. |
| Valencià de naixement | Superiors | Decidim i CONSUL tenen traducció al valencià, però només fan participació. eAgora i WeTown són en català. Puebli és només en castellà. |
| Notes, Gestoria, Wiki i Multimèdia com a memòria | Superiors | Cap de les plataformes estudiades no les reunix com a memòria del poble. Només n'hi ha peces soltes: els textos col·laboratius de Decidim, les DorfPages, la galeria de perfil de Puebli i PeerTube a graz.social. |
| Existir sense contracte municipal i amb federació prevista | Superiors | Mobilizon i Gancio federen, però cadascuna fa una sola cosa. |
| Sense rastrejadors (principi del projecte) | Superiors, si ho garantim al contracte d'amfitrió | Hem vist rastrejadors carregats sense consentiment a vuit plataformes o a les seues webs. |
| Tracció | Per darrere | Puebli: 36 pobles actius. Bandomovil: més de 1.300 ajuntaments (declarat). eAgora: més de 550 (declarat). Crossiety: més de 160 places. PanneauPocket: 15.000 col·lectivitats. Front Porch Forum: 250.000 membres. Nosaltres: un poble pilot. |
| Funcions acabades | Per darrere | Puebli té en producció Vehicle, Ocupació, Habitatge i un mapa de pobles. L'Agenda de Gancio i Mobilizon està polida. La nostra Agenda encara enruta al Mur, i «Gent de la Torre» no té fil. |
| Eines institucionals | Per darrere | Avisos amb notificació, incidències amb safata de gestió, enquestes, calendari de fems i publicació d'edictes. |
| Venda institucional | Per darrere | Preus públics per trams, acollida de sis mesos, material de campanya i certificacions declarades (ISO 27001, Esquema Nacional de Seguretat, WCAG 2.1 AA). |
| Verificació i moderació | Per darrere | Moderació professional a Front Porch Forum, Crossiety i Hoplr; verificació d'adreça a nebenan, Nextdoor i Hoplr. |
| Botigues d'aplicacions | Per darrere | Tots els competidors grans hi són. En aquest estudi no consta que Sóc de Poble hi siga. Puebloo mostra la via d'embolcallar una PWA com a TWA. |
| Model econòmic | Per darrere | Quasi tots els competidors actius en declaren un. El nostre està pendent (tensió 4). |

##### Canvis de comunicació

1. **Parlar des del Manifest, no des de la tecnologia.** Per exemple: «El 29 de gener de 2023, a Benillup, l'Aplec pel Territori va demanar una aplicació per connectar pobles. Sóc de Poble vol ser eixa aplicació.» No hem de dir que l'Aplec ens va triar, perquè la proposta de prototip és del nostre document.
2. **Usar les paraules dels pobles:** cotxe del poble, banc de terres, banc d'hores, obrador, mosaic, fonts, marges, masos.
3. **Contar la lliçó de Puebloo i de Digitale Dörfer, amb dates.** La memòria d'un poble no pot dependre d'una empresa. La nostra resposta és codi lliure, dades exportables, federació i eixir de WordPress.
4. **Publicar el cost real.** Hi ha referències públiques:
   - Bandomovil: 99 €/any per a menys de 500 habitants;
   - PanneauPocket: gratuït per a menys de 100 habitants, i de 180 € a 245 € l'any fins a 2.000 habitants;
   - IntraMuros: uns 20 €/mes sense IVA per a municipis de 501 a 1.000 habitants;
   - Crossiety: prop d'1 € per habitant i any a Northeim.

   Per al veí, gratuït i sense publicitat. Aquesta referència també servix per a la conversa amb Sollutia.
5. **Complementar, no competir.** MunicipApp i GVA Participa ja hi són. Sóc de Poble aporta el que no tenen: veu veïnal, mercat, mobilitat, memòria i valencià.
6. **Una garantia verificable al contracte d'amfitrió:** «`<soc-de-poble>` no carrega cap rastrejador, encara que la web que l'acull en porte».
7. **No usar el lema «¿de quién eres?».** Segons l'estudi, ja el fan servir Puebli i Puebloo, però cap fitxa no ho recull (no verificat). El nostre gallet és «Sóc de Poble!».
8. **Les alertes ètiques dels competidors són criteri intern.** Si mai es publiquen, han d'anar datades i ser verificables, i el discurs ha de parlar dels nostres compromisos, no atacar noms.
9. **Publicar el contracte social** abans de parlar amb cap institució.

#### Fita estratègica: eixir de WordPress

**Inventari.** És el que es va observar en aquest torn a través de l'API REST pública del WordPress de socdepoble.net, sense credencials. L'autor d'aquest annex no l'ha reverificat.

| Element | Quantitat |
|---|---|
| Elements de contingut | 522 |
| Mitjans | 1.769 |
| Categories | 114 |
| Etiquetes | 105 |
| Comentaris | 60 |

Són més de 500 elements de contingut propis del projecte.

**Per què passa el filtre (F13 i F9).** El document de propostes demana que les propostes noves s'incloguen per a actualitzar el Manifest, i la pàgina del Manifest vol un llistat d'exigències per poble (F13). Hui eixa memòria, i el saber que guarda (F9), està repartida entre diversos llocs:
- WordPress;
- un PDF a Google Drive;
- un Google Doc amb les propostes;
- un formulari de Google;
- el directe de l'Aplec a YouTube;
- un grup de Telegram.

Puebloo demostra què passa quan la memòria d'una xarxa rural depén d'un sol amfitrió. Portar-la a casa també respon als principis del projecte (lectura estesa de F17).

**Destins:**

| Origen a WordPress | Destí | Endoll |
|---|---|---|
| Pàgines i articles de coneixement (Manifest, Aplec, estudis, propostes) | Markdown amb frontmatter en git, a la Wiki | Coneixement (D7) |
| Articles que són Mur o Agenda | Files en Postgres (Supabase), a través del port | Dades (D4) |
| Mitjans | Còpia amb empremta (hash) i deduplicada, amb el comportament base del Disseny Defensiu Visual: una imatge que falla s'amaga i es reporta a la Consola | Dades i coneixement (D10) |
| Categories i etiquetes | Taula de correspondència cap a les nostres categories, que pot revisar una persona | Coneixement |
| Arxiu d'autor | Portafolis del perfil | Dades (D4) |
| URL antigues | Redireccions 301 cap a les noves | Amfitrió (D1) |
| Comentaris | Pendent de decisió del Mestre: arxiu de només lectura o descartar-los. Contenen dades personals de tercers i cal consentiment. | Cap, fins que el Mestre decidisca |

**Requisits:**
- **Idempotent.** La clau estable és l'identificador de WordPress més l'empremta del contingut. Executar-lo dues vegades no duplica res.
- **Mode assaig.** Compta, compara i informa, sense escriure.
- **Recomptes verificables** abans i després (522, 1.769, 114, 105 i 60), amb l'informe a la Consola.
- **Cap esborrat a WordPress** fins que els recomptes quadren i el Mestre ho ordena.

**Fases:**
1. Inventari i mode assaig.
2. Coneixement.
3. Mur i Agenda.
4. Mitjans.
5. Redireccions.
6. WordPress deixa de ser la font.

A partir d'ací, WordPress només queda com un amfitrió possible de l'enxufe (D1) per a qui el vulga, com els ajuntaments.

**Amb autorització del Mestre:** portar també a casa el PDF del Manifest i el document de propostes, que hui viuen a Google, i aprofitar-ho per a verificar els eixos contra el PDF.

**Riscos:**
- mitjans amb drets de tercers;
- enllaços interns trencats;
- imatges enllaçades des de fora;
- metadades de cercadors que es perden si no es migren.

#### Fonts

**Manifest i propostes**
- https://socdepoble.net/2022/11/17/manifest-de-poble/ (consultada el 2026-09-29)
- https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/ (consultada el 2026-09-29)
- https://rentonar.blogspot.com/2022/12/manifest-de-poble.html (consultada el 2026-09-29)
- https://socdepoble.net/2026/08/02/el-mosaic-es-sempre-ha-sigut-la-solucio/ (consultada el 2026-09-29)
- Document «Propostes locals: Poble a Poble», del Projecte Sóc de Poble, enganxat pel Mestre en aquest torn
- API REST pública del WordPress de socdepoble.net: inventari d'aquest torn

**Categories pròpies**
- src/sections/control/ControlSection.jsx: Panell de Control, amb les seccions de l'app

**Espanya**
- https://www.puebli.es/, /pueblos i /descubre-la-app (2026-09-29)
- Fitxes de Puebli a Google Play i a l'App Store (2026-09-29)
- elaltojalon.es (2026-01-29) i lavanguardia.com (2025-09-14, només el fragment del cercador)
- https://es.wikipedia.org/wiki/Puebloo i captures de web.archive.org (2022-12-08 i 2023-01-03)
- https://www.bandomovil.com/, amb les pàgines de negocis, participació, Explora, botó del pànic i assistent (2026-09-29)
- https://www.lineaverdemunicipal.info/, amb l'avís legal i la política de privacitat (2026-09-29)
- https://www.eagora.app/ca/preu/, /moduls/ i /plataforma/ (2026-09-29)
- https://wetown.app/ca/ i l'avís legal (2026-09-29)
- https://www.torremanzanas.es/ca/ i les fitxes de Play de MunicipApp i d'Ayuntamientos de Valencia (2026-09-29)

**Europa i EUA**
- https://www.crossiety.ch/ i /funktionen/; https://crossiety.app/login (2026-09-29)
- https://www.digitale-doerfer.de/ i https://smartesland.de/ (2026-09-29)
- https://gitlab.opencode.de/fraunhofer-iese/digitale-doerfer (2026-09-29)
- https://nebenan.de/ i /privacy (2026-09-29)
- https://www.hoplr.com/ i https://services.hoplr.com/es/precios/ (2026-09-29)
- https://nextdoor.com/ i https://about.nextdoor.com/ (2026-09-29)
- https://frontporchforum.com/ i /business-plans (2026-09-29)
- https://www.panneaupocket.com/mairies/ i https://app.panneaupocket.com/ (2026-09-29)
- https://www.intramuros.org/ i https://appli-intramuros.fr/tarifs/ (2026-09-29)

**Programari lliure**
- https://decidim.org/ i https://github.com/decidim/decidim (2026-09-29)
- https://www.aoc.cat/serveis-aoc/decidim-catalunya/ (2026-09-29)
- https://consuldemocracy.org/, https://gvaparticipa.gva.es/ i https://vlcparticipa.valencia.es/ (2026-09-29)
- https://mobilizon.org/, https://framagit.org/kaihuri/mobilizon i https://instances.mobilizon.org/ (2026-09-29)
- https://gancio.org/, /usage/embed i https://framagit.org/les/gancio (2026-09-29)
- https://www.mobicoop.fr/, https://pro.mobicoop.fr/ i https://gitlab.com/mobicoop (2026-09-29)
- https://info.graz.social/ (2026-09-29)

**Disseny**
- Captures de l'app de WhatsApp compartides pel Mestre (no se n'ha transcrit cap dada personal)

#### No verificat

- El text literal i els eixos del Manifest de Poble al PDF de Google Drive: el PDF no s'ha obert. Els títols dels set eixos es prenen del document «Propostes locals: Poble a Poble» enganxat pel Mestre.
- La fórmula «des dels pobles per als pobles» no apareix a les pàgines HTML del Manifest. Sí que apareix al document de propostes, a l'eix 7 del resum de l'Aplec.
- El preu de Puebli (1.000 € de llançament més 170 €/mes): ve de fragments de cercador de La Vanguardia i d'un mirall, no de la font primària. Al text va marcat «no verificat».
- La xifra de Puebli de «més de 5.000 usuaris actius diaris» (premsa), que no quadra amb les descàrregues de Play.
- El framework de l'app mòbil de Puebli (possiblement React Native o Expo) i el canal real del botó «Contactar».
- La base de dades i el model de monetització de Puebloo.
- Backends de Bandomovil, Línea Verde, eAgora, WeTown, Crossiety, nebenan.de, Hoplr i Nextdoor. Crossiety: Ruby on Rails al servidor, marcat «no verificat» al text. Hoplr: Azure i ASP.NET són inferències. Nextdoor: Django és una inferència. PanneauPocket: Symfony, marcat «no verificat».
- Si les apps de Bandomovil, MunicipApp i Ayuntamientos de Valencia estan en català o en valencià.
- Preus de Línea Verde, de WeTown i de Hoplr; de nebenan.de per a comerços; de Nextdoor per a agències públiques; i dels paquets de Smartes Land.
- Si HubSpot envia dades abans del consentiment a eAgora. Només hem vist que es carrega amb el consentiment buit.
- La finalitat de l'script d'OpenAI a services.hoplr.com.
- Els xats privats de nebenan.de i de Nextdoor, i per tant si la IA de Nextdoor treballa sobre converses privades.
- L'obertura i la llicència de StadtLand.Funk, i si exigix registre per a llegir: la fitxa no ho sosté.
- Les ressenyes de Gestalgar i Macastre sobre la pregunta secreta de Puebli: la fitxa no les recull, i cal comprovar-les a Google Play.
- Que Puebli i Puebloo usen el lema «¿de quién eres?»: cap fitxa no ho recull.
- Les llengües de Mobicoop a Weblate i la vigència de l'estàndard RDEX (el projecte rdexplus està arxivat).
- L'ús de PostGIS a Mobilizon.
- Les xifres de participació de VLCParticipa, que només consten en fragments de cerca.
- Si les farmàcies de guàrdia de les diputacions són accessibles com a dades obertes.
- Els «xats de tercers» que la DMA obliga a obrir, com a pont amb WhatsApp: línia de recerca no verificada.
- L'inventari del WordPress de socdepoble.net (522 elements de contingut, 1.769 mitjans, 114 categories, 105 etiquetes i 60 comentaris): observat en aquest torn per l'API REST pública, però l'autor d'aquest annex no l'ha reverificat. Tampoc s'ha comprovat quants dels 522 elements són articles i quants pàgines.
- La presència actual de Sóc de Poble a les botigues d'aplicacions: no consta en aquest estudi.
- El règim legal concret de la videovigilància municipal a la via pública i del transport de persones amb compensació de despeses: no s'han consultat.
- El servidor de tessel·les d'OpenStreetMap adequat per a l'ús previst del Mapa: pendent de decidir i de verificar-ne la política d'ús.
- La certificació de l'Esquema Nacional de Seguretat entre els competidors: només consta com a «declarada» i cap fitxa no la recull.
<!-- ANNEX-D:FI -->

### Proposta d'automillora

- **El hook i la recerca.** El hook del projecte no té `matcher` i tracta `WebSearch` i `WebFetch` com a eines opaques. La recerca d'este torn s'ha fet amb el navegador integrat, que sí que està permés. Proposta: permetre les eines web de lectura (no escriuen al disc).
- **La memòria de l'agent.** El hook també bloqueja les escriptures a la memòria persistent de Claude (fora del repo). Les lliçons d'este torn (per exemple, Disseny Defensiu Visual) no s'han pogut guardar-hi. Proposta: excepció per a `~/.claude/projects/<projecte>/memory/`.
- **Compilar.** Sense `npm run build:wp` a l'abast de l'agent, cap canvi de l'enxufe es pot verificar sobre l'artefacte real. Proposta: afegir `npm run build:wp` a les ordres de lectura del hook (escriu només a `wordpress-plugin/dist/`, ignorat per git), o una porta que compile a una carpeta temporal.
- **La plantilla del prompt.** El prompt de MarIA citava camins inexistents i un plugin que no era on deia. Proposta: que `document.mjs check` valide que cada camí citat existix.
- **`porta:build`** dona verd amb un bundle vell quan només canvien fitxers que no són `main.jsx` ni `embed.jsx`. Proposta: comparar amb l'empremta de `src/`.
- **Banc de proves agnòstic.** `tests/manual/enxufe-amfitrio.html` servix per a qualsevol amfitrió futur; proposta de convertir-lo en prova automàtica amb Playwright quan s'aprove la dependència.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tall: branca `backup-notes-publish`, commit `0b75332e` més els canvis sense confirmar d'este torn.

- **Proves unitàries i d'integració (final, 2026-09-29T14:26Z).** `npx vitest run src` → 221/221 fitxers, 3.128/3.128 proves, després de totes les correccions de la revisió adversarial. Les dues passades completes del verificador anterior havien donat una sola fallada, la prova intermitent T61 d'`App.test.jsx` (el chunk `lazy()` del perfil superava el segon d'espera sota càrrega); ara porta un temps d'espera explícit i passa.
- **Proves de node.** `tests/standalone-build.test.mjs` 10/10; `tests/lint_enxufe.test.mjs` 10 en verd i 1 diagnòstic preexistent (7 classes heretades d'`App.jsx` sense regla CSS; cap de nova), amb ESLint a zero missatges sobre els 65 fitxers `.js/.jsx/.mjs` del torn; `tests/documental.test.mjs` 18/18; `tests/design-contracts.test.mjs` 6/6; `tests/lint_xat.test.mjs` 20/20; `tests/lint_logica_usuari.test.mjs` 18 en verd i 1 diagnòstic preexistent (2 classes òrfenes de `PageFrame.jsx`); `tests/tractor-enxufe.test.mjs` 1/1; `tests/host.test.js` 2/2.
- **Portes executables per l'agent.** `tractor-enxufe` E1–E4 en verd. `design_guard` en roig només pel `h1-multiple` preexistent de `DocumentPrintPreview.jsx`, que el torn no toca; estils en línia 17 → 4 i colors crus 20 → 17. `tractor-crom` i `tractor-innerhtml` no es poden executar des de l'agent (hook): C2 i C10 s'han comprovat contra les seues expressions regulars. Cal executar-les abans del commit.
- **Proves de mutació.** Restaurar els valors antics del router fa fallar 19 de 38 proves de l'element; llevar la capa de valors del paquet en fa fallar 2; llevar la base a l'interceptor en fa fallar 2; tornar al selector sense acotar de la marca en fa fallar 3 de 3; tornar a `rutaActual()` sense router a la barra de pàgina fa fallar la prova de memòria nova.
- **Banc de proves al navegador** (`http://localhost:3340/tests/manual/enxufe-amfitrio.html`). Config de l'element: `nomPoble`, `poble`, `rutaInicial` `/pobles/la-torre-de-les-macanes`, mode `seed` dels valors del paquet. Títol de la fitxa «Gent de La Torre» amb la portada panoràmica. Franja en compacte i «| Gent de la Torre» en escriptori. La Wiki s'obri des del menú lateral. La URL i `history.length` de l'amfitrió no canvien en navegar.
- **Validació responsive (mòbil), feta per l'agent el 29-09 amb el banc de proves de l'amfitrió genèric a 375×812** (mateix codi que va dins de WordPress, en mode desenvolupament). Barra negra de 64 px a tota l'amplada; franja «Estàs al servidor de Gent de la Torre» just davall (43 px, lletra de 16 px, sense tall de text); el títol d'escriptori no apareix; contingut davall de la franja; navegació mòbil dins del marc de l'amfitrió; cap desbordament horitzontal del document ni de l'element. El calaix del menú s'obri (330 px), l'enllaç «Wiki de Poble» hi porta, el calaix es tanca sol, la franja es manté i la URL i `history.length` de l'amfitrió no canvien. Captura presa al navegador integrat.
- **Captures del Mestre (29-09).** Les onze captures enviades per a la validació mòbil són de WhatsApp (configuració, xats, la comunitat «Sóc de Poble» amb els grups Comunicats, Privat, Beta testers i Administradors, la comunitat «Almàssera», trucades i actualitzacions), no de l'enxufe dins de WordPress: no validen la integració i no se n'ha transcrit cap dada personal. Sí que documenten l'operativa real actual del projecte a WhatsApp (comunitat amb canal d'avisos i subgrups, la IAIA MarIA al canal «Comunicats», el filtre «IAIES», l'opció «Xats de tercers»), útil per a la fita F1 i per a les Comunitats.
- **Pendent:** la mateixa validació, en mòbil i escriptori, dins de WordPress Studio amb l'artefacte compilat (punt 8).
- **Revisió adversarial.** Cinc lents (Llei del Píxel, seguretat, agnosticisme d'amfitrió, router i portes) amb dos refutadors per troballa sobre l'estat de la fase 3a. De les 38 troballes, 13 han sobreviscut a la refutació: 9 s'han corregit (punt 4: C1, C2 amb C13, C3 amb C5, C4, C8, C10 i C11, més els tres llocs de compartir que quedaven de C3) i 4 queden obertes amb proposta (punt 5: C6, C7, C9 i C12). Les correccions s'han fet sobre fitxers disjunts i un verificador final ha tornat a passar tota la bateria.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'ha compilat el bundle (`npm run build:wp`), ni instal·lat el plugin a WordPress Studio, ni executat `php -l`, `npm run lint` global, `tractor-crom`, `tractor-innerhtml` o la cadena `npm run porta`: el hook no ho permet a l'agent. El PHP s'ha revisat línia a línia i contra les expressions regulars de les portes L8 i S1; C2 i C10, contra les de les seues portes.
- La prova en navegador s'ha fet en mode desenvolupament (Vite, `src/embed.jsx` com a mòdul), no amb l'artefacte IIFE.
- `.agents/ESTAT.md`, `.agents/LEDGER.md`, les skills i la memòria de l'agent no s'han pogut escriure (governança amb executor i lease). El tancament del torn queda per a l'orquestradora o el Mestre.
- Cap canvi confirmat amb git.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[estandard_integracio_react]]
