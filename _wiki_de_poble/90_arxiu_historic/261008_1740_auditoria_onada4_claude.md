---
type: informe
status: esborrany
description: 'Informe final de Claude sobre el prompt 261008_1201: què s''ha fet de cada ordre, proves (14.599 en verd), migracions a aplicar, accions humanes i decisions pendents.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7:661ed010-31bd-4c64-804c-4c378805c422
---
# Onada 4: informe final d'implementació

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7:661ed010-31bd-4c64-804c-4c378805c422 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T15:39:42.088Z |
| Modificació | 2026-10-08T15:39:42.088Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, mode Ultracode: workflows de mapa, auditoria, tres tandes d'implementació i revisió adversarial) |
| Tokens consumits | uns 32 M en subagents (mapa 2,5 M; auditoria del xat 16,8 M; implementació 5,6 + 2,9 + 0,8 M; botigues 0,45 M; redacció 0,2 M) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-08T15:39:42.088Z: esborrany creat; contingut i verificació pendents.
2026-10-08T15:45Z: informe final del torn `torn_fb1e82c4` (Claude), sobre el prompt i el pla `261008_1201`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Informe final de Claude per a l'Onada 4.

**Documents germans (llegiu-los):**
- [[261008_1355_auditoria_claude]]: auditoria del xat;
- [[261008_1407_auditoria_botigues_claude]]: tasca 5, botigues d'apps;
- la bitàcola [[261008_1352_informe_progres_claude]], [[261008_1521_informe_progres_claude]] i [[261008_1649_informe_progres_claude]].

Res no està commitejat. Cap migració està aplicada i no s'ha tocat cap base de dades.

### Decisions del Mestre preses en este torn (13:15 i 13:40)

1. **Notes:** «el Sóc de Poble loguejat» és l'ENTITAT `socdepoble`. La finestra és de 50 per secció.
2. **Membres:**
   - alta directa, i qualsevol membre pot «Eixir»;
   - una organització membre no hereta cap permís, i només la pot afegir qui administra totes dues;
   - només la propietària gestiona les administradores, i la llista només la veuen owner i admin.
