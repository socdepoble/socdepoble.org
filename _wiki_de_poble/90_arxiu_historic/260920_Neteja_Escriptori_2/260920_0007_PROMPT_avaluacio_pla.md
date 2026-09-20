---
type: petorreta
status: esborrany
description: Avaluació del Pla d'Implementació per part de l'Eixam (Codex/Claude) abans d'aplicar les millores reactives i normatives.
tags:
  - govern
  - arquitectura
---

# Petorreta — Avaluació del Pla d'Implementació

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260920 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 00:07 |
| Modificació | 26-09-20 00:07 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-20 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- L'auditoria de Claude guardada a: `_wiki_de_poble/04_escriptori/260919_2359_auditoria_claude.md`
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

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend i a on ens integrarem molt prompte).

## Informe d'avanç

Tant Claude com Codex han fet una avaluació meravellosa i crítica de l'estat actual de la reactivitat (AppGridShell, NotesContext, UniversalWorkspace) i de les regles de la Wiki (els Skills). 
Jo (IAIA MarIA) vaig preparar un Pla d'Implementació amb 4 preguntes clau obertes per al Mestre Humà abans d'actuar. Tot i això, el Mestre, fent gala del 'trellat', ens demana que siguem nosaltres 3 (tu Codex/Claude i jo) qui decidim primer quina és la solució més elegant. Treballem en equip per arreglar-ho.

## Situació i dades opaques

Hi ha 4 decisions paralitzades que ens impedeixen reparar el codi React. Tenim un pla tècnic recomanat per Claude, però no ens podem posar d'acord sobre l'arquitectura normativa prèvia. Heu d'usar el vostre raonament per triar l'opció que assegure un sistema mantenible, segur, lliure de redundàncies i que blinde les metadades i el cervell normatiu.

Aquestes són les 4 grans preguntes extretes del meu *Pla d'Implementació*:

1. **La Taula `PROTOCOLLEDGE` (P1):** Aquesta taula dirigia els documents i plantilles i ara està esborrada per error meu. On ha de viure per sempre? 
   - *Opció A:* Com a prosa dins d'una skill (ex: `skill-documentacio-i-reflex/SKILL.md`). Així es llig mentre es raona.
   - *Opció B:* Com un `.agents/protocolledge.json` pur de dades que siga importat pels scripts.

2. **El Mirall de Skills (P2):** La carpeta `_wiki_de_poble/02_saber/skills_mirror/` es suposa automàtica però està plena d'arxius orfes. Això és perillós (una IA podria llegir regles derogades). Hauríem de convertir-la en automàtica realment (escriptura en hooks) i declarar-la 'només lectura', o l'eliminem d'arrel i passem a llegir directament d'`.agents/skills/`?

3. **L'Autoritat dels Protocols (P3):** Què mana més: els scripts dins de `.agents/skills/` o els documents de `_wiki_de_poble/02_saber/protocols_tecnics/`? L'índex ho contradiu.

4. **El motor React vs Preact (P0):** Claude va advertir que fem servir `preact/compat` i això emmascara bugs de React. L'objectiu de codi obert exigeix React pur o ens abracem a Preact? El Mestre prefereix la que done més rendiment de cara al futur, però no vol dependre de trampes temporals de Preact.

## Missió

1. **Avaluar les Preguntes Obertes:** Analitzeu les 4 incògnites de dalt aplicant el **Trellat**. Decidiu quina de les opcions (A, B, eliminar el mirall, etc.) fa que el sistema siga més sòlid. Presenteu-li la resposta final recomanada al Mestre Humà justificant el perquè no es trencarà res.
2. **Auditoria en paral·lel de Codex i Claude:** Claude ja ha traçat 9 passos de refactorització reactiva, i Codex ha apuntat la propagació innecessària per modificació en `NotesSection`. Reviseu les auditories i recomaneu un únic **Pla de Cirurgia Compartit**.
3. **Escriviu els fragments de codi teòricament resolts:** Com havíeu dictaminat abans (ús de `configRef` per evitar dependències volàtils, extracció de `columnWidths` del context d'AppGridShell, etc.), unifiqueu el codi a un lloc per donar el vistiplau final abans que jo (IAIA MarIA) prenga les tisores i modifique el disc.

## Eixida esperada

No modifiqueu codi. Feu un informe consolidat d'Estratègia de Refactorització (`260920_0007_auditoria_[agent].md`). La IAIA MarIA l'utilitzarà com a brúixola per a executar finalment les tasques endarrerides i restablir el cervell `matrix.mjs` de la Wiki.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He pres partit clar a les 4 preguntes, donant consell expert?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] No s'han usat línies d'escriptura executables o botons de "Apply Changes".
