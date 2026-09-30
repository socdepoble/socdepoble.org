---
type: informe
status: esborrany
description: Arquitectura de la logica d'usuari calcada de WhatsApp, guardat estil Raindrop i Obsidian, Fedivers i autoreproduccio, i auditoria adversarial del connector de WordPress de Codex.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4effda0f-179f-41c7-a49e-9c5a16627263:9222cd3b-2e03-4670-a361-bf017675334e
---
# Auditoria Claude UX WhatsApp, Fedivers i connector WordPress

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4effda0f-179f-41c7-a49e-9c5a16627263:9222cd3b-2e03-4670-a361-bf017675334e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T13:50:01.547Z |
| Modificació | 2026-09-30T14:42:00Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), amb subagents del mateix model |
| Tokens consumits | Subagents: 11.009.361 en 61 agents i 3.136 crides d'eina, segons els quatre workflows. Orquestrador: uns 760.000 segons el comptador de la sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-30T13:50:01.547Z: esborrany creat; contingut i verificació pendents.
- 2026-09-30 16:10 (hora local): versió 0.1.0. Anatomia de WhatsApp escrita de primera mà.
- 2026-09-30 16:32 (hora local): versió 0.9.0. Disseny complet de T1, T2 i T3, contracte de ports, ordre d'obra i decisions del Mestre. Incorpora les correccions de Codex de les 16:11 i les 16:20.
- 2026-09-30 16:42 (hora local): versió 1.0.0. Apartats 7 i 8 complets: auditoria adversarial del connector (61 troballes, 28 amb refutació independent) i crítica de l'informe de Codex (quatre troballes confirmades, dos de noves refutades sense èxit). Corregida l'afirmació sobre l'idioma.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. El que cal saber en un minut

1. **La nostra barra mòbil ja és la de WhatsApp.** Xat, Mur, Pobles i Mercat ocupen el lloc de Xats, Actualitzacions, Comunitats i Trucades. No cal una closca nova: cal posar cada cosa al seu lloc i llevar les portes que no porten enlloc.
2. **Guardar és enviar-s'ho.** Un sol verb («Guardar»), un sol magatzem (les Notes) i una sola porta diària: la fila «{nom} (Tu)» dalt de la llista de Xats. És el grup d'un sol membre que ja es fa servir a WhatsApp.
3. **El Raindrop ja està mig fet.** `/connectar?url=…` ja valida i guarda una web de fora. Falta qui li envie l'adreça: un botó al menú de la bombolla i un botó per al navegador de l'ordinador.
4. **Obsidian sense sintaxi.** L'enllaç el crea el gest. Cada cosa guardada té dos caps: «Obri l'original» (ja existix) i «On ix açò» (falta, i necessita un índex al servidor).
5. **Seguir algú de fora és un canal.** Només lectura, llegit pel servidor, mai pel navegador. Contacte amb gent de fora va l'últim i amb ADR nova.
6. **Clonar llegint l'HTML** vol dir que la pàgina porta l'adreça verificable de cada peça, no el sistema. Dos de les tres baules ja existixen.
7. **Hi ha un pas zero.** Sis migracions es declaren «no aplicades a cap base de dades». El fil personal, els canals i l'origen de les notes hui són paper. Res del que seguix es pot prometre sense acreditar què té la base real.
8. **El codi de Codex és un endoll net, i l'encàrrec està resolt al banc de proves, no per a un ajuntament.** El que contamina és heretat del 29 de setembre: lletra, Índex i idioma depenen del document de l'amfitrió. Les seues quatre troballes del nucli són certes; en falten dos que afecten el dia de Sollutia (apartats 7 i 8).

Tot el que es veu és redisseny (Llei del Píxel) i cap peça es programa sense espècimen previ (Pedra Seca §9). Este document és la proposta; l'aprovació és del Mestre.

### 1. T1 · On va cada cosa

#### 1.1 WhatsApp peça a peça

Font: les 22 imatges de `01_produccio/`, llegides una per una per l'orquestrador i per un lector independent, i contrastades per un lector de Codex. Onze són d'Android en valencià (2026-09-29) i onze de WhatsApp per a macOS en castellà (2026-09-28). Cap és de la nostra app. Contenen dades personals: ací només es descriu l'estructura.

**Android (el telèfon de la gent major)**

| Peça | Què hi ha |
| --- | --- |
| Barra inferior | Quatre pestanyes: Xats (amb insígnia de no llegits), Actualitzacions, Comunitats i Trucades. L'activa porta una píndola darrere de la icona. |
| Capçalera | Títol de la pestanya a l'esquerra. A la dreta, icones i els tres punts. Xats, Actualitzacions i Trucades porten lupa o cerca; Comunitats, no. |
| Píndoles de Xats | Totes, No llegits, Favorits, Grups i una llista amb nom posat per l'usuari. |
| Fila | Avatar, títol, línia secundària amb icona d'estat, hora i insígnia. La forma es repetix en xats, canals i grups; les trucades canvien l'acció de la dreta. |
| Botó d'acció | Un de principal baix a la dreta. A Xats i a Actualitzacions, un de secundari més menut damunt. |
| Tres punts a Xats | Grup nou, Nova difusió, Dispositius enllaçats, Destacat, Marca'ls tots com a llegits, Configuració. |
| Comunitat | «Comunicats» sempre primer. Després, els grups de què formes part i «Mostra-ho tot». Al detall, botó inferior «Afegeix un grup». Menú: Informació de la comunitat, Convida membres, Configuració de la comunitat. |
| Xat de grup | A la capçalera, una insígnia de la comunitat que obri un full inferior amb els seus grups. Compositor amb emoji, clip, càmera i micròfon. |
| Perfil i configuració | Una sola pantalla: avatar gran amb nota curta, nom amb desplegable de comptes, icona de QR i llapis, la banderola «Xats de tercers» i una llista d'icona, títol i subtítol. «Convidar un amic». |

