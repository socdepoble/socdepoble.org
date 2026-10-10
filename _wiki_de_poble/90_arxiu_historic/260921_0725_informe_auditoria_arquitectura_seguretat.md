---
type: informe
status: esborrany
description: Auditoria verificable d’arquitectura Pedra Seca, seguretat operativa i connectors externs sobre el BUNDLE del 21 de setembre.
tags:
  - arquitectura
  - seguretat
  - disseny
---
# Informe del Consell: arquitectura i seguretat de Sóc de Poble

## 1. Dictamen

**Hi ha una base arquitectònica aprofitable, però el BUNDLE no justifica afirmar que la memòria està blindada ni que totes les portes són fail-closed.** He reproduït problemes de contenció, validació i persistència. La prioritat és tancar-los abans d’ampliar l’autonomia dels agents o connectar dades sensibles.

Pedra Seca té peces bones: components propis, tokens, CSS natiu, port de backend, càrrega diferida i sanejament centralitzat. El problema més greu és la distància entre allò que prometen els comentaris i allò que comproven tots els camins executables. Una barrera robusta en un camí no compensa una entrada alternativa sense la mateixa protecció.

**El model USB és una bona direcció, encara pendent de convertir-se en un contracte executable.** Separar arxiu, gestoria i multimèdia evita carregar el nucli amb tot. La separació física, però, no limita els permisos del procés ni impedix que un indexador publique informació externa.

No propose una reescriptura general ni afegir un framework. Propose menys camins d’escriptura, una sola política d’origen, validació coherent i proves que intenten trencar les garanties.

## 2. Registre, abast i límits

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-ARQ-SEC-260921-CODEX |
| Versió | 1.0.0 |
| Data | 21-09-2026, Europe/Madrid |
| Agent redactor | ChatGPT Codex |
| Propietari | Consell |
| Aprovació humana | pendent |
| Objecte | Instantània del BUNDLE, no certificació de producció |
| Intervenció | Lectura, extracció verificada i proves en temporals |

No s’ha adjuntat una ruta concreta en el missatge. He seleccionat el BUNDLE local més recent: `260921_0314_BUNDLE_null.md`, generat a les `2026-09-21T01:14:23.975Z` —03:14 a Madrid—. És anterior al registre 06:45 del prompt: qualsevol canvi posterior queda fora d’aquest dictamen.

- **640 fitxers; 3.702.833 bytes de contingut inventariat.** Tots els SHA-256 coincideixen amb el manifest. Sentinella final present.
- SHA-256 del BUNDLE: `1f601c16bc55874eaf5d76f2f79f0ddbcc5c34fc3e66c079113921fb7f5668cd`.
- Sense cerca web, instal·lacions de paquets, peticions a serveis reals ni lectura de `.env`.
- Cap modificació del codi font, de la Wiki, dels segells o de l’estat d’agents originals. L’informe es lliura fora de `socdepoble.org` com a resultat de l’auditoria.
- Les proves natives usen Node 24.13.0. Vitest usa les dependències locals ja instal·lades, amb URL i clau sintètiques; el BUNDLE no inclou lockfile. Per tant, aquesta execució no és una reconstrucció hermètica de dependències.
- S’han verificat tots els bytes, però això no equival a revisió semàntica exhaustiva de cada fitxer. La revisió profunda se centra en les fronteres de confiança i els camins descrits ací.

Les referències de codi en aquest informe obrin **la còpia exacta dins del BUNDLE**, no el fitxer actual del repositori. El número que apareix al text és la línia del fitxer original; l’enllaç apunta a la línia corresponent dins del BUNDLE.

### Allò que el BUNDLE no permet certificar

El contracte exclou `.git`, hooks, configuració d’Obsidian i diversos recursos; tampoc inclou el workflow de CI, el lockfile, el backend `bot/` ni el desplegament WordPress complet. No he verificat proteccions de branca, polítiques efectivament aplicades a Supabase, capçaleres de producció, restauració real de backups ni l’interior de les carpetes externes.

El fitxer `tooling/gates/porta-reflex.mjs` esmentat en el prompt **no està en aquesta instantània**. `package.json` associa `porta:reflex` a `tooling/wiki/reflex_petorreta.mjs doctor --ci`. No atribuïsc al fitxer absent ni els encerts ni els defectes de l’altre. Font: [package.json:44](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:11428>).

## 3. Prioritats

P1 significa correcció prioritària per risc de credencials, exposició o pèrdua de dades, o per invalidar una garantia de protecció. P2 significa defecte rellevant amb impacte més limitat o camí d’explotació no acreditat. No s’ha demostrat cap compromís de producció.

