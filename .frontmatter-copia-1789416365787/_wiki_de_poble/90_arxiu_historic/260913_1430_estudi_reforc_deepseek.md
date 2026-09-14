# Informe de Reforç (Deepseek)

Conté la resposta de Deepseek a la Petorreta d'auditoria destructiva.

## Veredicte Preliminar (6.5/10)
Deepseek ha actuat com l'enginyer "Full-Stack" enfocat en la integritat de dades i el contracte amb el Backend, amb una precisió quirúrgica:

1. **[Crític] Corrupció Silenciosa a Supabase:**
   Ha detectat que `updateOrganization` a `supabaseBackend.js` té una "llista blanca" de camps permesos (`allowed = ['name', 'slug', ...]`) que descarta silenciosament els camps `lema` i `logo_url`. L'usuari guarda la imatge, l'API retorna èxit, però no es guarda a la base de dades.
2. **[Crític] Columnes inexistents a la BBDD:**
   L'editor de Perfil permet guardar `hero_image`, però la columna no existeix a la taula `profiles`. Això llança un error a PostgREST que es captura silenciosament. També l'ajust `privacitat` llança un 400.
3. **[Crític] Z-Index i Position:**
   Ha caçat el motiu exacte pel qual l'àlies d'`UniversalManager` rebentava l'aplicació visualment: `AppGridShell` utilitza `position: absolute; inset: 0`, però com que `UniversalPage` no té `position: relative` en el seu `content-wrapper`, la graella sobreposa fins i tot la barra blava de navegació (el crom de la pàgina).
4. **[Crític] Confirmació d'Identitat a `guardarAjust`:**
   Corrobora el mateix forat que Codex (escriptura de camps de l'organització sobre l'usuari personal) i aporta el pegat exacte per injectar la `identitatObjectiuId` al mètode.

## Conclusió
Deepseek és el pont perfecte entre el Frontend i la Base de Dades (Data Integrity). Mentre els altres miren components React, Deepseek revisa esquemes SQL, llistes blanques del Backend i el contracte API per detectar corrupcions de dades silencioses.
