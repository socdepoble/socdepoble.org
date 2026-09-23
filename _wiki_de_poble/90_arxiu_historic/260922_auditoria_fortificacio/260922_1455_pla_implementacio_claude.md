---
type: document
status: esborrany
description: Cua ordenada de reconstruccio del Cervell que complementa el pla de Codex 0643, amb les sis troballes que no cobrix
tags:
  - implementacio
visibility: private
reflex: sdp:torn_bd8aab94-5d17-4c48-be88-722b8d7cebda:3cebe21d-e475-4571-bb2b-eaa75b2d2a75
---
# Pla complementari: el que el pla de Codex no cobrix

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bd8aab94-5d17-4c48-be88-722b8d7cebda:3cebe21d-e475-4571-bb2b-eaa75b2d2a75 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T14:48:20.022Z |
| Modificació | 2026-09-22T14:48:20.022Z |
| Propietari | Claude Opus 5 (agent local) |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 10570e52098d2166ea54a6085580c3a0e1dee75c35f5090a2cda493aedf9e197. El rebut acredita entrega, no comprensió.

## Historial

2026-09-22T14:48:20.022Z: esborrany creat amb rebut del torn `torn_bd8aab94-5d17-4c48-be88-722b8d7cebda`.
2026-09-22T15:05:00.000Z: contingut tancat. Complementa el pla `260922_0643_pla_implementacio_cervell` de Codex; no el substituïx.

**Nota sobre el nom d'este fitxer.** Diu `1455` i es va crear a les `1648` locals: vaig convertir malament l'hora. **No el reanomene, i el motiu és una troballa de l'auditoria germana.** El rebut `3cebe21d…` està emés contra la ruta exacta `…/260922_1455_pla_implementacio_claude.md`. Si el reanomene, `checkTurn` buscarà el fitxer vell, no el trobarà i marcarà «Document eliminat sense relleu»: el torn quedarà mort per sempre, com els cinc que ja ho estan (O-2). Que el nom quede mal escrit costa dos hores de desfasament; corregir-lo costa la traçabilitat sencera del torn. **Ho deixe com a evidència viva: el sistema no permet corregir un error menut sense cometre'n un de gran.** El pla P-2 d'ací baix arregla exactament això.

## Canvis proposats

Estat: **proposta, no implementada.** `requires_human_decision: false` per a redactar-la, segons l'encàrrec del Mestre.

Este pla **no substituïx** el de Codex (`260922_0643_pla_implementacio_cervell`). El seu és bo i la seua seqüència —autoritat, generació, regularització, relleu, successió— és la correcta. Ací hi ha només dos coses: **una esmena d'ordre** i **sis forats que el seu pla no cobrix perquè la seua auditoria no els va vore**.

### P-0 · L'esmena d'ordre: la Fase 5 de Codex va primera

Codex deixa la prova de successió en clon net l'última. Ha d'anar **la primera**, en sec, abans de tocar cap fitxer. Motiu: és l'única prova que mesura el que el Mestre ha preguntat, i ara sabem que **fallarà a la primera passa** per A-1 (ni skills ni registres de torn versionats). Tot el que es faça abans d'eixa prova és endevinar.

Procediment: `git clone` a un directori temporal, `npm ci`, i intentar en eixe ordre: llegir les skills, obrir un torn, crear un document, validar-lo i fer un commit. Anotar on es trenca cada passa. **L'ordre de les fases 1-4 de Codex l'escriu eixa llista, no nosaltres.**

Acceptació: existix un document amb la llista literal de passes i el punt exacte de ruptura de cadascuna.

### P-1 · Rescat de la zona humana, i vigilància (O-1)

1. `git checkout HEAD -- "_wiki_de_poble/04_escriptori/01_produccio/"` recupera els dos documents desapareguts. **Requerix la paraula del Mestre**: és la seua carpeta.
2. A `tooling/documental/turns.mjs:17`, traure `01_produccio` del conjunt d'exclusions i inventariar-la **només com a hash**, mai el contingut. A `checkTurn`, convertir la guarda morta de la línia 151 en una comparació real contra l'inventari inicial.

Acceptació: una prova que esborra un fitxer de `01_produccio` dins d'un torn i exigix que `checkTurn` torne roig amb el nom del fitxer. Ara mateix eixa prova passaria en verd, que és el defecte.

`requires_human_decision: true` per al punt 1.

### P-2 · Que el torn sobrevisca al moviment d'un document (O-2)

1. `turns.mjs:140`: `fs.existsSync` abans de `hashFile`, i acumular «Pla absent o modificat» en compte de llançar. Que `checkTurn` no puga morir mai per un ENOENT.
2. Un relleu de rebut: quan un document canvia de ruta (arxivat, promoció a `10_actes`), que el registre del torn accepte la ruta nova conservant la identitat. Sense això, higiene i traçabilitat es destruïxen mútuament.
3. Acotar `changed` als camins que el torn ha tocat, no a tot el que s'haja mogut al repositori mentre estava obert. Ara qualsevol agent embruta el torn dels altres dos.

Acceptació: moure un document a l'arxiu dins d'un torn obert i que `tancament.mjs --check` diga per què, amb el nom del fitxer, i puga tancar-se després del relleu. I una prova que renomene un document i exigisca que el torn sobrevisca — la que hauria evitat el nom d'este mateix fitxer.

### P-3 · Que el Somiador respecte la taula (O-3)

