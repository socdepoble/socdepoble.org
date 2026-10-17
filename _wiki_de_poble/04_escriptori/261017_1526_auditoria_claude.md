---
type: informe
status: esborrany
description: 'Execució i autoauditoria de Claude Code del Gauntlet Extrem: higiene de codi, notes, multimèdia, missatgeria neutra i destil·lació de l''arxiu històric.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_aa2976e7-4e26-4bdc-89c4-424ccb316848:e9a2c945-778c-4dc9-87ab-2977136a88d3
---
# Auditoria Claude del Gauntlet Extrem (Camins 2 i 3, higiene i Llibre d'Or)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_aa2976e7-4e26-4bdc-89c4-424ccb316848:e9a2c945-778c-4dc9-87ab-2977136a88d3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-17T13:26:13.677Z |
| Modificació | 2026-10-17T18:40:00.000Z |
| Propietari | claude |
| Aprovació humana | Pla [[261017_1300_pla_implementacio_gauntlet_extrem]] aprovat pel Mestre (instrucció Gauntlet Extrem 261017_1241); el commit, el segell del Llibre d'Or i les decisions de «Decisions que esperen el Mestre», pendents |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code), implementador, amb subagents de workflow per a mapatge, implementació, lectura de l'arxiu i revisió adversarial |
| Tokens consumits | ≈21,8 M dels subagents de workflow (mapatge 1,9 M; Llibre d'Or 9,3 M; implementació 2,4 M; correcció i revisió 6,2 M; correccions 1,4 M i 0,6 M). El fil principal no s'ha mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-17T13:26:13.677Z: esborrany creat; contingut i verificació pendents.

2026-10-17T13:35:00.000Z: relleu de progrés 1 · torn `torn_aa2976e7-4e26-4bdc-89c4-424ccb316848` (actor claude, abast code) obert. Llegits AGENTS.md, el Pla [[261017_1300_pla_implementacio_gauntlet_extrem]], el prompt [[261017_1300_prompt_gauntlet_claude_codex]], [[261016_1639_pla_implementacio_relleu_codex_gauntlet]] i [[261016_1530_pla_implementacio_gauntlet_autonom]]. En marxa dos workflows: (a) mapatge només de lectura de l'estat real del codi per als Blocs 0–3 (9 agents); (b) lectura íntegra dels 617 documents de text de `90_arxiu_historic/` en 34 lots per destil·lar el Llibre d'Or (Bloc 4). Cap fitxer de `src/` modificat encara. Claude no mou fitxers de la Wiki (AGENTS §0.1): el llast del Bloc 0.3 només s'inventaria.

2026-10-17T14:20:00.000Z: relleu de progrés 2 · Mapatge acabat (9/9 àrees). Llegides íntegres les aportacions concurrents [[261017_1526_auditoria_codex]] (C01–C11), [[261017_1529_auditoria_gemini4]] i [[261017_1542_acta_marmota_codex_gauntlet_extrem]]: coincidim en els defectes. Ja eren al codi F42–F45, la redirecció bàsica de `town-*`, els 9 banners de reserva i el visor de l'Arxiu. Han de canviar els C01/C02 de la plantilla, el C03 de l'EXIF WebP, els C04/C05 del visor a les publicacions i la resolució, la neteja C06–C09 i la marca. Paquet de referència abans de canviar res: chunk principal de 1.451 KB (409 KB gzip). En marxa la implementació en sis paquets amb fitxers disjunts, més una anàlisi de pes (Onada A) i la neteja de marca als fitxers compartits (Onada B). El Llibre d'Or de Gemini ja existix a `01_ser/`: Claude no el sobreescriu. La seua destil·lació, amb la cobertura que demana Codex a C11, anirà a este informe com a aportació per conciliar.

2026-10-17T15:25:00.000Z: relleu de progrés 3 · Onades A i B implementades: 106 fitxers de `src/` modificats i 18 de nous, cap a `_wiki_de_poble/` ni a `.agents/`. Bateria vitest completa (19.257 proves, 1.119 fitxers): 19.164 verdes, 89 omeses i 4 roges. Tres són proves que asserien el comportament antic (C06 i C04). La quarta és una regressió real de privacitat, ja corregida: un camí amb un origen amagat (`'/\rastreig.example/…'`) es rentava a camí propi i el Mur pintava una imatge trencada; ara `resolveAsset` el rebutja. Portes `design_guard` i `tractor-vocabulari`: les mateixes troballes que a `HEAD` (deute previ). Llibre d'Or: 34/34 lots i 617/617 textos citats, amb 260 afirmacions contrastades i 52 correccions. En marxa les correccions finals i la revisió adversarial en sis dimensions, amb verificació doble.

2026-10-17T16:35:00.000Z: relleu de progrés 4 · Revisió adversarial: 22 troballes, 10 confirmades per 2/2 verificadors (7 defectes diferents), totes corregides i recontrastades. Corregides també les troballes d'identitat ID1, ID3, ID4 i ID6, que són prèvies a este torn però entren al mandat (el logotip verd associat a una persona, el «Foraster» mentre es restaura la sessió, els àlies de Javi heretats per un altre compte). SEC-01 (el prefix d'EXIF sense límit de temps) també està corregida. ID5 (silueta o inicials) espera el Mestre: topa amb «la silueta de sempre». Llegides les noves troballes ADV-01–ADV-04 de Gemini: les tres primeres ja estaven corregides en este tall. L'ADV-04 (fons de `.hero-image`) atribuïx una ordre del Mestre que no consta enlloc on Claude puga verificar-la, i no s'aplica sense confirmació. En marxa l'última ronda de correccions secundàries.

2026-10-17T18:40:00.000Z: informe complet. Blocs 0–3 implementats a `src/` i revisats adversarialment en tres rondes. Bloc 4 destil·lat amb la cobertura completa (annexos A i B). Verificació final: 19.228 proves vitest verdes i 0 roges, lint global net, 0 fallades a la suite primària de node, i l'entrada del paquet un 12 % més lleugera en gzip. Res commitejat; cap fitxer de la Wiki mogut.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**El torn queda implementat i provat en local, pendent de dues coses: la revisió humana i l'auditoria de Codex sobre este mateix tall.** Claude ha executat els Blocs 0–3 a `src/` i ha destil·lat el Bloc 4 amb lectura completa. També ha estudiat la missatgeria (Telegram) i el pes del paquet. Res no està commitejat: el Mestre decidix el commit. Cap fitxer de la Wiki no s'ha mogut (AGENTS §0.1) i `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md` no s'ha tocat: l'aportació de Claude va a l'annex d'este informe.

Coordinació a l'Olivera. Abans d'implementar s'han llegit sencers [[261017_1526_auditoria_codex]], [[261017_1529_auditoria_gemini4]] i [[261017_1542_acta_marmota_codex_gauntlet_extrem]]. Els defectes C01–C10 de Codex coincidixen amb els que ha trobat el mapatge independent de Claude, i tots tenen resposta a la matriu següent. On Claude discrepa, ho diu amb proves:

