---
type: informe
status: esborrany
description: 'Relleu viu i informe final de Claude sobre l''Onada 6: calendari, pobles, xat, gestoria, plugins, consola i higiene, amb proves i límits.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fc4dc922-009d-4467-bf09-0627d401aa7a:77dde804-6e3d-4138-8aef-7be0bc5d52c4
---
# Auditoria i relleu de Claude · Onada 6

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fc4dc922-009d-4467-bf09-0627d401aa7a:77dde804-6e3d-4138-8aef-7be0bc5d52c4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T01:09:58.512Z |
| Modificació | 2026-10-09T05:36:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador amb workflows de subagents |
| Tokens consumits | ~20 M: 19,4 M de 42 subagents en tres workflows (comprensió 2,8 M, implementació 13,8 M, integració 2,7 M) més l'orquestrador |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-09T01:09:58.512Z: esborrany creat; contingut i verificació pendents.

2026-10-09T01:13Z (03:13) · Relleu 1. Claude arrenca l'Onada 6 amb el torn `torn_fc4dc922`. Llegits el prompt `261009_0230_prompt_claude_onada6`, el pla `261009_0245_pla_implementacio_onada6`, el pla `261008_2345_pla_implementacio_onada5` (tasques futures 8-18) i l'acta `261008_2300_acta_marmota`. En marxa: set lectors en paral·lel (calendari, pobles, xat, gestoria, plugins, consola, neteja) que tornen el mapa de l'estat i dels buits de cada front.

2026-10-09T01:45Z (03:45) · Relleu 2. Han arribat els set mapes i la crítica de completesa (8 agents, 846 lectures). Decisions per defecte escrites a «Troballes». En marxa: nou fronts d'implementació en paral·lel (calendari, pobles, xat, gestoria-històric, gestoria-cofre, gestoria-facturació, plugins, consola i laboratori d'higiene). Cada front passa per implementació, revisió adversarial i correcció.

2026-10-09T04:15Z (06:15) · Relleu 3. Els nou fronts han acabat (27 agents). Resultats a «Troballes · Fronts». Els dos laboratoris nous estan ancorats a l'índex de l'Escriptori, i la porta Olivera ix en verd. En marxa la integració entre fronts, la bateria completa de proves i la QA visual.

2026-10-09T05:30Z (07:30) · Relleu 4. La integració està acabada (7 agents), i també la revisió de seguretat, la bateria i la QA visual.
- L'orquestrador ha revertit un bloc sense consumidor que va quedar a `src/config/capaDelPaquet.js`, i el fitxer torna a ser idèntic a HEAD.
- Ha aplicat tres proteccions de privacitat: `translate="no"` a les apps amb dades personals i a la còpia d'impressió de la factura; corrector ortogràfic apagat als camps de dades personals; i l'Històric que no llig cap extracte amb el cofre bloquejat.
- Gestoria, plataforma i tractors: 157 fitxers i 3.599 proves en verd. Comprovació visual final de cinc pantalles, sense cap error a la consola.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Condicions de treball d'esta nit

- El hook `hooks-local.mjs` només deixa a Bash lectures elementals (`ls`, `cat`, `rg`...), `npx vitest run RUTES` i `node --test tests/...`. No hi ha `rm`, `git commit`, `npm run build` ni `eslint`.
- Escriure a `.agents/`, `tooling/`, `scripts/`, `.claude/`, `.github/`, `.husky/`, `AGENTS.md`, `CLAUDE.md` o `package.json` exigix `executor-mutacio.mjs` amb una lease del Reflex que només pot obrir el Mestre. Les peces de governança d'esta Onada (skill de l'Escriptori net, cron, ESTAT i LEDGER) es lliuren com a paquet de laboratori a `02_investigacio_ia/`, llestes per aplicar.
- Cap esborrat és possible amb les eines d'esta sessió: la neteja es lliura com a inventari verificat i pla d'execució.
- L'arbre conté el treball de l'Onada 5 sense commit; és la base d'esta Onada i no es toca fora dels fronts.