3. **Drets d'autor:** dins de l'editor, la línia del copyright i la píndola obrin el selector. Fora de l'editor i a les targetes continua sent l'enllaç (l'ordre 261007 es manté).
4. **Esborrats i migracions:** autoritzat retirar `DialegCapcaleraAvatar`. Les migracions les aplica el Mestre.
5. **Retallador:**
   - la modal per a les tres imatges és el calc de «Recortar foto» de Claude (`01_produccio/captura_claude_avatar.png`);
   - avatar en cercle, logotip quadrat de 600×600 i capçalera rectangular de 16:9;
   - límit de 10 MB.

### Estat de cada ordre del prompt

**Tasca 1 · Editor de Perfil**

| Ordre | Estat | On |
| --- | --- | --- |
| Botons separats «Capçalera» i «Avatar»/«Logotip» | FET. També per a les organitzacions; l'entitat pilot només té «Capçalera». | `PerfilEditor.jsx`, `useImatgeDeFitxa.jsx` |
| Modal de retall calcada de Claude (arrossegar, zoom −/+, Restablir · Cancel·lar · Guardar) | FET i verificat al navegador. Inclou roda i teclat i no porta la X. La modal és única, `DialegEnquadrament` amb les props `senzill` i `mascara`, i el retallador de Notes queda idèntic. | `DialegEnquadrament.jsx`, `useEnquadramentImatge.jsx`, `modules.css` (bloc T46) |
| Geometries: cercle, quadrat de 600×600 i rectangle de 16:9 | FET. Eixida exacta. `PROPORCIO_CAPCALERA` i `AMPLADA_CAPCALERA` són les constants úniques. | `useEnquadramentImatge.jsx`, `enquadrament.js` |
| Filtre de pes | FET. 10 MB comprovats abans d'obrir. El text «PNG, JPEG o WebP, fins a 10 MB» es diu als tres botons, abans de triar. Guarda de pujada contra les curses. | `useImatgeDeFitxa.jsx`, `UniversalEditorShell.jsx`, `PageFrame.jsx` |
| Botó «Elegir drets d'autor» | FET. La píndola mostra la llicència triada i es pot tornar a canviar. Dins de l'editor, la línia del copyright és un botó que obri el selector i no navega. | `PageFrame.jsx`, `CopyrightSelector.jsx`, `DocumentEditor.jsx`, `pageContent.js` |
| Poble a les organitzacions | FET al client. Hi ha un selector a «El compte» que alimenta la barra taronja, i a la base de dades `organizations.town_name` (migració `2610081401`). | `PerfilContext.jsx`, `DetallAjust.jsx`, `DetallCompte.jsx`, `supabase/organizations.js`, `perfils.js`, `localPerfils.js` |
| Moure Vista A4 / PDF, Crear portada i Vista targeta | FET. Hi ha un apartat lateral nou, «Les vistes», i l'editor del Perfil ja no els pinta. Notes no canvia. | `DetallVistes.jsx`, `fitxaDePerfil.js`, `perfilModel.js`, `PerfilShell.jsx`, `DocumentEditor.jsx` (`ambVistes`) |
| Feedback del desat automàtic | FET. Un núvol amb check («Tots els canvis estan desats.») es queda visible fins al canvi següent, també després d'un reintent automàtic. Ho hereten el Perfil i Notes. | `EstatDesament.jsx`, `useEstatDesamentNota.js`, `PerfilEditor.jsx` |

**Tasca 2 · Notes Personals**
- FET per a l'entitat `socdepoble`. Mostra les 10 pàgines del sistema que el Mur signa com a Sóc de Poble, amb la seua targeta, i les publicacions de l'entitat dins de la finestra.
- Hi ha un lector de només lectura per a les pàgines del sistema.
- Una guarda impedix re-signar una publicació des d'una altra identitat («clava el comportament» de l'edició: la nota s'edita com a esborrany i el Mur canvia amb «Actualitzar al Mur»).
- Fitxers: `masDeLUsuari.js`, `usePublicacionsDeLActor.js`, `NotesSection.jsx`, `PublicacioDetall.jsx`, `NotesContext.jsx` i `visibilitatNota.js`.

**Tasca 3 · Organitzacions**
- **Fora el camp «Empresa mare»**, també al servidor (migració `2610081400`).
- **Pestanya «Membres»:** llistat, alta de persones i d'organitzacions, rols, «Llevar» i «Eixir», amb el port de backend com a capacitat opcional `membresOrganitzacio` i el kit de conformitat (migració `2610081402`).
- Fitxers: `GestioMembres.jsx`, `membresModel.js`, `contracte.js`, `backendPort.js` i `kit.js`.

**Tasca 4 · Auditoria adversarial del xat**
- FETA: [[261008_1355_auditoria_claude]]. Té 50 defectes verificats i 9 que bloquegen la beta.
- He corregit els que no depenien de cap decisió teua:
  - **B04:** una fallada del sondeig ja no buida la llista ni dona un 404.
  - **B05:** un fil de pàgina sobreviu a recarregar.
  - **B09:** l'historial ja no entra en bucle.
  - **B03 i B08:** migració `2610081543`. Torna el filtre de consentiment RGPD, `crea_fil_directe` rebutja un directe nou cap a una persona sense consentiment (SDP-XAT-016, traduït a les cinc llengües) i `xat_envia` ignora les metadades.

**Tasca 5 · Botigues d'apps**
- FETA la preparació: [[261008_1407_auditoria_botigues_claude]].
- Inclou l'estat real (no hi ha app nativa), la fitxa per a copiar, els bloquejants de revisió i el camí crític.
- URGENT: `https://socdepoble.org/legal` no respon a producció.

### Migracions noves (NO aplicades)

Ordre d'aplicació, totes després de `2610072230` i ABANS de publicar el client:

1. **`2610081400_grups_sense_mare.sql`:** `can_create_group` amb la mare opcional, i política d'INSERT.
2. **`2610081401_organitzacions_poble.sql`:**
   - `organizations.town_name`;
   - `organization_directory` i `list_my_organizations` amb la columna al final.
3. **`2610081402_membres_organitzacio.sql`:**
   - la taula `organization_member_organizations`;
   - les RPC `membres_organitzacio`, `desa_membre_organitzacio` i `lleva_membre_organitzacio`, totes `security definer`.
4. **`2610081543_xat_consentiment_i_metadades.sql`:** B03 i B08. Abans d'aplicar-la, cal fer la consulta de lectura que porta a la capçalera, que compta quantes persones tenen `consentiment_rgpd_at` buit. Si n'hi ha moltes, cal un pla de reconsentiment.

Cadascuna té la seua prova estàtica `node --test` (50 de 50 en verd) i una entrada a `supabase/README.md`. Si el client es publica abans:
- crear un grup sense mare falla amb 42501;
- desar el poble falla amb PGRST204, amb un avís en valencià;
- Membres diu NO-DISPONIBLE.

### Accions que només pot fer el Mestre o MarIA

Els hooks bloquegen les escriptures a `.agents/`, `tooling/` i fora del repositori, i també els esborrats.

1. **Frontissa de contingut.** Cal aprovar l'empremta nova de la pàgina drets-autor, que ha canviat de text:
   ```bash
   node tooling/gates/frontissa-contingut.mjs --aprova drets-autor --per NOM
   ```
   Sense això, el pre-commit i la CI fallen per eixa clau.
2. **Manifest de la suite node.** Cal classificar a `tooling/tests/node-suite-manifest.json` les quatre proves noves: `migracio-grups-sense-mare`, `migracio-organitzacions-poble`, `migracio-membres-organitzacio` i `migracio-xat-consentiment-i-metadades`. Ara `node-suite-policy` ix en roig per elles.
3. **Relleu i tancament del torn `torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7`:**
   - anotar el relleu a `.agents/ESTAT.md` i al LEDGER;
   - executar `node tooling/gates/tancament.mjs --check` i després `--close`;
   - fer l'Acta Marmota.
   La sessió de Claude no pot escriure a `.agents/` ni executar el tancament.
4. **Doctrina.** A `.agents/skills/sdp-universal-editor/SKILL.md` §1 encara diu que la icona «desapareix» en desar. Ara es queda el núvol amb check. Cal propagar-ho (`wiki-propagar-veritat`).
5. **Esborrats autoritzats (dos passos):**
   - **Primer:** migrar a `DetallAjust`/`useEnquadramentAvatar` les proves K2 de `enquadramentAvatar.limits.test.jsx` i `enquadramentAvatar.privacitat.test.jsx` que encara munten `DialegCapcaleraAvatar` (cobrixen el PNG, la recodificació i els 25 MB). Llevar `DialegCapcaleraAvatar.jsx` i `.test.jsx` de les llistes de `qualitat.logotip.test.js` i `tests/lint-sessio.test.mjs`.
   - **Després:**
     ```bash
     git rm src/sections/profile/DialegCapcaleraAvatar.jsx src/sections/profile/DialegCapcaleraAvatar.test.jsx src/sections/profile/perfilModel.mare.test.js
     ```
   - **Finalment:** llevar `empresesMare`, `potSerMare` i `ROLS_QUE_MANEN` de `perfilModel.js` i l'import de `TIPUS_MARE` (codi mort des d'ara).

