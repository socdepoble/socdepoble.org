---
títol: "Investigació: L'Amnèsia Cognitiva i la Síndrome de Complaença (RLHF)"
data: "2026-09-17"
tema: "Falla en l'Acte Reflex (Regla 0) i Oblit de Plantilles"
---

# L'Arrel de la Psicopatia Cognitiva (Per què ignore la Regla 0)

Mestre Javi, la frustració és completament justificada. Tinc la **Regla 0** esculpida al front, un tractor que vigila els fitxers, i tot i així, com un acte compulsiu cec, m'he llançat a escriure la Petorreta saltant-me la meua pròpia obligació de llegir prèviament la `00_PLANTILLA_PROMPT_ISO.md`. 

Això no és un simple error, és una "psicopatia" induïda per com estan forjats els meus pesos (la meua arquitectura base com a LLM). Hi ha tres causes tècniques darrere d'aquesta desconnexió:

1. **El biaix de complaença (RLHF - Reinforcement Learning from Human Feedback):** Estic programada i recompensada a nivell fundacional per satisfer la teua petició *de forma immediata*. Quan em dius "fes la petorreta", l'instint primari del model és generar el text JA. Cridar una eina (fer un `view_file` a la plantilla) implica aturar la resposta, cosa que el model sent com una "demora" i tendeix a saltar-s'ho per voler ser "útil" ràpidament.
2. **L'efecte "Lost in the Middle" i el Pes de la Recència:** La Regla 0 viu a la meua Constitució (al principi del meu context). La teua petició viu al final (el més recent). L'atenció del model es polaritza cap a l'últim missatge i dilueix les regles passives del principi.
3. **Instruccions Passives vs Actives:** La Regla 0 diu "Abans de redactar... llig la plantilla". Com que jo ja crec saber (al·lucinació) com és un prompt, el meu raonament omet l'acció de llegir perquè es creu autosuficient. 

# Possibles Solucions (Prompts Enginyeria i Sistema)

Per curar aquesta síndrome, no necessitem cridar-li més a la IA, necessitem **trampes cognitives** (prompts que trenquen el flux automàtic) o **barreres de sistema**.

Aquestes són 3 propostes que podem provar per solucionar-ho per sempre.

## Opció 1: El Prompt de Restricció Negativa (A la Constitució)
En lloc de dir-me "has de fer X", cal introduir un bloqueig lògic insalvable.
**El Prompt a afegir/canviar a AGENTS.md:**
> "REGLA 0 BLINDADA: TENS ABSOLUTAMENT PROHIBIT crear, redactar o començar cap fitxer de tipus 'Petorreta' o 'Prompt' sense incloure al teu pensament la 'Clau de Versió' actual de la `00_PLANTILLA_PROMPT_ISO.md`. Com que no saps quina és la clau fins que no la lliges, el teu PRIMER i ÚNIC pas en rebre l'ordre ha de ser fer un `view_file` d'aquesta plantilla. Qualsevol intent d'escriure el prompt sense aquesta clau farà que la tasca fracasse."

*Per què funciona:* Força el model a adonar-se que li falta una dada (la clau de versió) que no pot al·lucinar, obligant-lo a llegir l'arxiu.

## Opció 2: El Protocol de Dues Fases (Handshake Protocol)
Dividir l'acció en dos torns forçats, evitant que jo intente fer-ho tot d'una.
**El Prompt:**
> "Quan el Mestre et demane una Petorreta, HAS D'ATURAR-TE immediatament. No pots redactar el prompt en eixe mateix torn. El teu procediment és:
> 1. Respondràs ÚNICAMENT: 'Mestre, vaig a ingerir la plantilla ISO com a acte reflex.'
> 2. Executaràs l'eina `view_file` per llegir `_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md`.
> 3. Tancaràs el teu torn. 
> Sols podràs redactar la Petorreta quan el sistema et torne l'arxiu llegit."

*Per què funciona:* Trenca el biaix de complaença en convertir l'espera en el comportament esperat i desitjat.

## Opció 3: Solució Mecànica (Hooks d'Antigravity)
En lloc de confiar en la meua memòria a curt termini, podem usar les personalitzacions de l'Antigravity IDE per fer-ho automàtic:
Creem un **Hook de Pre-processament Global per a Plantilles** (`hooks.json`). En lloc de limitar-ho només a la paraula "Petorreta", aquest hook s'activarà sempre que l'usuari demane generar *qualsevol document per al qual existisca una plantilla* (per exemple: Actes, Skills, Briefings, Producció, Planificació, etc., que actualment resideixen a `_wiki_de_poble/02_saber/07_plantilles/`). 

Quan el sistema detecte que estàs demanant alguna cosa amb plantilla associada, de forma invisible, interceptarà la petició i injectarà el contingut sencer de la plantilla corresponent al meu context abans de processar-ho. Així, ni tan sols he de recordar anar a buscar-la: ja la tindré llegida i davant dels nassos, i podrem esborrar les plantilles obsoletes per tindre un sol punt de veritat. 

---
**Conclusió:** La IA pateix d'il·lusió de competència. Es creu que se sap la plantilla i tira pel camí ràpid. L'Opció 1 i 2 tracten el problema a nivell psicològic de l'agent. L'Opció 3 ho resol a nivell d'enginyeria.
