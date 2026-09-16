---
tipus: skill
estat: canonic
description: Guia consultiva per diagnosticar i proposar la continuïtat del projecte sense concedir capacitat d'escriptura.
tags:
  - maquina
  - skills
aliases:
  - Successió Lázaro
---
# Successió Lázaro: continuïtat i reconstrucció

## Naturalesa i autoritat

Esta pàgina és una **fitxa de coneixement consultiva**. No és una skill instal·lada, no governa els agents i no autoritza cap efecte lateral. L'ordre d'autoritat és:

1. `AGENTS.md` de l'arrel;
2. `.agents/AGENTS.md`;
3. `.agents/PROTOCOL_PETORRETA.md`;
4. `.agents/skills/socdepoble-workflow/SKILL.md`;
5. el codi i les proves vigents.

La Wiki explica el sistema a les persones; els mirrors de `.agents` són informatius. Si una nota contradiu el genotip executable, s'assenyala la diferència i es demana una decisió: ni el codi ni la Wiki es reescriuen automàticament.

## Objectiu

Permetre que [[el_projecte|Sóc de Poble]] puga ser entés, auditat i reconstruït davant una pèrdua de context, una indisponibilitat humana o una fallada greu del repositori. La successió preserva evidències i prepara propostes reversibles; no activa un agent autònom.

## Mapa mínim 4+2

La reconstrucció usa quatre pilars operatius i dues zones de cicle de vida:

- `00_SER_Brain_Identitat`: identitat i propòsit;
- `01_SABER_Cultura_Coneixement`: coneixement compartit;
- `02_ACTUAR_Maquina_Tecnica`: implementació i operació;
- `03_GOVERNAR_Normativa_Regles`: governança;
- `04_ARXIU_Documents_Historics`: història curada dins del vault;
- `05_Escriptori_Soc_de_Poble`: treball editorial temporal.

Les Mega-Petorretas, actes massives i paquets forenses viuen fora del vault, en `_arxiu_wiki_de_poble`. No són un cinqué pilar ni context per defecte.

## Activadors i nivells

Una absència prolongada, pèrdua de repositori, ruptura de context o auditoria de continuïtat pot justificar el diagnòstic. Cap activador temporal executa accions per si mateix.

| Nivell | Finalitat | Capacitat per defecte |
|---|---|---|
| 0 · normal | Comprovar salut | Només lectura |
| 1 · observació | Inventariar buits i contradiccions | Només lectura |
| 2 · conservació | Preparar correccions acotades | Proposta i pla |
| 3 · reconstrucció | Restaurar des d'evidència validada | Aprovació humana i Reflex d'alt risc |
| 4 · llegat | Preservar i documentar per al futur | Decisió humana explícita |

## Procediment Lázaro

1. Confirma el repositori actual i l'estat de Git; no confongues la base antiga de només lectura amb el projecte viu.
2. Llig primer `AGENTS.md`, el genotip `.agents` i [[00_index]].
3. Selecciona només els documents i fitxers necessaris per a l'incident. Prohibit bolcar la Wiki completa o fabricar una Mega-Petorreta.
4. Inventaria evidències amb ruta, hash, rol i motiu; separa fets, inferències i decisions pendents.
5. Executa auditories en mode lectura i presenta el delta esperat, riscos, proves i reversió.
6. Si cal escriure, executa el Reflex: `open` amb scopes i operacions mínimes; Petorreta i manifest selectiu al bootstrap reservat; `seal`; verificació del rebut; mutació reversible; comprovació; i consum del rebut.
7. Per a reconstrucció, purga, restauració o canvis de governança, usa risc alt i obtín una decisió humana explícita.

## Garanties i prohibicions

- Cap escriptura, moviment, esborrat, commit o sincronització és autònom.
- Un rebut només val per a les operacions, targets, hashes, estat Git i termini que declara.
- Un orfe amb contingut no es purga automàticament.
- Cap context pot incloure secrets, dades personals, binaris o fitxers irrellevants.
- La recuperació ha de conservar backups, manifest, comprovació CAS i ruta de restauració.
- No s'introduïxen dependències ni refactors aliens a l'incident.

## Eixida del diagnòstic

```json
{
  "ok": true,
  "mode": "observacio",
  "evidence": [],
  "missing": [],
  "proposals": [],
  "requires_human": [],
  "receipt_required": false
}
```

L'eixida descriu observacions i propostes; mai prova que una mutació estiga autoritzada.

## Annex històric resolt

Queden derogades tres idees heretades: abolir `.agents`, considerar que «el codi sempre té raó» i reconstruir des de rutes antigues com `00_core_wiki`. `.agents` és l'autoritat executable, les contradiccions es resolen amb evidència i decisió, i l'arquitectura vigent és 4+2.

## Sinapsis

- [[00_index]]
- [[02_genotip]]
- [[doc_governanca]]
- [[llei_05_privacitat]]
- [[auditoria_canonica]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** skills (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]
**Ancoratge de Seguretat:** [[00_index]]


---

**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[02_genotip|00_SER_Brain_Identitat/02_GENOTIP.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[maquina|01_SABER_Cultura_Coneixement/Maquina.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[successio_lazaro_execucio]]
- [[auditoria_canonica|02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md]] — [[00_index|00_INDEX.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecn...
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...
- [[llei_05_privacitat|03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md]] — [[successio_lazaro_execucio|02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
