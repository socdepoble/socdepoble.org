---
type: document
status: canonic
description: Mapa didàctic del sistema nerviós de Sóc de Poble (45 skills neuronals, tractors mecànics i repositoris oberts estudiats o en reserva al Node 0).
image: /assets/ui/plugins/sistema_nervios_vinyeta.jpg
imageAlt: Una iaia governa una màquina de fusta amb manòmetres i campanes a la plaça, amb dos robotets, un veí i una cabra, en estil Bruguera.
date: '2026-11-17T00:14:00+01:00'
updated: '2026-11-21T03:48:00+01:00'
version: 1.2.1
mur: false
tags:
  - saber
  - skills
  - tractors
---
# El sistema nerviós: skills, tractors i repositoris oberts

Este document explica, sense tecnicismes innecessaris, com s'organitza la **maquinària interna** que ajuda a construir i vigilar **Sóc de Poble**. Distinguix les **instruccions escrites** (`skills`), els **comprovadors automàtics** (`tractors`) i l'estat real de cada **repositori extern** estudiat o guardat al **Node 0**, amb maquetació fluida sense taules rígides perquè es puga llegir amb comoditat tant al mòbil com amb les columnes laterals obertes.

## 1. Què és una skill i què és un tractor

Quan construïm una eina per al poble, no n'hi ha prou amb tindre **bones intencions**: cal recordar les normes en cada pantalla i comprovar el resultat abans de publicar res. El nostre **sistema nerviós** dividix esta responsabilitat en dues peces complementàries.

- **Les neurones (`Skills` a `.agents/skills/*/SKILL.md`):** són manuals d'ofici breus i verificables escrits en llenguatge humà. Quan un agent d'intel·ligència artificial ha de tocar el disseny, una migració de dades o un text públic, llig primer la **skill corresponent** per actuar amb el **context complet** del projecte.
- **Els reflexos musculars (Tractors i Portes a `tooling/`):** són programes deterministes escrits en JavaScript (`.mjs`) que no tenen opinions ni cansament. Mesuren el **contrast de lectura al sol**, l'àrea tàctil mínima de `48 × 48 px`, els enllaços vius, el lèxic honest i el **pressupost de pes** del paquet web.
- **Per què van sempre de la mà:** una regla escrita només en prosa es pot passar per alt quan un model acumula massa pàgines de conversa. Quan eixa mateixa regla té una **porta mecànica** associada, qualsevol oblit s'atura amb codi d'error (`exit 1`) abans d'arribar als veïns.

## 2. Com treballem hui: govern humà i enginyeria assistida

En el desenvolupament quotidià de **Sóc de Poble** ja cap persona pica codi línia a línia amb el teclat, però **les persones governen totes les decisions**. L'arquitecte humà, **Javi Llinares**, fixa les **necessitats rurals**, l'accessibilitat per a la **gent gran**, el **disseny visual** i l'**aprovació final** de cada entrega.

La feina tècnica s'ordena des de **Google Antigravity IDE**, on la **IAIA MarIA** actua com a directora tècnica per repartir tasques sense trepitjar fitxers. Cada agent constructor (**Claude**, **ChatGPT Codex** i **Gemini**) treballa sobre una **còpia efímera aïllada** (`/tmp/`) i lliura paquets verificats amb empremta criptogràfica **SHA-256**.

Quan una decisió d'arquitectura demana **contrast extern**, es convoca **El Consell** amb el **context íntegre** del projecte: Z.ai, Qwen, Deepseek, Dola, Kimi, Claude, Perplexity, Mistral Vibe, Grok, Gemini, Copilot i ChatGPT Codex. En paral·lel, el servidor local **Node 0** (`Mac mini` amb **xip Apple M4**) executa **8 escoles locals** d'Ollama com a **revisió addicional sense cost** per consulta.

## 3. Mapa de procedència: pròpies, estudiades i en reserva al Node 0

