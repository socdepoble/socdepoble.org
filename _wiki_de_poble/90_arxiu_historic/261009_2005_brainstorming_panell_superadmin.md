---
type: document
status: esborrany
description: 'Proposta de disseny del Panell de Superadministrador (Onada 8, punt 5): taxonomia i estil editables, Model B, permisos, CSS segur i decisions del Mestre.'
tags:
  - saber
visibility: private
reflex: sdp:torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a:70040349-c1b4-4c93-9dff-5817050f5432
---
# Panell de Superadministrador · proposta de disseny

**Categoria:** Proposta
**Data:** 2026-10-09
**Hora:** 20:05

---

<!-- SDP:SECTION brainstorming.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a:70040349-c1b4-4c93-9dff-5817050f5432 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T18:07:12.167Z |
| Modificació | 2026-10-09T18:20:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/brainstorming.md (v2.0.0) |
| Model IA | Claude Code (Opus 5.5) |
| Tokens consumits | no mesurat: el harness no l'exposa a l'agent |

<!-- SDP:SECTION brainstorming.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/brainstorming.md; SHA-256 cdbd4a219e773f9e8bb816408d32119cd0a416c1fc66b9b77c3beac9c99207ba. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION brainstorming.s3 -->
## Historial

2026-10-09T18:07:12.167Z: esborrany creat; contingut i verificació pendents.
2026-10-09T18:20:00.000Z: proposta abocada a partir de la lectura d'un agent de només lectura. Abans d'escriure-la he reverificat contra el codi el bloqueig del segon factor.

<!-- SDP:SECTION brainstorming.s4 -->
## Contingut

**Encàrrec:** punt 5 de `261009_1300_requeriments_onada8.md`. És **només disseny**: no s'ha escrit cap línia de codi ni cap migració. Per a passar a codi cal el sí del Mestre a les cinc decisions de baix.

### 0. Bloqueig previ: el segon factor

Des de `supabase/migrations/2610061448_superadmin_aal2.sql:9`, el servidor només reconeix el superadmin si la sessió té segon factor: `(select auth.jwt() ->> 'aal') = 'aal2'`. Ho he comprovat.

Al client no hi ha cap flux de segon factor: `rg -w "aal2|mfa" src` no troba res. Ho he comprovat.

`elMeuRol` només mira si existix la fila de `user_platform_roles` (`auth.js:127-133`). Per això la interfície deixa entrar el Mestre a `/admin`, però en remot tota crida d'administració pot tornar 42501. Ho reconeix el mateix Tauler (`AdminSection.jsx:110`).

**Sense segon factor, el panell no podrà desar res.** És la fase F1 i bloqueja totes les altres.

### 1. El que ja existix i s'aprofita

- **Ruta:** `/admin/*` darrere de `RequireAuth rol="superadmin"` (`App.jsx:848`), carregada a banda (`App.jsx:47`).
- **Pantalla:** menú lateral de facetes (`AdminSection.jsx:61-101`), UniversalWorkspace i PaginaDelDetall, i l'estat «sense capacitat» (`:18-36`). Cap enllaç porta a `/admin`.
- **Port de dades:** la capacitat `admin` té dos mètodes (`contracte.js:103-106`). Una capacitat a mitges fa fallar la validació (`backendPort.js:37-40`). El precedent de crida és una funció SECURITY DEFINER que torna 42501 (`2609121600_admin_panel.sql:11-36`).
- **`app_content`:** columnes `tenant_id`, `key`, `payload` i `version`. La lectura passa per una llista explícita de claus (`2609200300:72-83`) i no hi ha cap política d'escriptura. `loadCoreContent` només llig `towns` i `agents` (`content.js:131`). Tots els consumidors fan `pageCopy?.[k] || PAGE_COPY[k]`.
- **Frontissa de contingut:** fa l'empremta de cada valor de PAGE_COPY (`frontissa-contingut.mjs:55-60`). No veu Supabase.
- **Crom:** el PanellCrom aplica el to amb `style.setProperty` (`crom.js:144-152`), però no el desa. Només el veu el superadmin (`PanellCrom.jsx:100`).
- **CSS:** un full compartit amb `adoptedStyleSheets` (`PedraSecaEmbed.jsx:296-309`). Segons `tokens.css:12-14`, els tokens semàntics són «l'única superfície que exposarà el tauler de control». Els `--sdp-crom-*` no es poden tocar i `tractor-crom.mjs` els vigila.
- **Etiquetes:** cada una és `{text, className}`. Les classes formen un conjunt tancat: `sdp-badge-{buit, system, accent, category, tag, neutral}` (`modules.css:1423-1464`). UniversalCard posa `className` tal com ve (`UniversalCard.jsx:251-257`), així que una dada sense validar seria una injecció de classe. L'`style` de `pageContent.js:113` no es pinta mai: és dada morta.
- **Categories:** `CATEGORIES_BASE` està copiat tres vegades (`classificacioBloc.js:13`, `NotesEditor.jsx:46`, `ConnectarSection.jsx:85`). El model pur ja sap reanomenar, retirar i comptar usos (`model.js:60-94`).

