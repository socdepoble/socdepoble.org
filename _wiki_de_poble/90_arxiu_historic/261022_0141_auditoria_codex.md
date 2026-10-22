---
type: informe
status: esborrany
description: Execució local del pla WP i PWA, auditoria didàctica, connexió humana amb autoria i evidències REA d’Obsidian.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_697e1f78-ba04-40dd-9081-529bbd1cd00c:6ed656bb-04c4-4dc9-bbbb-db6ad1c5e992
---
# Auditoria Codex · WP lleuger, didactica i REA

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_697e1f78-ba04-40dd-9081-529bbd1cd00c:6ed656bb-04c4-4dc9-bbbb-db6ad1c5e992 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T23:41:04.475Z |
| Modificació | 2026-10-22T00:06:30+00:00 |
| Propietari | Codex |
| Aprovació humana | mandat d’execució local autònoma de 2026-10-22 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex i tres subagents Codex |
| Tokens consumits | no disponibles amb fiabilitat en esta sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-21T23:41:04.475Z: esborrany creat. 2026-10-22T00:06:30+00:00: informe completat amb verificacions, correccions adversarials, ZIP reconstruït, lectura del vídeo i límits de tancament explícits.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Progrés 2026-10-22 · inici

Porta Olivera: eixida 0, cap document mogut. Pla estabilitzat i criteri corregit a 2.500.000 bytes. Llegits íntegrament AGENTS, genotip, índex mestre, taxonomia, pla, prompt, Llibre Mestre i índex de l’Escriptori. Xat, WP i REA en paral·lel amb propietat de fitxers separada. El pla inclou protecció nul·la de Notes: ja està al codi i es verificarà. Informe en construcció.

### Progrés 2026-10-22 · implementació i coordinació

