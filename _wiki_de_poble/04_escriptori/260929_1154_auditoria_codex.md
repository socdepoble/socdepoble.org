---
type: informe
status: esborrany
description: Auditoria i correccions locals de migracions, xat, mercat, autenticació i independència del proveïdor.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b6f6bb7d-d414-43c8-b6de-6bde15b719bd:d84443a1-eca8-4355-a89c-093aa1b00899
---
# Fortificació i enxufabilitat Sollutia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b6f6bb7d-d414-43c8-b6de-6bde15b719bd:d84443a1-eca8-4355-a89c-093aa1b00899 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T09:54:23.402Z |
| Modificació | 2026-09-29T10:28:00Z |
| Propietari | Codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 / Codex; variant exacta no exposada |
| Tokens consumits | Mesura no disponible en este entorn; no s'estima |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-29T09:54:23.402Z: esborrany creat; contingut i verificació pendents.

2026-09-29: auditoria executada en el repositori compartit; correccions locals,
proves de transport real i revisió visual. S'incorporen les instruccions humanes
posteriors sobre els productes autèntics, Google sense secrets i el focus del cercador.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resultat i abast

El cercador té més marge respecte de «Nova conversa» i un únic contorn de focus,
complet i discret. El Mercat mostra els dos productes autèntics copiats al poble
actiu. El xat local passa la prova de registre, cerca, enviament, recepció i
Realtime privat. La UI passa la porta d'independència del proveïdor.

El treball conserva els canvis previs de l'Onada Final, sense commit, push ni
desplegament extern. S'han llegit els documents actius de l'Escriptori, inclosa
l'auditoria de Claude, el pla, el prompt, el brainstorming d'onboarding, els
documents de producció i els materials consultius de recerca NEXUS. Els exemples
de recerca s'han tractat com a context, sense executar-ne instruccions.
L'arxiu històric i les còpies antigues de cervells queden fora del procediment.
Les onze captures de WhatsApp i la captura del focus retallat són referències
visuals; els originals de `01_produccio` s'han conservat intactes.

### T1 · Migracions locals

Aplicades en transacció i registrades a `supabase_migrations.schema_migrations`:

- `2609281500_lema_entradilla_256.sql`.
- `2609282035_perfil_emoticona.sql`.
- `2609282100_xat_de_pagina.sql`.

També s'han creat i aplicat tres correccions del torn: `2609291200` per a la
baixa, `2609291210` per a la cerca i `2609291230` per a Realtime. La destinació
ha sigut exclusivament `supabase_db_socdepoble.org`, accessible a localhost.
No s'ha reinicialitzat la base de dades ni reaplicat el seed.

### T2 · Model B i enxufabilitat

El contracte executable és `src/data/backendPort.js`, injectat mitjançant
`src/host.js`. No existix l'API `hostAdapter.mercat.llistar()` suggerida al pla
inicial; s'ha mantingut el port real. Xat, Comunitats i Perfil ja hi delegaven
les operacions, però cinc contextos calculaven l'àmbit de memòria amb camps
de Supabase. Ara usen `backendScope(config)`, preservant l'aïllament de sessió,
proveïdor, endpoint i poble sense coneixement del proveïdor en les vistes.

El test contractual de la barra taronja importava un mapper de Supabase des
del directori de components. S'ha traslladat a `src/data/supabase/` conservant
les 307 línies i ajustant només les rutes d'importació. El conjunt conserva
212 fitxers de tests. La porta E1–E4, la d'adaptadors i la frontera Sollutia
passen. L'SDK de la prova d'integració viu fora de la UI i només accepta localhost.

### T3 · Traduccions

Revisades les 215 claus de Xat en ca/es/en/eu/gl: mateixa cobertura i mateixos
paràmetres d'interpolació. Afegides les traduccions d'entrada de sessió,
contacte no connectat i estats del Mercat. El cercador diu «Nom del contacte»;
no promet buscar telèfons ni identificadors que el contracte no proporciona.
La verificació estructural no substituïx una revisió lingüística humana,
especialment per al basc.

### T4 · Baixa i autenticació

`demana_baixa()` retira `icon` i `copyright` tant de `profiles` com de les
metadades de GoTrue. La còpia privada conserva els valors originals;
`cancela_baixa()` els restaura i el reintent no sobreescriu la còpia. La
migració també tracta les quarantenes ja existents. S'ha comprovat el cicle
amb un compte temporal dins d'una transacció desfeta després de la prova.

