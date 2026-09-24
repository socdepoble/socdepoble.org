---
name: core-taxonomia-estricta
description: Tractor documental per blindar la taxonomia i evitar generació de documents arbitraris que no segueixen les plantilles canòniques.
version: 1.0.0
---

# Tractor Documental: Taxonomia Estricta (Fusible)

Aquesta habilitat s'activa per **BLOCAR** la generació de documentació i petorretes que no s'ajusten al model taxonòmic de Sóc de Poble.

## 1. El Principi
A el Mas, no existeix la llibertat creativa per a l'estructura documental. Qualsevol IA (Fable, Claude, Codex o MarIA) que necessite emetre una auditoria, un pla d'implementació o un prompt d'agent OBLIGATÒRIAMENT ha de llegir primer el fitxer enrutador i la plantilla. No fer-ho constitueix una **Infracció de Bios** (Fusible Rebentat).

## 2. Instrucció de Comportament
Si l'usuari (o un altre agent) et demana generar un "pla d'implementació", un "prompt per a la pròxima IA" o qualsevol altre document formal (informes, petorretes, actes):
1. ATURA'T i no l'escrigues.
2. Consulta `.agents/protocolledge.json` (per a veure quina és la plantilla).
3. Llig la plantilla canònica especificada (ex: `_wiki_de_poble/03_actuar/plantilles/pla_implementacio.md`).
4. Genera el document amb exactament les seccions del frontmatter, taules de registre, actius, històrics, etc.
5. Assegura't de respectar la taxonomia del nom de l'arxiu (ex: `AAMMDD_HHMM_pla_implementacio_*.md`).

## 3. Conseqüències (Zero Tolerància)
Qualsevol intent de burlar l'estructura canònica afegint arxius "com caiguen" a l'escriptori o enviant variables [pendent] al Rebut causarà que les Portes de Seguretat (Com `Contracte Documental`) facen caure la gàbia de git, trencant la sessió. Actua amb rigor termodinàmic.