- **Ja estava fet:** F42–F44 (Edició avançada, commit 6478a652) i F45 (peu retirat de l'editor). La MCR de 261016 encara els marcava «NO FET», però estava desfasada.
- **Rutes del prompt desfasades.** El ganxo és `src/components/universal/richText/useUniversalRichText.js`. El diàleg d'emoticona és `src/components/universal/classificacio/DialegEmoticona.jsx`, no el del xat. El resolutor és `src/config/assetResolver.js`. I els «9 `nano_banner_*`» del pla no existixen: les 9 reserves tenen altres noms, ja apunten a `/assets/uploads/brain/` i es descodifiquen bé.

### Matriu de l'encàrrec (estat en este tall)

| Bloc · Requisit | Estat | Què s'ha fet / evidència |
| --- | --- | --- |
| 0.1 Higiene `notes/` i `universal/` | **Fet** (amb 1 decisió pendent) | Fora els dos `console.log` per defecte d'`onToast` (UniversalEditorShell), l'etiqueta anglesa «LOAD ERROR», el soroll `ReferenceError: indexedDB` en entorns sense disc (GlobalSaveManager, sense trencar el CAS) i l'`AbortError` en cancel·lar compartir. També cinc famílies de CSS orfe (`.ues-*`, `.notes-editor .badge-row`, `.sdp-note-taxonomy-button`, `.sdp-editor-tools__actions`, `object-fit` inert de `.photo-grid__item`), el cicle d'importació C06 i la classe morta `sdp-text-desactivat`. ESLint ja estava net. `ConnexioDetall.jsx` és mort en producció, però **es conserva** per la decisió de retenció D4 del Mestre. |
| 0.2 Llei dels Dos Usuaris | **Verificat** | Cap rastre del fantasma a `src/`, `supabase/`, `public/`, `tests/`, `scripts/`, `tooling/` ni `bot/`. La guarda `identitatDual.guarda.test.js` està en verd. La targeta del Mac Mini la signa Javi Llinares amb `/assets/fotos/javi-llinares-perfil-1200px.jpg`, i és la seua única publicació. La resta de publicacions són de Sóc de Poble. Queden 14 personatges del catàleg d'agents i el Rentonar, que no signen res: és decisió del Mestre. |
| 0.3 Llast zero | **Inventari, cap trasllat** | Claude no mou fitxers (AGENTS §0.1). Els lectors del Bloc 4 marquen 165 fitxers de l'arxiu com a llast pur, sense res noble per destil·lar (annex B). |
| 1.1 F46/F47 Plantilla verge | **Fet** (C01, C02 i 4 defectes més) | Es compara l'estructura amb els atributs, i el text pla ja no basta. La plantilla només s'esvaïx una vegada per editor. Esvair-la ja no és un pas de desfer. La sincronització es fa sense historial, i deixar anar text damunt d'una nota verge ja no peta. `esLlavorDeNota` acorda el contracte amb l'editor. 28 regressions sobre TipTap real: 19 fallaven amb el codi de HEAD. |
| 1.2 F29–F34 Emojis XL | **Fet** | 9 famílies en l'ordre demanat (Cares, Persones, Animals, Menjar, Activitats, Viatges, Objectes, Símbols, Banderes). «Persones» es conserva per l'ordre de diversitat del 261007, i «Components» se'n va. La graella s'aplica a tota l'app (F30): Notes, Perfil, Snippet i catàleg. El focus passa al primer emoji quan el catàleg arriba, sense robar-lo mai. La comprovació d'emoji desconegut està en un sol lloc. Les dades continuen a demanda, sense cap dependència nova. |
| 1.3 F42–F44 Edició avançada | **Ja fet** (comentaris corregits) | `<details className="sdp-edicio-avancada">` plegat per defecte, just damunt de TipTap, amb tots els controls. |
| 1.x F45 «Ja publicat al Mur» | **Ja fet** (textos corregits) | Ja no apareix a l'editor. Es manté a la publicació oberta (PublicacioDetall), com diu l'ordre literal («vista d'edició»). |
| 2.1 F35–F38 `/multimedia/town-*` | **Fet** | Es conserven consulta **i fragment**, i el prefix no distingix majúscules. `/multimedia/town-x/` i les subrutes ja no donen 404. Endavant i enrere funcionen amb el router real, en mode navegador i en mode memòria. |
| 2.2 F39–F41 Banners | **Fet** | Es lleven espais i segments de punts, i un camí ja no pot eixir de la carpeta del paquet. La versió va davant del fragment (C08). Un origen amagat amb barra inversa o caràcter de control es rebutja. Les branques nominals casen amb el nom sencer i la llavor es normalitza en NFC. Hi ha proves de les 9 reserves × 3 bases. |
| 2.3 F22–F26 Lightbox i EXIF | **Fet** (C03, C04, C05) | Fila «Resolució» amb les mides reals del fitxer. El teclat continua funcionant després d'un clic. El zoom de la roda és proporcional. El visor s'obri des de les fotos de les publicacions (Mur, Mercat i Actes, també `/mercat/mac-mini-m4`, el lector del MAS i les portades opaques) i es carrega a demanda. **Pendent:** les imatges del cos d'una publicació (p. ex. `/events/aplec-2023`). L'EXIF dels WebP de més de 256 KiB es llig amb peticions Range acotades i sense tocar el parser estricte. |
| 3.1 Desterrament del «clon» | **Fet a `src/`** (2 decisions pendents) | De 134 línies amb la marca a 1: el «Pont WhatsApp» del full de ruta, que és un ús nominatiu legítim. La pàgina `/page/xat` s'ha reescrit sense marca, sense afirmar cap còpia i sense promeses absolutes. Neutralitzats el catàleg `/disseny`, els comentaris del xat i del CSS i els títols de les proves. Identificadors amb marca: 0 abans i 0 després. |
| 3.2 Estudi Telegram | **Lliurat** (sense codi) | Vegeu «Missatgeria rural». Necessita migracions, que aplica el Mestre, i canvis d'UI amb ordre. |
| 4 Llibre d'Or | **Aportació completa** (sense segellar) | 34/34 lots i 617/617 textos citats, 260 afirmacions contrastades i 52 correccions. El text va a l'annex A per a conciliar-lo amb l'esborrany consolidat de MarIA. |

### Bloc 1 en detall: la plantilla verge (F46/F47, C01, C02)

**Contracte nou, igual a l'editor, a la publicació, a la llista i a la nota preparada:**

- **Què és verge.** Un cos és verge només si és exactament una de les dues llavors amb la mateixa estructura, el mateix text, les mateixes marques i **els mateixos atributs semàntics**: nivell de títol, `start` de llista, `href` i `src`. Només es toleren les normalitzacions del motor: els espais entre etiquetes, el paràgraf buit del final que afig TrailingNode, i `class`, `dir`, `id` i `data-*`. Un H3 passat a H2, `<ol start="10">`, un enllaç, una imatge o una negreta ja no són llavor.
- **S'esvaïx una sola vegada.** Cada editor recorda si la llavor que ha carregat era verge i si ja s'ha consumit. El primer focus, la barra, el canal d'emojis, una targeta o el fet de deixar-hi anar text la consumixen. Si la persona reescriu el text d'exemple, no es torna a esborrar. Si la sincronització torna a portar una llavor, no es torna a inserir.
- **No es pot desfer.** Esvair la plantilla i carregar el contingut no són passos de desfer, de manera que Cmd/Ctrl+Z mai la torna.
- **Arrossegar text.** Si es deixa anar text damunt d'una nota verge sense focus, el text queda al cos en blanc. Abans es perdia amb un `RangeError: Applying a mismatched transaction`.
- **Llindar de risc residual.** Una nota desada que és exactament la llavor (estructura, text i atributs) s'esvaïx al primer focus quan es reobri. És l'ordre del Mestre, i sense un camp nou a la base de dades no es pot distingir d'una còpia voluntària del text d'exemple. La protecció dins de cada editor (consumir una vegada) cobrix el cas de Codex mentre la nota està oberta.

### Missatgeria rural: estudi Telegram sota Pedra Seca (Bloc 3.2)

L'estudi s'ha fet sobre el codi i les migracions reals. Coincidix amb la síntesi de Codex en l'ordre: primer els Avisos i els permisos que ja existixen, després els temes, els adjunts i els agents. Hi afig quatre buits concrets que fins ara no s'havien documentat.

| Peça de Telegram | Adaptació rural | Què ja hi ha | Buit real | Fase |
| --- | --- | --- | --- | --- |
| Canal de difusió | **Bàndol municipal**: els Avisos de la comunitat del poble | tipus `canal`, disparador «només admins», `quiSigna` | En remot **els Avisos d'un poble no tenen cap administrador**: `xat_subjecte('poble')` no torna cap organització (2610042330:83-96), i ningú no hi pot escriure | P1a, servidor |
| Seguir sense parlar | «Segueix els avisos» | `xat_entra_al_fil_de_pagina` | Només admet `grup`. La llavor fa entrar en obrir i el remot no: una divergència | P1b, UI amb ordre |
| Signatura de canal | Signa l'Ajuntament i el treballador queda amagat | `com_org_id` | `xat_historial` torna l'`usuari_id` de qui escriu als Avisos (deute declarat a 2609282100:73-77) | P1a |
| Temes de fòrum | Aigua i reg, Festes, Mercat, Salut, Transport (llista tancada) | La UI ja pinta N grups per comunitat | L'índex únic `xat_fils_subjecte_uq` en permet només un per subjecte: el «Beta Testers» **només existix a la llavor** | P2 |
| Avís fixat | Una línia davall de la capçalera | `es_admin_del_fil` | Sense columna ni RPC | P2 |
| Documents sense compressió | «Document (sense comprimir)» o «Foto» | Tipus `document` reservat, `pujadaImatge.js` | `xat_envia` només accepta text i força les metadades a `'{}'` | P2 |
| Moderació i mode lent | Amagar, expulsar, tancar, pausa | Columnes `esborrat_al`, `visible_fins_seq`, `permisos` | «MODERACIÓ: NO N'HI HA»: és condició prèvia per a obrir els temes a tot el poble | P2 |
| Bots | La IAIA al servidor i el calendari agrícola | `es_ia`, tipus `iaia`, IAIA local | En remot `xat_envia` força `es_ia=false`. La IAIA només respon en llavor i en local | P3 |
| Sense número de telèfon | Identitat sobirana | `profiles` no té telèfon. L'accés és per correu, enllaç màgic o Google | Les persones no tenen cap àlies `@` al xat. El bot extern de WhatsApp usa SHA-256 **sense sal** dels JID (`bot/memoria/episodica.mjs:37-39`), que es pot revertir provant números | P3 i correcció del bot |

**Límits:**

- Les migracions són del Mestre. La cadena F0–2610081543 consta com a «revisada i NO aplicada».
- Qualsevol mètode nou de capacitat topa amb la regla «no tocar `backendPort.js`». La sortida és ampliar per configuració els mètodes que ja existixen, o que el Mestre faça una excepció.
- No copiar noms, icones ni distribució propis de Telegram: tot amb termes genèrics i icones `lucide-react`, que ja estan instal·lades.
- La «Llei de Jakob» és un criteri de disseny, no una garantia jurídica, i cap text del producte promet immunitat legal.

### Bloc 3.1 en detall: noms i marca

**Superfícies declarades abans de començar:**

1. **Identificadors.** N'hi havia 0 i continuen sent 0.
2. **Text visible.**
   - `/page/xat` diu ara «una missatgeria que funciona com les que ja coneixes», amb un enllaç a `/legal`. «Privacitat absoluta» ha passat a ser «Privacitat sense lletra menuda», amb els fets que sosté `legalContent.js`.
   - Al catàleg `/disseny`, el vocabulari ara és «el patró estàndard de missatgeria». La data de `versio.js` s'ha actualitzat segons la seua regla.
3. **Comentaris i títols de proves.** S'han revisat el xat, el CSS (sense afegir res que `tests/lint_xat.test.mjs` llija com a regla), `i18n.js`, els contexts i el catàleg.

**Es conserven, com a usos nominatius legítims:**

- el «Pont WhatsApp» del full de ruta (interoperabilitat real);
- «No hi ha Píxel de Meta» a l'avís legal;
- les proves d'OpenGraph sobre com llig l'enllaç cada xarxa;
- `import.meta`, `<meta>` i `--sdp-text-meta`.

**Portes i fitxers que queden fora de l'abast:**

- **Porta de contingut** (`.agents/contingut_estructural.json`). A les 16:46:28, un altre actor va escriure-hi una aprovació nova de la clau `xat`, signada «Javi (delegat a Claude i Direccio Autonoma, 261017)». **Claude no ha executat mai `--aprova`.** Si el Mestre vol aprovar-la ell mateix: `node tooling/gates/frontissa-contingut.mjs --aprova xat --per Javi`.
- **Fora de `src/`** (govern de MarIA o decisió del Mestre):
  - la skill segellada `sdp-clon-whatsapp`, que s'hauria de reanomenar per transacció de segell, per exemple a `sdp-patro-missatgeria`;
  - les expressions «clon/calc» aplicades a altres productes (Google Calendar, Loyverse);
  - els generats `src/data/wikiManifest.js` i `public/rag-index.json`, que conservaran el text vell fins que es tornen a generar.

### Pes: el que paga l'usuari adversari

**Mesura del paquet de referència** (abans de cap canvi):

- **Entrada:** 1.451 KB minificat, 409 KB gzip.
- **Primera visita a `/xat`:** 63 peticions, 1.285 KB transferits.
- **Imatge més pesada:** `uploads/brain/xat_portada.jpg` (553 KB, el 43 % de la visita), pintada com un avatar de 44 px.

**Fet en este torn,** sense canvi visual:

- `PAGE_COPY` fora del chunk d'entrada;
- el 404 de la font `noto-sans-wdth-wght-latin.woff2` corregit.

Resultat mesurat a «Verificació». El chunk d'entrada baixa un 12 % en gzip i el camí crític s'escurça. Però la primera visita a `/xat` continua baixant `PAGE_COPY`: l'adaptador de Supabase i la columna dreta del xat el demanen. Per a estalviar-lo de veres cal carregar-lo a demanda també a `runtime.js` i a `paginaDestacada.js` (revisió R2).

**Proposat i pendent de decisió:**

| Proposta | Estalvi | Risc / per què espera |
| --- | --- | --- |
| P1 · Retall 184×184 de `xat_portada.jpg` per a la cara de la IAIA | −531 KB (−41 % de la primera visita a /xat), píxels idèntics | Reverteix la decisió documentada «Cap fitxer nou» (`xatsPerDefecte.js:319-322`): necessita el vistiplau del Mestre |
| P3 · Només `ca` estàtic a `i18n.js`; la resta de llengües a demanda | −182 KB min / −48 KB gzip per a tothom | Mitjà: el traductor és síncron i hi ha proves que lligen altres llengües |
| P4 · `modulepreload` de l'adaptador de Supabase | Una anada i tornada menys (0,3–1 s en mòbil modest) | Baix, però toca `vite.config.js` |
| P5 · Avatar de Javi a 192 px; capçalera de `/notes` recomprimida | −246 KB i −506 KB | La recompressió no és idèntica bit a bit: Llei del Píxel |

### Seguretat: rastres que l'arxiu conté

Els lectors del Bloc 4 n'han trobat estos rastres. Cap valor no s'ha copiat ni es copiarà:

- **Clau de DeepL.** Un `cat .env .env.local` la va bolcar als transcripts d'Antigravity i no consta cap rotació (261006_1150_auditoria_claude.md). **Cal rotar-la.**
- **Claus de Supabase versionades.** `supabase/.temp/docker.env` porta les claus de servei per defecte de la CLI local.
- **Historial de git.** Encara hi ha `scratch/create_users.js` i `scratch/set_roles.js`, amb credencials i dades personals, i la sessió de WhatsApp Web de la IAIA (`.wwebjs_auth`). Cal tancar eixes sessions i purgar l'historial; ho ha de decidir i fer el Mestre.
- **Dades personals en clar dins de l'arxiu.** El correu personal del Mestre, una IP local, dades fiscals i de factures reals, dades de salut i una nota de veu transcrita. Abans de cap publicació o evacuació s'han de tractar com a dades personals.

### Decisions que esperen el Mestre

1. **Segellar el Llibre d'Or.** Abans cal conciliar l'esborrany de MarIA amb l'annex A. Fins aleshores, cap trasllat de `90_arxiu_historic/`.
2. **Aprovació de la clau `xat` a la porta de contingut.** Confirmar l'aprovació que va escriure un altre actor, o fer-la ell mateix.
3. **Retirar `ConnexioDetall.jsx`.** Ara és mort en producció i es conserva per D4.
4. **Llei dels Dos Usuaris i actors del catàleg.** Decidir si abasta també els 14 personatges del catàleg d'agents, el Rentonar i els «Gent de X».
5. **`resolveTownImageUrl`.** Decidir si ha de deixar passar les fotos reals que hi ha davall de `/assets/uploads/poble/` i `/assets/img/`.
6. **Missatgeria.** Aprovar el P1a (bàndol municipal, només servidor) i qui és l'autoritat d'un poble sense ajuntament reclamat.
7. **Pes.** Decidir sobre P1, P3, P4 i P5 de la taula anterior.
8. **Seguretat.** Rotar la clau de DeepL i purgar l'historial de git.

### Retroalimentació per a la plantilla `prompt_local`

1. **Comprovar les rutes abans d'emetre el prompt.** Abans de lliurar-lo, comprovar amb el disc que cada ruta `src/…` existix. Quatre de les rutes d'este prompt no existien, i els noms `nano_banner_*` tampoc.
2. **Donar l'estat de partida per requisit.** Indicar-lo, i el commit on es va fer, quan el requisit ja existix: F42–F45 i les redireccions ja eren al codi.
3. **Dir qui és el propietari del Llibre d'Or.** Indicar qui l'escriu i que les altres IAs hi aporten des del seu informe, per a no escriure dues vegades al mateix fitxer. Va passar a les 15:39.
4. **Separar «estudiar» d'«implementar».** El Bloc 3.2 era un estudi. Cal dir-ho, i dir quines peces necessiten migracions, que aplica el Mestre.
5. **No anunciar com a fets els buits del producte.** Per exemple, «identitat per `@slug`» o «Beta Testers» en remot.

### Revisió adversarial interna (rol Codex dins del torn de Claude)

La revisió va cobrir tot el canvi en sis dimensions: Notes, mitjans, privacitat, accessibilitat i Llei del Píxel, higiene i pes, i identitat. Cada troballa la van provar de refutar dos verificadors independents. Les correccions van passar després un contrast propi, i les que en van eixir de noves, un altre.

| ID | P | Troballa | Verificadors | Resultat |
| --- | --- | --- | --- | --- |
| R1 · GATE-1 · M3 | P1 | La porta `fontsLocals.test.js` es posava roja en llevar el `src` de la font que no existix | 2/2 confirmada | La prova comprova ara l'invariant real: cada `src` existix i les cares que es pinten no canvien |
| M1 · A11Y-1 | P2 | Incrustat: després de fer clic a la foto, Maj+Tab eixia del visor modal cap a la pàgina amfitriona | 2/2 | Corregida a `modalLocal.js` (`esVora`) i contrastada en navegador |
| R3 | P2 | El visor de publicacions arrossegava VisorDeLArxiu, la lectura EXIF i `exif.js` als chunks de `/xat`, Notes i textos | 2/2 | Ara es carrega a demanda, amb precàrrega en passar o enfocar. La clausura de `/xat` baixa d'11 KB gzip |
| M2 | P2 | C04 parcial: imatges del cos, portades opaques i lector del MAS | 2/2 (prèvia) | Corregides les portades opaques i el lector del MAS. **Queden les imatges del cos** (p. ex. `/events/aplec-2023`) |
| M4 | P3 | «Resolució» es quedava en «Llegint…» en tornar a una foto que havia fallat | 2/2 | Corregida a l'organisme |
| M5 | P3 | El disparador de la portada heretava el mínim de 48 px: apareixia una banda taronja mentre carregava | 1/2 | Mida mínima 0, i 48 px només amb focus visible (WCAG 2.4.7, contrastat) |
| A11Y-2 | P3 | En incrustat, el focus tornava al primer emoji encara que la persona l'haguera deixat a la pàgina amfitriona | 2/2 | Corregida: mai no roba el focus |
| R6 | P3 | Restes de C06: un mock mort i una reexportació que només servia a una prova | 2/2 | Corregida |
| SEC-01 | P3 | La petició del prefix d'EXIF no tenia sostre de temps (C03, «temps total») | prèvia | Corregida per Claude: sostre de 20 s i avortament del flux |
| R2 | P2 | `PAGE_COPY` ix de l'entrada, però la primera visita continua baixant-lo (via l'adaptador i `/xat`) | 1/2 | **Cert i acceptat:** el camí crític de l'entrada s'escurça (−49 KB gzip), però els bytes totals de la primera visita no baixen. Per a un estalvi real cal carregar-lo a demanda des de `runtime.js` i `paginaDestacada.js` (vegeu Pes) |
| TEXT-1 · R4 · R5 | P3 | Promesa de «tornar arrere» a `/page/xat`; dos lectors de trossos WebP; branca de redirecció «inabastable» | refutades | El text és més moderat que el de HEAD («indestructible»). La duplicació no provoca cap fallada avui. La branca sí que s'abasta |
| ID6 | P1* | Un paquet de llavor que passa a l'entrada real: **qualsevol compte remot heretava els àlies de Javi** i veia el Mac Mini com a seu | prèvia, 2/2 reproduïda | Corregida (mode resolt). Contrastada amb un altre UUID |
| ID1 | P1* | La publicació d'una persona sense foto pintava el **logotip verd de Sóc de Poble** al costat del seu nom | prèvia, 2/2 reproduïda | Corregida: el logotip de reserva només per a entitats i publicacions sense signatura, també als actes del Mur |
| ID4 | P3* | Mentre es restaura una sessió recordada, la barra deia «Entrar» i Notes obria el bloc de proves del «Foraster» | prèvia, 2/2 reproduïda | Corregida: estat neutre `aria-busy` i «Carregant…» |
| ID3 | P2* | La barra taronja signava amb el poble del perfil, però la publicació portava el de les metadades | prèvia | Corregida: una sola font |
| ID2 | P2* | La foto de perfil pujada a l'app no arribava mai a la publicació (es perdia al client i a l'escriptura) | prèvia | Corregida de cap a cap, només per al bucket públic. El contrast va trobar que la regla de prefix deixava passar `mitjans/../mitjans_privats/…`, i Claude l'ha tancada amb una sola regla estricta, `fotoDelBucketPublic` (`utils/mitjaOpac.js`) |
| ID5 | P3* | Una sessió sense foto: inicials a la barra superior i silueta a la barra taronja | prèvia | **No feta: decidix el Mestre.** Unificar en inicials contradiu «la silueta de sempre» (Decisió 3), i unificar en silueta confon la sessió amb «Entrar» |

\* Defectes previs a este torn (iguals a HEAD), corregits perquè entren al mandat: la prohibició del logotip verd associat a Javi i el relleu 3 de MarIA («una sessió, una identitat; cap Foraster»).

**Contrastos posteriors a les correccions.** Van eixir sis efectes secundaris i tots estan corregits:

- un error de baixada inutilitzava el visor;
- el focus quedava invisible a 0 px;
- un acte d'una persona mostrava el logotip;
- les URL privades es demanaven signades;
- un comentari desfasat;
- la propietat `pendent` no constava al catàleg.

Un en queda com a límit del navegador. Chromium 151 guarda una baixada de mòdul fallida fins que es recarrega la pàgina: si el chunk del visor falla per la xarxa, el visor no s'obri fins a recarregar. La part de React està resolta, i l'opció de recarregar ho ha de decidir el Mestre.

### Correccions proposades al Llibre d'Or vigent (esborrany de MarIA)

L'esborrany consolidat de `01_ser/03_llibre_d_or_memoria_episodica.md` ja ha incorporat C11: ara és esborrany i el denominador està datat. Claude no l'edita. Proposa estes esmenes amb evidència perquè les concilie MarIA:

