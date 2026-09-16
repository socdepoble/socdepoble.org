---
tipus: document
estat: esborrany
description: Auditoria Gemini Flash
---
# Auditoria Gemini Flash

L'auditoria inversa del paquet revela fallades crítiques de seguretat, condicions de cursa en la integració amb Sollutia, trencaments d'accessibilitat i incoherències doctrinals greus.

**Estat del lliurament:** El bundle ha arribat incomplet. Manca la sentinella final `<<<FI_DEL_BUNDLE>>>` i el fitxer `tooling/wiki/core/snapshot_engine.mjs` no disposa de la tanca `<<<FI_FITXER>>>`, violant la regla 4 del Contracte de Realitat. El fitxer `snapshot_engine.mjs` es declara inauditable, procedint a l'auditoria estricta dels fitxers íntegres anteriors.

---

### 1. Auditoria d'Enxufabilitat amb Sollutia (Backend & Host)

| Vector | Fitxer i Línies | Gravetat | Diagnòstic Tècnic |
| --- | --- | --- | --- |
| **All-or-Nothing Locking** | `src/host.js:111-125` | **Crítica (P0)** | Si Sollutia injecta una implementació parcial de backend, `arrenca()` llança una excepció fatal: `Injecció parcial detectada... L'arquitectura prohibeix Fallbacks Híbrids amb Supabase`. Exigix implementar els 31 mètodes de `CONTRACTE_NUCLI` (`src/data/contracte.js:2-35`) de cop, impedint una connexió modular o progressiva. |
| **Cursa d'Arrencada Automàtica** | `src/host.js:142-165` | **Alta (P1)** | `arrencaAuto()` programa el segellat amb `setTimeout(fes, 100)`. Si l'script amfitrió de Sollutia carrega de manera asíncrona (`defer`, `async` o càrrega dinàmica de mòduls) i no crida `deferArrenca()` abans de 100 ms, `host.js:77-83` bloqueja la injecció en producció amb `Error: Ja s'ha cridat arrenca(): el backend està segellat`. |
| **Llista Blanca OAuth Incompleta** | `public/auth/callback.html:85-99` | **Alta (P1)** | `ORIGENS_PERMESOS` té `[https://socdepoble.org](https://socdepoble.org)` duplicat (línies 87 i 98) i no inclou ni entorns locals (`http://localhost:3340` segons `package.json:54`), ni entorns de proves de Sollutia que no siguen exactament `[https://socdepoble.sollutia.com](https://socdepoble.sollutia.com)`. El relé avorta amb `mostraError('Origen no reconegut')`. |
| **Bypass inútil d'isLocked** | `src/data/backendPort.js:11-14` | **Mitjana (P2)** | `setBackendImplementation(impl, force = false)` permet el paràmetre `force` per ometre `isLocked`. Tanmateix, a `host.js:127` s'executa `freezeImplementation()`, que crida `Object.freeze(currentImpl)` (`src/data/backendPort.js:37`). Qualsevol intent posterior de forçar la injecció llençarà un `TypeError` en mode estricte. |

---

### 2. Bombardeig de Seguretat i Vulnerabilitats

* **CSP Permissiu i Insegur (`index.html:8`):** La directiva `<meta http-equiv="Content-Security-Policy" content="... style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' https:; ...">` permet execució de scripts en línia (`'unsafe-inline'`) i càrrega de recursos des de qualsevol domini HTTPS (`https:`). Anul·la la protecció contra atacs XSS i injeccions a l'arbre DOM.
* **Xat en Temps Real Trencat (`supabase/migrations/260908_xat_v2_correccions.sql:306-324` i `src/sections/xat/XatContext.jsx:19-25`):**
* A la migració SQL, la publicació `supabase_realtime` per a `public.xat_missatges` està comentada entre les línies 310 i 323.
* A `XatContext.jsx:19-25`, la documentació admet que no hi ha Realtime, però a `src/sections/xat/XatContext.jsx:266` s'intenta subscriure a `subscribeToXat(filActiu, ...)`.
* El bucle de sondeig (`src/sections/xat/XatContext.jsx:297-307`) només crida a `carregaFils()` cada 25 segons per veure missatges no llegits; **mai executa `carregaMissatges(filActiu)**`. Com a resultat, dos usuaris dins d'una mateixa conversa activa no rebran mai els missatges de l'altre sense canviar de xat o recarregar la pàgina.


* **Supressió Global d'Errors (`src/PedraSecaEmbed.jsx:480-496`):** L'escoltador `unhandledrejection` intercepta i suprimeix qualsevol promesa rebutjada de la finestra global si la traça conté la paraula `sdp` (`src/PedraSecaEmbed.jsx:485`), amagant errors d'execució crítics a la consola de l'amfitrió.
* **Desconnexió del Consentiment RGPD (`src/data/supabase/auth.js:84-95`):** `registerWithPassword` envia les metadades en cru sense invocar la funció RPC `registra_consentiment` creada a `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:24-37`, deixant la taula `public.consentiments` òrfena en registres normals des del client.

---

### 3. Cerca de Contradiccions i Confusió Doctrinal