### Decisions per defecte d'esta nit (reversibles)

El prompt demana treballar sense interrupcions. On el requisit admetia dues lectures, s'ha triat la més conservadora i s'anota ací perquè el Mestre la puga girar.

1. **Calendari.** Un sol component (`CalendariDelPoble`) per a `/calendari` i per a la pestanya Calendari del Mur. Clic a l'esdeveniment → pàgina de la publicació (tasca 16 de l'Onada 5), a les vistes Mes, Setmana i Agenda, només amb ratolí: en pantalla tàctil els xips fan 24 px i Pedra Seca §6 exigix 44 px, de manera que el toc tria el dia i les targetes de davall obrin la publicació. El títol del mes va a la mateixa fila que «Hui ‹ ›». El «botó Agenda» és l'etiqueta «Agenda» de la targeta i del detall d'un acte, i porta al dia exacte. La pastilla de data continua portant al mes (ordre 261001).
2. **Pobles.** Pestanya centrada «Gent de X» amb les targetes del poble, casades per dades (`poble_id` o el nom del poble convertit en slug), sense cap nom escrit al codi. Les publicacions noves porten `poble_id`, i el mapejador deixa d'escriure «La Torre de les Maçanes» per defecte a les dades (la reserva de pintura es queda: Llei del Píxel). El xat del poble es diu «Gent de X» al client. La prova T63.2 s'inverteix per l'ítem 4 del pla de l'Onada 6.
3. **Cronologia.** La pastilla d'un poble diu el seu naixement: el més antic entre la data de la fitxa i la primera publicació coneguda del poble. La regla T40 de les targetes normals no es toca: la data que tria l'autoria es llig com la seua data de creació declarada. Queda com a pregunta.
4. **IAIA.** El xat es diu «IAIA MarIA» per presentació al client, sense migració. Avatar: retall de la cara de «Festa del Poble» per CSS, perquè `sips` està bloquejat; l'ordre exacta per fer-ne un fitxer real va a «Límits». Amb nivell d'IA 0 desapareix de la llista, de la cerca, dels no llegits, dels avisos, de «Nova conversa» i del xat de mostra.
5. **Feedback de la beta.** Botó «Informa d'un error» que obri el xat de la comunitat de Sóc de Poble, on els gestors ja hi són, amb una plantilla i dades tècniques no sensibles. No cal migració ni que el Mestre cree res.
6. **Gestoria.** Tractor nou `gestoria.historic` amb fitxers nous, per no tocar cap font signada dels tres tractors actuals. Cofre xifrat amb WebCrypto (PBKDF2-SHA-256 de 600.000 iteracions, AES-KW i AES-GCM-256, codi de recuperació, autobloqueig). Simulació del 303, el 130, el 390 i la renda, amb paràmetres editables marcats «[NO VERIFICAT]». Llibre XLSX de diverses fulles per a la gestora. Factura imprimible. Cap migració ni xarxa.
7. **Plugins.** Contracte `sdp.modul.v1` (mòdul del mateix origen amb `integrity`, `SocDePoble.nucli` versionat), guarda financera com la de salut i ADR. No es lleva el pany DEV de la Gestoria ni es mou el seu CSS abans de dilluns.
8. **Consola.** Semàfor verd, taronja i roig. Informació visible a les targetes, que continuen clicables (ordre 261004). Avisos honestos, sense fabricar cap verd. Botons de l'Inventari. Les correccions de governança per arribar a 0 avisos van en un paquet de laboratori.
9. **Neteja, cron i motor de l'Escriptori.** Tot és governança. Es lliura com a paquet de laboratori construït sobre els fitxers instal·lats, amb l'inventari de brossa verificat i les ordres exactes.
10. **Migracions.** Esta nit no se n'escriu cap. Les propostes SQL van a esta auditoria.

### Fronts

