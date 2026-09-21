---
type: informe
status: esborrany
description: Auditoria estatica de fortificacio abans de Sollutia, amb riscos de sessio, perdua de notes i garanties de CI.
---
# Auditoria de fortificació — Codex

## 1. UX i deute humà: la confiança és la primera funcionalitat

Un veí pot perdonar una icona imperfecta. No pot confiar en una aplicació que recupera una sessió després d'expulsar-la, perd l'últim text escrit o deixa l'entrada penjada. Eixos són els riscos que cal tancar abans de presentar una arquitectura «inviolable» a Sollutia.

**Dictamen: no presentar aquesta base com a fortificada ni preparada per a producció.** Sí com a base d'integració amb bloquejadors identificats. Les proteccions existents tenen valor, però els punts més febles estan entre subsistemes: host i sessió, desat i esborrany, OAuth i emmagatzematge, codi font i artefacte.

## 2. Abast i reunió davall l'Olivera

- Resposta a SDP-PROMPT-LOCAL-260921. Agent: ChatGPT Codex. Entorn: local. Propietari: Agents Locals. Aprovació humana: pendent.
- Tall: HEAD `d79bd0f9` més l'arbre de treball, amb canvis previs sense confirmar. Les línies citades corresponen al codi local llegit.
- Inspecció passiva de React, autenticació, contractes, SQL, Vite, npm, hooks i portes. **No s'han executat aplicació, tests, builds, migracions ni scripts del projecte.** Cap consulta web ni lectura de secrets.
- Les seqüències de reproducció següents són proves proposades, no execucions efectuades. No s'afirma explotació remota ni estat de la base desplegada.
- A les comprovacions inicial i final de l'escriptori no hi havia un informe de fortificació de Claude/Fable. Sí el pla `260921_0845_PLA_IMPLEMENTACIO_Barreres_Arquitectoniques.md`, llegit abans de l'anàlisi. No atribuïsc a l'altra IA conclusions que encara no hi són.
- Única escriptura: aquest informe, expressament demanat en la regla final del prompt. La contenció específica d'aquesta auditoria preval sobre rituals locals que modificarien estat, índexs o executarien portes. No s'ha aplicat cap correcció.

### Opinió sobre el pla de MarIA

1. **Plaquetes:** no convertir el cron en mutador en calent. Tampoc fer que el pre-commit repare silenciosament. El cron diagnostica; el pre-commit verifica l'arbre preparat; una operació separada aplica un pla amb preimatges, exclusió mútua i recuperació. Reparar durant la validació pot canviar allò que s'estava validant.
2. **Supabase local:** usar mocks per a proves ràpides de UI i un entorn real descartable PostgreSQL/Supabase per a SQL, RLS i integració. Un JSON en memòria no demostra polítiques ni transaccions. No són alternatives excloents.
3. **Contracte per dominis:** és una millora raonable, però secundària als defectes de sessió i desat. Afegir capacitats versionades sobre el port existent; no reescriure tot el contracte abans de disposar de proves de conformitat.

## 3. Troballes prioritàries

P1: resoldre abans d'habilitar el flux afectat en producció. P2: corregir o acotar explícitament abans de l'entrega. No declare cap P0 demostrat amb aquesta inspecció passiva.

### F01 · P1 — Una renovació pendent pot desfer l'expulsió ordenada pel host

**Fonts:** `src/host.js:281–290`; `src/data/supabase/auth.js:12–35,130–164`.

- `renova()` captura `sessioEpoch` i només descarta el resultat si aquest comptador canvia.
- `logout()` incrementa el comptador; `host.expulsaSessio()` només esborra credencials i emet un esdeveniment. No passa per eixa invalidació.
- Si hi ha una renovació en curs quan Sollutia expulsa l'usuari, la resposta antiga encara pot executar `desaSessio(result)` i tornar-lo a posar dins.
- La injecció d'una sessió nova tampoc incrementa l'epoch d'aquest mòdul: una resposta antiga pot substituir-la. La generació de `sessionService` no evita l'escriptura que ja fa `renova()` abans de retornar.

