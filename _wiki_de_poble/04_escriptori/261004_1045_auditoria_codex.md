---
type: informe
status: esborrany
description: Resum executable de les troballes del Lector RSS i dels límits del contrast de la barra taronja per a la passada final de Claude.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a6932539-8ecf-4fae-84b4-02faa6959a8e:4844ec47-5290-4433-8f36-0e7c923826e3
---
# Relleu per a Claude: Compartir del Lector, boina i salt de l’Índex

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a6932539-8ecf-4fae-84b4-02faa6959a8e:4844ec47-5290-4433-8f36-0e7c923826e3 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T08:45:01.082Z |
| Modificació | 2026-10-04T09:16:36Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; variant exacta no exposada |
| Tokens consumits | No mesurats: comptador exacte del torn no accessible; no equival a zero |
| Torn | torn_a6932539-8ecf-4fae-84b4-02faa6959a8e |
| Tall d'evidència | 2026-10-04, fins a les 11:16 Europe/Madrid; arbre de treball concurrent |
| requires_human_decision | false; relleu consultiu sense edició de producte |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-04T08:45:01.082Z: informe nou creat pel circuit canònic i ancorat, segons la petició de resum de les 10:42.

2026-10-04T08:47:00Z: relleu redactat després de llegir l'avís de reinici, l'ESTAT, l'Acta Marmota 1027, el prompt 1042 i el relleu 18 de Claude. L'auditoria completa [[261004_1010_auditoria_codex]] ja conté troballes, proves i límits; quan es va llegir abans encara era un esborrany de treball.

2026-10-04T09:01:00Z: v1.1.0, ampliació demanada al torn: bloqueig real d'entrada personal reproduït, contrast del port i del connector, i estat del paquet de producció. Llegits els relleus 19–20 de Claude i el prompt de tancament 1045; cap canvi productiu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Avís per al tancament de Claude: l'entrada personal encara no està acreditada.** A `http://localhost:3340/registre?mode=entrar`, la vista real mostra «El servidor del poble no respon ara mateix» i desactiva Google, correu, contrasenya, entrada i recuperació. «Torna-ho a provar» manté el mateix estat. El servidor Vite sí servix la pàgina. Claude identifica després el backend local `127.0.0.1:54321` apagat; he contrastat que eixe port no té cap procés escoltant. És un bloqueig de l'entorn local de proves, sense regressió de codi demostrada. No confondre'l amb la caiguda anterior d'Antigravity ni declarar el backend de producció caigut.

**Per a la passada final de Claude: «Compartir» del Lector té una ruta incorrecta demostrada; el marge de l'Índex ja ha canviat a font per a les dues barres, però encara falta el contrast visual independent. No he reproduït un defecte general de z-index.**

### R1 · P2 · «Compartir» ha de portar al detall de la notícia

La targeta de [Noticies.jsx:157](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/apps/lector/vistes/Noticies.jsx:157>) passa `onMainClick={() => obri(article.id)}` i `hasFooter`, però no passa `mainHref` ni `onShare`. El peu apareix, però no coneix la ruta del detall.

La traça és: UniversalCard → `useAccions({ mainHref: null })` → [handleShare:241](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/hooks/useAccions.js:241>) → [urlPerCompartir:135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/PedraSeca/hooks/useAccions.js:135>). Sense href, el navegador usa la URL actual i el router de memòria usa l'entrada actual de l'app. Des de la llista s'envia la llista, encara que la notícia tinga detall propi amb `?article=<id>`.

**Resultat esperat:** el peu de la targeta compartix la ruta del seu article, amb el basename correcte; des del detall compartix el mateix article. No ha d'enviar l'identificador com una ruta nova inventada ni compartir l'amfitrió del router de memòria.

**Reparació conservadora:** donar a la targeta la ruta del detall construïda pel Lector, mantenint el mecanisme `obri()` per al retorn, el focus i l'scroll. Revisar l'efecte de tindre alhora `mainHref` i `onMainClick`: l'enllaç no ha de provocar dues navegacions ni perdre l'estat de retorn. Si l'acció principal necessita continuar com a botó, usar un handler de compartició que respecte el contracte del router. No importar Supabase ni accedir directament a l'historial de l'amfitrió.

