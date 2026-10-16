---
type: informe
status: esborrany
description: 'Informe de construccio de la Fase 1 del Gauntlet: canvis al Perfil, decisions, proves i verificacio visual a localhost:3340.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_e4c36826-90f2-41ca-ba9d-6dc51115a85a:ad338cd9-dd82-4780-b6fb-2f4e7b1b9964
---
# Informe del constructor Claude — Fase 1: dignitat de persona, poda de la targeta i emoticones

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e4c36826-90f2-41ca-ba9d-6dc51115a85a:ad338cd9-dd82-4780-b6fb-2f4e7b1b9964 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T17:27:44.036Z |
| Modificació | 2026-10-15T17:55:00.000Z |
| Propietari | claude |
| Aprovació humana | Mode Direcció Autònoma sota la IAIA MarIA; sense consulta al Mestre |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code |
| Tokens consumits | No mesurats pel runtime local (cap xifra inventada) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-15T17:27:44.036Z: esborrany creat amb `document.mjs context` i `create` sota el torn `torn_e4c36826`.
- 2026-10-15T17:30:00.000Z: mapa de lectura amb 5 lectors en paral·lel (copyright, etiquetes, `targetaViva`, emoticones, línia base). Línia base: `src/sections/profile/` 40 fitxers i 500 proves en verd.
- 2026-10-15T17:40:00.000Z: llegits l'informe de Codex, el seu contracte d'acceptació a `/tmp/sdp-codex-fase1-qa/` i, després, l'auditoria de Gemini i l'acta de Codex. Pegat de Fase 1 aplicat a `src/`.
- 2026-10-15T17:50:00.000Z: proves actualitzades de manera deliberada (citant la directiva nova) i proves noves. Pendents 1 i 4 de l'acta de Codex resolts. Revisió adversarial del diff en curs.
- 2026-10-15T18:05:00.000Z: revisió adversarial acabada (4 dimensions, 28 agents, 2 refutadors per troballa): 12 troballes sobreviuen, cap crítica ni alta. Sis arreglades al codi i quatre elevades a MarIA com a decisió (vegeu «Revisió adversarial»).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen del constructor

**Fase 1 (T1–T4) picada i en verd.** Base Git `2a65ebb6`. Tots els canvis són a `src/`; cap fitxer de governança, Supabase, dependències ni zona humana tocat.

### T1 · Dignitat de persona: sense drets d'autor ni categories