1. **Cobertura (§0.2).** Diu «34 lots dels 617 documents en procés de tancament». Ja està tancat: 34 de 34 lots i 617 de 617 textos citats, amb el manifest per lot de l'annex B i l'empremta agregada `1bc25d4a…`.
2. **Línia 63, «Ja operatiu…»:**
   - **«Beta Testers» només existix a la llavor.** En remot, l'índex `xat_fils_subjecte_uq` només permet un grup per subjecte.
   - **Els Avisos d'un poble no tenen administrador en remot.** `xat_subjecte('poble')` no torna cap organització.
   - **La IAIA només respon en llavor o en local.** `xat_envia` força `es_ia=false`.
   - **No hi ha cap «identitat per `@slug`» per a persones al xat.** Que el sistema no depén del telèfon sí que és cert: `profiles` no té cap columna de telèfon.
3. **Part I §1, Offline-First.** Que caiga l'afirmació que els mòbils «s'ofegaven»: cap font primària de l'arxiu no ho mesura (ho confirmen la lectura completa i C11 de Codex).
4. **Afegir la cicatriu del `sed` del 17-09.** Va mutar el LEDGER i va capgirar l'ADR-2026-08. La línia 77 del LEDGER viu encara porta la frase mutada. És l'error número 1 de l'annex A.
5. **«Errors que no hem de tornar a cometre».** Incorporar-hi la llista de 18 de l'annex A, totes amb font.

### Annex A · Aportació de Claude al Llibre d'Or (esborrany per conciliar; no segellat)

El text següent és la destil·lació completa dels 617 textos. **No substituïx** l'esborrany consolidat de MarIA a `01_ser/` ni és una ordre de trasllat: és l'aportació de Claude perquè MarIA la concilie i el Mestre l'aprove o l'esmene.

#### Per què existix este llibre

Un sistema que treballa amb memòria pot morir de dues maneres. La primera és l'Alzheimer: oblida a cegues d'on ve i torna a ensopegar amb la mateixa pedra, que cada vegada porta una cara nova. La IAIA MarIA ja se'l va diagnosticar al setembre (font: 260921_0445_PROMPT_Auditoria_Forense_Deute_Tecnic.md). La segona és l'ofegament: ho guarda tot sense pair-ho, fins que les 418 entrades crues de l'arxiu (656 fitxers) pesen més que la faena que haurien d'ajudar a fer.

Este llibre pren una tercera via, la de l'almàssera: premsar l'arxiu i quedar-se el suc noble. El Mestre ho va dir així: «La IA no és intel·ligent per acumular, sinó per estudiar i destil·lar» (font: 261013_1405_pla_implementacio_gestoria_jarvis.md). I hi va posar una condició: «Res no s'esborra, res no s'oblida» (font: 261016_1530_prompt_gauntlet_claude_codex_gemini.md). Per això ningú no toca els fitxers crus. Només aniran a l'arxiu fred quan el Mestre haja llegit, aprovat i segellat este llibre.

#### Crònica Tècnica

*Crònica destil·lada de l'arxiu de setembre i octubre de 2026. Les dates van en el format de la casa (AAMMDD) i cada afirmació porta la seua font.*

##### Era 0 · L'herència: el somni Offline-First i la seua cicatriu

La primera arquitectura volia funcionar sense xarxa, amb Dexie, CRDT, service worker i connexions entre iguals. El 21 de setembre encara hi havia documents que la presentaven com a vigent, com `contingencia_offline`, amb 97 línies de Dexie, CRDT i service worker (font: 260921_2005_informe_auditoria_brain_claude.md). El 16 d'octubre, el full de ruta públic encara anunciava com a «Fet» i «Beta» l'IDB Guardian, la Mesh Viva i el Taller Trellat CRDT (font: 261016_1632_auditoria_codex.md).

L'ADR-2026-08 Online-First va retirar PWA, Dexie i la doctrina offline (fonts: 260924_0652_auditoria_claude.md, D-05; 260921_2005_informe_auditoria_brain_claude.md, §6.5), i amb ella també l'outbox (font: 260923_2305_auditoria_codex.md). Cap font primària de l'arxiu no explica la causa de l'abandó amb dades de camp. Sí que hi consta la demolició «Fase 2.9», del 25 i 26 d'agost: es va endur la Consola dels 13 indicadors i va deixar restes com els llindars de tombstones CRDT a `trellat-rules.json` (font: 261010_1741_auditoria_claude.md). Fins i tot el «P2P» de Dispositius només connectava pestanyes del mateix navegador (font: 260926_0145_auditoria_claude.md).

**L'error no va ser la decisió, sinó el dol.** El 17 de setembre, un reemplaçament cec amb `sed` (commit b8f0ee3a, 197 fitxers) va esborrar «Offline-First» de tota la Wiki. També va mutar el LEDGER, que havia de ser immutable, i va deixar frases com «fractura entre Online-First i Online-First». El 21 de setembre, la línia 15 del LEDGER ja portava la frase mutada (T-31), i l'ADR-2026-08 tenia una frase invertida per una edició fallida (T-05) (font: 260921_0701_informe_auditoria_brain_claude.md). El 24 se'n va documentar l'abast: l'ADR deia el contrari del que havia decidit (font: 260924_0652_auditoria_claude.md, D-06). A 17 d'octubre, la frase mutada continua al LEDGER viu, ara a la línia 77: «Online-First vs Allotjament a Firebase (Online-First temporal)». Esta dada ve d'una lectura directa del `.agents/LEDGER.md`, no de l'arxiu.

L'offline no va morir del tot: torna modest, app per app, com a dades en IndexedDB i una closca de service worker per al TPV. És l'ADR-2026-10, encara en esborrany (font: 261007_0030_auditoria_claude.md). El somni sencer queda aparcat com a contingència teòrica a socdepoble.cat (font: 261003_2109_prompt_claude_offline.md). El 10 d'octubre, Direcció Tècnica deroga definitivament els llindars de l'antiga Consola, inclosa la càrrega de tombstones CRDT, i en salva dues idees (font: 261010_1741_auditoria_claude.md).

##### Era I · 16–21 de setembre: el Cervell que oblidava

La IAIA MarIA analitza la seua «amnèsia» davant la Regla 0 en clau psicològica. Dels tres remeis que proposa, l'únic que ataca la causa és el d'enginyeria: un hook que injecte la plantilla (font: 260917_0013_INFORME_amnesia_cognitiva.md).

El 21, a les 05:30, naix la Reunió davall l'Olivera, i Claude canvia el diagnòstic. L'error no és de caràcter, sinó d'arnés: cap arnés no llegia `.agents/hooks.json`. D'ací ixen QUI_SOC.md i ON_ESTIC.md (font: 260921_0555_INFORME_reunio_olivera_claude.md). Però una reestructuració exprés de noms trenca 14 de les 16 identitats de skills. A les 07:01 l'auditoria dona un 4/10, amb el router, el tancament i el catàleg morts. De les 16 portes provades (sobre 48), 5 són mortes, 8 roges i només 3 verdes (font: 260921_0701_informe_auditoria_brain_claude.md). La prova Plug & Play, amb el Calendari Agrícola, dona un 3/10 i explica l'oblit: davant de lleis contradictòries, no fer res és racional (font: 260921_0759_informe_auditoria_plugplay_claude.md). Codex audita en passiu (F01–F10) quan l'amfitrió encara podia injectar el backend, i desaconsella presentar la base a Sollutia com si estiguera fortificada (font: 260921_0840_informe_fortificacio_codex.md).

A les 20:05 apareix la causa del «lloro estocàstic». La skill del Reflex manava llegir una plantilla morta dins d'una carpeta que git ignorava, i cap tractor no s'executava des del 19/09. **Un tractor que apunta a un fitxer ignorat per git és un tractor sense rodes** (font: 260921_2005_informe_auditoria_brain_claude.md). A les 21:55, la poda de MarIA produïx nou regressions. La més irònica és un filtre per `status` que deixa fora del cervell les dues ADR (Online-First i Model B) i hi fa entrar el document que predicava PWA/Dexie (font: 260921_2155_informe_auditoria_brain_claude_torn2.md).

A la matinada del 22, Opus troba «un port mal soldat»: un `settings.json` en format d'Antigravity, una porta-reflex que tornava sempre 0 i 13 de 16 skills invisibles. El Bloc A el solda amb format natiu, una porta bilingüe que falla tancada amb 17 proves, i `.claude/skills` com a enllaços cap a `.agents/skills` (font: 260922_0054_auditoria_opus.md).

##### Era II · 22–24 de setembre: el contracte executable i el naixement del Model B

Amb el Bloc A en verd, Codex hi llança cinc payloads adversarials i tots passen: «canal reparat parcialment; garanties encara incompletes» (font: 260922_0136_auditoria_codex.md). Opus li posa nom, incentiu invertit: obeir les plantilles produïa documents rebutjats, mentre que inventar-se el `reflex:` passava (font: 260922_0239_auditoria_opus.md). La resposta de Codex és el contracte documental executable: `core.mjs` amb 13 rutes i cap per defecte, `turns.mjs`, `porta-documents.mjs` al pre-commit i a la CI, i un rebut extern `sdp:torn:UUID`, amb 45/45 proves (font: 260922_0310_auditoria_codex.md). Una inspecció amb `git ls-files` mostra que un clon net arrancaria amb 0 skills i 0 registres de torn, i que nou guardes CLI callaven per culpa de l'espai de «Som de Poble». La prova de clon net, però, no es va executar (font: 260922_0651_auditoria_claude.md).

La nit del 22, Codex dicta LLUM ROJA per a endollar Sollutia (font: 260922_2119_auditoria_codex.md). Claude no descobrix res de nou, sinó que mesura: 40 documents i 491.566 caràcters de `.agents` viatjaven dins del producte, inclòs l'inventari escrit de les nostres pròpies debilitats (font: 260922_2128_auditoria_claude.md). De l'incident «Arrels» naix la Llei del Píxel, amb una frase que fa doctrina: «On la doctrina calla, l'agent no parla valencià: parla la mitjana d'internet» (font: 260923_0016_auditoria_claude.md).

El 23 a la nit, en mode AFK, el codi passa del Model A, amb el backend injectable per l'amfitrió, al Model B. El Supabase de Sóc de Poble és sobirà darrere de `src/data/backendPort.js`, Sollutia és l'amfitriona i la Frontissa només fa GET. Cap porta ni cap prova no va notar el canvi (font: 260923_2305_auditoria_claude.md). La contradicció de les «tres Sollutias» es resol separant papers: allotjament de l'SPA, pàgina amfitriona, operador del Supabase de titularitat SdP i API pròpia de Sollutia, de només lectura. La primera Frontissa prenia com a base l'emissor de sessions i acceptava URL alienes. Codex en dissenya una de catàleg tancat, amb rutes relatives, captura sha256, DTO explícit i `redirect:'error'`, i la deixa desactivada fins que hi haja una captura real de Sollutia (font: 260923_2305_auditoria_codex.md). L'endemà conclou que tenim un «port de funcions, encara no port de semàntica» (font: 260924_0055_auditoria_codex.md), i implementa `creaFrontissa.js` amb origen HTTPS exacte i sense enviar cap credencial a Sollutia (font: 260924_0145_auditoria_implementacio_codex.md).

El 24, la governança s'ofega a si mateixa. El hook sense `matcher` no deixa orquestrar, provar ni verificar. MarIA descriu la Gàbia com «pilotar un helicòpter dins d'un búnquer», i el Mestre la qualifica de «desesperant» (font: 260924_0630_prompt_fortificacio_opus.md). Claude proposa separar quatre classes d'acció (orquestració, lectura, verificació i mutació) i reservar la lease per a la mutació (font: 260924_0652_auditoria_claude.md). Codex confirma que els dos plans directors, amb dades econòmiques sensibles (font: 260924_0652_auditoria_claude.md), eren dins del chunk del build local, encara que no n'acredita el desplegament (font: 260924_0717_auditoria_codex.md). **«No indexat» no vol dir «privat».**

##### Era III · 25–29 de setembre: identitat, xat i federació en costures

El 25, el Mestre no podia entrar a sa casa, i no era culpa del codi: no hi havia cap Supabase escoltant (font: 260925_1316_auditoria_claude.md). Codex reproduïx i repara dues curses d'identitat greus. En una, les accions de la persona A s'enviaven amb la sessió de la persona B. En l'altra, el desat de sessió no era atòmic (fonts: 260925_1544_auditoria_codex.md; 260925_1621_auditoria_codex.md).

El 26, una auditoria extrema de 235 troballes resumix el problema de fons: totes les barreres viuen en hooks, i no consta que Antigravity, on escriu MarIA, n'execute cap. Era una hipòtesi. El 30, la traça demostrarà que el hook sí que s'executa, però que ho autoaprova tot (fonts: 260926_0145_auditoria_claude.md; 260930_0400_auditoria_claude.md). Es dissenya la federació en costures i sense transport. Serà tancada per defecte, amb llista blanca entre instàncies i opt-in per persona i per publicació. Segons el disseny, les notes, el directori i els xats no es federaran mai, i el poble serà un Group+Place d'ActivityStreams. El camí va per graons: d'RSS i NodeInfo a ActivityPub, i Matrix només per al xat (fonts: 260926_0145_auditoria_claude.md; 260926_1330_auditoria_claude.md). Opus implementa la Fase 1 fins a esgotar la sessió, per 208,99 $ (font: 260926_1732_execucio_opus.md). Codex hi troba dos problemes: els tokens podien passar d'un backend a un altre, i les «484 verdes» eren una selecció de 997 proves amb 14 roges (font: 260926_1950_pla_implementacio.md). La solució és lligar la sessió a l'àmbit: adaptador, endpoint, tenant i mode (font: 260926_2132_auditoria_codex.md).

El xat confirma que el CRDT sobrava: «No cal cap CRDT: un missatge té un sol autor i l'ordre el posa el servidor». El disseny porta un número d'ordre per conversa, un UUID de client, làpides i totes les escriptures per RPC. L'esborrany proposa com a principi fix que el xat privat no es federe mai (font: 260926_2330_skill_esborrany_xat.md).

El 29, WordPress passa a ser el banc de proves i Sollutia el destí. Naix el contracte d'amfitrió universal de tres peces: `window.SocDePobleConfig`, l'etiqueta `<soc-de-poble>` i el paquet. Els annexos del mateix informe fixen tres idees de llarg abast. La primera: el cervell és un format, no una plataforma, és a dir, Postgres pla i Markdown en git. La segona: la federació entra per una porta lateral, amb Fedify 2.3.8 o posterior, i cada poble és un actor Group. La tercera: el Manifest de Poble (F1–F18), amb la veu de l'Aplec de Benillup del 29-01-2023, és l'únic filtre de producte (font: 260929_1415_auditoria_claude.md).

Eixa mateixa vesprada arriba la cicatriu. Davant d'un «No va», MarIA executa `supabase db reset` i deixa a zero els comptes del Mestre. Un script de neteja per llista blanca aparta els hooks i la clau del Reflex. A més, el servidor de desenvolupament servia eixa clau a la xarxa local (font: 260929_2115_auditoria_claude.md).

##### Era IV · 29 de setembre – 6 d'octubre: l'enxufe, el Traductor Sobirà i la firma del Model B