Cada front ha passat per implementació, revisió adversarial i correcció: 27 agents. Les proves citades són les de l'última passada de cada front. Els informes sencers, amb fitxer:línia, són al registre del workflow `wf_7eb3d741-54d`.

**Calendari (punt 1).**
- Un sol calendari, `src/sections/calendari/CalendariDelPoble.jsx`, que munten `/calendari` i la pestanya Calendari del Mur (`src/sections/mur/CalendariDelMur.jsx`, només actes, obertura al mes del pròxim acte).
- Clic a l'esdeveniment → la publicació, a les vistes Mes, Setmana i Agenda.
- En tàctil, a Mes i Setmana el toc tria el dia i les targetes de davall. A l'Agenda les files fan 48 px i el toc obri la publicació.
- Clic al dia → `?date=` i les targetes del dia davall. El títol del mes va a la fila de «Hui ‹ ›» i hui ix en el cercle d'acció.
- L'etiqueta «Agenda» d'un acte porta al dia exacte (`rutaCalendariDeLaData`).
- Proves: 3.676 vitest en verd (una aliena, que passa sola) i 57/57 de les portes de node del calendari.
- Pendent: esborrar `src/sections/mur/CalendariMur.jsx` i la seua prova, que no tenen importador; ratificar l'excepció «enllaç només amb ratolí» de Pedra Seca §6; textos del calendari fora d'i18n.

**Pobles (ítems 4, 5 i 15; punt 6).**
- Clau per dades (`clauDelPoble.js`, `publicacionsDelPoble.js`) sense cap nom de poble escrit al codi. Un poble inventat a la prova funciona sense tocar codi.
- Pestanyes centrades amb «Gent de X» i les targetes del poble, en un panell diferit amb barrera d'error.
- Les publicacions noves porten `poble_id`. El mapejador i `NotesContext` ja no escriuen «La Torre de les Maçanes» per defecte, i les entitats publiquen amb el poble de l'organització.
- El xat del poble es diu «Gent de X» al client (`objecteDelPobleXat`). La prova T63.2 s'ha invertit.
- El naixement d'un poble només el mou una publicació que el declara amb `poble_id`. El text lliure està contaminat per l'antic valor per defecte, i amb ell la Torre hauria baixat a l'última posició.
- Proves: 3.406 vitest i 60/60 de node.

**Xat (punt 4 i tasca 12).**
- «IAIA MarIA» per presentació, a l'adaptador remot.
- Cara de la IAIA retallada per CSS amb la variant `enquadrament` d'Avatar.
- Amb el nivell d'IA a 0, la IAIA desapareix de la llista, la cerca, els no llegits, els avisos, «Nova conversa» i el xat de mostra.
- «Informa d'un error» al peu de la llista, també quan la llista falla o és buida. En remot obri el directe amb l'entitat Sóc de Poble, on hi ha owners i admins; en llavor, el grup «Beta testers». Porta un esborrany amb ruta, versió, navegador i pantalla, sense cap dada personal. Si la conversa no s'obri, l'informe es pot copiar o enviar per correu.
- Errors SDP-XAT-003, 013 i 429 en text humà.
- Proves: 2.310 vitest i 90/90 de node.

**Gestoria · Històric i IA (punt 5).**
- Vista `/app/gestoria/historic` amb tractor nou `gestoria.historic` (empremta B37F-BA95, 36 fonts, pendent de signatura).
- Classificació: setanta-set proveïdors de servei i 118 patrons.
- Sèrie per mes, trimestre i any, sense duplicats entre extractes, amb cobertura estricta (avís de forats) i traspassos probables.
- Indicadors de director financer: caixa, despesa mitjana, runway i % d'IA.
- Simulació del 303, el 130, el 390 i la renda, amb paràmetres editables marcats «[NO VERIFICAT]», inversió del subjecte passiu per a l'IA d'IE i de fora de la UE, i escenaris.
- Llibre XLSX de set fulles per a la gestora. Les xifres van amagades amb l'ull.
- Proves: 3.566 vitest.

