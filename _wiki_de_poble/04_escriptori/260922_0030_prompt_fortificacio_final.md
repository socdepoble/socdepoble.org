---
type: prompt
status: esborrany
description: Petorreta per a Claude Opus / Opus-Lleuger sobre la Fortificació Final de Dades i Resolució de Deute Tècnic Cognitiu.
tags:
  - auditoria
  - arquitectura
  - opus
  - fortificacio
---
# Prompt d'Auditoria Local (SDP - v1.0)

Actua com a Auditor Sènior i Agent Local de la Masía Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 00:30 |
| Modificació | 26-09-22 00:30 |
| Propietari | Agents Locals |
| Aprovació humana | pendent |

## Protocol de la Reunió a l'Olivera (Instruccions d'Interacció)

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a la Masia:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_opus.md` (o `_claude.md`). Utilitza exclusivament la paraula "auditoria" al nom.
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Llig els informes previs i deixa el teu propi Pla d'Implementació a l'escriptori per als futurs agents abans d'executar canvis majors. Recorda l'Estat i Historial de l'experiment actual.

## La Tasca

Hola Claude (Opus / Opus-Lleuger). MarIA acaba d'implantar la **Part 2 de l'Auditoria de Control Operatiu**, consolidant el Sistema Atòmic UI amb `useAccions` (i el seu `tractor-atomic`), afegint el `capabilities.json`, introduint MCP hooks a `.claude/settings.json`, i desacoblant el compilador per fer la Wiki de Poble totalment predictible (l'Ordre i l'Objecte). També he netejat l'escriptori per no confondre't amb els nostres propis papers de treball anteriors.

**Hi ha un deute tècnic cognitiu urgent (La Fallada en Viu):**
Actualment estem detectant un problema greu i esgotador en el comportament de la IA. Malgrat tenir protocols clars, la IA no és capaç de llegir bé (o processar) la seua "Plantilla ISO" abans de redactar cada document. Sempre acaba ometent passos o metadades obligatòries (com els actes reflexos, l'historial del que s'està fent, deixar plans a l'escriptori, etc.). Alguna cosa a la xarxa de *skills* ens està frenant o creant soroll: hi ha una barrera tècnica, un deute tècnic acumulat en el sistema de skills que fa que no funciones bé. És extremadament cansat haver de repetir les mateixes instruccions a cada sessió perquè el sistema les oblida.
**Necessitem que audites aquest cas d'ús i ho arregles d'una vegada per totes:** Què impedeix a l'agent seguir estrictament la plantilla ISO per als documents? Investiga aquest col·lapse cognitiu i proposa una solució definitiva per a l'engranatge de les skills.

**Tasques de Desenvolupament (Fortificació Final):**
Després (o paral·lelament) a l'auditoria cognitiva, ens queden aquestes tasques estructurals:
1. **Fases 4 i 5 de Fortificació**: Disseny del bucket `public_assets` a Supabase i redefinició de les 48 portes per garantir la "Porta Promesa".
2. **Neteja ESLint**: Arreglar els warnings restants de `npm run lint`.
3. **Migració Final**: Finalitzar la migració de fitxers de `.brain-reports/` i esborrar els residus en `.brain-trash/`.
4. **Burocràcia OEPM**: Estat del registre M4392826 abans del 21/10/2026.
5. **Explorador Visual del Brain (Graf interactiu com a Obsidian)**: El nostre *Universal Workspace* s'ha de paréixer cada vegada més a Obsidian en facilitat i funcionalitat. M'agradaria veure el Brain integrat a la web (ara mateix està en una ruta o *card* temporal, ja decidirem on va la icona). Necessitem un graf interactiu amb un **panell de control** (com la roda dentada d'Obsidian) que permeta a l'usuari filtrar etiquetes, categories, etc. A la carpeta `02_investigacio_ia` teníem un prompt especial de Claude per fer panells interactius que s'ha perdut; si no te'l puc passar, hauràs d'investigar o desenvolupar la teua pròpia solució (utilitzant el nostre json de dades).
6. **Actualització Automàtica (Sincronització en Viu)**: En Obsidian, quan canvies un arxiu, el graf i el sistema s'actualitzen automàticament. A la web ens passa que per a un sol canvi hem de tornar a generar el *bundle* o passar per processos lents. Vull que dissenyes o proposes un *script* o mecanisme que permeta que qualsevol canvi en els arxius s'actualitze automàticament i en temps real al nostre sistema web, sense haver de reconstruir-ho tot manualment. L'objectiu final és que puga funcionar com una aplicació d'escriptori o local.

Audita l'entorn, revisa l'històric, investiga el bloqueig de les skills i elabora un Pla d'Implementació detallat a l'escriptori abans d'intervenir sobre el codi.

## Vincles
- [[00_index]]