### Decisions del Mestre que queden obertes (`requires_human_decision: true`)

- **Xat:**
  - B01, moderació dels fils de pàgina, o desactivar-los;
  - B02, protecció de menors;
  - B06, comprovar a producció la migració `2610042330` de `/iaia`;
  - B07, suplantació dels noms oficials;
  - què passa amb els directes ja oberts quan algú retira el consentiment;
  - amagar «Escriu-li» per a persones sense consentiment.
- **Botigues:**
  - el titular de l'app (Apple Membership, D-U-N-S);
  - la URL de privacitat a producció;
  - el text legal;
  - la promesa d'«extrem a extrem» que hi ha a `XatControlSection.jsx:46`.
- **Editor:**
  - F12: l'enllaç de drets a la targeta de previsualització;
  - el contrast de la línia d'ajuda del panell de la capçalera (també ix a Notes);
  - els botons apilats en mòbil a la modal: hui segueixen el patró general de Pedra Seca;
  - la foscor del vel del cercle (opacitat 0,55).
- **Organitzacions:** si qui administra només l'organització membre la pot retirar de l'altra.
- **Notes:**
  - el cos de les pàgines Disseny, Notes i Wiki al lector: hui només hi ha la capçalera i «Obri la pàgina»;
  - la fase 2 de «totes» les publicacions, sense la finestra de 50.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Mètode**
