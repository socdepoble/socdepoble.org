---
type: skill
status: canonic
description: Core skill per a restauració segura
tags:
  - core
name: core-restauracio-segellada
triggers_on:
  - restaura
  - restaurar
  - còpia de seguretat
  - copia de seguretat
  - backup
  - torna arrere
  - tornar arrere
  - revertir
  - revert
  - rollback
  - checkout
  - restore
  - recupera la versió
  - recuperar versió
  - com estava abans
  - git checkout
  - git reset
  - git revert
core: true
eines_obligatories: tooling/brain/desenterrar.mjs
contracte.llig:
  - AGENTS.md
  - .agents/protocolledge.json
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# Restauració segellada

## Àmbit

Procediment per a substituir un fitxer per una revisió de Git. La ruta executable
única és `tooling/brain/desenterrar.mjs`; `tooling/scripts/desenterrar.mjs` està
retirada i no restaura res. Integrar un pegat de desenvolupament aprovat no és
restaurar contingut històric.

## Contracte verificable

La inspecció resol `--ref` a un commit immutable i no escriu. El segell de 64
caràcters és SHA-256 dels camps següents, separats amb NUL i en este ordre:

```text
sdp.desenterrar.segell.v3
commit resolt
HEAD actual
ruta canònica relativa al repositori
mode Git de la revisió (100644 o 100755)
SHA-256 dels bytes de la revisió
SHA-256 dels bytes actuals, o (absent)
mode actual en octal sense prefix, o (absent)
```

No inventes el segell ni reutilitzes el contracte antic. Un canvi de HEAD,
commit, bytes, mode o existència del destí invalida el segell. Abans de copiar
i abans del rename, el CLI torna a comprovar HEAD, bytes, mode i identitat
física del destí. El control és local: no bloqueja altres processos ni substituïx
la coordinació amb els altres agents.

La inspecció mostra commit, data de la revisió, hashes, modes, estat de Git,
segell i diff de la revisió cap al disc. **No calcula la data real del blob,
el radi semàntic ni el retorn automàtic:** són verificacions del responsable.

## Fase 1 — Inspecció i preservació de feina

```bash
git status --short -- <ruta>
git rev-parse HEAD
node tooling/brain/desenterrar.mjs --ref <sha> --fitxer <ruta>
```

La ruta es resol des del directori actual i ha de pertànyer físicament al mateix
repositori. No s'admeten symlinks, hardlinks, submòduls ni la paperera com a
destí. Treballa preferentment des de l'arrel i usa el commit resolt imprés.
Si hi ha canvis locals, no faces stash ni els perdes automàticament.
`--forca` només permet continuar amb eixos canvis quan l'autorització humana
inclou explícitament substituir-los; la còpia prèvia continua sent obligatòria.

## Fase 2 — Revisió i autorització

Explica què desapareix del disc en restaurar la revisió: exportacions, crides,
contractes, proves i canvis locals. El diff imprés té sentit revisió → disc;
revisa també el sentit de la substitució. Contrasta el contingut, no el nom
del commit. Mostra el candidat i les pèrdues abans de sol·licitar una decisió
que encara falte. Una ordre explícita anterior que aprove eixe mateix candidat
i abast continua vigent; un sí genèric no autoritza pèrdues que no s'han mostrat.

## Fase 3 — Lease i aplicació

L'aplicació requerix una lease vigent del Reflex amb operació
`restauracio-segellada` i scope mínim del destí. Seguix
`.agents/PROTOCOL_PETORRETA.md`: open, lectura de regles, bootstrap de dos
fitxers, seal i rebut. El rebut documental `sdp:…` no és esta lease.

```bash
node tooling/brain/desenterrar.mjs --ref <commit_resolt> --fitxer <ruta> --segell <segell> --rebut <rebut.json>
```

El CLI rebutja feina local per defecte. Si el destí existix, abans de substituir-lo
crea una còpia en `.sdp-paperera/`, sincronitza i rellegix els bytes, comprova
SHA-256 i mode, i escriu al costat un manifest `<destí>.restauracio.json` amb HEAD,
commit candidat, ruta, hash i mode previs. Si la còpia no es pot verificar, no
substituïx el destí. La revisió s'escriu amb fitxer temporal i rename i es
verifiquen bytes i mode abans de completar el claim. Un destí abans absent no
necessita còpia de bytes previs.

## Fase 4 — Verificació i retorn

Comprova el diff resultant, lint, proves i invariants funcionals afectats.
Conserva el camí de còpia i manifest que ha imprés el CLI. Si cal retornar,
prepara una nova operació autoritzada que llija la còpia i el seu manifest,
verifique `beforeSha256` i `beforeMode`, i respecte els canvis concurrents.
**No hi ha retorn automàtic ni una opció CLI de restaurar des de paperera.**
Si falla la verificació després d'una escriptura, la còpia queda disponible i
el claim incomplet requerix diagnosi; no es repetix a cegues.

El CLI no crea una àncora de tot el repositori, no preserva timestamps/xattrs
i no fa el commit. Quan es versione una restauració revisada, inclou
`RESTAURACIÓ-VALIDADA: <segell>` al missatge.

## Prohibicions

- No uses `git checkout <ref> -- <ruta>`, `git reset --hard` ni `git clean -fd`
  com a substituts d'este circuit.
- No substituïsques bytes abans de revisar les pèrdues autoritzades.
- No atribuïsques al CLI controls semàntics, històrics o retorns que no executa.
- Si el CLI, la lease, el segell o el CAS fallen, diagnostica i conserva l'estat;
  no restaures manualment per a esquivar la porta.

## Vincles

- [[00_INDEX_SKILLS]]
