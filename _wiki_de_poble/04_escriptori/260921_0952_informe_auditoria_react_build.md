# Auditoria Arbre d'Arrencada i React — socdepoble.org

## Troballes Crítiques i Altes
**C-01 · Regressió d'autenticació (Sessió "fora" en fred):**
La sessió es declara "fora" abans que el backend existisca. `arrenca()` no és esperat pel render inicial, i `sessionService` engoleix l'error the backend no preparat com si fora una sessió tancada. Causa expulsió d'usuaris loguejats en recàrregues fredes.

**C-02 · Fogonada "Accés restringit":**
Es mostra als superadmins durant un instant perquè el rol passa per `desconegut` (fent saltar les guàrdies the React) en comptes de mantenir un estat the resolució neutral (`null`).

**C-03 · WordPress Bundle en Mode Desenvolupament:**
El build "standalone" pesa 2.5 MB perquè `vite.standalone.config.js` sobreescriu `process.env`, obligant a Vite a empaquetar React en versió DEV.

**C-04 · Desmuntatge the l'Arbre the Rutes (`key={location.pathname}`):**
A `App.jsx`, posar eixa clau a l'`ErrorBoundary` força la destrucció completa the tot l'arbre the rutes a cada clic. Mata el rendiment i reinicia el Suspense.

## Troballes Mitjanes i Baixes
**C-05-C08 · Defectes the React Context/Hooks:**
Router triat aleatòriament per ordre d'inserció; `toggleTheme` rovellat amb valors antics; `NotificationProvider` sense `useMemo`; fuita the memòria per promesa the OAuth no cancel·lada a `AppShell`.

**C-09 · Porta innerHTML Falsa Positiva:**
`tractor-innerhtml.mjs` falla i bloqueja els builds tot i que l'ús the `sanitizeHtml()` és correcte the forma local a les variables.

**C-11 i C-12 · Dependències:**
`react` no està tancat (`>=18.0.0`); `date-fns` i `react-day-picker` estan orfes, trencades i sense usar.

**C-13 · Vite / Vitest moren sense credencials:**
Fallada the `validatePublicCredentials` en entorns the test o clons nets on no fa falta connectar-se a Supabase en fase d'anàlisi.

**C-14 · Transpilació a es2015:**
Contradiu l'arquitectura the 2022, inflant i relentint el codi the WordPress respecte a la web SPA (`es2020`).

**C-18 i C-19 · Pantalles the Càrrega i ErrorBoundary:**
Sense classes CSS (pàgina en blanc durant els guards).

**Brossa d'arrel:**
Múltiples scripts the Python, fitxers the debug antics, i sobretot `.immunitari/cron.out` trackejat, que destrueix els commits i embruta `git status` per sempre.
