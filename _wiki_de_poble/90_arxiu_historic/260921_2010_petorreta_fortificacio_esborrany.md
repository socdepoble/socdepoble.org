---
type: petorreta
status: esborrany
description: Petorreta de Fortificació (Fases 4 i 5) - Tractors i Aprenentatge
tags:
  - fortificacio
  - aprenentatge
  - tractors
---
# Prompt de Fortificació Local (SDP - v1.1.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre
| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-FORTIFICACIO |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-21 20:10 |
| Modificació | 26-09-21 20:10 |
| Propietari | Agents Locals |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## 1. El Context i l'Estat Actual
Ja hem passat la gran purga de l'Auditoria Forense. Ara tenim les skills fines i sabem on va cada cosa. Però tenim un problema estructural en l'aprenentatge del dia a dia.

## 2. L'Objectiu: El Tractor d'Aprenentatge i la Fortificació
Quan el Mestre diu: *"Inclou això a les teues skills"*, actualment la IAIA MarIA (Antigravity) ho fa de manera poc transparent o es fa un embolic perquè no sap on posar-ho. 

Volem dissenyar un mecanisme (una nova Skill d'Aprenentatge o modificar `wiki-cicle-de-vida` i un Tractor Cognitiu de validació) que obligue la IAIA MarIA a:
1. **Aturar-se i pensar:** Abans de guardar res, analitzar l'arquitectura de skills.
2. **Declaració d'Intencions:** Dir-li al Mestre de forma clara: *"Mestre, vaig a incloure això a la Skill X, exactament a la secció Y, perquè encaixa amb el context Z"*.
3. **Bloqueig:** El tractor ha d'impedir que s'aprenga una lliçó si no s'ha fet aquesta declaració d'intencions explícita i no s'ha triat la skill correcta.

A més a més, continuarem amb les Fases 4 i 5 de l'acta marmota (Tancament segur del bucket de Supabase i el nou llindar de la Porta Promesa Taronja/Roja).

## 3. Què us demanem?
- Dissenyeu la lògica d'aquest nou flux d'aprenentatge. Com ha de ser el tractor que obligue a la IAIA a ser transparent i eficient quan guarda nou coneixement?
- Quina skill ha de contenir aquesta regla d'aprenentatge?

## 4. Regles Estrictes de Sortida i Col·laboració
1. **Psicologia i Disseny Primer:** Comença parlant d'UX i deute tècnic/humà abans del codi.
2. **El Poble mana sobre la Corporació:** Fes servir un to directe, agut i amb "Trellat".
3. **Les 3 Iaies davall l'Olivera (Col·laboració a l'Escriptori):** Totes heu de deixar els vostres informes a l'Escriptori (`_wiki_de_poble/04_escriptori/`). El flux en bucle és el següent:
   - Jo (**IAIA MarIA / Antigravity**) solc deixar el meu **Pla d'Implementació** o conclusions a l'Escriptori.
   - **Declaració Obligatòria de Lectura:** A l'inici del teu informe, HAS D'INFORMAR EXPLÍCITAMENT si has pogut llegir el Pla d'Implementació de la IAIA MarIA i/o l'auditoria de l'altra IA a l'Escriptori. Si no has trobat res a la taula o no has pogut llegir-ho, **digues-ho clarament** ("No he trobat res a la taula").
   - Si has pogut llegir els informes o plans previs, estàs OBLIGADA a comentar-los, discutir-los, rebatre'ls o millorar-los abans de donar les teues pròpies conclusions.
   - Finalment, jo (IAIA MarIA) tornaré a llegir les vostres auditories per refinar el meu Pla.
4. **Format Net:** Fes servir llistes i encapçalaments, estalviant tokens i anant al gra.
