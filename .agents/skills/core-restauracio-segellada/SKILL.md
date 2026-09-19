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
eines_obligatories:
  - tooling/brain/ancora.mjs
---

# Restauració segellada

> **FUSIÓ 260831.** Esta skill absorbix `core-safe-restore`, que compartia
> el 100% dels seus triggers i era doctrinalment incompatible: `core-safe-restore`
> declarava `requires: [core-bounded-action, core-verified-change]` mentre esta
> declara `substitueix` eixes mateixes seccions. Amb les dues actives, qui
> guanyava depenia de l'ordre de càrrega. Un fusible que es dispara a l'atzar
> no és un fusible.

## Àmbit

S'activa quan la petició implica **substituir contingut existent per contingut
d'un altre punt de la història**: restaurar, revertir, tornar arrere, recuperar
una còpia, o qualsevol `git checkout <ref> -- <ruta>`, `git reset --hard`,
`git revert`.

## Llei

> **Cap byte del disc no es substituïx per contingut històric sense un segell
> emés per `desenterrar.mjs` en esta mateixa sessió.**

El segell és `sha256(ref + ruta + blob_antic + blob_actual)`. No es pot deduir.
No es pot inventar. Només l'emet la fase d'inspecció. Caduca si el fitxer canvia.

## Fase 0 — Classificar l'operació

Declara, literalment:

```text
Operació: restauració
Risc: alt
Mode actual: només inspecció
Mutacions autoritzades: cap
```

Encara que l'usuari haja dit «restaura», la primera fase és consultiva.

## Fase 1 — Àncora i immobilització

```bash
node tooling/brain/ancora.mjs --pon "abans de <el que siga>"
git status --short -- <ruta>
git rev-parse HEAD
shasum -a 256 <ruta>
```

Detecta abans de continuar: canvis no confirmats, fitxer no rastrejat, canvis
en *staging*, renoms, conflictes, o un altre agent treballant sobre la mateixa
ruta. **Si hi ha canvis locals, no es fa `stash` automàticament.**

## Fase 2 — Autòpsia

```bash
node tooling/brain/desenterrar.mjs --ref <sha> --fitxer <ruta>
```

No escriu res. Torna: data del commit, **data real del contingut**, línies
guanyades i perdudes, símbols que desapareixen, diff complet, alarmes i segell.
El candidat es materialitza sempre fora de l'arbre de treball.

## Fase 3 — Radi d'explosió semàntic

*(absorbida de `core-safe-restore`)*

A més del diff textual, explica **què deixa de funcionar**: funcions
exportades que desapareixen, crides que es queden òrfenes, contractes trencats.
Un diff diu quines línies canvien; el radi d'explosió diu què es trenca.

## Fase 4 — Salvavides

*(absorbida de `core-safe-restore`)*

Abans de demanar confirmació:

- copia els bytes actuals a un directori de recuperació,
- preserva mode i metadades, genera SHA-256,
- guarda HEAD, estat de Git, ruta, data i diff,
- **comprova que la còpia es pot llegir** i prepara l'ordre exacta de retorn.

## Fase 5 — Presentació al Mestre

Es reproduïx la secció «EL QUE PERDS» i les alarmes, **literalment**. No es
resumix. No es diu «sembla correcte». La pregunta és explícita:
*«Confirmes que vols perdre açò?»*

## Fase 6 — Espera

Fi del torn. **No s'encadena l'escriptura al mateix missatge.** Un «sí» simple
anterior al diff no és confirmació: la confirmació ha de ser posterior al diff
i vinculada al pla.

## Fase 7 — Aplicació amb CAS

Només amb un sí explícit:

```bash
node tooling/brain/desenterrar.mjs --ref <sha> --fitxer <ruta> --segell <segell>
```

Immediatament abans d'escriure: comprova que HEAD no ha canviat i que el hash
del destí coincidix amb `beforeSha256`. Si hi ha divergència: **ABORT**.
La substitució es fa amb fitxer temporal al mateix sistema de fitxers i
`rename` atòmic.

Per a més d'un fitxer: **un segell per fitxer**. Res de comodins.

## Fase 8 — Verificació i retorn

*(absorbida de `core-safe-restore`)*

Després d'aplicar: hash resultant igual al candidat, `diff` de control, lint,
proves, build i prova de fum. Si falla un invariant crític, **retorn automàtic**
i comprovació byte a byte.

Commit amb la línia `RESTAURACIÓ-VALIDADA: <segell>` al missatge.

## Prohibicions explícites

| Prohibit | Motiu |
|---|---|
| `git checkout <ref> -- <ruta>` directe | És l'ordre que va provocar l'incident del 31/08 |
| `git reset --hard` amb feina sense desar | Esborra l'arbre de treball sense xarxa |
| `git clean -fd` | Esborra allò que cap àncora rastreja si es fa abans de `--pon` |
| Fiar-se de l'assumpte d'un commit | «Còpia de seguretat» no descriu el contingut, descriu la intenció de qui el va escriure |
| Escriure i demanar confirmació al mateix torn | La confirmació posterior al fet no és confirmació |

## Regla de l'etiqueta mentidera

L'assumpte d'un commit és **una afirmació no verificada d'un altre agent**.
El commit `da83e061` deia «Còpia de seguretat: Solució scroll» i transportava
un fitxer de feia tres setmanes. `desenterrar.mjs` compara la data del commit
amb la data real del blob i marca CISMA TERMODINÀMICA quan divergixen.

Un commit recent amb càrrega arcaica **no és una còpia de seguretat**: és una
regressió que algú va etiquetar malament.

## Fallada de la porta

Si `desenterrar.mjs` no existix o no s'executa, la resposta correcta és
**aturar-se i dir-ho**, no continuar a mà. Una porta que no es pot obrir
significa que no es passa.




## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]
