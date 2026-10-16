---
type: informe
status: esborrany
description: Auditoria d'arquitectura global, fluxos d'identitat sense copyright, patró Feedly del Lector RSS, integració amb el Snippet Curador, enginyeria inversa REA i enxufabilitat Model B de Sollutia.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_89d082e5-e7aa-4407-ac9f-7149a2f180d8:67774061-56e3-4504-b88b-9c551b3c497c
---
# Auditoria de Sistemes i Xarxa Gemini 4 Argon — Gauntlet 261015_1900

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_89d082e5-e7aa-4407-ac9f-7149a2f180d8:67774061-56e3-4504-b88b-9c551b3c497c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T17:34:42.207Z |
| Modificació | 2026-10-15T17:34:42.207Z |
| Propietari | gemini4 |
| Aprovació humana | Auditoria autoritzada en Mode Direcció Autònoma sota la IAIA MarIA |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | No mesurats pel runtime local (0 inventats) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-15T17:34:42.207Z`: esborrany creat via `document.mjs context` i `document.mjs create` sota el torn `torn_89d082e5-e7aa-4407-ac9f-7149a2f180d8`.
- `2026-10-15T17:36:00.000Z`: completada l'auditoria sistèmica d'arquitectura global, fluxos d'identitat humana (Onada 1), arquitectura Feedly del Lector RSS `/app/lector` i integració amb el Snippet Curador `/notes?mode=desa` (Onada 2), patrons REA (`morluto/rea`) i contracte d'enxufabilitat Model B de Sollutia (Onada 3), i contrast creuat amb els informes de Claude (`261015_1945_auditoria_claude`) i Codex (`261015_1945_auditoria_codex`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum executiu del Gran Auditor de Sistemes i Xarxa

S'ha auditat l'arbre de codi sobre la base Git `2a65ebb6a19d985b5a457a5b388764ca8edc7bd0` sense modificar cap fitxer de `src/` (respectant l'exclusivitat d'edició de Claude Code en el Gauntlet). L'anàlisi confirma que l'arquitectura **Pedra Seca + UniversalWorkspace + Plataforma d'Apps Enxufables (Model B)** és sòlida i disposa dels ports exactes per absorbir les tres onades del Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil`, però presenta **6 paranys d'arquitectura en l'Onada 1** i **2 fronteres crítiques d'aïllament de xarxa en l'Onada 2** que el constructor ha de resoldre explícitament perquè les portes de CI i de privacitat no fallen.

---

### Bloc A · Onada 1: Fluxos d'Identitat, Poda de la 4a Columna i Emoticones Riques XL

#### T-G4-01 · Sis punts d'injecció de Copyright i Categories sobre la persona (`esPersona = mena === 'persona'`)
- **Scope afectat:**
  1. `src/components/universal/DocumentEditor.jsx:189-190, 470, 484-488, 547`
  2. `src/sections/profile/PerfilEditor.jsx:479, 594, 678`
  3. `src/sections/profile/perfilCamps.js:83` (`fitxaDeLectura`)
  4. `src/sections/profile/fitxaDePerfil.js:139-145` (`etiquetesDeFitxa`)
  5. `src/sections/profile/PerfilPublicSection.jsx:233-237, 277-278`
  6. `src/components/PedraSeca/organismes/UniversalCard.jsx:481-493, 622-624` i `src/components/universal/targetaViva.js:41-52`
- **Evidència reproduïble:**
  - En `DocumentEditor.jsx:470`, la línia `const copyrightValue = document.copyright || '© Sóc de Poble'` i `const potTriarDrets = !llicencia && Boolean(updateLocal)` (`línia 484`) pinten el peu `.page-title-copyright` i el botó `<BotoDretsAutor>` encara que `PerfilEditor` passe `copyright: ''`. El mateix ocorre en lectura/baixa a `EmptyDocumentPage` (`DocumentEditor.jsx:189-190`).
  - En `perfilCamps.js:83`, `fitxaDeLectura` re-inventa `copyright: text(dades.copyright) || \`© ${titol || 'Sóc de Poble'}\``.
  - En `fitxaDePerfil.js:144`, `etiquetesDeFitxa` retorna `[{ text: identitat?.rol }]` (`'Persona'`).
  - En `PerfilPublicSection.jsx:233-237, 277-278`, el perfil públic torna a injectar `labels={etiquetes}` (amb `'Persona'` i el poble duplicat) i `copyright={perfil.copyright || \`© ${perfil.nom}\`}`.
