---
type: informe
status: esborrany
description: Verificació final de la separació Gestoria/Wiki, avatars personals redons i empaquetat manual WordPress 1.0.3 per a Gent de la Torre.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3829d514-eb9a-406e-ae86-dd2647b0abfd:f20521e2-068b-4fd9-8c0e-41c4b50beb7a
---
# Tancament 1.0.3: Gestoria separada, avatars i paquet WordPress

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3829d514-eb9a-406e-ae86-dd2647b0abfd:f20521e2-068b-4fd9-8c0e-41c4b50beb7a |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T12:49:29.184Z |
| Modificació | 2026-10-04T13:53:34.816862+00:00 |
| Propietari | agent-local |
| Aprovació humana | Abast aprovat per ordre executiva directa: rutes, poliment en curs, paquet i Escriptori. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; variant exacta no exposada. |
| Tokens consumits | No mesurats: comptador exacte del torn no accessible; no equival a zero. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

Després de completar informe, acta, ZIP 15:14 i Escriptori, Codex comprova Claude Desktop: workflow d’espècimen d’avatar en Verifica 0/1 i bateria final pendent. Es complix la condició humana i s’assumix el menú complet de Gestoria, amb pla 1420 v1.2.0 vinculat abans d’editar. Ampliació validada, dos builds nous i ZIP final 15:45. El relleu queda a ESTAT; l’intent de missatge natiu es va interrompre per interacció humana i no es considera enviat.

2026-10-04: ordre executiva de tancament limitada a la contaminació Gestoria/Wiki, poliment en curs i empaquetat 1.0.3. Revisió independent, primer tall de compatibilitat i prova de carrera; criteri final estricte de Claude acceptat i revalidat amb 61/61, recompilació i empaquetat 15:14 amb fonts congelades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Incidència crítica resolta.** La causa era el muntatge explícit de ShellGestoria i Aprendre dins d’UniversalWorkspace de la Wiki, amb categoria pròpia, i no una simple col·lisió de z-index. L’ordre humana actual substituïx la decisió D3 anterior. Es conserva la nova app de Claude a `/app/gestoria/tauler` i `/app/gestoria/aprendre`, amb registre, manifest i menú de plataforma propis. La Wiki ja no conté categoria ni ítems financers ni importa els components de Gestoria.

**Criteri final de rutes, posterior al primer paquet:** Claude retira les redireccions a les 15:06 i actualitza les proves. Codex accepta esta separació estricta: la Wiki no coneix cap destí de Gestoria; les URLs antigues són ítems desconeguts i mostren la portada, mentre l’app s’obri exclusivament per `/app/gestoria`. RutaWikiDePoble és un wrapper lazy neutre. El navegador real confirma que l’URL antiga de la captura mostra Wiki i cap rail financer. El pont de Tractors continua absolut cap a Wiki, sense tocar el contenidor signat ni tornar a signar tractors.

**Retorn de l’app protegit.** Durant la primera implementació amb redireccions, una càrrega nova d’Aprendre demostrà un bucle que la prova eager amagava. Es va validar una migració anterior al lazy, retirada després pel criteri estricte de Claude. La guarda genèrica final es conserva: BarraLateral recorda només rutes fora del namespace `/app`, independentment de quan l’app estiga disponible, amb consulta ordinària intacta. La passada final valida URL antiga → Wiki → entrada per la ruta pròpia → retorn, sense estat privat ni closca financera en la Wiki. No hi ha ids financers al component genèric de barra.

El helper de compatibilitat `rutesWiki.js` ha quedat sense imports productius després de la retirada de Claude. És una resta petita de codi, sense efecte al bundle ni al router, declarada com a deute menor; no s’oculta ni s’obri un front de neteja alié al tancament.

**Avatars personals redons confirmats.** Es conserva el poliment de Claude: perfil personal amb foto de 300 × 300 px i radi 999 px, avatars/IA circulars i logos d’entitats diferenciats. Codex només elimina una clau `avatar_url` duplicada al seed IAIA i actualitza una expectativa obsoleta del seu test. L’ajust final de prosa de Claude en `base.css` es verifica sense editar-lo: `overflow-wrap: break-word` només per a enllaços i codi de `.sdp-prose` en capa components. No s’obri cap front de redisseny.

**Sidebar completa, després del tancament anterior i amb la condició comprovada.** La plataforma ja substituïa la barra global, però el manifest només declarava Tauler i Aprendre i ShellGestoria muntava un segon menú al centre. Ara BarraApp conté Tauler d’Inici, Facturació, Contactes, Burocràcia, Bancs, Impostos, Full trimestral, Informes, Escàner Local i Aprendre. La ruta selecciona el mòdul amb modulActiu i l’app passa mostrarRail=false; el centre conserva només la pàgina i les targetes. Es reutilitzen la Sidebar exterior, el control blau de retorn i PaginaApp; no s’ha afegit cap graella ni patró. Sis noms d’icona s’afigen conjuntament a la llista tancada i al seu resolutor. El CSS només rep comentaris corregits: la flex existent ocupa l’espai sense rail.

