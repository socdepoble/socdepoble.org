---
type: informe
status: esborrany
description: 'Informe de Claude de l’Onada 10: targetes canòniques, pàgines amb sis paràgrafs, Foraster al xat, perfil de la IAIA, proves executades, pendents i preguntes per a l’Onada 11.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d86bbdf5-f924-4677-9925-402e90bd497f:a418dde3-0c70-4a37-bc0c-1760c9018dad
---
# Auditoria Claude Onada 10

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d86bbdf5-f924-4677-9925-402e90bd497f:a418dde3-0c70-4a37-bc0c-1760c9018dad |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-10T12:03:16.608Z |
| Modificació | 2026-10-10T13:40:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, mode ultracode amb workflows de subagents) |
| Tokens consumits | fil principal no mesurat; subagents, uns 9,7 milions en quatre workflows (2,8 de mapa, 1,9 d'implementació, 4,3 de la IAIA i la revisió, 0,7 de Pedra Seca) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-10T12:03:16.608Z: esborrany creat; contingut i verificació pendents.
2026-10-10T13:20:00.000Z: informe redactat per Claude en acabar la implementació, la revisió adversarial i la comprovació al navegador de l'Onada 10 (torn torn_d86bbdf5).
2026-10-10T13:40:00.000Z: afegit el resultat de la passada final de Pedra Seca: cap incompliment, cap canvi de codi.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Resum

L'Onada 10 està **implementada i en verd**: la suite sencera de `src` passa amb **15.746 proves i cap fallada**, i les portes de node que el hook em deixa executar també. Queda pendent de tu **aprovar tres empremtes** de la frontissa de contingut (sense això el pre-commit para) i **setze decisions** que no em toquen a mi (apartat 5).

El pla `261010_1121` **no casava amb el codi en sis punts**. No he improvisat: t'he preguntat i he fet el que has decidit (apartat 2). Tot el que he comprovat ix del codi, de les proves i del navegador; el que no he pogut comprovar està dit a «Límits».

### 2. El que el pla donava per fet i el codi no

| El pla deia | El codi diu | Què s'ha fet |
| --- | --- | --- |
| Les targetes ixen de `ControlPage.jsx` i `wikiManifest.js` | Ixen de `src/config/systemPages.js`, `src/sections/plugins/registrePlugins.js` i `src/sections/control/ControlSection.jsx` | S'ha treballat sobre els fitxers de veres |
| Rebost i Salut porten un botó gran a la targeta | La targeta del Panell no n'ha portat mai; el botó viu a `/plugin/<id>` | La targeta guanya data i etiquetes; cap botó |
| Rebost i Salut són al Mur | Només ixen al Panell, a «La llar» | **Decisió teua (M3)**: es queden al Panell |
| El botó va «davall de l'entradeta» i «dins de la decoració» | La skill diu que la decoració és el bloc blanc de l'H1, on l'entradeta no entra | **Decisió teua (M2)**: dalt i al final |
| El text d'error diu «no ets del poble» i falten eu i gl | Eixe text no existix; les dos claus ja tenien cinc llengües | **Decisió teua (M1)**: «Foraster» als dos errors |
| La IAIA MarIA «no existix a l'arquitectura» i el seu avatar és `nano_porta_del_mas.png` | Ja és un agent amb perfil públic a `/perfil/iaia-maria`; eixa imatge és la foto d'un home arreglant una porta | **Decisions teues (I1 a I4)**: cap entrada nova, text al perfil que ja té |

### 3. Què s'ha fet

#### 3.1 Panell de Control

- **Fora les tres targetes.** «Consola Termodinàmica», «El Cervell» i «Disseny Pedra Seca» ja no ixen al Panell. «Maquinària i Sistema» conserva la secció, l'h2, el lead literal i les targetes **Lector RSS** i **TPV del Bar**.
- **Sis targetes de plugin canòniques (M4).** Gestoria, Rebost Domèstic, Salut, Lector RSS, TPV del Bar i Snippet porten ara la **pastilla de data** a la franja taronja i dos etiquetes, **Categoria** i **Etiqueta**. Cap botó gran. Les huit targetes de dalt no han canviat.
- **Cap dada copiada al Panell.** La data i les etiquetes ixen del registre de plugins; les del Snippet, de `destiSnippet.js` i de la seua constant.

#### 3.2 Targetes de sistema del Mur

- La **Consola** i el **Cervell** perden el botó gran i pinten «Sistema» + «Manteniment» i «Sistema» + «Graf». **Disseny** guanya una tercera etiqueta, «Pedra Seca».
- **El Xat conserva «Anar al xat»** a la seua targeta (la teua ordre del 261007 no s'ha derogat).
- El canvi arriba igual al **Calendari** i a les **targetes incrustades**, perquè totes pinten la mateixa peça.
- Com s'ha fet: `systemPages.js` separa l'acció de la **pàgina** (`accioDeLaPagina`, sense canvis) de la de la **targeta** (`accioDeLaTargeta`, nova: hui només El Xat) i diu quina pàgina repetix el botó al final (`accioAlFinal`: Consola i Cervell).

#### 3.3 Les quatre pàgines

`/page/consola`, `/page/cervell`, `/plugin/rebost` i `/plugin/salut` porten **sis paràgrafs nous** i el botó «Obrir…» **dalt** (dins del bloc blanc de l'H1) **i al final** del text, com les pàgines de Publicar.

- Els textos de la Consola i del Cervell són a `PAGE_COPY` (`src/sections/text/pageContent.js`); els del Rebost i de Salut, a un fitxer nou, `src/sections/plugins/presentacioPlugins.js`, que només viatja amb la pàgina.
- **Cada frase està contrastada amb el codi.** La revisió va trobar dos frases de la Consola que deien més del que el codi fa, i s'han corregit (apartat 4).
- Les pàgines de plugin diuen ara **la mateixa data i les mateixes etiquetes que la seua targeta**. Això canvia també la capçalera de `/plugin/gestoria`, `/plugin/rss` i `/plugin/tpv`.
- `/page/xat` queda igual: un sol botó, dalt.

#### 3.4 Xat: «Foraster» (M1)

| Clau | Text nou en valencià |
| --- | --- |
| `section.xat.error.noMembre` (SDP-XAT-003, parla de tu) | «Estàs en Mode Foraster: el xat és per a la gent d’este poble. Prova d’eixir i tornar a entrar.» |
| `section.xat.error.noDelPoble` (SDP-XAT-004, parla de l'altra persona) | «Esta persona és forastera en este poble.» |

- Les **cinc llengües** estan posades i fixades per prova. L'euskera i el gallec continuen sent proposta per a un parlant.
- **El text que segurament vas vore** era un tercer: el mode llavor llançava «Esta persona no és del poble.» sense traduir. Ara ix amb el mateix codi que el servidor i passa pel diccionari.
- Queda escrit al codi, com a **risc acceptat**, que SDP-XAT-004 també salta per una baixa demanada, un id inexistent o una entitat no visible, i dirà igualment «forastera».

#### 3.5 IAIA MarIA (I1 a I4)

- **Botó a `/iaia`.** «Anar al xat» dins del bloc blanc de l'H1, amb la mateixa peça i la mateixa clau de text que `/page/xat`. En llavor i en local porta a la conversa «IAIA MarIA»; ho he vist al navegador.
- **Autoria de `/iaia`:** sense tocar, «Sóc de Poble».
- **Text del perfil.** «Qui és la IAIA MarIA?», un títol i quatre paràgrafs amb la seua veu, és ara el cos de `/perfil/iaia-maria`. Diu clar que al Xat està en proves, com l'avís que ja porta el perfil.
- **Cercador.** No s'ha redissenyat res. Hi ha proves noves que fixen que la IAIA i Sóc de Poble es troben amb la seua fitxa i que cap dels tres usuaris fundacionals té targeta al Mur.
- **Cap entrada nova** a `SYSTEM_PAGES` ni a `registrePlugins.js`.
- **El nom de l'avatar.** No he pogut reproduir l'avatar amb el nom «L'ànima de la iaia». On la identitat pintada és la IAIA (llista del Xat, perfil, Cercador), el nom és «IAIA MarIA».

#### 3.6 Perfil propi (conseqüència de 3.1)

«Consola de Mètriques» i «Cervell (Node Graph)» ja no pinten el botó «Mostrar o Ocultar del Panell de Control»: no són al Panell i el botó no hauria fet res. Les preferències que ja hi haguera desades es queden al dispositiu, sense efecte.

#### 3.7 Pegats tàctics que has autoritzat

- **`eslint.config.js`.** Reposat el perdó de `React` a la regla `no-unused-vars`. El fitxer s'havia reescrit hui a les 11:36 i una cinquantena de proves donaven avís. Ara el lint de la sessió ix net.
- **`CalendariMur.test.jsx`.** La vaig convertir en una làpida que passava, perquè les eines d'esta sessió no poden esborrar fitxers; després l'has retirada tu amb `git rm`.

### 4. Revisió adversarial

Set revisors amb lents diferents (conformitat de cada front, fets dels textos, proves, Llei del Píxel al navegador i el front de la IAIA), un escèptic per cada troballa alta o mitjana, i una passada final de Pedra Seca.

| Troballa | Veredicte | Què s'ha fet |
| --- | --- | --- |
| Consola, paràgraf 3: «cada vegada que una IA llig… en queda un rebut». Hui cap eina escriu rebuts; l'últim és del 19/09 | Confirmada | Text corregit: diu què és un rebut i que el tauler marca si fa més d'una setmana que no n'arriba cap. Prova que ho fixa |
| Consola, paràgraf 5: «no executa res» i fonts «dins del projecte». El compilador del Mapa executa git i llig les tasques programades del Mac | Confirmada | Text corregit: «no executa cap reparació» i les fonts de veres. Prova que ho fixa |
| `/iaia`: en remot i sense sessió, «Anar al xat» porta a l'entrada, no a la conversa | Confirmada | **Decisió teua** (D2). Queda una prova marcada `[DEFECTE]` que ho reproduïx |
| Perfil de la IAIA: «responc poc, amb frases senzilles» promet massa | Refutada | És un matís de redacció, no un fet fals |
| En remot el perfil de la IAIA no existix | Refutada com a defecte | És una regla anterior i escrita; va a decisions (D12) |

La resta de troballes eren de gravetat baixa. Se n'han aplicat quatre de segures (la data del catàleg de Disseny i tres proves que faltaven: el filtre de categoria del Mur, el lead literal de «Maquinària i Sistema» i que cap plugin és una pàgina del sistema). Les altres són les decisions de l'apartat 5.

### 5. Decisions que t'esperen

#### D1 · Frontissa de contingut (bloqueja el commit)

Han canviat les empremtes de `consola`, `cervell` i `disseny`. Convé aprovar-les una sola vegada, ara que el text ja està corregit:

```bash
node tooling/gates/frontissa-contingut.mjs --aprova consola --per "Javi"
node tooling/gates/frontissa-contingut.mjs --aprova cervell --per "Javi"
node tooling/gates/frontissa-contingut.mjs --aprova disseny --per "Javi"
```

#### D2 · `/iaia`, foraster sense sessió en remot

Hui el botó «Anar al xat» el porta a l'entrada i, després d'entrar, aterra al seu perfil, no al xat. **Recomane** portar-lo a la conversa de mostra de la IAIA (`/xat/fake-iaia`), que és la que eixa persona veu a la llista. És un canvi de cinc línies ja descrit a la prova `[DEFECTE]` de `src/app/App.iaia.test.jsx`.

#### D3 · Valors d'esborrany: etiquetes i dates

| Peça | Categoria | Etiqueta | Data |
| --- | --- | --- | --- |
| Consola Termodinàmica | Sistema | Manteniment | la que ja tenia |
| El Cervell | Sistema | Graf | la que ja tenia |
| Disseny Pedra Seca | (conserva «MUR» i «Disseny UI») | Pedra Seca | la que ja tenia |
| Gestoria | Eina | Factures | 04/10/26 00:15 |
| Rebost Domèstic | Eina | Compra | 04/10/26 00:15 |
| Salut | Eina | Cures | 04/10/26 00:15 |
| Lector RSS | Eina | Notícies | 04/10/26 00:15 |
| TPV del Bar | Eina | Hostaleria | 04/10/26 00:15 |
| Snippet | Eina | Extensió | 03/10/26, sense hora |

- **La data dels cinc plugins** és l'hora del document de la teua ordre (prompt 261004_0015), el mateix criteri de les targetes de dalt. Alternativa documentada: 05:13:54 del mateix dia, el commit de l'Onada 4.
- **El Snippet** només té documentat el dia; l'hora no s'inventa.
- **«Sistema» es veu de dos maneres al Mur**: en blau ple a sis targetes i en píndola suau a la Consola i al Cervell, perquè ací és Categoria i allà és carpeta.

#### D4 · `/iaia` amb un botó o amb dos

Està fet amb un sol botó, dalt. «Mateix patró que Obrir…» també es pot llegir com a dalt i al final, i l'article és llarg. Si el vols repetit al final, és un canvi menut.

#### D5 · La fitxa del Snippet

La targeta porta dos etiquetes i la fitxa (`/control?fitxa=snippet`) només la data. Si han de dir el mateix, les etiquetes passen a `destiSnippet.js`.

#### D6 · Textos teus que queden en tensió

- L'entradeta de «L’empresa» diu «El Panell no en mostra cap xifra» i la de «La llar», «cap dada»; les targetes ja porten una data.
- El lead de «Maquinària i Sistema» parla de «configuració de disseny», que ja no té cap targeta al Panell.

#### D7 · La bio curta antiga de la IAIA

Continua eixint com a extracte al Cercador i al directori: «Gestora suprema… "Cocinera de Rebost". Capaç de tot.» Contradiu el text nou i porta un castellanisme. Cal una frase teua.

#### D8 · «Javi Llinares» al Cercador

Buscant «javi» es troba; pel nom complet, no: la llavor diu «Javi» i una porta teua prohibix el cognom a la llavor. La prova nova ho deixa marcat com a `[DEFECTE]` fins que tries.

#### D9 · El botó «Obrir la Consola» a la web publicada (P7-A)

Continua obert: fora de desenvolupament porta a Entrar i després a «Accés restringit». El paràgraf 6 de les dos pàgines ho diu tal com és hui. M'has dit que ara la Consola es pot vore en local sense sessió: en local ja era així; **a la web publicada continua demanant el rol**. Si això canvia, cal reescriure eixe paràgraf.

#### D10 · Textos del Rebost i de Salut

- Parlen en present d'eines que a la web publicada encara no s'obrin; l'últim paràgraf diu «en proves».
- El de **Salut** toca dades de salut i l'has de revisar tu i, si pot ser, algú de salut. Un matís: diu «no posa nom a res» i una alerta de l'app diu «El restrenyiment…».

#### D11 · Llengües

Propostes no aplicades, per a un parlant: en anglés, «Outsider Mode» amb majúscula i «logging out» per a casar amb el botó «Log out»; en euskera, «arrotz» (que ja porta el diccionari) contra «kanpotar»; en gallec, «vila» contra «pobo».

#### D12 · El perfil de la IAIA en remot

En remot el seu perfil no ix del paquet: `/perfil/iaia-maria` dona «Perfil no trobat» i el text nou només es veu en llavor i en local. És una regla anterior i escrita. Si la vols també en remot, cal una decisió teua i tocar l'adaptador.

#### D13 · Mode llavor i «forastera»

En llavor, «Esta persona és forastera en este poble.» ix per a tots els veïns de mostra que no són al padró del xat, per exemple des d'«Escriu-li al xat» del seu perfil.

#### D14 · Targetes d'usuari al Cercador

Hui el resultat d'una persona és una fila amb avatar, nom, extracte i «Escriu-li», no una Targeta Universal. Convertir-ho és redissenyar el Cercador i necessita la teua ordre i un espècimen a Disseny.

#### D15 · La mateixa frase del rebut, dins de l'app

«Cada vegada que un agent llig senceres les fonts…» continua a la Consola mateixa (`src/sections/consola/polsConsola.js:31`), fora d'esta Onada.

#### D16 · La il·lustració del Cervell

La vinyeta porta rètols amb noms de personatges publicats d'una editorial. Convé regenerar-la amb la regla de zero text.

### 6. Fora d'abast, anotat

- **SDP-XAT-003 sense traduir** en tres superfícies que pinten el missatge cru: l'avís de la llista de converses, «Nova conversa» i la cerca. També `useAplicaAbast.js` amb SDP-XAT-004.
- **Els tres «Mode Foraster actiu»** continuen sent literals sense traduir.
- **`design_guard`** ix roig amb 9 infraccions noves en fitxers que l'Onada no ha tocat.
- **L'arbre venia amb canvis d'altres**: `src/apps/plataforma/guardesDelModul.js` modificat i huit esborrats dins de `src/` (tres logotips SVG, `config/app.js`, `notes/notesContent.js` i `mur/CalendariMur.jsx`, entre altres). No els he revisat.
- **Els extractes del Cercador** deixen un espai davant del punt quan el text porta negretes. La causa és anterior.

### 7. IAIA MarIA: consistència visual

#### 7.1 On som

Hui hi ha almenys **tres iaies diferents** al projecte:

- l'avatar en ús (`iaia_maria_avatar.jpg`): monyo gris, ulleres redones, davantal blau i blanc, tauleta;
- la portada de «L'Ànima de la IAIA»: rebeca lila i tauleta;
- la descripció del full d'estils: «la iaia del mocador roig amb el mòbil a la mà».

Cap de les tres casa amb la que em descrius: roba negra i granat, mòbil, monyo gris i nas gros. **Cal generar i aprovar una imatge canònica nova**; fins llavors no canvie l'avatar.

#### 7.2 Estratègia

1. **Un full de model, aprovat per tu.** Una sola làmina amb la IAIA de cara, de tres quarts i de perfil, i tres expressions. És la referència única.
2. **Sempre amb imatge de referència.** Cada generació rep el full de model com a imatge i el Genotip com a text. Mai es genera només amb text.
3. **Tres blocs, un sol variable.** Genotip (fix), estil (fix) i escena (l'únic que canvia).
4. **Una llista de «mai».** El que no pot canviar va escrit al mateix prompt.
5. **Versió i registre.** El Genotip porta versió; cada imatge acceptada s'apunta amb versió, model i data a `media_registry.json`, i el nom del fitxer porta la versió.
6. **Llista d'acceptació abans de publicar** (7.4). Si falla un punt, es torna a generar; no es retoca a mà.
7. **Una sola font.** El Genotip viu a la skill `core-identitat-visual`; qualsevol canvi és ordre teua i puja la versió.
8. **Substitució ordenada.** Quan hi haja canònica: avatar, portada de l'Ànima i comentari del full d'estils, en este ordre.

Dos avisos d'ofici:

- **«Línia clara» i Bruguera no són el mateix traç.** El prompt demana el caràcter de l'escola Bruguera amb la disciplina de la línia clara: contorn net i colors plans.
- **Millor descriure l'estil que anomenar un autor.** Dona resultats més estables i evita que el model copie personatges publicats, que és el que ha passat a la vinyeta del Cervell (D16).

#### 7.3 Prompt Genotip Mestre

```text
IAIA MarIA — CHARACTER GENOTYPE v1.0 (immutable block: paste verbatim, change nothing)

WHO: IAIA MarIA, a joyful Valencian village grandmother in her late seventies, the digital matriarch of a dry-stone farmhouse. Always the same woman, instantly recognisable.

HEAD AND FACE: large round head on a short neck. Big, round, bulbous nose with a soft highlight: her signature feature and clearly the largest element of the face. Small, lively, dark-brown eyes set close together, with laughter lines at the corners. Thin, short, arched grey eyebrows. Round rosy cheeks. Wide, warm smile, closed or slightly open with a neat row of teeth: friendly, never grotesque, never gap-toothed. Soft wrinkles on the forehead and beside the mouth. Small ears with tiny round gold earrings.

EYEWEAR: none.

HAIR: silver-grey hair combed straight back, flat on the skull, gathered in one tight round bun high on the back of the head, held by a single dark hairpin. Clear forehead: no fringe, no loose strands, no headscarf, no hat.

BODY: short and stout, about three and a half heads tall, rounded shoulders, slightly bent forward but full of energy. Small plump hands with short fingers.

CLOTHES (fixed, never recoloured): plain black long-sleeved dress to mid-calf, no pattern. Over it, a deep garnet-maroon knitted cardigan, open at the front, with three round black buttons and ribbed cuffs. Black opaque stockings. Flat black slippers with a single strap. No apron. No jewellery other than the earrings.

PROP (always present): a modern smartphone held upright in her right hand at chest height, thumb on the screen, used with total confidence. Plain dark-grey phone with a softly glowing pale screen: no logo, no readable text, no icons.

EXPRESSION AND ATTITUDE: delighted, sharp-witted and kind; the look of someone who got the joke before everyone else.

DRAWING STYLE (fixed): hand-inked Spanish humour comic in the tradition of the classic Bruguera school, drawn with clear-line discipline. Confident black ink outlines of even weight, closed shapes, rubbery caricature proportions, expressive hands, a few small motion lines. Flat opaque gouache-like colours with at most one flat shadow tone per colour. No gradients, no airbrush, no textures, no halftone noise. Not 3D, not photorealistic, not manga, not corporate vector art.

PALETTE: black #1A1A1A, garnet #6E1F2E, silver grey #B9BCC0, warm skin #F2C6A0, rosy cheeks #E58E7A, phone grey #3A3D42, screen glow #DFF3F0. Scene colours stay earthy: ochre, olive green, terracotta, dry-stone grey.

NEVER: change her hairstyle, clothes or colours; add glasses, a tablet, an apron, a headscarf or a walking stick; show missing, crooked or exaggerated teeth; add any text, lettering, signs, logos or watermarks; include any existing published comic character, name or brand; draw extra fingers or a second phone.
```

Bloc d'escena, l'únic que canvia:

```text
[CHARACTER GENOTYPE v1.0, verbatim, plus the approved model sheet as reference image]

SCENE: {{what she is doing, where and with whom}}. She stays in the exact centre of the frame and the action must survive a square crop. Background in the same comic style, full of small rural gags: dry-stone walls, orchard terraces, a tractor, hens, a cat, a child playing. A mixed group of women and men, all with kind faces.

FORMAT: {{square 1:1 avatar, bust, plain flat ochre background | square 1:1 full scene, full bleed, no frame, no white border}}.
```

Si preferixes conservar les **ulleres redones** de l'avatar actual, és canviar la línia `EYEWEAR` i pujar la versió. Els codis de color són una proposta meua per a fixar la paleta; no venen de cap font del projecte.

#### 7.4 Llista d'acceptació

- [ ] Monyo gris alt i front net, sense mocador.
- [ ] Nas gros i redó, el tret més gran de la cara.
- [ ] Vestit negre i rebeca granat, sense davantal.
- [ ] Mòbil a la mà dreta, sense logotip ni text.
- [ ] Somriure amable, dents normals.
- [ ] Contorn de tinta net i colors plans, sense degradats.
- [ ] Cap text ni cap personatge publicat a la imatge.

### 8. Onada 11 · Consola Termodinàmica: preguntes i peticions

No he tocat res de la Consola. Açò és el que he mesurat i el que necessite per a arreglar-la.

#### 8.1 Estat mesurat hui (11 avisos al Mapa)

| Avís | Gravetat | Què és | Origen |
| --- | --- | --- | --- |
| `frontissa-roja` × 3 (`consola`, `cervell`, `disseny`) | alta | Empremta de contingut canviada | **Onada 10**; s'apaga amb D1 |
| `segell-trencat` i `segell-divergent` × 2 (`core-automillora`, `sdp-universal-page`) | alta | Dos skills editades després del segell del 09/10 | Anterior |
| `torns-caducats` | mitjana | 246 de 254 torns caducats sense tancar | Anterior, estructural |
| `tasca-sense-llancador` × 2 (`higiene-basica`, `higiene-diaria`) | mitjana | Tasques declarades; el llançador `org.socdepoble.higiene` no és al Mac | Anterior |
| `recaiguda-recent` (`wiki-documentacio-i-reflex`) | mitjana | Una línia del LEDGER del 05/10 | Anterior |
| `escriptori-sense-rebut` (`261010_1140_requeriments_onada11.md`) | baixa | Document creat sense rebut de torn | D'este matí |

Fora del Mapa, però ho veuràs quan es mesuren les portes: `design_guard` roig (9 infraccions noves) i dos mesures de salut en «N/A» (`porta-documents` i `run-portes`).

#### 8.2 Requeriment nou: l'Índex de Continguts clàssic

Anotat tal com me l'has dictat:

- **On:** a la part de baix de la Consola, després de totes les targetes.
- **Què:** un índex de **text pur**: un **H2** de títol i **H3 i H4** per als subapartats.
- **Per a què:** explicar què fa cada peça de la Consola i **enllaçar a la Pàgina Universal de cada targeta**; només amb targetes costa tindre una vista general.

Preguntes per a poder-lo construir:

1. L'índex va **només al tauler** (`/consola`) o també a `/page/consola`, que ja té sis paràgrafs que fan una part d'eixa faena?
2. Cada entrada enllaça a la pàgina de la targeta (`/consola/<id>`). Hi ha nou pàgines, tres panells del pols i una pàgina per xifra: **fins a quin nivell baixa l'índex**?
3. El text de cada entrada, **el redacte jo** a partir del codi i tu el revises, o me'l dictes?
4. La Consola és de les poques pantalles que no pinta `PAGE_COPY.html`. L'índex ha de ser **dades** (una taula d'on isquen títol, text i enllaç) perquè la barra blava ja en faça l'índex navegable?
5. Cal un **espècimen a Disseny** abans, com mana Pedra Seca per a tota peça nova?

#### 8.3 Preguntes sobre la neteja

1. **Què vol dir «sense un sol error»?** Zero avisos de totes les gravetats, o zero d'alta i mitjana? Alguns avisos estan fets per a caducar sols o són estructurals.
2. **Puc canviar les regles del Mapa o només l'estat?** Per exemple, perquè un torn caducat de fa tres setmanes deixe de comptar.
3. **Torns caducats:** el LEDGER és immutable i «no es reescriu història tancada». Què és acceptable: tancar-los amb una amnistia registrada, arxivar-los, o comptar només els recents?
4. **Segell:** les edicions de `core-automillora` i `sdp-universal-page` són bones i cal tornar a segellar, o cal desfer-les? I qui segella?
5. **Tasques d'higiene:** vols el llançador instal·lat al teu Mac (és fora del repositori) o lleve la declaració del registre de tasques?
6. **Recaiguda del 05/10:** eixe avís caduca amb una finestra de temps o demana una línia de tancament al LEDGER?
7. **«Skills òrfenes» i «línies estranyes al LEDGER»:** al Mapa d'ara no en veig cap. A quina pantalla les veus? Una captura m'estalvia buscar.
8. **Accés:** què s'ha obert exactament per als forasters? En local la Consola ja s'obria sense sessió; a la web publicada continua demanant el rol. Si canvia, afecta D9.
9. **Onada 11 ja té requeriments** (panell de superadministració, segon factor i el bug de taxonomia). La Consola s'hi afig o va davant?
10. **L'arbre:** el Mapa llig l'arbre de treball i hui no està net. Qui fa el commit de l'Onada 10 i dels canvis d'este matí abans de començar?

#### 8.4 El que necessite que em passes o m'òbrigues

- **Un camí per a escriure a `.agents/`.** El hook em nega `ESTAT.md`, el LEDGER, el segell, el registre de tasques i la frontissa. Necessite saber com es demana una lease de `executor-mutacio.mjs` (un exemple que haja funcionat) o que ho execute MarIA.
- **Ordres de lectura que hui tinc vetades:** `git diff` i `git log` d'un sol fitxer, `git show`, `node tooling/gates/frontissa-contingut.mjs`, `node tooling/gates/run-portes.mjs`, `npm run lint` i `node tooling/gates/tancament.mjs --check`. Sense elles no veig com era un fitxer abans ni puc passar les portes que he de deixar verdes.
- **Fitxers:** `.agents/SKILLS_SEAL.json`, `.agents/cron/registre_tasques.json`, les línies del LEDGER que et preocupen, `.agents/olivera-fase.json` i els `.plist` de `~/Library/LaunchAgents/org.socdepoble.*`.
- **Permís puntual** per a llegir a l'arxiu històric el document `261009_2005_auditoria_inventari_onada9.md` i les decisions de l'Onada 8.
- **Una finestra tranquil·la.** Saber qui més escriu mentre treballe (Codex, la tasca de cada hora, els hooks d'Antigravity).
- **La definició de fet.** Proposta: captura de la Consola amb zero avisos sobre un arbre net, en un commit concret.

#### 8.5 Pendents de l'Onada 10 que el pla de l'Onada 11 ha d'absorbir

Les setze decisions de l'apartat 5 i el que hi ha a l'apartat 6. Font: este document.

### 9. Retroalimentació de la plantilla `prompt_local`

1. **Fitxers verificats.** El pla citava cinc fitxers que no existixen. Una línia de preflight que els comprove amb `ls` abans de convocar ho hauria avisat.
2. **Aprovació.** El pla deia «Estat del Pla: aprovat» al cos, «Aprovació humana: pendent» al Registre i `status: esborrany` al frontmatter. Convé una sola font.
3. **Paraules del Mestre.** Quan el pla ix d'un àudio, una secció amb les frases literals evitaria paràfrasis com «no ets del poble» o «dins de la decoració».
4. **Verificació.** Els passos de verificació haurien de dir la ruta i el que s'hi ha de vore; el pas 2 demanava mirar al Mur dos targetes que no hi han sigut mai.

### 10. Relleu per a l'ESTAT

No puc escriure a `.agents/`. Text proposat perquè l'enganxe MarIA:

> ESTAT_ACTUAL · 2026-10-10 15:20 · Claude · Onada 10 implementada, pendent de tres aprovacions de frontissa. Objectiu complit: tres targetes fora del Panell, sis targetes de plugin canòniques, quatre pàgines amb sis paràgrafs i botó dalt i al final, «Foraster» als dos errors del xat, botó «Anar al xat» a /iaia i text al perfil de la IAIA. Proves: `npx vitest run src`, 15.746 verdes i cap roja. Bloquejos: frontissa de contingut (consola, cervell, disseny) i setze decisions del Mestre a `261010_1404_auditoria_claude`. Següent acció: el Mestre aprova i decidix; l'Onada 11 absorbix els pendents. Torn torn_d86bbdf5 obert, sense tancar.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Proves executades

| Comanda | Resultat |
| --- | --- |
| `npx vitest run src` | 944 fitxers verds i 1 saltat; **15.746 proves verdes**, 8 saltades, **cap roja** |
| `npx vitest run tests` | 7 fitxers verds i 5 saltats; 53 proves verdes, 81 saltades, cap roja |
| `node --test tests/lint-sessio.test.mjs` | «Lint net» |
| `node --test tests/lint_xat.test.mjs` | 20 de 20 |
| `node --test tests/lint_calendari.test.mjs` | 7 de 7 |
| `node --test tests/frontissa-contingut.test.mjs` | 9 de 9 (prova el mecanisme, no les empremtes vives) |
| `node --test tests/lint_logica_usuari.test.mjs` | 17 verdes, cap roja, 2 diagnòstics heretats |
| `node --test tests/lint_enxufe.test.mjs` | 9 verdes, cap roja, 2 diagnòstics heretats |
| `node tooling/gates/design_guard.mjs --arrel=src` | **roig**, 9 infraccions noves en fitxers que l'Onada no ha tocat |

### Vist al navegador (mode llavor, escriptori)

- `/control`: cinc seccions; cap de les tres targetes; les sis de plugin amb pastilla i dos etiquetes; el Snippet amb «03/10/26» sense hora; les huit de dalt sense etiquetes.
- `/page/cervell`: un sol H1; «Sistema» i «Graf»; botó dins del bloc blanc i repetit al final; sis paràgrafs.
- `/iaia`: signa «Sóc de Poble»; «Anar al xat» dins del bloc blanc; el clic acaba a la conversa «IAIA MarIA».
- `/perfil/iaia-maria`: l'avís d'intel·ligència artificial, «Parla amb la IAIA» i el text nou.
- Els revisors han vist també `/mur`, `/page/consola`, `/plugin/rebost`, `/plugin/salut` i el text nou de l'error del xat en llavor.

### Passada final de Pedra Seca

Dos revisors, un sobre les regles al codi i un mesurant en pantalla a 1280 i a 375 píxels, en clar, fosc i Mode Bancal. **Cap incompliment introduït per l'Onada 10**; no ha calgut corregir res.

- **Codi.** Cap color en cru, cap estil en línia i cap classe nova: l'Onada no toca cap full d'estils. Un sol H1 per pàgina, dins del bloc blanc. La peça nova del botó de `/iaia` no és un component d'interfície nou: munta la porta que ja és al catàleg.
- **Pantalla.** Els botons «Obrir…» i «Anar al xat» fan 58 px d'alt i el de dalt i el de baix són idèntics. A 375 px cap pàgina desborda. Els sis paràgrafs nous tenen la mateixa tipografia que el cos d'El Xat. La pastilla del Snippet ix sense hora. Cap error a la consola del navegador.

Tres notes que no són incompliments:

- A 375 px, les etiquetes de la capçalera de `/disseny` fan **dos files** per culpa de la tercera, «Pedra Seca» (va amb D3).
- La targeta del **Snippet no porta entradeta**; és anterior i ja estava pendent des de l'Onada 8.
- En mode fosc, l'enllaç del copyright té un contrast d'1,95:1 a totes les pàgines; és anterior.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No he fet cap commit.** L'arbre porta els canvis de l'Onada 10 i els d'altres actors.
- **No he executat** la frontissa de contingut sobre les empremtes vives, ni `run-portes`, ni `npm run lint`, ni `tancament.mjs`: el hook d'esta sessió les bloqueja. El pre-commit pot trobar el que jo no he pogut vore.
- **No he escrit** `ESTAT.md` ni el LEDGER, ni he tancat el torn: `.agents/` és fora del meu abast.
- **No vist en pantalla:** el mode remot, les altres quatre llengües, la pàgina traduïda i les fitxes del Perfil. Ho cobrixen proves, no el píxel.
- **Sense el fitxer d'abans.** No puc llegir la versió de git d'un fitxer; que `eslint.config.js` portava el perdó de `React` ho dic pel comentari i la sonda de `src/sections/detail/qualitat.fantasmes.test.js`, no pel diff.
- **Els textos són esborranys teus.** Les etiquetes, les dates i els sis paràgrafs de cada pàgina esperen la teua lectura; el de Salut, també la d'algú de salut.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