Les tasques UI, connexió amb autoria i empaquetat estan implementades localment. Xat/perfil/Connectar: 556 proves dirigides passen. Plugins Gestoria/RSS: 105 proves passen. Perfil WP lleuger: cens de 217/217 URL remotes HTTP 200, tipus image/* i CORS *. Este era el tall inicial; el paquet final reconstruït i la verificació completa consten més avall.

S’han llegit íntegrament els informes nous de Gemini (01:42, esborrany pendent) i Claude (01:50, repartiment de carrils). Claude anuncia revisió independent; no atribuïm al seu model el treball dels tres subagents d’este fil, que són Codex. No es tocaran els seus documents. Connectar ja té una acció directa al xat de l’autor, independent de desar una còpia al MAS; el model relacional continua en fase de disseny, sense migració aplicada.

### Contrast final amb els altres carrils

Llegit íntegrament l’informe Gemini de 316 línies actualitzat a 23:52:30Z i el de Claude de 70 línies. Gemini corrobora el primer ZIP i diverses funcions REA; les seues propostes de redacció i dades són propostes, no codi executat. Dos matisos verificats: `esEntitatDelProjecte` viu a `src/config/navigation.js:285` i reconeix tipus/id, **mai el nom**; no es trasllada la seua afirmació de reconeixement per nom. Les instruccions d’instal·lació independent i lectura RSS en viu tampoc passen a la UI com a capacitats presents. El model d’agenda proposat per Gemini i el de relació consentida d’este informe s’han de conciliar amb la taula real `connections`, abans de migrar. Claude continua amb les seccions de verificació/límits pendents; no se n’inferix aprovació.

Relectura final del relleu Claude de les 02:05: el seu cens encara cita el primer ZIP de 2.158.729 bytes; el lliurament vigent és el reconstruït de 2.158.826 bytes. Es confirma al codi que el perfil lleuger conserva l’actualitzador i el canal `stable.json` (`creaPaquetLleuger` i `socdepoble_enxufe_oferta`). Per tant, una actualització posterior acceptada des del canal podria substituir-lo per una variant amb mitjans locals. No es dona per fet que WordPress l’actualitze automàticament ni que un futur paquet pese exactament 42 MB: depén de la configuració del lloc i del manifest signat. El límit verificat de 2.500.000 bytes correspon a este ZIP; la distribució permanent del perfil lleuger pel canal requerix una decisió de release separada.

### Resultat de les tasques mecàniques

| Tasca | Resultat verificable | Límit pràctic |
| --- | --- | --- |
| 1 · PWA | `BotoInstalaApp` ja no es munta a `App.jsx`. El component queda conservat per a reactivació explícita. | No s’ha retirat tota la infraestructura PWA. |
| 2 · WP | Perfil explícit `SDP_MITJANS=externs` i empaquetador `--lleuger`; ZIP **2.158.826 bytes**, versió **1.1.10-beta.1**. SHA-256 `4e8795245321d85bd8d80447f3b42cb7267ffb42f15196f24f773fd0f3caae9a`. | Les imatges necessiten xarxa i el servei canònic. No és publicació al canal estable ni acreditació de WordPress.org. |
| 3 · Xat | Logo verd quadrat per identitat del projecte; dos CTA per a visitants; benvinguda oficial IAIA visible en mode remot. | La cortesia està etiquetada com automàtica i local: no és un missatge persistit ni una resposta del servidor. |
| 4 · Persona | Avatar gran duplicat retirat de les persones físiques; barra taronja conservada. | La presentació d’entitats conserva el seu contracte. |
| 5 · Didàctica | Gestoria i RSS tenen sis blocs explicatius; en una compilació sense app no oferixen «Obrir» inert: ajuda d’instal·lació i desactivació personal reversible. Auditoria de les cinc pantalles a continuació. | No hi ha paquet independent ni instal·lador dinàmic d’estes dues apps. No es fabrica un botó de descàrrega sense destí real. |
| 6 · Autoria | Acció explícita «Connectar amb l’autor» obri el xat privat canònic a partir de l’original resolt, independent del MAS. | No s’envia cap missatge automàtic ni es crea una amistat. Disseny de dades separat, encara sense migració. |
| 7 · REA | Inspecció real dels dos ASAR d’Obsidian, funcions amb proves, manual net i millora mínima del graf buit. | Ni paritat completa de Notes, ni sincronització en viu, ni REA de Bring!/Loyverse sense artefactes. |

El paquet final conté 330 entrades i 309 fitxers de `dist` (301 trossos JS); cap `/assets/` local. JS, CSS, fonts i índex de coneixement continuen al paquet. Els binaris de mostra originals no s’esborren del projecte: el perfil lleuger els exclou i `assetResolver` els resol a `https://socdepoble.org/assets/...`. La variant ordinària i la variant del directori WordPress mantenen el seu contracte. El cens extern verifica 217/217 imatges amb HTTP 200, `image/*` i CORS `*`; és una comprovació datada, no una garantia indefinida de disponibilitat.

Fitxers de lliurament al satèl·lit existent `../_builds_de_poble/wordpress/`: `socdepoble.zip`, `261022_0146_informe_validacio_mitjans_wordpress.json` i `261022_0200_informe_validacio_zip_wordpress.json`. No existia un `socdepoble.zip` anterior, no s’han sobreescrit paquets històrics ni canals signats.

### Auditoria didàctica «El veí del poble»

Abast: codi dels estats de càrrega, buit, error i acció; proves dels plugins presents/absents; navegació real sense sessió pel servidor local existent `localhost:3340`, en vista estreta de 409 px. No és una prova d’usuari amb veïns ni una verificació de la instal·lació de producció. No s’han enviat missatges, comprat productes ni editat notes personals.

| Pantalla i prioritat | Què troba el veí | Text/acció aplicat o proposat |
| --- | --- | --- |
| Gestoria · alta, corregit | Abans no hi havia una explicació que separara organitzar comptes i fer gestions oficials. Un node sense app mostrava una porta sense destí. | Aplicats sis blocs: què és, primer pas, exemple local, dades guardades, límits i disponibilitat. S’explica que està en proves i no presenta impostos ni envia documentació. Sense app: «Com instal·lar esta eina» desplega instruccions reals; «Desactiva esta eina» amaga la utilitat del Panell i permet recuperar-la. |
| RSS · alta, corregit | «Font» i «RSS» no expliquen per si mateixos què es rep. El lector podia suggerir que ja arribaven notícies en viu. | Aplicats sis blocs amb exemple i diferència Fonts/Notícies. Queda explícit que les fonts en viu encara no estan connectades, coherent amb P1-07. Mateix tractament d’instal·lació/desactivació. |
| Notes · alta, proposta | Sí que hi ha tutorial; el problema no és absència de text. La mostra observada parla d’H1/H2, promet crear carpetes i publicar directament al grup, i presenta la privacitat com absoluta. Estes promeses depenen del mode i permisos. El menú de carpetes cobrix bona part de la vista mòbil i no explica el primer pas. | «Este és el teu quadern. Obri una nota de la llista o prem + per començar, quan estiga disponible. Revisa l’indicador de desat abans d’eixir. En mode de prova les dades poden quedar només en este navegador. Per compartir, tria el destí i revisa qui ho podrà llegir.» Substituir instruccions de la mostra segons capacitats reals; evitar prometre carpetes/grups on no funcionen. |
| Notes · mitjana, proposta | «No hi ha notes» / «Connecta per veure les teues notes» no distingixen llista buida de carpeta filtrada. En la vista observada el menú es tanca tocant fora; Escape no el tanca. | «Esta carpeta encara no té notes. Tria una altra carpeta o crea una nota.» Si hi ha filtres: «Cap nota coincidix. Neteja els filtres.» Afegir un tancament explícit del rail mòbil i provar Escape abans de declarar paritat accessible completa. |
| Mercat · mitjana, proposta | L’entradilla és genèrica; el visitant no sap si «Connectar» compra el producte, el desa o contacta amb qui el ven. No s’explica com oferir-ne un. | «Ací trobaràs productes i intercanvis de la gent del poble. Obri una oferta per veure’n els detalls i parlar amb qui l’ha publicada. Connectar-la al teu MAS en guarda una còpia; no confirma cap compra.» Afegir porta de publicació només si la sessió i capacitat la permeten. |
| Mercat · baixa, conservat | Buit correcte però sense següent pas. L’error sí que té explicació i «Torna-ho a provar»; la paginació té reintent propi. | «Encara no hi ha ofertes en este poble. Pots tornar més tard o publicar-ne una si tens compte.» Mantindre `EstatErrorDades` i no substituir un error per un catàleg buit. |
| Pobles · mitjana, proposta | «Nodes i territori» i «context territorial» són tècnics. La foto obri la fitxa i «Anar al xat» obri la conversa: bona separació, sense text inicial que l’explique. | «Coneix els pobles i la seua gent. Toca una foto per llegir la fitxa; prem Anar al xat per entrar a la conversa del poble.» Buit: «Encara no tenim cap poble per mostrar.» |
| Pobles · alta, proposta | El codi d’error mostra text cru i no oferix reintent, a diferència del Mercat. La pastilla cronològica obri un calendari que encara no inclou els pobles (deute ja declarat al fitxer). | Reutilitzar `EstatErrorDades` amb `refresh` del contingut; amagar detall tècnic fora de desenvolupament. Acreditar el destí temporal abans de presentar la pastilla com a cerca del poble al calendari. |

La desactivació implementada és una preferència del navegador, no una desinstal·lació global del node. Es diu explícitament i no esborra les dades. Rehabilitar la preferència tampoc instal·la un paquet absent. En desenvolupament, on les apps sí que estan compilades, les portes continuen obrint `/app/gestoria` i `/app/lector`. Els casos absents estan verificats amb fixtures i proves de comportament.

### Connectar amb l’autor i preparar la xarxa humana

La nova acció només apareix quan `useOriginalDeConnexio` resol l’element i `autorDe(itemOriginal)` aporta una identitat fiable. No s’usa l’autoria declarada pels paràmetres de l’URL. Si l’autor és una entitat, es conserva eixa identitat, sense substituir-la per qui la gestiona. S’exclou l’autoria pròpia i les entitats representades. En remot sense sessió es reutilitza el camí d’entrada amb retorn. Els perfils encara no els resol este hook: en eixe cas no es fabrica un destinatari. El registre conserva `tornar`, però la política global vigent aterra al perfil; resta revisió de retorn postregistre.

No hi ha `useConnectaTargeta.js` al codi actual: l’encaix real és `ConnectarSection.jsx`, els hooks de l’original i les accions de Pedra Seca. `notes.origen` descriu procedència i còpia al MAS, no consentiment social. Obrir el xat tampoc acredita una relació acceptada.

**Disseny concret de dades, pendent d’inventari real.** La migració `2609261500_identitat_perfil_f1.sql:995` adverteix que el Supabase viu ja tenia una taula `connections` no versionada i de columnes desconegudes. Seria incorrecte crear-ne una altra a cegues o afirmar que no existix. Abans de migrar: inventari de només lectura de columnes, FKs, índexs, RLS, privilegis i RPC, i decisió de convergència.

Model proposat `connexions_humanes`, persona sol·licitant i destinatari persona/entitat:

- `id`, `tenant_id → towns.id`, `sollicitant_id → auth.users.id`; tipus de destinatari i dues FKs alternatives (`auth.users.id` o `organizations.id`), amb `CHECK` de tipus/XOR.
- Parella tipada i ordenada al servidor (`persona:<id>` / `entitat:<id>`) i `UNIQUE(tenant_id, parella)`; evita duplicats i peticions creuades. Cap self ni identitat representada.
- `estat`, `revision`, dates de creació/actualització/resposta/tancament i qui respon/tanca. Actors i dates els deriva el servidor de la sessió, no els accepta del client.
- Dos consentiments independents de visibilitat, inicialment nuls. `profiles.is_public` no implica publicar relacions. Noms, correus o missatges no són claus ni es copien a la relació.

`profiles.id` referencia `auth.users.id`, però `organizations.id` és una identitat pròpia (`2609080000_initial_schema.sql:62,73`). El gestor s’acredita amb `organization_memberships` i `private.can_manage_organization` (`:101,385`, owner/admin); l’entitat mai es convertix en `auth.uid()`.

Transicions: nova petició → pendent; només el destinatari o gestor autoritzat accepta/rebutja; només el sol·licitant cancel·la; qualsevol extrem revoca una relació acceptada. Una petició inversa retorna la pendent existent i NO accepta automàticament. Reobrir requereix acció explícita, nova revisió i reinici dels consentiments. Bloqueig transaccional, revisió esperada i idempotència; el xat ja oferix un patró de parelles deduplicades (`2610081543_xat_consentiment_i_metadades.sql:145,167`).

RLS: lectura íntegra només dels extrems/gestors; cap accés anònim. Escriptura només per RPC estretes amb `search_path=''`, `auth.uid()` i validació de poble, estat, destí, representació i bloquejos. El patró XOR de `bloquejos` és reutilitzable (`2610201500_moderacio_denuncies_i_bloquejos.sql:125`), però no prova que totes les noves accions ja estiguen protegides: cal implementar-ho i provar-ho.

Graf inicial només per a membres autenticats del poble: arestes acceptades, dos consentiments vigents i cap bloqueig. DTO mínim dels dos extrems (tipus/id/nom/avatar); sense peticions, rebutjos, gestors, correus ni dates internes. Retirar consentiment elimina l’aresta i el recompte visible. La publicació a Internet seria un abast diferent.

Capacitat neutral opcional proposada `connexionsHumanes`, amb llista, sol·licitud, resposta, cancel·lació, revocació, visibilitat i lectura del graf. Seguir `src/data/contracte.js:78` i patró additiu de moderació de `backendPort.js:224`, amb kit de conformitat per backend; UUID només a l’adaptador Supabase. Sollutia continua GET per la Frontissa. Acceptació necessària abans d’activar-la: dues peticions simultànies produeixen una parella; un tercer no la llig ni la modifica; un gestor revocat no accepta; una sessió canviada no completa l’acció anterior; retirada de visibilitat/bloqueig elimina aresta i recompte. Este disseny prepara la migració, però no la substituïx.

### Revisió adversarial i ampliació concurrent del pla

Després del primer ZIP, la revisió de Codex ha corregit dues P2 de `PluginPage`: la reversió ara llig també la preferència canònica `estaAlPanell`, inclosos canvis externs; i les instruccions d’instal·lació només es mostren amb motiu `no-compilada`. Les apps compilades però apagades es poden reactivar; els bloquejos de privacitat i document amfitrió mantenen el seu motiu real. 74/74 proves de PluginPage passen després d’estes correccions. Paquet reconstruït: 2.158.826 bytes; el primer ZIP (2.158.729 bytes) es conserva a `261022_0150_wordpress_enxufe_v1.1.10-beta.1.zip`. Inventari i gate finals passen.

La inspecció visual de `/xat` confirma el logo verd quadrat i els dos CTA de visitant, però en 409×1019 px el segon quedava parcialment davall la navegació inferior. Corregit amb la reserva canònica de barra inferior/safe area al peu exterior, text damunt de CTA flexibles i peu que no s’encongix. Verificat novament amb captures del navegador a 409×1019: tots dos botons queden completament visibles en llista i conversa. 17 proves de comportament passen i el lint és net.

Durant este fil un altre carril ha creat el commit `d31c1ccd`. El diff incorpora els canvis de producte d’este treball, encara que el títol diga `docs(pla-prompt)`, i amplia el pla/prompt amb unificació del perfil Javi, multimèdia WhatsApp/quota i latència/favicon. No hem fet eixe commit ni el reescrivim. Les noves tasques no formaven part de les set rebudes al missatge d’este xat i no es declaren completades. S’ha aportat diagnosi addicional en lectura per facilitar el repartiment:

- `/javillinares` i `/gent/javillinares` ja passen la mateixa clau al mateix component (`App.jsx:1067,1077`). La bifurcació és de dades: JAVI encara és llavor `0001` i `IDS_REMOTS_FUNDACIONALS` no té l’UUID acreditat. `loadPerfilPublic` només busca persones per UUID; el slug consulta organitzacions i acaba al paquet. No s’ha inferit l’UUID truncat `cc74bb…`.
- `getProfile` hidrata el pilot canònic, però el perfil públic remot retorna `perfilDePersona` sense eixa hidratació i amb slug nul (`auth.js:171`, `perfils.js:83,96`). Explica diferències possibles de contingut, no prova les dades actuals de producció.
- `hostReady()` pot esperar `quanLlest()` sense termini al perfil (`PerfilPublicSection.jsx:163,203`, `host.js:209`). La neteja posa `viu=false` sense cancel·lar l’espera. És un risc verificat, encara no la causa demostrada del spinner real.
- HTTP i renovació d’Auth sí que tenen timeout de 12 segons (`runtime.js:61`, `auth.js:41`). Consultes successives, renovació i reintent poden sumar-se: no és un pressupost global de pantalla.
- El text «Carregant el perfil…» és distint del spinner de `Suspense`, que espera el mòdul de ruta. Falta captura de xarxa del problema per separar-los. El favicon es declara per separat a `index.html:48`; no s’ha atribuït el HTTP 500 al perfil ni s’ha promés resposta inferior a un segon sense mesura.

### Revisió del Llibre Mestre i millores del prompt

P1-07 confirma que RSS en viu és pendent: la UI ja ho diu. P1-01 i P2-05 no autoritzen presentar Gestoria com comptabilitat completa ni tràmit oficial. P2-02 demana portar peces de workspace a producció: REA no acredita que estiguen desplegades. P2-07 continua com a futur Fedivers, no s’ha introduït un backend nou.

Els P0 de token n8n, OAuth natiu, revocació Apple i migracions reals requerixen servidors/credencials i no queden resolts per este ZIP. P0-05 encara cita `2610211715`, mentre P0-01 registra que el Mestre ja l’ha aplicada: cal reconciliar el registre amb l’estat viu abans de repetir-la. P0-12 (arxiu històric) no s’executa incidentalment. No s’edita el Llibre per declarar FET global: hi ha commit concurrent de codi, però persistixen els límits i l’ampliació de tasques descrits ací.

Optimitzacions de `prompt_local`: fixar el límit en **bytes**; distingir ZIP beta manual/canal estable/directori WordPress; substituir noms/versiones de models per participants verificats; resoldre la ruta real d’autoria; declarar què vol dir «remot» per a IAIA (benvinguda local o resposta persistida); indicar un paquet/manifest real abans de demanar instal·lació; diferenciar graf de notes, connexió humana i conversa; corregir l’atribució del vídeo; exigir un artefacte concret per Bring!/Loyverse; i acotar el tancament de crons als d’este torn, sense anul·lar salvaguardes generals del sistema.

### Tasca 7 · investigació i manual previs al codi



Abast i mètode
S'han llegit íntegres AGENTS.md, Genotip, índex de la Wiki, taxonomia, índex complet de l'Escriptori, Llibre Mestre, pla i prompt actius; skill REA i guia JavaScript/Electron, i les cinc pàgines del PDF rea-sin-humo.pdf. Durant esta fase d’investigació no es va editar codi ni governança. El manual següent es va escriure abans de la millora mínima del graf descrita més avall. Investigació estàtica del paquet instal·lat; no s'ha executat Obsidian ni s'ha obert cap vault personal. No s'han creat crons ni processos recurrents.

Correcció documental d'Emowe
El PDF local (SHA-256 da892d1191cb1d6f1534ebf778f6934b880739f3288168668779b7f8c9c7e783), pàgines 2 i 3, diu que el seu editor de quasi 7.000 notes en 22 minuts es va reconstruir des de zero SENSE obrir l'original. El prompt atribuïx eixe resultat a REA; cal corregir l'atribució. La metodologia de mapa, proves, una funció cada volta i manual abans del codi sí que consta al PDF. Els dos accessos amb el cercador web van fallar, però el navegador ha permés obrir el [vídeo original d’Emowe](https://www.youtube.com/watch?v=YpKpragPGyk), publicat el 21-10-2026, i llegir íntegrament la transcripció de 0:00 a 11:32 (duració 11:41). No s’afirma haver vist tots els fotogrames. A 8:07–8:39 l’autor explica que va reconstruir Basalto sense REA ni obrir Obsidian; a 10:52–11:24 recomana mapa inicial, funció concreta i separar el comprovat de les suposicions. A 5:38–6:02 i 9:33–10:05 distingix els fitxers de coneixement de l’aplicació que els representa. Estes són afirmacions de l’autor, no una prova independent de velocitat ni de capacitat de 7.000 notes.

Mapa confirmat del paquet instal·lat
1. /Applications/Obsidian.app/Contents/Resources/app.asar: carregador; main.js de 13.075 bytes, package.json i node_modules. SHA-256 9a6b7f95da9b0e6111727121d79c305731430173becfbf1828eb1a335e258eee. Anàlisi REA E1 = ev_c317876ad1825bc321409c0f118eeece87cf576a694401555cdfc51bd60e34b7.
2. Contents/Resources/obsidian.asar: nucli real. SHA-256 3b83e033203c7924c2930e9d20935a44daf334941c540984edbc5f71bb7f9778. package.json declara versió 1.5.8; no demostra comportament de la versió actual d'Obsidian. app.js 2.820.015 bytes; main.js 31.045; worker.js 226.031; sim.js 17.679; index.html, CSS, traduccions i recursos.
3. lib/ conté CodeMirror, Moment, Pixi, i18next, Mermaid, MathJax, pdfjs, Prism, Readability, Reveal, scrypt i Turndown. S'ha exclòs este arbre d'anàlisi profund; index.html referencia les dependències. «Fitxer propi» no implica que cada funció d'un bundle siga pròpia: sim.js incorpora un simulador de reserva que es presenta com D3; no es copia.
4. REA E2 = ev_d64e8b2dac7371968c8b9996e2ad18ecbd5cf166db90a1a5ef1aa1d8a15751a0. Selecció explícita package.json, index.html, main.js, app.js, sim.js, worker.js: 4 JavaScript analitzats, 3.096.476 bytes de text, 889.542 nodes AST visitats, 339 mòduls recuperats, 0 fallades de parseig. 89 fitxers fora de l'abast. Graf semàntic parcial i truncat als límits de 30.000 nodes per fitxer / 60.000 totals; això NO és un límit d'Obsidian ni una mesura de rendiment.
5. REA E1 va trobar divergències d'integritat en btime, get-fonts i vibrancy-win unpacked. Continuació explícita record-and-continue, conservant l'avís i sense executar els addons. Causa desconeguda; no s'afirma manipulació ni signatura posterior com a fet. El nucli E2 no va requerir eixa excepció.

Evidències funcionals
Les columnes següents són UTF-16, base 0, dins de l'única línia minificada d'app.js. SHA-256 app.js = 29951a4fc2c51a843c1093322c655ffc640980939ec12f0161188a7ce9cfc90a; rebut REA de contingut E3 = ev_8a096daeb1911b93fe2ac1a101c531d07c7308a8d353b651dd4d5a32af6f5319. Les funcions s'han llegit directament dels bytes inventariats, sense executar-les. «Confirmat» ací significa codi present i flux estàtic llegit; la semàntica en execució continua sense prova de paritat.

| Estat | Conclusió | Prova |
| --- | --- | --- |
| Confirmat estàtic | La memòria de metadades separa enllaços resolts i pendents i compta ocurrències per origen i destí. | app.js resolveLinks, 1767730–1767994. |
| Confirmat estàtic | getBacklinksForFile recorre referències, resol el destí en el context de cada origen i agrupa les que apunten al fitxer consultat. | app.js getBacklinksForFile, 1763161–1763341. |
| Confirmat estàtic | La resolució prova rutes relatives, ruta exacta i coincidències de nom; usa el context de la carpeta, comparació en minúscules i preferència per rutes més curtes. | app.js _getLinkpathDest, 1761438–1762298; getFirstLinkpathDest, 1761330–1761435. No es promet paritat per col·lisions/Unicode. |
| Confirmat estàtic | Crear, modificar, esborrar o reanomenar fitxers activa la revisió de la memòria de metadades. | app.js watchVaultChanges, 1763829–1764116. |
| Confirmat estàtic | El renderer construïx un «Graph Worker» separat a /sim.js i el termina en destruir-se. | REA E4 = ev_face1961f18d3c76dd621d3cee5bc82c051fd3ceb29197ab03dfcc9526ff8f70, app.js 1873164–1873207; sim.js SHA-256 a1ac527ee78002515cfa2f9dbc3a1fedb12df109cb15b47d35da45f6496b27ae. |
| Confirmat estàtic | El parseig de metadades té un «Metadata Cache Worker» separat. | REA E5 = ev_d7eacb9f945088e073f00369570c901ba290959a333d9d613b39fa49bb02fc0e, app.js 1759627–1759681. |
| Confirmat estàtic | El graf global construïx nodes des de resolvedLinks/unresolvedLinks; opcions per adjunts, etiquetes, pendents i orfes. El local limita salts i separa enllaços entrants i eixints. | app.js render del motor de graf, al voltant de 1904000–1906500; opcions zU i transformació localFile/localJumps/localForelinks/localBacklinks. |
| Confirmat estàtic | Clicar un node obri la nota; clicar una etiqueta activa la cerca d'eixa etiqueta; el menú contextual oferix obrir en nova pestanya. | app.js onNodeClick/onNodeRightClick del motor de graf, al voltant de 1907700. |
| Confirmat estàtic | La lectura i escriptura del contingut passen per adapter; crear comprova l'existència i modify escriu al camí i actualitza la memòria cau. | app.js Vault.create 727089, read 728247, modify 730162, process 731331. |
| Confirmat estàtic | L'estructura de l'espai i l'estat de les notes són separats: panells serialitzen fills, direcció, amplada, plegament i pestanya. Layout desa main/left/right/active/lastOpenFiles a workspace.json o workspace-mobile.json. | app.js serialize del panell 1824830, collapse 1825131, expand 1825873; getLayout 2009572–2009891; saveLayout 2009894–2010356. |
| Deduït | Separar índex de referències, contingut de nota i disposició de panells permet reconstruir la navegació sense convertir el graf en font de veritat. | Composició dels fluxos anteriors; és conclusió de disseny, no declaració del proveïdor. |

Manual net per a Sóc de Poble (decisions pròpies informades per les proves)
1. La nota continua sent el contingut autoritatiu. Els enllaços i el graf són projeccions reconstruïbles. Tot accés a notes passa pel port existent; cap backend nou, escriptura a Sollutia ni emmagatzematge privatiu del renderer.
2. Escriure [[nom d'una nota]] permet triar una nota visible amb un destí estable. L'etiqueta que veu la persona pot canviar sense perdre la identitat. En cas de noms duplicats, mostrar carpeta/context i demanar una tria; no connectar a una persona o document arbitrari. Un text de codi o una mostra literal no crea una relació activa.
3. En desar, actualitzar les referències d'eixa nota; un enllaç repetit suma ocurrències però no duplica la nota a la llista d'entrants. Mantindre separat «Enllaça amb» de «Notes que t'enllacen». No escriure automàticament l'enllaç invers dins del document de destí.
4. Els destins absents es mostren com «Esta nota encara no existix», amb acció explícita per crear-la si hi ha permís. Quan apareix o canvia de nom, revisar les referències afectades. No donar de baixa notes perquè només haja fallat la xarxa.
5. Graf local per defecte: nota activa al centre, un salt inicial, interruptors «Notes que enllaces» i «Notes que t'enllacen». Graf global opcional. Filtres en llenguatge planer, acció per netejar-los i missatge que distingisca «No hi ha notes» de «Cap nota passa estos filtres».
6. Clicar una nota del graf obri el mateix detall de UniversalWorkspace. El llistat textual d'enllaços ha de permetre fer les mateixes accions amb teclat o lector de pantalla. La mida d'un punt o la seua posició no atribuïx valor social a persones.
7. Desacoblar la projecció de dades del càlcul de posicions. Si el volum real ho exigix, worker cancel·lable i destrucció en eixir de la vista. No portar Pixi, D3 ni cap biblioteca només perquè Obsidian la incloga. Mesurar abans d'afegir dependències.
8. Plegar un panell només canvia la disposició, conserva el document i deixa un botó accessible per tornar-lo a obrir. Desar amplades/plegament/selecció de l'espai independentment del text. Respectar les regles mòbils ja existents de UniversalWorkspace.
9. Privacitat: calcular el graf només amb notes que la sessió pot llegir. Cap títol, nom, recompte d'entrants o node privat es revela a través d'una relació pública. La connexió humana amb un autor és un model diferent dels enllaços entre notes.

Casos d'acceptació abans d'implementar
- A apunta a B dos voltes: B mostra A una volta i 2 referències; la nota B no rep edicions automàtiques.
- A apunta a una nota absent: estat pendent; crear-la resol el vincle; fallada de càrrega no es tracta com esborrat.
- Dos títols iguals en carpetes diferents: tria explícita i enllaç estable després de reanomenar.
- Esborrar/modificar una referència actualitza el llistat i el graf sense duplicats.
- Les notes que no es poden llegir no apareixen ni als recomptes.
- Plegar/reobrir panells conserva el text i el focus; recàrrega recupera la disposició vàlida.
- Eixir del graf termina el worker; navegació completa per teclat; error de xarxa recuperable.
Estos casos són especificació proposada, NO tests executats contra Obsidian. No hi ha benchmark de 7.000 notes, prova de sincronització remota, ni garantia de paritat amb versions posteriors.

Punt d'encaix existent
src/components/universal/workspace/UniversalWorkspace.jsx ja és una closca independent amb model/renderDetail injectats, plegament de columnes, filtres i selecció. La millora ha d'entrar com model/vista o complement del Bloc, reutilitzant esta closca. src/sections/notes/connexions.js representa còpies/connexions de contingut al MAS i autoria d'origen; no s'ha de sobrecarregar amb una semàntica de backlinks o relació humana recíproca sense contracte explícit.

Bring! i Loyverse
No apareixen instal·lacions amb estos noms en /Applications ni ~/Applications. Cerca de noms al repositori actiu troba src/apps/bar/nucli/loyverse.js, la seua prova i CSV de llavor; són codi/dades de Sóc de Poble, no prova del comportament intern de Loyverse. No s'ha declarat REA d'estes dos aplicacions. Requerixen un artefacte o sessió concreta per a una investigació comparable; no s'ha descarregat ni obert cap compte.

Rebuts i conservació
Els rebuts REA seleccionats s’han conservat a `../_investigacio_ia_de_poble/261022_0141_rebuts_rea_obsidian_codex.json` (172.841 bytes, SHA-256 `906fd0aa3ce3fa3f69b150a800e585184dc562d73041c0979e2271f326ce68b4`); /tmp/sdp-rea-obsidian-evidence.json és l'export complet (208.856.825 bytes, abans d'E5). Mantindre el resum al text canònic; el paquet complet és pesant i només s'ha escrit en /tmp. Còpies de lectura /tmp/sdp-rea-{app.js,sim.js,worker.js,main.js,index.html,package.json} són exclusivament temporals, no codi del projecte. No s'ha obert una sessió nativa que exigisca close_binary.


### Evidència de verificació conservada

Al satèl·lit existent `_investigacio_ia_de_poble/` queden `261022_0141_proves_globals_codex.log` (run global original, eixida 1), `261022_0141_informe_tancament_codex.json` (diagnosi global) i `261022_0141_resum_verificacio_codex.json` (resultat del run i correcció posterior diferenciats). Els JSON de WP i els rebuts REA tenen les rutes i hashes indicats en els apartats corresponents.

### Encaix del manual amb el codi actual

Notes/UniversalWorkspace encara no munta un graf. `ExploradorMapa.jsx` és el consumidor productiu de `BrainGraph.jsx`; ja diferencia «cap peça passa els filtres» i oferix «Restablir filtres». `grafDeLaWiki` col·lapsa A→B i B→A, descarta destins absents i reconeix enllaços `?item=`, no la semàntica de Notes `[[...]]`. No hi ha paritat de backlinks. Duplicar arestes ara també duplicaria les forces del layout: cal separar índex dirigit i molles visuals abans d’implementar el graf de Notes.

Millora mínima implementada DESPRÉS d’escriure este manual: desactivar pausa, zoom i centrat quan no hi ha cap node. Prova d’acceptació superada: graf buit → controls desactivats; arriben nodes → actius. 19 proves de BrainGraph i ExploradorMapa passen, amb lint net. Els panells existents ja tenen rails accessibles i proves de focus; es conserven. El desenvolupament complet de backlinks queda especificat, no simulat amb una expressió regular.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Porta Olivera inicial: 0. Proves dirigides: 556 UI/xat/perfil/Connectar, 105 plugins, 129 WP/mitjans i 19 graf: **809 casos aprovats** (suites separades, sense sumar reruns). ESLint dels fitxers UI/plugins/graf i `git diff --check` correctes. Build WP final i `tractor-build-previ` correctes. Correccions posteriors: 74/74 PluginPage i 17/17 xat; tractor-frontissa també passa. La bateria global ha executat 20.427 proves aprovades, 1 fallada i 100 omeses (1.207 fitxers aprovats, 1 fallat i 9 omesos), en 835,50 s. L’única fallada era `pesDelNucli.test.js`, que exigia imatges locals de Gestoria fins i tot amb el nou perfil extern. Corregit perquè valide el manifest: extern HTTPS públic, absència de còpies locals i resolució correcta; perfil local amb fitxer real i base de l’amfitrió. El fitxer complet passa després **7/7**, sense cap skip nou i sense tocar el producte ni el ZIP. No s’ha repetit tota la bateria de 835 s després d’esta correcció de prova; no es presenta el primer run com a eixida 0. Les 100 omissions preexistents no s’han forçat. La protecció contra `null` de Notes ja existia i no s’ha reimplementat; el fitxer DocumentEditor està dins de la bateria, sense fallada registrada.

Inspecció de navegador: les cinc pantalles sol·licitades s’han obert sense sessió al servidor local; PWA absent, textos nous visibles en Gestoria/RSS i navegació mòbil observada. No s’ha simulat un compte real ni aplicat migracions. La verificació de rutes remotes d’imatges és una comprovació HTTP independent del navegador.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Sense desplegament, sense aplicació de migracions remotes i sense missatges a tercers. Les evidències estàtiques REA no acrediten execució en viu. El disseny de dades no acredita migració ni graf social desplegats. La nova ampliació concurrent de perfil/WhatsApp/latència té el seu estat separat.

Primer `tancament.mjs --check`: `valid:false`, 1.270 incidències globals (1.001 LINK_INVALID, 239 ESCRIPTORI_UNANCHORED, 19 ORPHAN_OPERATIVE, signatura LEDGER, Wiki i 9 camps pendents d’informes d’altres carrils). Olivera, plantilles, autoritat, segell i skills passen. El LEDGER no està modificat pel diff d’este fil; no se’n refà la signatura per ocultar el desajust. La repetició final després de completar Gemini dona **1.265 incidències**, amb les mateixes classes i només quatre camps pendents de Claude. Cap incidència atribuïda als dos documents de Codex, que passen individualment `document.mjs check`. No esborrem ni completem documents aliens.

Acta Marmota pròpia creada i validada a l’Escriptori; `.agents/ESTAT.md` actualitzat. Les bateries, compilacions i tres subagents han acabat; les dues pestanyes temporals estan tancades. No s’han creat crons. Els quatre monitors Codex accessibles constaven PAUSED; la guarda nocturna caducada s’ha aturat explícitament amb `guarda-nocturna.mjs --aturar` (23:53:47Z). Es preserven la higiene/backup del sistema i el servidor local que ja estava actiu abans del torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_0141_acta_tancament_codex]]
