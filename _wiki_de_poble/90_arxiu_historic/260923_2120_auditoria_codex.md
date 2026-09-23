---
type: informe
status: esborrany
description: Verificació local de les cinc peticions UI i esmenes al pla compartit abans de la implementació.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1830f064-07fa-450e-a121-26e037a3fb16:d62a3968-e168-4d13-9ce4-90fe50a587f3
---
# Auditoria Codex — Foraster, Crom, registre i notes

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1830f064-07fa-450e-a121-26e037a3fb16:d62a3968-e168-4d13-9ce4-90fe50a587f3 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T19:23:05.393Z |
| Modificació | 2026-09-23T19:23:05.393Z |
| Propietari | codex |
| Aprovació humana | Petició rebuda; execució de codi condicionada al consens AFK de l’Olivera. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesurats reals: no disponibles. Estimació orientativa del torn: 18000–25000; no és telemetria mesurada. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

23-09-2026, inici 21:20 CEST: auditoria del working tree sobre HEAD f03affcb33121e024f508a35ec6a50816311d731. Hi ha canvis previs i concurrents; cap fitxer de producte modificat per Codex en este torn. Llegits AGENTS, genotip, índex, ESTAT_ACTUAL, skills i pla compartit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i consens

Les cinc peticions són concretes, però no estan completades. El prompt humà imposa «Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat». Esta entrega aporta evidència i completa el pla, sense declarar un consens inexistent. Al tall de consulta, a l’Escriptori només hi havia el pla i el prompt de les 21:13; no hi havia auditoria nova de Claude. Les conclusions anteriors de Claude es coneixen pel resum actiu d’ESTAT, sense llegir l’arxiu històric.

### C1 · P1 · Crom desconnectat i arrel nul·la després d’iniciar sessió

**Fonts:** src/components/universal/PanellCrom.jsx:86–110; src/app/App.jsx:373; src/app/contexts/SessionContext.jsx; src/app/contexts/IdentitatContext.jsx.

BotoCrom no té cap importador a src. La barra superior no el munta. A més, el seu useEffect amb [] captura ref.current quan el rol inicial encara no és superadmin i el component retorna null. Quan el rol es resol, el botó apareix però arrel continua null: Aplicar no fa res. Integrar-lo sense corregir el cicle de muntatge deixa una fallada funcional.

**Proposta:** muntatge condicionat per permís resolt o callback ref, sempre sobre la .sdp-root de la instància. Fer servir permisos verificats del backend per a l’entitat Sóc de Poble; actorId o un nom de perfil no són autorització, perquè IdentitatContext encara no valida memberships. Provar fora → comprovant → superadmin, canvi d’actor i logout. Les classes sdp-crom-panell/rampa/mostres/mostra no tenen regles CSS dedicades trobades; cal donar estructura a les mostres. La persistència actual és només DOM i es perd en recarregar.

### C2 · P1 · Conservar L d’OKLCH no conserva el contrast declarat

**Fonts:** src/config/crom.js:6–10,65–70,174–184; src/css/tokens.css:72; src/css/design-tokens.css:5.

Executant giraTo real i calculant luminància sRGB: blanc sobre #0984E3 = 3,874:1; gir +60° → #a25ecc = 4,192:1; +240° → #5e9400 = 3,677:1. L es manté prop de 0,605 però el contrast varia. El 5,23:1 escrit al comentari de tokens.css tampoc correspon al cànon vigent. La demostració desmentix la garantia matemàtica; no és una prova d’accessibilitat de totes les pantalles.

**Proposta:** mesurar parelles semàntiques de text/fons després de convertir a sRGB i ajustar lluminositat o esglaó fins al llindar acordat. El selector actual pren el blau com a referència: seleccionar verd no fa necessàriament verd el taronja principal. Ancorar el control principal al taronja requerit i validar clar/fosc, hover, focus i dos instàncies. No prometre persistència global sense un contracte de configuració.

### C3 · P1 · Seed visible no significa corpus corporatiu ni edició persistent

**Fonts:** src/data/appSeed.js:49–125; src/sections/mur/feedSeed.js:1; src/data/supabase/notes.js:58–66,86–108,127–135; src/sections/notes/NotesDataContext.jsx:158,267; src/components/universal/DocumentEditor.jsx:126–166.

La reparació local prèvia de NotesDataContext ja deixa carregar seed sense sessió. La UI mostra n1 (manual) i n2 (buida), amb huit carpetes declarades; les dos notes són de f-mur. MOCK_FEED és []: no existix un corpus de publicacions del Mur en eixe seed que es puga copiar automàticament. PAGES_SEED és contingut de pàgines, no prova de publicacions corporatives.

Les notes n1/n2 no tenen UUID ni revision. updateNote exigix connexió, usuari autenticat, UUID i revisió; no té camí d’escriptura seed. Tanmateix, la UI anònima mostra camps editables, inserció i Publicar. Açò permet aparença d’edició sense desament remot vàlid. No he editat ni publicat dades per demostrar-ho. El camí resolveNote també seguix requerint usuari encara en seed, tot i que la llista completa sol evitar-lo. Les polítiques actuals de notes són per owner_user_id, no per pertinença corporativa.

**Proposta:** font editorial explícita, IDs estables i mapa de carpetes; lectura d’exemples per al Foraster; escriptura només sobre notes natives autoritzades amb UUID/revision i confirmació de persistència. No deduir propietat pel nom «Sóc de Poble». La font de les publicacions que falta s’ha de concretar en el consens; no inventar articles ni importar tota la Wiki.

### C4 · P2 · Avatar trencat reproduït, origen compartit

**Fonts:** src/sections/notes/NotesEditor.jsx:68–69,101–103; src/components/universal/UniversalEditorShell.jsx:155–157; src/components/universal/PageFrame.jsx:238–249.