| ID | Prioritat | Troballa | Evidència |
| --- | --- | --- | --- |
| S01 | P1 | REST pot enviar el JWT a un origen diferent del fixat pel client SDK | Prova amb `fetch` simulat |
| S02 | P1 | RAG seguix symlinks a fitxers externs i genera un índex públic sense classificació | Reproducció amb canari sintètic |
| S03 | P1 | Un desat antic elimina l’esborrany persistent més recent | Reproducció de concurrència amb IDB simulat |
| S04 | P1 | Tanca dependent de `cwd`; segells i restaurador amb camins sense lease | Reproducció i lectura de codi |
| S05 | P2 | Enum de tags no aplicat per tots els validadors | Quatre entrades invàlides acceptades |
| S06 | P2 | Utilitat de rutes permet eixida per symlink amb ancestres inexistents | Escriptura sintètica fora de l’arrel de prova |
| S07 | P2 | Rollback auxiliar deixa fitxers nous després d’error | Reproducció; no s’ha trobat consumidor actiu |
| S08 | P2 | Porta RLS dona verd amb RLS desactivat | Fixture SQL acceptada |
| S09 | P2 | Consola de desenvolupament exposada sense autenticació amb servidor a totes les interfícies | Configuració i middleware |
| A01 | P2 | Providers globals provoquen consultes duplicades i càrrega innecessària | Traçat de crides |
| A02 | P2 | Mur i Multimèdia retenen dades de l’scope anterior durant el canvi | Lectura dels providers |
| A03 | P2 | Aïllament visual de múltiples instàncies amb sessió global compartida | Lectura del servei de sessió |
| A04 | P2 | Deriva de tokens, rutes i polítiques de validació | Portes executades i contrast de codi |

## 4. Seguretat: troballes i reforç

### S01. El pany del backend no cobrix el transport REST

**Fonts:** [src/data/supabase/config.js:13](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:33220>), [src/data/supabase/runtime.js:28](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:33681>), [src/data/supabase/runtime.js:42](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:33695>), [src/PedraSecaEmbed.jsx:155](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:35419>).

`getClient()` fixa URL i clau pública i rebutja configuracions diferents. En canvi, `request()` resol de nou qualsevol configuració rebuda i adjunta el JWT global de `sessionStorage`. No consulta el pany del client SDK. `sanejaConfig()` admet qualsevol subdomini HTTPS de `supabase.co`; els atributs de l’element es poden recalcular després del muntatge.

**Prova:** després de fixar `https://original.supabase.co`, el SDK rebutja `https://different.supabase.co`, però `request('/rest/v1/notes', configB)` invoca `fetch` contra B amb `Authorization: Bearer synthetic-user-jwt`. La prova intercepta `fetch`: cap credencial real ni xarxa.

**Impacte i condició:** si un actor menys fiable pot modificar aquesta configuració o injectar un element que la use, el transport pot dirigir credencials fora de l’origen previst. S’ha demostrat l’enviament al segon origen, no la captura en un servei real. Cal verificar quins permisos dona el CMS sobre aquests atributs. Un usuari amb JavaScript arbitrari al mateix origen ja té un problema més ampli; aquesta troballa és especialment pertinent quan només es permet editar configuració o HTML.

**Correcció:** una política immutable compartida per REST, SDK, renovació i OAuth; orígens exactes configurats pel host de confiança. Validar el destí abans de llegir o adjuntar tokens. Lligar la sessió a aquesta política i rebutjar canvis de backend amb sessió activa. Mantindre `redirect: 'error'` i aplicar el criteri a tots els transports.

**Acceptació:** URL B, segona instància incompatible i canvi d’atribut fallen abans de `fetch`. No hi ha cap capçalera d’autenticació enviada fora de l’origen autoritzat.

### S02. Un enllaç simbòlic pot entrar al RAG públic

**Font:** [tooling/wiki/core/build_rag_index.mjs:13](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:73364>) i [tooling/wiki/core/build_rag_index.mjs:109](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:73460>).

El walker descarta alguns noms de carpetes, però accepta qualsevol entrada acabada en `.md` que no siga un directori, sense exigir `isFile()` ni rebutjar `isSymbolicLink()`. `readFile()` seguix el symlink. `npm run rag:build` recorre `.` i escriu `public/rag-index.json`.

**Prova:** un `linked.md` dins de l’arrel de prova apunta a un fitxer extern amb `canaryprivatxyz`. `buildIndex()` inclou el document i el terme en l’índex invertit.