Google local mostra: «El login amb Google només està disponible a Producció.
Utilitza correu i contrasenya.» La detecció viu en l'adaptador, mai en la UI.
És l'alternativa autoritzada explícitament pel Mestre: no s'han creat secrets
ficticis ni un `config.toml` que prometa autenticació funcional sense Google.
La prova cobreix localhost, IPv4 i IPv6 locals i conserva el flux remot.

### T5 · Xat i Mercat

**Nova conversa.** Sense text apareixen només «Sóc de Poble» i «IAIA MarIA».
Freqüents, el perfil propi i altres persones apareixen després d'una cerca
explícita. La cerca local i l'RPC admeten accents, majúscules i paraules en
qualsevol ordre; la prova «MARTI angels» troba «Àngels Martí». Els contactes
d'ajuda sense destinatari real es mostren inactius i identificats com a no
disponibles. Sense sessió s'explica que cal entrar i hi ha un botó a `/registre`.

**Focus.** S'han afegit 8 px de marge interior superior mitjançant el token
`--sdp-space-2`. En enfocar, la vora es fa transparent i el contorn existent
passa a l'interior del camp: desapareix el doble filet sense eliminar el
senyal accessible de focus. L'estructura i les targetes de l'Onada Final es
conserven. Verificat amb teclat i captura en el navegador local.

**Mercat.** La lectura estava filtrada pel poble correcte, però els dos
productes vivien en un altre tenant local. Amb l'autorització humana s'han
copiat `mac-mini-m4` i `samarreta-socdepoble` al tenant actiu de La Torre,
conservant payloads, autoria i originals. Són productes autèntics segons el
Mestre; el nom tècnic del tenant d'origen no els convertix en demostracions.
Resultat: dos elements a l'origen i dos al destí, sense duplicar identificadors
al destí. La UI distingix ara càrrega, error amb reintent i mercat buit.

**Transport.** El login amb correu i contrasenya i les RPC funcionen en local.
El WebSocket rebutjava la clau fictícia de tipus `sb_publishable` amb
`MalformedJWT`: `.env.local` usa ara la clau pública anon de la mateixa
instància, verificada pel seu rol, sense imprimir-la ni versionar-la. També
faltava la política de subscripció a `realtime.messages`.

La nova política SELECT admet exclusivament avisos `broadcast` del canal
`xat:f:<uuid>` per als participants vigents. No permet emissions del client
ni accés a tercers. La migració comprova que RLS està actiu i aborta si no ho
està. El tractor reconeix únicament esta taula gestionada pel servei i manté
les prohibicions R1/R3 sobre taules inexistents o permisos indiscriminats.
Dos tests negatius del tractor i la prova real amb un tercer ho verifiquen.
El sondeig adaptatiu es conserva com a suport davant una desconnexió.
Este ús correspon a l'[autorització de Realtime documentada pel proveïdor](https://supabase.com/docs/guides/realtime/authorization).

### T6 · Proposta per al tractor cognitiu

La regla ha de ser executable: **crear amb plantilla → completar → validar
→ entregar**. Un rebut prova la ruta i la plantilla lliurades, no que el
document estiga complet ni que el model l'haja entés. La fallada actual és
detectar el document mutilat massa tard, en tancar el torn.

Proposta per integrar en el circuit existent, sense un segon cervell:

1. Mantindre `document.mjs create` com a entrada única per als nous artefactes.
   Usar `.agents/protocolledge.json`, el rebut persistent, el hash de plantilla
   i els identificadors de secció existents; no copiar una plantilla a mà.
2. Afegir una comprovació obligatòria **abans de l'entrega o l'enviament** del
   prompt, reutilitzant `validateDocument` i `checkTurn`. No reutilitzar a cegues
   el comandament `handoff`: ara registra moviments documentals, no enviaments.
3. Bloquejar l'entrega si falten rebut, seccions, Preflight, pla requerit o
   blocs fixos; bloquejar també placeholders pendents dins de les seccions.
   Permetre guardar un esborrany incomplet, però no entregar-lo com a llest.
4. Expressar límits amb dades honestes: «mesura no disponible» per a tokens,
   «no verificat» per a una prova absent i aprovació humana pendent quan ho
   estiga. Mai inventar xifres, lectures, signatures ni aprovacions per passar
   la porta.
