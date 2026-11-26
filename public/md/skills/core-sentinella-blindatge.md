---
type: skill
name: core-sentinella-blindatge
status: actiu
description: Audita el perímetre HTTP/TLS, capçaleres, exposició anònima i literals públics amb la sentinella bounded. Usa-la per revisar salut o preparar una ronda de vigilància; no desplega, repara ni envia avisos.
tags:
  - seguretat
  - tractors
triggers_on:
  - sentinella de blindatge
  - auditar perimetre http
  - verificar tls i capcaleres
contracte.llig:
  - AGENTS.md
  - firebase.json
  - public
  - tooling/gates/tractor-sentinella-blindatge.mjs
  - tooling/gates/literals-secrets-node0.mjs
  - tooling/gates/tractor-sentinella-blindatge.test.mjs
  - tooling/gates/tractor-sentinella-blindatge.http.test.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
motors:
  - tooling/gates/tractor-sentinella-blindatge.mjs
---
# Sentinella de blindatge

1. Executa la lectura local amb `node tooling/gates/tractor-sentinella-blindatge.mjs --json`. Inspecciona els resultats i l’abast: la inspecció limitada de literals públics no prova que no hi haja cap secret. No llig `.env`, claus ni logs privats.
2. Per a una ronda remota autoritzada, usa `node tooling/gates/tractor-sentinella-blindatge.mjs --json --remot`. La sonda només fa GET a HTTPS/443 dels dos orígens propis. El fitxer opcional `--config=<ruta-relativa>` admet exclusivament `supabaseUrl` d’un projecte Supabase i `publishableKey` pública (`anon` o publishable); mai una sessió d’usuari ni una clau elevada. No inclogues valors de credencial als informes.
3. Cada ronda comprova quatre rutes de salut i, amb configuració pública, huit taules privades. No crida RPC, Storage LIST, POST, bot de WhatsApp ni models del Node 0. El pressupost és de 16 peticions i 2 MiB acceptats per ronda, concurrència 2, zero reintents/redireccions, 8 segons per petició i 60 segons per ronda. Les respostes es compten durant la recepció; el chunk que activa el límit pot haver arribat al socket abans de tancar-lo.
4. Interpreta les observacions: files privades retornades són una troballa; `200 []` i `404` deixen RLS desconegut. `401/403` amb codi de permisos només acredita la denegació observada, no totes les polítiques. Distingix errors d’API key, transport i pressupost de regressions confirmades. CORS no substituïx RLS; `ACAO: *` és admés als perfils JSON i assets públics, no al perfil HTML.
5. El codi d’eixida és `0` per observacions completades sense fallades dins de l’abast, `1` per una troballa i `2` per ús invàlid o cobertura inconclusiva. El JSON conserva `rlsPolicyVerified:false`, `secretAbsenceProven:false` i facturació global desconeguda. No ho convertisques en un certificat de disponibilitat, cost cloud o resistència a DDoS.
6. Lectura local per blocs (v1.2.23 · L4-03b): només els JS del build dins de `dist/` (`.js`, `.cjs`, `.mjs`) de més de 2 MiB i fins a 16 MiB que no són actius registrats es lligen per blocs d’1 MiB, amb una cua solapada de 64 Ki caràcters, perquè cap literal llarg quede partit entre finestres. Van darrere dels textos menuts, sense gastar-ne el pressupost, i tenen un pressupost propi de 16 fitxers i 64 MiB per lectura. Si el pressupost s’esgota, el resultat és inconclús (`unknown`, `LOCAL_LIMIT`), mai verd ni fallada inventada. Un byte nul o un UTF-8 invàlid vol dir que el fitxer no és text, i continua bloquejant. `public/`, la passada d’integritat de `public/`, la resta d’extensions textuals i tot fitxer per damunt de 16 MiB mantenen R32.43: si són grossos i no són al registre, bloquegen (`static-file-oversize-unregistered`). El JSON local ho declara a `localSecrets.blockScanned` (`{ files, bytes }`, el que s’ha llegit per blocs), i eixos fitxers també compten a `coverage.literals`. La lectura per blocs amplia l’abast, però no prova que no hi haja cap secret (`secretAbsenceProven:false`).

## Recepta per a l’operador del Node 0

Des d’una còpia revisada del repositori, l’operador pot executar `node tooling/gates/tractor-sentinella-blindatge.mjs --json --remot --config=<ruta-relativa> --iterations=3 --interval-ms=300000`. És un procés finit de tres rondes separades cinc minuts: màxim total 48 peticions, 6 MiB acceptats i 13 minuts. El comptador total no es reinicia entre rondes. No instal·les cron, launchd, timers ni serveis a partir d’esta recepta.

L’eixida prepara un indicador d’avís però sempre declara `sent:false`. L’entrega real a un canal, la programació continuada i qualsevol reparació requerixen un encàrrec i una verificació separats. Si el servei no respon o el resultat és incert, conserva el rebut redactat i el límit observat; no reinicies PostgreSQL ni bloqueges IPs.

## Fonts i comprovació

Els contractes executable i els límits viuen al motor i a les dues proves Node declarades. Per a la semàntica del protocol, consulta [HTTP](https://www.rfc-editor.org/rfc/rfc9110.html), [Node TLS](https://nodejs.org/api/tls.html) i [Node DNS](https://nodejs.org/api/dns.html#resolvercancel). Les comprovacions de catàleg, fronteres i segell del repositori validen metadades diferents del comportament de xarxa.

## Vincles
- [[00_INDEX_SKILLS]]