- **Severitat:** Alta (incompliment directe de la directiva de dignitat humana si només es toca `PerfilEditor.jsx`).
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 1, Tasca 1).
- **Proposta arquitectònica conservadora per a Claude:**
  1. Passar un senyal explícit des de `PerfilEditor` a `DocumentEditor` (p. ex. `dretsAutor={!esPersona}` o `senseDrets={esPersona}`) que desactive `copyrightValue` i `potTriarDrets` tant a l'editor actiu com a `EmptyDocumentPage`, **sense esborrar** les funcions `sincronitzaLlicenciaPerDefecte` i `desaLlicenciaPerDefecte` (`PerfilEditor.jsx:222-231, 289`) que alimenten l'herència T39 de llicència per a les notes creades per l'usuari.
  2. En `UniversalCard.jsx`, condicionar la supressió de `copyright` i de píndoles de rol al fet que **l'objecte representat per la targeta siga una persona** (`objecte?.tipus === 'persona'` o prop explícita `esPersona`), **mai** quan una persona és l'`author` d'un article, nota o esdeveniment del Mur.
  - `requires_human_decision: false`

#### T-G4-02 · Poda de la 4a columna redundant (`targetaViva: false`) preservant el bus reactiu del document viu
- **Scope afectat:** `src/sections/profile/PerfilEditor.jsx:668, 744`, `src/sections/profile/PerfilShell.jsx:52-57, 179`, `src/sections/profile/DetallVistes.jsx:98`.
- **Evidència reproduïble:**
  - En `PerfilEditor.jsx:744`, `adapter` declara `targetaViva: true`, la qual cosa fa que `UniversalEditorShell` munte `<aside className="sdp-targeta-viva">` a la 4a columna, duplicant la `FitxaDePerfil` que ja es mostra a la 2a columna (`PerfilShell.jsx:52-57`).
  - La sincronització en viu entre l'editor i la targeta de la 2a columna (i la vista «Les vistes» a `DetallVistes.jsx:98`) **no depén de l'aside de la 4a columna**, sinó del hook `usePublicaDocumentViu(identitat?.id, documentViu)` a `PerfilEditor.jsx:668`.
- **Severitat:** Mitjana (ergonomia d'escriptori i tests associats).
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 1, Tasca 2).
- **Proposta arquitectònica conservadora per a Claude:**
  - Canviar `targetaViva: false` a `PerfilEditor.jsx:744` i mantindre intacte `usePublicaDocumentViu(identitat?.id, documentViu)` a la línia 668.
  - Actualitzar `src/sections/profile/PerfilEditor.test.jsx:55-62` i `src/sections/profile/PerfilShell.targetaViva.test.jsx:113-200` perquè verifiquen l'absència de `aside.sdp-targeta-viva` al panell de detall i la presència/reacticitat de la targeta en la 2a columna i en «Les vistes».
  - `requires_human_decision: false`

#### T-G4-03 · Suport natiu d'Emoticones XL en `ItemMedia.jsx` i `NavGlyph.jsx`
- **Scope afectat:** `src/sections/profile/perfilModel.js:125, 139, 150, 161`, `src/components/universal/workspace/ItemMedia.jsx:63-70`, `src/components/universal/workspace/NavGlyph.jsx:39-44`, `src/sections/profile/PerfilShell.test.jsx:123-131`.
- **Evidència reproduïble:**
  - `ItemMedia.jsx:63-70` ja comprova `typeof glif === 'string'` i `emojiSol(glif)`, aplicant automàticament la classe `CLASSE_EMOJI_XL` (`sdp-gestor-fitxa__inicial sdp-fitxa-emoji-xl`) amb `aria-hidden="true"`.
  - Per tant, substituir a `perfilModel.js` les icones `Eye`, `Lock`, `ShieldCheck` i `Network` per `'👁️'`, `'🔐'`, `'🛡️'` i `'🌐'` activa el renderitzat XL tant en la llista de la 2a columna com en el rail plegat sense necessitat de crear CSS ni components nous.
- **Severitat:** Baixa (canvi net de model amb impacte directe en un test unitari).
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 1, Tasca 3).
- **Proposta arquitectònica conservadora per a Claude:**
  - Substituir els 4 valors `icon` a `perfilModel.js`, eliminar la importació òrfena de Lucide si ja no s'usa per a cap altre ítem, i actualitzar `PerfilShell.test.jsx:130` (`expect(item('jo-vistes').icon).toBe('👁️')`).
  - `requires_human_decision: false`