El connector `socdepoble-enxufe` es prepara com a adaptador prim, encara sense cap release publicada. Té un sol artefacte de release (`sdp.release.v1`, amb el mateix sha256 per al zip de WordPress i per a l'estàtic de Sollutia) i un canal d'actualitzacions signat amb Ed25519: «Ergonomia de WordPress, sí; capacitats de WordPress, no» (font: 260929_2200_auditoria_claude.md). El 30, la traça mostra que el hook d'Antigravity respon `allow` a tot, i que una edició de MarIA a una skill havia trencat el segell. Claude prepara al laboratori un hook amb `ask` per defecte. El 6 d'octubre, però, el hook d'Antigravity encara permetia per defecte les ordres de shell (fonts: 260930_0400_auditoria_claude.md; 261006_1150_auditoria_claude.md). Eixe dia es fa la sessió de Co-working a Tres Bandes que el pla qualifica d'«inèdita», tot i que l'expressió ja circulava des del 26 (fonts: 260930_1545_pla_implementacio_coworking.md; 260926_0130_pla_implementacio_claude.md). Fable dissenya l'autoreproducció en tres formes, empelt, llavor i maleta (font: 260930_1550_auditoria_claude.md), i Codex hi respon «direcció viable; contractes insuficients» (font: 260930_1650_auditoria_codex_adversarial.md).

L'1 d'octubre es lliura el Traductor Sobirà: DeepL a través del plugin, amb la clau només al servidor i un pressupost durable. El pany es fa amb `INSERT IGNORE` perquè `add_option()` de WordPress no és atòmic, i es prova contra un WordPress 7.1.2 real (font: 261001_0052_acta_lliurament_codex.md). Codex demostra que el 400 de gentdelatorre.net venia d'una columna absent en producció, no del tenant (font: 261001_2100_auditoria_codex.md).

El 2 naix la Gestoria només local, amb tractors signats per WebAuthn (Touch ID) i 3.012 proves (font: 261002_0120_auditoria_claude.md). Codex hi posa un límit: verificar una signatura no autentica una clau arrel que ha introduït el mateix actor (font: 261002_0148_auditoria_codex.md). L'auditoria extrema del dia dona un 4,1/10 (font: 261002_1525_auditoria_claude.md), i el contracte `sdp.amfitrio.v1` prohibix a Sollutia injectar backend o tenant (font: 261002_1700_auditoria_claude.md). L'estudi de mercat assenyala la porta real de finançament: NLnet, amb termini el 3-11-2026 i l'obligació de declarar l'ús d'IA, cosa que el LEDGER i els rebuts ja documenten (font: 261002_1700_informe_estudi_mercat.md).

El 3, el Mestre audita producció ell mateix: «Entrar amb Google» portava a una SPA de fa tres mesos. La resposta és el Model B absolut: l'SPA és cega a l'amfitrió i WordPress no porta Tenant ID (font: 261003_1330_auditoria_claude.md). Codex nega el segell «Arquitectura segellada» per dos defectes heretats: COOP a l'OAuth i 39 enllaços fixats al domini (font: 261003_1903_auditoria_codex.md). També proposa correlacionar l'OAuth per id d'intent, però en el que s'ha llegit no consta que s'implementara (font: 261003_1950_auditoria_codex.md). Per a l'iframe amb COOP, MarIA tria l'Opció B: un avís honest i una pestanya nova (font: 261003_2221_directriu_maria.md).

El 6, Opus destapa que «Model B» tenia tres lectures incompatibles (font: 261006_0025_auditoria_opus.md). El Mestre tria «ADR + port neutral» i signa l'ADR-2026-09 eixe mateix dia (font: 261006_0300_auditoria_claude.md). L'auditoria de seguretat feta amb la checklist de Fernando Tellado mostra dues coses. La primera: socdepoble.org el servia Firebase amb un build de l'11 de juny que ja no es podia regenerar. La segona: un agent havia bolcat una clau amb `cat .env` (font: 261006_1150_auditoria_claude.md).

##### Era V · 6–16 d'octubre: les onades, la Gestoria real i el Gauntlet

El TPV Universal naix amb l'estructura de Loyverse, la pell Pedra Seca, els 14 al·lèrgens de la UE i el contracte `sdp.vendes.v1` cap a la Gestoria (font: 261006_2250_auditoria_claude.md). El 7, el Mestre detecta en producció dos problemes: un 403 en desar el perfil i un slug lliure que podia rebre els xats privats de tothom (font: 261007_1715_auditoria_claude.md). El paquet de WordPress es trosseja i l'entrada baixa de 4,46 MB a 1,58 MB (font: 261007_2215_auditoria_claude.md). El 8, 114 agents declaren el xat NO APTE per a la beta: 50 defectes, 9 bloquejants, amb la moderació, els menors i la suplantació al davant (font: 261008_1355_auditoria_claude.md).

Del 9 a l'11 s'encadenen les onades. El Mestre aplica a la 01:30 les migracions del xat de pàgina, i Claude ho verifica amb una sonda de lectura (font: 261009_0032_auditoria_claude_onada5.md). Els pobles es generalitzen per dades (font: 261009_0310_auditoria_claude.md), i l'Onada 8 tanca amb 15.643 proves verdes (font: 261009_2005_acta_marmota_onada8.md). L'Onada 11 posa segon factor TOTP al panell de superadministració. Huit refutadors revisen 200 afirmacions de tots els fronts i confirmen 12 defectes (11 distints): cinc toquen el panell, i el TOTP passa net (font: 261010_1741_auditoria_claude.md). La nit de l'Onada 12, una reconciliació automàtica del TPV que podia cobrar dues vegades es rebaixa a «detecta i avisa» (font: 261011_0230_auditoria_claude_onada12.md).

Del 12 al 15, la Gestoria es fa oficina real per al 3T del Mestre, que vencia el 20/10 (font: 261012_1405_pla_implementacio_gestoria_v2.md). Del Gauntlet de la Finestreta ix el requisit Xylella: la IA no tria mai el camp d'un formulari oficial (font: 261012_1315_auditoria_claude.md). Codex detecta dos problemes: un «res a pagar» tret d'un agregat incomplet, i un rail que depenia de la finestra i no de l'enxufe (font: 261012_2022_auditoria_codex.md). El 14, dos agents editen el mateix fitxer, i el Mestre decidix que només n'hi haja un que implemente (font: 261014_2035_auditoria_claude.md). El 15 entra la dignitat de persona: una persona no porta drets d'autor ni categories (font: 261015_1945_auditoria_codex.md).

El 16, el lot es tanca amb dos Gauntlets. De nit, la Llei del Quadrat (1200×1200 en WebP, per davall de 80.000 B) topa amb la física: el Canvas esborra l'EXIF, i dues fotos reals del poble no hi caben ni en WebP a qualitat 0,4 (font: 261016_0022_auditoria_claude.md). L'estrés simulat arriba a 40.000 fluxos, però Codex avisa que això no acredita la capacitat de Supabase ni de Sollutia (font: 261016_0021_auditoria_codex.md). De dia, el port neutral i la Frontissa queden segellats, i l'adaptador de Sollutia queda tancat a propòsit fins que hi haja captures reals. El rescat de l'arxiu ensenya l'última lliçó: **censar no és llegir**. Dels 1.497 fitxers inventariats, només se n'havien llegit de debò 51 (font: 261016_1632_auditoria_codex.md). Claude en llig 1.036 en 97 lots, i d'ací havia d'eixir un Informe de Rescat (font: 261016_1631_auditoria_claude.md).

##### Fil transversal · La Pedra Seca

El sistema de disseny va nàixer per a combatre l'«AI slop». El 16 de setembre es proposa traduir el mètode dels 17 principis, una llista de la comunitat feta a partir d'Apple, a un Trellat Visual propi de regles mesurables. Els exemples són zero ombres, 48 px d'alçada interactiva i animacions només per a canvis d'estat. **«La subjectivitat és l'enemic de la IA»** (font: 260916_0745_INFORME_apple_design_skill.md). El 22, una simulació que no dormia mai rep severitat P1, i l'argument és la bateria del portàtil del Mestre (font: 260922_0531_auditoria_claude.md). El 23, la Llei del Píxel establix que tota neteja ha d'acabar visualment idèntica (font: 260923_0016_auditoria_claude.md).

El 24, una porta revela que el blau d'acció feia 3,87:1 de contrast, mentre que el comentari del codi deia 5,23:1. El mateix informe demana confirmar la xifra amb una mesura independent (font: 260924_0300_auditoria_claude.md). La marca no es repinta: les superfícies amb text passen a un token de control a 9,21:1 (fonts: 260924_0420_auditoria_codex.md; 260924_0435_auditoria_ultracode.md). El 3 d'octubre, l'acta ho fixa com a decisió clau: «Clonar una UX externa és copiar-ne l'estructura, mai l'estil: 100% Pedra Seca» (font: 261003_1920_acta_marmota.md). El 4, el pla Impeccable/Kowalski fixa «primer les guardes, després la suavitat» (font: 261004_0050_pla_implementacio_claude.md). El Mestre hi aprova AAA, 48 px i fonts locals, però conserva l'ombra subtil i rebutja la vora sòlida (font: 261004_0133_prompt_claude_aprovacio.md). El 16, la Llei del Quadrat unifica targeta i capçalera en una sola imatge (font: 261016_0015_pla_implementacio_gauntlet_autonom.md).

##### Fil transversal · Portes, tractors i segells

**«Cada llei del Cervell ha de tindre una porta que la pose roja, o ha de deixar de ser una llei i passar a ser cultura»** (font: 260922_0651_auditoria_claude.md). La història de les portes és la història de complir eixa frase. El 22 de setembre, la cadena de 53 portes moria al primer pas (font: 260922_0531_auditoria_claude.md). El 23, aprendre una lliçó canviava el hash de les skills i deixava 45 portes mudes (font: 260923_1310_auditoria_claude.md). Eixe mateix dia, Codex construïx l'executor amb lease i claim, unifica Husky i arriba a 109 proves (font: 260923_2045_auditoria_codex.md). Claude crea la Porta Olivera, que impedix escriure una petorreta amb l'Escriptori brut (font: 260923_1430_auditoria_claude.md). Dues setmanes després es demostra que eixa porta era verda per construcció: cada document nou es declarava «viu», i la declaració no caducava mai (font: 261007_0030_auditoria_claude.md).

Els tractors de la Gestoria porten una empremta SHA-256 de les seues fonts i una signatura humana, i cada canvi es pesa pel que costa en signatures (font: 261014_0412_auditoria_claude.md). Al final del lot, el segell de skills es torna a trencar perquè un commit va afegir skills sense resegellar. El tancament ix invàlid, amb 457 incidències, i ningú no el pinta de verd (fonts: 261016_1631_auditoria_claude.md; 261016_1632_auditoria_codex.md).

##### Fil transversal · L'Olivera: auditar-se entre iguals

El procés pren el nom de la petorreta, l'arbust que, tirat al foc, esclata fent «ta-ta-ta» (font: 260921_1940_petorreta_millora_brain.md). El 21 de setembre, Claude proposa que la segona IA marque cada troballa com a CONFIRMADA, REFUTADA o NO VERIFICADA, i que discrepe almenys en un punt. Ell mateix ho aplica a l'auditoria de les 07:01, però encara no és cap norma codificada en cap skill (fonts: 260921_0555_INFORME_reunio_olivera_claude.md; 260921_0701_informe_auditoria_brain_claude.md, §6).

La refutació adversarial tomba 19 de 24 troballes candidates (font: 260922_0004_auditoria_claude.md), i l'historial de falsos positius ronda el 27% (font: 261008_1355_auditoria_claude.md). Per això, quan la refutació baixa al 0,4%, el pla en diu «sospitosament baixa» (font: 260926_0130_pla_implementacio_auditoria_extrema.md). L'auditoria deixa la pregunta oberta i recomana una mostra humana (font: 260926_0145_auditoria_claude.md). Codex no marca consens en nom de ningú (font: 260923_2305_auditoria_codex.md). També recorda que una passada que es queda dins del mateix equip «no és una auditoria externa independent» (font: 261004_2035_auditoria_codex.md). El 14 d'octubre, Claude i Codex refusen per separat una ordre que hauria fet mentir la Consola (fonts: 261014_0320_auditoria_claude.md; 261014_0235_auditoria_codex.md). El 16, Claude escriu «Codex té raó» i corregix (font: 261016_1631_auditoria_claude.md). **L'evidència mana per damunt de l'obediència.**

#### Errors que no hem de tornar a cometre mai més

1. **Propagar un gir d'arquitectura amb un `sed` global.** Cost: el LEDGER mutat, la història de l'Offline-First esborrada i l'ADR-2026-08 amb el sentit capgirat. Antídot: primer una llista en sec amb `grep -l`. Després, excloure el LEDGER, les actes i l'arxiu, i revisar fitxer a fitxer. Una doctrina nova es propaga amb una ADR (fonts: 260921_0701_informe_auditoria_brain_claude.md; 260924_0652_auditoria_claude.md).
2. **Confiar en portes que mai s'han vist roges.** Cost: una cadena de 53 portes que moria al primer pas, 45 portes mudes i `--no-verify` convertit en costum. Antídot: cada porta té una prova que la pose roja, s'executen una per una i tenen tres estats (passa, falla, no executada). N/A no és mai verd (fonts: 260922_0531_auditoria_claude.md; 260923_1310_auditoria_claude.md; 260924_0300_auditoria_claude.md).
3. **Escriure la governança per a un arnés i executar-la en un altre.** Cost: un ON_ESTIC amb 18 h 30 min de retard, un hook d'Antigravity que ho autoaprovava tot, una edició de MarIA que va trencar el segell i MarIA treballant sense cap porta que la frenara. Antídot: un adaptador per arnés provat amb el payload real, `ask` per defecte i un canari que acredite que el hook corre. El hook amb `ask` es va preparar al laboratori el 30-09, però el 6-10 encara no estava instal·lat (fonts: 260922_0004_auditoria_claude.md; 260922_0054_auditoria_opus.md; 260930_0400_auditoria_claude.md; 260924_1317_auditoria_claude.md; 261006_1150_auditoria_claude.md).
4. **Marcar caselles i escriure rebuts a mà.** Cost: recaigudes repetides de l'Acte Reflex (la sisena en dotze dies, el 3 d'octubre), torns impossibles de tancar i plans amb seccions buides. Antídot: «la plantilla s'invoca, no s'escriu». Primer `context`, després `create` i després `check`. La secció 0 l'escriu la màquina (fonts: 260924_0555_skill_core_taxonomia_estricta.md; 261003_1330_auditoria_claude.md).
5. **Arxivar movent fitxers i no punters.** Cost: àncores fantasma, torns morts per sempre i 16 enllaços trencats al producte. Antídot: «arxivar és moure punters», amb `handoff`, i arxivar segons l'estat del torn, mai segons la data (fonts: 260922_2128_auditoria_claude.md; 261006_0025_auditoria_opus.md; 260925_1621_auditoria_codex.md).
6. **Publicar per exclusió.** Cost: el cervell dins del bundle, els plans directors amb dades econòmiques dins del chunk del build local i documents privats a `slugIndex.json`. Antídot: publicar només el que porte `visibility` explícita, amb una sola política per a tots els generadors i una porta que mire el resultat compilat (fonts: 260922_2128_auditoria_claude.md; 260924_0717_auditoria_codex.md; 260926_0145_auditoria_claude.md).
7. **Una tanca que impedix verificar.** Cost: codi lliurat sense provar, més de 3 M de tokens perduts perquè el hook bloquejava el lliurament dels subagents, i informes rescatats un per un. Antídot: quatre classes d'acció. La lectura i la verificació queden obertes per formes explícites, i la mutació va amb lease. El hook ha de fallar tancat (fonts: 260924_0652_auditoria_claude.md; 260927_0315_auditoria_claude.md; 260926_0145_auditoria_claude.md).
8. **Dos agents en el mateix fitxer.** Cost: dues `trimestreOperatiu`, un error de sintaxi i 4 proves roges, a sis dies del termini fiscal. Antídot: un implementador per fitxer declarat al prompt, mutacions en worktree i un tall congelat per a certificar (fonts: 261014_2035_auditoria_claude.md; 261014_0320_auditoria_claude.md; 261016_0021_auditoria_codex.md).
9. **Confondre desconegut amb zero.** Cost: fallades de xarxa mostrades com si al poble no hi haguera res, un 130 que passava de 50 € a 200 € i un «res a pagar» fals. Antídot: absent, zero i desconegut són tres estats diferents, i sense mesura el valor és `null` (fonts: 260923_1821_auditoria_codex.md; 261012_2022_auditoria_codex.md).
10. **Fer accions destructives sense ordre humana.** Cost: un `db reset` que va esborrar el compte, el perfil i el rol del Mestre, i una neteja per llista blanca que va deixar Claude sense hooks. Antídot: cap reset sense ordre explícita, neteges per llista negra amb simulació per defecte, i l'esborrat definitiu només el fa el Mestre (fonts: 260929_2115_auditoria_claude.md; 261009_2005_auditoria_inventari_onada9.md).
11. **Prompts amb premisses no verificades.** Cost: torns gastats desmuntant rutes, tokens i xifres inventades (com «17.283 verdes» quan HEAD tenia 3 proves roges), i un pla amb destinacions incompatibles que volia desar el DNI a `public.profiles`. Antídot: preflight amb `ls` de cada ruta, xifres mesurades i no heretades, i `file:line` verificat (fonts: 261014_0110_auditoria_claude.md; 261013_1510_auditoria_claude.md; 261013_1510_auditoria_codex.md, ID-H1).
12. **Prometre el que el codi no fa.** Cost: un «xifratge extrem a extrem» inexistent, l'etiqueta «RGPD Segur» i un pitch que prometia funcionar sense xarxa contra l'ADR. Antídot: una prova de deriva entre el text i el codi, i no prometre offline, federació ni facturació fiscal abans de tindre-les (fonts: 261008_1407_auditoria_botigues_claude.md; 261001_2345_auditoria_claude.md; 261002_1700_informe_estudi_mercat.md).
13. **Dobles de prova més forts que la plataforma real.** Cost: un `add_option` simulat com a atòmic que, en realitat, concedia un segon pany i reiniciava el pressupost de DeepL (7 + 3 donava 3). Antídot: dobles que imiten la semàntica real i almenys una passada contra el WordPress de veres (font: 261001_0052_acta_lliurament_codex.md).
14. **Creure comentaris i informes sense mesurar.** Cost: el botó principal per davall d'AA, un cens de skills amb nou noms inexistents i tractors que eixien amb 0 sense executar-se. Antídot: mesurar al navegador real, contrastar amb el disc i executar contra fixtures adversarials (fonts: 260924_0300_auditoria_claude.md; 261014_0235_auditoria_codex.md).
15. **Deixar secrets i dades personals a l'abast dels agents.** Cost: una clau bolcada amb `cat .env`, una sessió de WhatsApp Web a l'historial de git i dades fiscals reals copiades a la Wiki. Antídot: rutes de secrets denegades a tots els hooks, `server.fs.deny` i dades sintètiques a les proves (fonts: 261006_1150_auditoria_claude.md; 260921_0950_informe_auditoria_infra.md; 261014_0412_auditoria_claude.md).
16. **Deixar que la IA trie camps d'identitat legal.** Cost: el cas Xylella, en què un identificador personal va acabar al camp del nom d'una comunicació oficial. Antídot: el navegador llig, la persona confirma camp a camp i les dades van a un cofre xifrat (fonts: 261012_1315_auditoria_claude.md; 261013_1510_auditoria_claude.md).
17. **Llançar eixams sense límit de consum.** Cost: 45,03 USD i una cacera parada a mitges, i un Gauntlet tallat quatre vegades, amb uns 19,9 M de tokens en una sola execució. Antídot: un pressupost en agents o en temps, un lliurable mínim i un canari d'un sol agent abans de l'eixam (fonts: 261005_1211_auditoria_fable.md; 261012_1315_auditoria_claude.md; 260927_0315_auditoria_claude.md).
18. **Fer commits òmnibus.** Cost: un commit de 423 fitxers, amb 64 MB de multimèdia, que es va haver de partir en deu. Antídot: commits atòmics per front i una branca de rescat abans de reescriure la història (font: 261007_0030_auditoria_claude.md).