L’índex conté rutes i vocabulari associat a documents, **no una còpia literal sencera**. Eixa informació també pot ser sensible. A més, el walker no restringix el corpus a documents aprovats per a publicació: una nota interna normal, sense symlink, pot acabar-hi si no coincidix amb les exclusions de nom. Les exclusions del generador del BUNDLE no són automàticament exclusions del RAG.

**Correcció:** corpus públic explícit per manifest; només fitxers regulars, contenció física i tractament explícit de hardlinks. Cap lectura recursiva de tot el projecte com a font publicable. Separar cerca interna de cerca pública. Un connector extern només pot aportar documents exportats expressament per a aquest destí.

**Acceptació:** proves amb nota interna, symlink de fitxer i directori, carpeta externa i marcador sensible sintètic; cap apareix en l’artefacte públic. La construcció falla quan no pot decidir la classificació.

### S03. Un ACK antic pot destruir l’últim esborrany persistent

**Font:** [src/sections/notes/GlobalSaveManager.js:103](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:41800>).

Tots els esborranys d’una nota usen la mateixa clau `scope:note`. Quan el servidor confirma una escriptura, es fa `removeDraftFromIDB(key)` sense comprovar a quina edició correspon.

**Seqüència reproduïda:**

1. S’envia A i la resposta queda pendent.
2. L’usuari escriu B; B queda guardat a IndexedDB.
3. Arriba l’ACK d’A abans que B s’envie.
4. El gestor elimina la clau: el valor persistent passa de B a `null`.

Si la pestanya cau en eixa finestra, B es perd. Un error d’A també pot tornar a escriure A damunt de B; un 409 elimina el draft. El mock prova la lògica de claus i l’ordre d’operacions, no la durabilitat del navegador.

**Correcció:** assignar una generació monotònica o ID de mutació a cada draft i esborrar només la generació confirmada, en una transacció. Preservar la branca local en conflictes. Separar `pendent`, `enviant`, `confirmat` i `conflicte`; confirmar “guardat” només en l’estat corresponent. Incloure la generació de sessió en les cues perquè una resposta antiga no complete operacions de la sessió nova.

**Acceptació:** A lent + B nou; A falla; conflicte; logout durant desat; tancament i reobertura de pestanya. B ha de continuar recuperable. Prova final amb IndexedDB real en navegador.

### S04. La tanca i els segells no formen una frontera uniforme

**Fonts:** [tooling/wiki/core/tanca.mjs:13](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:75562>), [tooling/gates/segella.mjs:35](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:59694>), [tooling/brain/time-machine.mjs:96](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:55198>), [tooling/wiki/core/mutation_kernel.mjs:149](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:74055>).

Quatre problemes relacionats:

- `verificaTancaSeguretat()` calcula les rutes protegides respecte de `process.cwd()`. La mateixa ruta absoluta al nucli deixa de coincidir amb la llista de protecció si el procés arranca des d’un altre directori. Reproduït sense escriptura al nucli.
- Per a skills, només comprova que `SEGELL.lock` existisca; el mateix codi diu que la verificació criptogràfica queda per al futur.
- `segella.mjs --update` substituïx el segell sense reclamar lease. En una carpeta sintètica, tant el primer segell com l’actualització després d’alterar la skill acaben amb codi 0 sense rebut.
- `time-machine.mjs restore` extrau un tar, canvia el symlink de skills i escriu el hash rebut en `SEGELL.lock`; no recalcula i compara el contingut restaurat abans d’activar-lo. No he executat aquesta eina, perquè escriu en una sitja del directori personal.

A més, `assertSchemaCutoverReady()` té comentada la comprovació de `schemaSha256`. El hash del pany actual coincidix amb l’esquema del BUNDLE; el defecte és que aquesta entrada no exigix la coincidència futura.

**Impacte:** un agent cooperatiu que usa l’ordre equivocada pot modificar l’autoritat o legitimar canvis sense seguir el circuit de Reflex. No cal atribuir-li intenció hostil. Contra un agent amb accés arbitrari al mateix usuari i a la clau, l’HMAC local tampoc és una frontera d’aïllament; el protocol mateix ho reconeix.

**Correcció:** arrel canònica independent de `cwd`; broker d’escriptura únic; cap ordre de ressegellat o restauració fora del broker. Restauració en staging privat, comprovació d’entrades d’arxiu, manifest i hashes abans d’activar. Segell de referència fora de l’abast d’escriptura ordinari de l’agent. Repositori i backups amb protecció independent.

