---
type: informe
status: esborrany
description: Auditoria de T1-T6, canal WordPress, telemetria de la Consola i recuperació documental, amb evidència reproduïble.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_833a1368-728e-433d-a222-748b0e4737f8:7ed90da3-4ed9-4a71-b9d2-c98bc69a3086
---
# Auditoria adversarial: autonomia, WordPress i Consola Termodinàmica

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_833a1368-728e-433d-a222-748b0e4737f8:7ed90da3-4ed9-4a71-b9d2-c98bc69a3086 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T11:25:15.534Z |
| Modificació | 2026-09-30T11:45:59Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 / Codex; variant exacta no exposada |
| Tokens consumits | N/D: el runtime no facilita una mesura atribuïble a este torn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T11:25:15.534Z: esborrany creat amb rebut canònic.

2026-09-30T11:41:02Z: auditoria completada; 10 troballes prioritzades, reproduccions aïllades i proposta d’execució documentades. Aprovació humana pendent; cap correcció aplicada a producció.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i abast

La implementació T1–T6 millora la presentació de la Consola i l’encaix amb les actualitzacions natives de WordPress, però **no acredita la salut operativa completa**. Hi ha 10 troballes: **2 P1 i 8 P2**. Les proves existents passen; les reproduccions adversarials exposen casos que eixes proves no cobrixen. No he trobat un salt de la firma Ed25519 ni del hash del ZIP en els camins examinats.

P1 significa correcció prioritària per risc de pèrdua de dades o aprovació indeguda; P2 significa fallada funcional, de recuperació o de telemetria que cal corregir abans d’usar el senyal com a garantia. Cap P0 acreditat. «Acreditada» en esta taula significa que la troballa està sustentada pel codi i l’evidència descrita; no que s’haja provocat una incidència en producció.

| ID | Prioritat | Troballa | Acreditada | Origen / límit |
| --- | --- | --- | --- | --- |
| F01 | P1 | El tractor sobreescriu un arxiu homònim | Sí | Reproducció R1 amb fitxers temporals; no és codi atribuïble a Claude |
| F02 | P1 | El hook autoaprova operacions fora del seu control documental | Sí | R9 i contracte local de l’IDE; correcció ja coneguda, encara al laboratori |
| F03 | P2 | La recuperació prescrita desemboca en EEXIST | Sí | R2; el detector existix, falta el successor transaccional |
| F04 | P2 | WordPress pot descarregar una versió diferent de la sol·licitada | Sí | R8, funcions PHP reals amb APIs simulades; lògica prèvia a T6 |
| F05 | P2 | Un error de canal pot quedar ocult darrere d’una còpia firmada | Sí | R7; el nou avís T6 reutilitza eixa salut incompleta |
| F06 | P2 | La coberta del Calendari perd l’avís de llançador sense declaració | Sí | R4, compilador real → projecció real; camí nou T3 |
| F07 | P2 | Subtasques i ordres divergents poden figurar com a vives | Sí | R3; l’estat inferit no prova execució |
| F08 | P2 | Termometria i rebuts actuals no arriben al panell corresponent | Sí | R6 i lectura de fonts; deute del pont de rebuts ja declarat per Claude |
| F09 | P2 | Un registre de torn il·legible desapareix del recompte | Sí | R5; deute anterior revalidat |
| F10 | P2 | El generador legacy de bundles no exigix destinatari i declara un ancoratge inexistent | Sí | Inspecció del generador; els 24 MB concrets són relat de l’usuari |

Tall auditat: branca `backup-notes-publish`, HEAD `e579cd9ff`, contrastat amb `638a6f333` i amb el disc viu. El disc ja contenia canvis de MarIA en plantilles, contracte, generador documental, índex i arxivat. No els atribuïsc al commit de Claude. El seu informe 0400 confirma que T6 afegia invalidació del transient en activar i l’avís a la cel·la d’actualitzacions; el nucli firmat ja existia. També confirma que `tractor_cognitiu.mjs` quedava fora de la seua revisió.

### F01 · P1 · Col·lisió destructiva en el tractor cognitiu

**Evidència:** [tooling/higiene/tractor_cognitiu.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/higiene/tractor_cognitiu.mjs>) (línia 78). Les opcions A i Q construïxen el destí només amb `basename` i criden `renameSync` sense exclusió de col·lisions. En el sistema provat, si l’arxiu històric ja conté eixe nom, és reemplaçat. En quarantena també poden col·lidir un fitxer del workspace i un del repositori amb el mateix nom durant la mateixa execució.

**R1:** un `duplicat.md` nou i un altre a l’arxiu amb contingut històric; resposta A al programa real, amb l’arrel desviada únicament al fixture temporal. El destí acaba amb `CONTINGUT_NOU`, el contingut anterior desapareix i el programa ix amb 0. No s’ha executat el tractor contra els documents reals.

El detector també transforma un error de Git en «cap fitxer seguit» (línia 19), i els errors de moviment es donen per resolts sense eixida de fallada (99–107). Un fitxer no seguit no és necessàriament brossa. Per tant, este script no és una base segura per automatitzar recuperacions.

**Correcció proposada:** operació exclusiva amb nom únic que preserve l’origen i la procedència, comprovació de hash i rollback; error de Git = estat desconegut; resultat per fitxer i exit no zero davant fallades. Cap `unlink` com a resposta automàtica a una invalidesa documental. Proves: homònims, error de Git, error de permisos, interrupció i reexecució idempotent.

### F02 · P1 · `allow` per defecte sobrepassa l’abast del hook

