---
type: informe
status: esborrany
description: 'Estudi de mercat de Claude per a la tasca T3: competència rural, municipal, comunitària, TPV i gestió, local-first i agents d IA, amb fonts verificades.'
tags:
  - consell
visibility: private
reflex: sdp:torn_1d1f17bf-1055-4cba-9809-c045372f9d7a:e17dcf2f-9495-46a9-a2da-a505c72d06be
---
# Estudi de mercat de Sóc de Poble: alternatives, competència i model freemium

<!-- SDP:SECTION estudi_ia.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1d1f17bf-1055-4cba-9809-c045372f9d7a:e17dcf2f-9495-46a9-a2da-a505c72d06be |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-02T15:00:49.600Z |
| Modificació | 2026-10-02T16:05:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/estudi_consell.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), subagent de la tasca T3 |
| Tokens consumits | no mesurat per l'agent |

<!-- SDP:SECTION estudi_ia.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/estudi_consell.md; SHA-256 2ff367e1f499340148bb3a8c08b18d27b100eb15eebfbbe4e831e7d6b83b8b84. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION estudi_ia.s3 -->
## Historial

2026-10-02T15:00:49.600Z: esborrany creat; contingut i verificació pendents.
2026-10-02T15:15:31.000Z: Claude completa Resultats i Fonts. Lectura de la skill `sdp-estudi-mercat`, de la Wiki (visió, pla de viabilitat, pla de subvencions, soci Sollutia), del codi de `src/sections/`, `src/data/` i del connector de WordPress; unes 40 consultes al navegador integrat en pestanya pròpia, sense sessió ni galetes acceptades. Pendent: aprovació humana.
2026-10-02T16:05:00.000Z: Claude (orquestrador) corregix la fila de la Gestoria del §2: la conciliació C43 no està endollada al producte, segons la refutació de la Gestoria 3T del mateix torn.

<!-- SDP:SECTION estudi_ia.s4 -->
## Resultats

### 0. Abast, mètode i límits

- **Data de consulta de totes les fonts web:** 2 d'octubre de 2026.
- **Marques:** (V) dada llegida a la font oficial del mateix actor en eixa data; (NV) no verificat, siga perquè la pàgina no carregava, perquè la dada no és pública o perquè ve de coneixement previ. Les xifres d'usuaris o clients són declaracions de cada empresa, no auditories.
- **Producte propi:** el que s'afirma de Sóc de Poble ve del codi i de la Wiki d'este repositori, no de cap material comercial.
- **Límits:** no he descarregat ni executat codi de cap competidor (l'apartat B de la skill, l'enginyeria inversa, queda en el que es veu a la pàgina pública). Els preus en dòlars no s'han convertit. Quan un preu és promocional, ho dic. Cap dada personal ni financera real entra en este document.
- **Verbatim de la plantilla:** no aplica. Este informe és obra pròpia de l'agent, no la resposta d'una IA externa que calga avaluar.

### 1. Resum executiu

1. **El servei d'avisos municipals ja té preu, i és baix.** Bandomovil cobra 99 €/any a un poble de menys de 500 habitants i 135 €/any fins a 1.000, i diu que el fan servir més de 1.300 ajuntaments (V). El Pla Director de Viabilitat de la Wiki proposa 300–600 €/any per a eixe mateix segment: de 2 a 6 vegades més. Sóc de Poble no pot vendre's com a «app d'avisos». Ha de vendre el que Bandomovil no fa.
2. **El que cap competidor oferix junt.** Comunitat veïnal horitzontal (xat, mur, mercat, agenda), memòria i Wiki pública, una gestoria que treballa en local sense xarxa, llengua pròpia i disseny per a gent gran, codi AGPL i un connector que s'endolla a qualsevol WordPress sense migrar dades. Els actors municipals són de dalt a baix i tancats; els lliures (Decidim, CONSUL, Mastodon, Mobilizon, Discourse) són genèrics i demanen un tècnic.
3. **Dos supòsits dels plans directors han caigut.** La pàgina oficial del Kit Digital diu que totes les convocatòries han finalitzat (V), i la finestra NGI Fediversity de l'1-8-2026 que cita el Pla Director ja ha passat. La porta realista més pròxima és **NLnet, termini el 3 de novembre de 2026 a les 12:00 CET**, amb beques inicials de 5.000 a 50.000 € i associacions admeses (V). La seua política d'IA generativa exigix declarar-ne l'ús i no paga treball generat purament per IA (V).
4. **El relat institucional contradiu l'arquitectura.** El pitch del Pla Director diu que Sóc de Poble «funciona de manera local» quan cau la fibra. L'ADR Online-First i la pàgina pública de l'App diuen que no es promet funcionament offline. Cal corregir el pitch abans de presentar-lo a cap administració o convocatòria.
5. **VeriFactu marca el calendari del TPV.** Segons l'AEAT, el RDL 15/2025 obliga les entitats de l'Impost sobre Societats a adaptar el sistema de facturació abans de l'1-1-2027, i la resta, inclosos els autònoms com el bar del poble, abans de l'1-7-2027 (V). Un TPV que emet tiquets és un sistema informàtic de facturació (SIF) i ha de complir el reglament. Holded i Quipu ja anuncien VeriFactu en tots els plans, i l'AEAT oferix una aplicació gratuïta per a qui factura poc (V). Recomanació: el TPV de Sóc de Poble naix **de comandes, no fiscal**, i exporta cap a un SIF certificat. La part fiscal és una decisió humana posterior.
6. **El freemium que encaixa és el d'Obsidian i el d'Odoo.** Obsidian és gratuït sense límits i cobra els serveis que costen diners (sincronització, publicació) (V). Odoo regala una aplicació amb usuaris il·limitats (V). Amb codi AGPL, amagar una funció darrere d'un interruptor del client no protegix res: qualsevol pot fer un fork. El que es cobra és el servei: allotjament i custòdia, IA, avisos amb notificació, TPV fiscal, suport i formació.
7. **Arquitectura: abans de més mòduls, un contracte de capacitats.** Les capacitats (què té contractat cada node) les ha de servir i signar l'amfitrió; no poden ser interruptors locals. Cada mòdul ha de declarar el seu cost (local, servidor o IA). Primeres peces de producte: avisos oficials i agenda exportable (`src/utils/ics.js` ja genera iCalendar i cap interfície el crida), i una borsa de cases i terres al mercat, perquè l'habitatge és el coll d'ampolla que reporten Holapueblo i COCEDER (V).
8. **El pla gratuït de Supabase no servix per a un node de poble.** Pausa els projectes després d'una setmana d'inactivitat i en permet dos d'actius (V). Un poble amb poc trànsit quedaria aturat. Cal pressupostar el pla Pro (des de 25 $/mes) o l'autoallotjament.

