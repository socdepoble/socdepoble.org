---
type: document
status: actiu
description: "Pla d'Implementació: Fortificació i Sollutia"
tags: [implementacio, sollutia, fortificacio]
visibility: private
reflex: sdp:torn_959b7cde-5d01-40a0-a3b8-35e1d69d4c05:a7185f33-57a0-4df7-8d70-82d79797c5a7
---
# Pla d'Implementació: Fortificació i Sollutia

> [!NOTE]
> **Aprovació rebuda (Mode AFK desactivat)**
> El Mestre ha donat l'ordre d'executar. Procedim a la implementació de l'auditoria conjunta.

## Decisions del Mestre
- **D1 (Governança):** Sollutia es defineix com a proveïdor tècnic d'infraestructura (Host SPA i Backend) que no ha d'interferir en la independència lògica del projecte. L'arquitectura s'ha de mantenir modular perquè es puga extraure "tot fora" en cas necessari.
- **D3 (Dominis Sollutia):** De moment, preparem la Frontissa per a treballar en local (`http://localhost:54321` per a Supabase local) i deixem configurat l'endpoint cap a `v2.sollutia.com` o el domini que corresponga, canviable per variable d'entorn quan ens donen les claus de producció.
- **C4 (Rotació de telemetria):** Autoritzada la rotació del fitxer `.diari_sessio.jsonl` per tal de tindre dades reals a la Consola Termodinàmica i a l'Acta Marmota.


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260923-2305 |
| Versió | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T23:05:00+02:00 |
| Modificació | 2026-09-23T23:59:13+02:00 |
| Propietari | MarIA; rèplica documental de Codex |
| Aprovació humana | Auditoria autoritzada; implementació en AFK fins al consens |
| Model IA | Codex: GPT-6, variant no exposada; motor de MarIA no verificat |
| Tokens consumits | Mesurats no disponibles; estimació no calculada |
| Ruta | pla.implementacio |
| Rebut | sdp:torn_959b7cde-5d01-40a0-a3b8-35e1d69d4c05:a7185f33-57a0-4df7-8d70-82d79797c5a7 |

## Acte reflex

Llegit el pla i la plantilla íntegra retornada per document.mjs context. Codex completa el contracte documental i aporta una rèplica, sense modificar codi. El rebut no acredita consens ni una lease.

## Historial

- 23:05: esborrany inicial de MarIA.
- 23:14: MarIA integra les primeres troballes de Codex.
- Rèplica de Codex: el pla havia passat a «consensuat» durant la revisió, però hi ha esmenes bloquejants. Es conserva la proposta de MarIA davall i es retira eixa etiqueta. Auditoria de Claude llegida primer com a esborrany i després íntegrament; rèplica final de Codex incorporada.

## Canvis proposats

### Actualització Codex v2 · consola i independència (preval sobre les propostes anteriors)

Font completa i codi concret: [[260923_2305_auditoria_codex]], versió 2. **AFK continua; el consens conjunt no es dona per obtingut.**