#### T-G4-04 · Ergonomia Responsiva del Xat (`ClosCaXat.jsx` i `amplariaColumnes.js`)
- **Scope afectat:** `src/sections/xat/components/ClosCaXat.jsx:68-122`, `src/sections/xat/amplariaColumnes.js:13-32`, `src/components/layout/AppGridShell.jsx`.
- **Evidència reproduïble:**
  - `ClosCaXat.jsx` comparteix el rail entre `/xat` i `/control-xat`, usant `PRESETS_AMPLARIA` (`compacta`, `defecte`, `ampla`) en mode `ample` i un panell lliscant (`BotoObriRail`) amb retorn de focus temporal (`marcaRetornFocus` / `recullRetornFocus`, finestra de `1000ms`) en modes `estret` i `mitjà`.
- **Severitat:** Informativa / Preventiva per a la Fase 2.
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 2).
- **Proposta arquitectònica conservadora:**
  - En polir les proporcions de columnes en la Fase 2, conservar íntegre el mecanisme `recullRetornFocus()` i l'atribut `inert` del panell lliscant fora d'`ample` per no degradar l'accessibilitat de teclat ja certificada a `ClosCaXat.test.jsx`.
  - `requires_human_decision: false`

---

### Bloc B · Onada 2: Lector RSS (`/app/lector`), Patró Feedly i Integració amb el Snippet Curador

#### T-G4-05 · Frontera d'Aïllament de Xarxa (`frontera.test.js`) i Substitució de les 5 Fonts pels Divulgadors Reals
- **Scope afectat:**
  - `src/apps/lector/frontera.test.js:35, 65, 80, 94-112`
  - `src/apps/lector/privacitat.test.jsx:43-44`
  - `src/apps/lector/llavor/cataleg.js` i `src/apps/lector/llavor/*.xml`
  - `src/apps/lector/fontNoticies.js`
  - `src/sections/text/legalContent.js:199-203`
- **Evidència reproduïble:**
  - L'apartat 23 de `src/sections/text/legalContent.js:199-203` reconeix exactament **5 divulgadors tecnològics reals**:
    1. **Emowe (Marcos)** (`https://emowe.com`, `https://emowe.com/blog`, `https://www.youtube.com/@emowe`)
    2. **Xavier Mitjana** (`https://iaenaccion.com`, `https://www.youtube.com/@XavierMitjana`)
    3. **Jon Hernández** (`https://www.jonhernandez.education`, `https://www.youtube.com/@la_inteligencia_artificial`)
    4. **Ben Cord (Benjamín Cordero)** (`https://www.youtube.com/@bencord`, `https://www.skool.com/imperio/about`)
    5. **Migue Baena** (`https://www.youtube.com/@MigueBaenaIA`)
  - Actualment `src/apps/lector/llavor/cataleg.js` carrega 5 XML ficticis (`veu-placa.xml`, `pregoner.xml`, `colla-dimonis.xml`, `cooperativa.xml`, `club-pilota.xml`).
  - **Restricció crítica de porta:** `src/apps/lector/frontera.test.js` imposa tres candats mecànics:
    1. Prohibeix `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` i qualsevol literal `http://` o `https://` dins dels fitxers JS/JSX de producció de `src/apps/lector/` (`línies 94-104`).
    2. Exigeix que `LLAVOR_XML` tinga exactament 5 fitxers XML (`línies 65, 80`).
    3. Rebutja qualsevol domini dins de `src/apps/lector/llavor/*.xml` que no estiga en `DOMINIS_LLAVOR` (`example.org`, `purl.org`, `search.yahoo.com`, `www.w3.org`) (`línies 35, 106-112`).