Per mantindre una **transparència verificable**, classifiquem **tota la maquinària** segons el seu **origen real**: què hem **escrit de cap a peus** a casa, quines **metodologies obertes** hem estudiat per destil·lar les nostres regles i quins **motors lliures** tenim descarregats al **Node 0** sense carregar ni un sol byte a la web.

### 3.1 Maquinària 100 % pròpia de Sóc de Poble

El repositori manté **45 skills actives** dins de `.agents/skills/` (`23` connectades a motors propis declarats al camp `motors:` del seu frontmatter i `22` procedimentals; ho reproduïx `node tooling/brain/fronteres-skills.mjs`), acompanyades de les portes de `tooling/gates/`, l'utillatge documental de `tooling/wiki/` i els índexs de `tooling/brain/`.

#### Identitat, Consell i govern humà
Fixen la **veu de poble**, els **rols d'agents**, el **control de despesa** i el respecte a la **decisió humana** per a MarIA, Claude, ChatGPT Codex, Gemini i la revisió humana. Agrupen `iaia-maria-core` (el paper d'actriu de la IAIA, D8), `core-identitat`, `core-consell-i-colmena`, `core-direccio-autonoma`, `core-estrategia-ia`, `core-telemetria-huma` i `core-portaveu-institucional`.
- **Incorporació real:** **100 % propi** · Actiu amb `incubadora.mjs` i `sincronitza-iaia-core.mjs` (iaia-maria-core), `porta-olivera.mjs` (core-identitat), `guarda-nocturna.mjs` (core-direccio-autonoma) i `tracker_consum.mjs` (core-estrategia-ia); la resta, procedimentals.

#### Prudència, context i memòria
Eviten **edicions a cegues**, conserven **lliçons apreses**, paren **bucles d'error** i **separen carrils** de treball entre MarIA, Claude, ChatGPT Codex i Gemini. Reunixen `core-comprensio-reflexiva`, `core-automillora`, `core-memoria-historica`, `core-context-panic`, `core-edicio-segura`, `core-restauracio-segellada` i `core-secretaria-auditoria`.
- **Incorporació real:** **100 % propi** · Actiu amb `desenterrar.mjs` (core-restauracio-segellada); la resta, procedimentals.

#### Higiene d'Escriptori i taxonomia
Mantenen l'**Escriptori ordenat**, retiren **fitxers temporals** i exigixen **noms i dates verificables** sota el control de MarIA i les portes de tancament. Inclouen `core-higiene-escriptori`, `core-neteja-brossa`, `core-taxonomia-estricta`, `core-temps-termodinamic` i `core-salfumant-radical`.
- **Incorporació real:** **100 % propi** · Actiu amb `porta-olivera.mjs` i `consum-acreditat.mjs` (core-higiene-escriptori), `neteja_brossa_arrel.mjs` (core-neteja-brossa), `porta-taxonomia.mjs` (core-taxonomia-estricta i core-temps-termodinamic) i `document.mjs` (core-taxonomia-estricta); core-salfumant-radical, procedimental.

#### Qualitat editorial, seguretat i auditoria
Regulen la **jerarquia de títols**, la **lectura escanejable**, la **seguretat de base de dades** i les rondes d'**auditoria creuada** per a tots els agents constructors i revisors. Són `core-llegibilitat-text`, `core-maquetacio-markdown`, `core-informes-pdf`, `core-seguretat-audit`, `core-sentinella-blindatge`, `core-tecniques-investigacio` i `core-gauntlet-loop`.
- **Incorporació real:** **100 % propi** · Actiu amb `tractor-maquetacio-canonica.mjs` (core-llegibilitat-text i core-maquetacio-markdown), `tractor-frontmatter.mjs`, `tractor-registre.mjs` i `cataleg_skills.mjs` (core-maquetacio-markdown), `certifica-enllacos.mjs` (core-tecniques-investigacio) i `tractor-sentinella-blindatge.mjs` (core-sentinella-blindatge); la resta, procedimentals.