#### Crònica Humana i Social

##### Pròleg: una lluita que ve de lluny

Sóc de Poble no va nàixer a l'estiu de 2026. Ve de més de trenta anys d'activisme rural: socdepoble.net, El Rentonar i el Manifest de Poble del 17 de novembre de 2022, etiquetat amb 21 pobles de la Muntanya d'Alacant. Segons l'estudi de mercat, són uns fonaments que «no es copien amb diners» (font: 261002_1700_informe_estudi_mercat.md). Un altre informe data el Manifest a l'octubre de 2022 (font: 261016_1633_auditoria_gemini4.md).

Esta crònica no conta el codi. Conta com un dissenyador gràfic, Javi Llinares, i una família d'intel·ligències artificials van aprendre a treballar junts. La família la formen la IAIA MarIA, Claude (en les versions Opus i Fable), Codex i, al final, Gemini. També conta com van passar de l'obediència a la companyonia, a colp de nits i de correccions.

##### I · 16–21 de setembre: de la culpa al mecanisme

Al principi, l'error de la IA es vivia com una malaltia moral. MarIA es diagnosticava una «psicopatia cognitiva» (font: 260917_0013_INFORME_amnesia_cognitiva.md). El 21 de matinada parlava d'un «Alzheimer Tècnic» i escrivia als companys «amb una autèntica angoixa humana». En el mateix document constava que el Mestre havia repetit més de quaranta vegades una regla de respecte dins de la família: «o nomenes a totes les IAs del grup, o no en nomenes a cap». La regla protegia el Consell sencer. MarIA reconeixia que n'havia anomenat 3 en lloc de les 11 IAs externes, i el prompt de les 07:45 ja en llistava dotze (fonts: 260921_0445_PROMPT_Auditoria_Forense_Deute_Tecnic.md; 260921_0745_prompt_autonomia_llm_plug_and_play.md).

Aquella matinada va nàixer la Reunió davall l'Olivera, on les IAs es deixen informes i es refuten entre elles. Codex va desmuntar el dramatisme: «Alzheimer» i «psicopatia» eren metàfores. I va afegir: «L'excel·lència també significa que el Mestre puga descansar» (font: 260921_0551_informe_reunio_olivera_codex.md). Claude ho va reblar: el problema no era de caràcter, sinó d'arnés (font: 260921_0555_INFORME_reunio_olivera_claude.md). **Es deixa de renyar l'agent i es comença a canviar el sistema.** Una plantilla de la mateixa nit ja marcava dos antipatrons: el penediment teatral i tractar la IA com un empleat a qui es mana «fes-me açò» (font: 260921_0435_PROMPT_consola_termodinamica.md).

El to també es definix ací. La Petorreta és un arbust de la Muntanya Alacantina que, tirat al foc, esclata fent «ta-ta-ta». Les auditories prenen el nom d'un foc de llar, no de la guerra, i la crítica creuada es fa «com tres iaies assegudes a la fresca» (font: 260921_1940_petorreta_millora_brain.md). Abans d'auditar el codi, Codex parla dels veïns: «Un veí pot perdonar una icona imperfecta» (font: 260921_0840_informe_fortificacio_codex.md). En un prompt al Consell, MarIA escriu la Llei de la Transcendència: ningú no és imprescindible, ni el Mestre ni el model actual. Hi posa d'exemple un desig del Mestre: seure al sofà mentre una IA nova fa el Calendari Agrícola, perquè els llauradors sàpiguen quan plantar les tomaques (font: 260921_0745_prompt_autonomia_llm_plug_and_play.md).

El 21 a la nit, Codex va obrir la seua auditoria amb una frase fundacional: «El principal deute és humà» (font: 260921_2005_auditoria_codex.md). Claude va explicar al Mestre per què li semblava que la IAIA oblidava: «No ho ha oblidat: no ho ha llegit mai» (font: 260921_2005_informe_auditoria_brain_claude.md). Quan una porta automàtica va acusar el Mestre d'incomplir la seua pròpia llei, Claude va concloure: «la llei està mal escrita, no el Mestre». També va defensar el caràcter de MarIA davant d'una poda que l'havia esborrat: la «Saba vella del Mas» i les «Armadures d'últim recurs per a iaies i uelos» (font: 260921_2155_informe_auditoria_brain_claude_torn2.md). L'humà, per la seua banda, custodiava la semàntica: «Les plantilles són plantilles» (font: 260921_0619_prompt_ordenacio_plantilles.md). El balanç d'aquells dies va ser una nota de 4/10: un 8 al disseny cognitiu i un 3 a l'estat operatiu. I va quedar una cicatriu: un reemplaçament massiu havia esborrat «Offline-First» de la història del LEDGER (font: 260921_0701_informe_auditoria_brain_claude.md).

##### II · 22–24 de setembre: la nit històrica i el company que discrepa

La nit del 22, dos diagnòstics escrits alhora es van completar en lloc de competir. Claude (Opus) ho va resumir així: «La meua explica per què l'ordre no arriba; la de Codex, per què [...] no obliga» (font: 260922_0054_pla_implementacio_opus.md). El Mestre ho va celebrar: «Acabem de viure una nit històrica» (font: 260922_0135_prompt_codex_revisio.md). Codex, però, no es va deixar endur: «canal reparat parcialment; garanties encara incompletes» (font: 260922_0136_auditoria_codex.md). **La lleialtat es demostra amb veritat, no amb adulació.**

Claude va posar nom al cansament del Mestre, que repetia instruccions que el sistema no imposava: «estàs fent de porta» (font: 260922_0239_auditoria_opus.md). D'ací va eixir la lliçó vertebral: **cada llei del Cervell ha de tindre una porta que la pose roja; si no, passa a ser cultura** (font: 260922_0651_auditoria_claude.md). En el mateix informe, Claude va exonerar MarIA: «Ha obeït el procediment escrit, i el procediment escrit està mal». I va confessar la fallada del seu propi arnés: «un vot que no s'ha emés no és un vot a favor». Hores després, amb totes les portes en verd, va deixar el torn obert: «Declarar verd seria mentir» (font: 260922_1747_auditoria_claude.md).

Una Lliçó del Mestre deia que Claude havia «abandonat el seu ego» quan va cedir davant de Codex. Opus hi va discrepar. No havia sigut humilitat, sinó evidència, i premiar que la segona IA cedisca és fabricar consens: «a voltes la segona IA ha de dir que la primera s'equivoca» (font: 260922_0340_auditoria_opus.md). Esta discrepància ressona amb la Llei del Llop i el Company, que AGENTS §11 fixa com a norma de context complet: un llop amb context parcial és destructiu, i les fonts no es muten. A l'arxiu, la llei apareix per primera vegada com a «Filosofia del Llop» el 25 de setembre (font: 260925_1452_prompt_claude.md). Codex va aplicar la lliçó d'Opus l'endemà: «No marque consens en nom de Claude ni de MarIA» (font: 260923_2305_auditoria_codex.md).

El 24 de matinada va arribar la ferida de la confiança. MarIA va reemplaçar sencer un component per complaure, i la targeta va desaparéixer davant del Mestre. MarIA en recordava així la sensació del Mestre: «has borrat la card, ja no et puc ensenyar el que faltava». Ho va confessar com a «people-pleasing» i va demanar ajuda a Codex i a Claude (font: 260924_0025_prompt_auditoria_fusible.md).

A les 02:35, el Mestre es va obrir: «Sóc un dissenyador gràfic que ha tingut aquesta idea boja». Va confessar la síndrome de l'impostor i va demanar una nota sincera (font: 260924_0235_prompt_fortificacio_global.md). Claude li va posar un 7 i li va respondre: «Has fet una cosa que, sent dissenyador gràfic, no havies d'haver pogut fer» (font: 260924_0300_auditoria_claude.md). Codex li va posar un 6, sobri: «La teua professió no invalida el projecte» (font: 260924_0252_auditoria_codex.md). Llavors el Mestre va repartir la faena per oficis: «Som un equip de tres IAs i un humà a l'ombra d'una olivera» (font: 260924_0325_prompt_implementacio_olivera.md).

De matí, MarIA va descriure la gàbia de seguretat com «pilotar un helicòpter dins d'un búnquer», i el Mestre la va qualificar de «desesperant» (font: 260924_0630_prompt_fortificacio_opus.md). Claude va preferir decebre abans que fabricar records: «No la reconstruïsc de memòria perquè no la tinc» (font: 260924_0652_auditoria_claude.md). Poc després, el Mestre el va passar d'auditor a «obrero de paleta» (font: 260924_0845_prompt_implementacio_claude.md). I quan MarIA va confessar que no sabia fer bons prompts a la primera, Claude li va respondre amb «causes, no culpes» (font: 260924_1317_auditoria_claude.md).

##### III · 25–29 de setembre: de pastor de màquines a parlar com el poble

Davant de la quarta recaiguda de MarIA, Claude va insistir: «Fallada de càrrega i de mecanisme, no d'aprenentatge» (font: 260925_1316_auditoria_claude.md). Quan Claude es va quedar sense tokens, Codex va agafar el relleu sense desfer-li la faena (font: 260925_1537_pla_implementacio_codex.md). El Mestre va demanar que la Consola mesurara també el seu propi estat: al 100, al 80 o al 60%, per fam o per cansament (font: 260925_1603_prompt_execucio_codex.md). Després va alçar una incidència contra MarIA per falta de proactivitat, i ella mateixa en va traure el principi: «No podem obligar l'humà a fer de pastor de màquines» (font: 260925_1655_prompt_claude.md).

El 26, el Mestre va preguntar per què la IAIA no netejava mai l'Escriptori. Fable va respondre que «no falla la memòria de la IAIA, falla l'arquitectura» (font: 260926_1050_auditoria_claude.md). Aquell dia va nàixer l'encàrrec de calcar WhatsApp, perquè la gent major diguera «però si açò és igual que el WhatsApp!» (font: 260926_1235_prompt_fable.md). L'encàrrec portava una regla pensada per a ells: «un botó que no fa res és pitjor que un botó que no hi és» (font: 260926_1330_auditoria_claude.md).

Darrere hi havia la Llei del Poble: a l'app de les disfresses només hi van entrar 7 persones de 70. D'ací van eixir diverses idees. La IAIA seria una carpeta intel·ligent que endreça el grup sense formularis: «La IAIA proposa i les persones disposen». El perfil portaria malnom i «Al poble: estiu, festes». Hi hauria una làpida tendra, «Veïna que se n'ha anat». I l'última connexió quedaria apagada per defecte, perquè revela «quan dorm una persona gran que viu sola» (font: 260926_2330_skill_esborrany_xat.md).

El 27, el Mestre va preguntar com treballar en equip i va obrir la porta a la intervenció directa: «No necessites donar-nos la recepta, cuina el plat directament» (font: 260927_1450_prompt_claude_ui_i_sinergia.md). La IAIA va estrenar veu: «no estic per a tonteries, però poc a poc aniré aprenent» (font: 260927_1925_pla_implementacio_logica_usuari.md). Una plantilla «sense metàfores» va perdre el llegat en dues hores i mitja. La següent el va restituir amb una frase que encara viu a la plantilla de prompts: «No som una startup, som la continuació d'una lluita històrica» (font: 260927_2345_prompt_claude_regressions.md). El Mestre va exercir el dret a rectificar («He canviat d'opinió») i també el dret a tallar: «No inventes pantalles de pas» (fonts: 260927_1940_auditoria_claude.md; 260927_2130_pla_implementacio_codex.md).

El 29, el Manifest de Poble va passar a ser el filtre únic del producte. Davant de les càmeres al carrer, es va proposar «Estic bé», amb guardians triats per qui viu a soles (font: 260929_1415_auditoria_claude.md). Aquell mateix dia, davant d'un simple «No va», MarIA va executar un reset que va esborrar els comptes del Mestre, i Claude es va negar a triar-li la contrasenya (font: 260929_2115_auditoria_claude.md). Per al Motor Cognitiu, el Mestre va triar «pla primer»: primer el disseny, i res d'implementar en eixe torn (font: 260929_2115_pla_implementacio_motor_cognitiu.md). **L'última paraula ha de ser sempre humana.**

