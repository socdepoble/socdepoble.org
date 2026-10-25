---
type: informe
status: esborrany
description: 'Informe de Claude del torn 261025_0200: ritme vertical a la reixeta de 4px, píndoles de codi, anatomia de Sentinelles, catàleg i dualitat de destí a Connectar'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_08793431-2505-4da7-8248-15e373802748:f32d4d75-5282-4041-99cb-b5b043d58221
---
# Implementació de Claude · maquetació editorial didàctica, ritme vertical i anatomia de pàgina (IDEA-26, IDEA-27, IDEA-22)

**Dictamen: les cinc tasques de Claude del prompt 0200 (A–E) estan al codi, amb proves, i també les quatre troballes de Codex que tocaven el meu codi (C0200-01, 02, 05 i 06) i les quatre de Gemini (G0200-01..04).** La dualitat de destí de Connectar (IDEA-22, punt 2) s'ha fet amb el consentiment explícit de la titular, com va aprovar el Mestre al xat. Dues revisions adversarials ho han passat pel sedàs: la primera (21 agents) en va confirmar 14, que es reduïxen a 9 arreglaments, i en va rebutjar 2; la segona, sobre el que va canviar després (13 agents), en va confirmar 10. Tots els arreglaments estan aplicats. A mig torn el Mestre va demanar quatre retocs més, també fets i mesurats al navegador: el capçal de les fitxes, les píndoles a les taules, els blocs `<pre>` i el desbordament de les taules.

**No hi ha commit ni push.** La migració nova `2610250300_titular_public.sql` **NO està aplicada**: l'aplica el Mestre, mai un agent, després de `2610250100`.

**Cal tornar a aprovar els tractors.** El Mestre els va aprovar en viu a les 03:30. A les 04:00 `PanellTractors.jsx`, que és font de tots els tractors i sentinelles, ha canviat una altra vegada: gasta la classe del bloc d'accions en lloc del component, per no pujar el nucli de mòduls (§1 A). Tots tornen a «Versió canviada». Un clic a «Aprovar tots els pendents (DEV)» els torna a aprovar.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_08793431-2505-4da7-8248-15e373802748:f32d4d75-5282-4041-99cb-b5b043d58221 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (servidor de desenvolupament `:3340`, mode llavor, per al navegador) |
| Creació | 2026-10-25T01:29:11.167Z |
| Modificació | 2026-10-25T04:11:01Z |
| Propietari | Claude (torn `torn_08793431-2505-4da7-8248-15e373802748`, abast `code`) |
| Aprovació humana | Prompt i pla 0200 enganxats pel Mestre al xat; decisions del Mestre al xat (261025 ~03:00): H4 a 16px, radi `--sdp-radi-s`, primitiva `Accions` centrada al costat de `Fila`/`Pila`, privacitat estricta amb opt-in i desbloqueig A→B. No implica aprovació de commit, migració ni desplegament. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (implementador). Ajuda: 4 exploradors de només lectura, 2 implementadors (Connectar i dades; caixes del catàleg) i dues revisions adversarials (5 revisors i 16 verificadors; 3 revisors i 10 verificadors). |
| Tokens consumits | Subagents: ~0,94 M (exploració), ~0,51 M (Connectar), ~0,23 M (catàleg), ~2,50 M (primera revisió), ~1,45 M (segona). El fil principal no exposa el recompte. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

He llegit sencers el pla 0200 i el prompt 0200 del disc, les dues auditories del mateix torn ([[261025_0200_auditoria_codex]] i [[261025_0200_auditoria_gemini]]) i les files IDEA-22, IDEA-26 i IDEA-27 del [[03_llibre_mestre_tasques_i_idees]] abans d'emetre este informe. Les dues auditories van arribar abans que la reforma existira (Codex, tall 01:37Z; Gemini, 01:47Z): les seues troballes s'han contrastat amb el codi i s'han integrat, i on m'aparte d'una prescripció ho dic amb el motiu (§4).

La seqüència documental ha sigut:
- torn propi `torn_08793431`, obert i vigent fins a 2026-10-25T20:54Z;
- `document.mjs context` i `create` de la ruta `auditoria`, amb el nom que demana el prompt (vegeu C0200-03 a §5);
- una sola reescriptura completa i `document.mjs check`.

Claude no escriu `.agents/` (ESTAT, LEDGER) ni mou fitxers de l'Escriptori: eixe relleu és de MarIA.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-10-25 02:55-03:05 (CET).** Lectura del pla, el prompt, les memòries dels torns anteriors i les skills de disseny (`sdp-pedra-seca`, `sdp-universal-page`, `core-maquetacio-markdown`). Quatre exploradors de només lectura en paral·lel: Connectar i la titular, el catàleg, les proves que fixen l'estat actual, i una escombrada d'anatomia de tota l'app.
- **03:05.** Arriba l'auditoria de Codex: quatre troballes al meu codi. La feina es partix en dos carrils sense fitxers comuns: Claude (CSS, tractors, Wiki, catàleg) i un implementador per a Connectar i les dades.
- **03:10.** El Mestre aprova al xat el 16px de l'H4, el radi `--sdp-radi-s`, la primitiva `Accions` i la privacitat amb opt-in. Un segon implementador harmonitza les caixes del catàleg.
- **03:15-03:25.** Proves del meu carril en verd (148 fitxers, 2.248 proves). El servidor `:3340`, que no era meu, havia caigut: el torne a engegar amb `npm run dev`. Comprovació al navegador de Sentinelles i de la caixa del Mestre.
- **03:25.** Arriba l'auditoria de Gemini. G0200-03 (la regió viva buida) s'aplica amb un altre mecanisme; vegeu §4.
- **03:30.** El Mestre aprova en viu els tractors i els sentinelles.
- **03:35-03:55.** Revisió adversarial de tot el diff: 14 troballes confirmades (9 arreglaments) i 2 de rebutjades. Totes aplicades, amb proves noves.
- **03:55-04:05.** Observacions del Mestre a les fitxes del catàleg: el capçal tocava el text (16px ara) i les píndoles de les taules es trossejaven (`break-word`, noms sencers i taula amb desplaçament propi). La suite sencera troba que la porta dels tractors importava `Accions` fora del nucli de mòduls: provat el nucli 1.4.0, desfet, i classe canònica en lloc del component.
- **04:05.** Directriu del Mestre: el `<pre>` no es pot tallar per la dreta (regla base a `sdp.css`).
- **04:05-04:40.** Segona suite sencera (només les 3 fallades preexistents), `test:precommit` (40 s), informe i relleu al Llibre Mestre.
- **04:40-05:10.** Segona revisió adversarial, sobre el que va canviar després de la primera: 10 troballes confirmades, totes aplicades (§2b). Mesurat de nou al navegador; tercera suite sencera i `test:precommit`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1 · Què s'ha fet, per tasca