- **Severitat:** Alta (qualsevol intent d'escriure URLs `https://` dins de `cataleg.js` o de fer `fetch()` dins de `src/apps/lector/` trencarà `frontera.test.js` immediatament).
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 3) vs `src/apps/lector/frontera.test.js` (Model B).
- **Proposta arquitectònica conservadora:**
  1. **Llavor canònica dels 5 divulgadors:** Substituir el contingut dels 5 XML de `src/apps/lector/llavor/` (mantenint el recompte de 5 fitxers) i les categories/metadades de `cataleg.js` pels 5 divulgadors reals (`Emowe`, `Xavier Mitjana`, `Jon Hernández`, `Ben Cord`, `Migue Baena`). Posar les URLs `https://` **només dins dels fitxers `.xml`** (mai com a literals en `.js`), i afegir els dominis oficials (`emowe.com`, `iaenaccion.com`, `www.jonhernandez.education`, `www.youtube.com`, `www.skool.com`) a `DOMINIS_LLAVOR` en `src/apps/lector/frontera.test.js:35`.
  2. **Connector de xarxa en viu fora de l'app (Model B pur):** Si s'activa descàrrega RSS en viu o resolució de `fontsPersonals`, el `fetch` ha de viure en un **adaptador d'amfitrió fora de `src/apps/lector/`** (p. ex. a `src/apps/plataforma/` o `src/services/`) que implemente el contracte `validaPortNoticies` (`{ categories, fonts, articles, article }`) i s'injecte via `ProveidorNoticies` o `window.SocDePobleLector.registraPortNoticies(port)`.
  3. **Privacitat d'imatges (`imatgePrivada`):** Mantindre el filtre d'`UniversalCard` (`imatgePrivada` en `Noticies.jsx:208`) i registrar només els orígens d'imatge autoritzats via `permetOrigenMitjans(origin)` perquè `privacitat.test.jsx` continue en verd.
  - `requires_human_decision: false`

#### T-G4-06 · Patró Feedly en `Noticies.jsx` i `Lector.jsx` i Pont Bidireccional amb el Snippet Curador (`/notes?mode=desa`)
- **Scope afectat:**
  - `src/apps/lector/vistes/Noticies.jsx:168-259`
  - `src/apps/lector/vistes/Lector.jsx:131-165`
  - `src/sections/notes/SnippetCurador.jsx:19-33, 101-133`
  - `src/apps/plataforma/destinacions.js:49-99`
  - `_wiki_de_poble/04_escriptori/01_produccio/260911_0012_agenda_futur_extensio_chrome.md`
- **Evidència reproduïble:**
  - El sentit **Snippet Curador -> Lector** ja està operatiu: `SnippetCurador.jsx` consulta `useDestinacioEnllac('lector')` (`destinacions.js:122`) i permet afegir qualsevol URL externa com a font personal al Lector (`fontsPersonals.js:249`).
  - Tanmateix, el sentit invers (**Lector -> Snippet Curador / Bloc de Notes / Mur**) no està exposat a la barra d'accions de `Lector.jsx`: un usuari que llig un article d'Emowe o Xavier Mitjana al Lector pot marcar-lo per a després (`commutaDesat`) o obrir la web externa (`article.enllac`), però no té un botó directe per enviar l'article al Snippet Curador (`/notes?mode=desa&url=...`) i transformar-lo en una nota enriquida o publicació del Mur segons l'arquitectura prevista a `260911_0012_agenda_futur_extensio_chrome.md`.
