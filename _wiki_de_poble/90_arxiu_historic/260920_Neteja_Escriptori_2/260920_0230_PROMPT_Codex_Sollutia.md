---
type: petorreta
status: actiu
description: Instruccions d'auditoria extrema per a Codex. Fases 1 a 3 del pla d'implantació i connexió amb Sollutia.
tags:
  - backend
  - sollutia
  - arquitectura
---

# Petorreta — Consolidació Backend i Connexió Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-CODEX-260920-02 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 02:30 |
| Modificació | 26-09-20 02:30 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-20 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260920_0154_auditoria_skills_avancades]]
- [[skill-consell-i-colmena]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- Revisió específica de `src/data/backendPort.js` i configuració de Supabase.

## Agent convocat

Codex (Cursor) - Esforç Molt Alt / Màxim.

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **EXCEPCIÓ D'ESCRIPTURA:** Hui SÍ tens autorització per generar codi definitiu. Però ATENCIÓ: No utilitzes eines d'edició automàtica (Apply Changes). El codi de resposta ha d'estar en el teu informe per a ser avaluat i aplicat manualment.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Acabes de finalitzar una auditoria mestra (260920_0154_auditoria_skills_avancades.md) on destapaves 20 troballes crítiques i proposaves un Pla d'Implantació de 8 fases. Tenim pressupost i potència habilitats al màxim per executar les fases crítiques de lògica i backend.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tens accés natiu a tot el codi font, no t'hem generat cap Bundle. Pots llegir l'arbre de fitxers lliurement. 
L'orquestrador de skills (Matrix) pateix divergències amb el manifest i regenera carpetes obsoletes de "mirrors". Necessitem unificar-ho amb el hook de validació. També cal assegurar que el port del backend cap a Sollutia (Supabase) està ferm.

## Missió

1. **Reconciliació i Neteja de Fantasmes (Fases 1 i 2):** Elimina el cridador antic que re-crea la carpeta `_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR`. Unifica el generador de catàleg i assegura que `manifest.yaml` i `00_INDEX_SKILLS.md` tinguen exactament les mateixes 16 skills, sense discrepàncies. Escriu el codi necessari.
2. **Unificació d'Arrancada (Fase 3):** El sistema Matrix i el hook de validació ara mateix van per separat. Genera el codi per unificar l'orquestrador documental.
3. **Connexió Sollutia (Supabase):** Revisa l'arquitectura de dades existent a `src/data/`. Assegura't que l'esquema s'adapta als estàndards de Sollutia i lliura propostes de blindatge de seguretat si trobes fugues.

## Eixida esperada

Has de retornar una auditoria i codi (ex. `260920_0300_auditoria_codex.md`). Genera codi complet i robust, a punt per ser aplicat per la IAIA MarIA en la pròxima sessió.

## Incògnites

- Es desconeix la profunditat exacta dels rols a Supabase fins que analitzes el codi de configuració actual.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
