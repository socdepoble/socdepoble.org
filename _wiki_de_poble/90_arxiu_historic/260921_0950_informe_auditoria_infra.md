# Auditoria Servidor/Infra — socdepoble.org

## 1. CRÍTIC — Sessió de WhatsApp Web commitejada a l'historial de git
**Troballa:** La sessió de WhatsApp (cookies, IndexedDB) de la IAIA MarIA està commitejada a l'historial en el directori `.wwebjs_auth/` en commits antics, permetent un segrest del compte. A més, `.wwebjs_cache/*.html` continua trackejat.
**Acció Immediata:** L'humà ha d'agafar el mòbil i anar a WhatsApp -> Dispositius vinculats -> tancar totes les sessions.
**Acció al Codi:** `git rm --cached .wwebjs_cache/*.html`, afegir al `.gitignore` i purgar l'historial amb `git filter-repo`.

## 2. ALT — El Dockerfile no construeix
**Troballa:** Intenta copiar `pnpm-lock.yaml` (inexistent) i crida `pnpm run start` (inexistent a l'arrel). El bot tampoc està al `pnpm-workspace.yaml`.
**Acció:** Corregir el Dockerfile exclusivament per al bot o deshabilitar-lo.

## 3. ALT — No hi ha .dockerignore: fuita de privacitat
**Troballa:** Dades de converses privades (`bot/var/memoria/...`) entrarien a qualsevol imatge Docker publicada.
**Acció:** Crear un `.dockerignore` exhaustiu (`bot/var`, `.iaia_auth`, etc.).

## 4. MITJÀ/ALT — docker-compose.yml munta el .env sencer
**Troballa:** El bot accedeix a claus de frontend i viceversa.
**Acció:** Separar un `.env.bot`.

## 5. MITJÀ — L'historial del .env antic
**Troballa:** Només tenia claus VITE segures. No cal rotar API keys d'IA.

## 6. MITJÀ — Endpoint de la consola-iaia obert a la Wi-Fi
**Troballa:** `/__iaia/consola.json` exposa els diaris de la IA sense cap auth.
**Acció:** Limitar a `127.0.0.1` i a mètode `GET` al `tooling/vite/consola-iaia.mjs`.

## 7. MITJÀ — bot/api_plugin.mjs amb CORS obert
**Troballa:** Endpoint mort sense auth i susceptible a exhauriment de memòria.
**Acció:** Esborrar el fitxer `bot/api_plugin.mjs` completament.

## 8. BAIX/MITJÀ — rag-index.json publicat al web
**Troballa:** L'índex de la wiki (`1.5 MB`) es pot descarregar lliurement des de `/rag-index.json`. 
**Acció:** Filtrar documents confidencials en l'índex o restringir l'accés.

## 9. INFORMATIU — wordpress-plugin/ no té PHP ni fuites
**Troballa:** Tot net. Només cal netejar `.DS_Store`.

## 10. MITJÀ — El bot no arranca per culpa de RAG
**Troballa:** `bot/arrels.mjs` busca `rag_index.json` en lloc de `rag-index.json` i a una ruta equivocada.
**Acció:** Unificar rutes de l'índex.

## 11-14. BAIX / INFORMATIU
**Troballes:** Injecció al bot per WhatsApp ben continguda (11); Regex fluixa a la frontera Sollutia (12); `.iaia_auth` net en git (13); `manifest.json` informatiu (14).

---
**Conclusió d'urgència:** Desvincular WhatsApp manualment i purgar l'historial GIT the les carpetes de cache/auth de WhatsApp.
