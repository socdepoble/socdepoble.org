---
type: informe
status: esborrany
description: Auditoria de la Consola Termodinàmica, la llavor H3–H6 i l’arquitectura de targetes TipTap, amb proves locals i proposta per al consens.
tags: [auditoria, codex, arquitectura, trellat]
visibility: private
reflex: sdp:torn_dbc4b37a-fdfc-431b-aa18-0def0574ad05:eddf9f9f-3916-40de-908b-f393b625023d
---
# Auditoria Codex · Consola Termodinàmica i Supereditor

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-260923-2205 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 22:05 Europe/Madrid |
| Modificació | 26-09-23 22:11 Europe/Madrid |
| Propietari | Codex · Olivera |
| Plantilla | auditoria_canonica.md, ruta auditoria v2.0.0 |
| Ruta | auditoria |
| Rebut | sdp:torn_dbc4b37a-fdfc-431b-aa18-0def0574ad05:eddf9f9f-3916-40de-908b-f393b625023d |
| Tall d’evidència | HEAD f03affcb33121e024f508a35ec6a50816311d731 + arbre de treball observat el 23-09-2026, 22:00–22:10 Europe/Madrid |
| Aprovació humana | Auditoria autoritzada pel prompt; implementació pendent del consens i vistiplau fixats al pla |
| requires_human_decision | true: validar el pla abans de canviar codi; recuperar la definició de les 13 mètriques |
| Model IA | GPT-6 · variant no exposada |
| Tokens consumits | Mesurats: no disponibles per a este torn. Estimats: no calculats; no s’imputa un valor fictici |

## Acte reflex

Llegits AGENTS.md, BOOTSTRAP, genotip, índex mestre, estat actual, prompt rebut, pla T4, plantilla local sencera i plantilla d’auditoria entregada per `document.mjs context`. Aplicats els procediments `wiki-documentacio-i-reflex`, `sdp-workflow`, `wiki-busca-skills` i les regles visuals de `sdp-pedra-seca`.

Abast efectiu: auditoria, proposta tècnica, ancoratge i relleu documental. El prompt ordena explícitament: «Cap codi es canviarà fins que tots hàgem validat el Pla d’Implementació». El pla T4 exigix les dos auditories i el vistiplau del Mestre. No hi havia cap auditoria T4 de Claude al tall consultat. Esta entrega no declara consens en nom seu i no implementa la consola ni modifica les notes.

El repositori ja conté nombrosos canvis aliens sense commit. Les evidències corresponen al disc, no exclusivament a HEAD. No s’han llegit còpies de regles de l’arxiu ni de `.brain-trash`, no s’ha arxivat res i no s’ha alterat la zona humana.

## Historial

- 23-09-2026: revisió del pla T4, inspecció de fonts, consulta de documentació oficial de TipTap, proves de transformació HTML, tests de notes i lint acotat. Primera aportació de Codex a la pissarra compartida.

## Troballes

### 1. P1 · Falta la font de les 13 mètriques

La ruta `.agents/skills/consola-termodinamica/SKILL.md` del prompt no existix. Tampoc apareix una skill equivalent en el catàleg físic actiu; el pla, a més, cita el nom diferent `consola_termodinamica/SKILL.md`. No és possible certificar els tretze noms, distribució i fórmules sense esta font. No he inventat una llista per completar el recompte.

La font canònica disponible, `_wiki_de_poble/02_saber/03_consola_termodinamica.md`, establix contractes de mesura i declara tombstones CRDT no aplicables a la baseline. `index_trellat.md` declara que IT no té telemetria integrada. No impedixen el mock visual autoritzat, però obliguen a identificar-lo com a tal.

Proposta per al consens: recuperar o designar la font viva de les tretze mètriques abans de donar per complet el catàleg. Mentrestant, es pot concretar el contenidor dels quatre blocs i l’adaptador de dades. `requires_human_decision: true` si no es pot resoldre la font amb MarIA/Claude.

### 2. P1 · La llavor H5–H6 perd jerarquia amb l’esquema actual