La mateixa instància de ShellGestoria conserva useTauler entre els nou mòduls. Detall i avís porten el mòdul d’origen i no es pinten a la pàgina següent; un efecte els buida i enfoca el títol nou. Les dades i l’estat de privacitat es conserven. Aprendre desmunta la closca i eixir del Full trimestral desfà el seu panell, com ja passava; no s’ha introduït persistència financera. ContenidorGestoria i el pont DEV de dues importacions dinàmiques continuen intactes. El rail local continua disponible només per muntatges aïllats i proves.

**Paquet nou 1.0.3, després dels pegats.** Productes canònics a `wordpress-plugin/builds/`, per a instal·lació manual a Gent de la Torre. Els ZIP 11:51, 14:59 i 15:14 es conserven com a talls anteriors; el definitiu d’esta entrega ampliada és el 15:45. El 11:51 és anterior als poliments i té una estructura distinta de l’empaquetador canònic. Els seus bytes es conserven com a evidència. La Gestoria financera continua limitada a DEV; la separació de rutes no n’autoritza l’activació a producció.

**Escriptori endreçat.** Set prompts consumits traslladats amb porta-olivera, set handoffs registrats amb els rebuts originals i índex actualitzat. Els 14 documents vius o ajornats queden declarats a Activitat en curs. Safata buida. Cap supressió destructiva ni escriptura de Codex en les zones protegides `01_produccio/` i `02_investigacio_ia/`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Sidebar i plataforma actuals: **146/146 en 5 suites** (AppGestoria, manifest, fronteres, BarraApp i integració), amb nou accessos directes i recorregut de tots els mòduls sense remuntar la closca. Closca real i privacitat: **36/36 en 2 suites**, incloent lectura sintètica aprovada, Tauler → Bancs → Impostos → Tauler, xifres/identitat conservades i detall anterior tancat. ESLint dels fitxers editats: exit 0. Revisió independent en lectura sense bloquejants.
- Rutes de la separació anterior: tall estricte **61/61 en 5 suites**, incloent chunk Wiki pendent, URLs antigues com a portada, app pròpia, estat privat desmuntat, Tractors i retorn. Les 351/351 de base i les 59/59 de l’anterior criteri de migració són talls històrics; no validen les fonts noves ni se sumen com a casos únics. ESLint del front final: exit 0.
- Avatars: **43/43 en 6 suites**; comprovació addicional de capçaleres, logo i detall: **60/60 en 4 suites**. Hi ha solapament entre les bateries. Prosa final: **2/2**; sense contrast propi dels 75 documents que cita el comentari de Claude.
- Connector, runtime, empaquetador, secrets i amfitrió: **96/96 proves Node**, exit 0.
- Navegador real final: URL antiga de Panell → portada de Wiki (`?categoria=__all__`), sense rail de Gestoria ni Tauler Central; ruta directa `/app/gestoria/tauler` → menú propi. La nova Sidebar es contrasta a pantalla ampla i mòbil: deu accessos, un sol menú exterior, zero rails interiors i un H1. Bancs i Full trimestral obrin la ruta correcta. En compacte, prémer Impostos tanca el diàleg; el control blau torna a `/xat` després d’una entrada directa nova, amb la barra general restaurada. La recuperació de la ruta anterior de Wiki la cobreix la prova de retorn de la plataforma; no s’atribueix eixa prova al goto del navegador, que recarrega tota la SPA. Pont de Tractors → consulta de Wiki correcta. Perfil Javi: imatge carregada, cercle de 300 px. Sense proves d’entrada o credencials.
- Compilació completa `SDP_RELEASE=1 SDP_VERSIO=1.0.3 npm run build` i variant `npm run build:wp:directori`: exit 0. 855 fitxers productius al tall 13:44:59.668683Z; hashes idèntics després dels dos builds i de l’empaquetat. El tall anterior tenia 856 fitxers; no s’atribueix eixa xifra a la recompilació nova. Els índexs generats de Wiki i tokens es distingixen de les fonts productives.

Artefacte principal: [socdepoble-enxufe-v1.0.3-261004_1545.zip](../../wordpress-plugin/builds/socdepoble-enxufe-v1.0.3-261004_1545.zip), 130.751.256 bytes; SHA-256 `398330989fab0c9e06e0956de2258ba9f6efe1111ddf33d9ab711e56d1eadf06`. Bundle autònom: SHA-256 `01f69c94abae73015b476426f768d534227090bf528a2f721918b735e33f195b`.