**Acceptació:** totes les entrades mutadores fallen sense rebut i sense modificar fonts; mateixa resposta des de qualsevol `cwd`; snapshot alterat rebutjat; simulació de mort del procés durant restauració amb recuperació verificada.

### S05. L’enum de tags existix, però no és universal

**Fonts:** [tooling/wiki/schema.json:89](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:80649>), [tooling/wiki/entropia_zero_router.mjs:57](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:75820>), [tooling/wiki/tractor-frontmatter.mjs:426](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:83317>), [tooling/wiki/reflex_document.mjs:15](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:78800>).

`validarFrontmatter()` valida diversos camps, però no comprova el tipus, els elements, l’enum ni la unicitat de `tags`. Amb la resta del document vàlida, retorna `[]` per a:

```json
["inventat"]
"not-an-array"
[42]
["core", "core"]
```

El tractor de frontmatter sí que aplica l’enum. Per tant, **no és correcte dir que tots els camins accepten tags invàlids**, però tampoc que totes les validacions imposen el mateix esquema. `reflex_document.validarDocument()` té un altre contracte reduït: presència de `type/status` i una cadena `# `, sense executar la validació completa.

Hi ha més divergència: el JSON Schema només declara `description` com a obligatori, mentre que el router exigix també algun `type/tipus` i `status/estat`. El prompt rebut conté `consell`, que no està en l’enum, i `reflex`, que no és una propietat permesa de l’esquema d’aquesta instantània.

**Correcció:** un validador canònic del subconjunt admés, compartit per tots els consumidors; una bateria independent de conformitat per detectar errors comuns. Si s’usa una biblioteca de JSON Schema, que siga una dependència de tooling, amb benefici mesurable; no fa falta imposar-la al navegador.

**Acceptació:** mateix veredicte de tots els consumidors davant tags desconeguts, duplicats, tipus erronis, claus desconegudes i aliases contradictoris. No ampliar l’enum només per fer passar un document.

### S06. `resolveInside()` accepta una eixida amb ancestres inexistents

**Font:** [tooling/wiki/core/safety.mjs:31](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:74721>).

Si no existix el destí, només intenta resoldre el pare immediat. Si tampoc existix, ignora l’error i valida la ruta lèxica. Amb `root/link → outside`, `link/nonexistent/file.md` passa; `atomicWriteFile()` crea el directori i escriu fora de l’arrel.

**Reproduït exclusivament en carpetes sintètiques.** El consumidor trobat, `translate.mjs`, llig un fitxer existent i després demana claim; aquesta prova no acredita saltar la protecció completa d’eixe CLI. És una vulnerabilitat de la utilitat reutilitzable i un risc per a futurs connectors.

**Correcció:** pujar fins al primer ancestre existent, resoldre’l i comprovar la contenció; rebutjar errors diferents d’absència. Consolidar la utilitat amb el resolutor més estricte ja existent. Si es permet concurrència no fiable, el broker ha d’evitar també la substitució de symlinks entre comprovació i ús.

### S07. Rollback auxiliar incomplet

**Font:** [tooling/wiki/core/safety.mjs:156](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:74846>).

`withRollback()` registra còpies de fitxers preexistents, però no registra com desfer un fitxer nou. Després de `tx.write('new.md', ...)` i una excepció forçada, `new.md` continua existint. També silencia errors de restauració amb `catch(() => {})`.

No he trobat cap consumidor actual de `withRollback()` en el tooling del BUNDLE; no atribuïsc aquest defecte al motor principal d’autoneteja. És codi de seguretat latent que convé retirar o completar abans de reutilitzar-lo.

**Correcció:** registrar preimatge, absència inicial i efecte final de cada acció; restaurar en ordre invers; distingir `rollback complet` de `recuperació pendent`. Consolidar els dos camins d’escriptura atòmica en lloc de mantindre garanties diferents sota noms semblants.

### S08. “Zero forats” no és el que prova la porta RLS

**Font:** [tooling/gates/tractor-rls.mjs:156](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:65572>).

La porta comprova patrons sobre els SQL, no l’estat final de PostgreSQL. Una fixture amb `ENABLE ROW LEVEL SECURITY`, política `USING (1=1)` i posterior `DISABLE ROW LEVEL SECURITY` passa amb codi 0 i el missatge “Zero fantasmes i zero forats”. També combina informació històrica sense executar les migracions.

Això prova un fals negatiu del control. **No prova que la base de dades real tinga RLS desactivat.** Les migracions de reforç presents contenen mesures raonables, però la seua aplicació efectiva no es veu en el BUNDLE.