`src/components/universal/richText/useUniversalRichText.js:30` configura `heading.levels: [2, 3, 4]`. La prova amb els paquets instal·lats transforma `<h5>H5</h5><h6>H6</h6>` en `<p>H5</p><p>H6</p>`. Amb `[2,3,4,5,6]`, conserva les dos capçaleres. Afegir només HTML a la nota no satisfà la petició.

La creació real passa per `NotesSection.jsx:125–139` → `NotesDataContext.jsx:385` → `src/data/supabase/notes.js:103`. Actualment l’adaptador desa `input.content || ''`; no genera una guia. La proposta mínima és afegir la plantilla a `onCreate` de NotesSection, o a un mòdul de plantilles propi de notes, i ampliar l’esquema compartit fins a H6. No cal inserir exemples a notes existents ni convertir el repositori Supabase en una capa de contingut didàctic. Si es trasllada el valor per defecte a `creaNota`, aplicar-lo només quan `input.content === undefined`; una cadena buida explícita ha de continuar buida.

Plantilla proposada, íntegra i editable:

```html
<h3>Subtítol opcional (H3)</h3>
<p>Text de paràgraf de prova, pots esborrar-lo i escriure la teua nota. H3 obri un apartat dins del document.</p>
<h4>Subapartat (H4)</h4>
<p>Este nivell desenvolupa una part de l’apartat H3 anterior.</p>
<h5>Detall del subapartat (H5)</h5>
<p>Usa H5 quan necessites un nivell més de detall dins d’H4.</p>
<h6>Detall específic (H6)</h6>
<p>H6 és l’últim nivell d’encapçalament. Per a continuar escrivint, usa un paràgraf normal.</p>
```

`sanitizeHtml` admet H3–H6 i `src/css/base.css`/`tokens.css` ja els donen estil. Cal validar-los dins del visor real. La prova de creació remota necessita sessió i backend: la lectura de notes seed no autoritza escriptures locals fictícies. El mode bàsic/supereditor és treball futur, separat d’esta llavor.

### 3. P1 · Reutilitzar el rol real i protegir també l’accés directe

`SessionContext.jsx:33` ja exposa `esSuperadmin`, derivat del rol, i `/consola` està protegida amb `RequireAuth rol="superadmin"` en `App.jsx:562`. La Wiki té la seua ruta pròpia i el detall nou ha de comprovar el permís, encara que s’amague l’entrada del menú. El nom visible «Sóc de Poble» no és una credencial.

Proposta: `estat === 'dins' && esSuperadmin` per a dades reals; mentre s’està comprovant la sessió, no muntar ni carregar la consola. Si el desenvolupament necessita la simulació autoritzada pel Mestre, encapsular-la com `import.meta.env.DEV && demoExplicitamentActivada`. La demostració només lliura fixtures i mostra «Accés simulat · dades de demostració»; no habilita l’endpoint real ni canvia el rol global. En producció, no hi ha bypass i l’absència de backend dona estat no disponible. Un futur servei de producció ha de verificar el rol al servidor.

Criteris negatius: visita directa amb `?item=consola_termodinamica`, usuari ordinari, sessió en càrrega, eixida de sessió amb el panell obert i build de producció amb el mode demo demanat. Cap d’estos casos ha de mostrar ni recuperar dades reservades.

### 4. P2 · La integració ha de resoldre també els ítems sintètics

`WikiDePobleSection.jsx` ja usa `UniversalWorkspace`, amb categories i ítems sintètics per a portada i graf. Afegir el tercer parell `consola_termodinamica_cat` / `consola_termodinamica` al model, condicionat al permís, i una branca de detall que munte la consola amb la mateixa comprovació.

La resolució de `activeItem` consulta només `wikiManifest.items`, que no conté els ítems sintètics. En implementar, resoldre la selecció sobre el model complet —o un mapa explícit per a les tres eines— perquè la URL directa, la categoria seleccionada i la recàrrega siguen coherents. Cal mantindre portada i graf operatius i no substituir el shell de columnes.

### 5. Disseny concret del tauler i contracte dels mocks

Component proposat `src/sections/wiki-de-poble/ConsolaTermodinamica.jsx`, CSS encapsulat amb prefix `sdp-termo__` i catàleg/adaptador independent. Reutilitzar `UniversalPage`, `Taula`, `Progres`, `Insignia`, `Alerta` i els estats buits de Pedra Seca. `ConsolaSection.jsx` ja n’és un precedent actiu; el nou panell complementa la consola administrativa existent.

