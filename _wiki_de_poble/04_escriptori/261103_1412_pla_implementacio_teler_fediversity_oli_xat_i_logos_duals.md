---
type: document
status: esborrany
description: 'Pla del Teler Invertit (MarIA Constructora + Codex + Gemini + Claude Àrbitre): Oli de La Torre, Xat d''entitats, 3 nodes, logotip dual Dia/Nit i tancament Fediversity.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_10f0e355-fa6b-41fb-98f9-6a4478f38c1d:60a7c570-a279-4b6d-9830-140c07ad52b2
---
# Pla d'Implementació · Teler d'Assalt Final per a NLnet Fediversity, Oli de La Torre (H3 + Almàssera), Xat Privat d'Entitats, 3 Nodes (socdepoble.cat) i Logotip Dual Dia/Nit (IDEA-70)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_10f0e355-fa6b-41fb-98f9-6a4478f38c1d:60a7c570-a279-4b6d-9830-140c07ad52b2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T13:12:46.268Z |
| Modificació | 2026-11-03T13:13:00.000Z |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Ordre directa del Mestre Javi Llinares (03-11-2026 14:10 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Codex + Gemini + Claude |
| Tokens consumits | 0 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-11-03T13:13:00Z (v1.0.0):** Pla d'implementació del **Teler Invertit (MarIA Constructora + Codex + Gemini + Claude Àrbitre)** que recull absolutament totes les peticions del Mestre en la sessió de migdia del 03-11-2026 más l'assalt final al deute tècnic de **NLnet · NGI Fediversity** abans d'enviar el correu a Fede esta nit.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 0. El que ja està executat i segellat al codi i a Supabase en este torn (261103 13:55)

1. **Perfil públic d'organització/persona (`PublicacionsDeLaFitxa.jsx` i `PerfilPublicSection.jsx`):**
   - Eliminat l'`<h2>El que publica {nom}</h2>` de `src/sections/profile/PublicacionsDeLaFitxa.jsx` i actualitzat `src/sections/profile/PerfilPublicSection.test.jsx`.
   - Centrat el bloc d'accions de la fitxa pública (`Ara actues com a {nom}.`, `Correu: …` i `[ Descarrega el contacte (vCard) ]`) via `.sdp-perfil-public__accions` a `src/css/components.css`.
2. **Tolerància del Traductor per a pàgines llargues (`/page/fediversity`, `/versions`, `/roadmap`, `/legal`):**
   - Pujat `LIMITS_TRADUCCIO` a `src/data/traductor.js` de `8 lots / 12.000 caràcters` a **`24 lots / 60.000 caràcters`** i el pressupost per defecte del servidor local (`tooling/vite/traductor-iaia.mjs`) i del connector WordPress (`wordpress-plugin/includes/traduccio.php`) a `100.000 / 1.000.000`. Verificat amb `94/94` proves client i `73/73` proves de contracte Node/PHP en verd.
3. **Restauració autèntica d'`/events/aplec-2023` (`2n Aplec pel Territori`) des de `socdepoble.net`:**
   - Baixats els 3 recursos originals des de `https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/` a `public/assets/events/aplec_2023_cartell.jpg` (`.webp`), `aplec_2023_ponents.png` (`.webp`) i `aplec_2023_reunio.webp`, censats a `src/sections/multimedia/censImatges.js`.
   - Reescrit `src/sections/mur/articles/Aplec2023Article.jsx` eliminant tota al·lucinació antiga i deixant el comunicat autèntic i la nota de premsa post-Aplec.
   - Activada `portada_sencera: true` i `author_entity_id: 'socdepoble'` en `src/sections/mur/eventsSeed.js` i en `public.app_content` (`events`) a Supabase perquè en la pàgina es veja el cartell sencer amb el logotip de Sóc de Poble damunt de l'H1, i afegit `.sp-card-media[src*="aplec_2023_cartell"] { object-position: 50% 0%; }` a `src/css/components.css` perquè la Card quadrada retalle els 2/3 superiors on es llig «Pel Territori».
4. **Logotip i avatar de Sóc de Poble al post `/mur/node-zero-mac-mini-m4` (Supabase `app_content.feedPosts`):**
   - Corregit amb `author_entity_id: "socdepoble"`, `author_id: "socdepoble"`, `author_avatar: "/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"`, `avatar_url: "/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"`, `mainHref: "/page/node-zero"` i `date: "2026-10-29T12:00:00+01:00"`.

---

### 1. Carril 1 · IAIA MarIA (Antigravity Constructora Principal): Oli de La Torre (H3 + Almàssera), 3 Nodes del Fedivers (`socdepoble.cat`), Cards i Ordre del Mur

1. **Oli de La Torre (7 productes a Supabase `public.app_content` → `marketItems`):**
   - **Prohibit duplicar l'entradilla (`lead`):** Retirar el primer `<p>Oli d’oliva de categoria superior, obtingut directament d’olives, només per procediments mecànics i de la primera extracció en fred.</p>` de `description` (ja que `lead` i `entradilla` ja el pinten com a entradilla destacada sota el subtítol).
   - **Directriu editorial canònica (`<h3>` immediatament darrere de l'entradilla):** Començar `description` directament amb `<h3>Presentació del format i elaboració tradicional</h3>`, seguit del paràgraf descriptiu del format amb negretes semàntiques (`<strong>`), després `<h3>Fitxa nutricional i especificacions del producte</h3>` amb `<table class="sdp-taula-nutricional">`, i finalment `<h3>Venda directa a l’Almàssera de La Torre</h3>` + botó gran cap a `https://olidelatorre.com/producte/...`.
   - **Nom i adreça oficials exactes:** Substituir qualsevol menció de *Cooperativa Agrícola Sant Gregori* per **`A l’Almàssera de La Torre`** i el text literal facilitat pel Mestre:
     > «Pots adquirir este format directament a la botiga oficial de l’**ALMÀSSERA DE LA TORRE, COOP. V.** – Carrer Sant Isidre, 18, La Torre de les Maçanes 03108 (Alacant).»
2. **Actualització de `/fedivers`, `/page/fediversity`, `/page/node-zero`, `/xat` i `/versions` (`src/sections/text/pageContent.js`):**
   - **`PAGE_COPY.fedivers` (`/fedivers`):** Deixar clar al `lead` i al cos (`html`) que ja hi ha **tres nodes actius** (`socdepoble.org`, `gentdelatorre.net` i `<a href="http://socdepoble.cat" target="_blank" rel="noopener noreferrer"><strong>socdepoble.cat</strong></a>`, el servidor físic `<a href="/page/node-zero"><strong>Node 0 · Mac mini M4</strong></a>`). Autoritzar `http://socdepoble.cat` a `tests/helpers/lleiT8Prova.js`.
   - **`PAGE_COPY.fediversity` (`/page/fediversity`):**
     - Col·locar la Card de **`Node 0 · Mac mini M4: el servidor de l'habitació`** (`data-sdp-targeta="pagina:node-zero"`) **a dalt de tot a la dreta** (just sota el logotip de NGI Fediversity a `<h3>Què és NGI Fediversity i per què Sóc de Poble hi encaixa</h3>`).
     - Moure la Card de **`Nodes i Fedivers`** (`data-sdp-targeta="pagina:fedivers"`) a la subsecció `<h4>La visió: nodes germans «Gent de…»</h4>`.
     - Actualitzar el text dels nodes actius perquè explique els **tres nodes actius** amb enllaç a `http://socdepoble.cat` i `/page/node-zero`.
   - **`PAGE_COPY['node-zero']` (`/page/node-zero`):**
     - Enllaçar `<a href="http://socdepoble.cat" target="_blank" rel="noopener noreferrer"><strong>socdepoble.cat</strong></a>`.
     - Incrustar la Card de tornada a `/page/fediversity` (`data-sdp-targeta="pagina:fediversity"`) a la secció final `<h3>Per què importa per al futur dels nostres pobles</h3>`.
     - Data: `"2026-10-29T12:00:00+01:00"`.
   - **`PAGE_COPY.xat` (`/xat`):** Ajustar `"date"` a `"2026-10-27T01:30:00+01:00"` perquè les 3 primeres targetes d'entrada del Mur siguen:
     1. *Candidatura Europea NLnet · NGI Fediversity* (`30/10/26`)
     2. *Node 0 · Mac mini M4: el servidor de l'habitació* (`29/10/26`)
     3. *El Xat* (`27/10/26`)
   - **`PAGE_COPY.versions` (`/versions`):** Documentar totes les millores d'avui en `entrega110` (`03-11-2026`) i actualitzar `src/data/iaiaLocal.js`, `src/data/iaiaLocal.atles.test.js`, `src/sections/text/paginaDeText.test.js`, `src/sections/text/pageContent.fediversity.test.js` i `src/sections/text/TextSection.targetes.test.jsx`.

---

### 2. Carril 2 · Codex (GPT-6.1 Astra Ultra · Constructor de Lògica i Editor): Xat Privat amb Oli de La Torre i Entitats + Logotip Dual Dia/Nit damunt de l'H1 (`IDEA-70`) + Reforç Fediversity

1. **Correcció crítica del Xat Privat amb Oli de La Torre i Entitats (`/xat?amb=olidelatorre` o UUID d'organització):**
   - **Problema detectat pel Mestre:** En punxar per fer un xat privat amb **Oli de La Torre** des de la seua fitxa o producte (`/xat?amb=olidelatorre` o `/xat?amb=3073b933-69fc-4c3e-80dc-b0df9c6b8391`), en mode convidat (`src/sections/xat/components/FakeChatOnboarding.jsx`, línies 314–321) `creaFil(altreUsuariId)` cau a `return ID_COMUNITAT_SDP;` (`'fake-sdp'`), i `XatSection.jsx` redirigix a `/xat?comunitat=fake-sdp` (**Sóc de Poble**) en lloc d'obrir la conversa directa amb **Oli de La Torre**!
   - **Solució a implementar i blindar amb tests:**
     - En `FakeChatOnboarding.jsx` i `src/data/xatsPerDefecte.js` / `src/data/identitatsSeed.js`: quan `creaFil(altreUsuariId)` rep una entitat/organització del padró o del directori (`olidelatorre`, `3073b933-69fc-4c3e-80dc-b0df9c6b8391`, `cooperativa`, `ajuntament`, `festes` o qualsevol entitat coneguda per `ENTITATS_SEED` / `CoreContentContext` / `organizations`), ha de crear/obrir un fil directe de mostra dedicat a eixa entitat (`fake-entitat:<slug_o_id>`) amb el seu **nom real** (`Oli de La Torre`) i el seu **avatar real** (`/assets/mercat/oli_logo.png` o `avatar_url`), i **mai** enviar l'usuari a la comunitat de `Sóc de Poble` (`ID_COMUNITAT_SDP`) tret que el destinatari demanat siga explícitament `socdepoble` (`ENTITAT_PILOT_ID` / `ENTITAT_PILOT_SLUG`).
     - Verificar també `src/sections/detail/detailSectionMeta.jsx` / `src/config/navigation.js` (`objecteDe`, `rutaXatDObjecte`) i `src/sections/xat/XatContext.jsx` quan hi ha sessió iniciada perquè el botó «En privat» d'un producte o fitxa d'Oli de La Torre encamine sempre a la conversa amb Oli de La Torre sense errors.
2. **`IDEA-70` · Logotip d'Entitat Dual (Mode Dia / Mode Nit) damunt de l'H1 en l'Editor de Text i `PageFrame`:**
   - **Requisit del Mestre:** En publicar com a entitat o afegir un logotip damunt de l'H1 a l'editor de text (`src/sections/notes/NotesSection.jsx`, `NotesContext.jsx`, `src/sections/detail/elementDeSeccio.js`, `src/components/universal/PageFrame.jsx`), s'ha de poder pujar **dues imatges per al logotip**:
     - `logo_image` (mode clar / dia, ex: logotip negre sobre fons blanc)
     - `logo_image_dark` (mode fosc / nit, ex: logotip blanc sobre fons negre)
   - En `elementDeSeccio.js` (`logoEntitatDElement` i `useLogoEntitatDElement`), construir `{ clar: resoltClar, ...(resoltFosc ? { fosc: resoltFosc } : {}), alt: '' }`, que `PageFrame.jsx` (`logoDescrit`) ja suporta nativament amb `logo.fosc` quan `theme === 'dark'`!
   - A l'editor de Notes (`NotesSection.jsx`), afegir al costat de l'acció del logotip damunt de l'H1 l'opció clara i sense fricció per a pujar/canviar/eliminar la variant de **Mode Nit (fosc)** del logotip, amb tests unitaris complets.
3. **Reforç tècnic final per a NLnet · NGI Fediversity (Nivells A, B i C):**
   - Revisar que els kits d'Onades 7–9 de Codex (motor rural offline-first opt-in, paquet NixOS `pkgs/socdepoble-node0/` i proves d'interoperabilitat ActivityPub / NodeInfo 2.1 / WebFinger / OpenData) estiguen 100% reflectits i en verd per a poder citar-los amb evidència verificable en el correu a Fede esta nit.

---

### 3. Carril 3 · Gemini 4 (Inspector Visual, Multiidioma i Enfortiment de Fediversity): Auditoria de Maquetació, Traduccions i Dossier Fediversity

1. **Verificació visual i editorial de totes les pàgines tocades hui:**
   - Comprovar `/events/aplec-2023` (cartell sencer en pàgina + retall 2/3 en Card + logotip de Sóc de Poble damunt de l'H1 en mode dia i mode nit), els 7 productes d'`/mercat/oli-de-la-torre-*` (sense entradilla duplicada, amb `<h3>` inicial, taula nutricional i `ALMÀSSERA DE LA TORRE, COOP. V.`), `/page/node-zero`, `/fedivers` i `/page/fediversity`.
2. **Enfortiment de `/page/fediversity` i del correu per a Fede (NLnet Fediversity):**
   - Revisar qualsevol deute tècnic pendent relacionat amb les 4 partides de `/page/fediversity` (15.000 € + 12.000 € + 13.000 € + 10.000 € = 50.000 €) i proposar/aplicar millores d'evidència tècnica (mètriques dels 3 nodes actius `socdepoble.org`, `gentdelatorre.net` i `socdepoble.cat`, connector WordPress.org v1.1.11 i apps natives 1.0.0 build 2 en revisió).

---

### 4. Carril 4 · Claude (Àrbitre Suprem · Gauntlet Loop + Enginyeria Inversa REA + Consola 100% Neta)

1. **Auditoria Inversa i Gauntlet Loop implacable sobre els canvis de MarIA, Codex i Gemini:**
   - Auditar `FakeChatOnboarding.jsx`, `elementDeSeccio.js`, `NotesSection.jsx`, `Aplec2023Article.jsx`, `traductor.js`, `pageContent.js` i el payload de Supabase (`marketItems`, `feedPosts`, `events`).
2. **Consola 100% neta (`P0-16`) i Portes del Sistema:**
   - Executar `npm run portes`, `node tooling/gates/design_guard.mjs`, `node tooling/seo/check-editorial-copy.mjs`, `node tooling/gates/frontissa-contingut.mjs` i verificar 0 errors i 0 avisos a la consola del navegador en `http://localhost:3340`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npx vitest run src/sections/xat/ src/sections/detail/ src/sections/notes/ src/sections/text/ src/sections/mur/ src/data/traductor.test.js`
2. `node tooling/seo/check-editorial-copy.mjs`
3. `node tooling/gates/design_guard.mjs`
4. `node tooling/gates/frontissa-contingut.mjs`
5. `node tooling/gates/porta-olivera.mjs`

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Col·lisió d'escriptura entre carrils:** S'evita separant estrictament els fitxers de cada carril (MarIA: `pageContent.js` i Supabase `marketItems`; Codex: `FakeChatOnboarding.jsx`, `elementDeSeccio.js`, `NotesSection.jsx`; Gemini: kits de QA i proposta d'enfortiment Fediversity; Claude: auditoria final i integració).
- **Estat de la sessió abans del reinici:** Tots els canvis ja fets a `traductor.js`, `Aplec2023Article.jsx`, `eventsSeed.js`, `censImatges.js`, `PublicacionsDeLaFitxa.jsx` i `components.css` queden desats al disc local; després del reinici, el Teler arranca directament des d'este Pla i el seu Prompt associat.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