### 2. Què es podrà editar

1. **Taxonomia:**
   - el catàleg d'etiquetes i categories: nom, classe del conjunt tancat, ordre i si és de sèrie;
   - quines etiquetes porta cada pàgina del sistema;
   - reanomenar i retirar, amb el recompte d'usos;
   - les categories de sèrie de Notes.
   
   Les notes personals no s'hi inclouen: són privades.
2. **Estil:** el to del crom, ara desat, i una llista tancada de tokens semàntics amb valors tipats.
3. **No es podrà editar:** l'html de PAGE_COPY, les claus estructurals, els `--sdp-crom-*` ni el CSS lliure.

### 3. On es desa (Model B)

- **Claus noves a `app_content`:** `taxonomia` i `estil`. No `tema`, que ja és l'aparença personal del xat (`ajustosXat.js:192`).
- **Contingut:** només les diferències respecte del repositori. Si està buit, la pantalla es veu igual que hui (Llei del Píxel).
- **Historial:** `app_content_historial`, on només s'afig i res no s'esborra.
- **Lectura:** dins de la mateixa petició de `loadCoreContent`, amb `key=in.(towns,agents,taxonomia,estil)`. Torna un camp opcional `personalitzacio`. Cap petició més en arrencar.
- **Escriptura:** una capacitat nova i opcional, `personalitzacio: ['adminDesaPersonalitzacio', 'adminHistorialPersonalitzacio']`. No va dins d'`admin`, perquè deixaria a mitges els backends d'ara. Un amfitrió sense esta capacitat (WordPress, Joomla) mostra «sense capacitat» i la web es veu igual.
- **Aplicació:**
  - etiquetes: una funció pura `aplicaPersonalitzacio(pageCopy, taxonomia)` a `CoreContentContext.jsx:54`;
  - estil: un segon full adoptat darrere del principal, i un `<style>` als camins de `main.jsx` i `natiu/entrada.jsx`.
- **«Tot fora»:** un botó exporta el JSON. MarIA el pot passar a `pageContent.js` i aprovar-lo a la frontissa.

### 4. Permisos: el servidor mana

Una funció SECURITY DEFINER, `admin_desa_contingut(p_clau, p_payload, p_versio)`:
- comprova `es_superadmin()`, segon factor inclòs;
- accepta només les claus de la llista;
- rebutja una versió desfasada amb un error SDP de conflicte;
- limita la mida i valida la forma en SQL;
- es revoca a `public` i `anon` i es concedix a `authenticated`.

Les claus noves s'afigen a les tres polítiques de lectura. Al client, un 42501 es mostra com «cal el segon factor».

### 5. Seguretat del CSS

Un CSS lliure s'aplicaria a tots els veïns de tots els amfitrions. Obri tres riscos:
- robar dades amb selectors d'atribut i `url()`;
- falsejar la interfície, com amagar l'avís de privacitat del xat o pintar botons falsos;
- convertir un compte robat en un atac permanent per a tothom.

Per això hi ha tres nivells:

1. **Tokens.**
   - Noms permesos de la capa semàntica, amb valors tipats: color `#rrggbb`, radi de l'escala `--sdp-radi-s`…`--sdp-radi-xl`, espai en múltiples de `0.25rem`.
   - El contrast es recalcula al client i es rebutja per davall de 7:1. La funció `contrast` passa de la prova a `crom.js`.
   - Un serialitzador escriu només línies `--sdp-x: valor;` amb els selectors de `tokens.css`. Cap text del Mestre arriba com a CSS.