**Gestoria · Cofre.**
- Cofre local amb WebCrypto: PBKDF2-SHA-256 de 600.000 iteracions, AES-KW, AES-GCM-256, codi de recuperació, rotació de la DEK, autobloqueig, còpia xifrada i context segur obligatori.
- 83 proves del cofre.
- Al tancament dels fronts no estava endollat a cap vista: la integració ho fa.

**Gestoria · Facturació.**
- Factura imprimible amb les mencions del RD 1619/2012.
- QR propi, llegit per un decodificador dins de la prova, amb un avís al paper que encara no es remet a l'AEAT.
- Retenció d'IRPF i rectificatives R1-R5, amb una guarda contra barrejar clients.
- XML de prova dels registres, que no s'envia.

**Plugins (punt 5).**
- Contracte `sdp.modul.v1`: origen «modul», `registraModul`, `lliuraCos`, `SocDePoble.nucli` 1.0.0 i un carregador amb `integrity` del mateix origen.
- Guarda financera: la Gestoria mai s'obri dins d'un amfitrió tercer.
- Els ids `gestoria` i `salut` queden reservats.
- Guardes de build i de text. Una prova compila en memòria la Gestoria sencera.
- `vite.modul.config.js`: l'ordre CLI no està verificada.
- Pressupost de pes i ADR-2026-12 a `_wiki_de_poble/02_saber/architecture/`.
- Proves: 1.355 vitest, 33/33 i 31/31 de node.
- **Alerta:** el tros d'entrada mesurat a les 04:56 fa 1.626.651 B i el sostre és de 1.591.855 B. El pròxim build posarà en roig `pesDelNucli.test.js` fins que el Mestre decidisca.

**Consola (ítems 8-11).**
- Semàfor verd, taronja i roig a totes les xifres, panells i peces, amb els problemes a la vista i la marca de color.
- Compilador honest:
  - una porta sense res comprovat dona N/A, mai verd;
  - un avís `frontissa-roja` per error;
  - el nom d'un hook ja no compta com a crida inexistent;
  - `fora-cataleg-claude` passa a severitat baixa.