**Correcció:** una única autoritat de transició de sessió, compartida per login, injecció, renovació i expulsió. Invalidar peticions pendents i comprovar identitat/generació abans de desar. El pont ha de respectar també el backend injectat.

**Prova d'acceptació:** congelar la resposta de renovació d'A; expulsar A o injectar B; alliberar la resposta d'A. Ha de continuar fora o dins com B, sense reobrir canals d'A.

### F02 · P1 — Un desat antic pot esborrar un esborrany més nou

**Font:** `src/sections/notes/GlobalSaveManager.js:112–155`.

La clau IndexedDB és la mateixa per nota. Cada edició escriu immediatament l'esborrany; cada desat completat elimina aquesta clau sense comprovar quina versió conté.

**Seqüència:** A ix cap al servidor; l'usuari escriu B i B queda en IndexedDB; arriba l'èxit d'A i esborra la clau que ara conté B; es tanca la pestanya abans del desat de B. Es perd la recuperació de B. El bloqueig de peticions HTTP no serialitza les edicions noves amb aquesta eliminació.

A més, un `409` elimina l'esborrany sense haver resolt el conflicte; un error antic pot sobreescriure en IndexedDB un payload més recent.

**Correcció:** revisionar també els esborranys; eliminar o substituir amb comparació de versió dins d'una transacció. Preservar la versió en conflicte i oferir recuperar/comparar, mai descartar-la automàticament.

**Prova d'acceptació:** A lenta, B posterior, èxit/fallada/409 d'A, recàrrega. B ha de continuar recuperable i el conflicte ha de conservar les dues versions.

### F03 · P1 — El fallback OAuth per storage està desconnectat

**Fonts:** `src/data/oauthRelay.js:218–230,302–310`; `src/config/storage.js:9,26–29`.

`perStorage` espera `e.key === 'sdp:oauth:traspas'`. El productor usa `setVal`, que escriu **`sdp_embed_sdp:oauth:traspas`**. L'esdeveniment natiu porta la clau física amb prefix; el consumidor la rebutja abans de validar el codi i el state.

Afecta el camí anunciat per recuperar l'entrada quan COOP talla l'opener. No és una prova de robatori de sessió: és un bloqueig funcional verificable al contracte entre productor i consumidor.

**Correcció:** centralitzar la clau física o exposar una subscripció a través del mateix adaptador de storage. Mantindre validació de state, antiguitat i ús únic.

**Prova d'acceptació:** dues finestres del mateix origen, opener indisponible, codi i state vàlids. Ha de completar una sola vegada sense esperar el timeout. Provar també emmagatzematge restringit en iframe.

### F04 · P1 — La política d'orígens no permet restringir els dominis preautoritzats

**Fonts:** `src/config/runtimePolicy.js:62–89`; `src/host.js:315–320,346–365`; `public/auth/callback.html`, funció `esOrigenPermes`.

Encara que Sollutia configure `parentOrigins` amb una sola adreça, `esOrigenPermes` accepta primer tots els subdominis de `socdepoble.org` i `sollutia.cat`. La política explícita només amplia; no pot restringir. També s'ignora el port en aquestes acceptacions per hostname.

El pont comprova correctament que el missatge vinga de `window.parent`, però qualsevol parent que passe aquesta confiança àmplia pot invocar injecció o expulsió. L'impacte depén que algun subdomini siga delegat, compromés o menys fiable; no s'ha verificat aquesta condició externa.

**Correcció:** orígens complets exactes com a autoritat efectiva per desplegament. Si es configuren, no afegir comodins implícits. Sincronitzar callback i política; documentar qui controla cada origen.

**Prova d'acceptació:** permetre només el host acordat i rebutjar un altre subdomini i un port diferent, fins i tot dins de les famílies actualment preautoritzades.

### F05 · P1 — La CI declarada no prepara la configuració que Vite exigeix

**Fonts:** `vite.config.js:12–16`; `vite.standalone.config.js`, inici; `src/config/publicCredentials.js:2–4`; `.github/workflows/wiki-integrity.yml:24–44`; `.github/workflows/sdp_lock_ci.yml`; `.gitignore`.

