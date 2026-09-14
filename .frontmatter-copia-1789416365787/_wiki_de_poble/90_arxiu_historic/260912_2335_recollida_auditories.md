# Recull d'Auditories (IAs gratuïtes) - 12 Set 2026

Aquest document consolida les troballes de les auditories secundàries abans de llançar la Petorreta final a Claude.

## 1. Gemini Flash
- **Gestoria (useGestoriaData.js):** Falla crítica d'import a Dexie. Proposa un mock agnòstic. (Ja resolt de manera superior amb `teCapacitat` i `loadGestoria`).
- **GestoriaHome.jsx:** Estil en línia `<th style={{ textAlign: 'right' }}>` viola Pedra Seca. Cal canviar a `className="sdp-num"`.
- **DesignSectionContent.jsx:** `<AvisadorEfimer/>` orfe sense propietats a la línia 715. Cal esborrar-lo.
- **AdminSection.jsx:** Ruta sense barrera. Proposa comprovar `currentUser`. (Ja resolt parcialment amb l'if intern).
- **PedraSecaEmbed vs identitat.js:** La injecció de sessió externa per l'atribut `config` s'ignora a favor de `sessionStorage`.
- **callback.html:** Llista blanca d'OAuth massa rígida (`===`).
- **detailSectionMeta.jsx:** Estils en línia residuals (`opacity`, `marginTop`).
- **Iframe Google Maps trencat:** A DesignSection, viola CSP.

## 2. Grok
- **Gestoria:** Destaca el mateix error P0 de Dexie. Proposa l'opció A (passar per backendPort), que és exactament el que ja hem implementat.
- **Guards de Ruta (RequireAuth):** Adverteix que no hi ha un guard real al React Router per a `/gestoria/*` ni `/admin/*`, malgrat tindre barreres dins dels components. Proposa un component `<RequireAuth>`.
- **SessionContext passiu:** No valida caducitat del JWT ni força logout quan caduca. Caldria revisar el flux d'expiració.
- **Enchufabilitat:** Posa un 7,5/10, indicant que amb Gestoria resolta pujarà a 9. Confirma que el disseny de ports i adaptadors és molt sòlid.

## 3. Vibe
- Es queixa de tindre només el manifest i no el codi font per avaluar l'autenticació. (Normal, perquè el bundle sencer el va rebre Claude).
- **Gestoria:** També assenyala l'import trencat a Dexie.
- **CSS Duplicat:** Avisa que hi ha residus de les carpetes d'escriptori (`Claude_260912_*`) al manifest (arxius `components.css` i `modules.css` antics) i suggereix esborrar-los.
- Suggereix verificar l'autenticació de Sollutia i les rutes protegides. (Accions que ja hem blindat gràcies a Claude).

## 4. Dola
- **Gestoria (Dexie):** Repeteix l'avís de Dexie i aporta una solució de mock similar a la nostra, incloent-hi l'avaluació de `teCapacitat('GESTORIA')` que precisament nosaltres vam clavar.
- **Seguretat:** Valida el plantejament actual (fail-closed de l'usuari, emmagatzematge en `sessionStorage` net, barrera if-not-currentUser visual a Gestoria).
- Recomana vigilar el XSS si es deixa el JWT en Javascript en el futur (és millor passar a HttpOnly quan Sollutia ho permeta).
- Confirma que la seguretat real ha de residir sempre en l'API validant el JWT per cada request.
- **Enchufabilitat:** Puntua amb 7/10 precisament per l'error de Gestoria, afirmant que un cop resolt (com és el cas) pujarà a 9/10 per la gran qualitat del patró de `backendPort.js`.

## 5. Z
- **Límit de Context:** Z no ha pogut ingerir el Bundle sencer. (No passa res, perquè Claude i Deepseek sí que ho han fet i són superiors).
- **Veredicte Teòric:** Sense vore el codi, recomana construir un port únic de comunicació (`api.js`) i un script per caçar imports orfes (`check-imports.mjs`). Açò ens confirma que estem en el camí correcte, ja que és exactament el que nosaltres ja hem construït amb el `backendPort.js` i el `tractor-importacions.mjs`!
- **Seguretat:** Recorda que la barrera de React és cosmètica i l'únic mur real és l'RLS del servidor. Suggereix un estat tri-estat (loading / authenticated / anonymous) per a evitar renderitzats fugaços, que és precisament el que li hem demanat a Claude a la Petorreta Definitiva.

## 6. Qwen
- **Lliçó Magistral d'Arquitectura:** Fa una anàlisi molt teòrica de patrons (Adaptador / Façana). Recomana exactament la via que ja hem pres amb `backendPort.js`.
- **Seguretat:** Proposa un hook `useAuth()` abstracte i adverteix del risc de `sessionStorage`, avalant les instruccions que ja hem posat a la Petorreta Definitiva per a Claude sobre la gestió del JWT.
- **Enxufabilitat i Llei E1-E4:** Lloa l'existència d'un `AGENTS.md` (la nostra Constitució) com a via per mantindre l'ordre, i recomana estar atents als deutes de `.sollutia-deute.json`.
- **Conclusió:** No troba cap bug nou a nivell de codi que no hagen vist els altres, però dóna un suport arquitectònic absolut al pla d'acció que tenim entre mans.
