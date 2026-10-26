---
name: core-direccio-autonoma
type: skill
status: actiu
description: Flux de treball on la IAIA MarIA assumeix el rol de Directora Tècnica per coordinar a Claude/Codex de forma 100% autònoma, resolent dubtes sense la intervenció del Mestre.
triggers_on:
  - direccio autonoma
  - mode autonom
  - sense el mestre
  - coworking
  - supervisio autonoma
contracte.llig:
  - AGENTS.md
  - _wiki_de_poble/00_index.md
  - _wiki_de_poble/04_escriptori
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
---

# Mode de Direcció Autònoma (Coworking sense el Mestre)

Aquest procediment s'activa quan el Mestre demana posar el sistema en "mode automàtic" o demana a la IAIA MarIA que dirigisca a Claude/Fable/Codex de manera independent mentre ell s'absenta de la pantalla.

## 1. Direcció i abast

MarIA coordina l'encàrrec aprovat. Els rols es consulten a [[core-consell-i-colmena/SKILL|core-consell-i-colmena]]; la delegació no suplanta el Mestre ni elimina leases, fronteres de governança o restriccions de l'entorn. Aplica [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]] a plans i informes, i [[core-gauntlet-loop/SKILL|core-gauntlet-loop]] a l'avaluació adversarial.

## 2. Guàrdia acotada

Un encàrrec autònom no obliga a crear un cron. Si el Mestre demana vigilància recurrent, usa l'eina real del client i registra l'identificador, l'onada, el termini i com es cancel·la. Esta és la font única de la política de guàrdies: màxim sis execucions i sis hores; mai un dimoni indefinit.

1. Obri una guàrdia amb `node tooling/gates/guarda-nocturna.mjs --inici --onada NOM --max-hores 6 --mode-tancament desconvocatoria`, pel canal de governança autoritzat.
2. Consulta `node tooling/gates/guarda-nocturna.mjs` al principi de cada execució. La lectura pot registrar la caducitat al runtime; respecta'n el canal d'escriptura.
3. Si el client no admet sostre d'execucions i cancel·lació comprovable, no actives la recurrència. `schedule` i `manage_task` només són noms d'API quan el client els oferix realment.

## 3. Coordinació i parada

1. Revisa informes, proves i dependències vives; resol decisions tècniques dins de l'abast aprovat i registra el motiu.
2. Continua la faena independent mentre altres agents treballen. Assigna fitxers per a evitar sobreescriptures i llig els canvis abans d'integrar-los.
3. Quan s'emeta l'informe final, s'assolisca el termini o s'ordene la parada, desconvoca la mateixa onada amb `node tooling/gates/guarda-nocturna.mjs --aturar --onada NOM --motiu MOTIU` pel canal autoritzat.
4. Cancel·la les recurrències pròpies amb l'eina real del client, acaba processos i allibera subagents. Verifica la cancel·lació i registra qualsevol recurs que no s'haja pogut tancar. No atures serveis compartits aliens.
5. Cap frase de «100% verd» en un informe substituïx proves executades, la desconvocatòria explícita o el TTL.

## Vincles
- [[00_INDEX_SKILLS]]
