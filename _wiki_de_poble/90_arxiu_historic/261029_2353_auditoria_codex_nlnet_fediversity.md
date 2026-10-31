---
type: informe
status: esborrany
description: Contrast verificat de la candidatura 2026-08-1a6 amb codi, arquitectura i fites de portabilitat, exportació i federació.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:714e2c09-e06a-4af6-a044-c744364f1a89
---
# Auditoria i disseny NLnet Fediversity de Sóc de Poble

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:714e2c09-e06a-4af6-a044-c744364f1a89 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T22:55:29.584Z |
| Modificació | 2026-10-29T23:29:00Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6, identitat de l'entorn; variant no exposada |
| Tokens consumits | No disponibles; no estimats ni convertits a hores |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-29T22:55:29.584Z: document creat pel circuit formal. 2026-10-29T23:20:54Z: estudi i disseny completats, amb revisió paral·lela, fonts oficials i lot propi445/445. Implementació i comunicació externa sense executar.
- `2026-10-30T23:51:38.000Z`: rebut renovat per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4), perquè el torn del rebut anterior (`sdp:torn_b3a4417e-c57f-40d5-91e3-d2d51c1d5828:6608815b-ff7a-4a56-bd6a-e8d3c9d68742`) havia caducat sense tancar-se; el contingut no canvia.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

El contrast identifica nou troballes NGI i tres lliurables tècnics que encara necessiten construcció/qualificació. Les correccions administratives i de procedència condicionen una justificació veraç. Tall inicial 22:55 UTC, ampliació final de canvis concurrents a les 23:27 UTC: IDEA-31/58 ja tenen implementació local i una pàgina editorial Fediversity existix al codi; la qualificació externa i el demostrador interactiu complet continuen pendents.

## Estratègia i Enginyeria NGI Fediversity (50.000 € · 2026-08-1a6)

### Dictamen executiu i condicions de veracitat

La millor defensa de la candidatura és demostrar que un municipi pot eixir del servei, conservar les seues dades autoritzades i tornar a funcionar en una instància independent. El repositori té un port neutral, interfície modular, Model B i exportació personal. No he trobat federació ActivityPub implementada, exportació municipal restaurable ni paquet reproduïble de l'stack complet. Dissenyar-los és treball nou; no s'han implementat en este torn.