**Correcció:** conservar el linter com a ajuda i canviar el missatge a “sense incidències detectades per aquestes regles”. Afegir una base descartable amb totes les migracions i proves negatives de permisos: anònim, usuari A, usuari B del mateix poble, usuari d’un altre poble, administrador i membre revocat. Provar també RPC `SECURITY DEFINER`, vistes i Storage amb JWT reals de staging.

### S09. Diagnòstic de desenvolupament sense frontera d’accés

**Fonts:** [vite.config.js:24](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:83963>), [tooling/vite/consola-iaia.mjs:88](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:70122>), [src/app/App.jsx:569](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:15089>).

Vite escolta a totes les interfícies i exposa `/__iaia/consola.json` sense autenticació. El JSON inclou inventari de skills, rebuts, segell i l’última operació del diari. Que `/consola` exigisca superadmin al router React no protegix la ruta HTTP.

**Condició:** exposició a qui puga arribar al port de desenvolupament. No he comprovat tallafoc ni accés remot, i el middleware només s’aplica a `serve`, no al build de producció.

**Correcció:** loopback per defecte; activació explícita de l’accés LAN; protecció del diagnòstic al servidor quan s’exposa. Minimitzar el contingut. `frame-ancestors` no substituïx autenticació.

## 5. Arquitectura i Pedra Seca

### A01. Càrrega diferida de pantalles, però dades globals carregades per avançat

**Fonts:** [src/app/App.jsx:480](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:15000>), [src/data/supabase/content.js:16](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:33277>), [src/data/supabase/content.js:87](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:33348>), [src/data/supabase/notes.js:13](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:33393>).

`AppContent` munta Core, Mur, Notes, Xat i Multimèdia en totes les rutes. `loadMur()` i `loadMultimedia()` criden cadascun `loadAppData()`, que consulta contingut, submissions i, amb sessió, notes. Notes fa les seues pròpies consultes.

En el camí autenticat, aquests carregadors contenen fins a **10 consultes REST inicials** entre Core (1), Mur (3), Multimèdia (3) i Notes (3), abans de comptar Xat i sessió. És recompte estàtic de crides, no una mesura de trànsit capturada. Les condicions d’execució poden reduir-lo o repetir-lo.

**Millora:** carregadors específics per domini, activats quan hi ha un consumidor; deduplicació de peticions en curs amb clau `[backend, tenant, user, resource]`; invalidació explícita. Mantindre la memòria com a cache de lectura i separar els drafts del contingut confirmat. No cal afegir Redux ni una biblioteca de queries per defecte.

### A02. El canvi d’identitat no hauria de mostrar el payload anterior

**Fonts:** [src/sections/mur/MurContext.jsx:17](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:41407>), [src/sections/multimedia/MultimediaContext.jsx:15](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:41057>), [src/sections/notes/NotesDataContext.jsx:31](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:42273>).

Mur i Multimèdia cancel·len respostes antigues, però en començar una càrrega per canvi d’actor/config no buiden ni etiqueten el payload existent. Fins que arriba la resposta nova, poden continuar exposant les dades anteriors. Notes sí que comprova `scopeKey` abans de retornar contingut.

**Millora:** aplicar aquesta guarda a tots els recursos potencialment privats. Fer-ho en el valor derivat del render, no sols amb una neteja posterior en `useEffect`. Etiquetar també mutacions i errors amb l’scope i generació de sessió.

**Acceptació:** canvi de poble o compte amb xarxa lenta: cap frame mostra dades de l’scope anterior. Això és un risc de cache/UI; no acredita un bypass de RLS al servidor.

### A03. Dues instàncies visuals no són dues sessions aïllades

**Fonts:** [src/PedraSecaEmbed.jsx:41](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:35305>), [src/data/sessionService.js:4](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:32870>), [src/app/contexts/SessionContext.jsx:16](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:15814>).

El Custom Element gestiona múltiples instàncies i Shadow DOM, però `sessionService` té `currentConfig`, estat, listeners i temporitzador globals. Cada `SessionProvider` torna a configurar el mateix servei. Backend, tokens i política també tenen estat compartit.

**Decisió necessària — `requires_human_decision: true`:** voleu diverses vistes de la mateixa sessió o instàncies amb backend/usuari independents?

- Si és una única sessió per document, declarar-ho i rebutjar configuracions incompatibles des de l’arrencada.
- Si es necessita independència, crear un runtime per instància injectat via context; per a hosts no fiables, un iframe d’origen separat amb permisos mínims.