* **Sobrecàrrega del Concepte "Pedra Seca":**
* Mentre que la documentació d'integració externa (`_wiki_de_poble/02_saber/estandard_integracio_react.md:8`) diu que "Pedra Seca ja no es lliura com a plantilles... sinó com a una llibreria React autònoma", el component custom element registrat és `<soc-de-poble>` (`src/PedraSecaEmbed.jsx:499`) i l'API global és `window.SocDePoble` (`src/host.js:203`).
* A l'arrel pública, `public/assets/pedra-seca.css:1-2` només conté un comentari buit (`/* Pedra Seca placeholder */`), però `.agents/skills/pedra-seca/SKILL.md:14-19` prohibix fer cerques web als LLMs sota avís d'al·lucinació de marges agrícoles. S'ha de purgar el terme "Pedra Seca" de la interfície d'integració de Sollutia i utilitzar estrictament `SocDePoble`.


* **Conflicte de Runtimes (React vs. Preact):**
* `package.json:65-78` declara simultàniament `preact: ^10.29.8`, `react: >=18.0.0`, `react-dom: >=18.0.0` i `@preact/preset-vite: ^2.10.6`.
* `src/PedraSecaEmbed.jsx:26` importa `createRoot` des de `react-dom/client`.
* `src/shims/jsx-runtime.js:1-2` reexporta des de `react/jsx-runtime`.
* Els tests unitaris (`src/components/ui/UniversalCard.test.jsx:6` i `tests/ui/components-canonics.test.jsx:5`) importen `render` des de `preact`. Aquesta dualitat infla el bundle i provoca comportaments erràtics en el pas de context i referències del DOM.


* **Persistència Dexie / Local-First Fantasma:**
* `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md:21-25` assegura que la base inclou `Dexie` i emmagatzematge local amb fallback.
* `package.json:65-78` **no inclou Dexie** en dependències.
* `_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md:14-25` i `src/ARCHITECTURE.md:6-10` declaren que el model és Online-First estricte i que l'outbox s'ha esborrat. No obstant això, `src/sections/text/pageContent.js:13` continua mostrant públicament textos afirmant que el projecte es basa en "Local-First".



---

### 4. SEO, Accessibilitat (A11y) i Detalls de Front-End

* **Invasió del Document Amfitrió (`src/hooks/useSEO.js:10-75`):**
* En incrustar el Web Component en un entorn de Sollutia, `useSEO.js:40-75` muta directament `document.title`, `document.head`, els enllaços canònics i les etiquetes OpenGraph del lloc pare si no es passa explícitament `manageDocumentHead: false` a la configuració (`src/hooks/useSEO.js:13`). Això destrueix el SEO propi de la pàgina amfitriona que allotja el mòdul.


* **Injecció d'Estils en Línia que trenquen CSP:**
* `src/components/layout/AppGridShell.jsx:106` injecta `<style data-appgrid-styles>{appGridStyles}</style>` directament en el render de React.
* `src/sections/profile/PerfilShell.jsx:119` injecta `<style data-perfil-styles>{perfilStyles}</style>` dins del cos del component.
* Aquests dos fitxers no estan inclosos a `src/css/index.css` i estan congelats com a deute a `.agents/deute/.vocabulari-deute.json:2-9`. Si un client aplica CSP sense `'unsafe-inline'`, el disseny de columnes col·lapsa.


* **Barrera d'Accessibilitat al Xat (`src/sections/xat/XatSection.jsx:254-268`):**
* L'element `div.xat-item` que llista els fils de conversa té un controlador `onClick` però manca de `role="button"`, `tabIndex="0"` i d'escoltador d'esdeveniments de teclat (`onKeyDown`). És completament invisible i inoperable per a usuaris que depenen exclusivament de navegació per teclat o lectors de pantalla.


* **Violació d'Àrees Tàctils (Llei de Vida):**
* `.agents/deute/.design-guard-deute.json:10-18` manté congelades violacions de mides tàctils inferiors a 44 px (`AppGridShell.css:32px`, `components.css:24px`, `layout.css:24px`).
* `src/components/layout/AppGridColumn.jsx:45-56` renderitza botons d'acció amb mida `18px` en estats replegats sense garantir una caixa tàctil efectiva de 44x44 px.



---

### Pla d'Acció Immediat per a Producció

1. [Backend & Host] A host.js:111, permetre 'fallback' automàtic als mètodes de Supabase
   quan Sollutia no proporcione la totalitat dels 31 mètodes de CONTRACTE_NUCLI.
2. [Host Race Condition] A host.js:142, elevar el temporitzador de segellat o condicionar-lo
   exclusivament a l'esdeveniment 'DOMContentLoaded' i a la manca d'indicador 'defer'.
3. [Seguretat] Eliminar 'unsafe-inline' de script-src a index.html:8; migrar AppGridShell.css
   i PerfilShell.css a src/css/index.css perquè viatgen dins del ShadowRoot adoptat.
4. [Xat Realtime] Afegir 'public.xat_missatges' a la publicació 'supabase_realtime' al fitxer SQL
   o restaurar el sondeig actiu de missatges a XatContext.jsx:297.
5. [A11y] Afegir role="button", tabIndex={0} i onKeyDown a src/sections/xat/XatSection.jsx:254.
6. [Doctrina] Netejar les mencions públiques de 'Local-First' a src/sections/text/pageContent.js:13
   i blindar el nom del mòdul extern com a 'SocDePoble' per a evitar confusions amb Sollutia.
