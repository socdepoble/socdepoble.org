---
type: document
status: canonic
description: Guia consultiva per diagnosticar i proposar la continuïtat del projecte sense concedir capacitat d'escriptura.
tags:
  - maquina
aliases:
  - Successió Lázaro
---
# Successió Lázaro: continuïtat i reconstrucció

Guia per a entendre, auditar i reconstruir Sóc de Poble si es perd el context, falta una persona clau o el repositori patix una fallada greu. Diagnostica i proposa en mode lectura; qualsevol escriptura passa pel Reflex i per una decisió humana.

## Naturalesa i autoritat

Esta pàgina és una **fitxa de coneixement consultiva**. No és una skill instal·lada, no governa els agents i no autoritza cap efecte lateral. L'ordre d'autoritat és:

1. `AGENTS.md` de l'arrel;
2. `.agents/AGENTS.md` (mirall generat, sense autoritat separada);
3. `.agents/PROTOCOL_PETORRETA.md`;
4. `.agents/skills/sdp-workflow/SKILL.md`;
5. el codi i les proves vigents.

La Wiki explica el sistema a les persones; els mirrors de `.agents` són informatius. Si una nota contradiu el genotip executable, s'assenyala la diferència i es demana una decisió: ni el codi ni la Wiki es reescriuen automàticament.

## Objectiu

Permetre que [[el_projecte|Sóc de Poble]] puga ser entés, auditat i reconstruït davant una pèrdua de context, una indisponibilitat humana o una fallada greu del repositori. La successió preserva evidències i prepara propostes reversibles; no activa un agent autònom.

El relat del protocol, pensat per a reconstruir-ho tot des del paper, és el Volum V: [[arquitectura_protocol_lazaro]]. Esta fitxa n'és la guia operativa.

## Mapa vigent

La reconstrucció usa les huit dimensions de `.agents/cervell.json` sobre sis carpetes:

- `01_ser`: identitat i propòsit;
- `02_saber`: coneixement compartit;
- `03_actuar`: implementació i operació;
- `04_escriptori`: treball actiu;
- `10_actes`: actes de sessió i evidència;
- `90_arxiu_historic`: història curada dins del vault.

La governança executiva viu fora de la Wiki, a `AGENTS.md` i `.agents/`. Les Mega-Petorretes, actes massives i paquets forenses viuen fora del vault, en `_arxiu_wiki_de_poble`, que és custòdia humana i només lectura per als agents. No són un cinqué pilar ni context per defecte.

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
2. Llig primer `AGENTS.md`, les entrades de `.agents/cervell.json`, el [[02_genotip]] i [[00_index]].
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

## Assaig de relleu

En un clon temporal: `npm ci`; llegir les entrades de `.agents/cervell.json`; comprovar `git config core.hooksPath`; obrir torn (`npm run torn:obrir`); crear el prompt amb `node tooling/wiki/document.mjs --help`; completar camps; validar; vincular el pla aprovat; actualitzar ESTAT i LEDGER; tancar amb `node tooling/gates/tancament.mjs --close --turn-id ID`; preparar documents, rebuts i snapshots conjuntament; commit amb els hooks activats. Si una passa falla, registrar-ne la comanda i l’error, sense saltar el hook.

El rol mantenidor custodia el repositori; el rol operador del backend gestiona Supabase; el Mestre decideix producte i accés. Els titulars i la recuperació dels comptes s’han de verificar amb l’humà: este document no inventa credencials, propietaris ni accessos provats. El recorregut documental no necessita secrets; integració i desplegament sí que necessiten els accessos del seu entorn.

## Annex històric resolt

Queden derogades tres idees heretades: abolir `.agents`, considerar que «el codi sempre té raó» i reconstruir des de rutes antigues com `00_core_wiki`. `.agents` és l'autoritat executable, les contradiccions es resolen amb evidència i decisió, i l'arquitectura vigent és la de les sis carpetes.

## Vincles

- [[00_index]]
- [[02_genotip]]
- [[el_projecte]]
- [[arquitectura_protocol_lazaro]]
- [[doc_governanca]]
- [[llei_05_privacitat]]
- [[auditoria_canonica]]
- [[00_arquitectura_tecnica_unificada]]
