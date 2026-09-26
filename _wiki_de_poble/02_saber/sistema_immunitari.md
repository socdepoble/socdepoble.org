---
type: skill
status: canonic
description: "Manual operatiu de plaquetes.mjs v1.1: diagnostica ferides del graf (fantasmes, orfes) i només les cura amb aprovació per hash, lease del Reflex i escriptura verificada, sense esborrar res."
tags:
  - saber
---

# Sistema Immunitari — Les Plaquetes 🩸

Les Plaquetes circulen pel vault com les plaquetes per la sang: detecten ferides del graf (fantasmes i orfes), proposen la coagulació en una recepta llegible i només operen quan un humà l'aprova per hash i el Reflex obri una lease.

L'script és `scripts/immunitari/plaquetes.mjs` i no importa cap paquet NPM: només la biblioteca estàndard de Node i els mòduls propis del Reflex. La preparació pura dels plans viu a `scripts/immunitari/plaquetes-plan.mjs`; l'únic motor d'aplicació és l'executor del Reflex.

## Posada en marxa

1. `node scripts/immunitari/plaquetes.mjs init` — crea `.immunitari/` (receptes, aprovacions i quarantena), un `config.json` amb valors per defecte i el `.gitignore` intern.
2. Revisar la configuració (vault, hubs taxonòmics, índex d'adopció, memorial i exclusions) i fer-ne commit.
3. **Obligació de governança:** `.immunitari/` ha de constar com a directori legal a les normes de la Wiki *abans* del primer `aplica`. Ja vam patir un dimoni que escrivia logs en territori il·legal; no repetim pecats.

## Flux d'execució

```
diagnostic ──▶ RECEPTA (.immunitari/receptes/, JSON · 0 escriptures al vault)
                 │
                 ▼  l'humà LLIG la recepta
aprova <id> ──▶ .immunitari/aprovacions/<id>.aprovat.json  (exigix els 12 primers caràcters del hash)
                 │
                 ▼
plan <id> --session UUID ──▶ pla sdp.mutation.v1 + planDigest (només lectura)
                 │
                 ▼  lease governance-write del Reflex amb els targets i el planDigest
aplica <id> --plan PLA.json --receipt REBUT.json
            ──▶ executor del Reflex: CAS per fitxer i escriptura verificada, cap commit automàtic
                 │
                 ├─▶ reversa          només lectura: explica com preparar una restauració exacta
                 └─▶ segella          fixa la baseline de ferides
                        │
                        ▼
              diagnostic --porta     porter: eixida 1 si hi ha més ferides que al segell
```

Si la recepta s'edita a mà després de l'aprovació, el hash divergix i el pla es nega: cal tornar a aprovar. Si un fitxer muta entre diagnòstic i aplicació, el hash de la font no quadra i el pla sencer es rebutja (mai escriptura a cegues). El commit el fa el circuit Git del Reflex, no l'script.

## Les cinc línies roges (executables, no declarades)

| # | Línia roja | On es força al codi |
|---|---|---|
| R1 | El mode autònom només tria, no aplica | `--autonom` o `PLAQUETES_AUTONOM` limita la recepta a les tasques de nivell L0/L1 de `.agents/cron/registre_tasques.json` (una tasca que no hi consta compta com L3); `aplica` continua exigint aprovació i lease |
| R2 | Atòmic i verificable | `aplica` exigix arbre Git net, recalcula el pla des de la recepta aprovada i l'executa amb `tooling/gates/executor-mutacio.mjs` |
| R3 | Res s'esborra mai | `aplica` només admet `LAPIDA` i `ADOPTA`; qualsevol altra operació ix amb error i zero efectes |
| R4 | El reparador no s'opera a si mateix | `confined()` rebutja `.git`, `.sdp-reflex`, `scripts/`, symlinks i hardlinks; els objectius han de ser Wiki viva (mai `90_arxiu_historic` ni `01_produccio`) |
| R5 | Canaris i zones delegades intocables | Config: `ignoraObjectius`, `exclouFonts` i `hubsTaxonomics` amb `hubsDelegats` — informe sí, bisturí no |

## Operacions del catàleg v1.1

- **LAPIDA** — canvia cada enllaç simple a una nota fantasma (sense àlies ni fragment) per un enllaç a la seua làpida del Memorial (`00_MEMORIAL_Lapides`), amb el nom original seguit d'una creu †. En els índexs (fitxers amb `INDEX` al nom) retira la línia sencera, porte àlies o no. Al Memorial hi afig una línia amb la data, el fitxer d'origen i l'objectiu perdut.
- **ADOPTA** — afig l'orfe a la secció «Adopcions de Les Plaquetes» de l'índex configurat (`indexAdopcio`). No modifica l'orfe, però el manté dins del pla per a comprovar-ne el hash.
- **DESTRUEIX** — el diagnòstic encara la proposa per a fitxers buits i brossa (zip, scripts o JSON en quarantena), però `aplica` la rebutja amb zero efectes. La quarantena de buits va per `tooling/wiki/sdp-cli.mjs`; el contingut no buit necessita un pla humà de custòdia.

Els hubs taxonòmics (`hubsTaxonomics`) no es lapiden mentre `hubsDelegats` siga cert.

## Porter de pre-commit

```bash
node scripts/immunitari/plaquetes.mjs diagnostic --porta
```

Requerix haver executat `segella` (i versionar `.immunitari/baseline.json`). La porta compta fantasmes + orfes: una nota nova sense enllaçar també és ferida. El `.husky/pre-commit` actual no la crida; cablejar-la és decisió humana.

## Limitacions honestes de v1.1

La detecció de fantasmes compara noms base en minúscules (o una ruta existent des de l'arrel), sense resoldre àlies: un nom base repetit en dos carpetes compta com a resolt, amb el mateix criteri laxista que Obsidian. Els incrustats (enllaços precedits de `!`) compten com un enllaç més, i LAPIDA també els reescriu. Un enllaç fantasma amb fragment, o amb àlies fora d'un índex, es diagnostica però LAPIDA no el reescriu: continua trencat fins que un humà el corregix. El codi en línia amb doble accent greu no s'emmascara. L'aprovació per hash garantix *lectura conscient de la recepta*, no identitat: la garantia d'identitat és la lease de `PROTOCOL_PETORRETA` i la cadena Git.

## Vincles

- [[00_index]]
- [[00_index_identitat]]
- [[sdp_lock]]