2. **Classes.** Cada `className` es valida contra el conjunt tancat abans d'arribar a UniversalCard.
3. **CSS lliure: descartat.** Si el Mestre l'ordena:
   - s'analitza i es reconstruïx amb `replaceSync` i `cssRules`, mai amb expressions regulars;
   - només selectors `.sdp-root`, propietats d'una llista i valors `var(--sdp-*)`;
   - prohibits `url(`, `@import`, `@font-face`, `attr(`, `content` i les barres `\`;
   - tot dins d'una `@layer mestre`, que perd contra els tokens.

En tots els nivells: vista prèvia, historial i restaurar amb un clic.

### 6. Interfície, sense cap component a mida

- **Dos facetes noves al menú d'AdminSection:** «Etiquetes i categories» i «Estil del poble».
- **Taxonomia:** UniversalWorkspace i PaginaDelDetall, com Usuaris, amb Camp, CampText, Selector, Boto i DialegValors.
- **Estil:**
  - el cos del PanellCrom dins de PaginaDelDetall, més la llista de tokens;
  - «Aplicar» només previsualitza;
  - «Desar» crida el servidor.
- **Historial:** un UniversalWorkspace de versions amb «Restaurar».
- **Text:** `PAGE_COPY.admin` amb `COVER_PAGE_KEYS.admin`, com la `consola`. No a SYSTEM_PAGES: eixiria al Mur públic.
- **Entrada:** una targeta a «Maquinària» del Panell de Control, visible només per al superadmin.
- **Pes:** la pàgina ja es carrega a banda. Al tros d'entrada només van la fusió i el serialitzador, que cal mesurar contra el sostre d'1.591.855 B.

### 7. Fases i primer pas de cada una

| Fase | Contingut | Primer pas |
|---|---|---|
| F0 | Esta proposta i les decisions del Mestre | El Mestre respon les cinc decisions de baix. |
| F1 | Segon factor (bloquejant) i neteja M0 | Un mètode de port `mfa` (alta, repte i verificació amb Supabase `auth.mfa`) i la seua prova de conformitat. Unificar les tres còpies de `CATEGORIES_BASE`. |
| F2 | Taxonomia | Migració M1 (polítiques, historial i `admin_desa_contingut`) a `node-suite-manifest.json`, i la funció pura `aplicaPersonalitzacio` amb prova de Llei del Píxel. |
| F3 | Estil per tokens i crom desat | El serialitzador de tokens amb les proves de rebuig (`;`, `}`, `url(`, `\`, contrast < 7:1). |
| F4 | Classes i, només amb ordre del Mestre, el CSS lliure acotat | La validació de `className` a l'entrada d'UniversalCard. |

### 8. Alternatives descartades

- El panell al Mur via SYSTEM_PAGES, perquè el publicaria.
- Escriure al bloc de `tokens.css`, perquè seria codi i dependria de la IA.
- Desar en `localStorage`, perquè seria d'un sol dispositiu i contradiu el Model B.
- Ampliar la capacitat `admin`, perquè trencaria els backends d'ara.
- Una petició nova en arrencar, perquè s'aprofita la de `loadCoreContent`.

### 9. Decisions del Mestre

1. CSS lliure, sí o no? Recomane que no.
2. La taxonomia inclou el Mercat (`category_slug` lliure)?
3. Per on s'entra al panell: la targeta de «Maquinària» o només l'adreça?
4. Quin segon factor: TOTP amb aplicació, o un altre?
5. L'estil i la taxonomia són per poble (`app_content` és per poble) o globals (el superadmin és global)?

**Per verificar a producció:** si la migració del segon factor ja està aplicada. Si ho està, el Tauler de hui ja no pot llistar usuaris en remot.

<!-- SDP:SECTION brainstorming.s5 -->
## Verificació

**Comprovat per Claude contra el codi a les 20:05:**
- la condició `aal2` a `2610061448_superadmin_aal2.sql:9`;
- que no hi ha cap `aal2` ni `mfa` a `src`.

La resta de cites són de la lectura d'un agent de només lectura, que no he refutat una per una. Abans de la F1 s'han de tornar a comprovar contra l'arbre d'eixe moment.

No s'ha executat cap prova perquè no hi ha codi nou.

**Proves que haurà de tindre cada fase:**
- **Llei del Píxel:** sense diferències, el DOM del Mur, del Calendari i de les pàgines queda idèntic.
- **Fusió:** l'assignació substituïx les etiquetes, una classe de fora es descarta i l'html no es toca.
- **Serialitzador:** rebutja la injecció i el contrast baix.
- **Port:** una capacitat a mitges falla, sense capacitat dona «sense capacitat», i un 42501 dona l'avís del segon factor.
- **SQL (node-suite):**
  - cap usuari normal escriu;
  - un superadmin sense segon factor és rebutjat;
  - una versió vella dona conflicte;
  - l'historial no s'esborra.
- **Build independent:** l'entrada continua per davall del sostre.

<!-- SDP:SECTION brainstorming.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261009_1300_requeriments_onada8]]
- [[261009_1245_auditoria_claude]]