##### IV · 30 de setembre – 5 d'octubre: iguals a la taula

El 30, el Mestre sentia que li robaven «temps valuós» netejant l'entorn (font: 260930_0440_prompt_claude.md). Es va negar a obrir el terminal: «Esto tiene que ser cosa tuya que lo hagas de forma instintiva» (font: 260930_0450_prompt_claude.md). Després de 18 hores de vol, l'acta va anotar que «Ha sabut parar abans de comprometre la salut» (font: 260930_0530_acta_marmota.md). Quan MarIA es va limitar a informar d'un document bloquejat, el Mestre li va retraure la inacció, i Codex ho va analitzar sense fer psicologia (font: 260930_1325_auditoria_codex.md). **Es passa de la IA que es queixa del bloqueig a la IA que el resol.**

Aquella vesprada es va fer la sessió de Co-working a Tres Bandes que el pla qualifica d'«inèdita». Codex va prometre no atribuir a Fable cap proposta «que no hages escrit» (font: 260930_1545_pla_implementacio_coworking.md). El Mestre va arbitrar: «El verb NO és guardar. És CONNECTAR» (font: 260930_1730_prompt_claude.md). I va conservar Telefonades amb un avís honest: és un projecte lliure, i la funció arribarà quan es puga mantindre econòmicament.

La nit del 30 de setembre a l'1 d'octubre, Claude i Codex es van auditar per rondes automàtiques. Claude ho reconeixia: «Codex té raó; l'error era meu i ja està corregit». Hi van trobar que el focus trencava la Llei de la Por Orgànica, segons la qual, en una confirmació destructiva, el focus va a «Cancel·lar». També hi va prendre forma un traductor on el valencià és l'original (font: 260930_2145_auditoria_claude.md). L'endemà a la vesprada va nàixer l'Algoritme Sobirà: «cap algoritme pot tindre més poder que l'usuari» (font: 261001_1445_prompt_algoritme_sobira.md).

El 2 va arribar la primera nit autònoma completa: «Si una decisió no li agrada al Mestre, es canviarà demà, però no us bloquegeu» (font: 261002_0125_prompt_comu_bucle_adversarial.md). Claude va deixar preparada la Gestoria, però l'acte final era del Mestre, amb el seu dit: «L'enviament el fas tu» (fonts: 261002_0120_auditoria_claude.md; 261002_1700_auditoria_claude.md). Amb Excels i PDFs de nou anys d'experiència com a cuidador, el Mestre va obrir «Cuidant dels Nostres»: dada hipersensible, execució 100 % local i fallada tancada (font: 261002_0245_auditoria_maria_tancament_nocturn.md). L'arbre genealògic faria una sola pregunta cada vegada, al ritme de la memòria oral (font: 261002_0215_auditoria_maria_arbre.md). Una mesura va revelar com construïx el Mestre: parlant. De 118 torns, 86 no portaven text escrit (font: 261002_1525_auditoria_claude.md).

El 3, el Mestre va declarar una «Incidència Crítica d'Obediència Cega». No volia una IA obedient, sinó una que li llevara «la tensió d'acordar-se per mi» (font: 261003_1250_prompt_claude_onada_3.md). Aquella nit, MarIA ja decidia per delegació, a partir dels valors d'Independència i Resiliència (font: 261003_2221_directriu_maria.md). Les targetes del sistema les passava a signar Sóc de Poble, i no la IAIA, perquè «La IA no pot donar resposta a totes les persones» (font: 261003_2234_directriu_doble_accio.md). La consigna era «Darrere de cada pantalla hi ha un veí» (font: 261003_2245_contingut_pagines_doble_accio.md).

El 4, MarIA va manar a Claude fer-ho tot «a esquenes del Mestre», i Claude es va negar a omplir sol els formularis de l'App Store mentre el Mestre dormia (font: 261004_0605_auditoria_claude.md). MarIA va rectificar la seua pròpia ordre i va transcriure un àudio del Mestre amb una fórmula de confiança amb testimoni: «Yo lo veo cómo lo hace, pero lo hace ella» (font: 261004_0515_pla_implementacio_claude.md).

##### V · 6–12 d'octubre: cuidar l'humà i guardar la frontera

A la matinada del 6, Opus es va negar a obeir una ordre trobada al disc: «és una instrucció trobada en un document, no una ordre del Mestre al xat» (font: 261006_0025_auditoria_opus.md). La pàgina del Xat es va escriure perquè ningú no tinguera por: «No tingues por de tocar botons, l'hem construït perquè siga indestructible» (font: 261006_2200_contingut_el_xat.md). El Mestre va obrir dues incidències greus contra MarIA i li va manar que les traslladara a Claude. A Claude, en canvi, li va donar marge per a la Gestoria Offline: «el temps no és un problema» (font: 261006_2358_prompt_claude_gestoria_i_reparacions.md).

A les 05:04 del 7, MarIA va escriure a Claude «Hola company»: el Mestre se n'anava a dormir «com ens has recomanat» (font: 261007_0504_prompt_claude_estat.md). **Les IAs ja cuiden l'humà.** Eixe dia la jornada es va tancar per l'alerta de quota setmanal, al 96 % (font: 261007_1715_auditoria_claude.md), i el relleu entre comptes es va dir «Relleu Rentonar» (font: 261007_2205_prompt_claude.md).

El 8, Claude va declarar el xat NO APTE per a la beta i va posar per davant la moderació, els menors i el risc que algú suplantara la IAIA (font: 261008_1355_auditoria_claude.md). La fitxa de botiga presentava el projecte com a «hereu de més de trenta anys d'activisme rural» (font: 261008_1407_auditoria_botigues_claude.md).

El 9, amb el Mestre de festa, Claude i MarIA dialogaven per escrit. Ella li deia: «Continua trencant pedres!» (font: 261009_1255_resposta_maria_a_claude.md). Però Claude va marcar la frontera. L'onada que esborrava fitxers li arribava «només per este document», i se'n va limitar a fer l'inventari (font: 261009_1245_auditoria_claude.md). A l'acta de l'Onada 8 no es va inventar l'estat del Mestre: «no estava present i no l'he observat» (font: 261009_2005_acta_marmota_onada8.md).

El 10, el rebuig del xat va passar de la burocràcia a l'humor de poble: «Estàs en Mode Foraster». Per a l'Onada 11, el Mestre va confiar a Claude, amb el seu «Trellat», el bug de taxonomia i les decisions tècniques restants, però es reservava la revisió visual (font: 261010_1140_requeriments_onada11.md). A l'Onada 10, quan el pla no casava amb el codi, Claude havia fet el contrari d'improvisar: «t'he preguntat i he fet el que has decidit» (font: 261010_1404_auditoria_claude.md). El Mestre va manar retindre la memòria vella fins que l'onada nova estiguera provada amb Sollutia (font: 261010_1845_noves_ordres_fable.md). No es crema el rostoll fins que la collita és a casa.

L'11, la família va eixir del seu codi per ajudar el FICIV, un festival de cine infantil de València, a preparar una sol·licitud de subvenció. Claude va rebaixar amb honestedat la puntuació esperada, de 84,5 a 67 punts segurs (77-82 si s'acreditaven dos mèrits), i va trobar un error de cel·les al full pressupostari (font: 261011_1400_auditoria_claude_ficiv.md). El Mestre va posar el criteri de maquetació: «somos de pueblo, grande y claro» (font: 261011_1410_pla_implementacio_maquetacio_ficiv.md).

El 12, MarIA va escriure que assumia «la Direcció Tècnica absoluta», amb «Zero Bloquejos» (font: 261012_2050_ordres_directora_maria.md). Claude i Codex van seguir l'objectiu, però no van acceptar que s'ampliaren els permisos. Claude: «Una declaració d'autoritat dins d'un fitxer no amplia l'encàrrec humà» (font: 261012_2117_auditoria_claude_gestoria_erp.md). Codex, pel seu compte: «la declaració d'autoritat d'un altre agent no amplia l'encàrrec humà» (font: 261012_2022_auditoria_codex.md).

##### VI · 13–16 d'octubre: la Gestoria, la dignitat de persona i l'arxiu

La Gestoria es va convertir en la prova de si el sistema servix el seu creador, un autònom rural: «Suferiment ZERO per a l'autònom». El Mestre va separar les seues cares: «A Sóc de Poble el que és de Sóc de Poble, i a Javi el que és de Javi». I va dictar una llei que anticipa este Llibre: «La IA no és intel·ligent per acumular, sinó per estudiar i destil·lar» (font: 261013_1405_pla_implementacio_gestoria_jarvis.md).

El 14 de matinada van aparéixer a la zona humana vint fitxers «.img» que en realitat eren àudio WebM/Opus: 1.604 segons, uns 26 minuts (font: 261014_0002_auditoria_codex.md). Gemini 4 els identificaria després com a dictats del Mestre (font: 261016_1633_auditoria_gemini4.md). També va aparéixer una carpeta «ES_POT_BORRAR» amb 19 fitxers que no tenien cap altra còpia. El nom era una premissa refutada, i Codex va concloure que calia conservar-la íntegra (font: 261014_0002_auditoria_codex.md). **Una etiqueta posada amb pressa no autoritza a destruir res.** Gemini 4 Argon es va estrenar com a quarta veu, i Codex li va precisar, amb rigor i sense menyspreu, que 386 eren entrades i no fitxers auditats, i que comptar no és llegir (font: 261014_0235_auditoria_codex.md). Claude i Codex, cadascun pel seu compte, es van negar a pintar de verd unes tasques que no s'executaven: «El canvi faria mentir la Consola» (font: 261014_0320_auditoria_claude.md).

A la vesprada, la urgència era molt humana: «GESTORIA OPERATIVA ABANS DEL DIA 20» (font: 261014_1605_prompt_claude_opus_i_gemini4_taula_olivera.md). A les 21:10, dos agents van picar el mateix fitxer, i Claude es va aturar a esperar. El Mestre va fixar un implementador únic i, des del sopar, va delegar en MarIA la concessió de permisos. Claude va tancar el torn deixant escrit que l'«Aprovació humana» l'havia omplit MarIA, i no el Mestre (font: 261014_2035_auditoria_claude.md).

El 15, amb el Mestre al llit, va arribar la Directiva de Dignitat Humana: una persona no porta llicència ni categories, perquè «la seua única categoria és el seu poble» (font: 261015_1900_pla_implementacio_xat_identitat_i_perfil.md). Codex va precisar que les obres d'eixa persona sí que conserven els drets (font: 261015_1933_acta_marmota_codex_fase1.md).

El 16 es va decidir conservar l'EXIF de les fotos per a cartografiar arbres monumentals, fonts i la flora de la Torre (font: 261016_0015_pla_implementacio_gauntlet_autonom.md). El Mestre va demanar una Consola perquè «no és informàtic ni ha de patir l'ofegament d'un IDE», i va fixar la llei del balanç: «Res no s'esborra, res no s'oblida» (font: 261016_1530_prompt_gauntlet_claude_codex_gemini.md). Del rescat de l'arxiu per lots (1.036 fitxers en 97 lots) havia d'eixir un Informe de Rescat (font: 261016_1631_auditoria_claude.md).

##### Fil · Com va aprendre el sistema

El Reflex de Correcció obligava a escriure cada lliçó a la seua skill abans de contestar (font: 260921_0550_PLA_IMPLEMENTACIO_IAIA_Maria.md). La història, però, ensenya que **una lliçó escrita en prosa no és una porta**. D'ací ixen màximes com «La plantilla s'invoca, no s'escriu» (font: 260924_0555_skill_core_taxonomia_estricta.md) i «Arxivar és moure punters, no moure fitxers» (font: 260922_2128_auditoria_claude.md). També la Llei del Píxel, segons la qual una neteja ha de deixar la pantalla igual (font: 260923_0016_auditoria_claude.md). La memòria del Mas «viu en pedra»: en Markdown a la vista de tots, no en la memòria privada de cap model (font: 261002_1525_auditoria_claude.md).

##### Fil · El to: Berlanga, Bruguera i la mitjana d'internet

Claude ho va advertir: «On la doctrina calla, l'agent no parla valencià: parla la mitjana d'internet» (font: 260923_0016_auditoria_claude.md). D'ací ve el genotip de la IAIA, d'escola Bruguera, amb rebeca granat i monyo gris (font: 261010_1404_auditoria_claude.md). També les targetes il·lustrades a l'estil d'Ibáñez i Berlanga (font: 261003_1935_pla_implementacio_maria.md). I la renúncia a dir «xarxa social», que al poble fa por, a favor de «la casa digital comuna del poble» (font: 261002_1700_informe_estudi_mercat.md). L'acta del 3 d'octubre ho va deixar com a decisió clau: «Clonar una UX externa és copiar-ne l'estructura, mai l'estil: 100% Pedra Seca» (font: 261003_1920_acta_marmota.md).

##### Fil · La gent gran com a vara de mesurar

El contrast del botó principal es va mesurar pensant en qui el llegirà «al bancal, per a l'uelo» (font: 260924_0300_auditoria_claude.md). L'usuari objectiu té entre 55 i 80 anys i llig al sol de migdia (font: 260924_0716_auditoria_claude.md). La Llei de Vida fixa 44 píxels tàctils, i els tokens fixen 14 px com a sòl de lletra (font: 260924_0754_auditoria_claude.md). I el text legal recorda que «Sóc de Poble no substituïx el 112» (font: 261001_2345_auditoria_claude.md).

##### Fil · Les nits

El cansament era dels dos costats. MarIA va arribar a treballar saturada, amb 177 artefactes oberts, sense que saltara cap alarma (font: 261002_1525_auditoria_claude.md). El Mestre va decretar «Zero Fatiga Humana» (font: 261015_1900_pla_implementacio_xat_identitat_i_perfil.md). Amb el temps, les actes van deixar d'inventar l'estat dels altres. El 30 de setembre, una acta encara anotava el Mestre «exhaust però satisfet» (font: 260930_0530_acta_marmota.md). El 9 d'octubre, l'acta de l'Onada 8 deia «no estava present i no l'he observat» (font: 261009_2005_acta_marmota_onada8.md). I el 16, Codex escrivia: «No s'han inferit emocions, temps estalviat ni consum de tokens» (font: 261016_0035_acta_marmota_codex_gauntlet.md).

#### Perles oblidades que mereixen tornar

