---
tipus: document
estat: esborrany
---
> **Ancoratge de Seguretat**: Aquest estudi pertany a l'[[00_index_escriptori]].

Veredicte
Estat: SDP-LOCK preventiu recomanat abans de qualsevol purga.
El sistema no està buit ni trencat: té una arquitectura de governança considerable, índexs generats, manifest, validacions, tractors i mecanismes de quarantena. El problema principal és un conflicte de fonts d’autoritat: documents antics, Skills duplicades, nomenclatura inconsistent i regles que encara descriuen arquitectures revocades.
La conclusió operativa és:
No fer una purga massiva.
Separar autoritat executiva, coneixement consultiu, miralls i memòria històrica.
Eliminar contradiccions abans que fitxers.
Convertir les Skills en contractes petits i composables.
Fer que l’ancoratge siga una propietat validada mecànicament, no una convenció editorial.
1. Contradiccions crítiques
Online-First contra Online-First
La petició fixa correctament l’arquitectura actual com Online-First amb Supabase. Però el bundle encara conté:
MOTOROFFLINE.md.
Referències a Dexie, Workbox, PWA i persistència local.
Textos que descriuen una aplicació “nativa Offline”.
Arquitectura unificada que encara presenta Supabase, Dexie i fallbacks locals com si coexistiren sense jerarquia clara.
El Llibre Blanc de Producció Pedra Seca recomana una pila que inclou Tailwind i llibreries UI, mentre que el tancament exigeix No Tailwind al Core.
Resolució canònica:
Supabase/PostgreSQL/RLS/Auth = arquitectura operativa actual Online-First = únic contracte de persistència Offline/PWA/Workbox = capacitats opcionals o futures Dexie/IndexedDB/outbox = no operatius mentre no existisca ADR + proves
MOTOROFFLINE.md no s’ha d’esborrar encara. Ha de passar a estat: obsolet o estat: futur, amb una advertència visible i sense cap trigger executable.
BIOS antiga contra arrencada actual
00_BIOS apareix com arxivada i redirigida, però:
Encara figura en índexs i sinapsis.
Encara és tractada com a document constitucional en parts de .agents.
Existeix .agents/BIOS.md, que també descriu una seqüència d’arrencada.
BOOTSTRAP.md, AGENTS.md, PROTOCOLPETORRETA.md, identity-iaia-core i reflexio-previa se solapen com a portes d’entrada.
Això crea una falsa pluralitat de boots.
Resolució:
BOOTSTRAP.md = entrada mínima i determinista AGENTS.md = contracte executiu PROTOCOLPETORRETA.md = mutacions, leases i efectes laterals reflexio-previa = classificació cognitiva de la tasca Skills especialitzades= protocols sota demanda BIOS.md = compatibilitat històrica, no executable 00_BIOS.md = arxiu, sense autoritat
Cal retirar 00_BIOS de qualsevol llista que puga interpretar-se com a font executiva. No cal esborrar-lo.
Identitat duplicada
Hi ha, com a mínim:
identity-iaia-core.
identity-iaia-voice.
01_IDENTITAT.md.
02_GENOTIP.md.
02_EQUIP_IA.md.
perfil_psiquiatric.md.
antigravity.md.
Soci_Sollutia.md.
La duplicació no és només editorial: algunes peces contenen ordres operatives, enumeracions del Consell i regles de llengua; altres es declaren consultives.
Resolució:
Àmbit
Font única
Identitat mínima
02_GENOTIP.md
Arrencada
BOOTSTRAP.md
Veu i llengua
identity-iaia-voice
Membres del Consell
.agents/consell.json
Integració Sollutia
ADR tècnic vigent
Perfil narratiu o històric
Consultiu
La llista del Consell no pot aparéixer replicada en prosa com a font normativa. El bundle confirma que .agents/consell.json és la font única i que l’enumeració obligatòria anterior contenia contradiccions.
Trellat, reflexió i workflow
Es detecta una superposició clara entre:
reflexio-previa.
trellat.
socdepoble-workflow.
AUDITORIA_CANONICA.
seguretat_execucio.
selfrepair.
successio_lazaro_execucio.
El problema no és tindre diversos documents, sinó que diversos d’ells ordenen:
Llegir context.
Fer preflight.
Demanar lease.
Verificar.
Escriure al Ledger.
Executar portes.
Fer revisió hostil.
Això permet que cada agent trie una seqüència diferent.
Seqüència única proposada:
1. Classificar la petició 2. Carregar fonts obligatòries 3. Determinar si hi ha mutació o només lectura 4. Crear pla i llista exacta de fitxers 5. Activar SDP-LOCK si hi ha destrucció o ambigüitat 6. Obrir lease quan pertoque 7. Executar dry-run 8. Aplicar canvi reversible 9. Executar tractors i proves 10. Actualitzar índexs i Ledger 11. Tancar amb informe verificable
reflexio-previa ha de ser el classificador. trellat ha de ser el protocol de canvi. socdepoble-workflow ha de quedar com a guia humana, no com una segona autoritat executable.
Design System i Tailwind
La petició fixa No Tailwind al Core, però el bundle conserva textos que recomanen Tailwind o classes de Tailwind en la metodologia de producció. Al mateix temps, pedra-seca prohibeix classes Tailwind i exigeix tokens semàntics.
Resolució:
Tailwind: prohibit en src/, core, components universals i tokens.
Tailwind només pot aparéixer en prototips aïllats i explícitament marcats.
Pedra Seca: font única del sistema visual.
DesignSection.jsx: catàleg vivent.
design-tokens.json: font de valors.
ESTANDARD_UI_Universal.md: estàndard d’aplicació.
universal-page: anatomia del component, no sistema visual complet.
La prohibició de primitives directes dins dels components és correcta, però pedra-seca conté una excepció explícita per a la sidebar que permet primitives directes. Aquesta excepció ha d’estar etiquetada com a zona d’infraestructura visual immutable, no com una contradicció general.
2. Skills: reestructuració
Problema actual
Les Skills barregen quatre coses diferents:
Identitat i personalitat.
Protocols de treball.
Arquitectura tècnica.
Manual d’implementació de components.
A més, hi ha miralls automàtics a la Wiki i Skills canòniques dins .agents/skills/. El mirall és útil, però pot confondre’s amb una font editable.
Estructura proposada
.agents/ ├── AGENTS.md ├── BOOTSTRAP.md ├── BASELINE.md ├── PROTOCOLPETORRETA.md ├── consell.json ├── LEDGER.md ├── skills/ │ ├── 00-core/ │ │ ├── task-classification/ │ │ ├── context-loading/ │ │ ├── change-control/ │ │ └── language-voice/ │ ├── 10-safety/ │ │ ├── lease-protocol/ │ │ ├── sdp-lock/ │ │ ├── privacy-boundary/ │ │ └── reversible-mutation/ │ ├── 20-wiki/ │ │ ├── anchoring/ │ │ ├── taxonomy/ │ │ ├── contradiction-audit/ │ │ └── orphan-repair/ │ ├── 30-architecture/ │ │ ├── online-first/ │ │ ├── supabase-boundary/ │ │ ├── react-integration/ │ │ └── universal-page/ │ ├── 40-design/ │ │ ├── pedra-seca/ │ │ ├── token-usage/ │ │ └── accessibility/ │ └── 90-legacy/ │ ├── bios-historica/ │ └── motor-offline/ └── mirrors/
Regla de nomenclatura
Cada Skill ha de tindre:
--- tipus: skill id: wiki-anchoring estat: canonic scope: wiki autoritat: executable triggers: - ancoratge - orfe - index depends_on: - context-loading outputs: - anchoring-report ---
Regles:
id estable en kebab-case.
No usar noms purament metafòrics com a identificador únic.
Una Skill, una responsabilitat.
core: true només per a Skills realment inevitables.
estat obligatori: canonic, actiu, consultiu, futur, obsolet, arxivat.
autoritat obligatòria: executiva, normativa, consultiva, històrica.
Dependències declarades, no insinuades en prosa.
Cap Skill ha d’enumerar membres del Consell manualment.
3. Purgues segures
Purgar ara
Només elements sense valor operatiu i amb substitut verificable:
Triggers duplicats que apunten a la mateixa Skill.
Miralls que no coincideixen amb el hash de la Skill canònica.
Enllaços trencats generats automàticament quan ja existeix un objectiu canònic.
Fitxers de prova temporals, .bak, còpies i satèl·lits detectats pel tractor.
Índexs duplicats que no són font ni generador.
Referències a 00_BIOS com a arrencada executable.
Referències que presenten MOTOROFFLINE com a capacitat actual.
Això s’ha de fer amb dry-run, recepta, hash, quarantena i un únic commit reversible.
No purgar encara
No s’han d’eliminar automàticament:
00_BIOS.md.
MOTOROFFLINE.md.
perfil_psiquiatric.md.
Actes històriques.
Documents amb contingut encara no classificat.
Carpetes buides com 99_maquinaria.
La carpeta 01Produccio.
Fitxers personals o amb possibles dades personals.
La carpeta buida 99_maquinaria pot eliminar-se només després de confirmar que no és una ruta reservada per tooling, manifest o scripts. El bundle no aporta prou prova per destruir-la.
Tractament de la documentació obsoleta
No esborrar; marcar:
estat: obsolet autoritat: historica reemplaçat_per: - ADR-2026-08-ONLINE-FIRST - BOOTSTRAP - 00arquitecturatecnicaunificada
Això preserva la memòria sense deixar que el text governe.
4. Ancoratge de Seguretat
Diagnòstic
El sistema ja disposa de:
00INDEX.
00INDEXIDENTITAT.
00INDEXSKILLS.
00INDEXESCRIPTORI.
00INDEXActes.
blocs autogenerats de sinapsis entrants.
manifest-auditoria.json.
tractors de frontmatter, rutes, graf i integritat.
Tanmateix, l’ancoratge és irregular perquè conviuen tres models:
Enllaç manual a un índex.
Sinapsis autogenerades.
Manifest o hash de seguretat.
Un document pot semblar ancorat per tindre un text Ancoratge de Seguretat, però no estar realment descobert pel generador o pel graf.
Model canònic
L’ancoratge ha de ser una relació verificable:
ancoratge: index: 00INDEXESCRIPTORI ruta: wikidepoble/05EscriptoriSocdePoble/... estat: verificat sha256: ... generat_per: toolingwikillauradorindexs.mjs
Per als documents de Wiki:
Un document canònic s’ancora a un únic índex principal.
Pot tindre sinapsis secundàries, però no múltiples fonts d’autoritat.
Els índexs autogenerats no s’editen manualment.
El generador ha de fallar si detecta un document sense índex vàlid.
Per als artefactes d’escriptori:
00INDEXESCRIPTORI.md és la porta d’entrada.
Els fitxers han de complir nomenclatura termodinàmica.
No s’han de crear subcarpetes improvisades.
L’ancoratge s’ha de generar en el mateix commit que el document.
Acta Marmota
L’acta:
2609050055ACTAMARMOTAAlturaBarresUniversals.md
apareix en el manifest de l’escriptori, però el material recuperat no demostra que estiga inclosa en 00INDEXESCRIPTORI.md. També hi ha una versió relacionada dins de 10actes, cosa que pot provocar ambigüitat de ruta i identitat.
Això explica que es quede “solta”:
És un document de treball, però té forma d’acta.
Té una versió a l’escriptori i una referència històrica a actes.
El sistema usa índexs diferents segons la zona.
L’ancoratge depén de generació posterior.
El nom no conté una categoria inequívoca separada de l’objecte documental.
Solució:
Declarar l’acta activa a 05EscriptoriSocdePoble.
Afegir-la a 00INDEXESCRIPTORI.md com a treball pendent.
Afegir una referència consultiva a 10actes/00INDEXActes.md, sense duplicar el contingut.
Quan es tanque, promoure-la a 10actes o arxivar-la fora del vault segons el protocol.
Assignar un identificador estable:
id: acta-marmota-altura-barres-universals tipus: acta estat: pendent-revisio zona: escriptori ancoratge: 00INDEXESCRIPTORI
No s’ha de copiar el fitxer entre carpetes. Una sola instància canònica; la resta, enllaços.
5. Noves Skills
wiki-anchoring
Responsabilitat única:
Detectar fitxers sense índex.
Validar l’índex correcte segons zona.
Comprovar que l’ancoratge apunta a una ruta existent.
Actualitzar índexs generats.
Emetre recepta abans de qualsevol correcció.
authority-resolver
Resol conflictes entre:
.agents.
Wiki.
ADR.
Codi.
Proves.
Actes.
Cada afirmació ha de quedar classificada com:
executiva implementada normativa consultiva futura històrica
skill-linter
Valida:
Frontmatter.
Identificador.
Triggers duplicats.
Dependències inexistents.
core: true sense justificació.
Ordres contradictòries.
Referències a Skills inexistents.
Regles prohibides dins de Skills consultives.
architecture-drift
Compara:
ADR vigent.
package.json.
imports reals.
Supabase.
persistència local.
Workbox.
Dexie.
outbox.
documentació.
Ha d’emetre una taula de divergències sense modificar res.
privacy-boundary
Bloqueja:
Dades personals sense base legal.
Extracció de perfils.
Persistència de dades sensibles.
Inclusió accidental de secrets en bundles.
Promoció de fitxers personals a la Wiki.
Aquesta Skill ha de tindre prioritat superior a qualsevol Skill de classificació o neteja.
design-core-guard
Valida:
Absència de Tailwind al Core.
Ús exclusiu de tokens semàntics.
Dimensions tàctils mínimes.
No ús de colors hardcoded.
Coherència de UniversalCard i UniversalPage.
Excepcions explícites de la sidebar.
Pla d’execució
Fase 0 — Bloqueig
Crear o confirmar .agents/SDP-LOCK.
No fer purgues.
Congelar canvis de Skills i índexs.
Guardar l’estat actual amb hash.
Fase 1 — Inventari
Enumerar totes les Skills canòniques.
Separar miralls, obsoletes i consultives.
Construir una matriu Skill → triggers → dependències → autoritat.
Detectar duplicats i contradiccions.
Fase 2 — Canonització
Fixar BOOTSTRAP, AGENTS, PROTOCOLPETORRETA i .agents/consell.json com a fonts executives.
Marcar 00_BIOS i MOTOROFFLINE com a històrics o futurs.
Consolidar Trellat, Reflexió i Workflow.
Fase 3 — Graf
Validar tots els Ancoratge de Seguretat.
Resoldre l’Acta Marmota.
Generar una llista de satèl·lits, orfes i fantasmes.
No corregir automàticament objectius amb nom ambigu.
Fase 4 — Purga reversible
Quarantena, mai rm.
Una operació per commit.
Recepta amb hash abans d’aplicar.
Proves després de cada operació.
Reversió quirúrgica si falla un tractor.
Fase 5 — Desbloqueig
Només retirar SDP-LOCK quan passen:
npm run gate npm run porta validació de frontmatter validació d’ancoratges auditoria de contradiccions auditoria de privacitat auditoria de rutes verificació del Ledger
Decisió final
La Wiki no necessita una destrucció; necessita una operació de desambiguació. El deute més perillós no són les carpetes buides ni els documents antics: és que una IA puga llegir dues regles incompatibles i decidir per intuïció quina obeir.
Per tant:
00_BIOS: conservar com a històric, retirar autoritat.
MOTOROFFLINE: conservar com a futur o obsolet, retirar triggers.
Skills: reorganitzar per domini i responsabilitat.
Trellat, Reflexió i Workflow: fusionar jeràrquicament.
Ancoratge: convertir-lo en invariant mecànic.
Acta Marmota: una única instància canònica, indexada i amb estat.
Tailwind: fora del Core.
Dades personals: intocables sense base legal.
Qualsevol destrucció: SDP-LOCK obligatori.