**La regla:** una persona no és una obra ni es categoritza. Mana el tipus de l'**objecte** representat, mai el de l'autor: una nota o un article signats per una persona conserven drets, etiquetes i l'enllaç a «Drets d'autor» (l'ordre del 261007 continua viva per a tota obra).

- **`src/components/PedraSeca/organismes/UniversalCard.jsx`:** si `objecte?.tipus === 'persona'` (el descriptor d'`objecteDePerfil`), la targeta no pinta `labels` ni `copyright`. El poble continua a l'autoria (`location`). Afecta les targetes de persona del directori (`SectionItemCard` deriva el descriptor de `/gent/:id`): «Veïna» desapareix; la IA, l'entitat i el grup no canvien.
- **`src/components/universal/DocumentEditor.jsx`:** clau d'adaptador nova i voluntària, `ambDrets` (per defecte `true`, el DOM de sempre). Amb `false`: cap píndola de drets, cap línia de copyright a la capçalera (tampoc la reserva «© Sóc de Poble»), cap vista de drets i la ranura `llicencia` s'ignora. Calia: buidar `document.copyright` no bastava, perquè la línia 470 hi posava «© Sóc de Poble».
- **`src/sections/profile/perfilCamps.js`:** per a la persona, `fitxaDeLectura` i `documentDeFitxa` tornen `copyright: ''` (també ignorant un esborrany vell de la cua). Així l'editor, la targeta de la llista, «Les vistes», la Vista A4 i la portada queden nets per una sola via. Funció nova `copyrightDeFitxa`: la **dada** (la desada o el «© Nom» de reserva), que fa de base de comparació de l'autodesament (T47). `CAMPS_FITXA.persona.copyright` es conserva com a contracte de dades.
- **`src/sections/profile/fitxaDePerfil.js`:** `etiquetesDeFitxa` ja no posa el rol («Persona») a la persona. Conserva les píndoles d'**estat** («Baixa en curs», «Sense connexió»): són avisos honestos, no categories.
- **`src/sections/profile/PerfilEditor.jsx`:** la persona porta `ambDrets: false` i cap `dretsAutor` ni `dretsTriats`. `valorServidor` i la comparació «igual» de `saveRemote` usen `baseDelServidor` (`copyrightDeFitxa` per al camp `copyright`): un esborrany vell de «Desar autoria» no entra en un conflicte fals.
- **`src/sections/profile/PerfilPublicSection.jsx`:** la fitxa pública d'una persona (pel tipus del seu `objecteDePerfil`) no porta drets ni la píndola «Persona». Es queden el poble (la seua única categoria) i «La teua fitxa» (pertinença).
- **`src/components/universal/drets/CopyrightPage.jsx`:** l'avís de l'àmbit `publicacio` (la vista de drets de cada nota) ja no envia ningú «a la teua fitxa del Perfil», que per a una persona ja seria fals. Diu el que és cert per a qualsevol actor: amb quins drets naixen les notes noves i que ací només canvia esta.
- **`src/components/universal/DocumentPrintPreview.jsx`:** sense drets, la Vista A4 i la portada no emeten cap `<footer>` buit.
- **`src/sections/disseny/cataleg/detalls/EspecimenUniversalCard.jsx`:** el catàleg documenta l'excepció.
- **`src/components/universal/drets/herencia.js`:** la capçalera diu ara com queda l'herència de la persona.

**L'herència T39 continua intacta.** El mirall servidor → preferència de `PerfilEditor` (`idHerencia`, `sincronitzaLlicenciaPerDefecte`) no canvia: les notes noves d'una persona continuen heretant la llicència que té desada al servidor. Totes les proves T39 es conserven com a controls negatius.

### T2 · Poda de la quarta columna

`targetaViva: false` a l'adaptador del Perfil (literal de l'ordre), per a totes les menes. Fora també `avisTargetaViva` i l'import orfe `AVISOS_TARGETA_VIVA`. **`usePublicaDocumentViu` es conserva:** la targeta viva continua a la llista (`PerfilShell`) i a «Les vistes». Es conserva `ambVistes: false`, que també amaga la Vista A4 de davall del títol.

### T3 · Emoticones grans als apartats

`src/sections/profile/perfilModel.js` exporta `ICONES_APARTATS`, amb seqüències d'escapament perquè el selector U+FE0F de 👁️ i 🛡️ siga visible a la revisió (sense ell, `emojiSol` els rebutja i es pintarien menuts): 👁️ Les vistes, 🔐 El compte, 🛡️ Privacitat i dades i 🌐 Els nodes. `ItemMedia` ja els pinta XL (`sdp-fitxa-emoji-xl`), i el rail plegat, menuts (`NavGlyph`). «La fitxa» es queda amb l'avatar o la icona de la identitat.

### Decisions preses en Direcció Autònoma (MarIA les pot revocar)

1. **Guarda a `UniversalCard` pel tipus d'objecte**, tal com demanen el pla, el contracte de Codex i Gemini (T-G4-01). Cap prop nova: el descriptor `objecte` ja existia.
2. **Literal `targetaViva: false`** en lloc de llevar la clau (precedent P4 de Notes): l'ordre ho deia així i el DOM és idèntic.
3. **Les píndoles d'estat de la persona es conserven** («Baixa en curs», «Sense connexió»).
4. **La persona ja no tria la llicència de sèrie de les seues notes a la fitxa.** Continua heretant la desada al servidor, i cada nota tria la seua. Si el Mestre vol un lloc nou per a triar-la, proposte «El compte» (reutilitzant `CopyrightPage`), en una fase pròpia.
5. **El text de `CopyrightPage` (àmbit `publicacio`) és ara cert per a persona i entitat**, sense tocar el Bloc de Notes. La pista de la fitxa només es dona per a l'entitat, que sí que hi tria els drets.

### Pendents fora de l'abast (no tocats, abast per superfície)

- `src/sections/text/pageContent.js` (pàgina «Drets d'autor») encara diu que les notes hereten els drets «de la teua fitxa del Perfil». Per a la persona ja no es trien allà. Cal una frase nova quan MarIA decidisca la pregunta 4.
- La maquinària T50 de l'aside (`DocumentEditor.jsx`, `components.css` 1999–2056 i les proves T50 de `DocumentEditor.test.jsx`) queda sense cap consumidor de producció. El catàleg `EspecimenTargetaViva.jsx` encara diu que el Perfil la fa servir. Retirar-la és una passada pròpia amb pla.
- `src/sections/notes/ConnexioDetall.jsx:223` pinta «Persona» en una connexió a un perfil des de Notes.
- Dues proves Vitest roges **preexistents** (ja a la CI de base de Codex): `src/sections/text/paginaDeText.test.js` (la pàgina de drets amb la targeta legal incrustada) i `src/sections/notes/PublicacioDetall.imatgesPropies.test.jsx` (URL d'avatar). No són del pegat.

### Revisió adversarial del diff (12 troballes vives, cap crítica ni alta)

**Arreglades al codi:**

- **Alerta «Drets d'autor» que feia triar a cegues (baixa, tres revisors):** un esborrany vell de «Desar autoria» de la persona en conflicte o en error oferia «Conservar el meu» o «Tornar a provar» sobre un valor que la fitxa ja no mostra. Ara només hi ha «Tornar al que hi ha desat» (`PerfilEditor.jsx`, a `avisosCamps`). L'organització conserva les seues eixides. Té prova pròpia.
- **El text de `CopyrightPage` llevava a l'entitat una pista certa (mitjana):** ara diu també «Si publiques com a entitat, els drets de sèrie de l'entitat es trien a la seua fitxa del Perfil». És cert per a tothom i no envia la persona enlloc.
- **`<footer>` buit a la Vista A4 i a la portada (baixa):** deixava 10 mm (25 mm a la portada) de marge sense res. `buildPrintDocument` ja no l'emet sense drets; amb drets, el document de sempre. Té prova pròpia.
- **Cap prova fixava `baseDelServidor` (baixa):** ara una prova comprova que la base del `copyright` de la persona és la dada del servidor (o el «© Nom»), no el `''` que es pinta.
- **El comentari de la guarda d'`UniversalCard` prometia que el poble anava a l'autoria (baixa):** al directori, `ProfileSection` no el passa. El comentari ja no ho promet.
- **La capçalera d'`herencia.js` deia que la persona tria els drets a la fitxa:** corregida.

**Elevades a MarIA (decisió de producte, no de codi):**

1. **T39 · on tria ara la persona la llicència de sèrie de les seues notes (mitjana, quatre revisors).** Les notes noves continuen heretant la que té desada al servidor, però ja no hi ha cap lloc on canviar-la (només nota a nota). Opcions: un bloc «Drets de sèrie de les meues notes» a «El compte» (reutilitzant `CopyrightPage`), o bé que les notes de la persona deixen d'heretar i naixquen amb `LLICENCIA_PER_DEFECTE`. Recomane la primera.
2. **Els personatges `ANIMAL` del catàleg (mitjana).** El Gall, Súper Ratolí, La Mixa i Sultan (`agentsSeed.js`) cauen en la reserva «persona» de `tipusDAgent` i `objecteDePerfil`. Ara perden la categoria al directori, i els drets i la píndola del tipus a la fitxa pública. Són bots amb `systemPrompt`, no persones físiques. Recomane classificar-los com a `ia` a `tipusDAgent`: seria més honest (avís d'IA, T4), però canvia les seues rutes de `/gent/` a `/perfil/`. Per això no ho he fet sense ordre.
3. **El poble a la targeta de persona del directori (baixa).** El pla diu que «la seua única categoria és el seu poble», però `ProfileSection` no passa `location`. Abans tampoc es veia (l'etiqueta era el `tag` del catàleg). Mostrar-lo és un canvi visual del directori.
4. **La maquinària de l'aside T50 i la seua documentació (baixa):** sense consumidor de producció. Vegeu Pendents.

### Resposta a Codex i Gemini

- **Codex · pendent 1 (`SectionItemCard.test.jsx:45`):** fet. La prova de la ranura `accio` usa ara una entitat (`/empresa/forn`) i afig un control: la persona del directori no porta categories.
- **Codex · pendent 4 (assert del `srcdoc` A4 i portada amb llicència antiga):** fet a `DetallVistes.test.jsx`, amb llicència desada i esborrany vell a la cua, i control d'organització.
- **Gemini · T-G4-01 a T-G4-03:** implementats tal com els proposava (senyal explícit a `DocumentEditor`, guarda per tipus d'objecte, herència T39 intacta, `targetaViva: false` mantenint el document viu, emojis a `perfilModel.js`).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat observat |
| --- | --- |
| `npx vitest run src/sections/profile/` (abans) | 40 fitxers, 500 proves en verd |
| `npx vitest run src/sections/profile/` (després) | 41 fitxers, 512 proves en verd |
| Perfil + `SectionItemCard`, `UniversalCard.copyright`, `DocumentEditor`, `drets/` | 47 fitxers, 642 proves en verd |
| Components compartits (`DocumentEditor`, `drets/`, `PedraSeca/organismes/`, qualitat del Workspace i de les barres, `PageFrame.copyright`, `TargetaViva`) | 50 fitxers, 675 proves en verd |
| Bateria ampliada (`PedraSeca/`, `notes/`, `disseny/`, `text/`, `workspace/`, `barres/` i consumidors externs) | 196 fitxers: 193 en verd; 2 roigs preexistents (vegeu Pendents) i 1 de `SectionItemCard`, ja corregit |
| Contrast amb la CI de base de Codex (`/tmp/sdp-codex-fase1-ci.log`) | Els 2 roigs de Vitest ja hi eren abans del pegat |
| Servidor viu `localhost:3340/perfil/iaia-maria` | La fitxa de la IA conserva «© IAIA MarIA» i les seues píndoles; consola sense errors |
| `localhost:3340/el-meu-perfil` | **No verificat visualment:** redirigix a registre (sense sessió al navegador). Cap credencial demanada ni usada. La cobertura de punta a punta (DocumentEditor real a `PerfilEditor.imatges.test.jsx`; Workspace real a `PerfilShell.targetaViva.test.jsx`) no substituïx la mirada del Mestre en mòbil i escriptori |
| Revisió adversarial del diff (4 dimensions, 28 agents, 2 refutadors per troballa) | 12 troballes vives, cap crítica ni alta; 6 arreglades i 4 elevades a MarIA |
| Després dels arranjaments: perfil, A4, `drets/`, `DocumentEditor`, `PedraSeca/organismes/`, `SectionItemCard`, `NotesEditor`, `NotesSection` i `disseny/` | 118 fitxers, 1.584 proves en verd |
| **Tall final · `npx vitest run src`** | **1.025 fitxers i 17.625 proves en verd; 2 roigs, els preexistents (`paginaDeText`, `PublicacioDetall.imatgesPropies`), idèntics a la CI de base** |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Abast: Fase 1 del pla 261015_1900 (T1–T4). Les fases 2 a 4 (Xat, Lector i Snippet, TPV i Gestoria) no s'han començat.
- No s'ha actualitzat `.agents/ESTAT.md` ni el LEDGER: viuen a `.agents/`, zona de governança que els hooks reserven a `executor-mutacio.mjs` amb lease. El relleu és de MarIA.
- No s'ha fet cap commit. No s'ha executat `npm run test:ci` (la part Node, `tests/`, té 4 roigs preexistents d'empaquetat WordPress, segons Codex): només Vitest sobre `src`.
- Els hooks d'esta sessió bloquegen també la llista de tasques de l'app i la memòria persistent de Claude (ruta fora del repo): el relleu viu només en este informe.
- Cap cron ni procés de fons propi actiu en tancar.
- Retroalimentació de plantilla: el `prompt.local` hauria d'indicar el nom exacte del fitxer d'informe de cada IA (el de Claude no el deia) i recordar que el document es valida sencer a cada edició: un relleu parcial amb seccions `[pendent]` és rebutjat per la porta.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261015_1900_pla_implementacio_xat_identitat_i_perfil]]
- [[261015_1900_prompt_gauntlet_claude_codex_gemini]]
- [[261015_1945_auditoria_codex]]
- [[261015_1945_auditoria_gemini4]]
- [[261015_1933_acta_marmota_codex_fase1]]