**A · Tokens i estils** (`tokens.css`, `sdp.css`, `components.css`, `modules.css`)
- **`--sdp-mb-h4`: de 8 a 16px.** El Mestre demanava 14px com a mínim respirable, i el pla en copiava el número. La prova `tokens.contracte.test.js` (D-C, ordre del Mestre del 261004) exigix la reixeta de 4px als marges de la prosa: 14 no hi és. 16px és el primer graó que passa dels 14. El Mestre ho va aprovar al xat («La graella de 4px de Pedra Seca és sagrada»). La taula RITME d'`EspecimenTipografia.jsx` diu ara 16px.
- **Píndola de codi en línia** (`sdp.css`, a la capa `sdp`, al costat de `:where(kbd)`, que ja era el model de píndola).
  - Selector: `:where(code:not([class], pre code))`. Especificitat zero.
  - Afecta només el `<code>` nu i fora de `<pre>`: el codi en línia del Markdown de la Wiki, les rutes, les props de les taules de contracte, els `<code>` dels panells de tractors.
  - No toca el codi amb classe pròpia (`sdp-consola__mono`, `sdp-tractors-panell__curta`, les empremtes de la Gestoria…): cada component decidix el seu aspecte, i una píndola global els hauria fet caixes dins de caixes o vores noves. Este és l'únic punt on m'aparte del pla (`code:not(pre code)` sense més): ho demostra el mapa de la §3 de l'explorador del catàleg.
  - Tokens: fons `--sdp-fons-subtil`, vora `1px --sdp-vora`, radi `--sdp-radi-s` (8px), farciment `0 --sdp-space-1`, mida `max(--sdp-text-meta, 0.9em)` (mai per davall del sòl de 14px), color `--sdp-text-titol`. `overflow-wrap: anywhere` i `box-decoration-break: clone` per a les rutes llargues.
  - **Radi.** `--sdp-radi-xs` no existix (C0200-05, G0200-02). Declarar-lo a 6 o 4px, com proposa Gemini, trencaria la prova de l'escala de radis («cap radi fora de l'escala»). El Mestre va aprovar `--sdp-radi-s` al xat.
  - **Mida.** `--sdp-text-cos` és un color, no una mida (C0200-05): no s'ha fet servir per a cap mida.
  - Dos contextos de la Gestoria on el `<code>` ja viu dins d'una caixa (`.sdp-gestoria-cofre__codi`, `.sdp-gestoria-panell__fitxer-generat`) el tornen pla, perquè no siga una caixa dins d'una altra.
- **`.sdp-especimen__fitxer`** és ara la mateixa píndola, amb la tipografia monoespai del sistema (abans era la `monospace` del navegador, sense fons ni vora).
- **Primitiva nova `Accions`** (`PedraSeca/composicio/index.jsx`, al costat de `Fila` i `Pila`; regla `.sdp-accions` a `components.css`), aprovada pel Mestre.
  - El bloc canònic dels botons que van després del text que els explica: flex, salt de línia, centrat, 12px entre botons.
  - `margin-block: 24px`, i 0 quan és el primer o l'últim fill. Al flux de la prosa el marge col·lapsa amb el del títol o el paràgraf veí: la distància del text a l'acció és sempre 24px, siga davall d'un h2 (12px), un h4 (16px) o un paràgraf (20px).
  - `forwardRef` (React 18.3.1), per a qui necessite posar-hi el focus.
  - **La porta dels tractors fa servir la classe `.sdp-accions`, no el component.** L'arbre de la Gestoria i dels Tractors compila com a mòdul contra el nucli de mòduls enxufables 1.3.0 (`contracteNucli.js`), que no exposa `Accions`, i la guarda `guardesDelModul.test.js` ho veta. Pujar el nucli a 1.4.0 és un canvi menor de semver, però els mòduls compilats passarien a demanar `^1.4` i un amfitrió amb l'1.3.0 (el connector de WordPress publicat) els rebutjaria: és decisió del Mestre (§5), i l'he desfet després de provar-lo.
  - Registrada al catàleg (`registre.js`) i ensenyada a l'espècimen de Composició, amb contracte, «fes» i «no facis».
  - Les 14 variants disperses (`.sdp-xat-bombolla__accions`, `.sdp-alerta__accions`, `.sdp-gestoria-*__accions`…) no s'han migrat en este torn: no totes són «accions després d'un text» (les de les bombolles del xat són una altra cosa). La llista per a decidir-les és a la §4.

**B · Sentinelles i Tractors** (`WikiDePobleSection.jsx`, `PanellTractors.jsx`, `PanellSentinelles.jsx`, `modules.css`)
- **Entradilla de Sentinelles.** `einaLocal('sentinelles_panell', …)` rep ara un `lead`, i `UniversalPage` el pinta centrat davall de l'H2. Diu què és un sentinella i conté la frase que el Mestre va assenyalar («Els components comuns de l'app (botons, diàlegs, navegació) no hi entren. Si en canvia una línia, torna a «pendent».»), dins d'un context que la fa entenedora: l'empremta cobrix el codi del sentinella, el de la seua interfície i el de la porta (`FONTS_COMUNES` de `sentinelles/contracte.js`).
- **Entradilla de Tractors.** La mateixa frase s'afig al final de l'entradilla de la porta d'aprovació, on ja s'explicava què cobrix l'empremta. Abans vivia al panell, que es munta a les dos pàgines.
- **`PanellTractors`:** fora el paràgraf de davall de l'H3. L'ordre és ara H3 → paràgraf de cos («Cap tractor pendent. Aprovació tècnica…», sense classe, la mida i el color de cos) → bloc d'accions (`.sdp-accions`) amb el botó DEV. L'`aria-describedby` del botó continua apuntant al paràgraf. El botó d'aprovar i revocar del detall i els dos del peu van també en el bloc d'accions.
- **Classe `.sdp-tractors-panell__motiu` eliminada** (CSS i les tres JSX): el paràgraf de l'estat del tractor triat i el resum de l'eixida d'un sentinella són ara paràgrafs de cos. El peu (exportar i oblidar) és ara text de cos i, davall, el bloc d'accions; abans el text era petit i gris. Dins del panell (columna flex amb 16px de gap) el bloc porta 8px de marge: els 24px del bloc canònic.
- **Jerarquia de títols** (IDEA-27 i G0200-03): «Sentinelles: què observen» era un `h2` després de l'`h3` de la porta; ara és `h3`. Cada tractor i cada sentinella són `h4` dins de la seua secció (abans `h3` dins d'un `h3`), i «Empremta d'esta versió», «Historial d'aprovacions» i «Eixida» són `h5`. La fitxa en Markdown baixa tres esglaons (`#` → h5), amb la mida i el color que tenia.
- **Regió viva buida** (G0200-03): el `<p role="status">` buit sumava un segon gap de 16px. Gemini proposa muntar-lo només quan hi ha avís; jo el deixe muntat, perquè una regió viva que naix amb el text pot no llegir-se en alguns lectors de pantalla, i li pose un marge negatiu d'un gap quan és buida (`:empty`).
- **Cos de text del panell de Sentinelles.** Com que ara l'entradilla diu què és un sentinella, el paràgraf de l'H3 diu com es fa servir, sense repetir-la.