#### Imatge i connectors d'allotjament
Cuiden l'**estil d'il·lustració pròxima** de còmic i empaqueten el **connector de WordPress** dins del **límit estricte de pes** per a MarIA, Gemini i l'administració del sistema. Comprenen `core-identitat-visual`, `core-calibratge-visual-nano`, `core-empaquetat-wp` i `sdp-vigilant-tellado`.
- **Incorporació real:** **100 % propi** · Actiu amb `empaqueta.mjs` (core-empaquetat-wp) i `tractor-vigilant.mjs` (sdp-vigilant-tellado); la resta, procedimentals.

#### Disseny Pedra Seca i casos d'ús rurals
Governen la **tipografia**, els **colors AAA**, les **graelles de columnes**, les **pàgines de lectura** i les eines pensades per al **món rural**, al servei de Claude, ChatGPT Codex, Gemini i el resultat visual per al veïnat. Són `sdp-pedra-seca`, `sdp-app-grid-shell`, `sdp-universal-page`, `sdp-universal-editor`, `sdp-casos-us-essencials` i `sdp-workflow`.
- **Incorporació real:** **100 % propi** · Actiu amb `design_guard.mjs`, `tractor-cromatic.mjs`, `tractor-tokens.mjs` i `01_porta_pedra_seca_58px.mjs` (sdp-pedra-seca), `certifica-enllacos.mjs` (sdp-universal-page i sdp-workflow) i `fronteres-skills.mjs` i `kit-carril.mjs` (sdp-workflow); la resta, procedimentals.

#### Aplicacions i patrimoni del poble
Definixen el **TPV per al bar i el rebost**, la **missatgeria familiar**, el **calendari de cultius** i les **cròniques** per als equips de construcció, veïns, comerços i associacions. Agrupen `sdp-clon-loiverse`, `sdp-clon-whatsapp`, `sdp-calendari-agricola`, `sdp-importacio-editorial` i `sdp-estudi-mercat`.
- **Incorporació real:** **100 % propi** · Actiu amb `tria-imatge-seo.mjs` (sdp-importacio-editorial); la resta, procedimentals.

#### Cicle documental de la Wiki
Regulen la **creació de plans, actes i prompts** amb **plantilla canònica** i propaguen canvis a la documentació des de MarIA i la secretaria tècnica. Inclouen `wiki-documentacio-i-reflex`, `wiki-cicle-de-vida`, `wiki-propagar-veritat` i `wiki-busca-skills`.
- **Incorporació real:** **100 % propi** · Actiu amb `document.mjs` i `porta-olivera.mjs` (wiki-documentacio-i-reflex), `obrir_torn.mjs` i `tancament.mjs` (wiki-cicle-de-vida), `wiki-forja-lint.mjs` (wiki-propagar-veritat) i `cataleg_skills.mjs` i `fronteres-skills.mjs` (wiki-busca-skills).

#### Cadena de portes mecàniques (`tooling/gates/`, `tooling/wiki/` i `tooling/brain/`)
Reunix **més de seixanta comprovadors deterministes** de contrast, teclat, enllaços, censos, lèxic i integritat, escrits en **codi Node.js 100 % propi** sense dependències pesants i executats en local abans de cada entrega.

### 3.2 Metodologies i repositoris externs estudiats i adaptats

Estes fonts obertes ens han servit d'**escola metodològica**. No s'ha copiat **cap component alié** dins del navegador: hem estudiat com resolen els problemes i n'hem escrit la nostra **pròpia versió** adaptada a **Pedra Seca**.

#### Mètode MIT d'Acumulació Semàntica i [Spec-Driven Development de GitHub](https://github.com/github/spec-kit)
Consistix a **llegir les fonts vives**, fixar l'**especificació escrita** abans de tocar codi i validar amb **proves reals** en **MarIA, Claude, ChatGPT Codex i Gemini**. És una **metodologia adaptada** integrada a [[sdp-workflow_SKILL|sdp-workflow]] i `core-comprensio-reflexiva`; el nom Mètode MIT és el del nostre **procediment intern**, no una acreditació acadèmica.

