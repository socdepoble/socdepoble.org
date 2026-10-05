# SELF-DESCRIBE: La Capa de Persistència de Sóc de Poble

Aquest document és una metadada auto-descriptiva de la capa de persistència. 

## 1. El Principi Fonamental (Online-First Estricte)
- Sóc de Poble és una arquitectura **Online-First** pura des de l'auditoria de l'Agost de 2026.
- El Frontend és un "Terminal Estúpid" (Dumb Terminal). Si no hi ha xarxa o el backend rebutja l'escriptura, la UI reverteix l'estat i avisa l'usuari. NO hi ha cues asíncrones (Outbox) ni emmagatzematge local de dades de negoci.

## 2. Injecció Agnòstica (Llei de l'Enxufabilitat)
- Tot l'accés a dades es fa a través de `backendPort.js`. Cap component de React pot importar l'adaptador específic (ex: `supabaseBackend.js`).
- `host.js` congela el contracte en `arrenca()`. L’amfitrió (WordPress, Sollutia o un altre) configura presentació i navegació segons `sdp.amfitrio.v1`; les seues entrades de backend o tenant es descarten.
- L’adaptador de dades és del paquet. `injectaBackendDelPaquet()` és una costura interna prèvia a l’arrencada, provada amb adaptadors simulats; les entrades productives encara carreguen Supabase. La integració amb una API alternativa necessita un adaptador complet i proves amb els seus payloads reals.

## 3. Barreres Mecàniques (Gates)
- `src/config/storage.js` només pot emmagatzemar tokens d'autenticació (`socdepoble-jwt`), no estats de negoci. 

## 4. Instàncies i moviments de l’amfitrió
- `PedraSecaEmbed.jsx` conserva l’arrel React per element. Dues instàncies vives poden conviure: cap pany global les substituïx.
- `disconnectedCallback()` espera una microtasca i comprova `isConnected` abans de desmuntar; un moviment síncron del DOM conserva la instància. Les instàncies desconnectades es netegen sense destruir els seus germans vius.

*Eternitat a les dades. Tornem el poble a la gent, però amb la veritat per davant.*