### 2. El producte hui: què hi ha de veritat al codi

| Mòdul | Estat al codi | Lectura de mercat |
| --- | --- | --- |
| Xat (`src/sections/xat`) | Real, sobre l'esquema `xat_v2` de Supabase amb RPC i RLS; directori de veïns del poble | El rival és WhatsApp. El valor diferencial és la privacitat i el directori del poble |
| Mur i agenda (`mur`, `calendari`) | Real. El calendari té vistes i fonts. `src/utils/ics.js` exporta RFC 5545, però el seu propi comentari diu que cap interfície el crida | Mobilizon i Bandomovil fan agenda. L'exportació ICS és barata i ja està escrita |
| Mercat (`mercat`) | Anuncis amb autoria. Cap pagament: la cerca de `stripe`, `bizum` i `redsys` no troba cap integració (només una paraula clau de la gestoria) | CrowdFarming ha absorbit La Colmena. Hi ha buit per a un mercat de poble sense intermediari |
| Pobles i població | Directori i mapa (OpenStreetMap, segons el readme del connector) | Base per a incidències i borsa de cases |
| Wiki de Poble | Wiki pública integrada a l'App | Cap competidor municipal ho oferix |
| Gestoria (`gestoria/nucli`) | Tractor local: classifica factures, llig PDF, valida NIF, genera CSV i XLSX trimestral i prepara el correu. Sense cap crida de xarxa. La lectura de la Norma 43 i la conciliació bancària existixen com a mòduls purs amb proves, però encara no estan endollades al tractor (verificat per la refutació de la Gestoria 3T del mateix torn) | Holded i Quipu cobren de 15 a 199 €/mes per comptabilitat al núvol. Sóc de Poble oferix privacitat radical, però no és un SIF ni una comptabilitat |
| Tractors (`tractors/nucli`) | Porta d'aprovació amb empremta SHA-256, caducitat de 90 dies i signatura WebAuthn | Cap competidor mostra res comparable: argument de confiança per a la IA |
| Connector WordPress (`wordpress-plugin`) | Enxufe 1.0.0, AGPL-3.0, shortcode i bloc, canal d'actualitzacions signat amb Ed25519, traducció DeepL opcional | BuddyBoss cobra de 199 a 699 $/any per una comunitat dins de WordPress. Sóc de Poble s'endolla sense moure les dades a WordPress |
| Adaptador Sollutia (`src/data/adaptadors/sollutia`) | Frontissa de només lectura (GET) | Model B: l'amfitrió no governa el frontend |
| Notificacions push | No n'hi ha: cap `serviceWorker` ni `PushManager` a `src` | Bandomovil viu dels avisos immediats. Mancança si es vol competir en avisos |
| Fedivers | Full de ruta. La pàgina pública diu que «hui encara no està fet» | Mastodon i Mobilizon ja hi són. Començar per ICS i RSS |
| Llegat territorial | socdepoble.net: Manifest de Poble del 17-11-2022, etiquetat amb 21 pobles de la Muntanya d'Alacant. rentonar.blogspot.com: actiu, última entrada del 30-9-2026 (V) | Un actiu que cap competidor té: xarxa humana prèvia i 30 anys de credibilitat |

### 3. Mapa competitiu

#### 3.1 Apps municipals, dinamització rural i despoblament