#### [Google EGM · Elephant-Goldfish Model](https://github.com/google/elephant-goldfish-model)
Descrit a l'[article de presentació de Google Open Source](https://opensource.googleblog.com/2026/10/introducing-elephant-goldfish-model-plugin.html), planteja contrastar un **context de disseny amb visió global** contra **revisions independents** sense biaix previ. A casa l'utilitzen l'orquestració i les **8 escoles locals** del Node 0 com a **arquitectura adaptada** (concretada en **huit preguntes de revisió**, que no són un nombre obligatori del model original) dins de [[core-tecniques-investigacio_SKILL|core-tecniques-investigacio]], sense **cap dependència externa** al paquet web.

#### [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (`MIT`)
Inspira les rúbriques de **neteja de prosa artificial** (`deslop`), la **revisió dels 6 estats visuals** i l'**auditoria de camins de clic** que apliquen Claude, ChatGPT Codex, Gemini i MarIA. Està **estudiat i destil·lat** amb **`0 %` de codi alié** dins de `src/` i **regles íntegrament pròpies**.

#### Enginyeria Inversa d'Artefactes (`REA`) amb [rizin](https://github.com/rizinorg/rizin) i [frida](https://github.com/frida/frida)
Inspecciona el **paquet compilat real** (`dist/` i `.zip`) en l'auditoria tècnica pre-publicació per verificar quins **bytes i rutes s'entreguen de debò**. Actua com a **protocol d'auditoria** integrat a [[core-gauntlet-loop_SKILL|core-gauntlet-loop]] i `core-tecniques-investigacio`.

#### [storytold/craft-anything](https://github.com/storytold/craft-anything) (`MIT OR Apache-2.0`)
Aporta el mètode per **destriar les peces essencials** d'un ofici abans de dissenyar **pantalles senzilles** per al veïnat en noves eines rurals. S'ha **estudiat i destil·lat** dins de `core-tecniques-investigacio`.

#### [every-app/open-seo](https://github.com/every-app/open-seo) (`MIT`)
Serveix de guia de comprovació per a **títols, targetes compartides i adreces canòniques** sense rastrejadors comercials. Està **estudiat i reimplementat** amb **codi `100 %` propi** al generador `tooling/gates/build-seo-manifest.mjs`.