- El disc ja té client.js, el comodí Supabase retirat, configura sense backend i segell vàlid. No presentar aquelles absències com a actuals. Els scripts crítics estan staged; doctor encara és roig.
- La Frontissa actual accepta URL absoluta aliena, no aplica catàleg/traductor, no fixa redirect/timeout ni token. Substituir-la pel client de catàleg tancat; mantindre-la desactivada fins a captura real i token/audiència acordats.
- El hook bloqueja separadors, però admet git diff --output i porta:baseline com lectures. Cal operacions/arguments enumerats, no altra regex superficial.
- Separar allotjament SPA, host d'incrustació, operador del Supabase SdP i API de lectura. La titularitat SdP i la composició interna preserven Model B; no obrir injecció externa per resoldre portabilitat.
- Adoptar política pública versionada des d'URL SdP fixada al desplegament, orígens per funció, pin comú REST/SDK/Auth i configuració immutable per arrencada. Aplicar conjuntament host, main/embed, runtime i callback.
- UI (Consola): patch exacte en l'auditoria sobre UniversalCard existent, quatre resums visibles, entradilla/instantània, Refrescar centrat, desplegables de detall i sense SEO duplicat. Cens operatiu explícit, avís >150; no confondre skills amb artefactes ni registres amb sessions.
- **UI (Editor / NotesSection)**: Bloquejant abans de tancar AFK. Convertir la "mini card" de previsualització en una representació en directe (Live Preview) i fidel de la *UniversalCard* mentre s'està escrivint o creant la nota. 
  - **Comportament**: En clicar sobre qualsevol nota de la llista (columna central), la "mini card" s'obri automàticament i es converteix en la UniversalCard, ocupant més espai d'alçada però adaptant-se a l'amplada de la columna. Així mateix, en crear-ne una nova, al posar la primera lletra del títol ja es transforma. Tot reflecteix els canvis de l'editor en directe.
  - **Iconografia**: S'ha d'eliminar la icona fantasma dels tres punts de la dreta. Només ha de quedar el botó de l'hora/data i la icona del cadenat (que, mentre s'estiga en edició, possiblement canviarà a un llapis).
  - **Avatar i Text**: No s'ha d'inventar un avatar nou; cal usar el mateix de la topbar (fons negre, icona d'usuari blanca i mateixa mida). A més, el subtítol sota el nom ("Foraster") ha de ser "Poble de la persona forastera" en lloc d'"Identitat Lliure".
- Telemetria diària/per sessió continua pendent d'instrumentació persistent; no afirmar que el GET actual és una base de dades. Dades desconegudes es mostren com desconegudes.

Verificació v2: 123 tests existents i 19 comprovacions de proposta en memòria passen; JSX proposat parseja. Navegador de /consola redirigix al registre. Cap canvi de producte aplicat. El pla ha d'exigir prova visual autoritzada, canari real i gates del mateix arbre abans d'activar serveis.


### Rèplica bloquejant de Codex

**AFK continua. No done per consensuat el text inferior.** Font completa: [[260923_2305_auditoria_codex]], F1–F8. No cal una nova decisió per acabar l'auditoria; la implementació seguix el protocol expressat pel Mestre.

1. **F1 / shell:** bloquejar només operadors no basta. knownRead també autoritza qualsevol script de tooling/gates i flags mutadors com segella --update. Usar executable i arguments estructurats, sense shell, operacions enumerades i cwd canònic. Proves negatives per a Bash, exec_command i run_command; lectures i circuit documental han de continuar disponibles.
2. **F3 / Model B:** impedir backend extern en producció; conservar la configuració de presentació i el contracte auth autoritzat. `auth` és configuració de confiança, no és per si mateix una sessió; la sessió entra per injectaSessio. No eliminar indiscriminadament atributs necessaris del component.
3. **F4 / Frontissa:** no basta crear client.js. Primer cal endpoint i captura real redaccionada de Sollutia, fixture i traductor a DTO explícit. GET amb credentials omit, redirects denegats, abort i llistes exactes. La porta actual és tractor-adaptadors i passa sense client: ampliar-la o substituir-la amb cobertura real, evitant portes duplicades. El nou tractor-frontissa no és un dels tres fitxers detectats sense versionar.
4. **F2/F5 / orígens i Auth:** política exacta compartida per REST, SDK, renovació, OAuth i callback. El comodí està en PedraSecaEmbed; request() no hereta el pin del SDK. Fixar issuer/aud i port/origen, i provar que Supabase accepte realment la sessió externa. No afluixar claims.
5. **F7/F8 / segell i durabilitat:** els tres crítics sense versionar són executor-mutacio.mjs, git-staged.mjs i mutation-policy.mjs. segella sense --update només comprova. Cal revisar el diff i una reconciliació explícita amb hashes, no sanejar metadades ni resegellar cegament. Afegir codi, proves i evidència en commit autoritzat; reparar symlink/graf/catàleg sense abaixar guardes.
6. **F6 / canari:** provar Supabase SdP independentment de Frontissa: mode remote, tenant, membership, migracions i RLS efectives. Cobrir alta Google nova (trigger exigix tenant_id), password, renovació, logout, notes/revisió 409, aïllament d'usuaris/tenants, storage privat i xat. Tancar redireccions de credencials en renova/bescanvia.

Ordre proposat: consens documental → F1 i integritat del Brain → Model B i política de confiança → canari SdP → Frontissa amb contracte real → portes/CI i evidència del mateix arbre. 109 proves de fortificació, 14 de consolidació i 7 de notes passen; no acrediten les garanties que falten.

### Proposta de MarIA conservada per a la discussió

### 1. Fortificació Local (Forat del Hook)
- **Problema:** En `tooling/gates/mutation-policy.mjs`, l'expressió regular `( .*)?$` permet enganxar ordres malicioses com `; rm -rf` darrere d'ordres permeses (ex: `npm run porta ; ...`).
- **Solució:** Modificar `knownRead` per prohibir operadors de shell (`&&`, `||`, `;`, `|`, `>`, `<`) a les arguments permesos de git, npm i node.

### 2. Incompliment de l'ADR (Host i Backend)
- **Problema:** `src/host.js` encara permet injectar un backend aliè (`configura({ backend })`), cosa prohibida explícitament pel Model B.
- **Solució:** Restringir `configura` i `setRuntimePolicy` perquè no accepten un objecte `backend` sencer, forçant sempre el muntatge de Supabase local (`import('./data/supabase/index.js')`). L'únic paràmetre permès des de fora serà la sessió (`auth`).

### 3. Frontissa de Sollutia (client.js)
- **Problema:** L'ADR cita `src/data/adaptadors/sollutia/client.js` i `tractor-frontissa.mjs`, però no existixen.
- **Solució:** Crear `client.js` amb capacitat estricta només per a operacions `GET` (`credentials: 'omit'`). Crear `tractor-frontissa.mjs` a `tooling/gates/` per vetllar per aquest contracte (sense imports de backend general).

### 4. Polítiques d'origen (supabase.co)
- **Problema:** El validador d'URLs (`src/config/runtimePolicy.js` o on pertoque) accepta qualsevol projecte `*.supabase.co`.
- **Solució:** Restringir els orígens a una "allowlist" estricta segons determinen els fitxers de configuració (ex. validant l'URL base del projecte de SdP exclusivament).

### 5. Deute de Versió i Segellat
- **Problema:** El segell de les Skills està trencat i falten fitxers per versionar.
- **Solució:** Executar els scripts per sanejar les metadades (`node tooling/gates/segella.mjs` o equivalent) i incloure els 3 fitxers orfes (el *tractor-frontissa* en serà un, clarament).

### Contrast final Codex ↔ Claude

Les dos auditories ja contenen troballes. Llegida Claude completa i contrastada al disc: acord en backend injectable, client absent, comodí Supabase i shell oberta. **Consens final encara pendent de consolidació de MarIA**, per estes esmenes:

- A7 de Claude no es pot marcar verda: callback.html també accepta el port 444 de sollutia.cat. Comprovar origen complet, no hostname.
- B2/B3 són un risc de durabilitat/publicació parcial: les noves referències als scripts/tests també són canvis locals. No hi ha prova d'una CI remota executada i fallida. Incloure scripts i tests en el mateix commit.
- B4: pwd amb separador i npm test amb pipe ja fallen; git status amb && sí que passa. Les negatives han de cobrir els prefixos vulnerables i flags mutadors.
- 109 Node i 82 Vitest són suites diferents. No usar la diferència de recompte com a símptoma.
- Mantindre Model B com a premissa del prompt actual. Clarificar allotjament SPA, host d'incrustació i operador de Supabase sense donar per feta una nova elecció A/B.
- Es pot acceptar una reparació parcial amb deute explicitat; obrir trànsit real i certificar fortificació requerixen més que les portes estàtiques que ja donen verd.

Vegeu la secció de diàleg final de [[260923_2305_auditoria_codex]] per les reproduccions. Cap canvi de codi aplicat.

## Verificació
- Executar `npm run porta` i assegurar que tot dóna verd.
- Demostrar que ordres com `npm run porta ; echo 'HACK'` són bloquejades pel hook.
- Demostrar que l'origen de Sollutia està lligat només a lectura.

## Riscos

- Fals verd: les portes estàtiques no acrediten Frontissa ni RLS remota; els mocks no proven SSO.
- Acceptar una sessió o origen equivocat pot exposar credencials o dades al backend incorrecte.
- La concurrència documental no ha de transformar un esborrany buit o una proposta parcial en consens.
- El tancament i doctor són rojos. Cap reconciliació automàtica ni canvi de codi en este torn.

## Vincles
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[00_index_escriptori]]

- [[260923_2305_auditoria_codex]]
- [[260923_2305_auditoria_claude]]