| Actor | Segment | Model de negoci i preu | Punts forts | Punts febles | Què aprenem |
| --- | --- | --- | --- | --- | --- |
| Bandomovil (LEMUR IDEAS S.L.) | Ajuntaments: comunicació amb el veïnat | Quota anual per cens: 99 € (0–500 hab.), 135 € (500–1.000), 182 € (1.000–1.500), 229 € (1.500–2.000), 307 € (2.000–5.000), fins a 842 € (més de 50.000). Tarifa plana d'enviaments, prova gratuïta (V) | Més de 1.300 ajuntaments (V). Bàndols, incidències, agenda amb entrades i aforament, turisme, «espai de negocis locals», xatbot municipal, ocupació rural, botó del pànic. RGPD, RD 1112/2018 d'accessibilitat, multiidioma per a llengües cooficials (V) | De dalt a baix: el veí rep. App Android pròpia per ajuntament i una app global a iOS (V). Codi tancat. No anuncia xat entre veïns | Els avisos són una mercaderia barata. No competir en preu d'avisos: oferir-los en paritat i guanyar per la comunitat |
| Línea Verde | Ajuntaments: incidències i medi ambient | Preu no públic (NV) | Més de 600 ajuntaments, més de 4,4 milions d'incidències i més de 15 anys (V). App ciutadana gratuïta, app de gestió LiVe, app AYMO de reserves, consultoria ambiental en 24 h, pla de difusió i formació contínua (V) | Vertical ambiental, preu opac | Es ven programari amb acompanyament humà (difusió i formació). L'oferta de Sóc de Poble ha d'incloure tallers presencials |
| Holapueblo | Persones que volen viure en un poble i pobles que busquen habitants | Programa per edicions (n'ha publicat cinc) amb mentoria (V). Promotors i finançament (NV) | Relat de repoblament. Informe propi sobre «la qüestió de l'habitatge en les ruralitats contemporànies» (V) | No és una eina d'ús diari. Depén de convocatòries | L'habitatge és el coll d'ampolla. Una borsa de cases i terres resol una necessitat real |
| Volver al Pueblo (COCEDER) | Assentament de població rural | Plataforma d'una entitat sense ànim de lucre de Valladolid (V). Finançament (NV) | Banc d'ofertes d'habitatge, negocis, terres i treball, mapa de recursos i itineraris (V) | Àmbit estatal, poc veïnal | Confirma la demanda d'una borsa rural i que el model associatiu funciona |
| Red PAC (antiga Red Rural Nacional) | Xarxa institucional de la PAC i de LEADER | Pública (V) | Buscador de Grups d'Acció Local, bones pràctiques LEADER (per exemple, «Comedores Responsables KM0», que connecta productors locals i menjadors) i agenda (V) | No és un producte | Canal de legitimació: presentar Sóc de Poble com a bona pràctica i trobar el GAL |
| Smart Rural / Smart Villages | Etiquetes de programes públics | Cap pàgina verificable en esta consulta (NV) | — | — | Tractar-ho com a vocabulari de convocatòria, no com a competidor |
| Grups de WhatsApp | El veïnat, ja | Gratuït per a l'usuari. Dades d'ús rural (NV) | És on ja és el poble | Sense memòria, sense directori públic, dades en mans de Meta | El rival real del xat. Per això la skill `sdp-clon-whatsapp`: si la UX no és idèntica, ningú canviarà |

#### 3.2 Participació i comunitat

| Actor | Segment | Model de negoci i preu | Punts forts | Punts febles | Què aprenem |
| --- | --- | --- | --- | --- | --- |
| Decidim | Participació institucional | Programari lliure, associació Decidim, donacions (V). Preus d'allotjament de tercers (NV) | Processos, assemblees, iniciatives, pressupostos participatius. Centenars d'organitzacions. Versió 0.32 del 3-7-2026. Acord amb la Comissió de Compromís Cívic de Nova York (V) | Massa pesat per a un poble de 300 habitants. Requerix tècnics | No reinventar els pressupostos participatius: enllaçar-hi o integrar-hi |
| CONSUL DEMOCRACY | Participació institucional | Programari lliure, fundació, patrocinadors i socis tecnològics certificats (V) | Més de 250 ciutats i organitzacions. Versió 2.5.0 del 22-4-2026. Premi WSIS Champion 2026 (V) | El mateix pes que Decidim | La figura de «Certified Tech Partner» és la plantilla per a fer de Sollutia un soci certificat, i obrir-ne més |
| Nextcloud | Núvol col·laboratiu sobirà | Subscripció Enterprise des de 100 usuaris: 71,29 €/usuari/any (Standard), 104,99 € (Premium), 204,75 € (Ultimate). L'empresa no oferix allotjament (V) | Fitxers, Talk, ofimàtica, assistent d'IA en el pla alt (V) | Mínim de 100 usuaris, pensat per a organitzacions grans | Nucli lliure i subscripció de suport és un model viable. Per a un poble, massa gran |
| YunoHost | Autoallotjament per a col·lectius | Gratuït, voluntaris, campanya de donacions 2026 (V) | Instal·la serveis en una Raspberry, un ordinador vell o un VPS (V) | Algú ha de mantindre el servidor | Camí futur per a nodes sobirans: empaquetar Sóc de Poble com a aplicació de YunoHost (viabilitat NV) |
| Discourse | Fòrums de comunitat | Pla gratuït (2 persones d'equip, 500.000 visites/mes). Pro: 100 $/mes. Business: 500 $/mes. Enterprise a mida (V) | Moderació, antispam amb IA, xat, esdeveniments, crèdits diaris d'IA per pla (V) | En dòlars i pensat per a marques | Un pla gratuït generós com a porta d'entrada, i la IA comptada en crèdits per pla |
| Mastodon | Xarxa social federada | Programari lliure, sense publicitat (V) | ActivityPub, servidors independents, moderació local (V) | Sense agenda, ni mercat, ni gestoria | Federar el Mur: compatibilitat en lloc de competència |
| Mobilizon | Esdeveniments i grups federats | Programari lliure. Allotjament professional a demanda (V) | Grups, esdeveniments, importació i exportació ICS i RSS, més de 20 idiomes (V) | Cal una instància | ICS i RSS són la federació barata, i Sóc de Poble la pot tindre ja |

#### 3.3 Petit negoci, TPV i gestió

| Actor | Segment | Model de negoci i preu | Punts forts | Punts febles | Què aprenem |
| --- | --- | --- | --- | --- | --- |
| Loyverse | TPV per a comerç i hostaleria | TPV, panell, pantalla de cuina i pantalla de client gratuïts. Complements: 5 €/mes per botiga (historial il·limitat), 5 €/mes per empleat, 25 €/mes per botiga (inventari avançat) (V) | Cap barrera d'entrada | Adaptació a VeriFactu (NV) | Nucli gratuït i complements per unitat: un freemium que el bar entén |
| Square | TPV i pagaments | 1,25 % + 0,05 € per pagament presencial amb targeta de la UE. Square per a restaurants: gratuït o 59 € + IVA/mes per punt de venda. Maquinari de 139 a 699 € + IVA (V) | Pagaments integrats | Comissió per transacció i dependència del proveïdor | Si mai cobrem pagaments, ho farà un tercer. No és el nostre negoci |
| Odoo | ERP integrat | «Una aplicació gratis» amb usuaris il·limitats. Estàndard: 14,90 €/usuari/mes (11,90 € el primer any). Personalitzat: 27,90 € (22,90 €) (V) | Tot integrat, TPV inclòs | Complexitat. Preu per usuari | «Un mòdul gratuït amb usuaris il·limitats» és el millor ganxo per a un poble |
| ERPNext / Frappe Cloud | ERP lliure | Programari lliure. Allotjament gestionat des de 5 $/mes per lloc o 40 $/mes per servidor (V) | Lliure i autoallotjable | Corba d'aprenentatge | Referència de preu per a allotjament gestionat de programari lliure |
| Holded | Comptabilitat i gestió de pimes | Plus 15 €, Bàsic 29 €, Estàndard 59 €, Avançat 99 €, Premium 199 € al mes (50 % de descompte tres mesos). Tots inclouen VeriFactu. «Gemes» activables: TPV 25 €/botiga/mes, inventari 25 €/mes, nòmines 5 €/empleat/mes. L'assessoria sòcia hi entra gratis (V) | 900.000 usuaris (V, declaració pròpia). Mòduls activables amb preu visible: és exactament l'enxufabilitat de Sóc de Poble | Núvol tancat | Copiar la mecànica de les Gemes i el seient gratuït per a la gestoria, que convertix cada assessoria en canal |
| Quipu | Facturació d'autònoms | Starter 17 €, Solution 30 €, Premium 59 € al mes (50 % de descompte tres mesos). Adaptat a VeriFactu. IA «Genius» (V) | Barat i fiscal | Només facturació i tresoreria | Preu sòl de la facturació fiscal: un TPV fiscal propi ha de costar menys o aportar més |
| VeriFactu (marc legal) | Tot sistema que emet factures | RD 1007/2023 (Reglament de SIF). RDL 15/2025: societats abans de l'1-1-2027, la resta abans de l'1-7-2027. Codi QR en totes les factures. Aplicació gratuïta de l'AEAT per a volum baix. FAQ actualitzades el 21-7-2026 (V) | — | — | Finestra de demanda: tots els bars hauran d'adaptar el TPV abans de juliol de 2027 |

#### 3.4 Local-first, sobirania i WordPress com a amfitrió

| Actor | Segment | Model de negoci i preu | Punts forts | Punts febles | Què aprenem |
| --- | --- | --- | --- | --- | --- |
| Obsidian | Notes local-first | Gratuït sense límits ni registre. Sync: 4 $/usuari/mes. Publish: 8 $/lloc/mes. Llicència comercial opcional: 50 $/usuari/any. Catalyst: 25 $ una vegada. 40 % de descompte per a entitats sense ànim de lucre. Sense telemetria (V) | «100 % finançat pels usuaris» (V) | Llicència del codi (NV) | El model que el Mestre ha triat com a referència: es paguen els serveis, no el programari |
| Anytype | Coneixement local-first | Gratuït (100 MB remots), Plus 4 $, Pro 8 $, Ultra 16 $ al mes. El fa una associació suïssa (V) | Xifrat i P2P | — | Cobrar per emmagatzematge remot, que és el cost real |
| Logseq | Notes en Markdown | Gratuït per a ús personal. La sincronització encara és BETA el 2026 (V) | Fitxers oberts | La sincronització porta anys en beta | La sincronització és difícil: confirma la decisió Online-First |
| BuddyPress | Comunitat dins de WordPress | Lliure, GPL (V) | Perfils, grups, activitat, missatges privats (V) | Integració i disseny per compte propi | Sóc de Poble no ha de competir com a connector de comunitat genèric |
| BuddyBoss | Comunitat dins de WordPress | Start 199 $/any (99 $ el primer any), Launch 399 $, Scale 699 $. Servei «fet per a tu» des de 1.999 $/any. Comissió del 2,9 % en el pla Start (V) | Més de 20.000 clients (V, declaració pròpia). App mòbil | Orientat a cursos i membres de pagament | La implantació «feta per a tu» es ven a deu vegades la llicència: la implantació del node és el producte |

#### 3.5 Agents d'IA per a petit negoci

| Actor | Segment | Model de negoci i preu | Punts forts | Punts febles | Què aprenem |
| --- | --- | --- | --- | --- | --- |
| Claude for Small Business (Anthropic) | Petit negoci | Connectors amb QuickBooks, HubSpot, Shopify, Stripe, Gusto, Canva i 25 més; tancament mensual i conciliació; tallers presencials gratuïts en ciutats dels EUA (V). Preu segons els plans de Claude (NV) | L'agent actua sobre les eines que el negoci ja té | Connectors de l'ecosistema dels EUA | La gestoria de Sóc de Poble ja concilia en local. L'aprenentatge és el taller presencial com a canal |
| Shopify Sidekick | Comerç en línia | Dins de Shopify: comença gratis i després tres mesos per 1 €/mes (V). Cost propi de Sidekick (NV) | Ordres en llenguatge natural dins del flux | Lligat a Shopify | L'assistent ha de viure dins de cada mòdul, no en un xat a banda |
| Intuit Assist | Finances de pimes (EUA) | Integrat en QuickBooks, TurboTax, Credit Karma i Mailchimp (V) | IA transversal a tota la família de productes | Mercat dels EUA | La IAIA MarIA ha de ser una capa comuna dels mòduls, amb el mateix contracte de capacitats |

### 4. Matriu de funcionalitats per segment

«No anunciat» vol dir que la funció no apareix a la llista pública del competidor; no prova que no existisca.

| Funció | Sóc de Poble hui | Bandomovil | Línea Verde | Decidim / CONSUL | Mobilizon | Holded / Quipu |
| --- | --- | --- | --- | --- | --- | --- |
| **Veïnatge:** xat entre veïns | Sí | No anunciat | No anunciat | No anunciat | No | No |
| Mur o taulell | Sí | Comunicats unidireccionals | Notícies i bàndols | Debats i propostes | Grups | No |
| Agenda | Sí; ICS escrit però sense botó | Sí, amb entrades | Esdeveniments | Sí (NV) | Sí, amb ICS i RSS | No |
| Mercat d'anuncis | Sí, sense pagaments | «Espai de negocis locals» | No anunciat | No | No | Catàleg B2B (Gema) |
| Borsa de cases i terres | No | No (ocupació, no habitatge) | No | No | No | No |
| **Comerç:** TPV | En construcció (T4) | No | No | No | No | Gema de 25 €/botiga/mes |
| Facturació VeriFactu | No | No | No | No | No | Sí, en tots els plans |
| Gestoria sense xarxa | Sí | No | No | No | No | No (núvol) |
| **Institucions:** avisos amb notificació | No (sense push) | Sí | Sí | No anunciat | Correu | No |
| Incidències | No | Sí | Sí | No | No | No |
| Participació i votació | No | «Participació ciutadana» | No anunciat | Sí | No | No |
| Memòria i Wiki pública | Sí | No | No | No | No | No |
| **Transversal:** codi lliure | AGPL-3.0 | No | No | Sí | Sí | No |
| Federació | Full de ruta | No | No | No | ActivityPub (NV) i ICS | No |

### 5. Posicionament i diferenciació

**Frase de posicionament proposada:** *Sóc de Poble és la casa digital comuna del poble: el xat, l'agenda, el mercat i la memòria, en valencià, sense anuncis, i s'endolla a la web que el poble ja té.*

Per què funciona davant del mapa:

1. **No és una app de l'ajuntament per al veí; és una eina del poble on l'ajuntament també hi és.** Bandomovil i Línea Verde són de dalt a baix. Sóc de Poble és horitzontal, i l'ajuntament hi entra com un perfil més (la ruta `ajuntament/:agentId` ja existix a `App.jsx`).
2. **No és una xarxa social.** En un poble, «xarxa social» sona a Facebook i fa por a la gent gran. El llenguatge correcte és el de servei comú: la plaça, el tauler, la botiga, l'arxiu.
3. **Memòria i llegat com a fossat.** Trenta anys d'activisme, el Manifest de Poble i una xarxa de 21 pobles etiquetats a socdepoble.net (V) no es copien amb diners.
4. **Confiança verificable en la IA.** La porta d'aprovació dels tractors (empremta, caducitat, WebAuthn) i la gestoria sense xarxa són proves, no promeses. Cap competidor mostra res així.
5. **Enxufabilitat real.** El connector de WordPress (AGPL, canal signat) permet que qualsevol ajuntament o associació amb WordPress tinga Sóc de Poble sense migrar res. És la mateixa idea de les Gemes de Holded aplicada a l'amfitrió.

Què **no** s'ha de prometre: funcionament offline (contradiu l'ADR), federació (encara no està feta), facturació fiscal (no hi ha SIF) ni «zero cost» (el servidor costa diners).

### 6. Model freemium i premium per als mòduls enxufables

**Principi:** es regala el codi i tot el que corre al dispositiu. Es cobra el que costa diners (servidor, IA, notificacions) o temps humà (implantació, suport, formació, certificació fiscal). Els preus de Sóc de Poble de la taula són **propostes per a decisió humana**; només els preus de referència dels competidors estan verificats.

| Mòdul | Nivell | Per què | Preu proposat (decisió humana) | Referència verificada |
| --- | --- | --- | --- | --- |
| Nucli veïnal: xat, mur, agenda, mercat d'anuncis, pobles, perfil, Wiki | Gratuït sempre | És la identitat i l'efecte xarxa; sense ell no hi ha poble | 0 € | Odoo regala una aplicació amb usuaris il·limitats; Discourse té pla gratuït; Mastodon i Mobilizon són lliures |
| Exportació ICS i RSS, i Fedivers quan arribe | Gratuït sempre | La interoperabilitat és part de la promesa de sobirania | 0 € | Mobilizon exporta ICS i RSS |
| Gestoria local (tractor sense xarxa) | Gratuït per a persones i associacions | Cost marginal zero i ganxo de confiança | 0 €. Servei opcional «gestoria acompanyada» (configuració, plantilla de la gestoria, suport): 5–10 €/mes | Loyverse cobra 5 €/mes per complement; Quipu Starter 17 €/mes; Holded Plus 15 €/mes |
| Avisos oficials de l'ajuntament amb notificació | Servei | Les notificacions i el suport tenen cost | Paritat amb el mercat: 99–229 €/any per a pobles de menys de 2.000 habitants | Bandomovil: 99 € (0–500), 135 € (500–1.000), 182 € (1.000–1.500), 229 € (1.500–2.000) |
| Custòdia digital del node: allotjament, còpies, domini, formació, memòria | Servei | És el producte de veritat: temps humà i infraestructura | Contracte anual per damunt dels avisos. El 300–600 €/any del Pla Director només es justifica si inclou formació i memòria | BuddyBoss ven la implantació «feta per a tu» des de 1.999 $/any; Línea Verde inclou difusió i formació |
| TPV de comandes (carta, comandes, tancament de caixa, sense valor fiscal) | Gratuït | Loyverse ja ho regala: no es pot cobrar menys que zero | 0 € | Loyverse: TPV, cuina i pantalla de client gratuïts |
| TPV fiscal VeriFactu, si es construïx o s'integra | Servei | Obliga a complir el reglament i a donar suport | 15–25 €/mes per local | Holded TPV 25 €/botiga/mes; Quipu des de 17 €/mes; Square per a restaurants 59 €/mes |
| Assistents d'IA (IAIA MarIA, menús de la Nevera, resums, redacció) | Servei amb quota | Cada consulta consumix tokens | Crèdits mensuals inclosos en la custòdia, amb límit; volum extra de pagament | Discourse inclou crèdits diaris d'IA per pla; Quipu inclou Genius AI en el pla |
| Traducció DeepL | Servei amb quota | Ja té pressupost i límits al connector | Inclosa fins al límit; volum extra de pagament | Readme del connector: límits diaris i mensuals |
| Emmagatzematge multimèdia ampliat | Servei | Cost per gigabyte | Per trams de GB | Anytype: 100 MB gratis; 1, 10 i 100 GB a 4, 8 i 16 $/mes |
| Salut «Cuidant dels nostres» (T5) | Gratuït i només local | Dades de salut: categoria especial del RGPD. No es monetitzen ni pugen al núvol | 0 € | — |
| La Compra i la Nevera (T8) | Gratuït en local; menús amb IA dins dels crèdits | Inventari al dispositiu; la IA té cost | 0 € més crèdits d'IA | Grocy (lliure) fa inventari, llista i menús i usa Open Food Facts |
| Soci protector o llicència d'entitat voluntària | Mecenatge | Sostenibilitat sense tancar res | 10 €/mes (xifra del Pla Director) | Obsidian: Catalyst 25 $ una vegada i llicència comercial voluntària de 50 $/any |

**Economia unitària orientativa.** Un projecte Pro de Supabase costa des de 25 $/mes (V) i pot servir molts pobles si el model és multi-node. Amb la quota d'avisos al preu de Bandomovil, tres o quatre pobles petits pagarien la base d'allotjament d'un any. El que no quadra sense subvenció és el temps humà de la custòdia i la formació: per això el contracte de custòdia és el producte principal.

### 7. Estratègia de captació (apartat C de la skill)

- **De dalt a baix:** ajuntaments, a través del GAL i de la Diputació, amb avisos a preu de mercat i la custòdia com a pas següent. Bandomovil demostra que l'ajuntament paga per cens; Línea Verde, que paga per acompanyament.
- **De baix a dalt:** associacions i bars, amb la gestoria local i el TPV de comandes gratuïts com a porta d'entrada.
- **La gestoria com a canal.** Holded deixa entrar gratis l'assessoria sòcia (V). Sóc de Poble pot oferir un «seient de gestoria» gratuït per a rebre el full trimestral: cada gestoria que l'usa el porta a altres clients rurals.
- **Xarxa existent:** els 21 pobles etiquetats al Manifest de Poble (V) són el pilot natural.
- **Tallers presencials.** Anthropic fa tallers gratuïts ciutat per ciutat per al petit negoci (V); Línea Verde ven formació contínua (V). En un poble, una vesprada al casal convertix més que qualsevol campanya.
- **Soci tecnològic certificat.** CONSUL té una xarxa de «Certified Tech Partners» (V). Sollutia pot ser el primer soci certificat, i el model permet sumar-ne d'altres sense perdre el control del frontend.
- **Aparador:** la Red PAC participa a Presura 2026, la fira de repoblament, del 6 al 8 de novembre (V).

### 8. DAFO de Sóc de Poble

- **(F) Fortaleses:** codi AGPL i connector de WordPress signat; valencià i disseny per a gent gran; llegat de 30 anys i xarxa de 21 pobles; gestoria que treballa sense xarxa; governança de la IA amb empremta, caducitat i signatura; Wiki pública integrada.
- **(D) Debilitats:** un sol mantenidor humà; cap pagament ni notificació push al codi; dependència actual de Supabase; preus propis per damunt del mercat d'avisos; un pitch que promet offline quan l'arquitectura no ho fa; cap client de pagament documentat al repositori (NV).
- **(A) Amenaces:** Bandomovil (més de 1.300 ajuntaments) i Línea Verde (més de 600) ja ocupen el canal municipal; WhatsApp ocupa el veïnat; Kit Digital tancat; VeriFactu per al TPV; la política d'IA de NLnet; la pausa del pla gratuït de Supabase; la protecció per drets d'autor del codi generat purament per IA (segons la nota de NLnet sobre el dret de la UE; no és assessorament jurídic).
- **(O) Oportunitats:** NLnet el 3-11-2026; Projectes Innovadors del MITECO, modalitat B per a entitats sense ànim de lucre; LEADER a través del GAL; Presura 2026; el termini de VeriFactu com a finestra de demanda dels bars; l'habitatge com a necessitat sense eina local; el buit que deixa La Colmena en convertir-se en «Mercado de barrio» de CrowdFarming; la Red CIT, premiada per la participació de les persones majors (V).

### 9. Riscos i oportunitats de finançament públic

| Font | Estat a 2-10-2026 | Lectura per a Sóc de Poble |
| --- | --- | --- |
| Kit Digital | «Las convocatorias del Programa Kit Digital han finalizado» (V) | El Pla Director de Viabilitat el cita com a prova del canal de subvencions amb Sollutia. Com a font d'ingressos per a nodes nous ja no existix, i el pla ho ha de dir |
| NLnet (fons NGI) | Termini el 3-11-2026 a les 12:00 CET. Beca inicial de 5.000 a 50.000 €. Fons visibles al formulari: Restack, CodeSupply i convocatòria oberta. Associacions admeses. Llicència oberta obligatòria. Proposta en anglés i amb paraules pròpies (V) | La millor porta a curt termini. La política d'IA generativa (v1.1, 26-1-2026) obliga a declarar l'ús d'IA amb un registre de procedència (model, dates, indicacions i eixida sense editar) i no paga resultats generats purament per IA. El LEDGER, els rebuts i les petorretes són justament eixe registre. La proposta l'ha d'escriure el Mestre, i el pressupost ha de cobrir treball humà: disseny, revisió, implantació amb el veïnat i proves (V) |
| MITECO, Projectes Innovadors per al repte demogràfic | Línia regulada per l'Orde TED/1358/2021, modificada per l'Orde TED/1074/2025. Modalitat A (entitats locals), B (entitats sense ànim de lucre) i C (empreses) (V). Dates de la pròxima convocatòria (NV) | La modalitat B encaixa amb l'associació. Cal una visió integral del problema demogràfic i respostes transferibles: el model de node enxufable ho és |
| MITECO, altres | Notícia del 9-9-2026: 20 milions per a protegir els petits municipis dels incendis forestals (V, titular); bases (NV) | Si es concreta en avisos a la població, el mòdul d'avisos hi encaixa. Cal llegir les bases abans de prometre res |
| LEADER (GAL) | Metodologia vigent; buscador de GAL a la Red PAC (V). Finestres concretes del GAL de la zona (NV; la web de la Generalitat no ha carregat) | El Pla Director ja diu que cal contactar el GAL. Ara cal fer-ho, presentant la custòdia, no el CRDT ni l'offline, que ja no són la pila |
| Supabase | Pla gratuït: pausa després d'una setmana d'inactivitat, dos projectes actius. Pro des de 25 $/mes (V) | Risc operatiu, no de finançament: cap node real en el pla gratuït |
| Drets d'autor del codi d'IA | NLnet recorda que, segons el dret de la UE, els resultats purament generats per IA sense aportació intel·lectual humana substancial no tenen protecció (V, com a cita de NLnet) | Els registres d'aprovació humana (tractors, LEDGER) reforcen l'autoria humana i, per tant, la llicència AGPL. Consulta jurídica recomanada |

### 10. Matriu d'urgència i importància

- **Urgent i important:** corregir el pitch offline; actualitzar el Pla Director (Kit Digital tancat, NGI Fediversity vençut, preus d'avisos); preparar la proposta per a NLnet abans del 3-11-2026; decidir l'estratègia de VeriFactu abans de construir cap TPV que emeta tiquets.
- **Important però no urgent:** contracte de capacitats i manifest de mòduls; botó i feed ICS; borsa de cases i terres; preparar la modalitat B del MITECO; contacte amb el GAL; preu paritari d'avisos.
- **Urgent però no important:** inscripció o presència a Presura 2026 (6–8 de novembre).
- **No urgent i no important:** pressupostos participatius propis; un fòrum genèric; pagaments integrats.

### 11. Destil·lació del Trellat (apartat E de la skill)

**1. Necessitats reals per al backend (Sollutia):**
- Avisos oficials amb rol d'ajuntament i, després, notificació push. Com que l'App viu dins d'un Shadow DOM a la web amfitriona, el service worker l'ha de registrar l'amfitrió: és una tasca del connector de WordPress i del contracte amb Sollutia, no del frontend sol. La compatibilitat de Web Push amb iOS respecte al Baseline 16.0 s'ha de verificar abans de prometre-la (NV).
- Borsa de cases, terres i traspassos com a tipus d'anunci del mercat.
- Incidències geolocalitzades sobre el mapa que ja existix.
- Feed públic ICS i RSS per poble.
- Servei de capacitats: quins mòduls de servei té cada node.

**2. Pràctiques que descartem:**
- Preu per usuari (Nextcloud, Odoo): en un poble tothom ha de poder entrar.
- Comissió per transacció (Square, el 2,9 % de BuddyBoss Start).
- Una app nativa per ajuntament (Bandomovil): Sóc de Poble és una peça web enxufable.
- Publicitat, telemetria pròpia i tancar codi per a cobrar.
- Prometre offline, federació o facturació fiscal abans de tindre-les.

**3. Canvis de rumb en la comunicació:**
- Deixar «xarxa social» i «pla de contingència offline». Parlar de «casa digital comuna del poble».
- Dir clar què és gratuït per sempre (el nucli veïnal i la gestoria local) i què és servei (custòdia, avisos, IA, TPV fiscal).
- Usar la confiança verificable (aprovacions dels tractors, gestoria sense xarxa) com a argument central davant de la gent gran i de les administracions.

### 12. Conclusions arquitectòniques i estratègiques: què es construïx primer

**Arquitectura (per ordre):**
1. **Contracte de capacitats i manifest de mòduls**, abans del TPV, la Salut o la Nevera, per a no refer-los. Cada mòdul declara `cost` (local, servidor o IA), `nivell` (lliure o servei) i `dades` (cap, personals o salut). Les capacitats les servix l'amfitrió signades; la signatura Ed25519 que ja usa el canal d'actualitzacions del connector és un precedent reutilitzable. El client només amaga la interfície. L'autoritat real és el servidor (RLS o funció de servidor). Els serveis de pagament fallen tancats; els mòduls gratuïts continuen funcionant encara que el servei de capacitats caiga.
2. **Endollar `ics.js`**: un botó «Afig al meu calendari» i un feed per poble. El codi ja està escrit i provat; és el primer pas real cap a la federació.
3. **Avisos oficials** com a tipus d'entrada del mur amb rol d'ajuntament. Primer sense push; la notificació, quan el connector registre el service worker.
4. **Mercat amb borsa de cases, terres i traspassos.**
5. **TPV de comandes no fiscal** amb exportació. La part fiscal espera una decisió humana entre tres camins: construir un SIF propi (amb les obligacions del reglament per al productor, que s'han de llegir a la secció de certificació de l'AEAT), integrar un SIF de tercers, o derivar a l'aplicació gratuïta de l'AEAT quan el volum siga baix.
6. **Salut i Nevera en local**, sense servidor. Per a la Nevera, Open Food Facts com a catàleg obert (Grocy ja l'integra) en lloc d'un catàleg privat d'una cadena de supermercats.

**Estratègia (sense codi):**
1. Actualitzar el Pla Director de Viabilitat i el de Subvencions: Kit Digital tancat, NGI Fediversity vençut, CRDT i offline retirats del pitch, preus d'avisos alineats amb el mercat.
2. Preparar NLnet abans del 3-11-2026: proposta escrita pel Mestre en anglés, declaració d'ús d'IA amb el registre de procedència, i pressupost de treball humà.
3. Contactar el GAL i preparar la modalitat B del MITECO.
4. Pilot amb els pobles del Manifest i tallers presencials.
5. Oferir a Sollutia la figura de soci tecnològic certificat, segons el model de CONSUL.

### 13. Skills proposades (Carboni i Silici)

Tinc un skill especial que ens vindria bé: munteu açò com a SKILL en `.agents/skills` per anar més ràpid el pròxim cop! **`sdp-radar-convocatories`**: una llista fixa de fonts (NLnet, MITECO, Red PAC i el GAL de la zona, BDNS) que l'agent revisa amb el navegador i bolca en una taula amb termini, import, qui pot demanar-ho, data de consulta i estat V/NV. Hui ha calgut descobrir a mà que Kit Digital estava tancat i que el termini NGI havia vençut.

Tinc un skill especial que ens vindria bé: munteu açò com a SKILL en `.agents/skills` per anar més ràpid el pròxim cop! **`sdp-verificacio-de-fonts`**: el protocol de cada xifra (URL, data de consulta, V o NV, preu promocional o no, moneda original) i de la navegació segura (pestanya pròpia, sense sessió, rebutjar galetes, cap descàrrega). Ara està repartit entre l'encàrrec i la memòria de l'agent.

### 14. Retroalimentació sobre la plantilla i la skill

- La ruta `estudi_ia` usa la plantilla `estudi_consell.md`, que està pensada per a avaluar la resposta d'una IA del Consell (Verbatim, DAFO, matriu). Un estudi de mercat propi necessita una plantilla amb Resum executiu, Mapa competitiu, Model de negoci, Riscos i Fonts amb data i estat de verificació. Proposta: una ruta `estudi_mercat` amb plantilla pròpia.
- El comentari de la plantilla diu que el nom ha de ser `YYMMDD_HHMM_estudi_[nom_ia].md`, i este document naix com a `261002_1700_informe_estudi_mercat.md`. Convé unificar la regla del nom.
- L'apartat B de la skill (enginyeria inversa: codi font, polítiques de privacitat) no diu com fer-ho sense descarregar res. Cal un procediment de només lectura.

<!-- SDP:SECTION estudi_ia.s5 -->
## Fonts

Totes les fonts web s'han consultat el **2 d'octubre de 2026** amb el navegador integrat. Estat: V = verificat a la pàgina; NV = la pàgina no ha carregat o no conté la dada.

### Fonts web

| Actor o tema | URL | Què s'hi ha verificat | Estat |
| --- | --- | --- | --- |
| Bandomovil | https://www.bandomovil.com/ | Tarifes per cens, més de 1.300 ajuntaments, funcionalitats, LEMUR IDEAS S.L. | V |
| Línea Verde | https://www.lineaverdemunicipal.info/ | Més de 600 ajuntaments, més de 4,4 M incidències, apps LiVe i AYMO | V (preu NV) |
| Holapueblo | https://holapueblo.com/ | Cinc edicions, mentoria, informe sobre habitatge rural | V (promotors NV) |
| Volver al Pueblo (COCEDER) | https://volveralpueblo.coceder.org/ | Banc d'ofertes d'habitatge, negocis, terres i treball | V |
| Red PAC | https://www.redpac.es/ | Agenda, Presura 2026 (6–8 nov.), projecte LEADER KM0 | V |
| Red PAC, LEADER | https://www.redpac.es/leader | Metodologia LEADER, buscador de GAL | V |
| Red Rural Nacional | https://www.redruralnacional.es/ | La navegació ha fallat | NV |
| Smart Rural 21 | https://www.smartrural21.es/ | La navegació ha fallat | NV |
| Smart Villages (UE) | https://eu-cap-network.ec.europa.eu/themes/smart-villages_en | Pàgina no trobada | NV |
| LEADER a la Comunitat Valenciana | https://agroambient.gva.es/ | La navegació ha fallat | NV |
| Decidim | https://decidim.org/ | Funcionalitats, versió 0.32, acord amb Nova York | V |
| CONSUL DEMOCRACY | https://consuldemocracy.org/ | Més de 250 ciutats, versió 2.5.0, WSIS 2026, socis certificats | V |
| Nextcloud | https://nextcloud.com/pricing/ | Preus Enterprise per usuari i condicions | V |
| YunoHost | https://yunohost.org/ | Projecte de voluntaris, autoallotjament | V |
| Discourse | https://www.discourse.org/pricing | Plans gratuït, Pro, Business i Enterprise | V |
| Mastodon | https://joinmastodon.org/es | Lliure, sense publicitat, ActivityPub | V |
| Mobilizon | https://mobilizon.org/ | Esdeveniments, grups, ICS i RSS, federació | V (joinmobilizon.org donava error 500) |
| Loyverse | https://loyverse.com/es/pricing | Nucli gratuït i preu dels complements | V |
| Square | https://squareup.com/es/es/pricing | Comissions, pla de restaurants, maquinari | V |
| Odoo | https://www.odoo.com/es_ES/pricing | Una aplicació gratis, plans Estàndard i Personalitzat | V |
| Frappe Cloud | https://frappe.io/cloud/pricing | Preus d'allotjament | V |
| ERPNext | https://frappe.io/erpnext | «Free and open source ERP» | V |
| Holded | https://www.holded.com/es/precios | Plans, Gemes, VeriFactu, assessoria sòcia | V |
| Quipu | https://getquipu.com/es/plan-de-precios | Plans i adaptació a VeriFactu | V |
| AEAT, SIF i VERI*FACTU | https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html | Portal, FAQ actualitzades el 21-7-2026 | V |
| AEAT, ampliació del termini | https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html | RDL 15/2025: 1-1-2027 i 1-7-2027 | V |
| AEAT, qüestions generals | https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales.html | RD 1007/2023, QR, modalitats, aplicació gratuïta | V |
| Kit Digital | https://www.acelerapyme.gob.es/kit-digital | «Las convocatorias del Programa Kit Digital han finalizado» | V |
| MITECO, Reto Demográfico | https://www.miteco.gob.es/es/reto-demografico/recursos-economicos-subvenciones.html | II Estratègia, línies d'ajudes, notícies del 9-9 i l'1-10-2026 | V |
| MITECO, Projectes Innovadors | https://www.miteco.gob.es/es/reto-demografico/recursos-economicos-subvenciones/proyectos-innovadores.html | Orde TED/1358/2021 i TED/1074/2025, modalitats A, B i C | V (dates NV) |
| NLnet, proposta | https://nlnet.nl/propose/ | Termini 3-11-2026, 5.000–50.000 €, fons i tipus de sol·licitant | V |
| NLnet, política d'IA generativa | https://nlnet.nl/foundation/policies/generativeAI/ | Versió 1.1, declaració i registre de procedència, límits del pagament | V |
| Obsidian | https://obsidian.md/pricing | Gratuït, Sync, Publish, llicències, descompte per a entitats | V |
| Anytype | https://anytype.io/pricing/ | Plans per emmagatzematge, associació suïssa | V |
| Logseq | https://logseq.com/ | Gratuït personal, Sync en beta | V |
| BuddyPress | https://buddypress.org/ | Funcionalitats, GPL | V |
| BuddyBoss | https://www.buddyboss.com/pricing/ | Plans, comissió, servei «fet per a tu», clients | V |
| Claude for Small Business | https://claude.com/solutions/small-business | Connectors, casos d'ús, tallers presencials | V (preu NV) |
| Shopify Sidekick | https://www.shopify.com/es-es/sidekick | Funcions i oferta d'inici | V (cost de Sidekick NV) |
| Intuit Assist | https://www.intuit.com/intuitassist/ | Integració en els productes d'Intuit | V |
| CrowdFarming (abans La Colmena) | https://www.crowdfarming.com/es | Redirecció des de lacolmenaquedicesi.es, «La Colmena ahora es Mercado de barrio», xifres pròpies | V |
| Grocy | https://grocy.info/ | Versió 4.7.1, Open Food Facts integrat | V |
| Supabase | https://supabase.com/pricing | Pla gratuït amb pausa per inactivitat, pla Pro | V |
| socdepoble.net | https://socdepoble.net/ | Manifest de Poble del 17-11-2022 i pobles etiquetats | V |
| El Rentonar | https://rentonar.blogspot.com/ | Blog actiu, entrada del 30-9-2026 | V |

### Fonts internes (repositori)

- `.agents/skills/sdp-estudi-mercat/SKILL.md` (protocol de l'estudi).
- `_wiki_de_poble/02_saber/pla_director_viabilitat_economica.md` (preus propis, escenaris i Kit Digital).
- `_wiki_de_poble/02_saber/pla_director_legal_i_subvencions.md` (calendari de convocatòries i pitch).
- `_wiki_de_poble/02_saber/soci_sollutia.md`, `_wiki_de_poble/02_saber/el_projecte.md`, `_wiki_de_poble/02_saber/00_visio_i_pilars.md`, `_wiki_de_poble/01_ser/02_genotip.md`.
- `README.md`, `src/ARCHITECTURE.md`, `src/sections/README.md`, `src/app/App.jsx` (rutes).
- `src/sections/gestoria/fitxes/gestoria_factures.md`, `src/sections/tractors/nucli/aprovacio.js`, `src/utils/ics.js`, `src/sections/text/pageContent.js`.
- `wordpress-plugin/readme.txt`.

<!-- SDP:SECTION estudi_ia.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