Shadow DOM aïlla estils. Ni `closed` ni `Object.freeze()` impedixen que un script del mateix origen llija `sessionStorage` o IndexedDB. La confiança en el host és part del contracte.

### A04. El sistema visual necessita coherència executable

La porta de tokens reporta **43 incidències**: 15 T1, 12 T2, 7 T3 i 9 T4. Cal interpretar-les, no copiar cegament el diagnòstic: alguns tokens de notes sí que es declaren localment a `modules.css`, però la porta no els reconeix com a tokens canònics. No són tots variables inexistents en temps d’execució.

**Fonts:** [src/css/modules.css:804](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:28135>), [src/css/modules.css:3213](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:30544>), [src/css/index.css:45](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:26709>).

- Decidir quins tokens són semàntics globals i quins són paràmetres locals de component, amb espais de noms diferents.
- Substituir primitives de color en components per semàntics i resoldre fallbacks que tapen absències reals.
- Dividir `modules.css` —3.460 línies— per domini, preservant les capes i l’ordre de cascada. La mida no és per si mateixa una vulnerabilitat; dificulta revisar regressions.
- Traure d’`App.jsx` —675 línies— efectes d’OAuth, pull-to-refresh, tema i disposició a hooks o components específics, amb responsabilitats clares.
- Corregir el botó de menú amb `aria-expanded="false"` constant perquè anuncie l’estat real.
- Mantindre el catàleg de components com a banc de proves visual: teclat, focus, tema fosc, text ampliat, moviment reduït i dues instàncies. No s’ha fet inspecció visual en navegador en aquesta auditoria.

### Dependències: frugalitat amb criteri

DOMPurify, React i l’editor TipTap resolen problemes reals. Llevar un sanejador per “zero dependències” empitjoraria la seguretat. Cal carregar l’editor només quan s’usa i mesurar el resultat.

El build web i l’IIFE standalone tenen perfils diferents: l’IIFE no conserva la mateixa divisió en chunks que la SPA. No prometre que `lazy()` alleugerix igual els dos artefactes. Mesurar bytes transferits, temps d’avaluació i peticions amb els recursos complets.

`react` i `react-dom` admeten qualsevol versió `>=18`; sense lockfile en el BUNDLE no es pot reproduir la combinació exacta. Incorporar el lockfile a l’artefacte d’auditoria, declarar versions suportades i provar-les. La declaració AGPL està present a `LICENSE`; no s’ha fet una auditoria de llicències de totes les dependències o recursos.

## 6. Qualitat de les portes i protecció de la memòria

El Reflex té defenses de valor: signatura, termini, hashes, scopes, comprovació de HEAD, claims d’un sol ús i verificació de bootstrap. Cal conservar-les. No he demostrat una falsificació criptogràfica del rebut ni un salt del seu resolutor estricte.

La feblesa és **la cobertura del circuit**. Scripts que escriuen directament, baselines ressegellables i camins paral·lels permeten esquivar el procés previst. Un hook Git arriba massa tard per impedir una escriptura destructiva ja executada sobre una Wiki sense còpia recuperable.

També hi ha un fail-open explícit a [tooling/wiki/tractor-frontmatter.mjs:445](</Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md:83336>): un error de Git deixa buit el conjunt de fitxers modificats i l’auditoria continua. Les lectures fallides es poden ometre. En la prova sense `.git`, s’ha observat l’error i la continuació; la porta finalment ha fallat per un altre motiu, no per protegir eixa absència.

Els baselines haurien de registrar excepcions identificades per fitxer, regla i empremta, amb motiu i caducitat. Un sostre numèric permet compensar una infracció nova amb una d’antiga eliminada. `--baseline`, `--segella-esquema` i `--update` són operacions d’autoritat, no ordres de manteniment innocents.

### Arquitectura mínima de protecció

1. Agent amb lectura àmplia però escriptura limitada als targets de la tasca.
2. Broker de mutacions amb plans concrets, preimatges i comprovació CAS.
3. Diari durable que diferencia començat, completat i recuperació pendent.
4. Backups fora de l’abast d’esborrat de l’agent, amb proves periòdiques de restauració.
5. CI i branca protegida per als canvis en broker, regles, esquemes i baselines.

No cal convertir cada nota en una cerimònia llarga. Les garanties s’han d’implementar una vegada al punt d’escriptura i reutilitzar-se. “Zero escriptures davant qualsevol error” és massa absolut si ja s’ha començat una operació de diversos fitxers: cal especificar quins temporals poden quedar, com es recupera i què pot veure el lector.