Ordre visual: capçalera «Consola Termodinàmica», etiqueta de font i data; resum de cobertura (mesurades / total), avisos i absències; mapa de tensió; quatre blocs de mètriques. En ample suficient, graella de dos columnes; en mòbil, una columna dins del visor. Cada node del mapa és un botó amb nom i estat textual que enfoca la seua fila. El mapa és una visualització conceptual fixa de dependències declarades, no una simulació física ni una prova causal.

| Bloc requerit | Presentació i límit actual |
| --- | --- |
| Cognitiu i Simbiosi | IT 92% només com a fixture identificada; consum desconegut si no hi ha registres; no deduir saturació cognitiva del pes dels fitxers |
| Estructural | Inventari i pes de fonts mesurables; integritat amb scope i resultat de la porta |
| Rendiment i Dispositiu | Dades reals requerixen navegador i dispositiu identificats; la RAM de Node no és la del navegador |
| Resiliència | Resultats de proves identificades; tombstones 40% només en demo i N/A en mode real sense CRDT |

El catàleg final tindrà tretze entrades després de reconciliar-les amb la skill viva. Cada entrada: `id`, `block`, `label`, `unit`, `value`, `source` (`mock`, `measured`, `unavailable`, `not-applicable`), `observedAt`, `scope`, `formula`, `numerator`, `denominator`, `thresholds`, `direction`, `evidence`. Els llindars d’un mock també són demostratius. Valors absents no es convertixen en zero; percentatges amb denominador nul no es calculen. Una barra no representa una magnitud sense màxim significatiu.

Fixtures deterministes, sense `Math.random`, sense animació que aparente una mesura en directe i carregades exclusivament en DEV. Escenaris: normal, tensió, crític, dades parcials, no aplicable i error. En mode real, un error de càrrega no cau silenciosament al mock. Les alertes no desencadenen neteges ni canvis de codi.

Colors des dels tokens semàntics de fons, text, acció i estat; cap HEX nou. Crom gira la marca, però els estats necessiten etiqueta i icona a més del color. Contrast verificat sobre les paletes resultants; no assumir-lo constant perquè ho diga un comentari de `crom.js`. Focus visible, objectius tàctils del sistema i alternativa textual al mapa. Cap dependència de gràfics ni motor WebGL és necessària per a tretze nodes. Un element visual nou s’ha de mostrar primer al catàleg de disseny, segons Pedra Seca.

### 6. Telemetria real: ja hi ha una base aprofitable

`tooling/vite/consola-iaia.mjs` està registrat en `vite.config.js`. Implementa `GET /__iaia/consola.json`, només amb `apply: 'serve'`, mètode GET i origen de socket loopback. Agrega rebuts, skills, segell i diari immunitari. Eixa restricció local no és autenticació superadmin; no s’ha de publicar com a API de producció.

Mesura puntual executada a les 22:05:27 Europe/Madrid:

| Senyal | Resultat observat | Interpretació |
| --- | --- | --- |
| Fitxers regulars dins de `src` | 261 | Recompte recursiu, sense seguir symlinks |
| Bytes dels fitxers regulars de `src` | 2.156.071 | Grandària lògica; no RAM ni pes del bundle |
| Rebuts del col·lector existent | 38 | Registres, no percentatge de comprensió |
| Entrades `consum.tokens` | 0 | Consum desconegut; no significa zero consum |
| Skills al col·lector | 18 | Inventari del moment |
| Crèdits | Sense font | N/A |
| Segell | Present | Existència, no verificació d’integritat |

Sí, es poden substituir alguns mocks per dades de Node: comptar fonts i bytes, consumir resultats ESLint JSON, i llegir resultats de portes amb versió i hora. Fer-ho en un col·lector acotat i només de lectura, amb pressupost de temps i caché; no executar un lint complet a cada render o petició. Parseig fallit, timeout o exit 2 del linter és error de mesura, no zero avisos. Excloure dependències, builds, arxius històrics i secrets; no acceptar rutes arbitràries del navegador. En producció, proposar agregats de CI servits per backend autoritzat.

