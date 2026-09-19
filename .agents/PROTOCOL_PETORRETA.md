---
type: document
status: canonic
description: PROTOCOL PETORRETA
---
# Protocol executable de Petorretas i Acte Reflex

> **REGLA D'AUTOACTIVACIÓ:** Qualsevol menció de la paraula "petorreta" en qualsevol context de creació o modificació obliga a llegir aquest document completament abans de continuar. Aquesta regla s'aplica a ella mateixa: si estàs creant una petorreta i no has llegit aquest protocol, el teu primer acte és aturar-te i llegir-lo.

Esta norma és la font d’autoritat del Reflex. Els mirrors de la Wiki són còpies informatives i no poden substituir-la.

## P-01. Frontera d’efectes

La lectura, cerca, auditoria en memòria i impressió per stdout són lliures. Crear, editar, moure, eliminar, commitar o escriure un informe persistent és un efecte lateral i necessita una lease segellada. Hi ha tres límits explícits: l'activació local de P-10, el bootstrap mecànic de P-10 i els temporals/derivats de P-12.

## P-02. Risc alt

És risc alt qualsevol migració massiva, purga, quarantena, canvi d’esquema, canvi en `.agents/` o `03_GOVERNAR`, esborrat, rename, restauració, canvi de seguretat/privacitat o operació sobre més de cinc fitxers. El risc alt exigix Petorreta.

## P-03. Seqüència obligatòria

1. Executar `tooling/wiki/reflex_petorreta.mjs open` amb intenció, risc, operacions exactes i scopes mínims.
2. Llegir completament les regles que el Reflex imprimix.
3. Crear una Petorreta i un manifest de context nous com els únics dos fitxers dins del directori exacte `.sdp-reflex/bootstrap/<sessionId>/` que `open` ha reservat i imprés. No formen part dels scopes.
4. Incloure en la Petorreta els marcadors exactes `Reflex-Session`, `Intent-SHA256` i `Rules-SHA256`; per a l’Autoneteja, també `Plan-SHA256`.
5. Executar `seal` amb el nonce d’un sol ús.
6. Passar el rebut a cada script mutador. El mutador reclama internament un
   `claim` d'un sol ús, executa, el marca `completed` només després de verificar
   l'efecte i impedix qualsevol replay de la mateixa operació. Cap script pot
   implementar bypassos.
7. Verificar en dry-run i consumir el rebut després de l’operació correcta. Si
   el procés mor amb un claim incomplet, no es reintenta: es diagnostica
   l'efecte, es consumix o invalida la sessió i se n'obri una de nova. En
   Git, el `pre-commit` vincula el rebut a l’arbre preparat i només
   `consume-commit` el pot consumir després de comprovar arbre i pare del commit.

## P-04. Petorreta vàlida

La Petorreta mecànica d’una sessió del Reflex viu només en `.sdp-reflex/bootstrap/<sessionId>/`; les Petorretas editorials ordinàries continuen vivint en `04_ESCRIPTORI`. Usa `YYMMDD_HHMM_PROMPT_` i 8–12 paraules descriptives, declara `tipus: petorreta`, i conté Context, Tasques, Riscos i Criteris d’acceptació. No pot contindre placeholders editorials pendents.

## P-05. Context mínim i segur, però Típic i Íntegre (Sense Ocultació)

No es copia automàticament tota la Wiki. El manifest selecciona fonts rellevants amb `path`, `reason`, `classification` i `role` (`reference` o `target`). El Reflex limita el manifest a 25 fonts de text, 2 MiB per fitxer i 8 MiB totals; calcula hashes i rebutja binaris, duplicats, symlinks d’eixida i patrons bàsics de secrets, IBAN, correu, DNI/NIE i telèfon. És un filtre preventiu, no una garantia de redacció de tota PII; la revisió humana continua sent obligatòria abans de compartir context extern.
**REGLA CRÍTICA:** Queda absolutament prohibit ocultar fitxers de configuració estructurals (`package.json`, `vite.config.*`, manifestos o arxius de backend) o fer "estalvi de tokens" de forma deliberada quan es prepara una Petorreta d'Auditoria per al Consell. L'omissió de context provoca un diagnòstic fals, cec i incorrecte de la intel·ligència. La informació sempre s'entrega íntegra.

## P-06. Mínim privilegi