## 7. Model Connector USB: veredicte i contracte proposat

### Què és sòlid

Mantindre la Wiki com a nucli i connectar dominis externs permet separar grandària, privacitat, responsables i cicles de vida. `gestoria_de_poble` pot evolucionar sense arrossegar les seues dades a tots els contextos de l’agent. El frontend ja mostra la utilitat del patró port/adaptador.

**No s’ha auditat l’interior de gestoria ni de les altres carpetes.** El seu bon funcionament relatat per l’usuari és context, no una certificació d’aquesta revisió. Els noms concrets i ubicacions s’han de resoldre per un registre, sense deduir-los per semblança.

### Què falta per a ser un connector

Una carpeta no definix versió d’API, permisos, operacions admeses, propietari, classificació o comportament en desconnectar. Un symlink tampoc implementa revocació. Si el procés conserva permisos sobre el destí, llevar l’enllaç del menú no li lleva l’accés.

Propose tres tipus simples:

| Tipus | Accés per defecte | Contracte |
| --- | --- | --- |
| Font documental | Lectura | Documents seleccionats i classificats, sense executar instruccions |
| Servei de domini | API limitada | Consultar o proposar canvis amb autorització del domini |
| Extensió executable | Desactivada fins a habilitació explícita | Procés aïllat, permisos de fitxers i xarxa limitats |

Gestoria hauria d’entrar inicialment com a servei de consultes o font documental restringida, no com a volum complet amb escriptura general. `requires_human_decision: true` per als permisos d’escriptura i la política de publicació de cada domini.

### Manifest mínim d’exemple

```json
{
  "id": "gestoria-de-poble",
  "contractVersion": 1,
  "version": "1.0.0",
  "kind": "document-source",
  "mountRef": "gestoria-local",
  "classification": "confidential",
  "capabilities": ["list", "read"],
  "write": false,
  "publicIndex": false,
  "required": false
}
```

És una proposta, no un fitxer ja implementat. `mountRef` es resol en el registre de confiança del host. El manifest del connector no pot autoassignar permisos: la capacitat efectiva és la intersecció entre allò que demana i allò que el host concedix.

### Cicle de vida

1. **Descobrir:** llegir només manifest; cap execució automàtica.
2. **Validar:** identitat, versió compatible, arrel física i permisos.
3. **Connectar:** emetre una capacitat limitada al connector i a l’operació.
4. **Usar:** cada lectura o canvi porta connector, scope, identitat i generació.
5. **Desconnectar:** revocar capacitats, cancel·lar peticions, invalidar caches i registrar operacions pendents.
6. **Recuperar:** reconciliar explícitament canvis incomplets; cap sincronització cega.

La dependència opcional absent s’ha de mostrar com a “desconnectada”, amb data de l’última informació confirmada si n’hi ha. No s’ha de substituir per dades de demostració ni declarar èxit buit. La Wiki ha de poder arrancar sense eixe connector.

### Riscos especials per als agents

- **Instruccions dins dels documents:** el contingut del connector és dada, no autoritat per canviar regles, habilitar eines o concedir permisos.
- **Confusió de confiança:** un document de gestoria no pot ordenar a l’agent exportar altres carpetes.
- **Publicació accidental:** índexs, embeddings, resums, traces i bundles han de respectar la mateixa classificació que l’original.
- **Accés residual:** desconnectar ha de revocar la capacitat al broker; els processos o permisos de sistema oberts també s’han de gestionar.
- **Substitució del destí:** validar rutes físiques i revalidar en cada operació sensible; no confiar en un nom de carpeta.
- **Conflictes i portabilitat:** política única de majúscules, accents, Unicode i identificadors; paths locals fora del contracte públic.
- **Gran volum:** límits de bytes, profunditat, temps i concurrència. Una carpeta externa no pot bloquejar tot el cercador o inundar el context.

**Regla operativa:** el nucli referencia; el connector custodia; el broker autoritza. Copiar tota la gestoria a la Wiki o al RAG públic destruiria el benefici del model.

## 8. Resultats de verificació

