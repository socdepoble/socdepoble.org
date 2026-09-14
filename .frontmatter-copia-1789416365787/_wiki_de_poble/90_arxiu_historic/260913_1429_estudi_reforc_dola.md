# Informe de Reforç (Dola)

Conté la resposta de Dola a la Petorreta d'auditoria destructiva.

## Veredicte Preliminar (6.8/10)
Dola s'ha endinsat completament en el cicle de vida de React (Hooks) i les condicions de carrera, actuant com un autèntic linter d'execució profunda. Aportacions vitals a micro-nivell:

1. **[Crític] Inconsistència de Defaults:**
   Dola ha caçat que `UniversalWorkspace` té funcions per defecte segures (`item?.id`), però `ManagerContext` té funcions destructives (`item.id`). Si algú usa el Context directament sense passar pel Workspace, un item nul provoca un TypeError.
2. **[Alta] Dependències buides en `useMemo` (`NotesEditor`):**
   La funció `extensionsRiques` té dependències buides `[]`, però depèn de `teCapacitat('mitjans')`. Si la capacitat canvia (per exemple, si s'acaba d'autenticar l'usuari), no es recalcula la capacitat de pujar imatges.
3. **[Alta] Setter dins de Setter (`AppGridShell`):**
   Ha vist que estem fent `setPanellObert(null)` des de dins de la funció d'actualització de `setMida(prev => ...)`. Açò és un anti-patró en React que pot causar renderitzats dobles o comportaments erràtics en Strict Mode.
4. **[Alta] Ping-Pong al Debounce (`ManagerList`):**
   El `setTimeout` del debounce vigila `ctxSearchQuery`, de manera que quan el context s'actualitza, es torna a disparar el temporitzador, provocant efectes de "race condition" si es tecleja ràpid.
5. **[Mitjana] Rendiment en aBlob:**
   Ha caçat que per convertir imatges grans en `DetallAjust` estem fent un `fetch(dataUrl)`, cosa que duplica la imatge a memòria en lloc de fer servir `atob`.

## Conclusió
Dola és la IA "Microscopi" (Hooks Linter i Race Conditions). Mentre altres IAs busquen el disseny arquitectònic o la seguretat global, Dola revisa cada array de dependències i cada funció de React per trobar efectes secundaris imprevisibles, comportant-se com un depurador d'estat a temps real.