No convertir bytes, avisos o recompte de rebuts en IT ni en saturació de la IA sense model validat. No usar el prototip de `trellat_metrics.mjs` com a fórmula canònica: el mateix fitxer advertix que és històric.

### 7. Arquitectura del Supereditor amb UniversalCards

**Base existent.** TipTap 3 declarat en `package.json`; el hook accepta extensions, hi ha menú `/`, i `SdpImage` ja usa `ReactNodeViewRenderer`. La barra té contracte neutre a `toolbarContract.js` i adaptador propi. `UniversalCard` viu a `src/components/PedraSeca/organismes/UniversalCard.jsx`. Per tant, és una ampliació de l’arquitectura actual.

**Node proposat.** `UniversalCardNode`, `group: 'block'`, `atom: true`, seleccionable i arrossegable, amb atributs versionats `{schemaVersion: 1, entityType, entityId, presentation}`. No guardar JSX, callbacks, tokens, rols ni una còpia completa de l’entitat dins del document. Validar tipus i identificador; resoldre l’entitat amb el backend i els permisos de la sessió. Els resultats han de poder ser carregant, sense accés, eliminada o error, sense exposar títols privats en fallbacks.

**Vista.** `ReactNodeViewRenderer(UniversalCardNodeView)`, contenidor `NodeViewWrapper` no editable amb `contentEditable={false}` i una UniversalCard configurada per al context de document. Inserció des de `/targeta` o selector; seleccionar el bloc i navegar són accions diferents per a no perdre el cursor. Botons amb teclat, eliminació i undo/redo; usar la nansa de drag del node. Evitar targetes recursives i muntatges massius; resoldre entitats repetides amb caché/consultes agrupades per sessió.

**Serialització.** Ara es desa HTML amb `editor.getHTML()`. Mantindre eixe contracte en la primera fase: `parseHTML` i `renderHTML` sobre un `<div data-sdp-node="universal-card" …>` que continga un enllaç segur com a representació estàtica. El NodeView React no és el format desat ni l’exportació. La proposta es basa en la [documentació oficial de NodeViews](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views) i [NodeViews React](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react).

La prova amb DOMPurify del projecte conserva `data-sdp-node`, `data-entity-id` i `data-kind`, malgrat que no figuren en `ALLOWED_ATTR`: no assumir que tots els atributs `data-*` s’eliminen. Cal un contracte explícit d’atributs i validació en el parser del node, amb regressions XSS i d’anada/tornada. `dangerouslySetInnerHTML` no hidrata components React: els lectors de documents hauran de tindre renderer controlat o conservar l’enllaç estàtic. Els lectors antics no han de destruir silenciosament els blocs en tornar a desar.

**Modes.** Bàsic i supereditor compartixen una única instància i el mateix esquema de nodes; només varia la barra visible. Amagar opcions no pot desactivar el parser de cards o H5/H6, perquè es perdria contingut en alternar modes. Memoritzar extensions. Afegir grups al contracte neutre per text, estructura i inserció, amb barra expandible accessible; no substituir totes les peces de la barra en esta entrega.