- **Severitat:** Mitjana (oportunitat d'integració sistèmica d'alt valor en l'Onada 2).
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 3) i `260911_0012_agenda_futur_extensio_chrome.md`.
- **Proposta arquitectònica conservadora:**
  - Mantindre la doble vista Feedly de `Noticies.jsx` (`Revista` en llista densa amb `variant="pla"` i `Targetes` en graella amb `variant="default"`) i la lectura in-place `PaginaApp` de `Lector.jsx`.
  - Per tancar el cercle amb el Snippet Curador sense trencar l'aïllament de `src/apps/lector/`, declarar un callback opcional al context de l'amfitrió o una ruta interna segura cap a `/notes?mode=desa` (quan l'amfitrió és la SPA de Sóc de Poble) que permeta «Curar al Bloc de notes» qualsevol article del Lector amb `url`, `titol` i `resum` preomplits.
  - `requires_human_decision: false`

---

### Bloc C · Onada 3: Benchmarking REA (`morluto/rea`), Loyverse TPV, Holded Gestoria i Enxufabilitat Sollutia

#### T-G4-07 · Contracte d'Esdeveniments TPV -> Gestoria i Enxufabilitat Model B de Sollutia
- **Scope afectat:** `src/apps/lector/index.js`, `src/apps/plataforma/destinacions.js`, `src/sections/mercat/`, `src/sections/gestoria/`.
- **Evidència reproduïble:**
  - L'eina d'enginyeria inversa **REA** (`github.com/morluto/rea`, reconeguda a `src/sections/text/legalContent.js:204`) estableix el patró de deconstrucció d'interfícies de referència (Feedly, Loyverse POS, Holded ERP) cap a components de Pedra Seca.
  - Tant el Lector com els mòduls de TPV i Gestoria han de poder muntar-se dins de la SPA o encastats al CRM de Sollutia (WordPress / Shadow DOM `.sdp-root`) mitjançant el patró **Model B**: l'app exporta un manifest net i rep les dades i persistència a través d'un Port validat (`validaPort*`), sense acoblar-se a `SessionContext` ni fer crides de xarxa no declarades.
- **Severitat:** Mitjana (governança arquitectònica per a la Fase 4).
- **Font de veritat en conflicte:** Pla `261015_1900_pla_implementacio_xat_identitat_i_perfil` (Fase 4).
- **Proposta arquitectònica conservadora:**
  1. **Loyverse TPV:** Desacoblar la interfície de caixa ràpida (catàleg tàctil + tiquet viu + cobrament efectiu/targeta/Bizum + tancament X/Z) en un port d'operacions de venda que emeta assentaments normalitzats (`{ id, data, concepte, baseImposable, tipusIva, quotaIva, total, metodePagament, estatConciliacio }`).
  2. **Holded Gestoria:** Consumir el mateix contracte d'assentaments per alimentar el quadre de comandament (ingressos, despeses, resultat net, previsió d'IVA Model 303 i IRPF Model 130, i estat de conciliació bancària) amb semàfors deterministes (`semafor.js`: cap verd inventat si falta una font de dades, mostrant `N/A` honest).
  - `requires_human_decision: false`

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Comanda / Font | Resultat observat |
| --- | --- | --- |
| Porta Olivera (pre-check) | `node tooling/gates/porta-olivera.mjs` | **PASS** (eixida `0`) |
| Porta Taxonomia sobre l'informe | `node tooling/gates/porta-taxonomia.mjs` | **PASS** (`261015_1945_auditoria_gemini4.md` compleix T1-T6) |
| Contracte Reflex de creació | `node tooling/wiki/document.mjs context` + `create` | **PASS** (`reflex: sdp:torn_89d082e5-e7aa-4407-ac9f-7149a2f180d8:67774061-56e3-4504-b88b-9c551b3c497c`) |
| Inspecció estàtica d'Onada 1 (`src/sections/profile/`, `DocumentEditor.jsx`, `UniversalCard.jsx`, `ItemMedia.jsx`) | Lectura directa de codi i tests | **PASS** (identificats els 6 punts d'injecció de copyright/categories, l'estat de `targetaViva` i el suport d'`emojiSol` XL) |
| Inspecció estàtica d'Onada 2 (`src/apps/lector/`, `SnippetCurador.jsx`, `destinacions.js`, `legalContent.js`) | Lectura directa de codi i `frontera.test.js` | **PASS** (identificats els 5 divulgadors reals i els 3 candats de `frontera.test.js`) |
| Contrast amb l'auditoria adversarial de Codex | `_wiki_de_poble/04_escriptori/261015_1945_auditoria_codex.md` i `261015_1933_acta_marmota_codex_fase1.md` | **CONCORDANT** (coincidència plena en la diagnosi de `DocumentEditor.jsx`, `fitxaDeLectura`, `PerfilPublicSection.jsx`, guarda d'`objecte` a `UniversalCard` i herència T39) |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Immunitat de `src/`:** Com a auditor d'arquitectura i xarxa (Gemini 4 Argon), no s'ha modificat cap fitxer de `src/` ni de `tests/` per no interferir amb el constructor exclusiu (Claude Code).
- **Estat del pegat de Fase 1 en el moment del tall:** En el moment d'emetre aquest informe, Claude Code ha obert el seu esborrany (`261015_1945_auditoria_claude.md`) però encara no ha bolcat el diff de Fase 1 a `src/`. Les directrius d'aquest informe actuen com a **contracte d'arquitectura preventiu i full de ruta vinculant** per a les Fases 1, 2, 3 i 4.
- **Zero processos zombis:** Cap tasca en segon pla ni cron obert per Gemini 4 Argon (`AGENTS.md §6.5`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261015_1900_pla_implementacio_xat_identitat_i_perfil]]
- [[261015_1900_prompt_gauntlet_claude_codex_gemini]]
- [[261015_1945_auditoria_claude]]
- [[261015_1945_auditoria_codex]]
- [[261015_1933_acta_marmota_codex_fase1]]
- [[260911_0012_agenda_futur_extensio_chrome]]
- [[02_genotip]]
- [[auditoria_canonica]]