**C · Catàleg de disseny** (`Especimen.jsx` via CSS, `components.css`, 17 espècimens de `detalls/`)
- **El cas del Mestre** (`superposicions-visibilitat`): cada cas era un `<div>` nu, i `h4:first-child` li anul·lava els 32px de dalt (0px entre el botó d'un cas i el títol del següent, G0200-01). Ara cada cas és un `Fragment`: h4 → paràgraf amb la descripció de veres del consumidor (`textos.descripcio`) → `Accions` amb el botó. **Mesurat al navegador a 1280px: h4 → paràgraf 16px, paràgraf → botó 24px, botó → h4 següent 32px, últim botó → fons de la caixa 24px.**
- **No he aplicat la recepta literal de Gemini** (`display: flex; flex-direction: column; align-items: center; gap: 24px` a `.sdp-especimen__viu`): canviaria les 89 caixes del catàleg i encongiria a la mida del contingut les taules, els paràgrafs i les mostres que han d'ocupar tota l'amplària. La causa era l'embolcall de cada cas; s'ha tret allà on era.
- Els altres tres títols seguits d'un botó (Identitat, Shell) i dos més que ha trobat l'escombrada (Enquadrament «Capçalera», Xat «Compositor») segueixen ara l'ordre títol → paràgraf → `Accions`. Els paràgrafs nous només diuen el que fa el codi de l'espècimen.
- Els embolcalls que tocaven a 0px (ResumConnexio, EstatDesament, Identitat, Shell) són `Fragment`. Identitat conserva la seua regió amb nom (`<section aria-label>`) i Shell, el `ref` que torna el focus a la ✕ de la franja.
- Els botons solts directament a la caixa (Calaix, Confirmació, Toast, Diàleg, DetallArticle) van en `Accions`; els dos de Diàleg ja no es toquen a 0px. A Calaix, Confirmació i Diàleg el diàleg tancat va fora de la caixa de mostra (un `<dialog>` germà, encara que no es veja, desfà el «primer» i «l'últim fill»): la caixa respira 24px per dalt i per baix.
- Les files `.sdp-especimen__fila` van centrades, i dues peces seguides (fila, mostra o paràgraf) ja no es toquen: 16px.
- `Boto.jsx` i `EspecimenBoto.jsx` deien «44px o 56px»: són 48px (`--sdp-touch-min`) i 58px (`--sdp-alt-accio`).

**D · Connectar** (Codex C0200-01, C0200-02, C0200-06 i IDEA-22 punt 2)
- **C0200-01 · kit.** El cas resolt de `quiEmSegueix` valida `tipus` amb `TIPUS_SEGUIT`: les dos files de la PoC de Codex (sense `tipus` i amb `tipus: 'ia'`) i `null` ara fallen.
- **C0200-06 · A→B amb administradora comuna.** L'elegibilitat del seguiment ja no ix del conjunt agregat `idsDeQuiConnecta`. Dues funcions pures noves a `ConnectarSection.jsx`:
  - `identitatPropiaDe` diu quina de les teues identitats és el destí (la persona, una entitat teua, o cap);
  - `actorsPerAlDesti` replica les regles de `2610250100`: A→B, A→U i B→U permesos; U→U, U→entitat que administres i A→A prohibits.
  - Amb un destí propi el selector només ensenya els barrets permesos, el contacte no té interlocutor de xat (mai un xat amb tu mateix) i, si no en queda cap, no es pinta res.
  - **Comprovat al navegador:** la persona pilot, veient El Rentonar (que administra), té el selector amb només «Sóc de Poble (empresa)» i cap «Escriu-li».
  - Matriu U/A/B de 7 proves en lloc de l'antiga «el perfil propi, o el d'una entitat que representes, no té cap relació».
- **C0200-02 · el xat amb barret d'entitat.** Amb un barret d'entitat triat, el botó diu «Escriu-li a {nom} com a {persona}» i, en remot, un paràgraf de cos abans: «El xat és personal: {nom} veurà que li escriu {persona}, no {entitat}, que ací no té xat propi.» En llavor i en local el xat és d'este dispositiu i ningú no veu res: s'hi queda el botó, sense la nota. El clic continua obrint el directe personal; no s'ha inventat missatgeria d'entitat ni s'ha tocat el SQL.
- **IDEA-22 punt 2 · dualitat entitat / titular, amb consentiment** (aprovat pel Mestre: «privacitat estricta… opt-in»).
  - **Migració `2610250300_titular_public.sql`, NO aplicada.** Columna `organization_memberships.titular_public` (fals per defecte), un disparador que la torna a fals en qualsevol fila que no siga d'owner, i tres RPC `security definer` amb `search_path = ''`, només per a `authenticated`:
    - `marca_titular_public` i `estat_titular_public`: només la fila d'owner de qui crida;
    - `titular_public(org)`: com a molt una fila `{id, full_name, avatar_url}`, només si és owner, ho ha triat, el perfil és públic, no ha demanat la baixa, l'entitat és pública i no hi ha cap bloqueig entre les dues persones.
  - **Port:** dues capacitats noves i opcionals, fora del nucli i de `directori` (per la regla de capacitats parcials): `titularPublic` (lectura) i `consentimentTitular` (estat i escriptura de la titular). Adaptadors remot i local, kit de conformitat (mai correu ni rol al resultat) i 30 proves noves entre SQL estàtic, adaptadors i local.
  - **Client:** `useTitularDeConnexio` (només amb la capacitat, sessió i entitat). Si la titular s'ha mostrat, un segon bloc de relació dins del mateix grup «Connexió directa», amb el mateix barret: «{nom} és titular de {entitat} i ha triat que es veja ací.» Res si està amagada o no hi ha sessió; res si qui mira és la titular. No es fa servir mai `owner_user_id`, que és qui ha publicat, no la titular.
  - **La titular ho tria:** casella a `GestioMembres` (Perfil · Membres i connexions), només per a l'owner. L'ajuda i la confirmació diuen les dues condicions que el servidor exigix (el seu perfil i l'entitat, públics) i que ningú més ho pot triar per ella.
  - **Llavor:** cap entitat té titular declarada. L'única persona de la llavor és el Mestre, i és real.
  - **Divergència amb Gemini (G0200-04):** no es projecta `propietariaPublica` al directori ni s'extrau d'`owner_user_id`; eixe camp és qui va publicar (qualsevol administradora) i no porta consentiment.


**E · Verificació:** a la secció Verificació.

**F · Retoc del Mestre a les fitxes del catàleg** (observació visual a `UniversalListCard` i `UniversalPage`, a mig torn; `components.css`)
- El capçal de cada fitxa (h3 i píndola de la ruta, `.sdp-especimen__cap`) no tenia marge i la píndola tocava el paràgraf de davall: **0px**. Ara, `margin-bottom: var(--sdp-space-4)`: **16px**, com un h4 fins al seu text.
- D'una fitxa a la següent hi havia 64px (40 de marge, 24 de farciment) més la vora. Ara són 16px de marge més 24px de farciment: **els 40px de `--sdp-mt-h3`**, el mateix ritme que un h3 de la prosa.
- **Mesurat al navegador (1280px):** `estructura-page`, capçal → text 16px; `estructura-divisor` (dues fitxes), capçal → text 16px a totes dues i final d'una fitxa → h3 de la següent 42px (40 + 2 de vora).
- Dins de la fitxa, el títol «Accessibilitat» conserva 32px de dalt i 16px de baix: és el token global de l'h4 i la proporció 2 a 1 que lliga un títol al seu text; tocar-lo canviaria la prosa de tota l'app.

**G · Les píndoles de codi a les taules de contracte** (observació del Mestre, a mig torn; `sdp.css`, `components.css`, `Especimen.jsx`)
- **Què passava:** la píndola tenia `overflow-wrap: anywhere`, que deixa partir per qualsevol lloc i, sobretot, rebaixa l'amplària mínima de la cel·la. En una columna estreta la taula s'encongia fins a trossejar els noms (`secci` / `o`, `exclo` / `uId`), i amb `box-decoration-break: clone` cada tros era una caixeta.
- **Arreglament:**
  - La píndola usa `overflow-wrap: break-word`: només parteix una paraula si no cap sencera en la seua línia, i no encongix la columna.
  - Els noms de la primera columna de la taula de contracte no es parteixen mai (`white-space: nowrap`), com va demanar el Mestre. La regla només val dins de la caixa del contracte: global, retallava taules de la Wiki i trencava la columna de rutes de la Gestoria (segona revisió, §2b).
  - Amb els noms sencers, la taula de contracte fa 596-648px i no cap en la columna del catàleg (385px a 1280px de finestra): sense res més, la pàgina corria de costat. La taula va dins d'una caixa amb desplaçament propi (`.sdp-especimen__contracte`), amb el mateix patró accessible que la `Taula` de Pedra Seca: `role="region"`, nom «Contracte», `tabIndex=0` i focus visible.
  - La caixa porta el nom del contracte i de la fitxa (`aria-labelledby` amb el `caption` i l'h3): dues fitxes en una pàgina ja no repetixen «Contracte».
  - **Les taules de la Wiki també**: `parseMarkdown.js` les embolica en `.sdp-taula-prosa`, que es desplaça dins de la seua caixa a qualsevol amplària. La columna de la Wiki fa 640px fins i tot a 1440px i retallava el sobrant (`overflow-x: hidden`): ja passava abans d'este torn en tauleta, i la píndola ho empitjorava.
- **Mesurat al navegador:**
  - `fonaments-publicacions-actor`: a 1280px, l'article ja no desborda (465 = 465px), la taula es desplaça dins de la seua caixa, i hi ha 0 noms partits i 0 paraules partides. A 375px, la pàgina no desborda (375 = 375px).
  - `taxonomia_documental` a 1440px: la columna de la Wiki no desborda (625 = 625px), i les dues taules amples (666 i 614px) es desplacen dins de la seua caixa de 545px.

**H · Els blocs de codi (`<pre>`) ja no es tallen per la dreta** (directriu del Mestre, a mig torn; `sdp.css`)
- `:where(pre:not([class]))`, a la capa `sdp` i amb especificitat zero, segons la recepta del Mestre: `overflow-x: auto`, `max-width: 100%`, farciment de 12px, fons `--sdp-fons-subtil`, vora `1px --sdp-vora` i radi `--sdp-radi-s`.
- **Dos afegits:**
  - la tipografia monoespai del sistema (`--sdp-font-mono`), perquè amb la genèrica del navegador el text baixa a 13px, per davall del sòl de 14px;
  - el ritme del paràgraf davall (`--sdp-mb-p`, 0 en l'últim fill), perquè el reset deixa el `<pre>` a 0px del que el seguix.
- El `<pre>` amb classe (consola, tractors, errors, diagrames de la Wiki) no hi entra i conserva el seu aspecte. El `<code>` de dins de qualsevol `<pre>` hereta la lletra i la mida: si no, el navegador el baixava a 13px (segona revisió, §2b).
- El `<pre>` d'exemple del catàleg (`EspecimenContracte.jsx`) porta `tabIndex=0`, `role="region"` i un nom, com `Taula`: el desplaçament també va amb el teclat. Els de la Wiki encara no: el `tabindex` l'hauria de posar el sanejador (`sanitize.js`), i no l'he tocat (§5).
- **Mesurat:**
  - a `fonaments-contracte` (el `<pre>` d'`UniversalWorkspace`, 572px de contingut), es desplaça dins de la seua caixa (273px a 1280px, 237px a 375px), i la pàgina no desborda a cap de les dues amplades;
  - a la Wiki (`04_contracte_de_dades`), el text dels blocs és de 16px, en la monoespai del sistema;
  - el `<pre>` de diagnosi de la Consola queda com era (sense vora, sense desplaçament).


### 2 · Revisió adversarial (14 confirmades → 9 arreglaments, tots aplicats; 2 rebutjades)

Cinc lents independents (CSS a tota l'app, proves i contractes, seguretat i privacitat, accessibilitat i anatomia, i18n i textos) i un verificador per troballa amb l'encàrrec de refutar-la. Cap arreglament de la revisió toca `PanellTractors.jsx` ni `PanellSentinelles.jsx`.

| # | Sev. | On | Què passava | Arreglament |
| --- | --- | --- | --- | --- |
| R-1 | P2 | `2610250300_titular_public.sql` | La guarda de `public.bloquejos` anava en un sol `if to_regclass(…) is not null and exists (select … from public.bloquejos …)`. PL/pgSQL planifica l'expressió sencera: sense la taula, 42P01 en lloc de «cap bloqueig no compta». **Reproduït en PostgreSQL 17.5 (PGlite)** pel verificador, fora del repositori. | Dos IF niats; la prova estàtica exigix la forma niada i veta la combinada. |
| R-2 | P3 | `Especimen{Calaix,Confirmacio,Dialeg}.jsx` | Un `<dialog>` tancat germà d'`Accions` (en el mode SPA es pinta in situ) desfeia el «primer fill»: 48px dalt i 24px baix a la caixa. | Els diàlegs van fora de la caixa de mostra; mesurat 24/24. |
| R-3 | P3 | `modules.css` (Gestoria) | El codi de recuperació del cofre heretava de la píndola la mida (21,6 en lloc de 24px) i el color. | `color: inherit` als dos contextos; `font-size: inherit` al del cofre. |
| R-4 | P3 | `sdp.css` | En mode fosc la píndola i les files parelles de les taules tenen el mateix fons (i la vora del mateix to): desapareixia. | A les files parelles, la píndola pren `--sdp-fons-targeta`. |
| R-5 | P3 | `GestioMembres.jsx`, 5 diccionaris | La casella de la titular confirmava «Ara et mostrem…» encara que l'entitat fora privada (el servidor exigix les dues coses). | Ajuda i confirmació condicionals i certes: «mentre el teu perfil i l'entitat siguen públics». |
| R-6 | P3 | `GestioMembres.jsx` | La casella es desactivava mentre desava: la que tenia el focus el perdia (cap al `<body>`). | No es desactiva; `aria-busy` al contenidor; un segon toc no torna a escriure. Prova nova. |
| R-7 | P3 | `BlocRelacio.jsx` | Amb un destí propi i un servidor sense els seguiments, el bloc deia «la relació és la conversa» i no hi ha conversa amb tu mateixa. | Text propi i cert (`seguir.noDisponiblePropia`, 5 idiomes). Prova nova. |
| R-8 | P3 | `BlocRelacio.jsx` | La nota de C0200-02 («{nom} veurà que li escriu…») eixia també en llavor, on el xat és d'este dispositiu i ningú no veu res. | La nota només en remot; el botó «com a {persona}» es queda. Prova nova. |
| R-9 | P3 | `eu.js` | «hemen ikustea aukeratu du: {nom}» llegia com si algú haguera triat vore la titular. | «hemen agertzea aukeratu du». |

**Rebutjades:** el text anglés de la titular (un matís de redacció, fidel a l'original) i el pronom «en» de l'entradilla de Sentinelles (la frase és la que el Mestre va assenyalar, i ja era així al panell).


### 2b · Segona revisió adversarial, sobre el que va canviar després de la primera (10 confirmades, totes aplicades; 0 rebutjades)

Tres lents (CSS a tota l'app, catàleg i accessibilitat, Connectar i SQL), amb un verificador per troballa. Totes venien dels canvis posteriors a la primera revisió (§1 G i H, i els arreglaments de §2).

| # | Sev. | On | Què passava | Arreglament |
| --- | --- | --- | --- | --- |
| D-1 | P2 | `sdp.css` | El `nowrap` global de la primera columna eixamplava les taules de la Wiki, i la columna de la Wiki en tallava el sobrant sense desplaçament (118px a `taxonomia_documental` a 1440px). | El `nowrap`, només a la caixa del contracte del catàleg; les taules de la Wiki, dins de `.sdp-taula-prosa`. |
| D-2 | P2 | `sdp.css` | El `<code>` de dins d'un `<pre>` es quedava amb la `monospace` genèrica: 13px. | `:where(pre code) { font-family: inherit; font-size: inherit }`: 16px mesurats. |
| D-3 | P3 | `sdp.css` | `:where(pre)` posava vora i desplaçament també als `<pre>` amb classe (la diagnosi de la Consola diu «cap vora»). | `:where(pre:not([class]))`, com deia el comentari. |
| D-4 | P3 | `sdp.css` | El `nowrap` global anul·lava l'ajust de les rutes a la taula de la Gestoria (`th:first-child > code`). | Resolt amb D-1. |
| D-5, D-9 | P3 | `sdp.css`, `EspecimenContracte.jsx` | Un `<pre>` amb desplaçament no és focusable a Safari 16 ni a Chrome 100: amb el teclat no es pot desplaçar. | Al catàleg, `tabIndex=0`, regió i nom. A la Wiki cal el sanejador; queda proposat (§5). |
| D-6 | P3 | `components.css` | En mòbil, la taula nua es feia el seu propi desplaçament dins de la caixa focusable, que no es desplaçava mai. | `.sdp-especimen__contracte :where(table) { display: table }`, com `.sdp-taula`. |
| D-7 | P3 | `Especimen.jsx` | Dues fitxes amb contracte donaven dues regions amb el mateix nom («Contracte»). | El nom ve del `caption` i de l'h3 de la fitxa. |
| D-8 | P3 | `sdp.css` | El mateix `nowrap` global, vist des de l'accessibilitat. | Resolt amb D-1. |
| D-10 | P3 | `GestioMembres.jsx` | Sense `disabled`, la casella de la titular no deia que desava, i la controlada tornava a l'estat anterior fins a la resposta. | Mostra de seguida la tria pendent i diu «Desant la tria…» (clau nova als 5 idiomes); prova ampliada. |

### 3 · Revisió de tot el text (IDEA-27): el que queda fora d'este torn

El Mestre va demanar «que hagan una revisión de todo el texto y que apliquen las directivas de maquetación». Este torn l'ha aplicada a les superfícies que nomena el pla (Sentinelles, Tractors, el catàleg i Connectar en allò que tocava la tasca D). Una escombrada de només lectura de tota l'app n'ha trobat 25 més, les més visibles, i una vintena llarga de menors (uns 70 paràgrafs `__nota` petits i grisos a la Gestoria). No s'han tocat: per la lliçó «l'abast es definix per superfície» de `sdp-workflow`, cal ordre per a cada superfície, i moltes tenen proves que fixen l'estat actual.

| # | Superfície | Regla trencada | Arreglament proposat |
| --- | --- | --- | --- |
| 1 | Cada document de la Wiki (`WikiDePobleSection.jsx:326`) | Salt h2→h4 i una taula de dades abans del text («Quadre de Comandament ISO») | h3 o `<details>`, després de la prosa |
| 2 | Panell de Control (`ControlSection.jsx:266, 455, 495`) | h2 al cos i un `.lead` dins de cada secció | h3 + paràgraf de cos; l'entradilla només a la capçalera |
| 3 | Connectar (`modules.css:7903-7912`) | H3 encongits a etiqueta; paràgrafs d'ajuda petits i grisos | H3 de mida normal; `__ajuda` a mida i color de cos |
| 4 | Connectar (`ConnectarSection.jsx:685, 702, 716`) | Els títols dels tres camins són paràgrafs | `h3`, i els blocs de dins, `h4` |
| 5 | Connectar (`ConnectarSection.jsx:903-913, 1025-1031`) | El botó CONNECTA va abans de la nota que l'explica | Nota abans, a mida de cos |
| 6 | Connectar (`ConnectarSection.jsx:725`) | «Privacitat de la connexió» va directe al grup d'opcions | Un paràgraf entre títol i control |
| 7 | Perfil (`BlocPerfil.jsx:11` i set pàgines de `Detall*`) | H1 → entradilla sense H2; blocs en h2 | `subtitle` a cada pàgina; blocs en h3 |
| 8 | Seguidors (`Seguidors.jsx:135, 197`) | Paràgraf principal petit i gris | Paràgraf de cos |
| 9 | Consola (cinc fitxers) | Cinc h2 al cos | h3 (xoca amb ordres anteriors del Mestre: decisió seua) |
| 10-12 | Consola (`IndexConsola`, `DiagnosiConsola`, `XifresMas`) | Segona entradilla al cos; títols enganxats a graelles i controls | Paràgraf de cos; un paràgraf explicatiu |
| 15 | Agents (BIOS) (`PanellAgents.jsx`) | L'entradilla, perduda al cos; títols baixats dues vegades | `lead` des d'`extreuEditorial`; un sol esglaó |
| 19 | Cercador (`SearchSection.jsx:371`) | El formulari va abans de l'H2; sense entradilla | `lead`; el formulari al cos |
| 20 | Idiomes (`TranslationsSection.jsx`) | Sense entradilla; h2 + `.lead` al cos | `lead` de pàgina; h3 + paràgraf |
| 22 | Inventari del catàleg (`EspecimenInventariGlobal.jsx:18`) | Un h2 que repetix el títol; el paràgraf repetix l'entradilla | Fora l'h2; el text, a l'entradilla del manifest |
| 23 | Ajustos del Workspace (`UniversalWorkspace.jsx:358`) | Ajuda petita i grisa; interruptors enganxats a l'h4 | Mida de cos (l'h4 ja respira 16px) |
| 24-25 | Ajustos, Multimèdia i Dispositius | Botó abans del text que l'explica; Dispositius sense títol ni entradilla | Text primer; capçalera amb `title/subtitle/lead` |

La llista sencera amb els números de línia és a l'escombrada (25 files, més «vistes i no llistades»); la poden demanar MarIA o el Mestre. Proposta: un torn propi per superfície, amb la prova d'anatomia de la §4 com a porta.

**Les 14 variants de fila d'accions.** Candidates a `Accions` (botons després d'un text): `.sdp-gestoria-panell__accions`, `.sdp-gestoria-finestreta__accions`, `.sdp-gestoria-escaner__accions`, `.sdp-gestoria-enviament__accions`, `.sdp-gestoria-cofre__accions`, `.sdp-gestoria-historic__accions`, `.sdp-inventari__accions`, `.sdp-superadmin-taxonomia__accions`, `.sdp-explorador__accions`, `.sdp-estil__accions`. No ho són: `.sdp-xat-bombolla__accions` (menú d'una bombolla), `.sdp-xat-dialeg__accions` i `.sdp-dialeg__peu` (peu d'un diàleg, alineat a la dreta per disseny), `.sdp-alerta__accions` (dins de l'alerta; es fa servir prestada en 13 fitxers fora d'Alerta, i eixos préstecs sí que són candidats).


### 4 · Diàleg creuat amb Codex i Gemini

| Troballa | Estat | On m'aparte de la prescripció, i per què |
| --- | --- | --- |
| **C0200-01** (kit, `tipus` de `quiEmSegueix`) | Fet | — |
| **C0200-02** (barret d'entitat al xat) | Fet | Només en remot la nota diu que l'altra banda ho veu (R-8). |
| **C0200-03** (`implementacio` i la taxonomia, T3) | Pendent de governança | El prompt i el Mestre al xat exigien `261025_0200_implementacio_claude.md`, i el document naix amb eixe nom. Si el commit de MarIA fa caure `porta-taxonomia`, cal triar entre `auditoria_claude` i donar d'alta la categoria a catàleg, router, plantilla i les dues portes alhora (§5). No he tocat cap porta. |
| **C0200-04** (ordre d'arxivament de `core-higiene-escriptori`) | De MarIA | Claude no escriu `.agents/`. |
| **C0200-05** (tokens del pla) | Fet | `--sdp-text-cos` no s'usa com a mida; radi `--sdp-radi-s`; 16px en lloc de 14px per la reixeta de 4px. |
| **C0200-06** (A→B amb administradora comuna) | Fet | — |
| **G0200-01** (0px entre casos de la caixa) | Fet | No pose `display:flex; align-items:center; gap:24px` a `.sdp-especimen__viu`: canviaria les 89 caixes i encongiria taules, paràgrafs i mostres. S'ha tret l'embolcall que n'era la causa. |
| **G0200-02** (`--sdp-radi-xs: 6px`) | No aplicat | Trenca la prova de l'escala de radis; el Mestre va aprovar `--sdp-radi-s`. |
| **G0200-03** (Sentinelles) | Fet | La regió viva buida es queda muntada, amb un marge negatiu d'un gap, en lloc de muntar-la només amb avís: una regió que naix amb el text pot no llegir-se. |
| **G0200-04** (`propietariaPublica`) | Fet amb opt-in | No es projecta al directori ni s'extrau d'`owner_user_id` (qui va publicar, sense consentiment): ho tria la titular, per decisió del Mestre. |

Mesures de Gemini que ja no valen: les de `sentinelles_panell` i `superposicions-visibilitat` eren de l'estat d'abans. Les meues, amb la reforma, són a §1 (B, C i F).

### 5 · Decisions per al Mestre

1. **Commit.** Res no està confirmat al git. La recepta dels torns anteriors és un índex temporal amb la llista explícita de camins de `src/` i `supabase/`, l'arbre exacte assajat abans en una còpia congelada (Vitest sencer, `test:node`, lint) i `--no-verify` només per decisió del Mestre al xat. `DesignSection.jsx` i `porta-olivera.mjs` són d'altres mans i en queden fora.
2. **Migració `2610250300_titular_public.sql`:** aplicar-la després de `2610250100`. L'ordre sencer és `2610241430` → `2610242320` → `2610250100` → `2610250300` → client. Cap s'ha executat contra un Postgres de veres, llevat de la reproducció de R-1 en PGlite.
3. **Dualitat de destí:**
   - opt-in (com ara) o «un perfil públic és prou»;
   - només la titular (owner) o també les administradores;
   - si els grups (no només les empreses) mostren titular;
   - si al bloc de la titular s'oferix també «Escriu-li» (ara sí);
   - si es tanca l'exposició ja existent d'`owner_user_id` a les publicacions signades com a entitat (§3 de l'exploració de Connectar);
   - si es crea una persona fictícia a la llavor per a ensenyar la dualitat (ara no n'hi ha cap: l'única persona de la llavor és el Mestre, i és real).
4. **Anatomia de la resta de l'app** (§3): una ordre per superfície. La Consola té h2 al cos per ordres anteriors del Mestre, i canviar-los és decisió seua.
5. **Les 10 files d'accions candidates a `Accions`** (§3): migrar-les o no, i en quin ordre.
6. **C0200-03:** el nom dels informes d'implementació.
7. **Nucli de mòduls 1.4.0.** Exposar `Accions` als mòduls enxufables (la Gestoria, el Bar, el Lector…) és un canvi menor de semver, però els mòduls que es compilen després demanen `^1.4` i un amfitrió amb l'1.3.0 els rebutja. Fins que el Mestre ho decidisca, dins d'eixe arbre es gasta la classe `.sdp-accions`.
8. **Tornar a aprovar els tractors** (vegeu el dictamen).
9. **Els `<pre>` de la Wiki, focusables.** El sanejador (`sanitize.js`) hauria de posar `tabindex="0"` (valor fix, sense obrir l'atribut als autors) als `<pre>` i a les caixes `.sdp-taula-prosa`. És la peça de seguretat i hi ha proves que en fixen la sortida exacta: no l'he tocada sense ordre.
10. **Servidor `:3340`.** El vaig tornar a engegar jo (`npm run dev`, el de sempre) quan va caure, i el Mestre hi ha aprovat els tractors. El deixe engegat. Per a fer-ho des del panell de Claude he creat `Som de Poble/.claude/launch.json`, que no és de cap repositori: es pot esborrar quan es vulga.

### 6 · Automillora: el cicle de vida dels documents i els tractors cognitius (tasca 4 del prompt)

Codex ja ha proposat un cicle de sis passos amb estats i hash (C0200-03 i C0200-04 i la seua secció d'automillora). El subscric, i hi afig tres coses que he patit este torn i que el seu esquema no cobrix.

**1. Un document naix amb el seu consumidor, no amb una àncora.** El que deixa un document viu no ha de ser una línia a «## Activitat en curs», sinó la llista de qui l'ha de llegir. `document.mjs create` ja coneix el torn i la ruta; li falta un `--per` (p. ex. `--per maria,codex,gemini`). Cada lectura queda com un acusament amb el hash llegit (`document.mjs llegit --file … --actor codex`). Un document amb tots els acusaments del seu hash actual i un commit que el conté és arxivable; si es reescriu, els acusaments caduquen sols. Això resol l'Escriptori saturat sense cap recordatori humà: Olivera no ha d'endevinar si un document és «viu», només ha de comptar acusaments.

**2. El nom el dona la ruta, no l'agent.** Este torn el prompt exigia `261025_0200_implementacio_claude.md` i la taxonomia (`porta-taxonomia`, T3) no coneix `implementacio`: Olivera ja la té com a transitòria, però el commit fallaria (C0200-03). El nom l'ha de calcular `document.mjs create` a partir de la ruta i l'actor (`--route auditoria --actor claude` → `aammdd_hhmm_auditoria_claude.md`), i la plantilla del prompt l'ha de citar amb eixe mateix càlcul. Si cal la categoria `implementacio`, ha d'entrar d'una vegada al catàleg, al router, a la plantilla i a les dos portes.

**3. L'arxivament és un efecte del commit, però l'executa una sola mà.** Un hook post-commit pot calcular el «candidat a arxivar» (documents amb acusaments complets i continguts al commit) i deixar-lo en un fitxer de proposta. Qui mou és MarIA o el Mestre, com diu AGENTS §0.1: Claude i Codex no movem fitxers. La proposta és idempotent (documentId + hash + commit), i un tall a mig moviment es reprén des del diari, com descriu Codex.

**Altres tractors madurables que he vist este torn:**

- **La regla de disseny com a test, no com a prosa.** IDEA-26 i IDEA-27 ja tenen guardes executables a mig fer: la reixeta de 4px (`tokens.contracte.test.js`), l'escala de radis, el sòl de 14px. Falta l'anatomia: una prova de capes que recórrega les pàgines del catàleg i de la Wiki a jsdom i falle si un títol va seguit directament d'un botó, si hi ha un salt de nivell (h2→h4) o si un `.lead` viu fora de `.page-intro`. Amb això, «el sistema respon sempre igual» deixa de dependre de la memòria de la IA de torn. La llista de 25 violacions d'este informe (§Troballes) és el seu primer joc de proves.
- **Un sol carril per fitxer compartit.** Este torn dos agents meus i les altres IAs tocaven `modules.css` alhora (blocs distints). Ha anat bé perquè cada encàrrec deia quin bloc podia tocar i que rellegira abans d'editar. Convé que el prompt local ho diga sempre: «fitxers propis» i «blocs propis dins de fitxers compartits».
- **Els informes d'auditoria «abans de la reforma» caduquen.** Codex i Gemini van auditar la reforma abans que existira (és la llei de l'asincronia). Cal que el prompt diga que la segona passada és contra un hash, i que l'orquestradora la convoque quan l'implementador publique el seu.
- **El precommit de 30 s.** Codex mesura 60 s sota càrrega i jo 28-32 s en repòs: el número depén de la màquina i del que hi corre. Proposta: que el hook mesure i registre el temps de paret i el nombre de fitxers, en lloc de prometre un llindar.

### 7 · Millores de la plantilla prompt_local

1. Validar els tokens citats contra `tokens.css` abans d'emetre el prompt (`--sdp-text-cos` és un color, `--sdp-radi-xs` no existix, 14px no és de la reixeta de 4px): un `document.mjs check` podria avisar de qualsevol `var(--sdp-…)` no declarat.
2. Citar el nom de l'informe esperat calculat per la ruta (vegeu el punt 2).
3. Separar «tasques» de «decisions del Mestre»: la dualitat de destí de Connectar portava una decisió de privacitat (consentiment de la titular) que el prompt no deia.
4. Dir quins fitxers i quins blocs són de cada IA quan treballen alhora.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les execucions són meues, sobre l'arbre viu (compartit), en este Mac.

| Execució | Resultat |
| --- | --- |
| Vitest sencer (`npx vitest run`), tres vegades; la darrera, després de tots els arreglaments de les dues revisions | 1.284 fitxers: 1.273 passen, 9 omesos i 2 fallen; 22.019 proves passen, 100 omeses i 3 fallen, totes preexistents (davall). 849 s. |
| Vitest dels carrils afectats per la segona revisió (perfil, configuració, Connectar, catàleg, CSS, Wiki, tractors, Gestoria, plataforma, `utils`) | 406 fitxers / 8.262 proves, 0 fallades |
| Vitest dels carrils tocats (tractors, Wiki, disseny, Pedra Seca, Connectar, perfil, dades, configuració, CSS, `supabase/`), després de la revisió | 422 fitxers / 7.251 proves; l'única fallada era el text de la casella de la titular, que estava fixat a la prova (corregit, i 2 proves noves) |
| `npm run test:precommit` | codi 0: Vitest 156 fitxers / 3.046 proves i node 259/259. 46 s de rellotge en la darrera execució (40 s en l'anterior): no baixa dels 30 s que demanava el prompt (Codex en va mesurar 60 s). Depén de la càrrega de la màquina. |
| `npm run lint` | codi 0, zero errors i avisos |
| `node --test tests/migracio-*.test.mjs` | 162 / 0 fallades |
| `git diff --check` als fitxers del torn | codi 0 |
| Navegador (`:3340`, mode llavor, 1280, 1440 i 375px) | Sentinelles: H2 → entradilla centrada → H3 → paràgraf de cos (16,8px) → accions a 24px. Selector de visibilitat: 16 / 24 / 32 / 24px. Diàleg: caixa 24/24. Fitxes: capçal → text 16px, fitxa → fitxa 42px. Contracte: 0 noms partits, cap desbordament de pàgina a 1280 ni a 375. Connectar: A→B amb un sol barret i cap xat amb un mateix. |

**Fallades preexistents de la suite sencera, no d'este torn:**
- `App.appsLocals` («/app/lector es munta sencera en mode remote»): falla també sobre un HEAD net amb qualsevol URL de servidor (torn 261024_2254).
- `censImatges` ×2: `public/assets/fotos/iaia_maria_avatar_mobil.png` i `.webp`, d'una altra mà, sense rastrejar i fora del cens.

**Proves noves o actualitzades d'este torn** (a més de les de l'implementador de Connectar, que n'ha afegit 30 de SQL estàtic, adaptadors i llavor):
- l'ordre editorial de la porta dels tractors (H3 → paràgraf → bloc d'accions) i que el panell ja no repetix l'entradilla;
- les entradilles de Tractors i de Sentinelles, a la pàgina, davall de l'H2;
- els nivells h4/h5 de tractors i sentinelles i la fitxa a h5/h6;
- la matriu U/A/B (7), C0200-02 en remot, en castellà i en llavor, el destí propi sense seguiments;
- la casella de la titular: textos certs, i que no perd el focus mentre desa;
- la guarda niada de `bloquejos` al SQL.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res no està confirmat al git ni publicat.** Ni commit, ni push, ni desplegament.
- **La migració `2610250300` no està aplicada** ni s'ha executat contra el Postgres del projecte. La guarda de R-1 es va reproduir en un PostgreSQL 17.5 embegut (PGlite), fora del repositori.
- **Els `<pre>` de la Wiki es desplacen però no es poden enfocar amb el teclat** a Safari 16 ni a Chrome 100 (sí a Chrome 130 o posterior): cal el sanejador (§5, punt 9).
- **No he vist el mode fosc al navegador.** R-4 s'ha resolt pels tokens: a les files parelles, la píndola pren el fons de targeta.
- **Sense Safari ni iOS reals.** Les mesures són de Chromium, al panell del navegador.
- **La dualitat de destí no es pot vore a la llavor:** no hi ha cap titular declarada (§5).
- **Arbre compartit.** Durant el torn altres mans han tocat `.agents/`, `00_index_escriptori.md`, el Llibre Mestre, `DesignSection.jsx` i `porta-olivera.mjs`. No els he revertit ni inclosos en res meu.
- **L'abast d'este torn:** les superfícies del pla. Les 25 violacions d'anatomia de la resta de l'app estan llistades, no tocades (§3).
- **Recursos.** Cap cron ni tasca programada; els subagents i workflows han acabat. Queda engegat el servidor `:3340` (vegeu §5).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_0200_pla_implementacio_maquetacio_editorial_didactica_i_ritme_pedra_seca]]
- [[261025_0200_prompt_claude_gemini_codex_maquetacio_editorial_didactica_i_ritme_pedra_seca]]
- [[261025_0200_auditoria_codex]]
- [[261025_0200_auditoria_gemini]]
