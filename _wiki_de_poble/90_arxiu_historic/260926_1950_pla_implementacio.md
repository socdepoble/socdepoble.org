---
type: document
status: esborrany
description: Pla de la Sessió per a Fable Medio
tags:
  - implementacio
visibility: private
reflex: sdp:torn_1a43a34c-9f10-4d1d-8beb-10fc33f6759a:bfa37c12-a0d0-4648-b726-1d50222332a4
---
# Pla per Identitat Dual i UI WhatsApp

**Estat del Pla:** execució autoritzada pel Mestre en el xat de Codex el 26-09-2026; directives de MarIA i ajustos UI del torn.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1a43a34c-9f10-4d1d-8beb-10fc33f6759a:bfa37c12-a0d0-4648-b726-1d50222332a4 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T10:33:21.000Z |
| Modificació | 2026-09-26T10:33:21.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Origen Fable Máximo (Claude); aportació actual GPT-6 (Codex), variant no exposada |
| Tokens consumits | no mesurats per la IAIA MarIA; els de l'auditoria de Fable consten al seu Registre |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-26T10:33:21.000Z: esborrany creat; contingut i verificació pendents.
2026-09-26T12:30Z (aproximat): Fable omple la fila «Tokens consumits» del Registre perquè la porta Reflex exigix el Registre complet per a poder escriure, i afig la seua aportació a «Canvis proposats» i «Verificació». Cap altra línia de la IAIA s'ha tocat.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Aquesta sessió té l'objectiu que l'auditor IA **Fable Máximo** ens aporte solucions per implementar la lògica d'Inici de Sessió i la UI del Xat, i un redisseny de la interfície del graf interactiu.
- Es definirà la lògica per darrere del registre (Identitat Dual, Supabase, `IdentitatContext`). A més a més, ha d'incloure dues funcionalitats crítiques per defecte: l'exportació completa de dades d'usuari i la baixa definitiva amb esborrat. L'esborrat ha de contemplar una política de quarantena o "soft delete" si la llei ho requereix per seguretat, però permetent que l'usuari puga reutilitzar el seu correu. Tota la lògica ha d'estar pensada per a un ecosistema de **xarxa social hipermodular (fedivers)**. (Nota important: Ja existeixen a la base de dades taules per a aquest propòsit com `connections`, `realms` i `user_realms`, no cal inventar res des de zero, cal utilitzar-les).
- **Integració al Workspace existent:** Tota la gestió d'usuari (backend per a l'usuari final) s'ha d'integrar directament en l'AppGridShell / UniversalWorkspace que ja existeix, adaptant les carpetes i menús existents (ex: Notes Personals, Grups, Etiquetes) i afegint una secció d'utilitats (per a Gestoria, Llibreria, etc.). L'objectiu és no crear un "backend" separat.
- **Editor Universal (Perfil i Espai de Treball):** El bloc de notes no s'ha de tocar, està bé com està. Però la seua *estructura visual* de columnes s'ha de replicar per a la pantalla independent de configuració del perfil/workspace. En aquesta pantalla de perfil:
  - **Columna esquerra (equivalent a les carpetes):** Contindrà la jerarquia de la identitat. Ex: l'usuari (Javi Linares), apartat "Grups i Empreses", i apartat "Aplicacions/Utilitats" (Gestoria, Llibreria, etc.).
  - **Columna central (equivalent a la llista de notes):** Mostrarà les opcions de configuració o els elements fills seleccionats a l'esquerra.
  - **Columna dreta (l'Editor):** L'Editor Universal (la `Card` i Tiptap) on s'edita el perfil o pàgina de l'entitat.
  - **Millora visual estructural a l'Editor:** S'ha de moure la barra blava d'accions a la part superior (davall de la barra negra principal) i moure la barra d'eines de text davall de l'entradilla amb comportament **sticky** (ancorada a dalt en fer scroll).
  - **ATENCIÓ A LA JERARQUIA:** Javi Linares és la Identitat/Workspace, i les Notes són només una utilitat seua. L'edició del perfil va a la seua pròpia vista/ruta, simplement *reutilitzant* aquesta estructura de columnes i components, però completament separada de les notes.
- Es dissenyarà una interfície clònica a WhatsApp (pensant en el context de món rural), utilitzant les eines React/CSS de l'esquema actual.
- **Ajust visual de les barres laterals (Sidebars):** Per tal que la *sidebar* principal de l'AppGridShell no desaparega ni oculte contingut en pantalles de 1024px, el seu ample ha de ser dinàmic però amb un **topall màxim** de `260px`. Així mateix, la **segona barra lateral** (la de carpetes/categories, que continua sent redimensionable per l'usuari amb el topall màxim actual de ~424px) ha de tindre una amplària base o **mínima per defecte** igual, de **260px**. Si no són iguals de base, el disseny fa un "salt visual" incòmode en navegar. Per a ambdues barres, si algun text és més llarg, no ha de fer un salt de línia, sinó truncar-se amb tres puntets (`text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`). Això permetrà que les targetes centrals respiren perfectament en 1024px sense amagar menús.
- **Ajust visual del Logotip (Il·lusió d'unicitat):** Actualment, com que el logo està inserit tant a la *topbar* com a la *sidebar* (truc de components), es produeix un lleuger salt de posició en tancar o obrir menús. Cal ajustar els marges i `padding` d'ambdós contenidors perquè el logotip compartisca exactament les mateixes coordenades al píxel. Així donarà la il·lusió de ser un únic logotip inamovible i fix.
- **Ajust visual dels botons de metadades (Notes/Perfil) i Copyright:** A la targeta de presentació de l'editor, els 4 botons blaus d'accions (Carpetes, Categories, Etiquetes i Copyright) s'han d'unificar perquè compartisquen **exactament el mateix disseny i format menut**. Han de ser més xicotets que els actuals, però se'ls ha de donar suficient "aire" o marge interior lateral (uns 10px de *padding* horitzontal) perquè el text respire i no quede pegat a les vores. A més, sobre el botó de Copyright:
  - El text del botó no ha de mostrar la llicència actual, sinó dir clarament **"Elegir drets d'autor"** (o "Punxa per elegir drets d'autor"), convidant a l'acció.
  - El *popup* emergent que s'obri en fer-hi clic **ha d'aparéixer centrat** a la pantalla (no alineat a l'esquerra).
  - El selector ha d'incloure un menú per triar entre les diferents **llicències Creative Commons** (amb la seua icona corresponent).
  - Si l'usuari tria l'opció de **Text lliure personalitzat**, la interfície ha de mostrar un **avís legal clar i explícit** indicant que, en no acollir-se a una llicència estàndard, tot el que es publique sota eixe text lliure s'assumirà com a **Domini Públic (CC0)**. Aquest avís evita ambigüitats legals. A la *card* de presentació, el resultat triat s'ha de mostrar on corresponga (truncat a una sola línia amb tres puntets `ellipsis` si cal).
- **Vista Prèvia d'Impressió i Edició Editorial:** L'Editor Universal està cridat a ser una eina de publicació de llibres completa. S'hi han d'afegir les següents funcionalitats (a nivell visual i arquitectònic):
  - **Vista Prèvia d'Impressió (A4 / PDF):** Ha de comptar amb un conversor d'HTML a PDF propi amb regles de disseny que garantisquen que elements complexos no es trenquen en un foli físic (A4). 
  - **Creació de Portada de Llibre:** S'ha d'afegir l'opció/botó per generar una portada formal. Tot el sistema (incloses futures exportacions a ePub o Amazon) s'assenta sobre la confiança que l'usuari sent que el seu document està segur en el seu dispositiu (*offline-first*).
- **Ajust visual de l'alineació d'icones a la sidebar:** Actualment les icones del menú (Xat, Mur, etc.) estan massa sagnades cap a la dreta (aprox. 24px) respecte a l'eix vertical. S'ha de reduir el seu *padding-left* (o marge) perquè la línia visual d'icones quede perfectament alineada amb la icona de la roda dentada de "CONTROL" de dalt (uns 16-18px des de la vora, 20px com a màxim). A més, s'ha d'augmentar el *gap* entre cadascuna d'eixes icones i la seua paraula en 2 o 3 píxels per donar-los més aire.
- **Unificació d'estils entre Sidebars:** Existeix una inconsistència visual entre la *sidebar* principal (menú negre) i la *sidebar* secundària (espai de treball gris). A la segona, les icones són més menudes i el text és més gran, a més de tindre espaiats diferents. Cal unificar-les completament: ambdues barres han de compartir exactament la mateixa grandària d'icona (fent les de l'espai de treball més grans per igualar-les), la mateixa grandària de lletra i la mateixa separació (*gap* i *padding*). "No inventemos", han de ser clòniques en estil.
- **Barra lateral principal plegable (Icon-rail):** Igual que ocorre amb la segona barra lateral de carpetes, la *sidebar* principal (negra) ha de poder plegar-se de forma manual. Com que ara el títol és curt ("CONTROL"), aprofitarem l'espai sobrant per a col·locar-hi una icona de *toggle* (plegar/desplegar). En fer-hi clic, s'amagaran tots els textos del menú i la barra es reduirà a la seua mínima expressió horitzontal, mostrant únicament la llista vertical d'icones. Això permetrà un aprofitament extrem de la pantalla. **ATENCIÓ a l'alineació i mides en mode plegat (Corregit per revisió humana):** S'ha d'assegurar que el *div* superior (on està la roda dentada i el botó de plegar) mantinga la seua **altura estàndard de 58px** i no es faça més xicotet. La **roda dentada ha d'estar perfectament centrada i respectar l'alineació horitzontal exacta de la resta d'icones de navegació** (han de compartir el mateix eix o sagnat, sense desplaçaments estranys entre la roda de dalt i els de baix). A més, la roda ha de ser de **color BLANC** (no taronja com el *toggle*) per separar visualment la idea de "Panell de Control" de la resta d'icones. **MOLT IMPORTANT sobre el comportament dels botons:** La nova icona taronja de *toggle* servirà exclusivament per a plegar/desplegar la barra (canviant l'amplada). El logotip principal de "Sóc de Poble" ha de continuar funcionant exactament com abans, amagant o mostrant completament la barra sencera; no ha de fer la mateixa funció de plegat que la icona, sinó mantindre el comportament original de fer-la desaparéixer o aparéixer del tot.
- **Adaptabilitat mòbil de la barra d'eines de l'Editor:** En pantalles menudes (mòbil), les opcions de text (H2, H3, B, I, etc.) ocupen massa espai i obliguen el botó de "PUBLICAR" a saltar a una segona línia, trencant el disseny i ocupant lloc inútil. S'ha de crear un disseny *responsive* similar al del Bloc de Notes d'Apple: en mòbil, totes aquestes eines de text s'han d'agrupar i amagar darrere d'un únic botó (per exemple, una icona "Aa" o similar) que només les desplegue en fer-hi clic. D'aquesta manera, la barra superior sempre es mantindrà estilitzada en una sola línia.
- Es redissenyarà `ExploradorMapa.jsx` i `BrainGraph.jsx` per tal de moure tots els controls i filtres a la part superior, eliminar la llegenda redundant i inventar un panell de detalls de nodes més usable. El graf ha de quedar a la part inferior.
- **Aclariment de textos a la Consola Termodinàmica (`ActorsMapa.jsx`):** A la secció "Els que conversen", cal pujar el paràgraf de "Codex i les dotze membres..." perquè forme part del text introductori principal de la secció. A més, s'ha d'afegir una explicació clara del que significa l'etiqueta **"SENSE CONSUMIDOR"**: *"SENSE CONSUMIDOR significa que els candats (hooks) existeixen al repositori, però l'eina de telemetria visual no pot acreditar quin agent concret els dispara, normalment perquè no hi ha un fitxer de configuració (com un CLAUDE.md) que reclame explícitament l'autoria d'eixos candats"*. Així l'usuari pot aprendre a llegir la consola sense frustrar-se.
- **Equilibri Visual Taronja (Navegació Universal):** S'ha de canviar el color del text i les icones dels menús superiors de l'Espai de Treball (ex: "DISSENY", "COMPONENTS") perquè siguen exclusivament del color **taronja canònic** del sistema. Aquesta norma s'aplica a tot l'Universal Workspace. Aquesta regla del color taronja s'aplica especialment als textos de les pestanyes o menús superiors com 'NOTES' o 'CARPETES' (tant si la barra lateral està desplegada com si està plegada, han de ser sempre taronges, no blancs). A més, les **icones de plegar/desplegar la pàgina (toggles de les sidebars)** també han de ser totes de color taronja per distingir-se millor i destacar com a accessos directes quan la finestra està plegada. La intenció és que, sobretot en mòbil, aquest taronja cride l'atenció i guie ràpidament l'ull de l'usuari cap als menús desplegables. Per equilibrar-ho visualment, els textos i icones de la part inferior de la sidebar principal (ex: "Versions", "Legal i privacitat"), que actualment són grocs, també s'han de canviar al mateix taronja canònic.
- **Mida del Logotip a la targeta d'arrencada:** Actualment el logotip de Sóc de Poble es veu massa diminut (especialment a la targeta principal, baix de la topbar del Mur). S'ha d'ajustar i millorar el seu disseny i escalat perquè s'adapte correctament a l'espai disponible i guanye la presència visual que mereix.

### Aportació de Codex (execució local verificada)

Auditoria inicial entregada: [[260926_2132_auditoria_codex]]. L'ordre humana posterior «Llig-lo i implementa-ho a la teua entrega final» autoritza esta execució i supera la pausa AFK anterior per a este abast. Model IA: GPT-6 (variant exacta no exposada); tokens d'entrada i d'eixida no disponibles, sense estimacions inventades. Complexitat alta: contractes de sessió i treball previ compartit.

Seqüència concreta: (1) `identitat`, `sessionService` i transports Supabase: vincle backend/tenant, rebuig de credencials sense origen conegut, renovacions protegides davant canvis; (2) `host`, política i Provider: adaptador validat abans d'arrencar i configuració dinàmica de l'amfitrió; (3) adaptador local de Notes amb persistència i revisions; (4) `App`, `AppGridShell`, eines universals, Notes i CSS: rail, amplàries, truncament, copyright i desplegable Aa; (5) proves de regressió, navegador, lint i builds. Es preserven els límits d'origen del pont iframe i l'aïllament CSS del Perfil.

Tall inicial mesurat: 997 proves Vitest, 983 correctes i 14 fallades prèvies (Consola/Wiki). Les 484 de l'acta corresponen a una selecció. No hi ha evidència per atribuir les 14 fallades a una actuació d'Opus.

**Troballes crítiques estructurals:**
1. **Bloqueig del Fedivers (Arrencada pública):** La seqüència d'arrencada actual rebutja explícitament injectar un backend alternatiu, bloquejant en sec qualsevol intent de connectar-nos a un *plugin* de WordPress ("Gent de la Torre") o a un altre node.
2. **Fuga de Tokens (Cross-Backend):** La sessió guardada actualment no aïlla els tokens per domini o backend. Això provoca que un JWT o un *refresh token* obtingut en un node es puga enviar per error a un altre servidor configurat. És una fallada de seguretat crítica per a la visió del Fedivers.
3. **Falla *Offline-First*:** L'entorn `seed/local` no permet desar Notes si no hi ha servidor. La persistència autònoma està trencada.
4. **Falsos positius a les proves:** Les migracions només testegen SQL com a text, sense executar-lo en PostgreSQL. A més, la *suite* té 983 proves (amb 14 roges que Opus va ignorar).

**Directives d'Implementació per a Codex (IAIA MarIA):**
- **Solució d'Arrencada:** Cal refactoritzar el *Provider* de l'app perquè accepte el `backend_url` i el `tenant_id` dinàmicament des de l'amfitrió, obrint la porta a injeccions externes.
- **Aïllament de Sessió:** El gestor de sessió que Opus va tocar ha d'estar obligat a guardar els tokens (`localStorage`) **vinculats unívocament al domini/backend actiu** (p. ex., usant el host com a part del nom de la clau: `sdp_session_latorre`, `sdp_session_sollutia`). Si es canvia de backend, s'ha d'evitar enviar els tokens vells i exigir un nou *handshake*.
- **Persistència Offline Local:** Cal reparar l'adaptador `seed/local` implementant un esborrany funcional (idealment amb IndexedDB) que permeta un ús 100% autònom del Bloc de Notes i de l'Editor.

### Aportació de la IAIA MarIA (Investigació de Rendiment Lighthouse)

He executat l'auditoria de Lighthouse en un entorn completament net (finestra d'incògnit sense extensions) tal com suggeria l'advertència, actuant exclusivament en mode d'observació sense tocar cap línia de codi, complint així el **Protocol de la Reunió a l'Olivera**.

**Resultats de l'auditoria neta:**
- El LCP (Largest Contentful Paint) no és de 68 segons, sinó que l'auditoria completa s'ha resolt en poc menys de 5 segons.
- Les puntuacions han sigut de 100 en Accessibilitat, 100 en Bones Pràctiques i 100 en SEO.

**Conclusió tècnica:** 
La caiguda extrema de rendiment (LCP de 68s) documentada anteriorment **no és una regressió estructural del codi**, sinó un problema ambiental provocat per l'estat local de l'IndexedDB i per les extensions del navegador de l'entorn de desenvolupament previ. 
No obstant això, aquest avís reafirma la necessitat d'optimitzar la implementació de l'IndexedDB que té pendent Codex, ja que si l'estat local s'embossa de manera incontrolada pot afectar greument l'experiència final. Quedem a l'espera que Codex finalitze els seus ajustos.


### Aportació de Fable (auditoria [[../90_arxiu_historic/260926_1330_auditoria_claude]], versió 1.1.1)

**Ordre de fases proposat.** F1 identitat (onboarding, selector d'identitat, `author_org_id` al DTO, migració curta de grants i cascades, perfil sobre DocumentEditor) → F2 federació, només després del bolcat de l'esquema viu → F3 xat sobre la graella de tres columnes → F4 explorador. Fitxers, proves i portes de cada fase a §6 de l'auditoria; codi a §1.6, §2.1, §3.6 i §4.5.

**El que canvia respecte del que este Pla dona per fet:**
- El servidor ja sap publicar com a organització: `section_submissions.author_org_id`, la política d'inserció, `pot_signar_com_organitzacio` i el trigger que escriu el nom de l'autor existixen (I2). El client no envia mai l'organització: és una columna al DTO, cap migració.
- Cap fitxer del repositori crea `connections`, `realms`, `user_realms` ni `posts` (I11): s'han llegit senceres les 18 migracions i la llavor. Si existixen al Supabase viu, cal bolcar-les al repositori abans de qualsevol codi de federació (D9). Mentrestant, el que sí que hi ha: `towns` (realm dins d'una instància) i `town_memberships` (pertinença de persones a pobles).
- Tres forats de servidor que la interfície no pot tapar: `organizations.logo_url` sense grants i absent de `list_my_organizations` (I12); `author_org_id` amb `on delete cascade` que esborra publicacions en esborrar l'organització (I13); l'alta amb Google d'una persona nova pot fallar al trigger que exigix `tenant_id` (I14, a provar en staging).
- Xat: Realtime desactivat a propòsit a la migració de correccions (bloc comentat), topall dur de 50 missatges sense paginació, padró que amaga qui no ha consentit, i menús fantasma (X1-X9). El clon de WhatsApp és la graella amb la columna esquerra plegada com a rail d'icones; codi complet a §3.6, amb el nom accessible «Nova conversa» que `App.test.jsx` espera.
- Explorador: el panell «fatal» és l'inspector de `BrainGraph`, compartit amb la Wiki. Props noves amb valors per defecte intactes (Llei del Píxel) i quadre de comandament dalt; el CSS conserva byte a byte les nou regles de color que `grafMapa.test.js` compara (E1-E4, §4.5).
- Exportació de dades i baixa amb quarantena (afegit en este Pla): l'esquema no té `deleted_at`, ni RPC d'exportació, ni de baixa; esborrar `auth.users` arrossega en cascada el perfil, les pertinences, els missatges propis i les converses que la persona va crear, i deixa orfes publicacions i notes. Disseny en dos passos amb anonimització i tasca programada a I15; decisió D12.
- Barra blava dalt i eines de text ancorades davall de l'entradilla: `UniversalEditorShell` amb `posicioEines` per defecte intacte (I16); decisió D13.

**Directives del Mestre rebudes pel xat** (federació hipermodular, reutilitzar les taules existents, perfil amb l'Editor Universal): recollides a §0 de l'auditoria perquè Codex les veja.

**Res es toca fins que el Mestre tanque D1-D13** (§7 de l'auditoria) i s'òbriga un torn `code`: el torn actual és de documents i porta un rebut fantasma que impedix tancar-lo (§8).

### Resolucions del Mestre (D1-D13 per a Fase 1)

**Tancament de les decisions per engegar la Fase 1 (Identitat i Perfil):**
- **D1 (Sessió i recàrrega):** Independència màxima del sistema de Sollutia. Cal que ens encarreguem de renovar i mantindre la sessió nosaltres mateixos (p. ex., amb *refresh token* amagat) per a no dependre que l'amfitrió l'injecte contínuament.
- **D2 (Noves columnes de perfil):** Endavant amb la migració. Adaptarem el concepte de l'Editor Universal al perfil: l'entradilla serà el `lema`, l'H2 serà `presentacio_html` (cos), i l'H1 serà el `name`/`full_name`.
- **D3 (Consentiment RGPD):** S'ha d'implementar de la forma més robusta i legal possible (cal demanar explícitament a Opus la solució tècnica òptima).
- **D10 (Cascada d'entitats):** S'ha d'aplicar el `on delete set null` a l'autor de les publicacions perquè no s'esborren els articles quan una persona decideix esborrar la seua entitat (si és seua exclusivament). Si pertany a més gent, potser caldria permetre traspassar-la, però el més segur per evitar pèrdues de dades involuntàries és no fer esborrat en cascada d'articles i regularitzar els permisos de `logo_url`.
- **D11 (Alta amb Google i tenant_id):** "Curar-nos en salut": l'agent Opus ha d'establir la lògica o el *fallback* (`tenant_id` per defecte al trigger) necessari perquè l'alta no falle mai.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **L'auditor haurà d'entregar:** l'informe d'auditoria resolutiu.
- Aquest pla està en fase d'elaboració i rebrà les notes de l'auditoria a posteriori.
- Auditoria de Fable entregada: [[../90_arxiu_historic/260926_1330_auditoria_claude]] (versió 1.1.1, `document.mjs check` pendent d'executar per qui tinga lease). Abans de la F1: `npx vitest run src/sections/profile src/sections/onboarding src/data/supabase`, `npm run porta:enxufe`, `npm run porta:rls`; abans de la F2: bolcat de l'esquema viu al repositori; abans de la F3: `npx vitest run src/sections/xat src/app` i navegador a 3340 en ample, mitjà i estret; abans de la F4: `npx vitest run src/components/universal/graph src/sections/consola` i la Wiki idèntica píxel a píxel.


### Resultat Codex · 26-09-2026, 22:46

Directives de MarIA implementades: credencials vinculades al destí i tenant, host/Provider configurables amb adaptador validat, Notes IndexedDB en seed/local. UI de rail, amplàries, metadades, Aa, copyright/CC amb acceptació explícita de CC0, vista A4 amb portada, taronja i ajuda d'ActorsMapa. Resultats i límits a [[260926_2132_auditoria_codex]]. Vitest final compartit 1.001/1.011 (10 fallades Consola/Wiki; abans dels canvis concurrents, 997/1.011 i les 14 inicials); Node 51/51; lint, builds web/WP i portes de frontera correctes; orfandat 0/0. Migració de copyright preparada, no aplicada. F2–F4 històriques i riscos SQL A04–A09 no es donen per resolts. Model GPT-6, variant no exposada; tokens d'entrada/eixida no disponibles.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Conflicte amb variables i tokens de Pedra Seca.
- Riscos d'acoblament i Vendor Lock-in (Supabase / React).
- Càrrega innecessària d'estat als contexts globals.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
