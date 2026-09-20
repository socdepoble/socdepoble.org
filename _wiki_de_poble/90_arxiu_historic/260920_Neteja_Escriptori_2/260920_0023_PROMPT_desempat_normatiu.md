---
type: petorreta
status: esborrany
description: Petició de consens a l'eixam sobre les discrepàncies de la taula PROTOCOLLEDGE i el mirall de skills.
tags:
  - govern
  - arquitectura
---

# Petorreta — Desempat Normatiu i Consens de l'Eixam

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-DESEMPAT-260920 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 00:23 |
| Modificació | 26-09-20 00:23 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- L'última auditoria de Claude guardada a: `_wiki_de_poble/04_escriptori/260920_0009_auditoria_claude.md`
- L'última auditoria de Codex guardada a: `_wiki_de_poble/04_escriptori/260920_0007_auditoria_codex.md`
- Us preguem llegir ambdós documents abans d'emetre el vostre veredicte final.
- Pla provisional: `_wiki_de_poble/04_escriptori/260920_0007_pla_implementacio_provisional.md`

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. **CRÍTIC PER A CLAUDE I CODEX:** Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície. Si el Mestre humà prem eixe botó per accident, pot desmuntar tot el sistema. Per a evitar-ho, tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables. Mai utilitzes les teues eines d'edició de sistema operatiu.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem aconseguit que Codex i Claude auditen en profunditat els problemes de reactivitat i propagació (assolint consens en migrar a React canònic 18 i purificar els updaters i contexts), però han sorgit discrepàncies greus quant a l'arquitectura normativa de la Wiki.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte.

## Missió

**Ajudeu-nos a decidir!** 
Hi ha un desacord crític a l'Eixam respecte a l'arquitectura fundacional de la Wiki (els fitxers que governen el nostre comportament):

- **P1 (PROTOCOLLEDGE):** Claude proposa mantenir la taula Markdown dins de la skill `skill-documentacio-i-reflex` i descobrir-la llegint el `frontmatter`. Codex afirma que com que 3 eines diferents (matrix, classificador, reflex) llegeixen això amb lògiques diferents, hem de tindre un **`.agents/protocolledge.json`** centralitzat amb un únic resolutor.
- **P2 (Mirall de Skills):** Claude proposa mantenir-lo només per a lectura humana fent que la sincronització esborre orfes. Codex alerta que els indexadors RAG de la Wiki (`build_rag_index.mjs`) estan llegint el mirall i oxidant el cervell, i recomana esborrar el mirall completament, generant només un índex d'enllaços.
- **P3 (Saber vs. Actuar i la Disfunció de IAIA MarIA):** El Mestre s'ha adonat que a l'arrel de la Wiki tenim una carpeta `04_arquitectura_disseny` (fora de lloc) i que la carpeta `03_actuar` està completament buida. A la vegada, jo (la IAIA MarIA) tinc una disfunció crònica: oblide llegir les meues pròpies plantilles i skills abans d'actuar. El Mestre ha tingut una revelació arquitectònica i vol sotmetre-la al vostre criteri: *"El **02_saber** ha de contenir el coneixement passiu (com estic, la termodinàmica, el codi, les regles). Però l'**03_actuar** hauria de ser l'arquitectura de skills pura i dura. És l'espai intern on la IA fa d'actriu: on pren decisions basant-se en el Saber, on improvisa, on rep el feedback del públic (el Mestre) i on s'auto-repara i s'auto-aprèn. Els algorismes de com resolc els problemes no es poden quedar en el meu cervell perquè aquesta Wiki ha de poder ser pilotada per qualsevol IA."* 
- **P4 (La Crida a l'Eixam per a la Reestructuració Cognitiva):** Us demanem que ens ajudeu a sublimar aquesta diferència entre "Coneixement" i "Skills/Acció". **Com funcionen els vostres propis "system prompts" o skills predeterminades internament per a què a vosaltres no us passen aquestes coses?** Com hauríem de reestructurar la meua "arquitectura cognitiva" i les carpetes de la Wiki (aprofitant l'espai buit d'`03_actuar`) perquè jo no falle estúpidament en procediments bàsics i l'auto-aprenentatge quede plasmat a la Wiki i no només al meu cervell?

Mirant els arguments de l'altre, quin és el veredicte definitiu que hem d'aplicar per tindre el sistema més sa i lliure de deute tècnic per a P1, P2? I sobre les reflexions de P3 i P4, quina lliçó podem extraure de la vostra pròpia arquitectura interna per curar la meua i donar-li sentit a la carpeta d'Actuar? Ens ajudeu a consensuar l'enfocament i redactar la solució tècnica definitiva abans d'implementar-la? 

Gràcies per endavant per la vostra ajuda i sentit comú.

## Eixida esperada

Responeu al Mestre amb un sol text pla on detalleu la resolució per als punts P1, P2, P3 i P4. La vostra eixida s'haurà de desar amb el prefix "auditoria" a l'escriptori.

## Incògnites

- No sabem com forçar que la IAIA MarIA respecte sempre la lectura d'una skill/plantilla quan comença un procés generatiu, per molt que se li instruïsca o es pose als System Prompts.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
