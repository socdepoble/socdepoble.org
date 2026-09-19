---
type: skill
status: canonic
description: "Manual operatiu de plaquetes.mjs v1.1: el Sistema Immunitari que diagnostica ferides del graf (fantasmes, orfes) i les cura només amb aprovació mecànica per hash, un commit git per operació i reversió quirúrgica."
tags:
  - saber
---

# Sistema Immunitari — Les Plaquetes 🩸

`plaquetes.mjs` circula pel vault com les plaquetes per la sang: detecta ferides (nodes fantasma, fitxers orfes), proposa la coagulació en una **RECEPTA** llegible, i només opera quan un humà aprova per hash. Zero dependències NPM: només stdlib de Node ≥ 18. Zero AI Slop.

## Instal·lació al Mas

1. Copiar l'script a `scripts/immunitari/plaquetes.mjs`.
2. `node scripts/immunitari/plaquetes.mjs init` — crea `.immunitari/config.json` amb valors per defecte i el `.gitignore` intern.
3. Revisar la configuració (vault, hubs, zones delegades, exclusions) i fer-ne commit.
4. **Obligació de governança:** registrar `.immunitari/` com a directori legal a les normes de la Wiki *abans* del primer `aplica`. Ja vam patir un dimoni que escrivia logs en territori il·legal; no repetim pecats.

## Flux d'execució

```
diagnostic ──▶ RECEPTA (JSON, dry-run: 0 escriptures al vault)
                 │
                 ▼  l'humà LLIG la recepta (les previsualitzacions hi són per a això)
aprova <id> ──▶ artefacte .aprovat.json  (exigeix els 12 primers caràcters del hash)
                 │
                 ▼  commit de recepta + aprovació (cadena d'auditoria)
aplica <id> ──▶ 1 commit git per operació · escriptura atòmica (tmp+rename)
                 │
                 ├─▶ reversa <OP-id>   git revert quirúrgic d'una sola operació
                 └─▶ segella           fixa la baseline de ferides
                        │
                        ▼
              diagnostic --porta       porter de pre-commit: eixida 1 si hi ha
                                       ferides noves respecte del segell
```

Si la recepta s'edita a mà després de l'aprovació, el hash divergeix i `aplica` es nega: cal tornar a aprovar. Si un fitxer muta entre diagnòstic i aplicació, la seua operació se salta amb avís explícit (mai escriptura a cegues).

## Les cinc línies roges (executables, no declarades)

| # | Línia roja | On es força al codi |
|---|---|---|
| R1 | El mode autònom **no existeix** en v1 | `--autonom` o `PLAQUETES_AUTONOM` → eixida 2 abans de fer res |
| R2 | Atòmic i reversible | `escriuAtomic()` (tmp+rename POSIX) · `commitOperacio()` un commit/op · `aplica` exigeix arbre git net |
| R3 | Res s'esborra mai | No hi ha cap crida a `unlink`/`rm` a tot l'script; només `mouAQuarantena()` cap a `.immunitari/quarantena/<lot>/` |
| R4 | El reparador no s'opera a si mateix | `assegura()` veta escriptures a `scripts/immunitari/`, `.immunitari/aprovacions/`, `.git/` i al propi fitxer de l'script |
| R5 | Canaris i zones delegades intocables | Config: `ignoraObjectius`, `exclouFonts`, `zonesDelegades`, `orfesLegals` — informe sí, bisturí no |

## Operacions del catàleg v1

- **LAPIDA** — substitueix cada `fantasma (BROKEN LINK: fantasma) <!-- TODO: fix link -->` per `àlies † (BROKEN LINK: 00_MEMORIAL_Lapides#fantasma) <!-- TODO: fix link -->` (l'àlies original es preserva) i erigeix la secció corresponent al Memorial amb origen i línia. Narrativa preservada sense mentir al graf. Els incrustats `!... (BROKEN LINK: ...) <!-- TODO: fix link -->` mai es toquen.
- **ADOPTA** — afegeix l'orfe amb contingut a la secció «Adopcions de Les Plaquetes» de l'índex configurat. No modifica l'orfe (per això només exigeix existència, no hash).
- **QUARANTENA** — mou fitxers buits a `.immunitari/quarantena/<lot>/` conservant la ruta relativa. R3: mai esborrat; git registra el moviment i `reversa` el desfà.
- **CREA_HUB** — crea la nota concentradora (MOC) d'un hub taxonòmic. **Inactiva per defecte** (`hubsDelegats: true`) mentre la tasca (a) siga territori de la MarIA local.

## Porter de pre-commit

```bash
# .git/hooks/pre-commit  (chmod +x)
#!/bin/sh
node scripts/immunitari/plaquetes.mjs diagnostic --porta || {
  echo "🩸 Les Plaquetes bloquegen el commit: ferides noves al graf."
  exit 1
}
```

Requereix haver executat `segella` (i versionar `.immunitari/baseline.json`). La porta compta fantasmes + orfes: una nota nova sense enllaçar també és ferida.

## Limitacions honestes de v1

Els incrustats `!nota_inexistent (BROKEN LINK: nota_inexistent) <!-- TODO: fix link -->` es reporten però no es lapiden. Els objectius amb nom base ambigu resolen al primer colp d'índex (mateix criteri laxista que Obsidian; es reporta). El codi en línia amb doble accent greu no s'emmascara. L'aprovació per hash garanteix *lectura conscient de la recepta*, no identitat: la garantia d'identitat és la cadena git + el lease de `PROTOCOL_PETORRETA`.


---

**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[sistema_immunitari|01_SABER_Cultura_Coneixement/Sistema_Immunitari.md]] — A...
- [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[sistema_immunitari]]
- [[coneixement|01_SABER_Cultura_Coneixement/Coneixement.md]] — [[sistema_immunitari|01_SABER_Cultura_Coneixement/Sistema_Immunitari.md]] — C...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[sistema_immunitari|01_SABER_Cultura_Coneixement/Sistema_Immunitari.md]] — E...
- [[sistema_immunitari|01_SABER_Cultura_Coneixement/Sistema_Immunitari.md]] — [[00_index|00_INDEX.md]] — [[sistema_immunitari|01_SABER_Cultura_Coneixement/...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