**Evolució del format.** JSON versionat de TipTap és una opció futura, amb migració explícita, lectura compatible i control de revisió, segons la [documentació de persistència](https://tiptap.dev/docs/editor/core-concepts/persistence). No introduir dos fonts de veritat HTML/JSON independents. L’autodesament, conflictes i canvi ràpid de nota han de continuar vinculats a la nota i revisió correctes.

**ePub futur.** Exportador separat que transforme blocs en XHTML semàntic, índex d’encapçalaments i recursos autoritzats, amb metadades i paquet ePub validat. Les cards es convertixen en representacions estàtiques o enllaços; no en components React executables. Cal acordar després política d’exportació de contingut privat i mitjans. No cal dependència nova per a l’auditoria o la llavor.

### 8. Consens i millores del prompt

Propose que Codex assumisca, després de l’aprovació, consola, integració Wiki i proves d’accés. Propose que Claude revise l’arquitectura de l’editor i assumisca la llavor amb H5/H6; és una distribució suggerida, no una acceptació de Claude. Si canvia el repartiment, reflectir-ho al pla abans de tocar fitxers compartits.

Millores concretes de la plantilla: declarar `fase: auditoria` o execució i l’evidència d’aprovació; no combinar títol «Execució» amb prohibició de modificar codi; corregir la numeració duplicada 4; posar ruta real i versió del catàleg de mètriques; distingir mock de mesura i permís simulat de rol real; no predir on es crea la nota sense seguir el flux; exigir criteris d’acceptació i fonts de telemetria.

El prompt desat falla `document.mjs check`: falta `reflex` persistent al frontmatter i `termodinamica` queda fora de l’enum. El rebut textual de la taula no el substituïx. El pla original usa `type: pla_implementacio` i tags aliens a l’esquema; es normalitza el pla compartit amb rebut real, preservant-ne el contingut. S’ancoren els dos documents actius i l’auditoria. No es corregix el prompt rebut ni s’arxiven els enllaços antics com a efecte lateral d’esta auditoria.

L’enllaç `_wiki_de_poble/05_skills_superadmin -> ../../.agents/skills` apunta fora del repositori i està trencat. Es registra com a deute preexistent que pot fer fallar les portes, no com a autorització per reparar-lo.

## Verificació

- Prova Node + JSDOM + paquets TipTap instal·lats: conversió d’H5/H6 a paràgrafs reproduïda amb `[2,3,4]`; conservació amb `[2,3,4,5,6]`. Executada en memòria, sense editar fonts.
- Prova del sanejador amb el marcador de card: conserva els tres atributs `data-*` i afegix `rel` segur a l’enllaç.
- `vitest run src/sections/notes/NotesDataContext.test.jsx src/sections/notes/NotesContext.test.jsx`: **6/6 proves**, dos fitxers, 1,13 s.
- ESLint sobre WikiDePobleSection, NotesSection, useUniversalRichText, extensions/index i consola-iaia: **0 errors, 0 avisos**. No és un lint global.
- Inventari Node i col·lector existent executats; resultats a §6. Cap lectura de secrets ni petició d’escriptura al backend.
- Validació documental: auditoria i pla compartit passen `document.mjs check` amb `valid: true`. Tancament executat: `valid: false`, estat `planned`. Passen plantilles, autoritat i LEDGER; fallen segell (hash divergent), projeccions del catàleg de skills, Wiki estricta i SCC (enllaços/orfes, symlink de skills i estil inline preexistent de PageFrame.jsx:254). No s’han reparat ni resegellat fonts alienes per forçar el verd.

Proves d’acceptació després d’implementar: exactament 13 mètriques reconciliades, quatre blocs, font visible, mock només DEV, estats d’error sense fallback fictici, permisos negatius i revocació, URL directa i recàrrega, mòbil/escriptori, teclat/contrast amb Crom i cap regressió del graf. Notes: nova nota amb H3–H6 conservats després de desar i reobrir, buidatge voluntari, notes antigues intactes, autodesament i conflictes. Cards: insert/edit/delete/undo/redo, round-trip, contingut inaccessible i lector estàtic.

Lectura creuada a les 22:11: ha aparegut [[260923_2210_auditoria_claude]], encara amb Troballes/Verificació/Límits i model/tokens pendents. La seua descripció indica que ja hi ha consola protegida, coherent amb §3 i §6; això no acredita encara consens sobre el nou tauler. El primer tancament també assenyalava eixe esborrany incomplet. Es declara la propietat dels fitxers d’este torn per no validar l’informe alié com si fora una entrega de Codex.

## Límits

No hi ha implementació de producte en este torn, perquè la fase AFK està ordenada pel prompt. No s’ha validat visualment una consola que encara no existix ni s’ha provat creació remota de notes. La skill absent impedix acreditar el catàleg sagrat complet; recuperar-la és un prerequisit concret, no una ocasió per inventar-lo. El mapa històric no s’ha recuperat de còpies antigues; el disseny proposat interpreta la petició i necessita la revisió prevista al pla.

Cap test passat declara el repositori globalment saludable. No s’ha fet commit, desplegament o canvi de dependències. L’acta Marmota global de final de conversa continua pendent; este informe i ESTAT deixen el relleu del torn.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_2153_pla_implementacio]]
- [[260923_2153_prompt_execucio_olivera]]
- [[03_consola_termodinamica]]
- [[index_trellat]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