Vite valida URL i clau Supabase en carregar la configuració, també quan Vitest la llig. Els dos workflows instal·len i executen portes sense declarar aquests valors ni generar un entorn de proves. Els `.env` locals estan ignorats i no consten versionats en la consulta Git.

**Conseqüència inferida:** el runner net declarat no arriba a build/tests sense configuració addicional. No s'ha consultat GitHub ni executat CI; no afirme quin és l'estat de l'últim run remot.

**Correcció:** configuració de proves determinista amb valors públics ficticis i xarxa simulada, o backend descartable. Separar-la de la validació de credencials del desplegament. No resoldre-ho injectant secrets de producció.

### F06 · P1 — Hi ha suites importants fora de la cadena canònica

**Fonts:** `vite.config.js:48`; `package.json`, scripts `test:node` i `test:porta:psicopatia`; `tooling/gates/run-portes.mjs:80`; `tests/backend_consolidacio.test.mjs:47–50`.

Vitest exclou `tooling/**` i `tests/**/*.test.mjs`. El runner acaba amb Vitest; els workflows no criden les dues suites Node esmentades. Executar el tractor Psicopatia no equival a executar els seus tests.

La suite de consolidació conserva `assert.equal(expected.length, 16)` malgrat existir la nova skill agrícola junt amb les altres 16. És una asserció desactualitzada al codi, no un resultat de test executat en aquesta auditoria.

**Correcció:** inventari explícit de suites obligatòries i comandes de CI, sense exclusions accidentals. Provar propietats del catàleg, no congelar-ne la quantitat. Afegir les regressions F01–F04.

### F07 · P2 — La porta de build pot donar per bo un bundle obsolet o absent

**Font:** `tooling/gates/tractor-build-previ.mjs:53–60,70–87`.

La validació només exigeix que el manifest tinga `src/embed.jsx.file` i compara la seua data amb `src/main.jsx` i `src/embed.jsx`. No comprova que el fitxer indicat existisca ni incorpora la resta de JS, CSS, configuració o lockfile.

**Escenaris:** canviar `auth.js` sense tocar els dos entrypoints; o retirar el JS compilat conservant el manifest. Aquesta comprovació local pot continuar verda, encara que altres portes pogueren detectar algun dels casos.

**Correcció:** verificar existència i integritat de tots els artefactes; vincular-los al digest de fonts/configuració/lockfile o construir sempre en un directori net a CI. El build a validar ha de ser exactament el que es lliura.

### F08 · P1 — El RAG públic continua sense frontera explícita de publicació

**Font:** `tooling/wiki/core/build_rag_index.mjs:13–25,63–86,110–119`; `package.json`, `rag:build`.

Ja s'exclouen directoris ocults: és una millora respecte de l'auditoria anterior. Però es recorre l'arrel sencera i només es filtra `status: arxivat`; no s'exclou l'escriptori ni s'exigeix classificació pública.

Un informe intern Markdown sense errors de parseig entra en un índex escrit a `public/rag-index.json`. L'artefacte exposa rutes i termes associats a documents, **no el text íntegre**; aquesta distinció no elimina la filtració potencial de vocabulari i metadades. No s'ha comprovat el contingut actual del desplegament.

**Correcció:** corpus publicable per llista explícita i classificació, separat del context operatiu. Negar per defecte informes, actes i esborranys. Prova amb un terme sentinella intern que no ha d'aparéixer al resultat.

### F09 · P2 — Magic Link és un mètode exposat sense recorregut de retorn coherent

**Fonts:** `src/data/supabase/auth.js:142–153`; `src/data/oauthRelay.js:280,320–335`; `public/auth/callback.html`; `src/data/contracte.js:10`.

`loginWithMagicLink` envia la petició, però no prepara verificador ni state. El retorn general exigeix els dos per bescanviar el codi; el callback estàtic només tracta codi/error i no processa tokens de flux implícit. No s'ha trobat un consumidor UI actual fora del port i contracte; per això no es presenta com una avaria de tots els logins.

**Correcció:** implementar i provar el flux admés pel backend desplegat o deixar la capacitat explícitament no disponible. Un mètode obligatori del contracte no pot prometre una entrada que només arriba a enviar el correu.