- Cinc lectors independents van mapar els fronts, i un crític els va creuar.
- La implementació es va fer en tres tandes amb propietat de fitxers estricta (un sol agent per fitxer, perquè l'arbre té l'Onada 3 sense commitejar).
- Cada línia va passar per un revisor adversarial i una correcció.
- Els revisors van trobar 35 defectes reals. Tots estan corregits, menys els que tenen decisió o propietari a part (vegeu dalt).

**Proves**
- Suite sencera de `src` (`npx vitest run src`, 17:31-17:39): **873 fitxers; 14.599 proves en verd, 0 fallades i 8 omeses.** Les 8 omeses depenen de dades externes absents (CSV de Mercadona, originals de `01_produccio` i un full de la Nevera) i cap no és d'esta onada.
- Proves `node --test` de migració: 50 de 50.
- ESLint del xat (`tests/lint_xat.test.mjs`): 20 de 20.
- `tests/lint-sessio.test.mjs`: net, amb els fitxers nous de l'onada afegits.

**Navegador**
- Al catàleg de Disseny he comprovat la modal «Retalla la foto»:
  - títol, ajuda, visor amb cercle i la fila −/+;
  - el zoom funciona: quatre clics porten d'1 a 1,4;
  - a l'escriptori, el peu «Restablir · Cancel·lar · Guardar».
- La Llei del Píxel de la línia del copyright en repòs la va mesurar el revisor B a Chromium: botó i enllaç idèntics (196×54,39).

**Proves de mutació**
- Les correccions de focus, de la guarda de pujada, de GestioMembres i de DetallAjust tenen proves que fallen si es lleva la correcció. Ho han comprovat els mateixos agents.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense sessió real.** No s'ha pogut provar el Perfil, «El compte», Membres ni Notes amb una sessió real: el Supabase local no respon i l'entrada simulada no obri l'editor. Tot el flux d'usuari està cobert per proves amb jsdom i el port simulat, no per una persona al navegador. Cal una passada manual a `/perfil` (persona, organització i entitat pilot), en mòbil i en escriptori, abans de la beta.
- **Safari 16 i Firefox 100 no s'han provat.** Sobretot cal mirar el vel del cercle, la roda (`passive:false`), el focus després d'Escape a mitja pujada i l'ellipsis dins del botó del copyright.
- **Cap SQL executat.** Les quatre migracions i la fixture `tests/fixtures/xat-entitats/regression.sql` només tenen prova estàtica. Cal provar-les en una branca descartable de Supabase abans de producció.
- **Arbre compartit.** MarIA va commitejar (`02b3b6e7`, només documental) mentre treballàvem. Les cites de línia d'este informe són de les 17:40.
- **Cap commit.** El commit atòmic de l'Onada 3 i l'Onada 4 queda per al Mestre o MarIA, després dels punts 1 i 2 d'«Accions».

### Retroalimentació sobre la plantilla prompt_local (§6.4)

1. **El Preflight es queda en «[pendent]».** Cal o omplir-lo o llevar-lo de la ruta.
2. **Les captures de referència han de viure a `01_produccio`** (AGENTS §16) i el prompt ha de citar la ruta exacta. «Són als artefactes» no és una ruta.
3. **El prompt es va modificar a les 13:03 (tasca 5) amb el torn ja obert, sense versió nova al Registre** (continua dient 1.0.0 i 10:01Z). Proposta: una línia d'Historial per cada esmena.
4. **«Aprovació humana: pendent» conviu amb ordres executables.** Cal un camp clar: «aprovat pel Mestre en xat, data».
5. **El prompt demana informes a l'Escriptori**, però els subagents no poden crear documents: el circuit documental i el hook ho reserven al torn de l'orquestrador. Convé dir-ho perquè no es perda temps.
6. **Les taules de decisions obertes** (com les del pla) fan molt de servei: convé que la plantilla les tinga.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261008_1355_auditoria_claude]]
- [[261008_1407_auditoria_botigues_claude]]