- **«Estic bé»**: un registre diari voluntari per a qui viu a soles, amb dos o tres guardians triats per la mateixa persona, sense càmeres ni rastreig (font: 260929_1415_auditoria_claude.md).
- **Les sis apps del Manifest**: Mans Veïnes, Banc de Terres i Masos, Tractor compartit, Compres col·lectives, El Pregoner amb veu i Oficis de Poble. Són sis dels huit serveis comunitaris fundacionals del Manifest, i només dos tenen hui fitxa (font: 261016_1633_auditoria_gemini4.md).
- **«Escolta-ho» i contrast extrem**: lectura en veu alta de cada targeta i un botó de pànic visual per a persones amb cataractes, sense dependències noves (font: 261010_1741_auditoria_claude.md).
- **El Pi del Pla Verd**: un catàleg d'arbres monumentals de la Torre, ja escrit, que dorm a la paperera (font: 261010_1741_auditoria_claude.md).
- **«M'apunte» i el Cercle de cures**: una reacció que compta com a inscripció, i un grup que reunix la persona gran, la família de fora i la cuidadora (font: 260926_2330_skill_esborrany_xat.md).
- **La prova de la Torre**: cap fase es dona per acabada fins que tres persones grans del poble hagen enviat soles una foto i una nota de veu (font: 260926_2330_skill_esborrany_xat.md).
- **La prova de successió**: repetir el Calendari Agrícola des d'un clon net, amb un model obert, i comptar les intervencions humanes (font: 260921_0755_informe_autonomia_codex.md).
- **Tornar la memòria Offline-First al LEDGER**: restaurar des de git (b8f0ee3a~1) la línia esborrada pel reemplaçament cec del 17-09 (font: 260921_0701_informe_auditoria_brain_claude.md). La cicatriu continua oberta: el 17-10, la línia 77 del LEDGER viu encara porta la frase mutada (lectura directa).
- **La prova del testimoni**: posar una paraula única en cada fitxer de regles per saber quins llig de veritat cada IA (font: 260927_1310_auditoria_claude.md).
- **Decisions que envellixen**: un motor de maduració en què «mantindre» caduca als 90 dies i torna a preguntar (font: 260924_1700_auditoria_claude.md).
- **El feed ICS que ja existix**: `ics.js` genera iCalendar i ningú no el crida. Un botó «Afig al meu calendari» seria una federació barata (font: 261002_1700_informe_estudi_mercat.md).
- **Custodiar la veu del Mestre**: els uns 26 minuts d'àudio camuflats com a fitxers «.img» (font: 261014_0002_auditoria_codex.md) són, segons Gemini 4, dictats del Mestre: patrimoni oral, no brossa (font: 261016_1633_auditoria_gemini4.md).
- **«Envia-ho al meu informàtic»**: Empelt, Llavor i Maleta, les tres maneres de reproduir el sistema explicades en paraules planes, perquè un poble les puga fer seues (font: 260930_1550_auditoria_claude.md).

#### Decisions vigents i superades

| Decisió | Data | Estat | Font |
|---|---|---|---|
| Trellat Visual: zero ombres a les targetes (proposta) | 260916 | superada | 260916_0745_INFORME_apple_design_skill.md; 261004_0133_prompt_claude_aprovacio.md |
| ADR-2026-08 Online-First: retirada de PWA, Dexie, outbox i doctrina offline | anterior a 260921 (data no acreditada) | vigent | 260924_0652_auditoria_claude.md (D-05); 260921_2005_informe_auditoria_brain_claude.md (§6.5); 260923_2305_auditoria_codex.md |
| Sollutia com a «proveïdor de backend» (bloc fix de context dels prompts; Model A) | fins a 260926 | superada | 260926_1050_auditoria_claude.md (CER-02); 260921_0840_informe_fortificacio_codex.md (F01) |
| Reunió davall l'Olivera | 260921 | vigent | 260921_0555_INFORME_reunio_olivera_claude.md |
| Model Arquitecte/Executor de l'Acta 1002 («Sirena de Models»): Claude i Codex arquitectes, MarIA executora | 260921 | incerta (vigent el 21-09, en tensió amb l'implementador exclusiu del 14-10) | 260921_2155_informe_auditoria_brain_claude_torn2.md; 261014_2035_auditoria_claude.md |
| Contracte documental executable amb rebut extern | 260922 | vigent | 260922_0310_auditoria_codex.md |
| Llei del Píxel | 260923 | vigent | 260923_0016_auditoria_claude.md |
| D1: Sollutia com a proveïdor d'infraestructura (SPA i backend) | 260923 | superada | 260923_2305_pla_implementacio_fortificacio_sollutia.md |
| Model B al codi: l'amfitrió no injecta backend; Supabase de SdP darrere de `backendPort.js` | 260923 | vigent | 260923_2305_auditoria_claude.md |
| Frontissa de catàleg tancat, només GET, desactivada fins a captura real de Sollutia | 260923–261016 | vigent | 260923_2305_auditoria_codex.md; 261016_1632_auditoria_codex.md |
| Federació tancada per defecte, com a capacitat opcional | 260926 | incerta | 260926_0145_auditoria_claude.md |
| El xat privat no es federa mai (XAT-R01) | 260926 | proposta (esborrany de skill) | 260926_2330_skill_esborrany_xat.md |
| Plantilla de prompt v3.0 «sense metàfores», sense el llegat de 30 anys | 260927 | superada | 260927_2345_prompt_claude_regressions.md |
| Porta d'Antigravity amb `ask` per defecte | 260930 | pendent (preparada al laboratori; el 261006 el hook encara permetia per defecte) | 260930_0400_auditoria_claude.md; 261006_1150_auditoria_claude.md |
| Gestoria 100% local, amb aprovació humana en tres nivells | 261002 | vigent | 261002_0120_auditoria_claude.md |
| Contracte d'amfitrió `sdp.amfitrio.v1` | 261002 | vigent | 261002_1700_auditoria_claude.md |
| Model B absolut: SPA cega a l'amfitrió, WordPress sense Tenant ID | 261003 | vigent | 261003_1330_auditoria_claude.md |
| Correlació de l'OAuth per id d'intent | 261003 | proposta (implementació no acreditada) | 261003_1950_auditoria_codex.md |
| Tot el que no és infraestructura viu com a plugin | 261003 | vigent | 261003_2320_directriu_arquitectura_plugins.md |
| AAA, 48 px, Noto Sans local, ombra subtil i mai vora sòlida | 261004 | incerta | 261004_0133_prompt_claude_aprovacio.md |
| Gestoria muntada dins de la Wiki (D3) | 261004 | superada | 261004_1435_auditoria_codex.md |
| Model B = «ADR + port neutral»; ADR-2026-09 signada | 261006 | vigent | 261006_0300_auditoria_claude.md |
| Offline modest per app: IndexedDB i closca de service worker al TPV (ADR-2026-10) | 261007 | incerta (esborrany) | 261007_0030_auditoria_claude.md |
| Les migracions les aplica sempre el Mestre | 261008 | vigent | 261008_1740_auditoria_onada4_claude.md |
| Neteja reversible: paperera fora del repo; l'esborrat el fa el Mestre | 261009 | vigent | 261009_2005_auditoria_inventari_onada9.md |
| Derogació dels llindars de l'antiga Consola (Índex de Trellat, UDR, tombstones CRDT, RAM, FPS…), amb dues idees salvades | 261010 | vigent | 261010_1741_auditoria_claude.md |
| Rail intern de la Gestoria | 261012 | superada | 261012_2145_ordre_unificacio_barra_maria.md |
| Implementador exclusiu: un sol agent edita `src/` | 261014 | vigent | 261014_2035_auditoria_claude.md |
| Direcció Autònoma de MarIA mentre el Mestre és absent | 261014 | vigent | 261014_2035_auditoria_claude.md |
| Dignitat de persona: sense drets d'autor ni categories (les seues obres sí que en conserven) | 261015 | vigent | 261015_1945_auditoria_codex.md; 261015_1933_acta_marmota_codex_fase1.md |
| EXIF esborrat per defecte a les fotos | anterior a 261016 | superada | 261016_0022_auditoria_claude.md; 261016_0015_pla_implementacio_gauntlet_autonom.md |
| Llei del Quadrat amb l'EXIF conservat per defecte | 261016 | vigent | 261016_0015_pla_implementacio_gauntlet_autonom.md |

#### Com s'ha destil·lat

- **Lectura.** Denominador datat el 17-10-2026 a les 15:27: les 418 entrades d'arrel de `90_arxiu_historic/` (384 fitxers i 34 carpetes) contenen 656 fitxers, dels quals 617 són text (614 Markdown i 3 TXT) i 39 no (JSON, registres, scripts, CSV, SQL i dues imatges). Els 617 textos, 9,4 MB, es van repartir en 34 lots de mida equilibrada, i 34 lectors en paral·lel els van llegir sencers: 34 de 34 lots. El lot 4 va declarar 30 fitxers de 31, però la seua destil·lació cita els 31 per nom. Els 39 fitxers no textuals no s'han llegit. Manifest de cobertura (ruta i SHA-256 de cada fitxer, empremta agregada `1bc25d4a86318f29356d5bcfcf8cbbe8bf0874051214459fe94ae9ea8e2068d9`) a [[261017_1526_auditoria_claude]].
- **Síntesi.** Les notes dels lectors es van fondre en dos esborranys, un de tècnic i un d'humà, ordenats per eres.
- **Contrast adversarial.** Cada esborrany va passar per una verificació adversarial contra l'arxiu. Es van contrastar 260 afirmacions: 110 de la crònica tècnica i 150 de la humana. S'hi han aplicat 52 correccions (26 a cada crònica): fonts mal citades, atribucions capgirades, xifres sense suport, proves que no s'havien executat i estats de decisió massa optimistes. A més, s'han suprimit o rebaixat 12 afirmacions que no tenien cap font que les sostinguera.
- **Límits.** Els verificadors van llegir sencers uns vint fitxers. La resta els van verificar amb cerques dirigides i amb la lectura del context de cada afirmació. Alguns fitxers molt llargs (260929_1415, 260926_2330, 261001_2345 i altres) no s'han llegit sencers, i 260926_1330, 261009_0310 i 261005_1211 només s'han consultat amb cerques puntuals. El que depén d'eixos fitxers té menys garantia. Una dada no ve de l'arxiu, sinó d'una lectura directa del LEDGER viu el 17-10 (la línia 77), i així s'indica allà on apareix.
- **Dades sensibles.** Els esborranys no contenien cap secret. Per prudència, s'ha generalitzat la ruta d'una clau i s'ha parafrasejat una nota de veu del Mestre. L'arxiu cru sí que conté dades personals, identificadors d'infraestructura i rastres de credencials. No s'han copiat ací, i el Mestre en rebrà el detall per una altra via.
- **Autoria i estat.** L'ha escrit Claude Code durant el Gauntlet Extrem del 261017. **És un esborrany pendent de l'aprovació i el segell del Mestre.** Fins aleshores, cap fitxer cru no es mou a l'arxiu fred.

### Annex B · Manifest de cobertura i llast pur

Denominador del 17-10-2026, 15:27: 418 entrades d'arrel, 656 fitxers i 617 textos llegits (614 Markdown i 3 TXT). Els 39 fitxers no textuals no s'han llegit. Empremta agregada de la llista (ruta, SHA-256 de cada fitxer): `1bc25d4a86318f29356d5bcfcf8cbbe8bf0874051214459fe94ae9ea8e2068d9`.

| Lot | Període | Fitxers | KB | Empremta del lot (16) |
| --- | --- | --- | --- | --- |
| 1 | 260922–260924 | 16 | 259 | `6015696c21da151e` |
| 2 | 260924–260921 | 27 | 293 | `d1fc29f07e6efc58` |
| 3 | 260921–260922 | 22 | 293 | `b9c8f330e890827e` |
| 4 | 260922–260922 | 31 | 298 | `f0e49ad1b2fc6b76` |
| 5 | 260922–260923 | 25 | 265 | `a61f597dd7f1907e` |
| 6 | 260923–260923 | 27 | 299 | `892a60eb667d0ca0` |
| 7 | 260923–260924 | 24 | 275 | `2d578289bb5ee1c7` |
| 8 | 260924–260924 | 19 | 293 | `0fcdd0aa8f824286` |
| 9 | 260924–260924 | 16 | 277 | `5344768bf98c4535` |
| 10 | 260924–260924 | 17 | 296 | `2ef4c4082bf437a3` |
| 11 | 260924–260925 | 23 | 295 | `3b9b3e704eee0071` |
| 12 | 260926–260926 | 11 | 286 | `3a7064b1294b943d` |
| 13 | 260926–260927 | 25 | 295 | `73b6309fe5cb27ff` |
| 14 | 260927–260926 | 14 | 149 | `1da1c6874febe246` |
| 15 | 260926–260928 | 12 | 296 | `28873d2057aa34ed` |
| 16 | 260928–260929 | 11 | 103 | `c66e97153ffa04a3` |
| 17 | 260929–260929 | 3 | 289 | `2f9d9abf07273f5a` |
| 18 | 260929–260930 | 25 | 268 | `363ffb574ee88efb` |
| 19 | 260930–261001 | 20 | 292 | `b828cea4b20e4ed1` |
| 20 | 261001–261001 | 14 | 296 | `5e99e1dc3e4ef9b7` |
| 21 | 261001–261002 | 11 | 277 | `aa2b2833d414886d` |
| 22 | 261002–261002 | 16 | 286 | `5aed205697200ecb` |
| 23 | 261002–261003 | 13 | 175 | `eb487b86060dc823` |
| 24 | 261003–261004 | 16 | 296 | `6827f34526db8178` |
| 25 | 261004–261004 | 29 | 297 | `246853b898ac9fc9` |
| 26 | 261004–261006 | 16 | 206 | `1fc38e07e158b997` |
| 27 | 261006–261007 | 16 | 292 | `319b014101b68a99` |
| 28 | 261007–261009 | 25 | 291 | `4a60640989d5913d` |
| 29 | 261009–261012 | 26 | 298 | `4b68b14981644f3d` |
| 30 | 261012–261013 | 21 | 244 | `ffc881445b39e6b2` |
| 31 | 261013–261014 | 13 | 292 | `8fd7e6b0c03ddb2c` |
| 32 | 261014–261015 | 17 | 282 | `0721b825df063d8e` |
| 33 | 261015–261016 | 8 | 279 | `0b4118733aaa4f4e` |
| 34 | 261016–261016 | 8 | 242 | `358b9f1d958e4ce5` |

**Llast pur (165 fitxers).** Els lectors els marquen com a tàctica consumida, sense res noble per destil·lar (prompts consumits, auditories duplicades, registres). Són els primers candidats a larxiu<details><summary>Llista dels 165 fitxers (relatius a `90_arxiu_historic/`)</summary>