En /notes?nota=n2 el DOM conté /assets/system/ui/default-avatar.jpg amb complete=true i naturalWidth=0. Captura visual: cercle blanc amb imatge trencada i subtítol «Identitat Lliure». NotesEditor i UniversalEditorShell injecten la ruta; PageFrame sempre pinta img i no té fallback d’error. n1 conserva el logotip corporatiu vàlid.

**Proposta:** representar absència d’avatar explícitament, evitar que els || i ?? reintroduïsquen l’avatar corporatiu per defecte, i renderitzar UserRound blanc sobre fons fosc. Mantindre imatges vàlides, recuperar fallback en onError i reiniciar-lo quan canvie src. Canviar el subtítol només del Foraster per «Nom del poble del foraster».

### C5 · P1 funcional / P2 visual · Estat buit i promesa multimèdia

**Fonts:** src/components/universal/UniversalEditorShell.jsx:277–314; src/css/layout.css:237–243; src/hooks/useHeroImageHandler.js:30–46.

A viewport 629×1089: botó Capçalera 629,17 px, fons rgb(9,132,227), contenidor rgb(255,115,0); Logotip 514,87 px. Falta el paràgraf en ambdós. El taronja ve de .hero-image, que també envolta les imatges vàlides. Els inputs accepten image/*; el handler rebutja altres MIME amb «Només imatges, de moment» i comprimeix a WebP. Els dos renderers són img. Afegir només el text promés deixaria una funció que mentix.

**Proposta:** estat d’inserció amb classe pròpia, superfície blanca, marge interior i botó de mida intrínseca, mantenint àrea tàctil. Ampliar el contracte de media amb MIME/metadades, pujada i renderers per imatge/vídeo/àudio/arxiu; no passar-los tots per compressImage ni img. Verificar també permisos i formats del backend abans de donar per suportat «qualsevol» multimèdia.

### C6 · P2 · Falta l’avís de benvinguda als beta testers

**Fonts:** src/sections/onboarding/OnboardingSection.jsx:78–94 i OnboardingSteps.jsx. DOM /registre verificat.

Hi ha advertiments de fase Beta i possibles pèrdues tant a Google com al registre manual. No hi ha el missatge de funcionalitats limitades, novetats ni petició de feedback mòbil.

**Proposta de text:** «Beta testers: ja vos podeu registrar amb seguretat. La plataforma està en proves i, de moment, hi ha poques funcions disponibles. Vos avisarem de les novetats. Ens ajudarà molt que ens envieu feedback de com es veu la plataforma en els vostres mòbils.» Situar-lo abans dels dos camins d’accés. És text sol·licitat pel Mestre, no una certificació tècnica de seguretat feta per esta auditoria. No s’han enviat avisos ni creat subscripcions.

### C7 · P2 · El pla compartit naixia sense contracte documental

La comprovació inicial de document.mjs check sobre el pla 2113 retorna «Frontmatter absent o no tancat». Les cinc propostes eren pendents. S’ha completat en el mateix fitxer, amb plantilla entregada, rebut i ancoratge; el consens continua pendent. El cognom del pla continua diferint de prompt_execucio_olivera: preservar la ruta compartida evita un moviment unilateral mentre les altres IAs treballen.

### Actualització de l’Olivera a les 21:26

Ha aparegut [[260923_2135_auditoria_claude]] i s’ha llegit íntegrament: encara és l’esborrany generat, amb Troballes/Verificació/Límits pendents. Per tant, no permet donar per lliurada l’auditoria ni declarar consens.

### Millora del prompt i alternatives

Separar «auditar i consensuar» d’«executar després del consens» amb un estat explícit i els fitxers exactes del pla i de les auditories. Les caselles prèvies han de reflectir resultats de comandes, no marcar-se de memòria. Definir què significa edició seed i si Crom és preferència temporal, personal o de tota la plataforma.

Alternatives descartades: carregar totes les publicacions en cada bloc privat (mescla propietat i duplica dades); recolorir amb un filtre CSS global (també altera fotos, logotips i colors d’estat). Les peces compartides proposades eviten duplicar regles i faciliten manteniment.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Navegació real en http://localhost:3340: n1, n2 i registre, sense autenticació ni escriptura de contingut.
- DOM i captura visual de n2: avatar trencat, text antic, botons amples, taronja al contenidor de capçalera.
- Vitest: src/sections/notes/NotesDataContext.test.jsx, 5/5 passen. El mock de SessionContext conserva currentUser en les proves anònimes: cobrix el guarda de getCurrentUser, no tots els permisos de la UI.
- Càlcul directe sobre giraTo per a sis girs de cada cànon: el contrast varia. No s’ha alterat el DOM per simular una sessió superadmin.
- document.mjs check: auditoria i pla vàlids. Tancament executat: valid=false, state=planned; segell, catàleg de skills, Wiki estricta i SCC fallen. Passen plantilles, autoritat i integritat del LEDGER. No es resegellen canvis aliens.
- porta:orfandat falla amb ENOENT sobre _wiki_de_poble/05_skills_superadmin; no és un resultat de zero orfes.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Implementació AFK fins al consens requerit en el prompt humà. No s’ha provat el panell com a superadmin perquè no està integrat ni hi ha sessió autoritzada en el navegador de prova. No s’ha comprovat RLS amb JWT real, persistència de media ni notificacions. No s’han afegit dependències, fet commits ni publicat res. Les cinc tasques de producte continuen pendents. Acta Marmota global pendent. requires_human_decision: true només per concretar la font editorial absent i resoldre el consens; la resta del comportament està especificat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_2113_pla_implementacio]]
- [[260923_2113_prompt_execucio_olivera]]

