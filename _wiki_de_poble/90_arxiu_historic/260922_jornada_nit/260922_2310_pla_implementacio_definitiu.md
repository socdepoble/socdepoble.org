# Consolidació d'Auditories (Integració Sollutia i RAG)

Aquest pla consolida les troballes de l'auditoria extrema de Codex (xarxa, auth, components) i Claude (fuites d'informació, pre-commit, generadors RAG) per aconseguir "L'Enxufabilitat Absoluta" de Sóc de Poble amb el backend de Sollutia.

## Preguntes Obertes (Decisions del Mestre)

Abans d'iniciar l'execució, necessitem la teua decisió sobre els 4 punts crítics que ha assenyalat Claude:

1. **Les Actes Marmota (`10_actes`) han de ser públiques?** Actualment el RAG i el WordPress plugin les estan incloent.
2. **Autoritzes passar el generador de la Wiki a un model de Llista d'Inclusió (Allowlist)?** Ara mateix exclou carpetes, cosa que fa que tot el que siga nou (o arxivat) nasca públic per defecte. Un Allowlist és més segur.
3. **Apliquem el pedaç de neteja del Linter de Claude?** Claude ha escrit un script que neteja 242 avisos d'imports orfes sense trencar res (passem de 367 a 125 avisos). L'apliquem en començar?
4. **Resegellem el Segell de Skills ja?** Claude proposa NO resegellar el `.agents` enganyosament fins que no resolem les 45 portes cegues del pre-commit. Estàs d'acord a deixar-ho en roig honest de moment?

## Canvis Proposats (Pla Final)

### Autenticació i Xarxa (Sollutia)
- **A1:** A `OnboardingSection.jsx`, resoldre el UUID del tenant abans d'enviar el registre (en lloc del nom en string).
- **A2:** A `desaSessio` i `auth.js`, unificar la revisió i increment del `sessioEpoch` per protegir les entrades OAuth i l'adopció de sessions externes de condicions de carrera.
- **A3:** A `renovaAra`, implementar reintent progressiu (exponential backoff) davant d'errors de xarxa (ex. 503).
- **A4:** A `auth.js`, normalitzar la resposta REST de `registerWithPassword` a l'estructura del SDK (`{ data: { session: ... }, error }`).

### Estabilització React
- **A8 (Esmena Claude):** A `PedraSecaEmbed.jsx`, estabilitzar l'objecte `config` (ex. mitjançant `useMemo`) abans de passar-lo als proveïdors d'Identitat i Sessió, per evitar renders cíclics infinits quan l'amfitrió passa un objecte nou cada vegada.
- **A5:** A `AvisadorEfimer.jsx`, afegir un normalitzador per forçar els missatges d'error a String i evitar caigudes de React ("Objects are not valid...").

### UI, Accessibilitat i Experiència (UX)
- **A6:** Modificar el color del títol d'Arrels a la Sidebar per complir amb el contrast mínim (4.5:1).
- **A7:** A `sanitize.js` (DOMPurify), afegir `colspan`, `rowspan`, `scope`, `caption` i `tfoot` per preservar l'accessibilitat de les taules complexes de la Wiki.
- **A9:** A `UniversalWorkspace.jsx`, moure el chevron de desplegament a la dreta dels ítems per netejar l'alineació esquerra.
- **A10:** A les vistes de "Notes", "Wiki" i "Disseny", recuperar el codi històric de les "Targetes de presentació" (Bloc de notes, la taula hologràfica, la web de pedra) per fixar-les dalt de la llista central i eliminar l'estat buit lleig de Notes. Cal assegurar neteja del codi antic substituït.

### Fuites RAG i Generadors (Claude)
- **B1:** Actualitzar els generadors (Manifest, rag-index, slugIndex) per utilitzar una llista blanca comuna si s'aprova, evitant publicar actes, `.agents` i carpetes arxivades (90_arxiu_historic).
- **B2:** Eliminar de `compile-wiki-to-app.mjs:24` l'excepció explícita que deixa passar la carpeta `.agents`.
- **B3:** Afegir guardes de ruta a `App.jsx` per evitar el muntatge global `/*` incondicional a la wiki.
- **B5:** Actualitzar la plantilla `prompt_local.md` per fixar el port a 3340 (el 5173 està prohibit per Vite).