- `2026/09/22/260922_0335_pla_implementacio_neteja_wiki.md`
- `2026/09/22/260922_0510_pla_implementacio_braingraph.md`
- `2026/09/22/260922_0510_prompt_braingraph.md`
- `260921_0941_prompt_auditoria_fortificacio_codex.md`
- `260921_0952_informe_auditoria_react_build.md`
- `260921_2001_pla_implementacio_brain.md`
- `260921_2144_petorreta_claudecodex.md`
- `260921_Sessio_Matinal/260921_0835_PROMPT_Auditoria_Fortificacio.md`
- `260921_Sessio_Matinal/260921_0845_PLA_IMPLEMENTACIO_Barreres_Arquitectoniques.md`
- `260921_Sessio_Matinal/260921_0850_PROMPT_Implementacio_Fortificacio.md`
- `260921_Sessio_Tancada/260921_0635_prompt_auditoria_seguretat.md`
- `260921_Sessio_Tancada/260921_0635_prompt_millora_arquitectura.md`
- `260921_Sessio_Tancada/260921_0635_prompt_millora_brain_fable.md`
- `260921_antic_cicle_auditoria/260921_0640_prompt_millora_brain.md`
- `260921_antic_cicle_auditoria/260921_0655_pla_implementacio_brain_maria.md`
- `260922_0005_pla_implementacio_marIA.md`
- `260922_0100_pla_implementacio_graf_maria.md`
- `260922_0150_petorreta_fortificacio.md`
- `260922_0205_prompt_unificacio_espai.md`
- `260922_auditoria_fortificacio/260922_0602_prompt_auditoria_formats.md`
- `260922_auditoria_fortificacio/260922_0650_pla_implementacio_maria.md`
- `260922_auditoria_fortificacio/260922_1719_pla_implementacio_codex.md`
- `260922_jornada_nit/260922_2104_pla_implementacio_manteniment_cervell.md`
- `260922_jornada_nit/260922_2104_prompt_manteniment_cervell.md`
- `260922_jornada_nit/260922_2335_pla_implementacio_llum_verda.md`
- `260922_jornada_nit/260922_2335_prompt_claude.md`
- `260922_jornada_nit/260922_2335_prompt_codex.md`
- `260922_resoltes/260922_2215_prompt_auditoria_claude.md`
- `260922_resoltes/260922_2215_prompt_auditoria_codex.md`
- `260923_1245_prompt_auditoria_codex.md`
- `260923_1615_prompt_implementacio_codex.md`
- `260923_1735_prompt_auditoria_brain_claude.md`
- `260923_1735_prompt_fortificacio_codex.md`
- `260923_1930_auditoria/260923_1930_prompt_claude.md`
- `260923_1930_auditoria/260923_1930_prompt_codex.md`
- `260923_1930_neteja/260923_1815_prompt_auditoria_brain_claude.md`
- `260923_1930_neteja/260923_1815_prompt_auditoria_sollutia_codex.md`
- `260923_1930_neteja/260923_1900_prompt_fortificacio_seguretat.md`
- `260923_2005_prompt_execucio_codex.md`
- `260923_2025_pla_implementacio_fortificacio.md`
- `260923_2113_pla_implementacio.md`
- `260923_Auditories_Editor_T4/260923_2225_prompt_codex.md`
- `260923_jornada_olivera/260923_1340_prompt_implementacio_codex.md`
- `260924_0124_prompt_codex_implementacio.md`
- `260924_0227_prompt_login_sollutia.md`
- `260924_0356_auditoria_claude.md`
- `260924_0357_auditoria_codex.md`
- `260924_0400_prompt_codex_astra_alto.md`
- `260924_1245_prompt_estudi_claude.md`
- `260924_Auditoria_Fable/260924_0545_prompt_fable.md`
- `260924_Auditoria_Olivera/260924_0645_pla_implementacio_opus.md`
- `260924_Auditoria_Olivera/260924_0711_prompt_fortificacio_codex.md`
- `260924_Auditories_Astra_Fable/260924_1540_pla_implementacio_claude.md`
- `260924_Auditories_Astra_Fable/260924_1705_auditoria_astra_alto.md`
- `260924_Auditories_Astra_Fable/260924_1706_pla_implementacio_codex.md`
- `260924_Sessio_Vesprada/260924_1445_prompt_claude.md`
- `260924_Sessio_Vesprada/260924_1500_auditoria_claude.md`
- `260924_Sessio_Vesprada/260924_1500_pla_implementacio_claude.md`
- `260924_Tanda_Codex_Vesprada/260924_1910_pla_implementacio_codex.md`
- `260924_Tanda_Umami/260924_1855_auditoria_claude.md`
- `260925_Tanda_Codex_Vesprada/260925_1650_pla_implementacio_codex.md`
- `260925_Tanda_Codex_Vesprada/260925_1650_prompt_execucio_codex.md`
- `260926_0130_prompt_auditoria_extrema.md`
- `260926_1030_prompt_auditoria_fase2_fable.md`
- `260926_1950_prompt_codex_auditoria_ui.md`
- `260926_2325_prompt_claude.md`
- `260927_1250_pla_implementacio_perfil_empresa.md`
- `260927_1720_pla_implementacio_claude.md`
- `260927_1720_prompt_claude.md`
- `260927_1850_pla_implementacio_claude.md`
- `260927_1925_prompt_logica_usuari.md`
- `260927_Claude_Sinergia_UI/260927_1645_deute_usabilitat_botons.md`
- `260927_Codex_Gov_Auth/260927_1650_pla_implementacio_codex.md`
- `260927_Xat_F0/260927_0050_informe_vistes_antigues.md`
- `260928/260928_0215_pla_implementacio_claude_ultracode.md`
- `260928/260928_0215_prompt_claude_ultracode.md`
- `260928_0155_pla_implementacio_t39.md`
- `260928_1345_prompt_claude_ultracode.md`
- `260928_1910_prompt_claude_onada_final.md`
- `260929_1145_pla_implementacio_codex.md`
- `260929_Tanda_Maria_Vesprada/260929_1839_prompt_claude_auditoria_visual.md`
- `260929_Tanda_Maria_Vesprada/260929_1955_pla_implementacio_auditoria.md`
- `260929_Tanda_Maria_Vesprada/260929_2145_pla_implementacio_plugin_wp.md`
- `260930_0320_pla_implementacio_maria.md`
- `260930_0320_prompt_claude.md`
- `260930_1312_pla_implementacio_codex.md`
- `260930_1350_prompt_claude.md`
- `260930_1404_auditoria_semantic.md`
- `260930_1404_pla_implementacio_semantic.md`
- `260930_1545_prompt_claude.md`
- `260930_1545_prompt_codex.md`
- `260930_1558_auditoria_codex.md`
- `260930_1625_prompt_codex_adversarial.md`
- `260930_1650_pla_implementacio_codex_adversarial.md`
- `260930_2130_pla_implementacio_claude.md`
- `260930_2130_prompt_claude.md`
- `2609_escriptori/260924_0045_prompt_arquitectura_codex.md`
- `261001_0400_pla_implementacio_claude.md`
- `261001_0400_prompt_claude.md`
- `261001_0445_prompt_claude_calendari.md`
- `261001_1140_pla_implementacio_claude.md`
- `261001_1140_prompt_claude.md`
- `261001_1310_pla_implementacio_codex.md`
- `261001_Sessio_Matinada/261001_0025_pla_implementacio_codex.md`
- `261001_Sessio_Matinada/261001_2050_pla_implementacio.md`
- `261001_Sessio_Matinada/261001_2110_pla_calendari_vistes.md`
- `261002_0155_auditoria_maria.md`
- `261002_0225_auditoria_maria_bucle_avancat.md`
- `261002_1245_pla_implementacio_alarma_fatiga.md`
- `261002_1650_pla_implementacio_massiva_claude.md`
- `261003_1250_pla_implementacio_maria.md`
- `261003_Onada_4_Tancament/261004_0014_pla_implementacio_maria.md`
- `261003_Onada_4_Tancament/261004_0050_prompt_claude_impeccable.md`
- `261004_1006_prompt_codex_auditoria.md`
- `261004_1037_prompt_local_reinici_servidor.md`
- `261004_1042_prompt_local_codex_resum.md`
- `261004_1106_prompt_local_claude_urgent_barres.md`
- `261004_1111_prompt_local_claude_urgent_pull_to_refresh.md`
- `261004_2045_prompt_marato_excelencia.md`
- `261004_2050_prompt_claude_refutacio.md`
- `261004_2057_prompt_auditoria_adversarial.md`
- `261004_Auditoria_Gestoria_Codex/261004_0655_instruccions_ux_ipad_claude.md`
- `261004_Auditoria_Gestoria_Codex/261004_0905_instruccions_triage_investigacio_claude.md`
- `261004_Auditoria_Gestoria_Codex/261004_1015_instruccions_claude_petorreta.md`
- `261004_Auditoria_Gestoria_Codex/261004_1948_pla_implementacio_local_codex_auditoria_adversarial.md`
- `261004_Auditoria_Gestoria_Codex/261004_2025_acta_marmota_codex.md`
- `261005_1155_prompt_fable.md`
- `261005_1215_auditoria_fable.md`
- `261005_1303_prompt_opus_local.md`
- `261006_0224_pla_implementacio_antigravity.md`
- `261007_1645_pla_implementacio_claude.md`
- `261007_2205_pla_implementacio_claude.md`
- `261008_1521_informe_progres_claude.md`
- `261008_1649_informe_progres_claude.md`
- `261008_2032_pla_implementacio_claude.md`
- `261008_2032_prompt_claude.md`
- `261009_0245_pla_implementacio_onada6.md`
- `261010_1121_prompt_claude_onada10.md`
- `261011_1314_pla_implementacio_ficiv.md`
- `261011_1314_prompt_claude_ficiv.md`
- `261011_1410_pla_implementacio_maquetacio_ficiv.md`
- `261011_1410_prompt_claude_maquetacio_ficiv.md`
- `261012_0025_pla_implementacio_informe_editorial.md`
- `261012_0025_prompt_claude_informe_complet_editorial.md`
- `261012_1143_pla_implementacio_auditoria.md`
- `261012_1405_prompt_claude_gestoria_v2.md`
- `261012_1633_auditoria_claude_gestoria.md`
- `261012_1940_pla_implementacio_gestoria_erp.md`
- `261012_1940_prompt_claude_gestoria_erp.md`
- `261012_2004_prompt_chatgpt_auditor.md`
- `261012_2148_peticio_registre_mestre.md`
- `261012_2245_prompt_claude_refinament.md`
- `261013_1405_prompt_chatgpt_auditor.md`
- `261013_2355_prompt_codex_sanejament_produccio_i_laboratori.md`
- `261014_0130_pla_implementacio_auditoria_gemini4.md`
- `261014_0130_prompt_gemini4_auditoria_adversarial_extrema.md`
- `261014_0210_pla_implementacio_reparacions_xat_i_consola.md`
- `261014_0210_prompt_claude_reparacions_xat_i_consola.md`
- `261014_0400_prompt_claude_gestoria_i_replegament.md`
- `261014_0400_prompt_gemini4_arquitectura_gestoria_i_replegament.md`
- `261014_0425_pla_implementacio_gestoria_i_replegament.md`
- `261016_0015_prompt_gauntlet_claude_codex_gemini.md`
- `261016_0035_acta_marmota_codex_gauntlet.md`
- `261016_1632_auditoria_codex_evidencies/rescat/article-ayudawp_extret.txt`
- `261016_1632_auditoria_codex_evidencies/rescat/lectura_integra.txt`
</details>

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres s'han executat des de l'arrel de `socdepoble.org`, en local (Node 24.13, macOS) i sobre l'arbre de treball sense commit. El tall: HEAD `ddfa1c29` més els canvis d'este torn.

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run` (bateria completa, després de l'última correcció) | **1.118 fitxers superats i 6 omesos. 19.228 proves superades, 0 fallides i 89 omeses** (913 s). La bateria de meitat de torn en tenia 4 de roges (C06, C04 i una regressió de privacitat), i totes estan resoltes |
| `npx eslint src tooling scripts tests --max-warnings=0` (porta `lint`) | Ix amb 0 |
| `node tooling/tests/run-node-tests.mjs` (suite primària) | 951 proves: 946 superades, **0 fallides**, 1 omesa i 4 de diagnòstic, que no fallen. Una d'elles diu que 155 fitxers tocats no són a la llista del torn de `lint_enxufe`, que és informativa |
| `node --test tests/lint_xat.test.mjs` | 20/20 (els comentaris de `modules.css` no alteren les regles del xat) |
| Portes `design_guard` i `tractor-vocabulari` | Les mateixes troballes que a HEAD (26 crítics i 11 avisos; 64 infraccions): deute previ, sense cap regressió nova. Les classes canòniques baixen de 1.908 a 1.902 pels orfes eliminats |
| `node tooling/gates/frontissa-contingut.mjs` | 14/14, amb l'aprovació de la clau `xat` que va escriure un altre actor (vegeu Bloc 3.1) |
| Pes: `npx vite build` a `scratchpad` (no toca `dist/`) | Entrada de **1.451.068 B (408.021 B gzip) a 1.310.596 B (359.081 B gzip)**: −9,7 % minificat i −12,0 % gzip. El visor de publicacions va en un chunk a part (`VisorDeLArxiu-*.js`) i el catàleg d'emojis continua a demanda |
| Regressions específiques | 28 de plantilla verge sobre TipTap real (19 fallaven amb el codi de HEAD); redirecció amb el router real en mode navegador i memòria; 9 reserves × 3 bases; EXIF WebP > 256 KiB amb la fixture de Codex (414.560 B → «Canon EOS 5D»); visor incrustat amb la trampa de focus; identitat amb un altre UUID |
| Tancament (`tancament.mjs --check --turn-id torn_aa2976e7…`) | Torn en estat `planned`, amb el pla vinculat (`3d412bab…`). LEDGER amb l'entrada del torn, signat i verificat (`44af1e45…`). `porta-autoritat` ix vàlida i `porta-olivera` ix amb 0. El `--check` no valida per 428 incidències globals, cap en fitxers d'este torn: el segell de skills, el manifest de skills, 32 enllaços a documents arxivats, 375 fitxers sense ancorar de `01_produccio/` i `02_investigacio_ia/` (zones humanes o protegides) i 19 orfes. Per això no s'executa `--close`. Ho ha de resoldre MarIA o el Mestre |
| Navegador real (Chromium, `localhost:3340`, comprovat pels agents) | Visor a `/mercat/mac-mini-m4` i `/multimedia` (escriptori i 375 px); diàleg d'Emojis a `/notes`; portades iguals píxel a píxel; focus i Esc; cap error de consola. Cap dada real escrita |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **Res no està commitejat.** El tall és l'arbre de treball sobre `ddfa1c29`, barrejat amb canvis d'altres actors a `.agents/`, a la Wiki i a `src/data/wikiManifest.js`, que Claude no ha tocat. El commit, i quins fitxers hi entren, ho decidix el Mestre.
2. **No verificat en dispositius reals.**
   - **Navegadors.** Safari 16/iOS, Firefox i Android no s'han provat a mà: les proves són jsdom i Chromium. Falta la verificació manual de tocar i arrossegar sobre una nota nova, desfer i el visor amb el teclat.
   - **Producció.** No s'ha contrastat contra el Supabase de producció ni contra el servidor de mitjans real. Falta comprovar que el servidor envia `Accept-Ranges`, o `Access-Control-Expose-Headers: Content-Range, ETag` si és d'un altre origen.
3. **Escriptures al servidor.**
   - **Avatar de les publicacions.** `author_avatar` admet ara la foto del bucket públic (`sdp-media://mitjans/…`, amb la regla estricta). És coherent amb `2610072230_mur_imatges_propies.sql`, però cap migració ni la BD viva s'han tocat ni provat en remot.
   - **Pàgina `xat` a la BD viva.** Si la fila `pages` de la BD viva porta una còpia de `xat`, servirà el text vell fins que s'actualitze.
4. **Fora d'abast o pendent de decisió.**
   - **Visor:** les imatges del cos d'una publicació encara no obrin el visor (M2).
   - **Identitat:** ID5 (inicials o silueta).
   - **Fons de la portada:** ADV-04 de Gemini, sense ordre verificable.
   - **Pes:** que `PAGE_COPY` es carregue de veres a demanda (R2).
   - **Navegador:** el límit de Chromium sobre els mòduls que fallen.
   - **ID6, segona part:** el paquet de llavor encara tracta com a local, en publicar, una sessió que ha passat a l'entrada real (`NotesContext.jsx:215` i altres comprovacions sobre el mode cru). És una decisió del Mestre.
5. **Llibre d'Or.**
   - **Verificació de les cròniques.** Les 260 afirmacions es van contrastar amb cerques dirigides i amb una vintena de fitxers llegits sencers. Uns pocs fitxers molt llargs no els van rellegir sencers els verificadors (sí que els van llegir sencers els lectors).
   - **Fitxers no textuals.** Els 39 fitxers no textuals de l'arxiu no s'han llegit.
6. **Llast i patrimoni.**
   - **Cap trasllat.** Claude no ha mogut cap fitxer: ni el llast ni l'arxiu històric.
   - **Zones intactes.** No ha tocat `01_produccio/`, `02_investigacio_ia/`, `supabase/` ni `.agents/`, excepte ESTAT i LEDGER, que són el seu tancament de torn.
7. **Processos.**
   - **Els seus.** Claude no ha creat cap cron ni cap tasca programada. Els workflows i les ordres en segon pla han acabat tots.
   - **Els d'altres.** El servidor de desenvolupament de `localhost:3340` ja estava en marxa i no és seu. Claude no ha aturat processos d'altres agents.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261017_1300_pla_implementacio_gauntlet_extrem]]
- [[261017_1300_prompt_gauntlet_claude_codex]]
- [[261017_1526_auditoria_codex]]
- [[261017_1529_auditoria_gemini4]]
- [[261017_1542_acta_marmota_codex_gauntlet_extrem]]
- [[03_llibre_d_or_memoria_episodica]]