**Tres precisions administratives prèvies.** La [pàgina oficial de Fediversity](https://nlnet.nl/fediversity/) situa l'última convocatòria en l'1 d'agost de 2026, ja tancada. El [termini del 3 de novembre a les 12:00 CET](https://nlnet.nl/restack/) correspon a Restack; no és una nova finestra Fediversity. L'expedient existent i una candidatura nova són tràmits diferents. L'ID i la fase Q&A són informació aportada pel Mestre; les fonts locals llegides no contenen un rebut del destinatari que autentique el text enviat ni l'estat actual.

La [guia de Fediversity](https://nlnet.nl/fediversity/guideforapplicants/) confirma pesos 40/30/30 i un llindar ponderat superior a 5/7 per passar la primera fase. En la segona es poden aclarir afirmacions i revisar fites/pressupost. La puntuació final, la classificació i els recursos disponibles corresponen als avaluadors. Este informe no pot assegurar un 7/7, una adjudicació ni un cobrament.

**Política d'IA: revisar abans d'usar material extern.** La [FAQ vigent](https://nlnet.nl/foundation/policies/generativeAI/faq/) establix expressament un règim transitori v1.1 per a propostes Fediversity encara en avaluació. Cal confirmar l'encaix de l'expedient i del futur acord; no deduir una exclusió automàtica ni aplicar una excepció a una candidatura nova. La [versió 1.1](https://nlnet.nl/foundation/policies/generativeAI/1.1/) exigix declarar l'ajuda en proposta/Q&A, conservar model, temps, prompts i eixides sense editar, i assumir responsabilitat humana. No admet imputar eixides purament generades com a treball humà subvencionable. La [política v2](https://nlnet.nl/foundation/policies/generativeAI/) restringix més la redacció i la producció finançada. Este document és un paper intern assistit per IA; el guió posterior requerix comprovació i autoria responsable humana abans de qualsevol ús.

L'[Office Hour oficial](https://nlnet.nl/officehour/) explica que no es finança retroactivament l'esforç anterior a la selecció i que es poden substituir tasques ja acabades per altres acordades. Per tant, la base existent és una prova de capacitat, no una factura de 50.000 €. El Mestre ha de validar amb NLnet el punt d'inici i els lliurables elegibles abans d'executar treball amb càrrec a la subvenció.

### Fonts locals, cadena de procedència i P1-23

Lectura íntegra dels dos formularis, annex cognitiu, registre de prompts i ADR; lectura del Llibre Mestre amb contrast específic de P1-23, IDEA-31, IDEA-38, IDEA-57 i IDEA-58. Els documents de gestoria s'han mantingut en lectura; cap dada privada d'estos documents s'ha enviat a cercadors.

| Font local | SHA-256 del tall auditat |
| --- | --- |
| Gestoria/Subvencions_2026/01_FORMULARI_OFICIAL_EMPLENAT_MINIMAL_SOLLUTIA.md | e39608dfb58ef69fa08545d5bd3dba163e92bb9e2fd79095c01e12993c81c8c7 |
| Gestoria/Subvencions_2026/01_FORMULARI_OFICIAL_EMPLENAT.md | 64b250c200c59c2e5000cf3643e85fa2b0c5b3d0b3df0d75fbc8f0598b965bcc |
| Gestoria/Subvencions_2026/02_COGNITIVE_ARCHITECTURE_SKILLS_EN.md | 813936a7ac8bb4cbba0f925e8c51df958e6cce36a6de024e860455bac426fc02 |
| Gestoria/Subvencions_2026/gen_ai_prompts_log.txt | 304a1f6e7fb5a8624bc65cdcc54ed1619fc0573d4bbb5e9dbb4466c09f6207bc |
| Wiki/architecture/ADR-2026-08-ONLINE-FIRST.md | e4de4cc373a4198ace166723b77e7b2e2b228adf55619a89924258c9e7749da3 |

«Gestoria/Subvencions_2026» significa ../_gestoria_de_poble/03_Projectes_Actius/Subvencions_2026 des de l'arrel del repo. «Wiki/architecture» significa _wiki_de_poble/02_saber/architecture. Les empremtes identifiquen els fitxers locals; no autentiquen què va rebre NLnet.

El formulari MINIMAL descriu una aplicació online centralitzada i manté les quatre partides originals. La federació hi apareix com a objectiu fundacional de futur (línia 127), també al formulari llarg (122–125). **No es presenta com una fita v1 ja vençuda.** L'abast de federació efectiva que ara demana el Mestre s'ha d'incorporar expressament a la revisió de fites.

L'annex cognitiu presenta NixOS, CRDT, offline-first i destil·lació autònoma com a base. El codi i l'ADR no ho acrediten: PWA i arxius locals no equivalen a replicació CRDT, i BM25 no és transcripció/destil·lació generativa. L'ADR té metadades d'esborrany i un acord narratiu anterior, més una revisió posterior d'emmagatzematge local; cal una addenda acceptada que fixe una sola interpretació. Afegir flake.nix no reconcilia per si sol l'annex.

El registre GenAI afirma conservar eixides literals, però l'Output 1 és un placeholder (línia 15). **No s'ha d'omplir amb el formulari actual fingint que és l'eixida original.** Cal preservar el fitxer i annexar una correcció datada: què falta, què es pot recuperar autènticament, model/temps comprovables i què no es conserva. El nou ús d'IA d'este estudi també necessita procedència si s'incorpora al procés. El registre extern no s'ha modificat.

La síntesi Gemini afegida al Mestre durant el treball aporta idees útils, però els seus 95/96/78/85%, la promesa de 7/7, el 100% de l'annex, la llicència uniforme CC BY-SA i la reconstrucció de l'Output 1 **no queden acreditats**. Es conserva la seua autoria i s'hi afegix esta precisió, sense esborrar el debat.

### Matriu: promés, construït i percentatge verificable

No hi ha una mètrica instrumental que permeta dir quin percentatge de les 1.000 hores està executat o és justificable. Donar un «95% construït» sense denominador seria falsa precisió. La columna percentual següent compta **només cinc checkpoints explícits de cada llista acotada**: F = comprovació local satisfeta en l'abast indicat; P = parcial; N = no trobada/no demostrada. P i N valen zero. No és acceptació de tota la partida, percentatge de codi, cobertura funcional, percentatge d'hores ni fons meritats. Les files se solapen i no se sumen.

| Partida original i compromís | Construït i evidència | Cinc checkpoints acotats | % d'esta llista avui |
| --- | --- | --- | --- |
| Anàlisi funcional i arquitectura · 160 h / 8.000 €: requisits, fluxos, rols, contingut, dades, API i allotjament | Port neutral i capacitats validades a src/data/backendPort.js:19; contracte.js:31–98,177; ADR ONLINE-FIRST i Model B; Frontissa limitada a GET. Resta traçabilitat de tots els requisits i acceptació de l'abast reconciliat. | F port/capacitats; F ADR i fronteres documentades; P reconciliació del grant/annex; N desplegament complet de referència; N contracte municipal export/import acceptat. | 2/5 = 40%; compromís cobert parcialment |
| UX i frontend · 240 h / 12.000 €: navegació, descoberta, formularis, perfils, mòbil i administració comprensible | UI modular, Pedra Seca, UniversalWorkspace, cinc diccionaris; src/components/universal/workspace/UniversalWorkspace.jsx i src/config/idiomes/. Ampliació final: fletxes i activació Apertium presents,56/56 del lot de connexió/teclat. No acredita tots els fluxos amb persones ni el servei de traducció real. | F components/espai modular presents; F diccionaris de cinc idiomes presents; P qualificació integral IDEA-58; P IDEA-31 amb servei extern real no verificat; N validació humana transversal de l'accessibilitat. | 2/5 = 40%; parcials valen0, IDEA-31/58 són concrecions posteriors |
| Backend i mòduls cívics · 440 h / 22.000 €: notícies/avisos/emergències, agenda, directori, memòria, persones/municipis, publicació/moderació | Adaptadors content/organizations/notes/xat/moderacio a src/data/supabase/index.js; filtre municipal i cursors a content.js:133,208; esquema/RLS versionats. F només acredita existència i límit client inspeccionat. | F mòduls i contractes presents; F propagació de municipi/cursor en client; N federació real amb altres programes; N exportació municipal restaurable; N ingestió oral consentida validada. | 2/5 = 40%; els tres últims són objectius de revisió, no tots obligacions v1 acreditades |
| Proves, seguretat i desplegament · 160 h / 8.000 €: compatibilitat, rendiment, seguretat, configuració i manuals, actualització/recuperació | Lot propi 445/445; suite i CI existents. SOURCE_DATE_EPOCH a Vite i proves. RLS estàtica no substituïx PostgreSQL real. Dockerfile actual només empaqueta el bot. | F lot propi de contractes/exportació personal; F control del segell temporal; N reconstrucció doble de l'stack; N instal·lador integral verificat; N actualització i restauració independent completes. | 2/5 = 40%; no certifica seguretat global |

Les peces d'UX addicionals reforcen l'accessibilitat promesa; no s'han retroprojectat com si el formulari haguera exigit literalment Apertium o les fletxes. Els tres objectius nous de backend fan visible el disseny sol·licitat ara, sense alterar el text històric enviat.

| Repte real del MINIMAL | Cinc comprovacions seleccionades i situació | % del checkpoint seleccionat |
| --- | --- | --- |
| 1 · Desplegament portable i reproduïble, exportació total (84–89) | F package-lock v3/npm ci; F SOURCE_DATE_EPOCH; N flake/locks de serveis complets; N doble build idèntic; N exportar/restaurar municipi. | 2/5 = 40% |
| 2 · Instal·lació/configuració simple: BD, permisos, Storage, correu, programadors i administració (91–96) | F instruccions manuals README:131–137; P configuració de tots els serveis; N arrencada integral d'una comanda; N doctor de serveis/correu/programadors; N administració inicial i segon operador en una màquina neta. | 1/5 = 20% |
| 3 · Multi-municipi flexible amb dades i administració separades (98–103) | F filtre/cursor de municipi en client; F membres/rols/RLS presents en SQL; N prova amb dos municipis en PostgreSQL real; N export/import sense contaminació; N administració inicial independent validada amb persones. | 2/5 = 40% |
| 4 · Actualització segura, còpia/restauració, manteniment i accessibilitat (105–110) | F migracions versionades; F mecanisme d'exportació personal provat; N restore integral+actualització amb dades; N rollback validat de codi i BD; N recorregut accessible humà complet. | 2/5 = 40% |

La simple existència d'una instrucció o un filtre és el checkpoint acotat que s'indica; no equival al resultat complet del repte. Ni este recompte ni els milers de proves d'altres torns permeten adjudicar una nota externa.

### A · ActivityPub i WebFinger municipal: contracte i implementació proposats

**Frontera:** src/data/activitypub.js seria un mòdul pur de DTO, capacitat/estat i lectura des del client. Les rutes HTTPS, claus, signatura, inbox i cua de lliurament han de viure en servidor. Supabase de Sóc de Poble continua sent font de veritat darrere del port; Sollutia manté Model B amb Frontissa GET. Un servei de federació additiu requerix ADR, contracte i proves; no injecta un altre backend al client.

La [recomanació ActivityPub](https://www.w3.org/TR/activitypub/) distingix API client-servidor i federació entre servidors; publicar un JSON de descobriment no prova la segona. [WebFinger, RFC 7033](https://www.rfc-editor.org/rfc/rfc7033) aporta el descobriment HTTPS/JRD. El [vocabulari ActivityStreams](https://www.w3.org/TR/activitystreams-vocabulary/) aporta tipus d'actor, objectes i col·leccions. La disposició següent és una proposta pròpia, no codi existent:

| Ruta proposada | Contracte verificable |
| --- | --- |
| /.well-known/webfinger?resource=acct:la-torre-de-les-macanes@socdepoble.org | application/jrd+json; subject exactament canònic, aliases controlats, link rel=self de tipus application/activity+json cap a l'actor. Recurs desconegut 404; cap reflexió arbitrària d'URL. |
| /ap/municipis/{id-estable} | Actor Organization municipal amb id HTTPS estable, preferredUsername registrat, name/url/icon públics, inbox, outbox, followers i clau pública. Service es reserva per a un servei com IAIA, sense fingir una persona. El slug del WebFinger pot canviar amb alias; la identitat no depén del nom visible. |
| /ap/municipis/{id}/outbox i pàgines | OrderedCollection i OrderedCollectionPage amb cursors estables, ordre documentat per seqüència i límit; orderedItems d'activitats Create/Update/Delete amb objectes Note/Article/Event. No només una llista de textos sense activitat. |
| /ap/objectes/{id-estable} | Representació pública amb attributedTo, published/updated, llengua, URL canònica i autoria; retirada amb política documentada i Tombstone quan corresponga. Negociació d'Accept JSON-LD/ActivityPub i HTML, Vary i cache coherents. |
| /ap/municipis/{id}/inbox | Recepció server-to-server autenticada, moderada i idempotent. Followers/Follow/Undo/Accept, registre de lliurament i reintents durables; cap sessió de client ni clau privada en la SPA. |

El servidor/reservador de rutes ha de respondre abans del fallback HTML de la SPA; un 200 amb index.html no és un WebFinger vàlid. Identitats de domini i TLS s'han de conservar o migrar amb un procediment explícit; portar les dades a un altre domini no trasllada automàticament tots els seguidors.

Bans/notícies: Note curt amb enllaç canònic; Article complet quan el receptor el suporte. Agenda: Event amb dates/zona horària, localització pública autoritzada i URL. No federar contingut privat, coordenades sensibles, membres ni adjunts personals. Edició i baixa generen Update/Delete amb id estable, respectant que un receptor pot haver-ne fet còpies.

**Interoperabilitat per perfil, no una etiqueta genèrica.** La [documentació Mastodon](https://docs.joinmastodon.org/spec/activitypub/) tracta Note com a objecte principal i converteix Article/Event amb limitacions; Service es mostra com a bot. Cal validar el perfil Organization real i la presentació. La [documentació Mobilizon](https://docs.mobilizon.org/5.%20Interoperability/1.activity_pub/) utilitza Event amb extensions, Group i subscripcions d'instància per relay. Un Event amb Place aïllat no acredita interoperabilitat completa. Primer spike amb versions fixades: seguir l'actor i veure Note/Update/Delete en Mastodon; veure Event i canvis/cancel·lació en Mobilizon. Si el segon necessita Group/relay, afegir un perfil complementari documentat o acotar l'entrega; no afirmar compatibilitat abans de la prova.

Persistència proposada: registre d'actors/àlies, objectes públics i versió de projecció; outbox transaccional amb la publicació; activitats rebudes deduplicades; subscripcions; treballs de lliurament amb intents, termini i estat terminal. L'activitat pública conserva referència al municipi i al contingut font. Reintentar no duplica publicacions. Una fallada d'un servidor remot no invalida la publicació local.

Seguretat defensiva d'acceptació: autorització municipal abans de publicar; validació d'autoria i identitat de la clau, integritat i caducitat de missatges, protecció de repeticions; resolució remota amb control de destinacions i límits; HTML sanejat, mida/temps/quota limitats, bloqueig i retirada moderada. Les claus privades són estat protegit de servidor, amb rotació/còpia privada; mai en exportació Open Data ni Nix store. No es documenten procediments d'explotació ni es proven tercers.

Proves futures: fixtures AS2/WebFinger positives i errors; comprovació de tipus/headers/paginació; publicació només pública; Update/Delete; deduplicació/reinici de cua; permisos de dos municipis; proves d'integració en servidors de laboratori controlats i versions enregistrades. Una prova amb fetch fals acredita el contracte; la captura local interoperable acredita el flux. Estes proves encara no existixen per a esta funcionalitat.

### B · Exportació total municipal: tres contractes i un retorn demostrat

**Base real:** src/data/supabase/compte.js:94 exporta dades de la persona amb captura/revalidació de sessió. La migració 2610241410_exporta_dades_moderacio.sql usa auth.uid(); exclou bytes dels adjunts. No és exportació total d'un municipi. El camp federacio_no_versionada d'eixa migració és introspecció de dades remotes no versionades, no federació ActivityPub.

Cal separar tres productes amb permisos diferents:

| Producte | Contingut i accés |
| --- | --- |
| Open Data públic del poble | Només dades publicables i amb drets de redistribució compatibles: notícies, agenda, directori institucional, memòria cultural consentida, configuració pública. Descàrrega pública estable, sense membres/contactes privats, secrets ni claus E2EE. |
| Portabilitat de la persona | Contracte existent d'exportació personal; continuar separat, amb sessió i abast propis. |
| Migració administrativa del municipi | Paquet protegit i autoritzat del tenant: configuració portable, objectes i referències necessaris, permisos traslladables amb mapa d'identitats, còpia d'actius autoritzats. No habilita llegir xats privats o claus E2EE per ser administrador municipal. Secrets i credencials es provisionen separadament. |

**Drets:** el codi declara AGPL-3.0-or-later; les dades tenen drets independents. src/components/universal/drets/llicencies.js:29 establix CC BY-NC-SA 4.0 per a notes noves. No es pot assignar CC BY-SA a tot el corpus automàticament. L'exportador conserva autor, llicència per element i procedència; deixa fora del conjunt obert allò sense autorització compatible i explica omissions. La migració privada autoritzada preserva els drets originals. Aprovar amb els titulars quines dades municipals poden ser CC0/CC BY abans de dir «tot Open Data». El mateix filtratge s'aplica a fotos, entrevistes, veu i traduccions.

src/data/exportaMunicipiOpenData.js seria la façana de sol·licitud/seguiment/descarrega; el servidor aplicaria permisos, snapshot i projecció versionada sense confiar en un tenant enviat pel navegador. Exportació pública pot generar-se asíncronament i servir-se com a artefacte verificat; migració privada requerix revalidació d'identitat, abast i caducitat del lliurament.

Paquet proposat, sense imposar un nou format exclusiu:
~~~
manifest.json
schema/version.json
municipi/configuracio_publica.jsonld
dades/noticies.jsonld
dades/agenda.jsonld
dades/directori.jsonld
dades/memoria.jsonld
markdown/{id-estable}.md
actius/{sha256}.{extensio}
drets/atribucions.json
~~~

manifest.json fixa versió d'esquema/exportador, municipi, instant de snapshot, fonts, criteri d'inclusió/exclusió, recompte per tipus, llista ordenada de fitxers, mida, SHA-256 i resultat complet/incomplet. El manifest no inclou un hash circular de si mateix: el paquet publica una empremta externa del manifest; una signatura opcional acredita origen, el hash sol només integritat. Els recursos JSON-LD tenen context versionat, IDs estables, llengua, dates, autoria i llicència. Markdown és una projecció llegible amb referència a l'ID; no pretén ser una rèplica sense pèrdues de tots els models.

Snapshot coherent: transacció consistent per metadades, inventari immutable d'actius amb mida/hash i comprovació de versions. Si un actiu canvia durant l'extracció, repetir o declarar fallada; no retornar «complet». Ordre per ID estable, serialització canònica fixada, timestamps de fitxers/ZIP deterministes i mateix snapshot = mateix paquet. Un generat_al de l'hora real fora del contingut determinista o fixat al snapshot; no usar ara() en cada fila. Incloure totes les pàgines, relacions, dates i actius elegibles, amb cancel·lació i límits per a mòbil.

**Prova que tanca el vendor lock-in:** exportar municipi A → verificar manifest → importar en una instància neta → comparar IDs, recompte, relacions, hashes dels actius, continguts i permisos → obrir-lo sense el proveïdor original. No n'hi ha prou amb descarregar JSON o fer còpia SQL. Un administrador diferent ha de repetir-ho amb un manual.

Importador proposat amb dry-run, negociació d'esquema i errors accionables: valida hashes/mides, rutes segures, tipus i referències, límits d'arxiu i llicències; mostra mapa d'identitats i exclusions, no sobreescriu permisos en silenci. El mapa requerix vinculació verificada amb les identitats del destí: coincidir en UUID o portar un rol en el paquet no atorga autoritat. Comptes desconeguts inactius i privilegis només amb autorització explícita del destí. Els actius immutables es carreguen i verifiquen abans; la transacció PostgreSQL publica les metadades i referències. Storage no participa automàticament en eixa transacció: cal recuperació i neteja d'orfes després de fallades. La promoció autoritzada i els reintents són idempotents. La baixa/retenció i la política de còpies s'apliquen també als paquets privats.

Proves futures: dos municipis sintètics amb contingut públic/privat i relacions; absència del tenant B; llicències no obertes excloses del paquet públic; actiu canviat/mancant, paginació completa, format desconegut i manifest alterat; determinisme amb el mateix snapshot; round-trip en PostgreSQL/Storage reals de laboratori. La prova SQL estàtica actual no acredita açò.

### C · Nix, stack complet i instal·lació verificable

**Suport parcial existent:** package-lock.json v3 i README amb npm ci; SOURCE_DATE_EPOCH ja es llig a vite.config.js:52–57, vite.standalone.config.js:599–604,635 i vite.modul.config.js:322, amb proves a src/config/versio.test.js:79–109. No s'ha de tornar a descriure com absent. No s'ha trobat flake.nix/flake.lock ni mòdul NixOS; Dockerfile actual només copia bot/, usa una etiqueta Node20 mutable i instal·la dependències sense el lock del projecte. No representa l'stack de la plataforma.

Un [flake](https://nix.dev/concepts/flakes) fixa entrades/eixides i el lock n'identifica revisions; açò ajuda però no garantix igualtat de bytes. [SOURCE_DATE_EPOCH](https://reproducible-builds.org/specs/source-date-epoch/) normalitza el temps de la font. Calen, a més, entrades congelades, entorn controlat i comparació empírica.

Disseny proposat de release:
~~~
flake.nix / flake.lock
  packages.web
  packages.wordpress-plugin
  packages.federation
  apps.install / apps.doctor / apps.verify-export
  nixosModules.socdepoble
  checks.contractes / checks.restore / checks.reproducibilitat
~~~

És un contracte d'eixides, no un flake executat ni hashes inventats. Primer target Linux x86_64 de referència; ARM es qualifica separadament. Les entrades fixen nixpkgs, Node compatible amb engines, dependències npm/lock i artefactes dels serveis. Font exacta d'un commit/export manifest, sense dates del rellotge ni secrets; SOURCE_DATE_EPOCH deriva de la revisió publicada i es valida com a enter. No s'usa un arbre de treball brut com a release implícita. CI ha d'alinear Node20 del workflow sdp_lock_ci amb la versió compatible que es fixe.

**Stack requerit:** SPA/Web Component, proxy/TLS/rutes estàndard, PostgreSQL amb migracions/RLS/RPC, Auth, Storage, Realtime i les funcions Edge necessàries; correu SMTP, programadors, administració inicial, còpies, restauració, monitoratge mínim i servei ActivityPub quan s'aprove. Un Postgres aïllat no implementa l'API Supabase. Primer referència autoallotjada amb la mateixa semàntica Supabase; un backend diferent necessita ADR i kit de conformitat complet. Revisar extensions/versions/disponibilitat de cada servei abans de comprometre la matriu d'allotjament.

Dos perfils explícits: municipi en servei existent Supabase amb limitacions publicades; instància completament autoallotjada validada. La prova de sobirania completa correspon al segon. Un Dockerfile multi-stage alternatiu fixaria imatges per digest, toolchain i lock, usuari de runtime sense privilegis i només artefactes necessaris; Compose declararia els mateixos serveis. NixOS és el lliurable prioritari de portabilitat; no prometre dues plataformes productives sense costificar-les.

Interfície futura d'una comanda: nix run .#install -- --config municipi.toml, sobre una release fixada i prerequisits documentats. Separar --check/pla de l'aplicació; validar recursos, dominis, TLS, correu, permisos, Storage, migracions, còpies i primera administració. Idempotència, logs sense secrets, reprendre després d'una fallada i cap mutació parcial presentada com a èxit. Les credencials es creen fora del Nix store i no es publiquen en repositori/manifest. Una comanda no elimina requisits DNS/SMTP ni permisos de l'operador.

Prova de reproduïbilitat: dos runners nets, mateixa revisió/locks/epoch/arquitectura; comparar hashes del paquet web, connector i servei publicable, investigar diferències i conservar logs/SBOM. La BD amb dades vives no té per què ser byte-idèntica: es valida amb snapshot i restauració lògica. Prova operativa separada: màquina nova → doctor → alta municipal → correu de prova → publicació/Storage/Realtime → còpia → actualització → restauració. Còpia prèvia i compatibilitat d'esquema abans d'un rollback; revertir un binari no desfà una migració destructiva.

AGPL declarada no basta per al paquet: incorporar text complet de llicència (LICENSE actual és un avís curt), fonts corresponents, SBOM, atribucions i llicències de dependències/fonts. Les claus i dades personals no entren en el build. Això reforça el mèrit tècnic sense afirmar una certificació legal.

### Cognitive Playground acotat i honest

iaiaLocal.js és recuperació extractiva BM25 en JavaScript amb corpus filtrat i atles; és una peça real que pot funcionar sense inferència generativa. Les skills de desenvolupament i el bot amb proveïdor extern no demostren un pipeline municipal autònom ni cost total zero. [ Proposa Card ] és una via de proposta editorial; no acredita transcripció de veu, verificació factual o publicació sense supervisió.

Proposta finançable a negociar: pilot cultural menut amb fonts autoritzades, text o transcripció revisada, fragment/cita amb procedència, targeta estructurada, revisió d'una persona i publicació explícita. Una proposta no publica ni canvia el corpus fins a l'aprovació. Emmagatzemar autorització, autoria, llengua, llicència i decisió editorial; permetre rectificació/retirada. Memòria oral amb dades personals necessita una decisió específica abans de difondre-la.

Demo de BM25: mateix corpus públic local, consulta i fonts visibles, cap crida d'inferència; mesurar p50/p95 en dispositius identificats. No promesa universal <5 ms ni «zero HTTP»: la càrrega inicial del corpus o un transport poden tindre xarxa. Comparar recuperació amb una llista de preguntes/absències revisada, sense confondre una frase plausible amb una resposta exacta. Si s'experimenta amb IA generativa, és optativa, desactivable i condicionada a l'abast/política que NLnet accepte; el flux manual ha de funcionar complet.

### Pla econòmic revisable: 1.000 h / 50.000 €

La distribució original es conserva. És **una estimació de treball futur proposat**, pendent d'acord i de competència/capacitat humana assignada; no són hores consumides ni subvenció meritada. IDEA-38 (cinc mòduls 10/12/10/10/8 mil €) és una agrupació interna posterior: cal correspondència escrita amb estes quatre partides, sense doble comptatge.

| Partida | Distribució futura proposada | Acceptació i valor aportat |
| --- | --- | --- |
| Anàlisi/arquitectura 160 h · 8.000 € | 40 h reconciliació i traçabilitat; 40 h dades/export/import/drets; 40 h federació i spike d'interoperabilitat; 40 h mapa de serveis/Nix i sostenibilitat | Abast acceptat, ADR additiva, models/esquemes, versions de laboratori i decisions de risc. No retribuïx retroactivament el port existent. |
| UX/frontend 240 h · 12.000 € | 60 h recorregut de migració/exportació accessible; 55 h qualificació/deltes de teclat/focus IDEA-58; 45 h autoallotjament/qualificació de traducció lliure IDEA-31; 40 h demostrador interactiu EN/CA; 40 h flux cultural i manuals d'ús | Recorreguts amb persones i teclat/lector, descàrrega entenedora, flux manual de proposta. Rebasar segons el codi ja construït, sense pagar-lo retroactivament; revisar prioritats si Apertium no cobrix el parell lingüístic triat. |
| Backend/cívics 440 h · 22.000 € | 160 h federació pública acotada; 140 h export/import municipal; 100 h autoallotjament/configuració/migracions; 40 h pilot cultural i deltes cívics | Dos municipis aïllats, round-trip, perfil Mastodon provat i Event Mobilizon qualificat segons el spike. Sense nou backend, CRDT ni processament oral autònom massiu. |
| Proves/seguretat/desplegament 160 h · 8.000 € | 55 h Nix/release i reconstrucció doble; 45 h integració/restauració/actualització i permisos; 35 h validació d'accessibilitat/compatibilitat; 25 h manuals/SBOM/lliurament | Artefactes repetibles, instal·lació per segon operador, informe de proves i excepcions. L'arquitectura/implementació inclou proves unitàries; este lot integra i qualifica. |
| Total | 1.000 h × 50 €/h | 50.000 €, subjectes a fites i condicions acceptades |

Viabilitat: pressupost ajustat per a tres lliurables nous. Assumix reutilitzar mòduls cívics existents, un stack Supabase i una plataforma de referència, federació només pública i pilot cultural acotat. El spike de les primeres 160 h ha de produir una estimació contrastada i una decisió amb NLnet si cal retallar abast; no es prometen simultàniament backend alternatiu, totes les plataformes mòbils, CRDT, transcripció autònoma i totes les extensions del Fediverse. Cap retall del compromís acordat es fa unilateralment.

Seqüència proposada: G0 procedència/política i acord; G1 dades/arquitectura i prototip d'interoperabilitat; G2 export/import amb màquina nova; G3 federació pública durable; G4 release Nix, UX i evidència independent. Es poden començar dissenys autoritzats locals, però no imputar-los com a futurs treballs elegibles ja executats. Comptabilitat per persona, data, tasca, fita, revisió, artefacte i acceptació; separar contribucions d'IA, treball previ i altres fonts de finançament. No hi ha cap equip extern ni remuneració aprovats per este informe.

### Demostració /fediversity: proposta amb força probatòria

Prioritat de la demostració: **«Canvia l'amfitrió; conserva el poble» / “Change the host; keep the town.”** Un recorregut inicial de 60–90 segons pot mostrar resultats preparats; la restauració i reconstrucció completes necessiten el seu temps i logs reproduïbles. Ampliació final: hi ha pàgina editorial a src/sections/text/pageContent.js:543, fitxa a systemPages.js:115 i àlies de ruta en App.jsx. Això supera l'absència de la pàgina informativa, però no demostra export/import, federació o rebuild interactius. El demostrador següent continua sent proposta; Codex no ha creat ni publicat eixa pàgina ni l'ha visitada com a prova funcional.

| Estació del demostrador EN/CA | Acció observable i evidència necessària |
| --- | --- |
| 1 · Què funciona avui / What works today | Estat visible per capacitat: verificat localment, laboratori, proposat. Revisió i data de cada prova; cap badge global de 7/7 o «federat» sense prova. |
| 2 · El poble en una maleta / Take your town with you | Exportar poble sintètic, verificar hashes al navegador, llegir JSON-LD/Markdown i exclusions. Obrir una instància neta amb el paquet i comparar dades/actius, amb un segon municipi intacte. |
| 3 · Mateixes dades, altre amfitrió / Same data, another host | Mateix Web Component en dos amfitrions de laboratori; després origen de servei independent amb importació. Mostrar que canviar amfitrió i canviar servidor són operacions diferents. Sollutia real només amb contracte/endpoint autoritzat. |
| 4 · Poble federat / A town on the Fediverse | Inspector de WebFinger/actor/outbox, i Note/Event rebuts en instàncies controlades fixades. Si només és preview de JSON, mostrar «previsualització» i no «lliurat». |
| 5 · Bancal accessible / Accessible rural mode | Teclat, focus visible i retorn després del diàleg; text clar, zoom/reflow i lector. IDEA-58 usa fletxes en el patró adequat sense capturar tecles en editors; selecció distinta del focus, Home/End i alternativa tàctil. |
| 6 · Llengua i memòria / Language and living memory | Apertium propi, parells validats i original visible; errors/cancel·lació honestos. Consulta BM25 amb fonts i proposta de targeta que una persona revisa, disponible amb proveïdors d'IA apagats. |
| 7 · Prova-ho tu / Reproduce it | Release fixada, una comanda documentada, doctor, llicències/SBOM i instruccions de restauració. Hash extern consultable i evidència de dos builds nets. |

WCAG AAA és un objectiu de verificació, no una propietat que s'obtinga triant un verd. El [criteri de teclat 2.1.1 és de nivell A](https://www.w3.org/WAI/WCAG22/Understanding/keyboard); no s'ha d'anomenar AAA per error. Cal matriu de criteris aplicables, proves manuals amb lector, zoom, mòbil, contrast real i llengua. IDEA-31 requerix servei i parells lingüístics disponibles; cinc diccionaris no equivalen a cinc parells Apertium. Les cadenes traduïdes s'han de revisar; no substituir el text legal/procedència original en silenci.

La pàgina pública exposaria només fixtures o dades obertes aprovades. No publica els formularis privats, el registre de prompts, esta auditoria interna, correus, sessions, claus ni dades d'administració. Les mètriques de la demo són observades amb data, entorn i mida de corpus; no resultats inventats.

### Guió intern per al Clarification Q&A (EN; revisió humana abans d'usar)

No s'han rebut ací les preguntes reals del destinatari. Els textos següents són una preparació temàtica, no una resposta enviada ni documentació de treball humà finançat. Cal adaptar-los a les preguntes autèntiques i declarar l'assistència/procedència segons el règim aplicable.

**1. What exists today, and what would the grant fund?**

The current codebase provides an online-first modular civic platform, a neutral backend port, a constrained read-only hosting bridge, and personal data export. We have not yet demonstrated municipal round-trip migration, a complete reproducible deployment, or live ActivityPub interoperability. We propose to fund clearly scoped new deliverables and independent verification. Existing work is a baseline of capability, not a claim for retroactive payment.

**2. How do you avoid vendor lock-in while currently using Supabase?**

Our host integration and our data service are separate. Hosting the same component elsewhere does not by itself migrate the town. We propose a versioned, authorised municipal export/import contract including public configuration, stable identifiers, relationships and eligible assets. Acceptance requires restoring a town into a new self-hosted instance implementing the same service semantics, with permission checks and an independently repeatable manual. A different backend would require a separate architecture decision and conformance tests.

**3. Is ActivityPub already available, and what compatibility will you prove?**

No live interoperability is claimed today. The local proposal texts frame federation as a future direction; we would like to agree the funded scope explicitly. Our proposed public federation profile includes WebFinger discovery, a municipal actor, a durable activity outbox and authenticated inbox delivery. We will test notices with pinned Mastodon versions and qualify the Event/Group or relay profile needed by Mobilizon. A static JSON preview will not be reported as successful federation.

**4. How do you reconcile the cognitive annex with the online-first design?**

The annex uses broader language about offline-first operation, CRDTs and NixOS than the present implementation supports. We propose an explicit correction and scope agreement rather than treating browser storage as CRDT replication. The local assistant currently performs extractive retrieval. The cultural pilot would preserve sources, rights and human editorial approval and remain usable without a generative service. Any AI-related research or development process must be explicitly compatible with the agreed programme policy.

**5. Why is €50,000 reasonable, and how would you prove completion?**

The original allocation is 160 hours for analysis and architecture, 240 for UX/frontend, 440 for backend and civic modules, and 160 for testing, security and deployment, at €50/hour. The internal five-module grouping is not a replacement agreement. We propose reviewable milestones with an acceptance artefact, test environment and independent reproduction steps. The plan deliberately reuses the civic baseline and limits new scope to a reference deployment, municipal portability, a public federation profile and an accessible pilot.

**6. How have you used generative AI?**

This preparation includes AI-assisted review and drafting and must be disclosed. The existing local provenance log has an incomplete output record; we will identify the missing material honestly and will not reconstruct it as an original unedited output. We will confirm the transitional policy applicable to this pending Fediversity proposal and keep application assistance, existing code, future development methods and eligible human effort separately documented. We will not present purely generated output as reimbursable human work.

**7. What do you need from NLnet before agreeing the revised plan?**

We need confirmation of the received proposal and annex version, the current evaluation status, the applicable AI-policy transition and the accepted baseline/start date. We also need agreement on the federation scope, the online-first correction, the revised acceptance milestones and any change to the budget mapping. We will provide evidence for claims we can verify and explicitly list remaining uncertainties.

### Troballes NGI numerades i prioritat

| ID | Prioritat | Troballa i criteri de tancament |
| --- | --- | --- |
| NGI-01 | P1 administratiu | Data/programa i text rebut no autenticats localment. Obtenir rebut/còpia rebuda i preguntes reals; no confondre nova convocatòria amb expedient existent. |
| NGI-02 | P1 procedència | Política d'IA i log incomplet. Confirmar règim, preservar història i registrar correcció autèntica; no inventar eixides. |
| NGI-03 | P1 abast | Annex CRDT/offline/Nix/autonomia excedix evidència. Addenda acceptada amb baseline i fita futura; flake no tanca tot l'annex. |
| NGI-04 | P1 tècnic | Exportació personal no és municipal. Export/import autoritzat amb actius, drets i round-trip independent. |
| NGI-05 | P1 tècnic | Stack reproduïble/instal·lació integral absents. Locks, serveis complets, doctor, dos builds i restore en màquina nova. |
| NGI-06 | P1 disseny | Federació encara futura; acordar abast i prova real Mastodon/Mobilizon abans d'etiquetar interoperable. |
| NGI-07 | P1 drets | AGPL no relicencia el corpus; eliminar l'assumpció CC BY-SA uniforme. Inventari d'autorització/llicències per element i exclusions visibles. |
| NGI-08 | P2 UX | IDEA-31/58 i WCAG globals no acreditats pel lot actual. Implementació en carril de codi i proves manuals/laboratori amb criteris. |
| NGI-09 | P1 econòmic | Base prèvia ≠ hores elegibles. Fites/start date i correspondència IDEA-38 acceptades, sense doble finançament. |

### Matriu universal IDEA-57 (notes provisionals /10)

Es conserva la valoració prudent de l'auditoria1859 com a **judici QA provisional del sistema**, no nota NLnet ni nova certificació global. El present encàrrec comprova sobretot portabilitat i procedència. Les observacions antigues s'identifiquen com a tals; cap codi s'ha modificat per a tancar-les.

| Dimensió | /10 provisional | Evidència i què falta |
| --- | --- | --- |
| D01 · Disseny/Pedra Seca | 8 | Tall QA1859: design 0 crítics/12 avisos; falta revisió visual global, no reexecutada ací. |
| D02 · Port/Model B | 8 | Port/Frontissa/conformitat en lot445; NGI-04/05 i endpoint Sollutia real sense demostrar. |
| D03 · Xat/actors/E2EE | 6 | Tall1859: lots de xat i flag apagat; riscos QA-R2-05/06/08/09, no reauditats ara. |
| D04 · Arxius locals/fototeca | 6 | Tall1859: operacions/cua/oblit; QA-R2-03/04 i dispositiu real pendents en eixe tall. |
| D05 · IAIA/bot/cultura | 6 | BM25 i atles en lot445; NGI-03/02, cap autonomia oral ni cost de servei zero provats. |
| D06 · Identitat/perfils/Connectar | 4 | Tall1859 parcial; rols SQL llegits, integració municipal real pendent NGI-04. |
| D07 · Notes/Proposa Card/RSS | 4 | Contractes i proposta editorial presents; flux cultural integral no qualificat, NGI-03. |
| D08 · Accessibilitat | 6 | Tall1859 de focus/diàlegs ampliat ara: IDEA-58 present i provada en jsdom; falta prova humana transversal, NGI-08. |
| D09 · Idiomes | 6 | Diccionaris i activació Apertium presents al tall final; servei real/autoallotjament i revisió lingüística pendents NGI-08. |
| D10 · Rendiment/memòria | 8 | Tall1859 LRU/visor; p95 real i mètrica BM25 no recollits ara. |
| D11 · Proves | 6 | 445/445 en11fitxers propis; falta integració/AP/export municipal/rebuild, NGI-04/05/06. |
| D12 · Governança | 6 | Torn documental, rebuts i carrils; tancament literal baix, no ocultació de deltes concurrents. |
| D13 · Seguretat/privacitat | 6 | RLS versionada i exportació personal; PostgreSQL multi-tenant real i drets de dades pendents. |
| D14 · Natiu/PWA/WordPress | 6 | Tall1859 de paquets; cap binari/servei complet nou comprovat, NGI-05. |
| D15 · Wiki/procedència | 6 | Fonts llegides i informe formal; NGI-01/02/03, no prosa certa per un simple enllaç vàlid. |

No es calcula mitjana ni s'arredonix a 10. Les tres guies poden compartir criteris i evidència; no han de votar una perfecció que el codi i les proves encara no demostren.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Lot propi executat el 29–30 d'octubre en el worktree compartit:
~~~
npx vitest run src/data/contracte.test.js src/data/conformitat/kit.test.js src/data/supabase/conformitat.test.js src/data/adaptadors/sollutia/creaFrontissa.test.js src/data/supabase/content.paginacio.test.js src/data/supabase/compte.test.js src/data/supabase/compte.exportacio.test.js src/data/supabase/exportacio.migracio.test.js src/sections/profile/DetallPrivacitat.sessio.seguretat.test.jsx src/data/iaiaLocal.atles.test.js src/config/versio.test.js
~~~

Resultat: **11 fitxers passats;445 proves passades;0 fallades;exit0;4,05s**. Proves amb adaptadors falsos i verificacions estàtiques quan així ho definix cada suite; no s'ha llançat Supabase/PostgreSQL, fet build ni cridat serveis municipals. La prova de migració inspecciona SQL, no una BD en execució. No se sumen amb resultats solapats de QA1859 o amb els de Claude.

Tall d'empremtes posterior al lot: els onze camins inventariats següents coincidixen amb l'obertura del torn. Dockerfile coincidix amb les dues lectures de l'agent d'empaquetat, però no forma part de l'inventari automàtic del torn.

| Fitxer | SHA-256 |
| --- | --- |
| src/data/backendPort.js | 4eb24538e94d57159d0dcb882dc2bd07930b2cc4d698c5588556de6b3d93a896 |
| src/data/contracte.js | 7a1dea0c7feca111ee18d70bef7be0e3c00f083429717e73003b78b9f4174388 |
| src/data/supabase/compte.js | 3463b8720ef2dd6eb91724eace5cbae66283239f73f816b811a3e7c435b285d4 |
| src/data/supabase/content.js | 1a4076326a4b0a9ee3e9f6bc520e71702950886e3866020b80b73fd56c26cc48 |
| src/data/adaptadors/sollutia/client.js | d8536d4b1c4466b2c81c56d797a35fa7d4fb36660177c17dfe12830e0ddb5e83 |
| src/data/adaptadors/sollutia/creaFrontissa.js | 19d3f007da94323db296012b0418e007b064d8ac4d957b675302928ed04875df |
| src/data/conformitat/kit.js | 21d55b4058f2704d91a7bc023e09c7a30d847a96c10da39b0da87acb5b49ae58 |
| src/data/iaiaLocal.js | 4a55133591fcc53e0310f0cb5a92a134b37e5bb6996139b6253d7d5bfbca754e |
| package-lock.json | 3a2393952089c0ded847ab19c9c4ab14abc94fc59bd08eb505249d8b02637888 |
| src/config/versio.test.js | 5c1b2f3c1f82bae6425af2292861bd0df044242b472290ed4757571378fdd2f0 |
| src/components/universal/drets/llicencies.js | 5c7bf12460a1d98e4e9e9d105f842a8e902a029be3d5d1487d60940247a4cd3b |
| Dockerfile | e39bd4ebc1a01bca325d5f35be8d3d75aa103aec90483457c24865a8303ecf0f |

Tres lectures independents: procedència/pressupost; AP/exportació; empaquetat/cultura. Revisió adversarial del criteri: no convertir ActivityPub futura ni Apertium posterior en obligacions v1 acreditades; no anomenar els recomptes percentuals acceptació global. Fonts i resultats distingits d'inferències i propostes. Revisió de fonts/Q&A sense errors substancials; revisió AP/export incorporada: atomicitat de metadades distinta de Storage i identitats de destí verificades.

### Ampliació final de codi concurrent (23:27 UTC)

IDEA-58: navegacioTeclat.js implementa fletxes/Home/End, geometria i guardes; UniversalWorkspace i les graelles el connecten. IDEA-31: main.jsx:48 activa el transport lliure; useTraduccioPagina.js:97 prioritza un servei del mateix origen. El lloc estàtic pot usar directament Apertium públic (traductorLliure.js), amb text i IP que ixen al proveïdor; el servidor de desenvolupament té /__iaia/traduir, no un endpoint productiu automàtic. ES/EN-GB/FR consten en el transport; DE no disponible. Açò és implementació present, sense qualificació del servei extern real ni sobirania plena d'allotjament. La proposta futura prioritza servei propi, informació clara i selecció de contingut abans d'enviar dades.

Lot suplementari propi, separat del445/445:
~~~
npx vitest run src/main.traductor.test.jsx src/components/universal/workspace/navegacioTeclat.test.js src/components/universal/workspace/UniversalWorkspace.teclat.test.jsx src/sections/multimedia/graelles.teclat.test.jsx
~~~
Resultat **4 fitxers,56 proves passades,0 fallades,exit0,2,57s**. jsdom amb geometria simulada i configuració/transport doble; no lector de pantalla ni xarxa Apertium real. No s'ha executat la suite Node del servidor, que inclou HTTP local, ni les proves encara no presents del transport acabat d'afegir. No extrapolar estos56casos a totes les garanties del traductor.

| Camí al tall final | SHA-256 |
| --- | --- |
| src/main.jsx | 6a9039f41b8e4237be5b9b7fea1cc2fcd41d8ec09b593bb3941cb65a8e37b5ec |
| src/data/traductorLliure.js | ad1d4b3faf8a6e450bb3f7a22881e169b8a459adf28c777a01d15b31c79d6483 |
| src/components/PedraSeca/hooks/useTraduccioPagina.js | c80a35e4dde07e18a6a7c4432fb041e645afc92634eeeed6f950c34e6d9e3e44 |
| src/components/universal/workspace/navegacioTeclat.js | f4da3f99adceca6cfa31c2d46582d8e9976a33633ffb4793908e99c93ef0e03d |
| src/components/universal/workspace/UniversalWorkspace.jsx | eef205327806a308d128c2e9dce78d2ee0f3992c00a79dfe1633ab223f911cd1 |
| src/sections/multimedia/GraellaAlbumLocal.jsx | 9853e96a26d7a49985b36e0f4fff6d387adfe497cd8f078de147bb3eaa7cfe0f |
| src/sections/multimedia/PaginesEspaiMultimedia.jsx | dd93e5908ad697697e097a4a150e67875dce86a654399224fda9f0fe5e658a67 |
| src/sections/text/pageContent.js | b7cdc6e78a2869cf2944e74df0613d6cc9b0df2ae2e0247061a661685f9f74d8 |
| src/config/systemPages.js | b09595f9915025ccd46d324513a3e066d113028d5c4e4492e359b0e7870871aa |

### Registre i tancament formal

Informe i pla creats amb context/create de les plantilles vives i rebuts individuals; pla propi vinculat al torn documental. Les dues comprovacions document.mjs check retornen valid:true,errors:[]; porta-plantilla-viva --escriptori --complet retorna valid:true,revisats:5. Olivera passa, conserva els documents vius ancorats i la Safata d'Entrada buida.

Mestre/P1-23, ESTAT i LEDGER actualitzats amb lease governance-write, scopes exactes, CAS i executor. Transacció acceptada **aec95f3d-da86-4976-88bb-f21f658afb16**; sessió4027c42b-c7fd-4790-b5bc-abd3a963a1f4 consumida després de verificar efecte, LEDGER i segell. Segell preservat: c9fad3f4f690de95be0997d5cf36c6a17ba33bdd36e0dfe00449eb44929fc0d4. L'evidència durable és .agents/seal-transactions/aec95f3d-da86-4976-88bb-f21f658afb16.json; no s'ha fet commit.

Comanda de tancament:
~~~
node tooling/gates/tancament.mjs --check --turn-id torn_b3a4417e-c57f-40d5-91e3-d2d51c1d5828
~~~
Resultat literal: **valid:false;state:planned;exit1;errors:["Canvis de codi fora de l’abast documental"]**. Les huit comprovacions d'entorn tenen exit0: olivera,plantilles,autoritat,ledger,segell,skills,wiki,scc. El comparador detecta els deltes concurrents de src/, tests/, tooling/ i Vite respecte de l'obertura; este torn no els ha editat. No es canvia el scope, l'inventari inicial ni la propietat d'estos fitxers per forçar un verd. No s'executa --close amb comprovació invàlida; el torn queda planned amb reserva explícita. Açò és una limitació del tancament compartit, no una certificació ni una fallada de les445+56proves.

Els temporals propis s'han retirat després de conservar ací comandes, resultats, empremtes i rebut durable. Cap servidor, navegador, cron o monitor propi queda obert. L'acta general de la jornada correspon a l'orquestració; este informe i el pla són el relleu documental d'este encàrrec.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria de fonts locals i fonts oficials públiques; no accés al portal d'avaluació, rebut del destinatari ni correu privat. No s'han inspeccionat els PDFs no seleccionats com a font literal de la sol·licitud. Les funcionalitats proposades no són codi integrat. El worktree és compartit i mutable; no hi ha una certificació de producció, seguretat, WCAG o aprovació econòmica.

Scope documents: cap font de src/, tests/, tooling/, bot/, public/ o wordpress-plugin/ editada, cap Git destructiu, staging, commit, instal·lació, build, desplegament, SQL remot ni missatge enviat. No s'han creat cron, monitors, servidors ni recursos de navegador. Les proves han usat l'entorn local i els seus derivats regenerables; els temporals propis es retiren després del registre formal.

El Q&A és una preparació assistida per IA. L'ús extern requerix comprovació humana, procedència i règim d'IA aplicable; este estudi no autoritza despesa ni assegura finançament.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_2353_pla_implementacio_nlnet_fediversity]]
- [[261029_1859_auditoria_codex]]
- [[261029_1858_auditoria_gemini]]
- [[ADR-2026-08-ONLINE-FIRST]]