SPA: `socdepoble-spa-v1.0.3-261004_1545.zip`, 130.692.619 bytes, SHA-256 `2b94ae3497aa79b05f2d6a0e4117c0c2f47572e00b788368d51a5cd63332a460`. Variant WordPress a `builds/directori/`: 130.690.350 bytes, SHA-256 `fa30776994b42c23ae33f9b952a83aa5455872b9d5ae1b3c8e457f0c0bc4a7cf`.

Verificació exhaustiva **valid:true, errors:[]** a `/tmp/sdp-sidebar-103-verification.json`: CRC dels tres ZIP, carpeta arrel, versió, inventaris de 221 fitxers, hashes, SRI, canals stable/1.0.3 idèntics, entorn remote i tipografia. Finances DEV absents. Revisió selectiva independent confirma headers, arrels i hashes reals. El primer intent del verificador llegí el canal vell mentre l’empaquetador encara l’estava escrivint; es repetí després de finalitzar, sense alterar el parser ni cap artefacte.

Logs actuals: `/tmp/sdp-gestoria-sidebar-final.log`, `/tmp/sdp-gestoria-sidebar-closca-tests.log`, `/tmp/sdp-gestoria-sidebar-source-eslint.log`, `/tmp/sdp-sidebar-103-build.log`, `/tmp/sdp-sidebar-103-directori.log`, `/tmp/sdp-sidebar-103-pack.log`, `/tmp/sdp-sidebar-103-verification.json`. Els logs de rutes, avatars, prosa i Node del tancament anterior es conserven al mateix /tmp, atribuïts a aquell tall.

Captura actual: `261004_gestoria_sidebar_completa.jpg` a la carpeta de visualitzacions de Codex del 04/10/2026. Mostra el menú complet a l’esquerra i la pàgina central sense el rail interior. Les captures `261004_gestoria_separada_final.jpg` i `261004_avatar_redo.jpg` es conserven com a evidència del tancament anterior. S’ha restaurat el viewport després de provar ample i mòbil.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

L’empaquetat canònic usa `--prova` perquè el canal existent no té clau pública configurada: és un ZIP de producció per a instal·lació manual, **sense signatura de canal per a actualització automàtica**. Les dues compilacions són release 1.0.3, amb configuració pública remota; no s’usa un build de desenvolupament. No hi ha instal·lació, pujada, desplegament, commit ni canvi d’autenticació remota.

El paquet conserva els mitjans públics existents i pesa uns 125 MiB. Els avisos de límit de 10 MiB i slug de WordPress.org es referixen a l’alta al directori públic; el destí actual és la instal·lació manual a Gent de la Torre. El límit d’upload d’eixe servidor no s’ha comprovat en esta entrega. L’empaquetador exclou dues restes de dist que no formen part de l’inventari, sense empaquetar-les ni esborrar-les.

Les portes globals heretades no acrediten salut general del repositori. El tancament mecànic posterior a l’ampliació és valid:false, planned, amb 1.198 incidències globals (el tall anterior tenia 1.199): LEDGER/segell, Wiki i SCC; plantilles, autoritat, skills i tests documentals passen. No són 1.198 defectes d’este paquet. Es conserva el tall anterior a `/tmp/sdp-final-103-closure.json`; el tall posterior a esta ampliació queda a `/tmp/sdp-sidebar-103-closure.json`, sense resegellar història aliena ni convertir el deute de governança en una nova tasca. El Calendari, accessibilitat general, recuperació històrica, deute comptable anterior i desplegament queden fora de l’ordre executiva actual.

La condició de la nova tasca s’ha comprovat després del tancament anterior i abans d’assumir-la. Esta ampliació només afecta navegació i presentació de l’app local; no activa la Gestoria financera en producció ni resol els fronts ajornats.

### Proposta d’Automillora

«Si m’hagueres demanat això d’aquesta altra forma, hauria sigut més eficient»: afegir al prompt inicial el cas executable “obrir l’URL antiga amb un chunk Wiki pendent, entrar a Aprendre i tornar al portal”, a més de les captures. Una prova eager amagava la carrera real. Un únic escriptor per fitxer i congelació de fonts abans del build eviten empaquetar una barreja de revisions. La captura antiga ajuda a definir la Sidebar, però convé especificar des del principi “un sol menú exterior, zero navegació de mòduls al centre, conservar lectura en navegar”. El nom AppGridShell designa una graella interna en el codi actual; el relleu exterior real és BarraApp, que ja existia. Hem aplicat un únic escriptor de UI, proves assignades a un altre agent i revisió independent en lectura; no cal obrir noves funcionalitats per millorar este tancament.

Hi ha ambigüitat entre la plantilla que obliga a rebutjar prompts incomplets i l’ordre executiva posterior concreta; preval l’ordre humana de reparar i acabar. També la skill d’empaquetat diu `01_produccio/builds/` en un apartat, mentre el seu destí únic és `wordpress-plugin/builds/`: s’aplica el destí canònic sense modificar la skill en este torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261004_1420_pla_implementacio_codex]]
- [[261004_1445_acta_marmota_codex]]