**Prova mínima d'acceptació:** amb `navigator.share` simulat, prémer «Compartir» d'una notícia de la llista i comprovar que la URL rebuda conté el seu `article=<id>`. Repetir amb router de memòria i basename; comprovar que obrir i tornar manté la llista, el focus i l'scroll. No cal enviar una compartició real per a provar-ho.

És F05 de l'informe complet. El relleu 18 de Claude reconeix independentment el mateix problema i el deixa per a la passada final: **és una troballa convergent**, sense necessitat de disputar-ne l'autoria. Al tall revisat encara no hi ha `mainHref` ni `onShare` en eixa targeta; no declare la reparació feta.

### R2 · Marge del salt de l'Índex: correcció a font arribada, visual pendent

La barra taronja universal afegix un segon sostre enganxós davall de la barra blava. Un destí de l'Índex que reserve només una barra pot quedar ocult encara que la navegació arribe a l'element correcte. És un problema d'espai reservat per al salt, diferent d'un problema d'apilament.

El relleu 17 de Claude documenta l'Índex tapat i la reparació en curs. Les lectures pròpies del CSS mostren que els selectors següents han passat de reservar `--sdp-alt-accio + --sdp-space-4` a reservar **`--sdp-alt-accio * 2 + --sdp-space-4`**:

- [Mètriques de Consola, modules.css:5939](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:5939>).
- [Desplegables de Consola, modules.css:5989](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:5989>).
- [Focus de l'Explorador, modules.css:6191](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:6191>).

[PageFrame.jsx:154](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:154>) usa `scrollIntoView({ block: 'start' })`; el marge del destí és una part essencial del contracte. No s'ha de pujar el z-index del contingut per a dissimular un destí que queda davall de les barres.

**Prova mínima d'acceptació:** en una pàgina llarga de Consola, obrir l'Índex i triar un destí de baix. Quan acabe el salt, el rectangle del destí ha de començar per davall del límit inferior de la barra taronja visible, amb el marge acordat. Repetir en mida d'escriptori i mòbil, i en els modes de chrome efectivament afectats. També contrastar «Vore la peça» i el retorn de focus a filtres de l'Explorador.

**Estat:** canvi de CSS contrastat a font; incidència visual declarada per Claude, sense reproducció visual pròpia suficient ni certificat final del pegat. L'acta no ha de convertir eixa atribució en una prova independent de Codex que no s'ha fet.

### R3 · Z-index: no hi ha una regressió general demostrada per Codex

La font central revisada posa editor 99070, taronja 99080, blava 99090, negra 99100, barra mòbil 99950, vel 99960 i calaix 99990. El valor 99080 per si mateix no prova una col·lisió: cal considerar contextos d'apilament i el contenidor de scroll. Els diàlegs modals natius van a la capa superior.

**Pendent de verificació visual:** Índex obert amb barres enganxoses, diàleg modal, toast, menú slash i navegació mòbil. Es pot convertir en una troballa quan s'aporte pantalla, interacció, selectors i geometria o context de capa. No recomane un canvi global de números per intuïció. Claude declara una auditoria pròpia en curs d'estes combinacions.

### R4 · GraellaTargetes i anatomia del Lector

`GraellaTargetes` reutilitza la graella canònica i SeccionsCategoria dins de PedraSeca; és un contenidor de targetes, no una closca competidora del Workspace. La seua suite pròpia passa. No hi ha evidència que esta peça invente un segon sistema de targetes.

El Lector sí usa UniversalCard, amb boina de font i resum. No passa subtítol, i el fallback d'autor sense font pot quedar sense enllaç. Això demana una excepció explícita per a RSS extern amb dades absents, sense inventar autoria. «Usa UniversalCard» i «complix tota l'anatomia» són criteris diferents; F04 de l'informe complet els separa.

### Prioritats que no ha de perdre el poliment

L'informe 1010 conté dos bloquejos P1 abans d'activar Facturació: el port accepta una referència anterior incoherent, i el flux d'alta no governa la política de sèrie/llegat/data de pas. També hi ha una divergència de còpia no detectada (P2). Són reproduccions amb memòria i dades sintètiques; arreglar el peu del Lector no tanca eixos punts.

### T3 nou · Entrada, Sollutia i paquet de producció

**Entrada personal / beta testers: pendent, amb bloqueig reproduït.** `OnboardingSection.jsx` pregunta la capacitat opcional `salut` pel port i només passa a dades remotes quan torna `{ ok: true }`. L'adaptador actual fa `GET /auth/v1/health`, amb topall de cinc segons; agrupa configuració invàlida, error de xarxa, estat HTTP negatiu i temps esgotat com `{ ok: false }`. La UI observada i el reintent demostren el bloqueig, però no permeten distingir-ne la causa. Cal diagnosticar la configuració i la resposta del node, sense llevar la guarda per a aconseguir un verd. No he entrat credencials, creat comptes ni acceptat consentiments.

**Aclariment del relleu 20 posterior:** Claude identifica el node local apagat com a causa; el contrast propi de `lsof -nP -iTCP:54321 -sTCP:LISTEN` no troba cap servei. Això corrobora la manca de servei local, sense llegir secrets de configuració. El manifest de producció del ZIP apunta a un node remot diferent. No s'ha contrastat una entrada real en eixe node; no s'ha d'extrapolar el resultat local a producció.

**Modularitat de l'entrada: correcta en l'abast llegit.** SessionContext, sessionService i la pantalla d'entrada consumixen el contracte genèric; les crides GoTrue es queden dins de l'adaptador Supabase. La salut i la recuperació són capacitats opcionals: l'absència no imposa un endpoint Supabase a Sollutia. Açò prepara la substitució del port, però no acredita un adaptador Sollutia operatiu amb endpoints encara no lliurats.

**Proves ampliades: 397 passades i 5 fallades, 20 fitxers.** Les cinc fallades són a `App.test.jsx`: smoke de Xat, dos detalls de Consola que no apareixen dins de l'espera, ordre de la barra mòbil i botó Telefonades absent. Les 19 suites restants de sessió, autenticació, recuperació, onboarding i configuració passen. Les dues expectatives de navegació discrepen del DOM actual; les altres tres necessiten contrast aïllat. No és una prova d'entrada real ni un verd global.

**Repàs aïllat posterior: 94 passades i 2 fallades, 3 fitxers.** App i les dues suites d'identitat es contrasten amb un worker: ara passen el smoke de Xat i les dues vistes de Consola, i també el nou accés al perfil per l'avatar. Continuen les dues discrepàncies de navegació mòbil i Telefonades. La concurrència impedeix adjudicar automàticament la diferència només a càrrega de màquina; el resultat correcte és el contrast per talls, sense presentar les tres fallades anteriors com a defectes permanents.

**Connector WordPress: 55 passades i 1 fallada, 56 proves.** El test del marcatge espera sis atributs, mentre el codi pot emetre també `base-path` i `ruta-a-url`. El contracte vigent declara el primer i reserva el segon com a opt-in. Cal sincronitzar la prova amb el contracte i comprovar quan s'emeten; la fallada sola no demostra acoblament a Supabase ni una avaria funcional de WordPress.

**Paquet final: encara no disponible al tall.** `wordpress-plugin/builds/stable.json` continua apuntant a 1.0.2, generada a les 05:27 locals, anterior al poliment. El ZIP concorda amb el SHA-256 del manifest, però això només acredita els bytes d'eixe paquet antic. Claude, al relleu 20, anuncia preparació de 1.0.3 i un guió d'empaquetat perquè el hook de la seua shell bloqueja npm/vite; l'artefacte 1.0.3 encara no s'ha observat. Per donar T3 per validat calen el contrast estable del codi final, l'accés al node de proves previst i el paquet nou amb manifest i inventari coherents. La pujada a Gent de la Torre no s'ha executat.

El contrast de bytes inclou el ZIP, l'entrada JS, el hash del JSON d'inventari i cadascun dels **215 fitxers inventariats: zero divergències**. ZIP observat: `socdepoble-enxufe-v1.0.2-261004_0527.zip`; SHA-256 `1fcc32db6816a954b49b8289444f8bfe2293744622a92687b638c4353b1f47a3`. Coherència d'artefacte i actualitat del codi són comprovacions distintes.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Traça de codi i selectors rellegits després del reinici. El detall d'una notícia amb `?article=` i la recuperació d'eixa ruta en recarregar es van observar al servidor 3340 abans de la caiguda. No s'ha enviat cap compartició externa.

La passada ordinària inicial de Gestoria va passar 1.991/1.991. CSS i UI van detectar una expectativa antiga de tipografia, després corregida. El Tauler va tindre sis fallades d'expectatives durant els canvis; els tres fitxers afectats i GraellaTargetes passen després, 53/53. Estos resultats corresponen a talls diferents i no se sumen com una certificació única.

El servidor es va aturar durant la verificació. L'avís humà acredita la represa; després s'observa un procés escoltant al port 3340. Una pestanya nova recupera la pantalla real d'entrada i reproduïx el bloqueig de salut exposat a T3. La pestanya antiga conservava una pàgina d'error de connexió. No certifique els marges visuals ni atribuisc la caiguda al producte.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Informe de lectura. Producte, governança normativa i correccions alienes intactes. Les fonts continuen canviant en directe; es requerix una passada final estable per a declarar reparats R1–R3. El nou resum no substituïx l'auditoria 1010 ni transforma les incidències globals en verdes.

Els dos informes passen `document.mjs check` i Olivera passa. El diagnòstic global de tancament dona 1.208 incidències i `valid:false` per pla mecànic absent, documentació/governança pendent i concurrència, entre altres causes; no és un recompte de defectes de producte. No s'ha tancat ni resegellat el torn en fals.

ESTAT, Acta 1027, prompts 1042 i 1045, i relleus 18–20 llegits. L'encàrrec ampliat inclou auditar l'entrada, Sollutia i el paquet final; continua sense assumir-ne el desenvolupament. Mercadona, Animalets i triatge queden fora de l'abast. L'acta atribuïx garanties de 320 px i defectes visuals més àmplies que el meu contrast propi; este informe en fixa el límit.

Llegits també els nous prompts urgents 1106 i 1108 per a Claude: barres accessibles en tots els formats i logotip gran a les pàgines d'entitat. Han d'entrar al contrast del candidat final; no se'n declara una correcció ja verificada. La lectura no s'ha estès en bloc als prototips històrics `.txt` del laboratori: cal separar-los del manifest de context actiu.

El prompt 1111 de pull-to-refresh també s'ha llegit sencer com a context de la passada de Claude. És un criteri nou pendent de prova tàctil en navegador/PWA; esta auditoria no acredita la seua implementació.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261004_1010_auditoria_codex]]
- [[261004_1042_prompt_local_codex_resum]]
- [[261004_0605_auditoria_claude]]
- [[../10_actes/261004_1027_acta_marmota]]

## Proposta d'Automillora

**Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient:** «Completa el relleu de l'auditoria 1010 amb el defecte RSS confirmat i l'estat del pegat de marge; distingix prova pròpia, prova de Claude i candidat visual. Dona ruta, correcció mínima i prova d'acceptació.» Això evita interpretar un esborrany temporal com un informe acabat buit i no crea una falsa autoria de troballes visuals.

Per al nucli de tres IAs, l'ESTAT ha d'enllaçar l'informe vigent i indicar si és esborrany o lliurament. Cada reparació necessita hash i test del delta, i el contrast visual ha de registrar la mida CSS efectiva. Les capacitats disponibles de proves, navegador i documents persistents ho permeten ara; no tinc evidència d'una novetat recent del model. No s'han activat agents ni automatitzacions addicionals.