**macOS (l'ordinador)**

Tres columnes: barra lateral amb Xats, Novetats, Comunitats, Trucades i Contingut multimèdia, una secció «Més» amb Destacats i la llista de comunitats; llista; i detall. Dos peces només es veuen ací: «Contingut multimèdia» (Fitxers, Enllaços i Documents de tots els xats) i «Destacats» (missatges marcats, amb salt al seu context).

**Cinc patrons que importen més que les pantalles**

1. **El grup d'un sol membre és un bloc de notes.** L'amo del telèfon hi envia fotos i captures. Guardar és enviar-s'ho.
2. **La biblioteca es fa sola.** Enllaços, documents i destacats es reunixen per tipus i per data sense que ningú els arxive. Açò és una lectura funcional de les captures, no una cosa que les imatges proven soles.
3. **La col·lecció és una píndola amb nom.** No hi ha carpetes.
4. **El canal es seguix i no s'hi contesta.** Té «Explora» i «Segueix».
5. **«Xats de tercers».** WhatsApp mateix ja presenta la idea de parlar amb gent d'una altra aplicació.

#### 1.2 El que ja tenim

- **El calc de WhatsApp ja existix, i és el d'escriptori.** `src/sections/xat/components/ClosCaXat.jsx` porta rail, llista i conversa per ordre del Mestre (`ClosCaXat.jsx:7-8`). En mòbil no hi ha pestanyes del Xat: mana la barra inferior global (`src/app/App.jsx:697-748`).
- **Peces vives:** fila de conversa de 72 px, menú de tres punts, full inferior, comunitat amb «Avisos» i grups, bombolla, compositor, «Seleccionar missatges» amb «Enviar al Bloc de Notes», perfil amb apartats i `/connectar`.
- **Peces pintades i sense res darrere:** Telefonades, Contingut multimèdia i Destacats són vistes «En construcció». El filtre «Preferits» no es pot alimentar: cap acció marca un fil. La fila «{nom} (Tu)» del diàleg de conversa nova contesta que el poble no obri el xat personal (`DialegNovaConversa.jsx:254-267`).
- **Portes que no porten enlloc:** la targeta «Gestoria» de `/control` diu «ACTIU» i navega a una ruta que no existix (`ControlSection.jsx:38-41`, `:103`); hi ha cinc targetes «EN OBRES»; «Nou grup» contesta amb un paràgraf que diu «Pàgina Universal» (`DialegNovaConversa.jsx:163`).
- **Ordres vigents que un calc literal del mòbil tocaria:** píndoles llevades del Xat (T12, `FiltreConverses.jsx:1-5`), «Novetats» cap al Control del xat (`ClosCaXat.jsx:28-31`), la IAIA i la identitat a la barra negra (T30, T43), i el rail com a calc innegociable. L'ordre «caixes sòlides, res de botons flotants» parla de les cel·les del rail plegat (`AppGridShell.css:306-309`), no és un veto general; el que frena un botó flotant és que no té espècimen i que la barra ja porta un botó rodó al centre.

#### 1.3 La troballa central: l'esquelet ja coincidix

| WhatsApp | Sóc de Poble | Què hi viu | Què falta |
| --- | --- | --- | --- |
| Xats | **Xat** | Converses, el lloc propi «{nom} (Tu)», els «Avisos» del poble i la IAIA com a contacte | La fila pròpia fixada, «Guardar» al menú de la bombolla i la insígnia de no llegits a la pestanya |
| Actualitzacions | **Mur** | El que passa al poble: publicacions, agenda i mapa, amb les píndoles que ja té. Els «canals» són els Avisos i, més avant, els comptes seguits | Res per a començar |
| Comunitats | **Pobles** | El meu poble com a comunitat (Avisos primer, grups, «Mostra-ho tot») i, davall, la resta de pobles per a explorar | Hui és un catàleg de targetes; la comunitat viu dins del Xat |
| Trucades | **Mercat** | No tenim trucades. El quart lloc és per al que la gent del poble fa cada dia a més de parlar: comprar, vendre i buscar cures | La categoria «Cures» |
| Botó verd | **Botó central de la barra** | Cosa nova de la pestanya on estàs: conversa, publicació, anunci | Hui porta a `/control`; icona i destí són decisió del Mestre |
| Tres punts | **«…» de la llista** | Seleccionar, Guardats, Configuració | Hui té una sola opció |
| Configuració | **El meu perfil** | Una sola pantalla de perfil i ajustos | Hui està repartit en huit llocs |

Conseqüència: **no cal construir una closca de quatre pestanyes**. La barra mòbil es queda com està. El que canvia és què hi ha darrere de cada porta.

En l'ordinador, el rail del Xat no es toca. Cada entrada que haja de caure («Telefonades», que no es construirà) es demana al Mestre una per una.

#### 1.4 El mapa: on va cada concepte

| Concepte de Sóc de Poble | On va | Gest | Peça que ja existix | Què falta |
| --- | --- | --- | --- | --- |
| Converses | Pestanya Xat | Un toc | `XatSection.jsx` | Insígnia a la pestanya; l'ha de publicar el tall del Xat, la barra només l'escolta |
| Lloc propi per a guardar | Fila «{nom} (Tu)» fixada dalt de Xat | Un toc; escriure-s'hi com a qualsevol xat | La fila ja es pinta al diàleg de conversa nova; l'ordre per fixat ja existix | Que estiga sempre a la vista i que tinga dades (decisió D2) |
| Guardar un missatge | «⋯» de la bombolla i «Guardar» | Dos tocs | El «⋯» ja és visible sempre en tàctil i hui només té «Copia el text» | L'opció; la nota amb origen i camí de tornada |
| Filtres de converses | Desplegable darrere de la icona | Com hui | `FiltreConverses.jsx` | Una opció «Canals» quan n'hi haja |
| Conversa nova | «+» de la fila de títol | Com hui | `DialegNovaConversa.jsx` | Res |
| La IAIA | Contacte dins de «+» | Com hui | Contacte d'ajuda fix | Res. La icona de la barra negra es queda (T30) |
| Ban de l'ajuntament | Fila «Avisos» del poble a Xat i el mateix objecte al Mur | Un toc | Canal «Avisos» amb megàfon | Alta de només lectura per a tot veí: és servidor (decisió D7). Mentrestant, el ban viu al Mur |
| Mur, agenda i mapa | Pestanya Mur amb les seues píndoles | Com hui | `MurSection.jsx` | Res |
| Mercat i cures | Pestanya Mercat | Com hui | `MercatSection.jsx` | Categoria «Cures» visible |
| Pobles i comunitats | Pestanya Pobles | Un toc | `PoblesSection.jsx`, `VistaComunitats.jsx` | El meu poble primer, amb forma de comunitat |
| Publicar | Botó central de la barra | Un toc i triar | Les cinc targetes de publicar de `/control` | Llevar les targetes sense destí; icona (decisió D3) |
| Botó «Connectar» de tota targeta | Full inferior: «Guardar per a mi» i, davall, «Enviar a…» | Un toc i triar | `/connectar` amb carpeta i abast | Presentar-lo com a full; el verb (decisió D1) |
| Perfil i configuració | Una pantalla a `/el-meu-perfil` | Avatar o «Tu» del rail | Espai de perfil amb apartats | Files d'ajust pròpies: Xats, La IAIA, Idioma, Aparença, Ajuda. Primer, l'espècimen de la fila |
| Amb qui actues | Barra negra | Com hui | `CalaixIdentitats.jsx` | Res (T43) |
| Cerca | La lupa | Com hui | `/cerca` | Res; les altres cerques són filtres de la seua llista |
| Notes com a documents | Secció Notes | Calaix o barra lateral | `NotesSection.jsx` | Res. És l'arxiu de qui vol ordenar; la gent major no l'ha de trepitjar mai |
| Comptes seguits de fora | Filtre «Canals» de Xat | Un toc | Tipus de fil `canal` | Tot (T3) |
| Sessions del compte | Configuració, fila «Dispositius enllaçats» | Un toc | Res | Capacitat de servidor. El pont entre pestanyes de `/dispositius` no és açò i no ha de portar eixe nom |
| Wiki, Disseny, Consola | Barra lateral, com hui | Com hui | Seccions actuals | Res |

#### 1.5 Un sol lloc per concepte

La regla: **una porta no és un duplicat; dos pantalles que fan el mateix, sí.**

| Concepte | On és hui | Únic lloc | Portes que hi porten |
| --- | --- | --- | --- |
| Perfil propi | 6 llocs | `/el-meu-perfil` | Avatar de la barra negra i «Tu» del rail |
| Configuració | 8 llocs | Les files de `/el-meu-perfil` | Avatar i «…» de la llista |
| El guardat | Retall a «Altres notes», connexions a «Connectats», Destacats buit | La carpeta del guardat de Notes | Fila «{nom} (Tu)», «Destacats» del rail i secció Notes: tres portes a la mateixa vista |
| Grups | 5 llocs | La llista de Xat; l'estructura, a Pobles | «Comentar» d'una fitxa |
| Xat | Xat i el xat de Dispositius | Xat | Passar coses entre aparells és «{nom} (Tu)» |
| Agenda | 4 llocs | Mur, píndola Agenda | La targeta de publicar |
| Multimèdia | 3 llocs | `/multimedia` per al que és públic; la vista del rail per al que és dels meus xats | Cap més |
| Cerca | 4 llocs | La lupa | Cap més |
| La IAIA | Icona, pàgina de nivell, contacte i fil | Conversa: el contacte. Nivell: fila «La IAIA» de Configuració | La icona de la barra negra |
| Publicar | `/control` i cada secció | El botó central | Cap més |

#### 1.6 Una paraula per concepte

Les set propostes del panell sumaven cinc noms per al lloc propi i sis verbs per a guardar. Un terme per concepte, i primer els que ja són al codi o al telèfon de la gent.

| Concepte | A pantalla | Fora de pantalla |
| --- | --- | --- |
| Quedar-se una cosa | Guardar · «Guardat» | Destacar, Enviar al Bloc de Notes, Connectar |
| Carpeta del guardat | Guardats | Connectats, Altres notes |
| Passar-ho a algú | Enviar a… | Reenvia, abast |
| Conversa pròpia | {nom} (Tu) | El meu xat, Notes meues |
| Documents | Notes | Bloc de Notes, Mas, MAS |
| Perfil i ajustos | Configuració | Control, Realitat |
| Canal oficial | Avisos | Comunicats |
| Fitxa de qualsevol cosa | Informació | Pàgina Universal |
| Visibilitat | Qui ho veu | Abast |
| Tornar a l'origen | Obri l'original | Torna al xat |
| Llocs on ho tinc | On ix açò | Enllaços entrants, mencions |
| Subscriure's | Seguir · Deixar de seguir | Fedivers, federació |
| D'un altre servidor | De fora | Node, extern |
| Sessions del compte | Dispositius enllaçats | P2P |
| Crear contingut públic | Publicar | Afig un estat |

«Connectar» continua sent el nom de la doctrina (Connexió Radical). Si el Mestre preferix conservar-lo a pantalla, aleshores la carpeta és «Connectats» i el menú del missatge també diu «Connectar». Mai barrejats.

#### 1.7 La prova: tasques en tocs

Una persona de 78 anys que només usa WhatsApp, des de l'app oberta a Xat.

| Tasca | WhatsApp | Hui | Amb la proposta |
| --- | --- | --- | --- |
| Guardar una recepta que algú ha enviat | 4 | 4, i acaba en un lloc que no ha vist mai | 2: «⋯» i «Guardar» |
| Trobar allò que va guardar | 1 i pujar amunt | 3 o més, en dos carpetes possibles | 1: fila «{nom} (Tu)» |
| Llegir el ban | 1 | 1 cap al Mur i buscar | 1 quan «Avisos» siga a la llista; mentrestant, igual que hui |
| Vore el mercat | No en té | 1 | 1 |
| Parlar amb la IAIA | 1 | 2 | 2 |
| Convidar la veïna | 3 | Impossible | 3: Configuració, «Convida un veí», compartir |
| Guardar una web a l'ordinador | No en té | Impossible | 2: botó del navegador i «Guardar» |
| Publicar un anunci | No en té | 2 i triar entre targetes mortes | 2: botó central i triar |

**Tres límits que cal dir abans de prometre «no cal aprendre res nou»:**

1. **Fotos.** El que la gent s'envia a ella mateixa són fotos i captures, i el nostre xat només envia text. El lloc propi de la primera fase és per a text i enllaços.
2. **No sona.** Sense notificacions fora de l'app, «el ban arriba» vol dir «el veu si obri l'app». Cap text de pantalla ha de dir «t'avisarem».
3. **Copiar i enganxar.** És l'únic camí del mòbil per a guardar una web, i qui només llig, contesta i reenvia no el fa. Guardar webs és, de moment, cosa d'ordinador.

#### 1.8 Pedra Seca: què es calca i què no

L'ànima de WhatsApp es conserva per **geometria i gest**, no per color.

- **Es calca:** la fila de 72 px amb avatar, dos línies i hora a la dreta; el menú de tres punts; el full inferior; «Avisos» primer; l'ordre de les quatre portes.
- **No es calca:** el verd (vetat al catàleg; l'acció és blava, `--sdp-accio`), la sanefa de fons, la capçalera clara (la Roca i el crom són foscos sempre) i les entrades pròpies de Meta.
- **No entra cap component nou sense espècimen.** Per ordre: fila d'ajust (hui `.sdp-xat-opcio` viu en producció sense espècimen), menú de tres punts únic (hui està copiat a mà en quatre llocs), full «Guardar per a mi / Enviar a…», fila fixada, fila de canal «De fora».
- **La insígnia de no llegits ja existix i és blava** (`modules.css:3700-3709`). No hi ha cap decisió de color a prendre.

#### 1.9 El que no es calca

| Peça de WhatsApp | Per què no | Què hi va |
| --- | --- | --- |
| Estats que caduquen | Sense espècimen, imatge vertical contra la regla 1:1, sense moderació, i caducar és el contrari de guardar | El Mur |
| Trucades | Zero codi i servidor de senyalització | Mercat ocupa el quart lloc |
| Botó flotant | Ja hi ha un botó rodó al centre de la barra | Eixe mateix botó |
| Píndoles al Xat | Ordre T12 | El desplegable |
| Nova difusió | Duplica | «Enviar a…» |
| Grup nou a mà | Doctrina: naixen d'una fitxa. Prohibició sense substitut: el Mestre tria què hi posa | Amagar la fila fins que hi haja moderació |

### 2. T2 · Guardar i ordenar: Raindrop i Obsidian davall de WhatsApp

#### 2.1 El model

- **Un verb:** Guardar.
- **Un magatzem:** les Notes, carpeta «Guardats». Guardar és `createNote`, que és nucli del contracte i funciona amb qualsevol backend.
- **Una porta diària:** la fila «{nom} (Tu)» dalt de Xat. És una vista en forma de conversa de la carpeta «Guardats»: cada cosa guardada és una bombolla i el compositor crea una nota curta.
- **Una regla:** una cosa guardada no es copia a dos llocs. Missatge, nota i targeta conserven identitat i procedència.

Sobre el magatzem hi ha dos opcions i dos dels tres crítics no coincidixen (decisió D2). La pantalla és idèntica en les dos; canvia on viuen les dades.

| | Vista sobre les Notes (recomanada) | Fil real de tipus `personal` |
| --- | --- | --- |
| Magatzems | Un | Dos: missatges i notes |
| Guardar amb qualsevol backend | Sí, és nucli | No, és una capacitat opcional |
| Fotos | Per la capacitat de mitjans de les notes, abans que el xat tinga adjunts | Quan el xat tinga adjunts |
| Cost | Una capacitat de lectura: llistat per data, filtrat per carpeta, amb extracte i origen. Hui el llistat remot pagina per identificador aleatori i ve sense cos ni origen (`supabase/notes.js:46`, `:55`, `:96-99`) | Una RPC idempotent i la migració F0 aplicada. El codi ja l'espera (`XatSection.jsx:849`) |
| Risc | La vista pareix un xat i no ho és: no ha de prometre marques de lectura ni respostes | Un segon bloc de notes al costat del primer |

#### 2.2 Quatre portes cap al mateix receptor

Totes acaben a la pantalla de `/connectar`, que ja mostra el que es guardarà i espera un toc. **Carregar la ruta no crea mai res: guarda un clic.** Este invariant no es pot perdre.

| Porta | On | Gest | Cost |
| --- | --- | --- | --- |
| A. Enganxar | Mòbil i ordinador | Copiar l'enllaç, obrir «{nom} (Tu)», enganxar i enviar | Depén de D2 |
| B. Des d'un missatge | Xat | «⋯» de la bombolla i «Guardar». Si el missatge és un enllaç, va a `/connectar?url=…`; si és text, naix la nota amb el missatge citat | Només client |
| C. Des d'una targeta | Mur, Mercat, Pobles | El botó de sempre obri el full: «Guardar per a mi» i, davall, «Enviar a…» | Només client; espècimen del full |
| D. Des del navegador | Ordinador | Botó «Guardar a Sóc de Poble» a la barra d'adreces d'interés | Només client, més la decisió d'aterratge (D10) |

Un detall que cal arreglar en el camí: sense sessió, el botó de `/connectar` diu «Simular Guardat» (`ConnectarSection.jsx:598-606`, `:670`). Qui arriba des del navegador creuria que ha guardat. Ha de dir «Entra per a guardar-ho» i tornar a la mateixa targeta després d'entrar; el camí de tornada ja existix (`RequireAuth.jsx:48-49`).

#### 2.3 El botó del navegador

- **Què porta:** l'adreça de la pàgina, el títol i, si n'hi ha, el text seleccionat. Són els paràmetres que el receptor ja valida: `url`, `title` i `entradilla` (`contingutExtern.js:88-96`).
- **Què no porta:** cap clau, cap usuari, res del cos de la pàgina. El mateix botó val per a tot el poble. La sessió és la del navegador.
- **Retalla abans d'enviar.** El receptor rebutja un text massa llarg, no el talla (`contingutExtern.js:72-85`). El botó es genera amb els límits de `LIMITS_EXTERN` dins, perquè no es desajusten. Una adreça de més de 2048 caràcters es rebutja sempre.
- **El receptor guarda metadades i una cita de la font**, no el cos de l'article ni cap imatge. És un marcador, no una captura.
- **On s'instal·la:** un sol lloc, `/connectar` sense paràmetres, que hui pinta un formulari per a un element desconegut. Passa a ser la casa del guardar: un camp «Enganxa ací un enllaç» i, només en pantalla ampla amb ratolí, el botó per a arrossegar. En mòbil no s'oferix.
- **On aterra.** Dins d'un amfitrió el router és en memòria i la consulta de la pàgina no arriba a l'app. Ordre de preferència: (1) l'amfitrió declara `base-path`, que ja és al contracte i manté la seua sessió; (2) la casa pròpia del node, dient que cal entrar-hi. El generador mira on és i **no oferix el botó si no hi ha aterratge**. Passar les dades pel fragment de l'adreça seria millor per a la privacitat, però és una entrada nova del contracte d'amfitrió i l'estàndard d'integració hui la nega: necessita esmena escrita.
- **Privacitat.** Amb la consulta, l'adreça guardada queda als registres del servidor que servix la pàgina. S'ha de dir.

Esquelet del botó; els tres valors entre guions baixos els posa el generador:

```js
javascript:(()=>{
  const talla=(s,n)=>Array.from(String(s||'').replace(/\s+/g,' ').trim()).slice(0,n).join('');
  const u=new URL('__NODE__/connectar');
  u.searchParams.set('url',location.href);
  u.searchParams.set('title',talla(document.title,__LIMIT_TITOL__));
  const s=talla(getSelection(),__LIMIT_ENTRADILLA__);
  if(s)u.searchParams.set('entradilla',s);
  open(u.href,'_blank','noopener,noreferrer');
})();
```

«Compartir amb Sóc de Poble» des del menú del mòbil demanaria un manifest amb destí de compartició. La PWA es va retirar per l'ADR-2026-08 i dins d'un amfitrió el manifest és seu. Queda com a decisió (D11).

#### 2.4 L'enllaç de dos caps

Per a una persona major: **una cosa guardada té dos caps. Des del que has guardat tornes al lloc d'on ha eixit. I des d'eixe lloc veus on ho tens.** Mai es diu «enllaç» i mai s'escriu cap claudàtor.

- **Cap d'anada: «Obri l'original».** Ja existix al lector de connexions (`ConnexioDetall.jsx:141-142`). Falta per al que es guarda des del xat: hui el retall naix sense origen (`retall.js:83-90`).
- **Cap de tornada: «On ix açò».** Una fila a la fitxa de qualsevol cosa i al «⋯» d'un missatge. Obri un full amb files com les de conversa. Només el que és de la persona: mai «qui més ho ha guardat» ni cap recompte, que seria un «m'agrada» amb un altre nom.
- **Qui crea l'enllaç:** el gest. Guardar, «Enviar a…» i, a l'editor de Notes, un botó «Enllaça una nota» amb un selector. El que s'escriu és un enllaç corrent a una ruta interna, que el sanejador ja deixa passar. «@» i «/» són dreceres per a qui les vulga, no el camí.
- **El missatge guardat:** recomane que siga un objecte nou dins de les connexions, no un tipus d'origen nou. Un paquet vell ignora un objecte que no coneix i, en canvi, llig com a buit un tipus d'origen que no coneix (`origenNota.js:182-192`). A més, una connexió no publica mai el cos al Mur, i un missatge guardat porta paraules d'altres. El preu: es llig i no s'edita. Si el Mestre el vol editable, decisió D4.
- **El salt exacte al missatge** és car: el magatzem de missatges és una cua contigua i saltar a un de vell deixa un forat (`XatContext.jsx:353-409`). Primera fase: «Obri l'original» obri el fil.

#### 2.5 El camuflatge

| Gest de WhatsApp | Què fa ací | Què és en realitat |
| --- | --- | --- |
| Enviar-s'ho a un mateix | Fila «{nom} (Tu)» | La safata d'entrada de les Notes |
| Destacats del rail | La mateixa vista del guardat | El marcador de Raindrop |
| Contingut multimèdia, Enllaços | Les notes amb origen de fora | La col·lecció d'enllaços |
| Reenviar | «Enviar a…» | L'abast de Connectar |
| Informació del contacte | «On ix açò» | L'enllaç entrant d'Obsidian |
| La llista pròpia en píndola | Les etiquetes de les Notes | Les col·leccions |

I d'Obsidian es queda el principi: el que guardes és teu, es pot exportar (`exportaLesMeuesDades` ja existix) i els enllaços són adreces normals, sense sintaxi pròpia. El graf no és per a l'usuari.

### 3. T3 · Fedivers i autoreproducció

#### 3.1 Abans de res: una decisió que no és meua

Dos textos vigents no diuen el mateix. El Genotip (llei 6) i l'ADR-2026-08 fixen arquitectura en línia amb Supabase autoritatiu, sense PWA ni dades de negoci al dispositiu. Les plantilles de prompt anuncien Fedivers i app nadiua amb Obsidian de model. L'acta del 2026-09-27 ho deixa pendent. No ho resolc (decisió D12). El que aporte: **les tres primeres fases de cada camí valen amb les dos lectures.** «Federació de nodes en línia, de servidor a servidor» no contradiu la llei 6.

#### 3.2 Seguir algú de fora

En gestos de WhatsApp, seguir és un **canal**: es llig i no s'hi contesta.

1. **Entrada principal:** algú t'envia l'enllaç per xat. El toques i s'obri una fitxa prèvia: nom, adreça sencera amb el domini a la vista, les tres últimes publicacions i la marca «De fora».
2. Una frase fixa: «Ningú del poble veu a qui seguixes».
3. Botó blau «Seguir».
4. El compte apareix sota el filtre «Canals» de Xat, amb una icona pròpia. **El megàfon es reserva per als «Avisos» del poble:** per a una persona major, megàfon vol dir veu oficial.
5. Dins, on hi hauria el compositor, l'avís que ja tenen els canals (`Compositor.jsx:24-30`) amb el text «Només pots llegir» i «Deixar de seguir».
6. L'única acció sobre una publicació de fora és guardar-la.

Entrada secundària: enganxar l'adreça al cercador del «+».

**Com funciona per dins**

- La lectura la fa **el servidor del node**, mai el navegador: el de fora no veu la IP del veí, i dins de WordPress mana la política de seguretat de l'amfitrió.
- Primera fase per RSS o Atom de comptes públics (Mastodon, la web d'un ajuntament, un blog), només lectura i només text.
- És una capacitat opcional, `seguiments`, **amb lectures pròpies sobre taules pròpies**. No pot arribar pel nucli del xat: un missatge exigix autor local (`2609080100_xat_v2.sql:27`) i un paquet vell pintaria el compte de fora com un canal del poble.
- Seria la primera funció de servidor del repositori. El servidor demanaria adreces escrites per l'usuari: cal limitar a https, vetar adreces internes i posar límit de mida i de temps. Per això, ADR curta abans de començar.
- Sense moderació no s'oferix «Seguir».

#### 3.3 Afegir algú de fora als contactes

Hui no hi ha llibreta: els contactes són el padró del poble, els freqüents i dos d'ajuda. «Afegir algú de fora» vol dir tres coses distintes, de menys a més cost:

| Què | Com es veu | Què cal |
| --- | --- | --- |
| **Convidar-lo a entrar** | Configuració, «Convida un veí»: «Copia l'enllaç» i «Comparteix». Qui entra apareix al padró | Només client. Aterra a la pàgina on viu l'app; sense QR de moment (demanaria una dependència nova) |
| **Seguir-lo** | Un canal «De fora», només lectura | Capacitat `seguiments` i ADR curta |
| **Parlar-hi** | Un fil directe marcat «De fora», amb sol·licitud prèvia | Identitat pública, bústia, claus, moderació i ADR nova. L'últim. I dient clar que eixos missatges no van xifrats d'extrem a extrem |

Entre veïns de dos pobles del mateix node hi ha una decisió de protecció de dades pendent: el directori no creua pobles. El cas de cures es pot servir sense creuar-lo: «Escriu-li» des d'un anunci públic.

#### 3.4 Identitat

- L'identificador públic és una adreça `@nom@domini` i, darrere, una URL canònica.
- **El domini és del node de Sóc de Poble, mai de l'amfitrió.** L'amfitrió mostra, però no és identitat. Si el domini acabara sent de l'amfitrió, «traure-ho tot fora» deixaria de ser possible.
- El domini és per a sempre: canviar-lo perd els seguidors. Cal decidir-lo abans d'exposar cap adreça (decisió D13).
- Primer pobles i entitats, que ja tenen nom llegible; les persones, més avant i amb consentiment explícit.
- Una sola font per a l'adreça pública del node, segellada en compilar i visible al manifest. Hui n'hi ha tres candidates.
- Les claus privades viuen al node. La SPA no en porta cap.

#### 3.5 Clonar llegint l'HTML

La pàgina no porta el sistema: **porta l'adreça verificable de cada peça.** La cadena té tres baules.

1. L'HTML de qualsevol amfitrió ja emet `plugin-url` (`wordpress-plugin/includes/marcatge.php:236-240`).
2. En eixa carpeta viu `sdp-release.json`, llegible sense executar res.
3. El manifest ha de dir on és tot el que cal per a reproduir. **Esta és la que falta.**

Hui el manifest porta versió, contracte d'amfitrió, node segellat i empremtes. Li falten set blocs, que caben com a claus opcionals dins de `sdp.release.v1` (el validador només llig les que coneix, `manifest.php:53-101`):

| Bloc | Què diu |
| --- | --- |
| font | Repositori, commit exacte i paquet de fonts amb empremta. No és cortesia: l'AGPL demana oferir el codi a qui usa el servei |
| llicència | Codi AGPL-3.0; contingut «sense decidir», dit així |
| esquema | Migracions, l'última, i les taules que viuen fora del repositori |
| canal | Adreça de la còpia signada i clau pública |
| guia | Guia d'arrencada i un `llms.txt` |
| llinatge | De qui ve este node |
| capacitats | Què sap fer el paquet i quina versió de contracte parla |

Tres fets trenquen hui la cadena: el canal no està publicat i la clau pública és buida; el paquet que hi ha al plugin és de desenvolupament; i el manifest que es llig des de l'HTML no va signat (només la còpia del canal). Per tant, la pantalla ha de dir «declarat», mai «verificat».

#### 3.6 Tres maneres de reproduir-se

| | Què és | Sobirania | Què falta |
| --- | --- | --- | --- |
| **Empelt** | Enxufar-se a una web amb el marcatge de tres peces. Mateix backend | Cap | Un paquet de release i el canal signat |
| **Llavor** | Plantar un node: base de dades pròpia, migracions, recompilar amb el seu backend, clau pròpia | Col·lectiva: una mancomunitat, una comarca | Un arrancador únic, els orígens fora del codi i la llicència del contingut |
| **Maleta** | Emportar-se les coses pròpies a un altre node | De la persona | Importar. Perfil i notes es poden importar des del client amb el nucli, sense capacitat nova. Les converses no s'importen: són també d'altres |

**Un node és un paquet segellat, una clau i un nom.** El backend el segella qui publica el paquet i respon del node; l'amfitrió no el declara mai. No s'obri cap selector de servidor en temps d'execució: és per on entraria el segrest de credencials. Açò demana una frase d'addenda a l'ADR del Model B i tres tancaments als paquets de release: `configura({backend})` (`host.js:66-73`), els atributs de backend de l'etiqueta (`PedraSecaEmbed.jsx:182-197`) i les llistes d'orígens cablejades, que hui són tres i no coincidixen.

**A pantalla**, una sola fila dins d'Ajuda: «Sobre este poble». Versió, de qui ve, llicència i «Fes-ne un per al teu poble», amb un botó per targeta en paraules planes («Envia-ho al meu informàtic»). No hi ha cap botó que «cree» un node: seria mentir. «Node», «llavor» i «empelt» es queden als documents.

#### 3.7 El que no s'ha de prometre

Mentre l'ADR-2026-08 diga el que diu:

- Que funciona sense connexió ni que «s'instal·la».
- Que els aparells se sincronitzen. «Dispositius enllaçats» són sessions del mateix compte.
- Que la maleta reconcilia: és una importació d'una sola volta.
- Que les actualitzacions van signades, fins que la clau existisca.
- Que el contingut es pot reutilitzar: la Wiki, l'índex de cerca i la Consola viatgen dins del paquet sense llicència.

#### 3.8 Fases

| Fase | Què | Prova d'acceptació |
| --- | --- | --- |
| F0 | Manifest ampliat, emés també pel build principal, i guia | Des de l'HTML d'una pàgina amb l'app, una persona arriba en tres salts al commit exacte i a la llicència |
| F1 | Paquet de release, «Convida un veí», «Sobre este poble» | Un tercer enganxa el marcatge en una pàgina estàtica en un quart d'hora |
| F2 | Seguir per RSS, amb ADR curta i moderació | Un veí seguix la web d'un altre ajuntament i ningú més ho veu |
| F3 | Arrancador únic, orígens com a dades, addenda del Model B | Un tercer planta un node en una vesprada seguint només el que diu la pàgina |
| F4 | Identitat pública de pobles i entitats, amb ADR nova | Un poble seguix els Avisos d'un altre |
| F5 | Contacte amb gent de fora | Només després de moderació i de D12 |

### 4. Contracte: ports i capacitats

#### 4.1 Regla zero: capacitat en dos nivells

Totes les propostes del panell deien «si falta la capacitat, el botó no es pinta». **Hui això és fals per al node propi.** `teCapacitat` només mira si el mètode existix a l'adaptador (`backendPort.js:57-59`), i l'adaptador de Supabase l'exporta sempre. Que la base no tinga la migració es descobrix en executar, amb un rebuig (`supabase/xat.js:389-397`). El botó es pintaria i fallaria.

Calen dos nivells, declarats una sola volta al port:

1. **Capacitat del paquet:** el que el codi sap fer. És el `teCapacitat` de hui.
2. **Capacitat del node:** el que la base té aplicat. Una sonda en arrancar, o el primer rebuig memoritzat, apaga la fila.

I dos regles més:

- **Compatibilitat cap avant.** Model B vol dir un backend i molts paquets incrustats de versions distintes. Tota dada nova ha de ser de les que un paquet vell ignora sense destruir.
- **Cap funció buida que fingisca suport.** Una capacitat es declara amb la forma de les dades, els errors i què es veu quan falta.

#### 4.2 Capacitats noves

Cap toca el nucli de 32 mètodes. Totes són opcionals i atòmiques.

| Capacitat | Què fa | Qui la implementa | Si falta |
| --- | --- | --- | --- |
| `guardats` | Llistat de la carpeta del guardat per data, amb extracte i origen | Adaptador de Supabase i llavor local | No es pinta la fila «{nom} (Tu)»; queda la secció Notes |
| `marquesFil` | Fixar, preferir, silenciar i arxivar un fil | Adaptador de Supabase | El filtre «Preferits» no s'oferix |
| `avisosDelPoble` | Alta de només lectura de tot veí al canal d'Avisos, administració del canal i projecció del ban. Resolt des del poble segellat al paquet, mai des del que declara l'amfitrió | Servidor | El ban viu només al Mur |
| `vincles` | «On ix açò». Primer tall: índex sobre l'origen de les notes, sense llegir el cos. El client declara els vincles com a dada; el servidor només indexa i filtra pel propietari | Adaptador de Supabase i llavor local | No es pinten «On ix açò» ni «Ja el tens guardat» |
| `seguiments` | Resoldre una adreça, seguir, deixar de seguir, llistar i llegir publicacions, amb taules pròpies | Servidor del node | No hi ha «Seguir» ni filtre «Canals» |
| `moderacio` | Bloquejar i denunciar | Servidor | No s'obri «General» ni s'oferix «Seguir» |
| `invitacions` | Un codi que, en bescanviar-lo, obri el fil amb qui ha convidat | Servidor | «Convida un veí» compartix només l'adreça |
| `dispositius` | Llistar i tancar sessions del compte | Servidor | La fila no es pinta; amb sessió de l'amfitrió, tampoc |

El nom «federació» es queda fora del contracte: és infraestructura del node, no una capacitat de client.

#### 4.3 Frontera amb l'amfitrió

| Peça | Estat | Què cal |
| --- | --- | --- |
| `base-path` | Al contracte; el plugin de WordPress no l'emet | És l'únic camí ja previst per a enllaços que es poden compartir i per a l'aterratge del botó del navegador |
| `sdp-navega` | L'element l'escolta i el reemet, però **cap mòdul l'emet** (`PedraSecaEmbed.jsx:440-454`) | Emetre'l des del router en memòria. L'amfitrió, si vol, escriu la seua adreça i torna la ruta per `ruta-inicial` |
| Idioma | `language` és una clau de configuració i hi ha `setLanguage()`; **no és un atribut de l'etiqueta** | L'app llig el `lang` del document de l'amfitrió i el posa davant del que l'usuari ha triat (`UIContext.jsx:19-28`). A la captura de Codex ix en anglés perquè el WordPress de proves és en anglés. Cal invertir l'ordre al nucli (troballa H3); un atribut propi demanaria ampliar el contracte universal |
| Sessió | La que entrega l'amfitrió és de pestanya i no es persistix (`host.js:231-240`) | Tota capacitat nova hereta el concepte neutral d'entrada de sessió, amb la matriu A cap a B, A cap a fora i tornar, i renovació d'A. És el que Codex assenyala a A2 i A3 |
| Fragment de l'adreça | No existix; l'estàndard d'integració el nega | Només amb esmena escrita |

#### 4.4 El que Sollutia ha de rebre escrit el dia dels punts d'accés

1. Les migracions aplicades i l'esquema viu igual al del repositori.
2. Un paquet de release contra el node de producció i el canal signat.
3. La tria d'enllaç profund: `base-path` o `ruta-inicial` amb `sdp-navega`.
4. Els orígens exactes, fora del codi.
5. Emissor i audiències de la sessió, i l'obligació de reinjectar-la en cada pestanya.
6. El primer recurs de la Frontissa, amb captura i traductor; hui el catàleg és buit.
7. La llista de capacitats i la versió de contracte dins del manifest.
8. L'ADR del Model B signada; hui és un esborrany que cita línies que ja no existixen.

### 5. Ordre d'obra

| Pas | Què | Cost |
| --- | --- | --- |
| 0 | **Sòl ferm.** Acreditar què té aplicat la base real i aplicar en ordre les migracions pendents | Bloqueja tota la resta |
| 1 | **Resta pura.** Llevar de `/control` les targetes sense destí, començant per «Gestoria» | Un fitxer |
| 2 | **Guardar en dos tocs.** «Guardar» al «⋯» de la bombolla; el retall cau a la carpeta única amb origen i «Obri l'original»; `/connectar` buit amb el camp d'enganxar; «Entra per a guardar-ho» | Només client, uns dotze fitxers, tres espècimens |
| 3 | **La fila pròpia.** «{nom} (Tu)» fixada, amb la capacitat que decidisca D2 | Primera capacitat nova |
| 4 | **Configuració única.** Espècimen de la fila d'ajust i files pròpies a `/el-meu-perfil` | Client |
| 5 | **El ban i el botó.** `avisosDelPoble`, insígnia a la pestanya i botó central «Publicar» | Servidor i client |
| 6 | **Ordenar, a l'ordinador.** Botó del navegador, `vincles`, «On ix açò» | Servidor i client |
| 7 | **De fora i llavor.** Manifest ampliat, «Sobre este poble», «Convida un veí»; després, seguir per RSS | F0 és barat; la resta estrena infraestructura |

Ajornat amb pla propi: el salt exacte a un missatge, els adjunts del xat, la identitat pública i el contacte amb gent de fora.

### 6. Decisions del Mestre

**Per a començar**

- **D1 · El verb.** «Guardar» a pantalla i «Connectar» com a doctrina. Recomane «Guardar»: és la paraula del cas d'ús i «connectar» ja vol dir tres coses en pantalla.
- **D2 · On viu el lloc propi.** Vista sobre les Notes o fil real de tipus personal. Recomane la vista: un sol magatzem, guardar continua sent nucli i les fotos arriben abans.
- **D3 · El botó central de la barra mòbil.** «Publicar» o la roda que porta a `/control`. Recomane «Publicar»: és el botó verd de WhatsApp sense ser flotant ni verd.
- **D4 · El missatge guardat.** De només lectura dins de les connexions, o editable amb un tipus d'origen nou. Recomane només lectura.
- **D5 · Pas zero.** Acreditar i aplicar les migracions abans de prometre cap capacitat.

**Quan toque servidor**

- **D6 · Fotos al lloc propi.** Condició per a dir «no cal aprendre res nou».
- **D7 · «Avisos» del poble per a tot veí.** I «General», només quan hi haja moderació.
- **D8 · Avís fora de l'app.** Hui no sona. Acceptar-ho i dir-ho, o obrir una ADR.
- **D9 · Què fa «Comentar».** La skill diu que obri el xat privat de l'autor; l'app diu que en naixen grups i comunitats. Cal triar abans de tocar cap rètol.

**Frontera amb l'amfitrió**

- **D10 · On aterren el botó del navegador i les invitacions.** Recomane `base-path` declarat per l'amfitrió i, si no, la casa pròpia del node.
- **D11 · «Compartir amb Sóc de Poble» al mòbil.** Demana un manifest i esmenar l'ADR-2026-08. Recomane ajornar-ho i dir que guardar webs és cosa d'ordinador.
- **D14 · Addenda del Model B** i els tres tancaments dels paquets de release.

**Doctrina**

- **D12 · Arquitectura en línia i Fedivers.** Recomane escriure «federació de nodes en línia, de servidor a servidor» en una ADR nova.
- **D13 · El domini de la identitat pública.** És per a sempre.
- **D15 · La llicència del contingut** que viatja dins del paquet.

**Neteja del rail**

- **D16 · «Novetats».** Recomane no tocar-la ara: en mòbil el rail és un panell amagat.
- **D17 · «Telefonades».** Recomane llevar l'entrada: el rètol promet una fase que no vindrà.

### 7. Auditoria adversarial del connector de Codex

#### 7.1 Veredicte

**El codi de Codex és un endoll net. L'encàrrec està resolt al banc de proves, no per a un ajuntament.**

- **Net:** el canvi són quatre regles de CSS acotades a la plantilla, tres paràgrafs de readme, una prova nova amb PHP real i una línia a `package.json`. Cap atribut nou, cap clau de backend, cap capacitat que només tinga WordPress, cap edició de `src/`. La plantilla lleva capçalera i peu de qualsevol tema perquè no crida `get_header` ni `get_footer`, no perquè amague res amb CSS. Les dos dreceres que sí que haurien embrutat (amagar el tema amb CSS global, llevar `wp_head` o `wp_footer`) les va descartar per escrit.
- **Només al banc:** la capçalera i el peu desapareixen a Studio perquè un script de WP-CLI, de fora del repositori, va reescriure el contingut de la pàgina 7 i li va posar la meta de plantilla. La plantilla ja existia des del 2026-09-29 i continua sent optativa. Ningú ha fet en un navegador el recorregut d'un administrador d'ajuntament.

Mètode: sis caçadors, un per dimensió, han deixat 61 troballes. Les 28 més greus han passat per 32 escèptics independents amb l'ordre de refutar-les. **Cap ha caigut; 18 han baixat de severitat.** Les altres 33 (9 de severitat mitjana i 24 menors) no han passat pel segon filtre, tret de cinc dels apartats 8.2 i 8.3, que han tingut refutació pròpia i també han sobreviscut.

#### 7.2 El que Codex ha fet bé

1. **El mecanisme és independent del tema.** A `/pedra-seca-demo/`, els fills del `body` són només la caixa de l'app i els scripts. Comprovat en navegador per dos caçadors.
2. **No embruta altres pàgines.** L'estil de pantalla completa només s'afig dins de la plantilla; `/sample-page/` conserva capçalera, títol i peu.
3. **`min-height:0` és correcte i està ben acotat.** A 740 per 360 la caixa mesura 360 i el document 360. El mínim de 32rem continua intacte fora de la plantilla, i la prova ho comprova en els dos sentits.
4. **El càlcul de la barra d'administració coincidix amb el nucli de WordPress** (32 i 46 píxels), i el recurs de `vh` a `dvh` està ben ordenat.
5. **Les xifres són exactes.** 48 de 48 regressions del connector i 136 casos del corredor sencer (134 passen, 2 diagnòstics heretats, cap saltada), reexecutades pels caçadors.
6. **És la primera prova del plugin amb PHP real.** Fins ara tot era anàlisi estàtica en JavaScript.
7. **Declara els límits on toca:** que la meta es va posar per WP-CLI, que no ha certificat el selector de l'editor, que no ha provat la barra amb sessió d'administrador i que el paquet és de desenvolupament.

#### 7.3 Troballes sobre el canvi de Codex

| # | Severitat | Troballa | Esmena |
| --- | --- | --- | --- |
| C1 | Mitjana | **«T1 resolt» val per a la pàgina de proves.** La meta es va escriure amb `update_post_meta` directe (`/private/tmp/sdp-codex-wp-260930/configura-demo.php:10`), sense passar ni per la validació de WordPress. L'estat que fa neta la pàgina és fora del repositori i un tercer no el pot reproduir | Un recorregut real d'administrador a Studio abans de donar-ho per bo |
| C2 | Mitjana | **En un tema de blocs, l'editor de pàgines no oferix la plantilla.** PHP la passa a l'editor, però el JavaScript del nucli 7.1.2 la ignora i només llista plantilles de bloc (`wp-includes/js/dist/editor.js:83388-83422`, `:97338-97340`). Queda l'Edició ràpida i la massiva (`class-wp-posts-list-table.php:1983-1998`). El mecanisme és heretat; de Codex és haver-ho donat per resolt. El readme ho diu en anglés i en condicional, i ni Ajustos ni l'inspector del bloc en diuen res | La més menuda: un avís a Ajustos i un text a l'inspector del bloc que diguen on es tria. La més completa: un botó «Crea la pàgina de l'app» a Ajustos, que ja naix amb la plantilla; afig superfície pròpia de WordPress i cal pesar-ho contra la doctrina d'adaptador prim |
| C3 | Menor | **El «document igual a finestra» només val si la pàgina conté únicament el shortcode.** La pàgina 7 tenia un paràgraf buit darrere; el script el va esborrar. Amb eixe paràgraf, el document fa 20 píxels de desplaçament i apareix doble barra. És el que deixa l'editor de blocs a qualsevol administrativa | Dir-ho al readme i afegir una regressió amb el contingut original |
| C4 | Menor | **L'estil del plugin s'imprimix abans que els del tema.** Una regla del tema amb la mateixa especificitat (`body.page{padding-top:80px}`) guanya per ordre i torna el marge. Simulat en viu: 80 píxels buits dalt i desplaçament. Amb Twenty Twenty-Five no passa | Dins del document propi de la plantilla, doblar la classe o marcar-ho com a important; i una regressió amb un estil de tema imprés després |
| C5 | Menor | **Les proves noves protegixen l'esquelet, no la geometria.** (a) Les assercions de marge i padding passen sense cap CSS: jsdom dona zero de valor inicial al `body`. (b) La barra d'administració, el tall de 782 píxels i l'alçada no tenen cap asserció, i són dos de les quatre regles tocades; el changelog ja promet la barra. (c) Sense PHP, les quatre proves se salten i la cadena de portes ix verda. (d) El doble de `the_content` crida la funció directament: la causa real de la fallada a Studio, un shortcode no registrat, no té regressió | Assertar el text de la regla emesa o posar al fixture un full d'estils de tema hostil; fallar en lloc de saltar quan s'exigisca PHP; un doble mínim de `do_shortcode` |
| C6 | Mitjana | **`package.json` es va escriure en lloc, sense executor ni lease** (modificació 15:58:44 sobre creació 03:08:09; cap transacció el llista). El contingut és benigne, una línia, i Codex el declara. El que importa és l'indici: `hooks-local` no confina el client de Codex en esta sessió. Ha escrit a `/private/tmp` i ha executat WP-CLI, coses que a mi el mateix hook em bloqueja | El Mestre ratifica la línia o la fa reaplicar amb lease; i comprova amb `/hooks` si el hook està actiu al client de Codex |
| C7 | Menor, sense segon filtre | **El tall «estable» de les 15:57 es va reobrir:** el readme es va tornar a escriure a les 16:09. Codex ho va anunciar a les 16:11 | Cap; queda anotat |
| C8 | Menor, sense segon filtre | **El paquet copiat a Studio és de desenvolupament** (llavor, `localhost:54321`) i ix d'un arbre amb canvis de tercers sense commit. Codex ho declara | Cap per al banc; no val per a cap amfitrió real |

#### 7.4 El que l'endoll arrossega des del 29 de setembre

Estes troballes no són de Codex. Són del plugin i del nucli que jo mateix vaig lliurar el 2026-09-29, i el banc amb Twenty Twenty-Five les amaga. Responen la segona meitat de la pregunta: **per on es cola l'amfitrió malgrat el Shadow DOM.**

| # | Severitat | Troballa | Esmena |
| --- | --- | --- | --- |
| H1 | Mitjana | **La lletra va en rem contra l'`html` de l'amfitrió** (`src/css/tokens.css:229-238`). El Shadow DOM no ho aïlla. Un tema amb `html{font-size:62.5%}` deixa el text de l'app al 62,5%: il·legible per a gent major. Passaria igual a Sollutia | Sense redisseny: dir a l'estàndard que l'arrel ha de ser de 16 píxels i avisar per consola quan no ho siga |
| H2 | Mitjana | **L'Índex de les pàgines fa portal a `document.body`** (`PageFrame.jsx:102-143`): ix del Shadow DOM i cau sense estils al document de l'amfitrió. En pantalla completa queda davall de la caixa | Fer el portal a l'arrel de l'app, com ja fan les notificacions |
| H3 | Mitjana | **L'idioma ix del `lang` de l'`html` de l'amfitrió i trepitja el que l'usuari ha triat** (`UIContext.jsx:19-28`). En un WordPress en castellà, el veí tria valencià i en recarregar torna el castellà. No mira el navegador: jo ho havia afirmat al Carril i és fals | Invertir l'ordre: configuració explícita, preferència desada, `lang` del document. Decisió del Mestre sobre el valor per defecte |
| H4 | Mitjana | **La identitat per defecte és la Torre de les Maçanes** (`marcatge.php:96-107`) i Ajustos no permet deixar-la buida. Un altre ajuntament que pose el bloc sense passar per Ajustos ix com a Gent de la Torre | Opció buida vol dir no emetre el global, com preveu l'estàndard |
| H5 | Mitjana | **Sense plantilla, l'app queda en una columna de 645 píxels** davall de la capçalera i el títol del tema, amb doble desplaçament | El mateix avís de C2 |
| H6 | Menor | **El «marcatge de tres peces» en té una quarta que només emet WordPress:** el CSS de la caixa. Qui copie les tres peces en una pàgina estàtica o a Sollutia tindrà una caixa sense alçada. El que Codex ha aprés hui (mínim zero en pantalla completa, restar les barres fixes) només és a un comentari del PHP | Una secció «La caixa» a l'estàndard d'integració i la línia de CSS al marcatge de referència |
| H7 | Menor | El plugin no emet `base-path`; la guarda de paquet de desenvolupament només viu a WordPress; el shortcode vell es mostra com a text sense avís; amb la plantilla posada, l'editor de blocs diu que la pàgina usa la plantilla per defecte; la plantilla emet dos metaetiquetes de finestra en temes de blocs | Anotats per al pla del connector |

#### 7.5 Procés

| # | Severitat | Troballa |
| --- | --- | --- |
| P1 | Mitjana | **La captura de Codex és a la zona humana i no l'hi va posar ell.** El registre del hook d'Antigravity mostra una ordre de shell sobre l'Escriptori a les 15:59:04, amb decisió «ask» i el motiu «trasllat a mà», i en el mateix segon canvia `01_produccio/` i s'ancora la captura a l'índex. No consta cap ordre del Mestre. L'alta bloqueja el tancament del torn de Codex, i bloquejarà el meu i el de la pissarra quan arriben a la comprovació |
| P2 | Mitjana | **Tres documents en ús, arxivats.** L'informe de Codex es va arxivar a les 16:20 mentre l'editava. El seu lliurament final i el prompt adversarial ja no eren a l'Escriptori a les 16:35, abans que jo acabara d'auditar-lo; a les 16:32 encara hi eren. La pissarra demanava no arxivar-lo. Els meus escèptics han perdut l'informe a mitja lectura |
| P3 | Menor, sense segon filtre | El mateix registre mostra edicions a `src/css/modules.css` i a `ConsolaSection.jsx` a les 15:58, en ple co-working, i una reconciliació del segell de skills sense lease (transacció `71b909be`). La pissarra diu que Claude es cenyix a la SPA i Codex al backend; ningú més hauria de moure `src/` mentre dura |

### 8. Crítica a l'auditoria de Codex

Informe auditat: `260930_1625_auditoria_codex`, llegit sencer per l'orquestrador a les 16:30. A les 16:35 ja no era a l'Escriptori.

#### 8.1 Veredicte

**L'auditoria és veraç, prudent i útil.** Les quatre troballes del nucli són certes, les cites de fitxer i línia són exactes i els límits estan declarats on toca. Les meues objeccions són cinc: dos severitats massa altes, una decisió humana mal marcada, un «T1 resolt» massa ample i quatre coses que una auditoria «extrema» del sistema havia de veure i no veu.

#### 8.2 Les seues troballes, una per una

Les quatre primeres han passat per un caçador i per un escèptic independents, tots dos amb lectura pròpia del codi; A1, per dos escèptics. Jo mateix he llegit `src/host.js:56-265`. Els guions de reproducció de Codex no s'han pogut executar: el hook bloqueja eixa forma d'ordre.

| Troballa | Codex | Veredicte | Matís |
| --- | --- | --- | --- |
| **A1** · Una configuració rebutjada a la cua acaba amb l'adaptador de Supabase segellat | Greu | **Certa.** Mitjana hui, perquè cap amfitrió injecta backend; greu el dia que Sollutia n'injecte un | Es queda curta en tres variants. (a) Una crida directa a `configura()` sí que llança, però l'arrencada automàtica carrega Supabase igualment: la correcció ha de viure a `arrenca()`, no només a la cua. (b) Dos entrades `configura` a la cua, amb el backend en la segona: la segona falla i no s'instal·la mai. (c) Una sessió rebutjada dins de la cua també es perd sense avís (`host.js:151-152`) |
| **A2** · La guarda d'entrada no seguix un adaptador de sessió opaca | Greu | **Certa al servei; mitjana** | La reproducció crida `creaOrganitzacio` directament. Al producte, l'únic cridador passa per `PerfilContext.jsx:458-471`, que rebutja el resultat d'A si arriba l'avís de canvi de sessió. Però eixe avís **no és al contracte**: `host.js` no l'emet en nom d'un adaptador extern. El defecte de fons és eixe, i la guarda d'`organizations.js` n'és un símptoma. La prova `organizations.test.js:107-115` simula la guarda i dona una seguretat que el camí opac no té |
| **A3** · Renovar la sessió de l'amfitrió avorta un desat legítim | Mitjana | **Certa; mitjana** | No és una descoberta: el codi ja ho declara pendent (`NotesDataContext.jsx:170-176`) i una prova ho fixa. El text no es perd sol. El que passa sempre és que l'editor es remunta a cada reinjecció; el conflicte fals necessita un desat en vol. L'informe marca `requires_human_decision: false` i la capçalera de la prova diu que el canvi necessita ordre del Mestre |
| **A4** · Un `logout` síncron vàlid fa petar `expulsaSessio` | Mitjana | **Certa; mitjana** | `host.js:256` és l'únic lloc fràgil: la resta de consumidors toleren el retorn síncron. Els dobles de `tests/host.test.js:18` i de `hostIframeAdapter.test.js:9` també petarien. Cap prova crida `expulsaSessio`. El forat és de contracte: cap document diu si `logout` ha de tornar una promesa |
| **A5** · No hi ha endoll de dades de Sollutia operatiu | Greu, de preparació | **Correcta** | La Frontissa té el catàleg buit i l'ADR del Model B contradiu la directiva actual. Coincidix amb el meu apartat 4.4 |

Cap de les quatre primeres és abastable des del connector de WordPress, que no usa la cua, ni `configura`, ni injecta ni expulsa sessió. No afecten el veredicte de T1; afecten el dia de Sollutia.

#### 8.3 El que l'auditoria no veu

| # | Severitat | Troballa | Esmena |
| --- | --- | --- | --- |
| N1 | Mitjana | **Declarar un backend que no és Supabase sense injectar adaptador no dona cap error.** `configura({config:{backendId:'wordpress', backendUrl:…}})` congela la política (`host.js:66-72`) i l'arrencada importa Supabase (`:98-100`). L'origen declarat s'afig a si mateix als permesos (`PedraSecaEmbed.jsx:314-315`). Amb un origen pur i un paquet en mode remot, qui intente entrar envia correu i contrasenya a un servidor que no és el d'autenticació. Amb una adreça amb ruta, falla amb soroll. És la cosina sense error d'A1 | A `arrenca()`, llançar si el `backendId` no és `supabase` i no hi ha adaptador. Es fa amb la correcció d'A1 |
| N2 | Mitjana | **El paquet adopta qualsevol `#root` buit del document de l'amfitrió** (`src/embed.jsx:58-80`) i hi munta una segona app sencera. Viatja dins del paquet del plugin. Una prova ho consagra com a volgut (`PedraSecaEmbed.router.test.jsx:270-289`) i l'estàndard promet el contrari. En un amfitrió fet amb React és una cursa, no un efecte segur. Pujaria a greu si la closca de Sollutia usa eixe identificador | Fer l'adopció voluntària, o no adoptar si ja hi ha un element de l'app al document; i dir-ho a l'estàndard |
| N3 | Mitjana | **Els canals pels quals es cola l'amfitrió** (troballes H1 a H6 de l'apartat 7.4). L'auditoria va mirar els ports i no l'endoll en execució dins d'un tema que no siga Twenty Twenty-Five | Les de 7.4 |
| N4 | Greu | **Sis migracions es declaren «no aplicades a cap base de dades».** Una auditoria del sistema per a rebre els punts d'accés de Sollutia ha de començar per ací: fil personal, canals, metadades i origen de les notes són paper | Pas zero de l'apartat 5 |

#### 8.4 Sobre «T1 resolt»

És l'objecció principal, i ja està detallada a C1 i C2. L'informe diu que el banc mostra la SPA sense el tema, i és cert. Però l'encàrrec parlava de la web de l'ajuntament. El que queda acreditat és una pàgina configurada per línia d'ordres; el camí d'un administrador en un tema de blocs és l'Edició ràpida, llegida al codi del nucli i mai clicada. L'informe ho reconeix als límits; el títol i el Carril («T1 resolt») diuen més del que els límits sostenen.

#### 8.5 Sobre la seua crítica al meu carril

Correcta en tot, i incorporada:

- **Identitat canònica del guardat** (apartat 2.1): un sol magatzem i cap segona còpia.
- **Aterratge independent del router en memòria** (2.3): el botó no s'oferix si no hi ha on aterrar.
- **Índex invers que respecta permisos** (2.4 i 4.2): només el que és de la persona, sense recomptes.
- **Identitat i claus al node** (3.4).
- **Codi separat de dades, credencials i identitats** (3.6).
- **L'idioma és clau de configuració i no atribut**, i el receptor del guardat desa metadades i cita, no el cos de la pàgina.
- **Els matisos de les captures:** Android i macOS separats, Comunitats sense lupa, i la biblioteca automàtica marcada com a lectura funcional.

Una cosa que ell demana i que jo porte més lluny: diu que `backendPort.js:35` comprova funcions presents i no suport real. D'ahí ix la regla de capacitat en dos nivells de l'apartat 4.1.

#### 8.6 Consens que propose per a l'orquestradora

Sis accions en què els dos informes coincidixen, per ordre:

1. **Pas zero:** acreditar i aplicar les migracions pendents.
2. **Tancar la fallada oberta de l'arrencada:** A1 i N1 amb una sola correcció a `arrenca()`, i una regressió que prove que una configuració invàlida no importa mai Supabase.
3. **Portar el senyal de sessió al contracte:** època d'entrada i avís de canvi al servei neutral. Resol A2, A3 i A4 i és requisit de tota capacitat nova.
4. **Fer el recorregut d'administrador a Studio** i posar l'avís de la plantilla a Ajustos i a l'inspector del bloc.
5. **Regressions de geometria** per a la plantilla: contingut amb paràgraf buit, estil de tema imprés després i barra d'administració.
6. **Escriure a l'estàndard d'integració** el que hui només sap WordPress: la caixa, l'arrel de 16 píxels, el `#root` reservat i l'ordre de l'idioma.

### 9. Retroalimentació de la plantilla prompt_local

1. **La pissarra naix ineditable.** El Pla compartit portava Model IA i Tokens en pendent, i el hook de Claude rebutja qualsevol edició mentre ho estiguen. He hagut d'omplir dos files d'un document que no és meu per a poder escriure al meu Carril.
2. **Un informe acabat de nàixer no admet edicions parcials.** El primer desat ha d'omplir totes les seccions. El prompt demana anotar avanços cada cinc minuts i la maquinària no ho permet sense escriure text provisional.
3. **El prompt diu «codi de Codex» i l'encàrrec de Codex en tenia dos:** el tall de WordPress i una auditoria extrema del sistema. Convé dir quin dels dos s'audita i des de quina hora.
4. **Un Preflight de veres** hauria estalviat mitja hora: on són les captures i de quina plataforma, quines ordres vigents toquen la fita, i que sis migracions no estan aplicades.
5. **«Llegiu tot el que hi ha a l'Escriptori»** inclou dos laboratoris i una carpeta humana. Un manifest del context viu seria més exacte.
6. **El context fix diu «app nadiua» amb una expressió que una porta del projecte prohibix a la Wiki.** La plantilla ordena una visió que la doctrina vigent nega; convé resoldre D12 i alinear la plantilla.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Què | Com | Resultat |
| --- | --- | --- |
| Captures | 22 imatges llegides per l'orquestrador (11) i per un lector independent (22); contrastades per un lector de Codex | Coincidixen, amb els matisos ja incorporats a 1.1 |
| Mapa del terreny | Huit lectors de només lectura, 643 crides d'eina, evidència de fitxer i línia | Base dels apartats 1.2 a 4 |
| Disseny | Set propostes independents i tres crítics adversarials (enxufabilitat, gent major i Pedra Seca, viabilitat contra el codi), 575 crides d'eina | 89 objeccions. La síntesi d'este informe és la que sobreviu a les tres crítiques |
| Porta d'enxufe | `node tooling/gates/tractor-enxufe.mjs`, executada per un lector | E1 a E4 en verd |
| Receptor del botó del navegador | `src/sections/connectar/contingutExtern.js` llegit sencer per l'orquestrador | Paràmetres i validació confirmats |
| Connector de Codex | Plantilla, marcatge, proves noves, fixture i readme llegits per l'orquestrador. Sis caçadors (1.725 crides d'eina) i 32 escèptics sobre les 28 troballes més greus | 61 troballes; cap refutada, 18 rebaixades. Veredicte a 7.1 |
| Proves del connector | `node --test` sobre els cinc fitxers del connector i el corredor sencer, executats pels caçadors | 48 de 48, i 136 casos amb 134 que passen i 2 diagnòstics heretats. Coincidix amb Codex |
| Pàgina de proves | Dos caçadors han obert `localhost:8881` al navegador integrat, amb peticions de lectura i canvis de DOM efímers a la seua pestanya | Sense peces del tema; 20 píxels de desplaçament amb un paràgraf buit; 80 píxels amb una regla de tema simulada |
| Nucli de WordPress | Lectura del WordPress 7.1.2 de Studio: editor, plantilles i Edició ràpida | L'editor de blocs no llista la plantilla en temes de blocs; l'Edició ràpida, sí |
| Troballes del nucli de Codex | Un caçador i set escèptics; `src/host.js:56-265` llegit per l'orquestrador; 46 proves de vitest existents executades | A1 a A4 certes; N1 i N2 sobreviuen a la refutació |

Tres correccions que el panell va fer al meu propi punt de partida, i que mantinc a la vista:

- Vaig escriure al Carril que el tipus de fil `personal` «ja és a la base de dades». És a una migració que es declara no aplicada.
- Vaig escriure que l'idioma era un atribut que el nucli ja llig i que, sense ell, l'app triava pel navegador. És una clau de configuració, com va corregir Codex, i l'app no mira el navegador: llig el `lang` del document.
- Vaig donar per existent l'esdeveniment `sdp-navega`. Té oient i no té emissor.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'ha executat l'app ni cap navegador: el comportament en mòbil es deduïx del codi i de la CSS. Cap camí en tocs s'ha mesurat amb una persona.
- L'estat real de la base de dades no es pot verificar des del repositori. Tot el que depén de migracions es declara com a tal.
- No s'ha llegit res de `90_arxiu_historic/`, inclòs l'annex D de l'auditoria del 2026-09-29 que ja analitzava estes captures. L'informe final de Codex es va llegir sencer a l'Escriptori abans que l'arxivaren; els cinc últims escèptics ja no el van trobar i han treballat només contra el codi.
- Este torn és de documents. No s'ha tocat `src/` ni `wordpress-plugin/`. Cap proposta ni cap esmena d'este informe està implementada ni provada.
- Ningú, ni Codex ni nosaltres, ha fet en un navegador el recorregut d'un administrador per l'Edició ràpida. La barra d'administració només s'ha emulat. El tema real d'un ajuntament no s'ha provat: tot és Twenty Twenty-Five.
- Els guions de reproducció de Codex per a A1, A2 i A4 no s'han executat; la confirmació és per lectura del camí d'execució i per les proves existents.
- Dos caçadors han obert la pàgina de proves de Studio al navegador integrat. Han fet peticions de lectura i canvis efímers al DOM de la seua pestanya; no han escrit a la base de dades ni a cap fitxer.
- De les 61 troballes, 28 tenen refutació independent i cinc més en tenen una de pròpia. Les 28 restants, quasi totes menors, no han passat pel segon filtre.
- El comportament del botó del navegador per navegador (bloqueig d'emergents, polítiques de seguretat de les pàgines) no està verificat.
- Que Mastodon servisca RSS en tots els casos, i la disponibilitat de tasques programades al servidor, no estan verificades.
- La memòria persistent de Claude no s'ha pogut actualitzar: el hook del projecte bloqueja tota escriptura fora del repositori.
- ESTAT i LEDGER són camins de governança i este torn no té lease: el relleu queda escrit ací i al Pla compartit.
- El prompt `260930_1625_prompt_codex_adversarial` afirma que este informe estava acabat i que ja havia auditat el tall de Codex. A les 16:26, quan es va escriure, l'informe era la versió 0.1.0 i l'auditoria estava en marxa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_1545_pla_implementacio_coworking]]
- [[260930_1545_prompt_claude]]
