---
type: document
status: actiu
description: "Prova de fum dels avisos push de la v1.2.25: preparació local del material staged, contracte del rebut privat del canari i límits de la diagnosi 132/135. L'eina no envia cap avís ni activa cap bandera."
---
# Prova de fum Push v1.2.25

Consumidor: Claude, carril d'integració. Esta eina no envia cap avís ni activa cap bandera.

1. Executa `supabase/snippets/v1225_sonda_132_135_push_readonly.sql` en connexió dedicada de lectura i conserva el JSON i el SHA del fitxer. La taula productiva de subscripcions és `public.xat_dispositius_push`; el nom genèric `push_subscriptions` es declara només si existeix.
2. Executa `node tooling/push/prova-fum.mjs --sense-ia --staged-dir /ruta/privada/staged`. Valida el material staged i firma/verifica JWT locals amb els constructors productius de Web Push, APNs i FCM. Sense rebut real, acaba amb codi 2: és preparació local, no una prova d'entrega.
3. Des del circuit canari autoritzat del carril 1, obtín una subscripció nova i un missatge canari per canal. Correlaciona un `runId` UUID aleatori amb l'encuament, el worker, la resposta del proveïdor, l'ACK i l'observació al dispositiu. La prova ha de ser recent i els temps han de créixer. No guardes tokens, endpoints, claus ni text del missatge al rebut.
4. Guarda un rebut privat `0600` amb el contracte següent i executa `node tooling/push/prova-fum.mjs --sense-ia --staged-dir /ruta/privada/staged --receipt /ruta/privada/rebut.json --run-id UUID`.

El rebut té `format: sdp.push.smoke-receipt.v1`, `mode: real`, `runId`, `database`, `worker` i `channels`.

- `database`: `table: public.xat_dispositius_push`, `rls`, `sessionCascade`, `enqueueTrigger`, `claimRpc`, `ackRpc`; els cinc booleans han de ser `true`, observats a la sonda.
- `worker`: `httpStatus: 200`, `attempted: 3`, `accepted: 3`, `failed: 0`, `unauthorized: 0`, `untried: 0`, `withoutProvider: 0`.
- Cada element de `channels`: `channel` (`web`, `ios`, `android`), `runId`, `messageId` UUID, `subscriptionSha256`, `deviceSha256` diferents per canal, `relayStatus: 202`, `providerStatus` (web 200/201/202; APNs/FCM 200), `ack: acceptat`, `subscribedAt`, `enqueuedAt`, `providerAcceptedAt`, `displayedAt` ISO i `displayedRunId` igual al canari. Tots els temps dins dels darrers 15 minuts.

Un rebut coherent continua sent evidència aportada per l'operador, no una observació independent d'esta eina. `deviceDeliveryVerified` i `activationAuthorized` es mantenen sempre en `false`. El carril 1 conserva la responsabilitat de verificar físicament l'entrega i decidir l'activació. Qualsevol `401`, falta d'ACK, dispositiu no observat, canal absent o intent sense proveïdor reté el canari.

La reconciliació SQL s'obté de `preparaReconciliacio132135()` en `tooling/gates/lib/v1225-reconciliacio132135.mjs`. Combina els dos originals fixats per SHA en una sola transacció amb locks NOWAIT. No crea dependències absents ni accepta nous cossos de funcions. La sonda informa absències sense fallar; `avaluaSonda132135()` retorna `ready: false` quan la foto no acredita els prerequisits. Fins i tot amb `ready: true`, les guardes SQL tornen a comprovar el rebut i el catàleg dins de la transacció.

El SQL generat viu com a snippet atòmic, no com una migració nova del ledger: substituir l'ordre de desplegament per un no-op que marque 132/135 com aplicades emmascararia l'absència de R22.3. Després d'un COMMIT real verificat, el carril 1 reconcilia separadament el registre de migracions amb els originals exactes; esta eina no ho modifica.

## Prerequisits i límit de la diagnosi 132/135

La 132 exigix, a més del rebut R32.44/R32.46 vigent, les 78 FK canòniques i totes les taules dels seus locks. `public.app_content_historial` ve de `2610101900_personalitzacio_superadmin.sql`; `private.trigger_rate_limit_xat()` ve de R22.3 (`20261114000200_r22_3_sostres_de_volum.sql`). Un rebut R32.44 present no substituïx aquests prerequisits. No s’activen ni es creen dependències absents.

La sonda renovada inventaria les taules obligatòries i condicionals i projecta identitat/definició/columnes/destí de les FK, només des de pg_catalog. L’avaluador deriva el contracte de la 132 fixada per SHA: una taula obligatòria absent, una FK canònica absent o una definició diferent retenen `ready`. Els 10 objectius observats només a Producció conserven la política d’absència local explícita de la 132. Cal tornar a capturar la sonda; un JSON antic o incomplet no acredita aquesta diagnosi.

`ready` continua sent una diagnosi de prerequisits, mai autorització ni certificació de Producció. El rebut CAS viu, col·lisions d’índexs/polítiques, ACL després del REVOKE i concurrència continuen protegits pel SQL dins la transacció. La reconciliació, els seus locks, els dos originals i les guardes/ACL/LSSI queden idèntics.

## Vincles

- [[00_index]]
