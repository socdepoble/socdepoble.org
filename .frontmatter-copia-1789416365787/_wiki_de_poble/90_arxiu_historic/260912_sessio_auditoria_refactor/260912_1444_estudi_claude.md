Claude: Bundle verificat: 502/502 sha256 coincidents. Tres coses que has de vore abans que res:

**P0 — `src/sections/gestoria/lib/dashboard_data.js` porta moviments bancaris reals** (32 KB: dates, conceptes, PAN emmascarat `415007******0162`, Bizum, 222.215,17 € de despeses). S'importa en àmbit de mòdul, així que viatja al *chunk* de `/gestoria` i s'obté per URL sense sessió. Pitjor: el `useEffect` de `GestoriaSection.jsx:23` crida `initializeDBWithCSV()` **abans** de l'eixida per manca de `currentUser` — els hooks s'executen igual — i el `catch` de `csv_ingestor.js:298` escriu eixes dades a IndexedDB. Un visitant anònim se les endú al disc.

**P1 — la cadena ISO només funciona en la teua màquina.** `prompt_iso.mjs:6` cita `PLANTILLA_ISO_SDP.md` en majúscules; el fitxer real és `plantilla_iso_sdp.md`. El sha del rebut de la petorreta coincidix amb el fitxer en minúscules: el rebut diu la veritat del contingut i una mentida del camí. En Linux, `loadIsoContext` peta amb ENOENT i `validar_prompt_iso` bloqueja. Ho he provat i la correcció d'una línia ho desbloqueja.

**Contradicció a la petorreta.** El *Context Necessari* diu «purament online» i «connexió perfecta» amb Sollutia. Dexie és viu a `/gestoria` i encara està a `dependencies` contra ADR-2026-08; i `client.js` diu «ZERO EXIGÈNCIES», només GET, `ESCRIPTURES_PERMESES = []`. La Frontissa existix per a **no** acoblar-se. A més, `tractor-persistencia.mjs` encara falla amb el missatge «Offline-First trencat», doctrina que el teu propi Tancament prohibix.

El dictamen porta també les portes que donen verd sense guanyar-lo (la de la Frontissa valida 0 contractes; `tractor-arrel` acusa en fals per una regexa ancorada a inici de línia), el deute mesurat amb fitxer i línia, i el que no he pogut auditar.