#### Emowe · Semàfor d'inventari de skills
Partix de la idea inicial de **mesurar la salut de cada skill** ([[03_inventari_skills|procedència documentada]] i [Inventari de la Consola](https://socdepoble.org/consola/inventari)), **estudiada i corregida** amb regles pròpies per al nostre arbre documental dins de la Consola Termodinàmica i `tooling/brain/cataleg_skills.mjs`.

#### [Vigilant de Fernando Tellado](https://wordpress.org/plugins/vigilante/) (WordPress)
És el nostre referent de **diagnòstic no intrusiu** de capçaleres de seguretat i **convivència amb llocs WordPress municipals**. S'aplica com a **inspiració reimplementada** en mode només lectura —sense tocar mai el servidor amfitrió— a [[sdp-vigilant-tellado_SKILL|sdp-vigilant-tellado]] i `tooling/gates/tractor-vigilant.mjs`.

### 3.3 Biblioteques i motors lliures en reserva al Node 0 i peces descartades

Al **servidor de Sóc de Poble**, el **[Node 0](https://socdepoble.org/page/node-zero)** (`Mac mini` amb **xip Apple M4**) estudiem i guardem eines de **programari lliure** amb cost **`0,00 €`** i pes **`0 B`** dins del nucli web. També documentem quines peces hem **descartat** per evitar duplicitats o llicències poc clares.

#### [awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) (`CC-BY-SA-3.0`)
Catàleg de **`1.361` fitxes YAML** de programari lliure autoallotjable consultat per l'equip d'arquitectura i les **8 escoles locals** per triar eines sense lligams comercials. Es manté com a **biblioteca de consulta al Node 0**, amb **`0 B` al paquet web**.

#### [calcom/cal.diy](https://github.com/calcom/cal.diy) (`MIT`)
Referència d'**algorismes de torns i franges horàries** per a reservar espais municipals com el frontó o les sales comunes. Es conserva com a **referència algorísmica al Node 0** per als equips de desenvolupament, **sense desplegar el seu servidor**.

#### [Flomp/wanderer](https://github.com/Flomp/wanderer) (`AGPL-3.0`)
Referència d'esquema de **traces GPX, desnivells i fonts** per evolucionar el disseny de [Rutes de Poble](https://socdepoble.org/page/rutes-de-poble) per a veïns i excursionistes. Actua com a **referència de dades al Node 0** per construir la interfície pròpia en **Pedra Seca**.

#### [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) (`AGPL-3.0`)
Taller sonor natiu optimitzat per a **xip Apple M4**, destinat a produir **locucions i audiollibres culturals** per a l'escolta accessible de la gent major. Funciona com a **motor local de taller al Node 0**, **mai exposat a internet**.

#### [OpenWhispr/openwhispr](https://github.com/OpenWhispr/openwhispr) (`MIT`)
Referència oberta de **dictat de veu local** pensada per recollir **memòria oral i històries familiars** sense necessitat de teclat. Es troba **en estudi local al Node 0** dins la recerca d'accessibilitat, **encara no integrat a l'aplicació**.

#### [CapSoftware/Cap](https://github.com/CapSoftware/Cap) (`AGPL-3.0`; crates `cap-camera*` i `scap-*` sota `MIT`)
Gravador lliure d'escriptori per preparar **vídeos curts d'ajuda visual** destinats a veïns i ajuntaments des de la direcció humana i la comunicació didàctica. S'utilitza com a **eina auxiliar d'escriptori**, **fora del codi de l'aplicació**.

#### [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) (`AGPL-3.0`), [opf/openproject](https://github.com/opf/openproject) (`GPL-3.0`) i [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) (`MIT`, excepte la carpeta `enterprise/`, amb llicència pròpia)
Estudiats puntualment com a referents de **taules, fites de subvencions i bústia d'atenció**, funcionalitats que ja cobrim amb eines pròpies. Estan **no desplegats** per **evitar servidors pesants duplicats**.

#### [wide-trace/open-higgsfield](https://github.com/wide-trace/open-higgsfield) (`Sense llicència oberta verificada`)
Repositori **sense llicència lliure acreditada** i dependent de serveis externs de pagament per clau privada. Queda **descartat i bloquejat** per a tots els agents i usuaris per **higiene legal `AGPL-3.0`**.

## 4. Una sola pàgina viva i límits de les comprovacions

Esta és la **pàgina canònica** del sistema nerviós. L’**adreça antiga** `/page/sistema-nervios` hi redirigix. Des de la **v1.2.16** el capítol **ja no es projecta al Mur** (`mur: false`): el Mur és del poble, no de la maquinària interna, i llevar-lo del Mur **no esborra el llibre**. La **[Consola Termodinàmica](https://socdepoble.org/consola)** mostra **dades i proves**, no certificats de comprensió ni una garantia d’accessibilitat universal. Les proves de codi cobrixen el seu abast; contrast, geometria tàctil i comportament en cada aparell es comproven també en **navegador**.

Les **fonts originals** anteriors expliquen els mètodes i projectes citats. Les afirmacions sobre ús al Node 0 descriuen el **registre local** del projecte; un enllaç extern viu **no acredita** per si sol **instal·lació**, **execució** ni **adopció completa**. Les **llicències** d'este capítol corresponen a la lectura registrada el 17-11-2026; cal rellegir-les abans d’incorporar codi.

## Vincles

- [[00_index]]
- [[00_index_maquina]]
- [[03_inventari_skills]]
- [[sistema_immunitari]]
- [[agents_equip_ia]]
- [[02_genotip]]