Abans de moure res, `somiador.mjs` ha de llegir `.agents/runtime/turns/*.json` i **excloure tot fitxer que siga `plan.file` o `receipts[*].file` d'un torn no tancat**. Quatre línies. Amb això, «pendent de revisió» deixa de ser una frase de la skill i passa a ser una condició del codi.

Acceptació: amb els documents d'esta sessió a l'Escriptori i els torns oberts, una execució en sec del Somiador no ha de moure'n cap.

### P-4 · Que la plantilla siga el contracte (O-4, O-5)

1. Els encapçalaments del cos de cada plantilla han de ser **exactament** les seccions de la seua ruta a `protocolledge.json`. Per a `prompt_local.md`: afegir `Historial` i `Tasca`, i deixar el títol de l'Olivera amb l'apòstrof tipogràfic i sense parèntesis.
2. Una porta que compare les dues llistes per a les 13 rutes i pose roig quan divergisquen. **Esta porta és la que hauria evitat la setmana de MarIA.**
3. `--help` a `document.mjs` amb les quatre banderes i les 13 rutes; la línia completa a la skill; i `obrir_torn.mjs` que deixe el `turn_id` en un fitxer que es puga llegir després. Esborrar `.agents/TORN_ACTIU.json`, que ara enganya amb un identificador de format mort.

Acceptació: una prova que canvie un encapçalament d'una plantilla i exigisca eixida 1. I que `document.mjs --help` liste les rutes.

### P-5 · Les dues lleis criptogràfiques, dins de la cadena (O-7, A-3)

`verify-ledger.mjs` i `segella.mjs` existixen, funcionen i **no els crida ningú**. Ficar-les a `environmentChecks` de `tancament.mjs`, i que la signatura del LEDGER es faça **dins de la mateixa operació que tanca el torn**, no com un pas que l'agent ha de recordar. Ara mateix les dues estan roges: el segell de la Llei Z trencat i el LEDGER amb quatre signatures soterrades.

Acceptació: `tancament.mjs --check` ix roig mentre el segell o la signatura no quadren, i verd després de resegellar.

### P-6 · Les nou guardes mudes (A-2)

Substituir a nou fitxers la comparació concatenada per `process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href`, que ja és la forma que usen `tancament.mjs`, `porta-reflex.mjs` i `porta-documents.mjs`. Prioritat: `tractor-manifest.mjs` i `matrix.mjs`, perquè són portes de la cadena i ara ixen verdes sense executar res.

Acceptació: una prova que execute cada porta des d'un directori amb un espai al nom i exigisca que parle. I revisar `tractor-arrel.mjs`, que **ensenya a escriure la forma trencada**.

### P-7 · Que el clon net arranque i que el README no òbriga forats (A-1, A-4)

1. Versionar `.claude/skills/` (git guarda els symlinks com a mode 120000) o regenerar-los amb un `postinstall`.
2. Decidir si `.agents/runtime/turns/` es versiona. Si no, llevar la porta que exigix el rebut en clon: no es pot exigir una prova que s'ha decidit no guardar.
3. README: substituir la taula de quatre SQL per «executa tots els fitxers de `supabase/migrations/` per ordre alfabètic i després `supabase/seed.sql`». Ara mateix el README alça una base de dades **sense les correccions de RLS ni de privacitat**.
4. Afegir-hi la secció que no existix: com es fa un canvi i com es tanca, amb el hook de `pre-commit` nomenat i la seqüència real del torn.

Acceptació: la prova P-0 repetida després d'estos canvis arriba fins al commit.

## Verificació

| Fase | Prova que ha de passar de roig a verd |
| --- | --- |
| P-0 | Clon net: llista literal de les passes i del punt de ruptura de cadascuna |
| P-1 | Esborrar un fitxer de `01_produccio` dins d'un torn → `checkTurn` roig amb el nom |
| P-2 | Arxivar el pla d'un torn obert → diagnòstic amb nom propi, mai ENOENT; i relleu que permeta tancar |
| P-3 | Somiador en sec amb torns oberts → zero fitxers moguts |
| P-4 | Canviar un encapçalament de plantilla → porta en roig; `document.mjs --help` llista les 13 rutes |
| P-5 | Segell o signatura trencats → `tancament.mjs --check` en roig |
| P-6 | Cada porta executada des d'un camí amb espais → parla i falla quan ha de fallar |
| P-7 | Clon net → `npm ci`, skills presents, document creat, validat i commit acceptat |

Cap fase es dóna per bona amb un verd d'esta màquina. **La mesura que val és la de P-0 repetida**, perquè és l'única que no depén del que ja tenim instal·lat al portàtil del Mestre.

## Riscos

El risc principal és el de sempre en esta casa: **tocar el contracte mentre hi ha documents vius que en depenen**. Per això P-2 va abans que P-4: primer que el torn sobrevisca al moviment, després que la plantilla canvie.

El segon risc és l'arbre compartit. Ara mateix escrivim tres agents alhora i els torns es contaminen entre ells (O-2). Mentre P-2 no estiga feta, qualsevol fase s'ha de fer **amb un sol agent escrivint**, fixant els hash dels fitxers objectiu abans de començar i aturant-se si canvien.

El tercer és la temptació de fer verd abaixant la porta. Cap fase d'este pla afluixa cap validació: totes n'afigen. Si alguna cosa ha de quedar roja, que quede roja i visible.

Descartat expressament: refer la taxonomia de carpetes (no resol cap contradicció i trenca tots els enllaços) i executar el Somiador per a «deixar net» abans de començar (és precisament el que mata els torns).

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