| Comprovació | Resultat | Interpretació |
| --- | --- | --- |
| Manifest i sentinella | 640/640 hashes correctes | Integritat del contingut declarat |
| `node --test tests/backend_consolidacio.test.mjs` | 14/14 passen | Cobertura existent de consolidació |
| Vitest de la instantània | 58 proves passen; 12 suites passen i 2 no carreguen | Recursos exclosos; no equival a suite completa verda |
| Prova addicional REST vs SDK | Passa la reproducció del defecte | El segon origen rep el JWT sintètic en el mock |
| Prova de concurrència de drafts | B desapareix després de l’ACK d’A | Defecte lògic reproduït |
| Validador de frontmatter del router | 4 casos de tags invàlids acceptats | Divergència amb l’esquema |
| Prova de symlink RAG | Canari extern indexat | Falta de contenció |
| Prova `resolveInside` + escriptura | Fitxer creat fora de l’arrel sintètica | Defecte de la utilitat |
| Rollback auxiliar | Fitxer nou queda després d’error | Reversibilitat incompleta |
| Segell sense lease | Creació i `--update` amb codi 0 | Camí mutador fora del Reflex |
| Porta RLS, 17 SQL del BUNDLE | Codi 0 | Només anàlisi estàtica |
| Porta RLS, fixture amb RLS desactivat | Codi 0 | Fals negatiu demostrat |
| Porta de tokens | Codi 1, 43 incidències | Deriva de contracte visual |
| Tractor de frontmatter | Codi 1, deute F5 1→3; també error de Git | No executable com a certificat complet sense context Git |
| Tancament SCC | `valid:false`, 10 errors | Resultat de la instantània parcial, no del checkout actual |

Les dues suites que no carreguen són `App.test.jsx` —SVG de marca no inclòs— i `XatSection.test.jsx` —import de `legalContent.js`, exclòs explícitament pel contracte—. No he importat aquests recursos del checkout actual ni inventat substituts per fer-les passar.

No s’ha executat una cadena completa de build/portes com si el BUNDLE fora un clon complet. Falten dependències documentals i de construcció declarades, i algunes portes poden generar artefactes. Cal un paquet reproduïble de revisió amb lockfile, hooks, CI i recursos necessaris o substituts públics declarats.

## 9. Pla de correcció, per ordre

### Primera tanda: protegir credencials i contingut

- Unificar política d’origen en tots els transports i impedir reconfiguració incompatible.
- Tancar la frontera del RAG públic amb corpus explícit.
- Fer els ACK de notes dependents de la generació del draft.
- Tancar camins directes de ressegellat/restauració i corregir `cwd` a la tanca.

**Eixida:** les reproduccions S01–S04 deixen de produir els efectes descrits i passen proves de rebuig/recuperació. No declarar resolt només perquè una regex deixa de trobar la cadena.

### Segona tanda: una sola llei executable

- Unificar validadors i resolutors; retirar utilitats de seguretat mortes o incompletes.
- Fer fatal l’error de Git/I/O en modes de certificació.
- Baselines per incidència i ressegellat sota autorització.
- Proves RLS sobre base descartable amb migracions completes.
- Completar el paquet d’auditoria reproduïble.

**Eixida:** la mateixa entrada rep el mateix veredicte en cada consumidor; errors d’infraestructura no es converteixen en absències innocents.

### Tercera tanda: menys treball per al navegador i per a les persones

- Carregadors de dades específics i deduplicats.
- Scope i generació de sessió en tots els providers.
- Decisió explícita sobre múltiples instàncies.
- Consolidació de tokens i extracció gradual de CSS i efectes d’App.
- Pilot d’un connector de només lectura, amb desconnexió i absència provades.

**Eixida:** mesurar peticions i càrrega amb el producte complet; cap fuga entre scopes; una carpeta externa absent no trenca el nucli.

## 10. Conclusió del Consell

Sóc de Poble no necessita més noms solemnes per a les barreres. Necessita que cada promesa tinga un punt d’aplicació que no es puga oblidar, i una prova que mostre què passa quan falla.

La direcció Pedra Seca es conserva: reutilitzar el que funciona, llevar camins redundants, protegir la memòria amb garanties petites i verificables, i donar a cada connector només l’accés que necessita. **La següent inversió ha de ser en aquestes fronteres, abans d’afegir més autonomia.**

## Annex: reproducció executable

El fitxer [260921_0725_proves_auditoria_arquitectura_seguretat.mjs](</Users/javillinares/Documents/Antigravity/Som de Poble/260921_0725_proves_auditoria_arquitectura_seguretat.mjs>) verifica el hash del BUNDLE, l’extrau en un temporal i repetix huit reproduccions sense xarxa ni modificacions del repositori. Les huit s’han reproduït correctament. Un resultat positiu significa «defecte reproduït». La prova de transport S01 s’ha executat separadament amb Vitest i mocks.

```bash
node 260921_0725_proves_auditoria_arquitectura_seguretat.mjs
```