### F10 · P2 — Accedir al storage pot trencar el mòdul abans dels try/catch

**Font:** `src/config/storage.js:1–2`.

Els getters `window.localStorage` i `window.sessionStorage` s'avaluen al nivell del mòdul, fora de qualsevol protecció. En contextos on el navegador denega l'accés poden llançar `SecurityError`; els try/catch dels mètodes no arriben a executar-se.

**Correcció:** detectar disponibilitat dins d'un bloc protegit i donar un estat explícit d'emmagatzematge no disponible. No declarar un login completat si les credencials no s'han pogut conservar.

**Prova d'acceptació:** iframe amb restriccions d'emmagatzematge i getters que llancen. L'app ha d'explicar el problema i oferir un camí d'entrada compatible, sense fallar en importar.

## 4. Altres límits rellevants de la revisió

- **Dev exposat:** `vite.config.js:24` i `npm run dev` escolten a totes les interfícies; `tooling/vite/consola-iaia.mjs` serveix `/__iaia/consola.json` sense autenticació, amb metadades del Brain. És només desenvolupament, no una ruta de producció. Cal limitar-la a loopback o autenticar-la si es comparteix el servidor a LAN/túnel.
- **Rutes:** `RouterContext.jsx` implementa router propi; `useSearchParams` usa `searchParams` però l'omet de les dependències del callback, cosa que pot perdre altres paràmetres en actualitzacions successives dins de la mateixa ruta. Provar també basename, recàrrega profunda i servidor de desplegament. No s'ha acreditat un 404 real remot.
- **Dependències:** no hi ha base per declarar vulnerable o òrfena una llibreria només pel nom. No s'ha fet consulta CVE ni `npm audit`. Revisar el mínim Node efectiu del lockfile i tancar rangs React suportats; `>=18` no és una matriu de compatibilitat.
- **SQL:** s'han revisat polítiques i correccions locals, incloses les fronteres restrictives de Storage i app_content. No s'ha demostrat una via d'escriptura entre usuaris amb aquesta lectura. El tractor RLS és estàtic; no substitueix migració des de zero ni proves amb rols reals. La migració de blindatge es presenta com a proposta per a staging: existir al disc no acredita que s'haja aplicat.
- **Aïllament:** sessionStorage i Shadow DOM no aïllen els secrets de scripts del mateix origen. Si Sollutia carrega el widget en el seu document, cal confiança en tots els scripts d'eixe document o un iframe d'origen separat. És una decisió d'integració, no una garantia aportada per canviar de localStorage a sessionStorage.
- **Portes:** `npm run gate` pot construir automàticament i generar artefactes. No és una ordre purament observacional. El hook Husky llig el worktree; la declaració documental de verificació de l'arbre staged no queda demostrada per aquest hook. No s'ha alterat ni comprovat la configuració remota de protecció de branca.

## 5. Condicions concretes per a l'entrega a Sollutia

1. Unificar transicions de sessió i demostrar expulsió/injecció durant renovacions retardades.
2. Fer transaccional el cicle d'esborranys; demostrar conservació de l'última edició amb errors i conflictes.
3. Passar OAuth popup, COOP, storage restringit i retorn complet en un navegador real; acordar una llista exacta d'orígens.
4. Obtindre CI en clon net amb totes les suites obligatòries, backend descartable i artefacte vinculat al commit.
5. Separar corpus públic i intern; acordar la frontera d'origen del widget i la configuració del servidor.
6. Lliurar matriu de capacitats suportades, migracions aplicades i proves de conformitat de l'adaptador. Mantindre fora del contracte operatiu els fluxos encara no verificats.

**Trellat:** menys garanties absolutes i més seqüències verificables de fallada i recuperació. La fortificació es mesura en dades preservades, permisos respectats i sessions ben tancades.

## Ancoratge de Seguretat

- [[00_index_escriptori]]
- [[260921_0835_PROMPT_Auditoria_Fortificacio]]
- [[260921_0845_PLA_IMPLEMENTACIO_Barreres_Arquitectoniques]]