La lease queda vinculada a intenció, regles, Petorreta, manifest, HEAD, snapshot dels scopes, operacions, termini i, quan correspon, digest del pla. Cada operació no-Git només pot adquirir un claim; un claim no completat bloqueja el consum normal. Els targets passats pel mutador han de quedar dins dels scopes; per això els scopes no poden ser més amplis del necessari. Un pla d'Autoneteja vincula les accions exactes, i un commit queda vinculat a l’arbre exacte de l’índex, modes, diff i HEAD pare anterior. Una lease no autoritza operacions ni rutes fora dels scopes declarats.

## P-07. Fail closed

Qualsevol error de Git, I/O, YAML, hash, scope, parser, lock, context, signatura o concurrència acaba amb codi no-zero i zero escriptures noves. “No he pogut auditar” mai equival a “tot està perfecte”.

## P-08. Irreversibilitat prohibida

Una autoneteja usa snapshot, pla, backup durable, manifest, comprovació CAS, escriptura atòmica, verificació posterior i restauració. Un orfe amb contingut no s’elimina ni es mou automàticament. Només un buit físic pur, sense arestes, pot entrar en quarantena.

## P-09. Hooks i límit honest

El hook Git és l’última xarxa, no la primera. Audita una materialització temporal
de l’arbre preparat, mai una mescla amb el worktree. `--no-verify`, `commit-tree`,
un fast-forward o una reescriptura externa només es poden cobrir amb CI i
protecció de branca. L’HMAC local protegix contra oblit i corrupció accidental;
no contra un agent adversarial amb accés a la mateixa clau.

## P-10. Activació local i bootstrap únic

`tooling/wiki/reflex_petorreta.mjs init` és l'única excepció d'activació: de forma idempotent crea només l'estat privat ignorat `.sdp-reflex/` (directoris `0700`, clau `0600`) i configura `core.hooksPath=.githooks`. No autoritza cap altra escriptura ni convertix un `doctor` roig en verd. En CI, `doctor --ci` valida el sistema durable sense exigir estat o configuració locals.

`open` crea i vincula criptogràficament un directori nou i buit `.sdp-reflex/bootstrap/<sessionId>/`. Entre `open` i `seal`, eixe directori ha de conservar la mateixa identitat física i contindre exactament dos fills directes: la Petorreta i el manifest declarats, tots dos fitxers regulars, no symlinks ni hardlinks. Cap dels dos viu en la Wiki ni dins dels scopes. El snapshot dels scopes ha de ser idèntic segons el mateix contracte signat: exclou explícitament estat intern i derivats regenerables (`.git`, `.sdp-reflex`, `.wiki-safety`, snapshots, dependències i builds) i registra eixes exclusions en el rebut. Els `role: target` del manifest sí que han de quedar dins dels scopes.

L'arxiu massiu germà `_arxiu_wiki_de_poble` és custòdia humana externa i només lectura per als agents. El Reflex d'este repositori no accepta scopes, targets ni fonts fora de `socdepoble.org`. Crear, editar, moure o eliminar en eixe arxiu queda prohibit fins que dispose d'un repositori i Reflex propis; no s'amplia mai l'scope amb `..`.

## P-11. Durabilitat i verd honest

Existir al disc no equival a formar part del sistema durable. `doctor` ha de
comprovar que regles, scripts, hooks i workflow CI crítics són fitxers físics
vàlids i estan seguits per Git. Fins que un commit atòmic autoritzat els
incorpore, el diagnòstic correcte és roig encara que totes les proves locals
passen. Cap agent pot convertir eixe roig en verd relaxant el diagnòstic.

## P-12. Temporals i derivats reproduïbles

Les proves poden escriure exclusivament dins d’un directori temporal privat i
eliminar-lo al final. Un build o instal·lació pot generar `node_modules`,
`dist`, `_build`, cache o artefactes ignorats tant en local com dins d’un runner
CI descartable, sempre amb lockfile congelat quan siga aplicable i sempre que
no modifique fonts, lockfiles, índex Git, secrets, dades externes, publicacions
ni desplegaments. Els scripts de lifecycle no poden tindre efectes externs no
revisats. Eixos derivats no necessiten una Petorreta perquè no són estat
autoritatiu i es poden regenerar. Qualsevol promoció d’un derivat a font,
publicació o efecte extern torna immediatament a P-01.
