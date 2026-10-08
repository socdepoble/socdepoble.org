---
type: informe
status: esborrany
description: 'Auditoria adversarial del xat (cicle de vida, seguretat, SQL, dades, fluïdesa, sessió i proves): 50 defectes verificats, 9 bloquegen la beta.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7:73941d39-6e27-4302-8b51-c1e240d749d7
---
# Auditoria adversarial extrema del xat abans de la beta

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7:73941d39-6e27-4302-8b51-c1e240d749d7 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T11:55:59.659Z |
| Modificació | 2026-10-08T11:55:59.659Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, workflow Ultracode) |
| Tokens consumits | Uns 16,8 M en subagents: 12,0 M en la primera tanda i 4,8 M en la represa |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-08T11:55:59.659Z: esborrany creat; contingut i verificació pendents.

2026-10-08: informe redactat a partir de la síntesi del workflow d'auditoria (50 defectes, 9 bloquejants, 4 refutades); Registre completat amb el model i els tokens. Queda pendent l'aprovació humana.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte global

**NO APTE encara per a betatesters.** Les 67 troballes vives (n'hi ha 4 de refutades) es resumixen en 50 defectes: 1 alt, 14 mitjans i 35 baixos. Nou bloquegen l'obertura i cauen en tres blocs: (1) seguretat i protecció de persones, perquè els fils de pàgina no tenen cap moderació, cosa que la mateixa migració declara condició prèvia (B01), no hi ha protecció de menors als missatges directes (B02), el directori ha perdut el filtre de consentiment RGPD (B03), els canals oficials es poden suplantar (B07) i les metadades no tenen límit de mida (B08); (2) desplegament, perquè cal verificar al node que la migració 2610042330 (`/iaia`) està aplicada (B06); i (3) cicle de vida amb xarxa rural, perquè un sondeig fallit convertix la conversa oberta en un 404 (B04), recarregar un fil llegit com a visitant també dona 404 (B05) i una fallada de l'historial dispara un bucle de peticions (B09). Només B06 queda PLAUSIBLE, perquè depén de l'estat de producció; la resta estan confirmades. Dins de l'abast estàtic auditat no s'ha trobat cap fuita entre pobles ni cap escalada de privilegis, i la RLS denega correctament el que ha de denegar; l'aïllament entre pobles, però, només s'ha cobert parcialment (vegeu Límits). La resta de defectes (B10-B50) són fissures de fluïdesa, rendiment, escala i proves que es poden tractar durant la beta, prioritzant B10 (purga d'esborranys) i B13-B15 (estat buit fals, fletxa ←, teclat), que afecten el requisit «com WhatsApp».

### Porta mínima per a obrir la beta

1. **B01 · Moderació o tancament dels fils de pàgina.** O bé moderació mínima (amagar, expulsar, eixir, tancar i denunciar) més bloqueig, o bé desactivar `xatDePagina` al client publicat o restringir-lo a una llista de betatesters. Decisió del Mestre.
2. **B02 · Protecció de menors.** Beta només amb adults declarats, o missatges directes només després d'una sol·licitud acceptada. Decisió del Mestre.
3. **B03 · Consentiment.** Restaurar el filtre `consentiment_rgpd_at is not null` a `membres_del_poble` i a `crea_fil_directe`.
4. **B08 · Metadades.** Ignorar `p_metadades` a `xat_envia` i inserir sempre `'{}'`.
5. **B07 · Identitats oficials.** Reservar els noms i els slugs oficials, marcar l'entitat oficial i no resoldre mai el contacte d'ajuda pel nom.
6. **B06 · Desplegament.** Verificar en lectura al node de producció que 2610042330 està aplicada i, si no ho està, aplicar-la. La síntesi la compta entre els 9 bloquejants (bloc 2), però no la repetix a la seua llista de porta mínima; s'hi afig ací perquè és condició d'obertura.
7. **B04, B05 i B09 · Cicle de vida.** Corregir-les: són canvis acotats a `XatContext.jsx`, `XatSection.jsx` i `Conversa.jsx`.

### B01 · Fils de pàgina oberts a tot el poble sense cap moderació

- **Severitat i estat:** alta. CONFIRMADA: 2 escèptics a la troballa principal i 1 a la de proves, tots «alta». Agrupa 2 troballes.
- **Fitxer:** `supabase/migrations/2609282100_xat_de_pagina.sql:61`
- **Escenari:** qualsevol membre del poble obri `/xat?sobre=pagina:%2Fmur`, o el xat públic de `/iaia` on porta la fila per defecte «IAIA MarIA», i hi publica insults, dades d'un tercer o spam: fins a 15 missatges cada 5 s (unes 10.800 per hora) de 4.096 caràcters cadascun. Tot el poble ho llig com a visitant. Des de l'app ningú no pot amagar-ho, expulsar l'autor, tancar el fil ni denunciar-ho; l'autor no pot esborrar el seu missatge i cap participant no pot eixir del fil. Només l'operador ho pot netejar a mà amb `service_role`.
- **Evidència:** `2609282100:61-68` declara que no hi ha moderació i que el mínim (amagar, expulsar, tancar i denunciar) és condició prèvia abans d'obrir els fils de pàgina a tot el poble; `2610042330:5` ho reitera. Un grep de denunci/expuls/moderaci a `supabase/migrations` només troba comentaris. `2609272200:117-119` revoca insert/update/delete de `xat_missatges` i `xat_participants` a `authenticated`, i cap migració escriu `esborrat_al` ni `visible_fins_seq`. L'únic fre és `trg_rate_limit_xat`, 15 missatges cada 5 s (`2609080200:399-405`). Accés: `obri_fil_de_pagina` només demana sessió i `is_town_member` (`2609282100:306-311`), `xat_entra_al_fil_de_pagina` dona d'alta qualsevol membre (`2609282100:475-505`) i `xat_envia` només exigix `es_participant` (`2609272200:259`). Client: la capacitat `xatDePagina` està activa (`src/data/supabase/xat.js:454-470`; `XatContext.jsx:1100`); `EntradaDelPoble.jsx:18-19` només frena la comunitat del poble, no «Comentar» ni la fila de la IAIA; a `XatControlSection.jsx:46`, «bloquejar» té `pendent:true`. Proves: `tests/migracio-xat-de-pagina.test.mjs:153-154` només exigix que la capçalera ho avise, i cap porta lliga la capacitat a l'existència de moderació. Agreujants: B30 (la làpida no amaga el text), B21 (l'alta és irreversible) i B34 (la fila de la IAIA porta al xat públic).
- **Font de veritat en conflicte:** la capçalera de la mateixa migració (`2609282100:61-68`) i `2610042330:5`.
- **Correcció proposada:** (a) una migració amb el mínim declarat: `xat_amaga_missatge` (l'autor sobre el seu, i l'admin de l'entitat o del node sobre qualsevol), `xat_expulsa`, `xat_eixir_del_fil` (que escriga `visible_fins_seq`), `xat_tanca_fil` i `xat_denuncia` amb una taula privada de denúncies; totes les lectures han de tornar `case when m.esborrat_al is null then m.text end`. (b) Mentrestant, desactivar `xatDePagina` al client publicat, o restringir `obri_fil_de_pagina` i `xat_entra_al_fil_de_pagina` a una llista de betatesters. A més, substituir l'asserció de text per proves de comportament de les RPC i afegir una porta que falle si la capacitat es publica sense moderació.
- `requires_human_decision: true`: el Mestre ha de triar entre moderació mínima, desactivar `xatDePagina` o restringir-lo a una llista beta.

### B02 · Cap protecció de menors als missatges directes

- **Severitat i estat:** mitjana. CONFIRMADA: 2 escèptics (mitjana i alta). Calibrada en mitjana, la més baixa raonable, perquè és una funcionalitat que falta (el comportament dissenyat és igual per a tothom), no un control trencat. Bloqueja igualment: la protecció de menors és un requisit explícit del Mestre i `legalContent.js:48` admet comptes des dels 14 anys.
- **Fitxer:** `supabase/migrations/2609291210_xat_cerca_accents.sql:37`
- **Escenari:** una persona de 15 anys es registra, cosa que el text legal permet des dels 14. Un adult del mateix poble la troba a «Nova conversa», perquè `membres_del_poble` li torna el nom i l'avatar, crida `crea_fil_directe` i el fil naix amb les dues participacions, sense cap acceptació. Li pot enviar 15 missatges cada 5 s. La menor no el pot bloquejar ni denunciar, i el sistema no sap que és menor. Variant: un enllaç `/xat?amb=<uuid de l'adult>` fa que qui el clica cree el DM sense voler-ho (B35).
- **Evidència:** `profiles` no té cap camp d'edat ni de tutela (`2609080000_initial_schema.sql:62-71`) i cap alter posterior n'afig; un grep de menor/naixement/birth/edat/tutor a les migracions no troba res aplicable. «llinatge» a `XatContext.jsx:205-213` és la cadena d'operacions asíncrones, no la família. `src/sections/text/legalContent.js:48` fixa l'edat mínima en 14 anys. L'alta al poble obert és automàtica (`2609261500:816-825` i `:875-879`). `membres_del_poble` (`2609291210:36-37`) torna tot membre que no està de baixa. `crea_fil_directe` (`2609272200:207-225`) només comprova que l'altra persona és membre i no està de baixa, i inserix el fil i les dues participacions de colp. `xat_envia` només exigix `es_participant` (`2609272200:259`). No hi ha bloqueig: `XatControlSection.jsx:46` el té pendent i `2609282100:61-68` ho declara.
- **Font de veritat en conflicte:** el requisit explícit del Mestre de protecció de menors i `src/sections/text/legalContent.js:48` (comptes des dels 14 anys).
- **Correcció proposada:** afegir a `profiles` una franja d'edat (`es_menor`), declarada en l'alta i revisable per l'administració. `membres_del_poble` no ha de mostrar menors a adults, i `crea_fil_directe` ha de rebutjar un adult que escriu a un menor amb un codi nou (p. ex. SDP-XAT-015). Una RPC `xat_bloqueja(persona)` que `xat_envia` i `crea_fil_directe` consulten, més la denúncia de B01. Mínim per a la beta: DM només després d'una sol·licitud acceptada, o beta restringida a adults declarats.
- `requires_human_decision: true`: el model de protecció (franja d'edat, sol·licitud acceptada o beta només d'adults) el decidix el Mestre.

### B03 · Regressió RGPD al directori del xat

- **Severitat i estat:** mitjana. CONFIRMADA: 2 escèptics, com a subtroballa de B02, i el sintetitzador ho ha tornat a verificar amb grep. Severitat posada pel sintetitzador: és la regressió concreta d'un filtre legal, sense fuita fora del poble.
- **Fitxer:** `supabase/migrations/2609291210_xat_cerca_accents.sql:37`
- **Escenari:** una persona entra per OAuth, sense consentiment en l'alta (`2609261500:830-831`), o el retira (`anota_consentiment` posa `consentiment_rgpd_at` a null, `2609261500:593`). Continua apareixent amb nom i avatar al padró del xat per a tot el poble, i qualsevol li pot obrir un DM amb `crea_fil_directe`.
- **Evidència:** `2609261500_identitat_perfil_f1.sql:1304` filtrava `and pr.consentiment_rgpd_at is not null`, i `2609140100:97` també, segons els escèptics. Un grep de `consentiment_rgpd_at` no troba res ni a `2609272200_xat_entitats.sql` ni a `2609291210_xat_cerca_accents.sql`. La definició vigent (`2609291210:36-37`) només filtra `baixa_demanada_at is null`. `crea_fil_directe` (`2609272200:207-211`) tampoc no comprova el consentiment.
- **Font de veritat en conflicte:** el filtre de consentiment de `2609261500_identitat_perfil_f1.sql:1304`.
- **Correcció proposada:** tornar a posar `and pr.consentiment_rgpd_at is not null` a `membres_del_poble` i afegir la mateixa condició a `crea_fil_directe` per a l'altra persona. Prova de regressió que falle si el filtre desapareix.
- `requires_human_decision: false`.

### B04 · Un sondeig fallit buida la llista i convertix la conversa oberta en un 404

- **Severitat i estat:** mitjana. CONFIRMADA: 2 troballes amb 3 veredictes (alta, mitjana i alta). Calibrada en mitjana, la més baixa raonable: no es perd cap dada al servidor, no hi ha impacte de seguretat i es recupera amb `visibilitychange`, amb `online` o als 250 s. Bloqueja igualment perquè passa amb una sola fallada de xarxa en cobertura rural intermitent (amb `navigator.onLine=true`), que és el públic de la beta.
- **Fitxer:** `src/sections/xat/XatContext.jsx:619`
- **Escenari:** mòbil amb `/xat/X` oberta a pantalla completa. El tic de 25 s de `carregaFils` rep un 5xx, un temps esgotat o un «Load failed» que no és un avortament. El catch buida `filsRef` i `fils`, i el finally posa l'estat a 'ready'. `trobat` és null i `XatSection` pinta `<NotFoundPage/>` en lloc de tota la closca: es perden la cita a mitges, la posició i el separador de no llegits (l'esborrany sobreviu a `esborranys.js`), i les barres tornen. A `/xat`, l'alerta substituïx la llista. El tic següent s'espaia a `MS_LLISTA×10` = 250 s, i `ticFil` continua però no restaura `fils`.
- **Evidència:** `XatContext.jsx:614-621`: el catch fa `setAvis`, `filsRef.current=[]` i `setFils([])` sense distingir la primera càrrega d'un sondeig amb dades; `:623` fa `setEstat('ready')`; `:182` i `:813`: `ok === false ? MS_LLISTA * 10`; `:1133-1138`; `:1216`; `:841-852`: només desperta i online ho acceleren. `XatSection.jsx:321` i `:604-606`: retorn primerenc a `NotFoundPage`. `src/data/supabase/xat.js:391-402` no reintenta. Cap prova cobrix un `loadFils` rebutjat després d'una càrrega bona. Relacionat: `creaFil` ignora el `false` de `carregaFils` (B23).
- **Font de veritat en conflicte:** cap document; la síntesi el classifica com a cicle de vida en xarxa rural intermitent, el context real de la beta.
- **Correcció proposada:** quan falla un sondeig i la llista ja s'havia carregat, conservar `fils` i `filsRef` i mostrar només un avís no bloquejant amb «Torna-ho a provar»; buidar-la només si encara no s'ha carregat mai, o amb l'error d'esquema. Per als errors reintentables, un backoff curt (2, 5, 10 i 30 s, amb sostre de 60 s) en lloc de ×10. A `XatSection`, no decidir el 404 mentre l'última càrrega haja fallat (exposar `llistaFresca`) ni si el fil ja s'havia trobat abans. Prova: un `loadFils` rebutjat després d'una càrrega bona conserva la conversa.
- `requires_human_decision: false`.

### B05 · Un fil de pàgina llegit com a visitant no sobreviu a recarregar

- **Severitat i estat:** mitjana. CONFIRMADA: 4 troballes duplicades, amb 2, 1, 1 i 1 escèptics, tots «mitjana».
- **Fitxer:** `src/sections/xat/XatSection.jsx:441`
- **Escenari:** la persona prem «Comentar → En públic», o la fila «IAIA MarIA», que va a `?sobre=pagina:%2Fiaia`. `obriFilDePagina` la marca com a visitant en memòria i navega amb `replace` a `/xat/<filId>`, i el `?sobre=` desapareix. Si recarrega, si iOS descarta i restaura la pestanya o si envia l'enllaç a un veí, els visitants queden buits i `xat_fils_meus` no torna el fil, perquè no hi ha escrit: `NotFoundPage`. Alhora, `obriFil(threadId)` demana els missatges per `xat_historial` sense `visitant`, el servidor respon «SDP-XAT-006: no eres membre actiu del fil.», l'error queda a `avis` i `ticFil` el repetix cada 30 s. En tornar a `/xat`, l'avís tapa la llista fins al tic següent (≤25 s). Només es recupera tornant a prémer «Comentar».
- **Evidència:** `XatSection.jsx:441`: `navigate` amb `replace` sense el descriptor. `XatContext.jsx:433-434` i `:1106-1108`: els visitants només viuen en l'estat de React (cap `sessionStorage` a `src/sections/xat`); `:537-538`: la purga. `2609282100_xat_de_pagina.sql:276-277` i `:376`: obrir el fil no et fa participant; `:644-645`: `xat_fils_meus` només torna els fils on participes. `XatSection.jsx:604-606` pinta `NotFoundPage` i `:354-357` crida `obriFil` igualment. `XatContext.jsx:643` (visitant només si `esVisitant`), `:676` (`setAvis`) i `:824-825` (reintent a 30 s). `2609272200_xat_entitats.sql:346-353`: SDP-XAT-006. `LlistaConverses.jsx:26-33`. `useObriXatPerDefecte.js:29` i `:37`. Les proves de `XatSection` simulen `useXat` (`XatSection.test.jsx:99-128`) i `NotFoundPage` (`:62`).
- **Font de veritat en conflicte:** cap document; la fila per defecte «IAIA MarIA» (`useObriXatPerDefecte.js:29` i `:37`) depén d'este camí.
- **Correcció proposada:** conservar el subjecte a la URL de la conversa (`/xat/<filId>?sobre=…&titol=…&ruta=…`) o persistir els visitants per àmbit a `sessionStorage`. Si `threadId` no és a la llista carregada i hi ha descriptor, tornar a cridar `obriFilDePagina` abans de decidir el 404, i no cridar `obriFil` per a un id absent de la llista. Prova d'integració amb el `XatProvider` real: obrir com a visitant, remuntar el proveïdor amb la mateixa ruta i exigir la conversa visible sense avís.
- `requires_human_decision: false`.

### B06 · «IAIA MarIA» i el «Comentar» de /iaia fallen si producció no té 2610042330

- **Severitat i estat:** mitjana. PLAUSIBLE: 4 escèptics de 3 troballes confirmen el camí de codi, però des del repositori no es pot saber si producció té 2609282100 sense 2610042330. Calibrada d'alta a mitjana, segons tots els escèptics: és un risc d'ordre de desplegament, falla amb un toast i torna a la llista, sense pèrdua de dades ni impacte de seguretat. Bloqueja com a verificació obligatòria abans d'obrir.
- **Fitxer:** `src/sections/xat/useObriXatPerDefecte.js:29`
- **Escenari:** un betatester qualsevol prem «IAIA MarIA»: `/xat?sobre=pagina:%2Fiaia` crida `obri_fil_de_pagina('pagina','/iaia')`. Si només hi ha 2609282100, `private.xat_subjecte` només coneix '/ia' i `v_clau` queda null. La persona veu el toast cru «SDP-XAT-013: la pàgina no existix o no la pots vore.» i torna a `/xat`. La fila sintètica es queda, i cada toc falla igual.
- **Evidència:** client: `useObriXatPerDefecte.js:29` i `:37`; `src/data/contracte.js:268` té '/iaia' i no '/ia', i `:325` (`subjecteDeXat`); `src/data/supabase/xat.js:470-475` passa `p_id` tal qual i no reintenta amb l'àlies. Servidor: `2609282100_xat_de_pagina.sql:208` té '/ia' i `:213` compara `pg.cami = p_id`; `:323-324` llança SDP-XAT-013. Només `2610042330_xat_pagina_iaia.sql:128` i `:133` afigen '/iaia' i l'àlies. Indicis que no està aplicada: la capçalera de 2610042330 (`:4`) i `supabase/README.md:181`; però `README:170` també dona 2609282100 per no aplicada i el Mestre diu que sí que ho està, així que el README no és fiable. L'encàrrec parla d'«una» migració. La prova `tests/migracio-xat-de-pagina.test.mjs:101-102` i `:272-277` fusiona les dues migracions com a estat final.
- **Font de veritat en conflicte:** el contracte del client (`src/data/contracte.js:268`, que ja usa '/iaia') contra la definició de servidor de `2609282100:208`; `supabase/README.md` no servix com a registre de desplegament.
- **Correcció proposada:** comprovar en lectura al node de producció `select conname from pg_constraint where conname='xat_fils_pagina_iaia_canonica'`, i que `pg_get_functiondef('private.xat_subjecte(uuid,text,text)'::regprocedure)` conté '/iaia'. Si no hi és, aplicar 2610042330: és idempotent i avorta amb SDP-XAT-014 si ja hi ha dos fils. Després, actualitzar les capçaleres, el README i les proves que exigixen «NO aplicada» (la síntesi cita `tests:149`, `:448` i `:520-521`), i afegir una sonda de desplegament de `obri_fil_de_pagina('pagina','/iaia')`.
- `requires_human_decision: true`: només el Mestre pot consultar el node de producció i decidir si s'hi aplica 2610042330.

### B07 · Suplantació de les identitats oficials

- **Severitat i estat:** mitjana. CONFIRMADA: 3 troballes, títol del DM (2 escèptics, mitjana i mitjana), nom de perfil (2 escèptics, mitjana) i canal d'ajuda (1 escèptic, d'alta a mitjana). Mitjana per a totes, perquè cal ser membre autenticat del poble. Bloqueja: sense moderació (B01), una suplantació del canal d'ajuda oficial no es pot retirar des de l'app, i el públic inclou nouvinguts i possibles menors.
- **Fitxer:** `src/sections/xat/contactesAjuda.js:17`
- **Escenari:** (a) l'atacant es posa de nom «IAIA MarIA», o literalment «IAIA MarIA · IA», amb l'avatar del logo, i respon als nouvinguts al xat públic de `/iaia`: la seua bombolla no es distingix de la real, perquè al servidor cap missatge porta `es_ia=true`. (b) Crida `rpc('crea_fil_directe', {p_altre_usuari: víctima, p_titol: 'Sóc de Poble'})`: a la llista i a la capçalera de la víctima el DM es diu «Sóc de Poble», amb l'avatar de l'atacant i sense línia secundària, i des d'allí li demana dades. (c) Crea una companyia «Sóc de Poble»: «Nova conversa» resol el contacte d'ajuda pel nom i el padró ordena per (nom, id), de manera que, si el seu UUID és menor, el clic obri un DM amb ell; en un poble obert on encara ningú no té l'slug 'socdepoble', el registra, i la fila per defecte i «En privat» de tothom porten a ell.
- **Evidència:** `profiles.full_name` només té un CHECK de llargària (`2609080000:64`) i un grant update (`2609110600:17`; `2610042350:82-86`); un grep de reservat/suplant no troba cap guarda de noms. `xat_envia` posa `es_ia=false` fix (`2609272200:287-289`) i `Bombolla.jsx:58-66` pinta el nom tal qual («· IA» és només text, `:59`). `crea_fil_directe` guarda `p_titol` en els fils 'directe' (`2609272200:196` i `:222-223`); `missatges.js:72` usa `fil.titol` abans que els noms dels altres; `CapcaleraConversa.jsx:84` i `:88-92`; la imatge és l'avatar de l'altra persona (`2609282100:629`). `contactesAjuda.js:16-17` cau a `m.nom === nom`, i el comentari de `:11-13` admet que en remot només el nom la reconeix. `membres_del_poble` no torna l'slug i ordena per `d.nom, d.id` (`2609291210:13`, `:26` i `:50`). `create_organization` no reserva ni noms ni slugs (`2609281500:88-108` i `:163-183`). `xatCorporatiu.js:133-146` resol per slug dins del poble, i `jaTeElXat` accepta l'slug (`xatsPerDefecte.js:97-100`). Matisos: el DM fals no és idèntic al real, i al poble pilot l'slug ja està pres (`2609080000:86`).
- **Font de veritat en conflicte:** la identitat dels canals oficials (contacte d'ajuda i files per defecte); el mateix comentari de `contactesAjuda.js:11-13` reconeix la debilitat.
- **Correcció proposada:** al servidor, reservar noms i slugs amb un trigger a `profiles` i a `create/update_organization` que plegue majúscules i accents com `private.xat_plega_cerca` (reservats: 'Sóc de Poble', 'socdepoble', 'IAIA MarIA', 'iaia' i els noms de les organitzacions del poble); marcar l'entitat oficial (UUID per poble en un ajust privat) i exposar-ho com a `oficial` a `membres_del_poble` i al directori; ignorar `p_titol` en els fils 'directe'. Al client, si no hi ha marca oficial, el contacte d'ajuda queda `noDisponible` (mai no es resol pel nom); el nom d'un 1:1 ix sempre d'`altres`/`altresNoms`, excepte en les files `perDefecte`; afegir una insígnia visual verificable per a entitat i IA que no es puga escriure dins del nom.
- `requires_human_decision: true`: la llista de noms reservats i quina és l'entitat oficial de cada poble són decisions del Mestre.

### B08 · `xat_envia` no limita la mida de `p_metadades`

- **Severitat i estat:** mitjana. CONFIRMADA: 2 escèptics, «mitjana». Matís: no cal haver escrit abans al fil, n'hi ha prou amb `xat_entra_al_fil_de_pagina`.
- **Fitxer:** `supabase/migrations/2609272200_xat_entitats.sql:250`
- **Escenari:** un veí entra al fil amb `xat_entra_al_fil_de_pagina` i crida directament `rpc('xat_envia', {p_metadades: {x: '<2 MB>'}, p_text: '.'})` 15 vegades cada 5 s. La taula creix uns 6 MB/s per atacant. Cada visitant que obri el fil descarrega fins a 50 missatges (100 com a màxim) amb les metadades senceres, i cada participant connectat se les baixa per `xat_nous`. Sense moderació (B01), ningú no ho pot aturar des de l'app.
- **Evidència:** l'única validació és `jsonb_typeof(...) <> 'object'` (`2609272200:250`), i la inserció només lleva 6 claus d'autoria (`:287-289`). La columna no té cap CHECK (`2609270200:152`), a diferència del text (`2609270200:157-170`), i cap migració usa `pg_column_size`. Les metadades es tornen a `xat_llig_fil_de_pagina` (`2609282100:413` i `:450`), `xat_historial` (`2609272200:369`) i `xat_nous` (`:453`). El client F0 no n'envia mai (`XatContext.jsx:945`, `metadades: {}`), però l'RPC té grant a `authenticated` (`2609272200:302`). El límit del gateway de Supabase no es pot verificar des del repositori.
- **Font de veritat en conflicte:** el límit que ja té el text (`2609270200:157-170`) no té equivalent per a les metadades, i el client F0 no les necessita (`XatContext.jsx:945`).
- **Correcció proposada:** en F0, ignorar `p_metadades` a `xat_envia` i inserir sempre `'{}'`: és un canvi d'una línia i no trenca cap flux del client. Per a F1, afegir `check (pg_column_size(metadades) <= 2048)` amb el patró NOT VALID / VALIDATE de `2609270200:157-170`, i una llista blanca de claus.
- `requires_human_decision: false`.

### B09 · Bucle de peticions sense espera quan falla l'historial antic

- **Severitat i estat:** mitjana. CONFIRMADA amb 1 escèptic. Calibrada d'alta a mitjana, segons l'escèptic: no afecta la seguretat ni perd dades. Bloqueja perquè sense xarxa fa una petició i un render per fotograma (bateria i CPU en mòbil rural), durant una caiguda del servidor multiplica la càrrega des de cada client, i la correcció és barata.
- **Fitxer:** `src/sections/xat/components/Conversa.jsx:271`
- **Escenari:** la persona puja fins dalt d'una conversa amb `hiHaMes=true`, sense cobertura o amb el servidor en 5xx. El sentinella dispara `onCarregaMes`; `carregaMesAntics` falla i posa `carregant:false` sense tocar `hiHaMes`. L'efecte depén de `carregantMes`, recrea l'IntersectionObserver i la notificació inicial torna `isIntersecting=true`: petició nova immediata. Sense xarxa, la crida rpc va per POST, postgrest-js no la reintenta i falla en mil·lisegons: desenes de peticions per segon, i el botó parpelleja. Passa igual amb els errors no reintentables (SDP-XAT-0xx).
- **Evidència:** `Conversa.jsx:271-279`: l'efecte té deps `[hiHaMes, carregantMes, onCarregaMes]` i crida `onCarregaMes` amb qualsevol `isIntersecting`; `:452` i `modules.css:4167`: el sentinella es pinta sempre i té alçada. `XatContext.jsx:687-688` i `:712`: la guarda s'esborra al finally; `:705-709`: en error, `carregant:false` sense comptador ni espera. `XatSection.jsx:504-506`. `node_modules/@supabase/postgrest-js/dist/index.mjs:23`, `:181` i `:370`: només es reintenten GET, HEAD i OPTIONS. La guarda d'esgotament (`Conversa.jsx:258-268`) només actua en la fase 'antics' amb `!llesta`. Proves: `Conversa.revisio260930.test.jsx:237-244` corre sense IntersectionObserver, i `:222-235` usa un fals que no simula la notificació inicial.
- **Font de veritat en conflicte:** cap document; la guarda d'esgotament existent (`Conversa.jsx:258-268`) mostra la intenció de frenar la paginació, però no cobrix l'error.
- **Correcció proposada:** comptar per fil les fallades seguides de `carregaMesAntics` i exposar `errorAntics` o `reintentaDesDe`. L'observador no ha de disparar dins del backoff. Després de N fallades, o amb un error no reintentable, només el botó manual o l'esdeveniment `online` tornen a provar. El primer èxit reinicia el comptador. Afegir una prova amb un observador fals que reproduïsca la notificació inicial.
- `requires_human_decision: false`.

### Defectes no bloquejants

Els 41 defectes que no bloquegen l'obertura (13 mitjans i 28 baixos), amb la ubicació principal que en dona la síntesi.

| Id | Severitat | Títol curt | Fitxer:línia | Correcció |
| --- | --- | --- | --- | --- |
| B10 | mitjana | Una renovació fallida amb el JWT caducat, o una llista d'organitzacions fallida, es tracta com un canvi de persona i purga bombolles fallides i esborranys | `src/sections/xat/XatContext.jsx:516` | No tancar la pestanya per un error de xarxa amb el JWT caducat, conservar les pertinences si la recàrrega falla amb el mateix usuari i traure `actorKey` de la clau de dades del xat. |
| B11 | mitjana | Una organització amb slug igual a l'UUID d'una entitat en pot segrestar la comunitat i els Avisos (`xat_subjecte` amb `limit 1` sense ordre) | `supabase/migrations/2610042330_xat_pagina_iaia.sql:79` | Buscar només per id si `p_id` té forma d'UUID i només per slug si no, prohibir slugs amb forma d'UUID i fer el mateix a `loadPerfilPublic`, amb prova SQL del desempat. |
| B12 | mitjana | Purgar una gestora donada de baixa esborra en cascada els Avisos i les respostes que va signar com a entitat | `supabase/migrations/2609282100_xat_de_pagina.sql:767` | Conservar els missatges amb `com_org_id` no nul abans de `delete from auth.users` (FK `ON DELETE SET NULL` per a eixes files o reassignació a un usuari tècnic). |
| B13 | mitjana | Estat buit fals («Cap missatge encara…») mentre la conversa carrega i quan la càrrega falla | `src/sections/xat/components/Conversa.jsx:453` | Exposar per fil un estat de càrrega i un d'error, pintar «Carregant…» o l'error amb reintent, i deixar l'estat buit només per al fil carregat i buit. |
| B14 | mitjana | La fletxa ← afig `/xat` a l'historial i el gest enrere torna a obrir la conversa tancada | `src/sections/xat/XatSection.jsx:680` | Marcar l'origen a `history.state` i fer `navigate(-1)` si l'entrada anterior és la llista, o `replace` si no; igual a `tornaDeLaComunitat`. |
| B15 | mitjana | Amb el teclat virtual obert, la capçalera de la conversa ix de la pantalla (iOS Safari i Chrome Android 108+) | `index.html:5` | Afegir `interactive-widget=resizes-content` al meta viewport i un hook en mode immersiu que fixe l'alçada de l'arrel a `visualViewport.height`. |
| B16 | baixa | Entrada en fred a `/xat/<id>` sense estat de càrrega: 404 fugaç, «Selecciona una conversa» i 404 permanent sense sessió | `src/sections/xat/XatContext.jsx:1216` | Status 'loading' mentre la sessió remota es comprova, esquelet de conversa i, sense sessió, portar a `rutaDEntrada`. |
| B17 | baixa | Un anònim que prem «Escriu-li al xat» (`?amb=<X>`) acaba al xat simulat de «Sóc de Poble» | `src/sections/xat/components/FakeChatOnboarding.jsx:167` | Amb `senseSessio`, que l'efecte `?amb=` navegue a `rutaDEntrada` com ja fa `?sobre=`. |
| B18 | baixa | Un sol estat `avis`: un error del fil, de l'historial o d'una marca substituïx tota la llista | `src/sections/xat/components/LlistaConverses.jsx:26` | Separar `avisLlista` d'`avisFil`, pintar l'error del fil dins de la conversa i afegir una prova de render. |
| B19 | baixa | La llista no es refresca mentre es navega entre converses: el sondeig de 25 s es reinicia a cada canvi de fil | `src/sections/xat/XatContext.jsx:816` | Separar el sondeig de la llista (dependent només de `joId` i el token) del sondeig del fil obert. |
| B20 | baixa | Realtime en fils de pàgina: el visitant es torna a unir cada 10 s a un canal denegat, sondeja cada 5 s i `canalViu` no torna a true | `src/sections/xat/XatContext.jsx:778` | No subscriure's com a visitant, reconnectar en passar a participant i posar `canalViu=true` en rebre SUBSCRIBED. |
| B21 | baixa | Entrar a un fil de pàgina és irreversible i no atòmic: Avisos de colp com a no llegits i alta sense enviament | `supabase/migrations/2609282100_xat_de_pagina.sql:496` | Inserir comunitat i Avisos amb `llegit_fins_seq = ultim_seq` i fer l'alta en la mateixa transacció que el primer enviament. |
| B22 | baixa | Respostes de càrrega tardanes desfan canvis locals més nous (previsualització i missatge propi confirmat) | `src/sections/xat/XatContext.jsx:602` | Conservar els valors locals més nous de la previsualització i els missatges amb `seq` superior al màxim rebut. |
| B23 | baixa | `creaFil` torna l'id encara que la recàrrega de la llista haja quedat superada o haja fallat (404 fugaç o fins al sondeig següent) | `src/sections/xat/XatContext.jsx:1080` | Esperar la càrrega que l'ha superada o, si ha fallat, afegir el fil nou a `fils` de manera provisional. |
| B24 | baixa | Després d'un buit llarg, la conversa es posa al dia a pedaços de 100 (50 com a visitant) començant pels més antics | `src/sections/xat/XatContext.jsx:653` | Repetir la lectura incremental mentre torne el límit, o carregar els darrers 50 i deixar el forat per a «Carrega'n més». |
| B25 | baixa | Cada avís de temps real descarta la lectura en curs i congela la conversa durant una ràfega | `src/sections/xat/XatContext.jsx:632` | Una sola lectura en curs per fil amb marca de «brut» i comptador de generació per fil. |
| B26 | baixa | El primer missatge d'una conversa nova gairebé mai no avisa, i fora del Xat no hi ha indicador de no llegits | `src/sections/xat/XatContext.jsx:490` | Després de la primera càrrega bona, avisar d'un fil desconegut amb no llegits d'una altra persona; opcionalment, `totalNoLlegits` a la navegació. |
| B27 | baixa | Un últim missatge molt llarg no es marca mai com a llegit | `src/sections/xat/components/Conversa.jsx:300` | Llindars `[0, 0.5]` i comptar la vista també per l'alçada intersecada respecte de l'arrel. |
| B28 | baixa | Una obertura lenta des de «Nova conversa» o la cerca navega encara que ja se n'haja obert una altra | `src/sections/xat/XatSection.jsx:633` | Un testimoni de demanda (comptador i ruta del clic) que invalide la navegació si la persona ja ha canviat. |
| B29 | baixa | Les RPC del xat tornen l'`usuari_id` de qui escriu en nom d'una entitat | `supabase/migrations/2609272200_xat_entitats.sql:361` | Emmascarar `usuari_id` quan `com_org_id` no és nul i qui llig no gestiona l'entitat, i revocar el SELECT directe de la columna. |
| B30 | baixa | La làpida (`esborrat_al`) no amaga el text a les lectures, a la previsualització ni al SELECT directe | `supabase/migrations/2609272200_xat_entitats.sql:364` | Buidar el text a la font (trigger o columna filtrada) i excloure les làpides d'`ultim_text`. |
| B31 | baixa | El títol del fil d'un contingut sense títol el fixa per sempre el primer que l'obri amb `?titol=` | `supabase/migrations/2609282100_xat_de_pagina.sql:326` | Derivar el títol al servidor (o una etiqueta i18n fixa) i traure `titol` de `?sobre=`. |
| B32 | baixa | Una publicació esborrada continua visible al xat per als participants | `supabase/migrations/2609282100_xat_de_pagina.sql:568` | Comprovar a `xat_participant_vigent` que el subjecte existix (publicació, producte, esdeveniment i multimèdia) o un trigger AFTER DELETE que tanque el fil. |
| B33 | baixa | `EnllacSegur` no avisa de l'engany amb usuari dins de l'URL | `src/sections/xat/enllacos.js:43` | Marcar sospitós l'enllaç que porta `url.username` o `url.password` i mostrar sempre el host real. |
| B34 | baixa | La fila d'ajuda «IAIA MarIA» es presenta com un contacte privat però porta al xat públic de `/iaia` | `src/data/xatsPerDefecte.js:114` | Pintar-la com a grup públic amb «Xat públic»; demanar confirmació en el primer enviament és decisió del Mestre. |
| B35 | baixa | `?amb=<uuid>` crea un DM persistent sense confirmació i registra qui obri l'enllaç | `src/sections/xat/XatSection.jsx:396` | Obrir una conversa en esborrany i cridar `crea_fil_directe` només en el primer enviament, o amagar el fil a l'altra persona mentre `ultim_seq` siga 0. |
| B36 | baixa | `xat_fils_meus` crida `xat_participant_vigent` per a cada participant a cada sondeig (cost quadràtic) | `supabase/migrations/2609282100_xat_de_pagina.sql:632` | No cridar-la dins del `min()` dels fils de pàgina; tornar 0 seria un canvi visual que necessita ordre del Mestre. |
| B37 | baixa | `xat_subjecte` compara per `id::text` sense usar la clau primària i `obri_fil_de_pagina` bloqueja files de gestors | `supabase/migrations/2609282100_xat_de_pagina.sql:180` | Comparar per uuid, camí ràpid sense lock quan els fils existixen i upsert de gestors amb DO NOTHING més un UPDATE filtrat. |
| B38 | baixa | `xat_llig_fil_de_pagina` ordena per un CASE amb «nulls last» i llig tot l'historial del fil | `supabase/migrations/2609282100_xat_de_pagina.sql:460` | Dues branques amb IF: `order by m.seq desc limit` sense cursor i ordre ascendent amb `p_despres_de_seq`. |
| B39 | baixa | Un gestor degradat a membre perd per sempre la comunitat i els Avisos de l'entitat | `supabase/migrations/2609282100_xat_de_pagina.sql:505` | A `xat_entra_al_fil_de_pagina`, `ON CONFLICT DO UPDATE` que anul·le `com_org_id` i pose `rol = 'membre'` quan ja no és vigent. |
| B40 | baixa | Enviar amb el JWT caducat durant la renovació deixa la bombolla en error amb «Cal iniciar sessió…» | `src/data/supabase/xat.js:286` | Esperar la renovació en curs (o cridar `asseguraUsuari`) quan l'estat és 'dins' o 'comprovant'. |
| B41 | baixa | Un gestor de Sóc de Poble que prem «Comentar → En privat» rep el toast cru SDP-XAT-002 | `src/components/PedraSeca/hooks/useAccions.js:332` | Desactivar «En privat» amb un text que ho explique, o portar el gestor a la safata de l'entitat. |
| B42 | baixa | Els errors del servidor i de l'adaptador es mostren crus i en valencià en totes les llengües | `src/sections/xat/components/Bombolla.jsx:193` | Associar cada codi d'error a una clau i18n en les 5 llengües i no pintar mai `error.message`. |
| B43 | baixa | En mòbil horitzontal la conversa no ocupa tota la pantalla (uns 117 px útils) ni respecta la safe-area lateral | `src/sections/xat/XatSection.jsx:1183` | Mode immersiu també en compacte amb alçada baixa i padding de safe-area lateral; el Mestre decidix si «mòbil» es definix per amplada o per dispositiu. |
| B44 | baixa | Render car: cada tecla repinta totes les bombolles i cada marca recrea l'array i l'IntersectionObserver | `src/sections/xat/components/Bombolla.jsx:90` | `React.memo` a Bombolla i SeparadorDia, cache dels formatadors Intl, memo per fil i un IntersectionObserver persistent. |
| B45 | baixa | El compositor de 6 línies tapa l'últim missatge i no apareix «Baixa al final» | `src/sections/xat/components/Conversa.jsx:235` | Un ResizeObserver sobre la llista que torne `scrollTop` al fons quan la persona hi era. |
| B46 | baixa | Amb teclat, cada bombolla afig una parada de Tab («⋯») i el focus no va al compositor en obrir una conversa | `src/sections/xat/components/Bombolla.jsx:205` | Enfocar el compositor en obrir una conversa (ample i mitjà) i roving tabindex entre missatges. |
| B47 | baixa | El menú «⋯» de l'últim missatge s'obri cap avall, fora de la llista, i el focus fa saltar la vista | `src/sections/xat/components/Bombolla.jsx:106` | Obrir-lo cap amunt quan no cap per baix i enfocar amb `preventScroll: true`. |
| B48 | baixa | `obri_fil_de_pagina` i les RPC de visitant no tenen cap prova de comportament | `tests/migracio-xat-de-pagina.test.mjs:1` | Fixture `tests/fixtures/xat-de-pagina/regression.sql` (begin/rollback) amb els casos crítics, connectada a una porta. |
| B49 | baixa | El requisit «conversa a tota la pantalla en mòbil» i la fitxa de comunitat no tenen prova d'integració | `src/sections/xat/XatSection.jsx:1045` | Prova amb amplada 375 i un `ProveidorModeImmersiu` espia (conversa: 1 petició; llista, panell o 1280 px: cap). |
| B50 | baixa | La prova «no marca llegit en el scope següent» no espera l'agrupador de 2 s | `src/sections/xat/XatContext.test.jsx:128` | `vi.useFakeTimers()`, avançar 2.000 ms després d'`old.marcaVist` i comprovar que `marcaLlegit` no s'ha cridat. |

### Troballes refutades

- **Dues subscripcions al mateix fil compartirien el canal** (`XatContext.jsx`). Refutada: els fets sobre realtime-js són certs, però en remot `subscribeToXat` es resol dins de la mateixa cua de microtasques i l'encavalcament no es pot produir. Un escèptic hi veu una troballa germana real, però el text arriba truncat (vegeu Límits).
- **`membres_del_poble` recorreria tots els fils directes per a cada veí** (`2609291210`). Refutada: la troballa llig les subconsultes SQL niades com si foren bucles, i el pla real fa servir índexs.
- **El focus cauria a `<body>` en obrir o tancar una conversa en estret** (`AppGridShell.jsx`). Refutada: la guarda global de ruta torna a col·locar el focus.
- **Un missatge es marcaria com a llegit amb un sol píxel visible** (`Conversa.jsx`). Refutada: amb `threshold` 0,5, `isIntersecting` depén del llindar i això no passa.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Mètode

1. **Cacera per dimensions.** Set caçadors independents, un per dimensió: cicle de vida, seguretat, SQL, dades, fluïdesa, sessió i proves. Van produir 88 troballes brutes.
2. **Deduplicació.** Agrupació per fitxer i línia propera: 88 brutes → 71 úniques (numerades internament de 0 a 70; esta numeració no coincidix amb els identificadors B).
3. **Refutació independent.** Cada troballa es va donar a escèptics que no l'havien produïda, amb dues lents: traça de codi i reproducció de l'escenari. Les troballes 0-34 van tindre dos escèptics (traça i reproducció). Les 35-70 (36 troballes) només en van tindre un (traça), perquè la sessió va tocar el límit a les 13:10 i la represa de les 13:28 només va executar la lent de traça. Resultat: 67 vives (confirmades o plausibles) i 4 refutades.
4. **Síntesi per causa.** Les 67 vives s'agrupen per causa en 50 defectes: 1 alt, 14 mitjans i 35 baixos; 9 bloquegen la beta. Quan els escèptics discrepen en la severitat, la síntesi aplica la més baixa raonable i ho justifica a l'estat de cada defecte.
5. **Per què dues fases.** Les auditories fetes per agents en este repositori tenen un historial d'uns 27% de falsos positius; per això la cacera i la refutació van separades i cap troballa entra a l'informe sense almenys un escèptic. El workflow va emprar 114 agents en total.

### Proves executades

La font del workflow no conserva el resultat de l'execució del caçador de proves sobre `src/sections/xat` i les proves de dades del xat: el fitxer de resultat només guarda la síntesi i els veredictes dels escèptics. Les execucions que sí que hi consten són les dels escèptics:

- `npx vitest run src/sections/xat/XatContext.test.jsx`: 65/65 en verd (dos escèptics, en B16 i B18).
- `sessionService.persistencia.test.js` i `XatContext.ambit.test.jsx` amb `npx vitest run`: 15/15 en verd (B10).
- `enllacos.test.js` i `EnllacSegur.test.jsx` amb `npx vitest run`: 6/6 en verd (B33).
- `npx vitest run src/sections/xat/XatSection.test.jsx`: 111/111 en verd (B34).
- `npx vitest run src/data/supabase/xat.pagina.test.js`: passen les 11 proves (B21).
- Diversos escèptics no van poder executar vitest perquè el hook local (`hooks-local`) bloquejava l'ordre (per exemple, en B16, B19 i B50); en eixos casos l'anàlisi es basa en la lectura del codi.

Una suite en verd no desmentix cap defecte d'este informe. Diverses proves fixen precisament el comportament defectuós: `XatContext.test.jsx:1166-1174` fixa status 'ready' mentre la sessió es comprova (B16), `sessionService.persistencia.test.js:111-127` fixa el tancament de pestanya per error de xarxa (B10), `XatContext.test.jsx:1266-1285` certifica la lectura descartada (B25), `XatContext.test.jsx:1363-1370` documenta el reinici del sondeig (B19) i `tests/migracio-xat-de-pagina.test.mjs:153-154` només exigix que la capçalera avise de la falta de moderació (B01).

La redacció d'este informe no ha tornat a executar cap prova: en esta fase la shell estava restringida a `document.mjs check` i a lectures literals.

### Abast i frontera d'efectes

L'auditoria és estàtica: codi del client i migracions SQL del repositori, sobre l'arbre de treball de la branca `backup-notes-publish` amb canvis sense commitejar (un escèptic cita HEAD `28c335e4`). No s'ha tocat cap base de dades, ni local ni de producció, ni cap servei remot, i no s'ha modificat cap fitxer de codi. L'únic fitxer escrit és este informe.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Angles no coberts

- **Estat real de producció:** no s'ha comprovat quines migracions hi ha aplicades (2610042330, 2609291230 de Realtime, 2610042350…) ni si el pg_cron de purga és actiu. El README està desfasat i la regla prohibix consultar la base remota. Afecta B06 i B12.
- **Execució real de SQL:** no s'ha executat cap RPC, política RLS ni EXPLAIN contra Postgres. Les anàlisis del planificador (B36-B38) i dels permisos s'han fet llegint el codi.
- **Dispositius reals:** el teclat virtual, l'orientació horitzontal, l'IntersectionObserver amb bombolles altes i el rendiment en gamma baixa s'han deduït del codi. El navegador integrat no va carregar, i el hook local va bloquejar vitest a alguns escèptics.
- **Supabase Realtime al servidor:** no s'ha verificat la resposta a un join privat denegat ni el cicle del canal privat després de renovar el JWT (`src/data/supabase/config.js:50`, `setAuth`).
- **Mode incrustat (WordPress/Sollutia):** MemoryRouter, viewport i franja de l'amfitrió, gest enrere i pas de sessió només s'han tocat de passada (B14, B15).
- **Mòduls sense troballa ni revisió declarada:** `paginaDestacada.js`, `pobleAmfitrio.js`/`usePobleAmfitrio.js`, `ajustosXat.js` i FullAjustos, `multimediaXat.js`/VistaMultimedia (F0 només envia text), `retall.js`, VistaComunitats/FitxaComunitat/EntradaDelPoble (parcialment), XatControlSection i `cercaXat.js`/`useCercaGlobal` (només citats).
- **Paritat del mode llavor** (`src/data/xatSeed.js`, `localXat.js`) amb el remot: només s'ha constatat una divergència (B24).
- **Aïllament entre pobles i lectura directa de taules per PostgREST:** cobert parcialment (B29, B30). No hi ha cap prova creuada entre dos pobles.
- **RGPD del xat:** l'exportació, la retenció i la caducitat (`caduca_al`) dels missatges no s'han auditat; la purga de baixes, només en part (B03, B12).
- **Requisit «llinatge» del Mestre:** no s'ha trobat cap codi aplicable. Al codi, «llinatge» només designa la cadena d'operacions asíncrones, i no s'ha pogut auditar què ha de protegir el requisit.
- **Abús i spam:** només existix el límit global de 15 missatges cada 5 s. No s'ha auditat cap límit per destinatari ni per a la creació massiva de DMs amb `crea_fil_directe`.
- **Accessibilitat amb lector de pantalla** (aria-live dels missatges nous, ordre de lectura): només s'ha revisat la navegació amb teclat (B46).
- **i18n:** només s'ha revisat el camí dels errors (B42).
- **Notificacions fora de la pestanya (push):** no existixen; només s'ha auditat el toast intern (B26).
- **Troballa germana perduda:** la citada a la refutació de les subscripcions duplicades arriba truncada i no s'ha tornat a buscar.

### Estat de producció no verificable des del repositori

Segons el Mestre, 2609282100 (`obri_fil_de_pagina`) està aplicada a producció. L'estat de 2610042330 (`/iaia`) és desconegut i és justament el que decidix B06; `supabase/README.md` no servix per a resoldre-ho, perquè també dona 2609282100 per no aplicada. Tampoc no es coneix l'estat de 2609291230 (Realtime), de 2610042350 ni del pg_cron de purga (B12). Cap d'estes comprovacions es pot fer des del repositori: requerixen una consulta en lectura al node, que és decisió del Mestre.

### Profunditat desigual de la refutació

Les troballes 35-70 de la numeració interna només tenen un escèptic (lent de traça), sense la lent de reproducció. A la síntesi, els defectes que descansen completament sobre un sol escèptic són B09, B13, B14, B15, B17, B24, B25, B35, B40, B41, B42, B43, B44, B45, B46, B47, B49 i B50; altres (B05, B07, B10, B16, B18, B20, B21, B22 i B48) en tenen alguna subtroballa amb un sol escèptic. B09 és bloquejant amb una sola verificació: convé reproduir-lo abans de corregir-lo.

### Sense proves en navegador ni amb sessió real

No hi havia cap Supabase local actiu i el navegador integrat no va carregar, de manera que no s'ha provat cap flux en el navegador amb una sessió real. Tots els escenaris de cicle de vida (B04, B05, B09, B13-B16, B43, B45-B47) es deduïxen de la traça del codi i, quan consta, de les proves unitàries.

### Retroalimentació sobre la plantilla prompt_local

En resposta al §6.4 del prompt `261008_1201_prompt_claude.md`, millores concretes per a la plantilla `prompt_local.md`:

1. **El Preflight arriba buit.** La secció `prompt.local.s0` («0. Preflight») es va lliurar amb el marcador de pendent: l'agent no rep la comprovació prèvia (porta Olivera, torn, fitxers a llegir). Proposta: que `document.mjs check` no valide un prompt amb el Preflight sense completar, o que `create` l'òmpliga amb les ordres del torn.
2. **Material de referència en una ubicació invisible.** La tasca 1 diu que les captures de referència són «als artefactes», un espai que les IAs locals no veuen. Segons AGENTS §16, el material aportat pel Mestre ha de viure a `_wiki_de_poble/04_escriptori/01_produccio/` i els encàrrecs han d'apuntar a la ubicació física. Proposta: un camp «Material de referència» amb rutes des de l'arrel.
3. **Edició posterior sense versió.** El fitxer del prompt es va modificar a les 13:03 (hora local), després d'obrir el torn, però el Registre manté «Versió del document» 1.0.0 i «Modificació» 2026-10-08T10:01:29.875Z, i l'Historial no té cap línia nova. Proposta: que tota edició pose una versió nova i una línia d'Historial, i que el hook ho exigisca.
4. **Aprovació pendent amb ordres executables.** El Registre diu «Aprovació humana: pendent», però el cos dona ordres d'execució («Actua amb determinació») i el punt 3 del protocol diu que no s'executarà cap canvi en codi crític fins que el Pla estiga estabilitzat. Proposta: un estat d'aprovació explícit i, mentre siga pendent, que el prompt delimite què es pot executar i què és només lectura.
5. **Estat de desplegament sense identificadors.** La tasca 4 diu que s'ha aplicat a producció «la migració de `obri_fil_de_pagina`», però n'hi ha dues de rellevants (2609282100 i 2610042330), i eixa ambigüitat és l'origen de B06. Proposta: una secció «Estat de desplegament» amb els identificadors de migració aplicats i la data de la comprovació.
6. **Cinc encàrrecs, una sola eixida.** El prompt barreja l'auditoria del xat amb l'editor de perfil, Notes Personals, organitzacions i les botigues d'apps, però el protocol d'eixida només preveu un fitxer `AAMMDD_HHMM_auditoria_[nom_ia].md`. Proposta: un prompt per encàrrec, o una eixida declarada per tasca.
7. **Rutes incompletes.** El Context Tècnic demana llegir `taxonomia_documental.md` sense ruta, i la Instrucció del torn enllaça el pla amb un wikilink que porta l'extensió `.md`. Proposta: rutes completes des de l'arrel (AGENTS §3) i wikilinks sense extensió.
8. **Camps de l'executor al Registre de l'emissor.** El prompt deixa «Model IA» i «Tokens consumits» pendents, però són dades de qui executa. Proposta: moure-les a l'informe d'eixida i traure-les del Registre del prompt.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