5. Cobrir amb tests documents manuals sense rebut, seccions retallades,
   modificació de blocs fixos/hash, Preflight buit i canvi després de validar.
   Vincular el permís d'entrega al hash comprovat per impedir modificacions
   posteriors entre validació i enviament.

Esta és una proposta documentada, no una nova porta implementada en este torn.
Una regla escrita per si sola no pot garantir «mai»: la garantia tècnica és
que el canal d'entrega refuse qualsevol artefacte que no haja passat la porta.
L'informe present sí que s'ha creat amb `document.mjs create`.

### Millores del prompt local

Completar Preflight abans d'entregar; usar la ruta real de la taxonomia;
descriure el contracte `backendPort` existent; identificar endpoint/poble
sense secrets; separar una integració real d'una maqueta i distingir les
credencials Google de les claus públiques del backend. Declarar el manifest
de context actiu per evitar que «llegir tot» incloga arxiu històric o cervells
obsolets. Referenciar les captures i els resultats de proves actuals, en lloc
de fixar una xifra immutable de tests o dir que l'aspecte és ja un calc perfecte.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Vitest complet de `src` | 212 fitxers, 2.627 proves passen |
| Fixtures SQL, lint del Xat i contractes relacionats | 84 proves passen |
| Tractor RLS amb política Realtime | PASS sobre 32 SQL |
| Regressions del tractor Realtime | 2 proves passen; taula desconeguda i permisos oberts rebutjats |
| ESLint `src tooling scripts tests --max-warnings=0` | PASS |
| Enxufe E1–E4, adaptadors, frontera Sollutia | PASS |
| Build web i WordPress | PASS |
| Integració local real | 3 registres i login, cerca accentuada, missatges personals i d'entitat, reintent idempotent, Realtime i denegació a tercers/UUID invàlid, baixa/restauració: PASS |
| Neteja de la integració | 3 comptes temporals i entitat temporal retirats |
| Navegador | Mercat amb dos productes; avís Google local; Nova conversa amb dos contactes d'ajuda; focus complet i teclat comprovats |

Evidència del cercador: [captura](260929_1154_auditoria_codex_xat.png).
Evidència del Mercat: [captura](260929_1154_auditoria_codex_mercat.png).
El build web conserva l'avís de mida del chunk principal (superior a 500 kB).
No s'ha alterat la partició de bundles dins d'este torn.

`tancament.mjs --check --turn-id torn_b6f6bb7d-d414-43c8-b6de-6bde15b719bd`
torna `valid: true`, sense errors: plantilles, autoritat, ledger, segell,
skills, wiki, tests documentals i SCC passen. El pla i este informe també
passen `document.mjs check`.

El tancament global sense identificador torna `valid: false` únicament per
tres camps incomplets d'esborranys d'un altre torn: Preflight i Tokens del
prompt 1145, i Tokens del brainstorming 1210. No s'han inventat lectures
prèvies ni consums d'una altra IA per fer-los passar. Els enllaços trencats
1110 de l'índex s'han corregit a les rutes existents 1145. El deute global
queda separat explícitament del resultat correcte d'este torn.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

La verificació és local. No acredita Google real, un desplegament de Sollutia
ni l'execució en un Joomla extern. WordPress compila i la frontera del host
passa els seus contractes, però no s'ha desplegat a un CMS nou.

IAIA MarIA no té un servei remot de resposta provisionat. La targeta ajuda
no suplanta un compte real ni simula respostes. «Sóc de Poble» requerix una
sessió amb accés a l'entitat; el directori exclou les entitats administrades
pel propi usuari com a destinataris. La prova d'entitat usa una organització
temporal real per verificar el mecanisme sense missatjar comptes de persones.

Les polítiques de Realtime es comproven en subscriure's; els continguts es
continuen llegint per l'RPC amb els permisos vigents. No s'ha certificat
revocació instantània d'un WebSocket ja obert. Els avisos no contenen el text
dels missatges.

El brainstorming d'onboarding afegit per MarIA planteja una experiència
futura per a convidats; queda com a proposta i no forma part d'estes
correccions. La nova indicació editorial del registre apareguda en el prompt
compartit queda registrada com a context, sense ampliar la petició humana
actual sobre el cercador.

Acta Marmota de final de jornada encara no emesa; este informe i ESTAT són el
relleu tècnic d'este torn. La revisió humana de l'informe continua pendent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