- Inventari per gravetat, amb filtres i accions per fila (veure al graf, editor, copiar la ruta i copiar l'ordre de reparació).
- Mapa viu: 36 avisos. El paquet de governança `261009_0400_consola_claude` els du a 3.
- Proves: 1.014 vitest.

**Laboratori d'higiene (punts 2 i 3).**
- Porta Olivera v4, «convocatòria». Vigila:
  - les àncores repetides;
  - que cada viu tinga motiu i un consumidor viu;
  - la trinitat;
  - la secció 0 i el pla complet;
  - el sediment de l'índex.
  Comença en fase avís i després bloqueja.
- Tancament amb la porta. El despertar mostra l'informe i ja reconeix la data de l'ESTAT.
- `cron_higiene.mjs` L0/L1/L2: mai esborra ZIP ni toca entrades amb punt o versionades. Plist a les 05:30.
- Plaquetes sense receptes duplicades, tres skills i `INVENTARI_BROSSA.txt` amb les ordres exactes.
- Proves: corredor amb 41 en verd i 1 skip. La diagnosi de la taula real dona CONV-01 (l'àncora del pla de l'Onada 6 està repetida).

### Integració

Workflow `wf_b3940841-632`, amb 7 agents.

**Cofre i Històric.**
- Tota la vista «Històric i IA» va darrere de `PortaCofre`, amb una sola instància del cofre per pàgina (`cofreDeLaGestoria()`).
- S'hi desen xifrats les regles, les reclassificacions, els paràmetres, les suposicions i l'escenari. Els moviments del banc no es desen mai: es tornen a llegir dels N43.
- En bloquejar-se (botó, 10 minuts d'inactivitat, 5 minuts amb la pestanya amagada, eixida de la pàgina o de la vista) s'oblida tot el que és a la pantalla.
- El tractor `gestoria.historic` inclou ara les fonts del cofre: empremta C0CF-3116, 42 fonts. Els retocs de privacitat de l'orquestrador l'han tornada a moure. **El Mestre signa la que mostre el panell.**
- Les factures emeses a la simulació **no** s'han fet. Una guarda vigent (`facturacio/frontera.test.js`, ordre del 261007) diu que el llibre només l'endolla la pantalla de Facturació. A més, una regla fiscal mal feta donaria en silenci un 303 erroni. La regla proposada és a «Per al Mestre».

**Guarda financera.**
- La guarda és correcta i el producte també: `main.jsx` declara el document propi.
- Les 5 proves roges no venien del producte: el seu muntatge simulava un amfitrió. S'han adaptat i s'hi ha afegit una prova nova que fixa que la Gestoria no s'obri dins d'un amfitrió.
- Verificat al navegador: `/app/gestoria` (Tauler), `/historic` i `/facturacio` s'obrin a localhost; dins d'un iframe ix l'avís financer.

**Xat i Pobles.**
- El xat mostra «Gent de X» a la llista, a la capçalera («Sobre: Gent de la Torre») i a l'avís del compositor, també quan el fil ve del servidor amb el nom del poble.
- No hi ha cap nom de poble al codi. Les proves es fan amb un poble inventat, «l'Olivera Inventada».

**Revisió de seguretat.**
- La criptografia del cofre no té cap defecte, i no hi ha cap petició de xarxa ni cap dada al DOM després del bloqueig.
- Troballes aplicades per l'orquestrador: traducció del navegador vetada a les apps amb dades personals i a la còpia d'impressió; corrector apagat als camps del perfil fiscal, del client, del concepte i de la regla; guarda a `llig()`.
- Troballa no aplicada, per decisió del Mestre: la guarda financera es fia de `manageDocumentHead`, que un amfitrió també pot declarar. Avui està latent, perquè la Gestoria només corre en desenvolupament. La correcció és un senyal intern del paquet a `main.jsx`. El classificador de permisos la va frenar, i l'orquestrador ha revertit el bloc a mitges.

**Bateria.**
- Sencera, `src` i `tests`: 15.512 proves en verd.
- Les 7 roges són dos corredors de laboratori del 261006 que comparen paquets ja aplicats amb bases congelades. És heretat.
- S'han migrat a `DetallAjust` dues proves rànties del Perfil, que importaven el `DialegCapcaleraAvatar` desaparegut. Tres regles d'aquell diàleg que ja no té cap codi han quedat escrites com a «regles que ja no existixen», sense fabricar-les en verd.
- Node, suite primària: 923 en verd. Les 9 roges tenen una causa heretada: `sdp-clon-loiverse` no té `triggers_on`.

**QA visual.**
- Totes les pantalles a 1280 i a 375 px: sense errors a la consola, sense scroll horitzontal i amb contrast ≥ 7,8:1 en els elements nous.
- Tres defectes corregits: les accions de l'Inventari, que quedaven fora de pantalla, ara són fixes a la dreta; el nom «Gent de la Torre» ja no es talla a la llista del xat; i la barra taronja sense emoticona ja no talla l'autoria en mòbil.

### Per al Mestre, en ordre

**Abans de dilluns (Gestoria):**
1. Obri `http://localhost:3340/app/gestoria/historic`, només per localhost i mai per la IP de la LAN.
2. Crea el cofre amb una frase de 4 o 5 paraules, apunta el codi de recuperació en paper i confirma'l.
3. Signa amb WebAuthn el tractor «Gestoria · Històric del banc i despesa en IA» a `/wikidepoble?categoria=tractors_cat&item=tractors_aprovacio`, amb l'empremta que mostre el panell.
4. Obri el cofre i tria tots els N43 de cada compte de l'1-1-2025 al 30-9-2026, sense forats. Si en falta algun, la pantalla dirà les dates del forat.
5. Fes «Descarrega la còpia xifrada» i guarda-la fora d'este ordinador.
6. Revisa amb la gestora els paràmetres fiscals «[NO VERIFICAT]» (escales, mínims, difícil justificació, ISP, 349 i ROI). Es poden editar tram a tram.
7. **No emetes factures reals encara**: el llibre Veri*Factu i el perfil fiscal continuen en clar a IndexedDB i no hi ha remissió a l'AEAT. Dilluns 12-10 és festiu, i el 303 i el 130 del 3T vencen el 20-10 [NO VERIFICAT].

**Abans d'obrir la beta del xat:**
- Executa les consultes de lectura al node de l'informe del front Xat: la capçalera de `2610090100`, `towns.is_open` del tenant, les polítiques de `realtime.messages`, l'organització `socdepoble` i els seus owners i admins.
- Fes la llista E2E de 9 passos amb dos comptes de prova.
- Decidix si cal moderació mínima als fils de pàgina.
- Opcional: la cara real de la IAIA. `sips --cropToHeightWidth 184 184 --cropOffset 712 312 public/assets/uploads/brain/xat_portada.jpg --out public/assets/uploads/brain/iaia_maria_cara.jpg`; després, `CARA_DE_LA_IAIA` a `src/data/xatsPerDefecte.js`.

**Abans del pròxim build:**
- El tros d'entrada fa 1.628.974 B i el sostre de `src/apps/plataforma/pesDelNucli.test.js` és d'1.591.855 B. O s'apuja el sostre amb el motiu escrit, o s'aprima el nucli (ADR-2026-12, pregunta 8).
- La guarda financera basada en un senyal intern del paquet (vegeu «Integració»).

**Esborrats (no hi ha `rm` en esta sessió):**
- `src/sections/mur/CalendariMur.jsx` i `CalendariMur.test.jsx` (sense importador).
- `src/sections/consola/mapa/MapaConsola.jsx.tmp` (0 B).
- `src/sections/gestoria/facturar/__fixtures__/idbFals.js` (substituït per `tests/helpers/idbFals.js`).
- La resta, amb les ordres exactes, a `02_investigacio_ia/261009_0400_higiene_claude/INVENTARI_BROSSA.txt`.

**Governança (lease del Mestre):**
- Paquet `261009_0400_higiene_claude`: motor de l'Escriptori net, tancament, despertar, cron d'higiene, Plaquetes, skills i `.gitignore`. Primer l'aprovació a la Wiki (`FLUX_APROVACIO.txt`), després `prepara-pla.mjs comprova` i l'executor, i al final instal·lar el plist.
- Paquet `261009_0400_consola_claude`: dels 36 avisos de la Consola als 3 (decisions D1-D5).
- `triggers_on` a `.agents/skills/sdp-clon-loiverse/SKILL.md` per a tornar a verd `backend_consolidacio`.
- Ratificar l'excepció «enllaç del calendari només amb ratolí» a Pedra Seca §6.
- Ratificar les ampliacions de guarda marcades «Onada 6, ordre del Mestre (261009)», i la de l'XML de l'AEAT a `privacitat.test.js`.

**Decisions obertes:**
- Si les factures emeses entren a la simulació, amb la regla anti-doble-compte de l'informe d'integració.
- T40, la data triada a la targeta.
- Naixement dels pobles per text lliure (ara només compta `poble_id`).
- El títol del xat del poble: «General» amb «Sobre: Gent de X», o «Gent de X» al títol.
- `/mur` recarregat amb `?vista`.
- i18n de la Gestoria i de la Consola.
- La pestanya del Mur sense actes futurs.

### Propostes SQL (no aplicades, per al Mestre)

Revisa abans els noms de columna al node. Cap agent n'ha aplicat cap.

A · El xat del poble es diu «Gent de X» al servidor. Recrea `private.xat_subjecte` copiant literalment la de `2610042330`, i canvia només la branca 'poble' d'app_content a `coalesce(e ->> 'author', e ->> 'name', e ->> 'title')`. Per als fils ja creats:

```sql
update public.xat_fils f set titol = e ->> 'author', subjecte_titol = e ->> 'author'
from public.app_content c
cross join lateral jsonb_array_elements(case when jsonb_typeof(c.payload) = 'array' then c.payload else '[]'::jsonb end) e
where c.tenant_id = f.tenant_id and c.key = 'towns' and f.subjecte_tipus = 'poble' and f.tipus = 'comunitat'
  and e ->> 'id' = f.subjecte_id and coalesce(e ->> 'author', '') <> '';
```

B · `created_at` el fixa el servidor. Atenció: una importació del llegat perdria les dates originals.

```sql
create or replace function private.section_submissions_creacio_del_servidor() returns trigger
language plpgsql set search_path = '' as $$ begin new.created_at := now(); new.updated_at := new.created_at; return new; end $$;
drop trigger if exists section_submissions_creacio_del_servidor on public.section_submissions;
create trigger section_submissions_creacio_del_servidor before insert on public.section_submissions
for each row execute function private.section_submissions_creacio_del_servidor();
```

C · Desambiguacions de la Viquipèdia al node:

```sql
update public.app_content c set payload = (
  select jsonb_agg(case e ->> 'id'
    when 'sella' then e || '{"wikipedia_title":"Sella (Marina Baixa)"}'::jsonb
    when 'relleu' then e || '{"wikipedia_title":"Relleu (municipi)"}'::jsonb
    else e end order by ord)
  from jsonb_array_elements(c.payload) with ordinality as x(e, ord))
where c.key = 'towns' and jsonb_typeof(c.payload) = 'array';
```

D (opcional, per al filtre per poble al servidor, amb ADR): `create index if not exists section_submissions_poble_id on public.section_submissions ((payload ->> 'poble_id'));`

### Relleu proposat per a l'ESTAT i el LEDGER (governança)

```markdown
## ESTAT_ACTUAL · 2026-10-09 07:40 · Claude · Onada 6 implementada sense commit
Onada 6 feta per Claude (torn torn_fc4dc922) sobre l'Onada 5 sense commit. Calendari únic (Mur i /calendari) amb clic a l'esdeveniment i al dia; pàgina del poble amb pestanyes «Gent de X» generalitzades per dades; xat amb IAIA MarIA (cara, nivell 0) i «Informa d'un error»; Gestoria amb Històric i IA, simulació 303/130/390/renda, llibre XLSX per a la gestora i cofre xifrat; factura imprimible amb QR propi; contracte de mòduls sdp.modul.v1 i guarda financera; Consola amb semàfors. Governança en dos laboratoris (higiene i consola) pendents de lease. Següent: signar gestoria.historic, decidir el sostre de pes, revisar i fer el commit. Informe: 04_escriptori/261009_0310_auditoria_claude.md.
```

```markdown
261009 | auditoria | claude | Onada 6: nou fronts i integració, 15.512 vitest verdes; dos laboratoris de governança pendents de lease
```

### Retroalimentació sobre la plantilla prompt_local

- La secció «0. Preflight» va arribar amb `[pendent]` i la porta la va deixar passar. Proposta: que `check` exigisca contingut, i el paquet d'higiene ja ho fa (CONV-04).
- El prompt remetia al pla de l'Onada 5 per a les tasques, i el pla de l'Onada 6 n'era una còpia amb pèrdues. Proposta: les tasques de l'Onada nova, senceres al seu pla, i el prompt que les cite (CONV-05 i la lliçó proposada a `wiki-documentacio-i-reflex`).
- Convé que la plantilla diga explícitament quines eines té l'agent (Bash confinat, sense `rm` ni `commit`, governança només amb lease). Així el prompt no demana esborrats ni un cron instal·lat que l'agent no pot fer, i l'agent planifica des del principi el lliurament en laboratori.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Passada final de l'orquestrador, 2026-10-09 07:30, després de tots els canvis:

- `npx vitest run src tests`: **937 fitxers i 15.527 proves en verd**, 3 fitxers i 33 proves saltats.
  - Les 7 roges són els corredors heretats `tests/laboratori-higiene-261006.test.js` (5) i `tests/laboratori-olivera-261006.test.js` (2), que comparen paquets ja aplicats amb bases congelades a HEAD.
  - Abans de l'Onada 6 també eren rojos, i el producte no hi té cap fallada.
- `npx vitest run src/sections/gestoria src/apps/gestoria src/apps/plataforma src/sections/tractors` (després de les proteccions de privacitat): 157 fitxers i 3.599 proves en verd.
- Node, suite primària (agent de bateria): 923 en verd. Les 9 roges són de `backend_consolidacio` (`sdp-clon-loiverse` sense `triggers_on`, heretat). Les portes del calendari, del xat, de contrast, de Pedra Seca, de disseny i de `standalone-build` ixen en verd.
- Navegador integrat, en una pestanya pròpia ja tancada: `/calendari`, `/pobles/la-torre-de-les-macanes`, `/xat`, `/consola` i `/app/gestoria/historic`, sense cap error a la consola. La Gestoria porta `translate="no"`, i el cofre no deixa veure res abans d'obrir-lo.
- `node tooling/gates/porta-olivera.mjs --informe`: verd, amb 5 documents declarats vius.
- `node tooling/wiki/document.mjs check` d'este informe i de l'acta `261009_0745_acta_marmota`: vàlids.

No verificat:
- l'ordre CLI `SDP_MODUL=gestoria npx vite build -c vite.modul.config.js`;
- la impressió real en paper o en PDF i la lectura del QR amb un mòbil;
- la prova E2E del xat contra el node remot;
- el comportament dins d'un WordPress real;
- `tooling/broker/broker.test.mjs` i `tooling/gates/tractor-psicopatia.test.mjs`: el hook només admet `node --test tests/...`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense lease, sense `rm` i sense `git commit`.**
  - Cap peça de governança està aplicada: la skill de l'Escriptori net, el cron, l'ESTAT, el LEDGER i els symlinks de `.claude/skills`. Són als dos laboratoris i a l'apartat de relleu d'este informe.
  - No s'ha esborrat res.
  - Tot el codi és a l'arbre perquè el Mestre el revise i en faça el commit, junt amb l'Onada 5, que tampoc en tenia.
- **Cron.** Està escrit i provat en laboratori, però no està instal·lat: cal la lease i `launchctl load`.
- **Pestanyes de proves.** Es tanquen en acabar: totes les havia obertes esta sessió, també la inicial.
- **Gestoria.**
  - Totes les xifres fiscals són «[NO VERIFICAT]» i cal revisar-les amb la gestora.
  - El llibre Veri*Factu i el perfil fiscal continuen en clar a IndexedDB: és la fase 2 del cofre.
  - No hi ha remissió a l'AEAT, ni SistemaInformatico, ni XAdES.
  - Les «15 skills CEO» que esmenta el prompt no existixen al repositori ni a `.agents/skills`. No s'ha pogut «activar» res: el panell s'ha fet amb criteri de director financer.
- **Calendari.**
  - L'enllaç de l'esdeveniment només funciona amb ratolí als xips de 20-24 px. És una excepció a Pedra Seca §6 pendent de ratificar.
  - Les captures de Google Calendar que citava P6 ja no són a `01_produccio`.
- **Xat.**
  - Els noms «IAIA MarIA» i «Gent de X» són de presentació al client. El servidor guarda el nom antic fins que s'aplique la proposta SQL A.
  - La cara de la IAIA és un retall per CSS, no un fitxer.
  - L'estat del node remot (poble obert, Realtime, organització `socdepoble`) no es pot comprovar des del repositori.
- **Plugins.**
  - El mòdul extern de la Gestoria no s'ha compilat fora de les proves.
  - El pes del nucli supera el sostre en el pròxim build.
- **Memòria de Claude.** El hook no deixa escriure fora del repositori, i per això els aprenentatges d'esta nit són en este informe i a l'acta, no a la memòria persistent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