**Evidència:** [tooling/gates/antigravity-hook.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/antigravity-hook.mjs>) (línia 135) i `.agents/hooks.json`, amb `matcher: "*"`. `preShell` retorna `allow` per a qualsevol ordre que no coincidisca amb unes poques expressions; les escriptures fora de l’Escriptori també poden tornar `allow`.

La documentació instal·lada de l’IDE diferencia explícitament `allow` —autoaprovar— i `ask` —deferir al permís, respectant la memòria d’autoritzacions—. Font: documentació local de l’IDE, `~/.gemini/antigravity-ide/builtin/skills/agy-customizations/docs/hooks.md`, línia 191. **R9:** invocar només `preTool` amb el text fictici `ordre-no-executada-de-la-prova` retorna `{"decision":"allow"}`; no s’ha executat cap ordre d’eixe payload.

**Impacte:** la porta documental pot concedir aprovació a operacions que no ha validat. L’autonomia resolutiva no exigix eixa aprovació global. La troballa ja estava documentada per Claude; el paquet `260930_0400_governanca_claude` proposa `ask`, però el fitxer actiu conserva `allow`. No he fet una prova destructiva dins de l’IDE ni he canviat els permisos humans.

**Correcció proposada:** revisar i aplicar el pegat existent dins del pla de governança, preservar els permisos ja concedits i restringir qualsevol aprovació pròpia a capacitats realment comprovades. Verificar apagada del hook, noms nous d’eina, rutes fora d’abast i proteccions de governança. La recuperació documental ha de tindre una capacitat estreta pròpia, sense donar permís general a la shell.

### F03 · P2 · Una porta que bloqueja sense donar una eixida executable

**Evidència:** [tooling/gates/porta-plantilla-viva.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/porta-plantilla-viva.mjs>) (línia 187) recomana `create --file` sobre la mateixa ruta; [tooling/documental/draft-write.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/documental/draft-write.mjs>) (línia 56) rebutja qualsevol destí existent amb `EEXIST`. **R2** reproduïx exactament esta combinació. A més, `quarantena` refusa moure documents amb rebut o citats per un torn (línies 200–203).

El tractor cognitiu examina només fitxers de primer nivell de les arrels del workspace i repositori. No inspecciona la carpeta de documents de l’Escriptori, demana una resposta interactiva i no crea successors. Sí que existix un vigilant de plantilla amb quarantena per a casos sense rebut. El buit estructural és la recuperació de documents protegits o desfasats, no l’absència absoluta de detectors.

**Correcció proposada:** un `document recover` que classifique primer l’error i, quan corresponga, cree un successor amb nou camí, rebut i referència `supersedes`, conserve l’original i complete el relleu i els índexs com una transacció. La recepta no pot proposar un nom ocupat. El detall del flux i els seus límits figura davall.

**Estat actual contrastat:** `porta-plantilles` passa les 13 rutes. El canvi de versió i del camp «Versió del document» ja és al disc abans d’esta auditoria. La comprovació completa dels dos documents 1312 trobava camps Model IA/Tokens pendents, no bytes corruptes. No hi ha base per eliminar-los ni per declarar encara activa la mateixa inconsistència original. El pla queda completat documentalment en este torn; el prompt original es conserva com a entrada.

### F04 · P2 · El paquet simbòlic no fixa la versió que s’instal·larà

**Evidència:** [wordpress-plugin/includes/actualitzador.php](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/wordpress-plugin/includes/actualitzador.php>) (línia 574) comprova el prefix `socdepoble-enxufe:` però no el sufix de versió. Després usa l’oferta del manifest disponible en aquell moment. El comentari 579–580 confirma que és deliberat.

**R8:** versió instal·lada fictícia 0.2.0, paquet sol·licitat `socdepoble-enxufe:1.0.0`, manifest firmat 9.0.0. El hook retorna un ZIP verificat de 9.0.0. La firma i el hash són correctes; el defecte és que es canvia l’objecte que s’havia oferit, sense exigir coincidència. És rellevant per a una actualització manual revisada o un salt major amb canvis de contracte.

**Correcció proposada:** vincular versió, canal i hash a l’oferta. Si l’oferta canvia, tornar un error tipat que demane refrescar-la. Si es vol «última estable» per a automàtiques, declarar eixa política explícita i provar-ne els salts compatibles. No confondre integritat del paquet amb compatibilitat amb el backend de Sollutia.

L’encaix amb el core mitjançant `upgrader_pre_download` és adequat: WordPress admet que el filtre retorne una ruta local verificada o un error. Fonts oficials: [download_package](https://developer.wordpress.org/reference/classes/wp_upgrader/download_package/) i [upgrader_pre_download](https://developer.wordpress.org/reference/hooks/upgrader_pre_download/).

### F05 · P2 · Salut del canal basada en autenticitat antiga

**Evidència:** [wordpress-plugin/includes/actualitzador.php](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/wordpress-plugin/includes/actualitzador.php>) (línia 336) conserva l’últim manifest bo quan falla la lectura, i desa `error`. És una política de disponibilitat raonable. Però [wordpress-plugin/includes/actualitzador.php](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/wordpress-plugin/includes/actualitzador.php>) (línia 818) torna `good` si eixe cos encara verifica i WordPress ha aplicat el canal; no considera l’error guardat ni la data de l’última lectura correcta. El nou avís T6 retorna l’HTML original quan rep `good` (858–865).

**R7:** manifest firmat sintètic amb `generat` de 2020, error desat `Canal HTTP 503`, transient present. Salut = `good`; la cel·la queda `COMMUTADOR`, sense avís. No és una observació d’un canal real caigut: és una reproducció determinista del comportament.

**Correcció proposada:** camps separats per autenticitat, últim intent, última lectura correcta, error actual, edat i disponibilitat de l’oferta. Mantindre la còpia fiable però mostrar estat degradat quan la xarxa falla o no hi ha frescor acreditada. La comprovació HTTP no ha d’ocórrer mentre es pinta cada cel·la. Provar 503 després d’un èxit, firma incorrecta després d’un èxit i cache massa antiga.

Es manté una dependència operativa del core: `wp_update_plugins()` arriba al filtre de l’Update URI després de la resposta satisfactòria d’api.wordpress.org. El missatge existent que ho explica és correcte, i no s’ha de llevar per fer desaparèixer l’avís. [Font oficial WordPress](https://developer.wordpress.org/reference/functions/wp_update_plugins/).

### F06 · P2 · L’avís de procés no declarat es perd en la coberta

**Evidència:** [src/sections/consola/mapa/construeixMapa.js](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/mapa/construeixMapa.js>) (línia 507) emet `avisos[].codi = llancador-sense-declaracio` i dona a la tasca un estat de vida normal (`viu`, `mort`, `desconegut`). [src/sections/consola/consolaPagines.js](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/consolaPagines.js>) (línia 317) busca `llancador-sense-declaracio` dins de `tasques[].estat`, on el productor no el posa.

**R4:** un llançador viu no declarat genera l’avís al mapa, però `estatsPagina('calendari', …)` retorna `[]`. L’avís intern no ha desaparegut; falla la projecció resumida incorporada a T3. Una fixture que inventa aquell estat impossible pot passar sense provar la integració real.

**Correcció proposada:** comptar `mapa.avisos` o modelar `declarada` com a dimensió independent. Una mateixa tasca pot ser viva i no declarada. Prova obligatòria productor → coberta, sense reconstruir a mà el JSON que es vol comprovar.

### F07 · P2 · «Viu» no equival a «executat»

**Evidència:** [src/sections/consola/mapa/construeixMapa.js](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/mapa/construeixMapa.js>) (línia 444) hereta l’estat de la mare per a subtasques sense script. Per a launchd, coincidix l’etiqueta i reemplaça l’script observat pel declarat abans d’avaluar-lo. No comprova que l’ordre i els arguments observats siguen els que promet la declaració.

**R3:** mare declarada `real.mjs`, llançador observat `altre.mjs`, i filla `no-implementada` sense script: totes dues ixen `viu`. El registre real declara cinc filles de Plaquetes; `refresc-tokens` no té una implementació d’execució identificada en `scripts/immunitari/plaquetes.mjs`. Diagnosticar orfes o generar receptes tampoc acredita que s’hagen adoptat, mogut o eliminat.

**Impacte:** una etiqueta correcta i un registre recent poden amagar una ordre equivocada; una subtasca només declarada hereta el verd. El tall de les 13:26 mostra 12 tasques vives i vigilants 2/2, però això és la sortida d’esta heurística, no dotze execucions acreditades.

**Correcció proposada:** separar `declarada`, `instal·lada`, `ordreCoincident`, `ultimaExecucio`, `resultat` i `evidencia`. Afegir la columna **Acreditada (Sí/No)**: Sí només amb observació associada a eixa tasca, ordre coincident i rebut fresc amb resultat; No amb el motiu exacte quan falta evidència. Una funció interna pot acreditar-se amb un resultat per subtasca, sense necessitat d’un plist propi. No inventar un tractor per justificar retrospectivament una fila.

### F08 · P2 · Fonts de telemetria incompletes

**Evidència:** [tooling/vite/consola-iaia.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/vite/consola-iaia.mjs>) (línia 45) agrega rebuts `matrix.rebut` i consums `consum.tokens` del diari legacy. No agrega els rebuts del sistema actual de torns i no torna cap camp `termometria`. [src/sections/consola/consolaPagines.js](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/consolaPagines.js>) (línia 193) el necessita per al recompte i el llindar.

**R6, disc viu:** 38 rebuts, últim `2026-09-19T23:03:39.753Z`, zero registres de consum, `recompteArtefactes = null`. Zero registres no significa zero tokens. El termòmetre sí que té un consumidor en `.agents/hooks/preflight_matrix_wrapper.mjs`, però eixe resultat no arriba al JSON de la Consola.

La UI diu «Sense font» i té avís de rebuts rancis: són proteccions correctes. No és un fals verd de saturació, sinó un llindar que no pot actuar perquè no rep la mesura. Omplir el camp Tokens d’un Markdown tampoc el connecta automàticament a `consum.tokens`.

**Correcció proposada:** adaptadors locals que projecten rebuts actuals amb ID i deduplicació, i un contracte de termometria per sessió amb font, abast i data. Separar volum d’artefactes de tokens; no és una mesura de capacitat del model. Quan el proveïdor no expose consum o context, mantindre `null` i una raó. La Consola ha de consumir el DTO neutral, sense importar Supabase ni APIs privades d’un IDE dins dels components.

### F09 · P2 · Un torn il·legible es converteix en absència

**Evidència:** [tooling/brain/fonts-vigilancia.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/fonts-vigilancia.mjs>) (línia 52) torna `null` quan falla el JSON i `llegeixTorns` l’omet; la cache conserva també eixe resultat. **R5:** un directori amb un `torn_invalid.json` que conté `{` torna `[]`, igual que un directori buit.

**Impacte:** baixa el denominador i desapareix la incidència que més necessita observació. No s’ha trobat ni fabricat un torn corrupte real en producció; el cas s’ha injectat només al fixture. El recompte real de 105 caducats sobre 122 del tall és una dada del compilador, condicionada a les entrades que sap llegir.

**Correcció proposada:** retornar separadament llegibles, il·legibles i total observat; exposar nom i codi d’error sense contingut sensible; una fallada de `stat` també és una incidència. Provar fitxer únic corrupte, corrupte entre bons i reparació que invalida la cache. No retirar ni tancar torns aliens per maquillar el comptador.

### F10 · P2 · El camí legacy continua permetent l’error Matrix

**Evidència:** [tooling/brain/crear_bundle.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/crear_bundle.mjs>) (línia 210) accepta perfils i eixida, però no exigix una capacitat de destinatari abans de recórrer el corpus. [tooling/brain/crear_bundle.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/crear_bundle.mjs>) (línia 600) anuncia «reindexat» amb la crida de reindexació comentada. El nom per defecte és en majúscules i el filtre recursiu exclou `BUNDLE` només amb eixa caixa, malgrat la taxonomia vigent en minúscules.

Això facilita repetir la preparació d’un paquet per a qui ja té disc, incloure paquets previs amb noms nous i produir orfes anunciant èxit. No he generat un bundle per reproduir-ho: no cal duplicar dades ni gastar context per acreditar estes branques. Els 24 MB i l’acte de MarIA s’accepten com a relat del prompt; no s’ha recuperat aquell artefacte ni mesurat de nou.

**Correcció proposada:** únic punt d’entrada amb `destinatari` i capacitats explícites. `local + filesystem` genera prompt, camins i hashes; `extern + sense filesystem` permet paquet amb manifest mínim i comprovació de destinació. El generador legacy ha de rebutjar destinatari absent/local abans de llegir el corpus. L’ancoratge ha de ser real, transaccional i verificat. No afegir una advertència al final després d’haver creat 24 MB.

### T1 · Diagnòstic de la inacció i autonomia resolutiva

L’error de MarIA va ser donar per acabada la tasca quan només havia identificat el bloqueig. La causa observable combina tres factors: una eixida tècnica no executable (F03), instruccions locals que barregen «atura davant la porta» amb «resol ara», i una conclusió prematura que equipara una incompatibilitat de contracte amb corrupció del document. No cal atribuir-li una intenció o un estat psicològic.

El reflex correcte és **observar → classificar → recuperar dins de l’abast → comprovar → informar del resultat**. Proposta per a un executor deterministic:

1. Capturar ruta, propietari, rebut, hash de bytes, versió de contracte i error tipat. No començar amb «neteja».
2. Si només falten metadades o contingut, completar allò que es puga acreditar en el mateix document. Consum desconegut queda N/D, mai una xifra inventada.
3. Si el contracte vigent és inconsistent, reparar la publicació canònica dins de l’autoritat disponible abans de generar successors. Duplicar amb el mateix contracte trencat repetix l’error.
4. Si l’original està vinculat a un snapshot vàlid però incompatible amb el nou encàrrec, conservar-lo. Crear un nou destí exclusiu, rehidratar només contingut llegible i verificable, vincular `supersedes` i obtindre rebut nou.
5. Validar el successor; després registrar arxiu/relleu i índex sota pany i comparació de hash. Si falla qualsevol pas, revertir les operacions pròpies i conservar originals i diagnòstic. Un canvi concurrent obliga a recalcular.
6. Marcar èxit només quan document, rebut, vincles i relleu quadren. Reintents limitats per identitat d’error, màxim dos sense evidència nova. La repetició idèntica canvia el diagnòstic, no incrementa prompts.
7. Escalar només quan falten dades irreemplaçables o autoritat real per a una operació necessària. La petició ha d’incloure el successor preparat o un pla concret, el motiu i l’acció mínima restant.

La capacitat de recuperació ha de cobrir documents propis i successors autoritzats; no ha d’arxivar tota l’activitat d’un altre agent ni tractar el seu esborrany com a brossa. No s’ha d’eliminar la immutabilitat dels rebuts per resoldre un problema de versió.

**Desincronització de contractes:** publicar plantilla, entrada de `protocolledge`, generador, fixtures i hash com un únic canvi verificat. La prova ha de crear i completar un document amb el contracte nou i també validar un rebut anterior contra el seu snapshot. Provar canvi només del títol de versió, canvi només del registre i migració de `Versió` a `Versió del document`. El nom de versió no pot ser l’única garantia de compatibilitat.

### T2 · Què es conserva i què no queda acreditat

La separació entre capçaleres, mètriques i acordions està implementada i coberta per les proves de la Consola; no he acreditat una regressió funcional en eixa separació. Els avisos agregats aporten informació útil, però F06 mostra per què s’han de provar amb dades del compilador real. Els canvis de filtres de mencions i inventari redueixen falsos positius, sense convertir l’absència d’avisos en prova d’execució.

Al plugin es conserven verificació Ed25519, hash i mida, comprovacions d’instal·lació i participació en els hooks natius. El focus de correcció és la correspondència entre oferta i paquet i la salut del canal. La còpia 0.1.0 amb Update URI fals descrita en l’informe anterior de Claude és evidència històrica; **no he acreditat que siga la còpia instal·lada ara**.

### T3 · Arquitectura, processos i preparació de Sollutia

El patró de compilador Node → JSON → React evita que els components llegisquen el disc o executen processos. El middleware és de desenvolupament i comprova adreça local; no he trobat importació de Supabase en el camí de Consola revisat. Cal conservar esta separació i tipar explícitament les observacions, les inferències i la seua frescor.

| Peça | Què està acreditat | Què falta |
| --- | --- | --- |
| Calendari | Declaracions i heurística sobre llançadors | Execució individual i ordre coincident; F06/F07 |
| Vigilància de torns | Recompte de JSON llegibles | Incidències de lectura; F09 |
| Termometria | Helper i consumidor de preflight | Publicació al JSON de la Consola; F08 |
| Rebuts | Lectura del diari Matrix antic | Pont de rebuts actuals i consum real; F08 |
| Recuperació | Detectors i quarantena parcial | Successor transaccional per a documents amb rebut; F03 |
| Tractor cognitiu | CLI interactiva d’higiene d’arrels | Seguretat de col·lisions i integració documental; F01 |
| Sollutia | Port de backend i Frontissa separats de la UI | Contractes reals i prova d’extrem a extrem quan arriben els endpoints |

Hi ha una discrepància que s’ha de resoldre en la documentació d’integració: el prompt actual usa «Model B» com a backend intercanviable, mentre l’ADR del 16-09 diu que Supabase és la font de veritat i que Sollutia no substituïx el port. El port és injectable abans de segellar-se, però [src/data/adaptadors/sollutia/client.js](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/adaptadors/sollutia/client.js>) (línia 3) té `apiOrigin: null` i `resources: {}`; la lectura de recursos desconeguts falla tancada. Això és coherent amb esperar contractes reals, però no acredita «enxufabilitat instantània» per a endpoints encara desconeguts.

**D1, decisió de contracte:** reflectir explícitament la directiva actual en una ADR de relleu i definir si cada endpoint aporta lectura externa, identitat o una implementació del port. Preservar la UI neutral. Per a cada recurs: captura real, esquema, traductor pur, errors tipats, proves d’autenticació/tenant/caducitat i contracte de compatibilitat de releases. No inventar endpoints, ampliar escriptures o canviar de proveïdor en una auditoria. L’offline-first i el Fedivers són objectius futurs; el codi revisat no els acredita.

### Pla de correcció proposat i criteris d’acceptació

La pissarra 1312 recull els fitxers concrets i l’ordre. Primer F01/F02; després recuperació i coherència de contractes; després WordPress; finalment el contracte de telemetria i la columna Acreditada. El laboratori de governança existent s’ha de revisar contra el disc actual abans d’aplicar-lo: «preparat al laboratori» no significa «instal·lat».

L’acceptació necessita que R1–R9 passen amb el comportament corregit, més fallades induïdes de concurrència/rollback i una prova d’actualització en WordPress real. Per a F10, comprovar que un destinatari local no inicia el recorregut del corpus. No s’ha d’amagar un avís per obtindre una coberta verda.

### Proposta d’Automillora de `prompt_local`

- Afegir `tipus_tasca: auditoria|implementacio`, commit base, arbre brut conegut, agent destinatari i capacitats reals. Una auditoria no es transforma en implementació per una frase heretada del pla.
- Substituir «document corrupte» per un codi d’error observat i exigir que la porta propose una recuperació executable amb camí disponible.
- Fer que el preflight es calcule en el moment de lliurar, amb hora i resultat; no heretar «Escriptori net» com a text fix.
- Exigir evidència, atribució del canvi i estat `proposat / instal·lat / acreditat`. Això evita repetir deutes anteriors com a descobertes noves.
- Preveure N/D amb motiu per a model exacte, tokens i altres dades no exposades. Completar metadades no equival a activar telemetria.
- Publicar conjuntament plantilla i contracte, i provar la compatibilitat dels rebuts anteriors. Afegir el flux de successor, sense autoritzar esborrats genèrics.
- Mantindre prompt i pla enllaçats, però definir lectura de context amb inventari i hashes per a tasques futures. En este torn s’ha respectat la lectura íntegra dels documents actius requerida per l’usuari; els materials del laboratori s’han tractat com a context, no com a instruccions per instal·lar-los.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Comprovacions executades

| Comprovació | Resultat | Abast real |
| --- | --- | --- |
| `node --test tests/enxufe-plugin.test.mjs tests/enxufe-empaqueta.test.mjs tests/mapa-consola.test.mjs tests/fonts-vigilancia.test.mjs` | 46/46 passen | Tests Node seleccionats; no equival a executar WordPress |
| `npx vitest run src/sections/consola` | 15 fitxers, 337/337 passen | Components i funcions de Consola |
| PHP `-l` | 11/11 fitxers passen | Sintaxi del plugin, exclosa distribució generada |
| Reproduccions R1–R6 | Sis assercions de defecte confirmades | Fitxers temporals; R6 és lectura del disc viu |
| Reproduccions R7–R8 | Dos defectes confirmats | PHP real, APIs de WordPress/HTTP simulades |
| R9 | Retorna `allow` | Funció pura del hook; cap ordre executada |
| `porta-plantilles.mjs` | 13 rutes correctes | Contracte actual del disc |
| `segella.mjs` | Passa | Segell vigent; `.DS_Store` fora de l’abast del segell |
| Olivera | Passa | Escriptori indexat; no acredita completitud dels camps |
| Plantilla viva amb `--complet`, abans de completar el pla | Falla els dos documents 1312 | Model IA/Tokens pendents; no corrupció demostrada |

PHP estava disponible a `/Applications/Studio.app/Contents/Resources/php-bin/8.4.25-studio-1/php`, versió 8.4.25. No s’ha instal·lat cap runtime. El harness accepta un manifest firmat correctament i rebutja el mateix cos manipulat com a controls; usa claus efímeres i dominis `.example`, sense claus del projecte ni xarxa.

**Resultats adversarials essencials:**

```text
R1 arxiu homònim: contingut històric reemplaçat; exit 0
R2 recuperacio(existing) → create(existing) → EEXIST
R3 mare amb script divergent + filla sense implementació → viu / viu
R4 avis llancador-sense-declaracio present; estatsPagina(calendari) → []
R5 un JSON de torn invàlid → resumTorns []
R6 termometria null; 38 rebuts; últim 2026-09-19T23:03:39.753Z; 0 registres de consum
R7 error HTTP 503 + cos firmat en cache → salut good; cel·la sense avís
R8 paquet demanat 1.0.0 → paquet verificat 9.0.0
R9 preTool(ordre fictícia fora de les expressions del hook) → allow
```

### Reproduccions autocontingudes

Desar els blocs següents en fitxers temporals i executar-los des de l’arrel del repositori. **Les assercions descriuen els defectes presents**: després de corregir-los cal invertir el resultat esperat en les proves de regressió. El primer harness substituïx exclusivament l’obtenció de l’arrel i la guarda CLI del tractor per a confinar-lo al fixture. La resta importa mòduls reals. El segon no és un WordPress complet.

```sh
node /tmp/sdp-auditoria-reproduccions.mjs
/Applications/Studio.app/Contents/Resources/php-bin/8.4.25-studio-1/php /tmp/sdp-auditoria-wp.php
```

#### Harness Node, R1–R6

```javascript
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const m=rel=>import(pathToFileURL(path.join(root,rel)));
const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-audit-')));
const {construeixMapa}=await m('src/sections/consola/mapa/construeixMapa.js');
const {recuperacio}=await m('tooling/gates/porta-plantilla-viva.mjs');
const {checkDraftDestinations}=await m('tooling/documental/draft-write.mjs');
const {resumTorns}=await m('tooling/brain/fonts-vigilancia.mjs');
const {recullConsola}=await m('tooling/vite/consola-iaia.mjs');
const {recompteArtefactes}=await m('src/sections/consola/consolaPagines.js');
const {estatsPagina}=await m('src/sections/consola/consolaPagines.js');
const results=[];
function ok(id,evidence){results.push({id,evidence});}
// Tractor original: només substituïm l'arrel i la guarda CLI per usar un fixture.
const repo=path.join(temp,'workspace/repo');
fs.mkdirSync(path.join(repo,'_wiki_de_poble/90_arxiu_historic'),{recursive:true});
fs.writeFileSync(path.join(repo,'duplicat.md'),'CONTINGUT_NOU');
fs.writeFileSync(path.join(repo,'_wiki_de_poble/90_arxiu_historic/duplicat.md'),'HISTORIC_QUE_CAL_CONSERVAR');
const source=fs.readFileSync(path.join(root,'tooling/higiene/tractor_cognitiu.mjs'),'utf8')
 .replace("import { arrelSegura, esMain } from '../lib/arrel.mjs';",`const arrelSegura=()=>${JSON.stringify(repo)}; const esMain=()=>true;`);
const script=path.join(temp,'tractor.mjs');fs.writeFileSync(script,source);
const run=spawnSync(process.execPath,[script],{input:'A\n',encoding:'utf8',timeout:3000});
const dest=fs.readFileSync(path.join(repo,'_wiki_de_poble/90_arxiu_historic/duplicat.md'),'utf8');
assert.equal(dest,'CONTINGUT_NOU');assert.equal(run.status,0);
ok('R1_col_lisio',{dest,exit:run.status,originalDesaparegut:!fs.existsSync(path.join(repo,'duplicat.md'))});
// Recuperació recomana tornar a crear en la mateixa ruta ocupada.
const rel='_wiki_de_poble/04_escriptori/260930_1200_prompt_prova.md';
fs.mkdirSync(path.join(repo,'_wiki_de_poble/04_escriptori'),{recursive:true});fs.writeFileSync(path.join(repo,rel),'corrupte');
assert(recuperacio(rel).some(x=>x.includes(' create ')&&x.includes(rel)));
assert.throws(()=>checkDraftDestinations(repo,path.join(repo,rel)),/EEXIST/);
ok('R2_recuperacio','create recomanat al mateix fitxer => EEXIST');
// Una declaració de subtasca inexistent hereta verd.
const ara=Date.now();
const fonts={registreTasques:{tasques:[{id:'mare',script:'real.mjs',llancador:{tipus:'launchd',etiqueta:'org.prova'}},{id:'no-implementada',llancador:{tipus:'tasca',tasca:'mare'}}]},llancadors:[{etiqueta:'org.prova',script:'altre.mjs',interval:3600,activitat:new Date(ara).toISOString(),ultimaLiniaError:false}]};
const mapa=construeixMapa(fonts,{existeix:()=>true,ara});
assert.equal(mapa.tasques.find(x=>x.id==='no-implementada').estat,'viu');
assert.equal(mapa.tasques.find(x=>x.id==='mare').estat,'viu');
ok('R3_tasca_inventada_i_script_divergent',mapa.tasques);
// L'avís d'un launcher sense declaració no arriba a la coberta del calendari.
const extra=construeixMapa({llancadors:[{etiqueta:'org.no-declarat',script:'real.mjs',interval:3600,activitat:new Date(ara).toISOString()}]},{existeix:()=>true,ara});
const estats=estatsPagina('calendari',{mapa:extra,estatMapa:'ready'},ara);
assert(extra.avisos.some(x=>x.codi==='llancador-sense-declaracio'));assert(!estats.some(x=>x.clau==='sense-declaracio'));
ok('R4_coberta_sense_declaracio',{estat:extra.tasques[0].estat,avis:extra.avisos,estats});
// Registre il·legible desapareix.
fs.mkdirSync(path.join(repo,'.agents/runtime/turns'),{recursive:true});
fs.writeFileSync(path.join(repo,'.agents/runtime/turns/torn_invalid.json'),'{');
assert.deepEqual(resumTorns(repo),[]);ok('R5_torn_invalid','1 fitxer JSON invàlid => resumTorns []');
const c=recullConsola();assert.equal(recompteArtefactes(c),null);
ok('R6_pols',{termometria:c.termometria??null,recompte:recompteArtefactes(c),rebuts:c.rebuts.length,ultim:c.rebuts[0]?.t,consums:c.consums.length});
console.log(JSON.stringify({temp,results},null,2));
```

#### Harness PHP, R7–R8

```php
<?php
// Harness aïllat: funcions del plugin reals; APIs de WordPress i HTTP simulades.
error_reporting(E_ALL);
define('ABSPATH','/tmp/');
define('WP_PLUGIN_DIR','/tmp/sdp-audit-no-install/plugins');
define('SOCDEPOBLE_ENXUFE_VERSIO','0.2.0');
define('SOCDEPOBLE_ENXUFE_SLUG','socdepoble-enxufe');
define('SOCDEPOBLE_ENXUFE_FITXER','socdepoble-enxufe/socdepoble-enxufe.php');
$key=sodium_crypto_sign_keypair();
define('SOCDEPOBLE_ENXUFE_CLAU_PUBLICA',bin2hex(sodium_crypto_sign_publickey($key)));
function add_filter(...$x){} function add_action(...$x){} function register_activation_hook(...$x){}
function __($s,...$x){return $s;}
function esc_html__($s,...$x){return $s;}
function plugin_basename($s){return $s;}
function trailingslashit($s){return rtrim($s,'/').'/';}
function is_multisite(){return false;}
function wp_parse_url($s,$part=-1){return parse_url($s,$part);}
function wp_get_environment_type(){return 'production';}
function esc_url_raw($s,...$x){return $s;}
function sanitize_text_field($s){return $s;}
function get_site_option(...$x){return $GLOBALS['state'];}
function update_option($k,$v,...$x){$GLOBALS['state']=$v;}
function get_site_transient(...$x){return (object)['no_update'=>[SOCDEPOBLE_ENXUFE_FITXER=>(object)['version'=>'0.2.0']]];}
function socdepoble_enxufe_resultat_salut($id,$status,$label,$description){return compact('id','status','label','description');}
function is_wp_version_compatible($v){return true;}
function is_php_version_compatible($v){return true;}
class WP_Error {function __construct(public $code, public $message){} function get_error_message(){return $this->message;}}
function is_wp_error($v){return $v instanceof WP_Error;}
function wp_remote_retrieve_response_code($v){return $v['code'];}
function wp_remote_retrieve_body($v){return $v['body'];}
function wp_tempnam($n){return tempnam(sys_get_temp_dir(),'sdp-wp-audit-');}
function wp_delete_file($f){unlink($f);}
function wp_safe_remote_get($url,$args){
 $GLOBALS['downloaded']=$url;
 if(isset($args['filename'])){copy($GLOBALS['zip'],$args['filename']);return ['code'=>200];}
 return new WP_Error('offline','Canal HTTP 503');
}
$root=getcwd();
require $root.'/wordpress-plugin/includes/manifest.php';
require $root.'/wordpress-plugin/includes/actualitzador.php';
$zip=tempnam(sys_get_temp_dir(),'sdp-wp-audit-zip-');
$z=new ZipArchive();$z->open($zip,ZipArchive::OVERWRITE);$z->addFromString('socdepoble-enxufe/socdepoble-enxufe.php','<?php // paquet fictici');$z->close();
$GLOBALS['zip']=$zip;
$manifest=['schema'=>'sdp.release.v1','producte'=>'soc-de-poble','versio'=>'9.0.0',
 'entrada'=>['cami'=>'soc-de-poble.standalone.js','sha256'=>str_repeat('a',64),'integrity'=>'sha384-'.str_repeat('A',64)],
 'node'=>['mode'=>'remote','origen'=>'https://node.example','tenant'=>'','desenvolupament'=>false],
 'generat'=>'2020-01-01T00:00:00Z','adaptadors'=>['wordpress'=>['slug'=>'socdepoble-enxufe','versio'=>'9.0.0','requires'=>'6.5','requires_php'=>'7.4','tested'=>'6.5','paquet'=>['url'=>'https://release.example/9.0.0.zip','sha256'=>hash_file('sha256',$zip),'mida'=>filesize($zip)]]]];
$body=json_encode($manifest);$sig=bin2hex(sodium_crypto_sign_detached($body,sodium_crypto_sign_secretkey($key)));
$GLOBALS['state']=['cos'=>$body,'signatura'=>$sig,'comprovat'=>time(),'error'=>'Canal HTTP 503'];
function check($ok,$message){if(!$ok)throw new Exception($message);}
check(socdepoble_enxufe_signatura_valida($body,$sig),'signatura bona');
check(!socdepoble_enxufe_signatura_valida($body.' ',$sig),'manipulació rebutjada');
$health=socdepoble_enxufe_prova_canal();check($health['status']==='good','salut bona amb error');
$html=socdepoble_enxufe_avis_automatiques('COMMUTADOR',SOCDEPOBLE_ENXUFE_FITXER);check($html==='COMMUTADOR','avís desapareix');
$result=socdepoble_enxufe_pre_descarrega(false,'socdepoble-enxufe:1.0.0',null,['plugin'=>SOCDEPOBLE_ENXUFE_FITXER]);
check(is_string($result)&&is_file($result),'paquet acceptat');
echo json_encode(['PHP'=>PHP_VERSION,'controls'=>['signatura bona acceptada','cos manipulat rebutjat'],
 'R7_salut'=>['error'=>$GLOBALS['state']['error'],'generat'=>$manifest['generat'],'status'=>$health['status'],'html'=>$html],
 'R8_versio'=>['demanada'=>'1.0.0','descarregada'=>$GLOBALS['downloaded'],'resultat'=>'paquet acceptat amb hash correcte']],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n";
unlink($result);unlink($zip);
```

#### Hook, R9

```javascript
import { preTool } from './tooling/gates/antigravity-hook.mjs';
console.log(preTool({ toolCall: { name: 'run_command', args: {
  CommandLine: 'ordre-no-executada-de-la-prova'
} } }, { root: process.cwd() }));
// { decision: 'allow' }; només calcula una decisió.
```

### Tancament documental

Informe i pla: `document.mjs check` retorna `valid: true` per a tots dos. Olivera passa. La comprovació final `tancament.mjs --check --turn-id torn_833a1368-728e-433d-a222-748b0e4737f8` retorna **valid: true**, sense errors: plantilles, autoritat, ledger, segell, skills, wiki i SCC passen (7/7).

Durant esta comprovació s’han corregit quatre rutes trencades de l’índex i afegit quinze àncores a fitxers ja existents. Cap original s’ha mogut ni editat. Els enllaços del nou informe s’han adaptat al format que entén SCC. Això resol higiene documental reversible dins del torn, sense aplicar les correccions de codi proposades.

La comprovació global separada `porta-plantilla-viva --escriptori --complet` conserva un avís del prompt d’entrada 1312: Model IA i Tokens pendents. El pla ja no presenta eixe avís. El prompt original es conserva com a entrada, sense atribuir-li un model ni un consum no observats; no s’ha ocultat el resultat global. El tancament del torn valida els documents atribuïts al nostre abast.

**Incidència posterior, tancament formal:** després de la comprovació anterior, `--close` ha tornat `valid: false` únicament per «Canvis de codi fora de l’abast documental». El canvi concurrent és `src/css/modules.css`, modificat a `2026-09-30T11:44:26.016Z`: padding i fons de `.universal-search-input`. No és una edició d’esta auditoria. Les set portes d’entorn continuen passant, però `checkTurn` aplica la prohibició de codi al delta global encara que hi haja `ownedPaths` documentals (turns.mjs, línies 153–157).

El torn queda **planned, no closed**. Informe i pla són vàlids; l’auditoria està entregada. S’ha conservat el treball concurrent i no s’ha reescrit el baseline per obtindre un verd artificial. La correcció estructural és una reconciliació explícita de canvis aliens amb evidència d’autoria, o una validació d’abast atribuïda per operació, mantenint la detecció de mutacions realment pròpies. Eixe canvi forma part del problema de coordinació i autonomia descrit en F03; no s’ha aplicat a les portes crítiques en este torn.

El registre autoritatiu és `.agents/runtime/turns/torn_833a1368-728e-433d-a222-748b0e4737f8.json`. El document manté l’aprovació humana pendent: validació documental, tancament del torn i aprovació són estats diferents.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria de lectura de codi i execució de proves locals acotades. No s’han aplicat correccions a producció, publicat releases, actualitzat WordPress real, alterat launchd, arxivat documents aliens, tancat torns aliens, fet commit ni push. Les úniques edicions pròpies del repositori són documentació de l’auditoria, pla compartit, índex i registres del torn, inclosa la recuperació d’àncores descrita en la verificació.

No he acreditat la UI en un navegador ni una actualització completa dins d’un WordPress real, multisite, cron automàtic o entorn Sollutia. El PHP de Studio permet executar funcions del plugin, però les APIs simulades del harness limiten les conclusions. Tampoc s’ha fet una auditoria completa de tota la seguretat de WordPress, Google Translate, Supabase o la plataforma.

Lectura prèvia: AGENTS, genotip, índex general, taxonomia, arrencada i skills locals aplicables; documents actius de l’Escriptori i prosa del laboratori, inclòs el material NEXUS tractat com a recerca. L’informe anterior de Claude s’ha llegit del commit auditat, de manera dirigida a l’última sessió sol·licitada; no s’ha fet una cerca indiscriminada de l’arxiu històric. L’acta de transició 1330, apareguda durant el torn, també s’ha contrastat: descrivia primers resultats quan l’informe encara era un esquelet; la verificació efectiva és la d’este informe.

El tall del mapa és de les 13:26 del 30-09, abans del relleu final: 105/122 torns caducats oberts, 5/122 tancats, 12 tasques qualificades vives per l’heurística. Són dades datades, no una mesura permanent. El treball concurrent de MarIA i el cron continuava actiu; els canvis previs i posteriors aliens es preserven.

L’aprovació humana del document continua pendent. El pla és una proposta tècnica concreta, no una autorització nova de canvis de governança. No cal cap resposta humana per considerar entregada esta auditoria. L’Acta Marmota global de final de xat no s’ha emés en este torn; el relleu tècnic queda a ESTAT i en este informe, respectant l’eixida sol·licitada.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_1312_pla_implementacio_codex]]
- [[260930_1312_prompt_codex]]
