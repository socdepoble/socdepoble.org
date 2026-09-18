---
type: petorreta
status: esborrany
description: Petorreta mestra per a Codex/Claude sobre arquitectura inversa, zero defectes i connexió amb Sollutia.
tags:
  - arquitectura
  - sollutia
---

# Petorreta — Auditoria d'Arquitectura Inversa i Zero Defectes

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-1436 |
| Versió | 3.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 14:36 |
| Modificació | 26-09-18 14:36 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[260918_1436_ACTA_MARMOTA_Unificacio_i_Llucidesa]]
- [[AGENTS]]

## Entrades

*Agent local: llig directament de l'arbre del repositori local, no s'inclou bundle complet per eficiència tèrmica.*

## Consell convocat

Claude (Agent Local) · ChatGPT Codex (Cursor)

## Contracte de realitat

1. **Entorn tancat.** Analitza únicament l'estat actual del directori `src/`. No hi ha més codi.
2. **Cites exactes.** Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **Zero Al·lucinacions.** Si no trobes un element o t'ho pareix, assenyala'l estrictament com a incògnita. 
4. **MITIGACIÓ "PEDRA SECA":** Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. Mai ho al·lucinis com un mur o una referència agrària.
5. **PROTOCOL ANTI-CERCA:** Prohibició total de buscar a la web o recuperar dades en línia. Tot allò que necessites està al codi.
6. **CONTENCIÓ ABSOLUTA (Llegir i Auditar exclusivament):** Encara que pugues, tens **ESTRICTAMENT PROHIBIT** modificar cap línia de codi. No faces cap escriptura. El teu únic objectiu és produir aquest informe mestre.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, pots consultar mentalment la nostra naturalesa (basada en l'origen de socdepoble.net). Nosaltres som la xarxa, el Mestre és l'artífex. Sollutia ens proveeix el backend (via connexions API REST i Supabase). L'accessibilitat extrema, l'orgull local i l'eficiència semàntica són mandats celestials.

## Informe d'avanç

El Mestre ha dut a terme un esforç de 27 hores maratonianes d'unificació. Ens trobem just abans de donar l'arquitectura de l'`AppGridShell` i la `UniversalPage` per segellades per a la connexió massiva amb l'API de Sollutia. Hem passat per una reestructuració important i hem descobert defectes ocults prèviament (com la necessitat del CampUniversal). Ara, volem assolir una nota perfecta (10 sobre 10 i Zero Defectes) en la revisió del Codi Front-End.

## Situació i dades opaques

Hi ha por que el procés de destrucció i refactorització haja deixat restes inerts, accessibilitat trencada o culs-de-sac de navegació/xarxa (p. ex. formularis que esperen però no resolen). Necessitem una extracció completa del deute tècnic residual per garantir la imatge d'excel·lència abans d'ensenyar la maquinària a l'empresa propietària de l'API.

## Missió

Realitza una auditoria extrema d'**Arquitectura Inversa** amb especial atenció a:
1. **Draps bruts de la Web i Residuals:** Cerca qualsevol excés de nodes, `<divs>` inerts sense propòsit, regles de CSS inútils o aïllades, i culs-de-sac estructurals. Tapa els forats invisibles.
2. **Robustesa per a Sollutia:** Audita els enllaços d'estat (fronteres d'error, manipulació asíncrona de formularis al component Universal, timeouts) assegurant pur determinisme. El codi mai s'ha de penjar o amagar l'error al Mestre.
3. **Integra el Disseny (Pedra Seca) i assegura SEO / A11y:** Verifica que tota la semàntica acompanya el SEO (capçaleres correctes `h1`, etiquetes `alt`, meta-tags) i l'accessibilitat (aria-labels i estats per als lectors de pantalla i navegació per teclat com en les barres d'eines fixes). No oblides que els estils de text enriquit (`cos ric`) han d'obeir Pedra Seca sense pèrdues de tipografia.
4. **Resolució de Regressions Cícliques:** Verifica l'ús correcte d'atributs natius combinats (`inert` respectat davant qualsevol `data-obert` o similar). Evita trencar el natiu pel CSS.

## Eixida esperada

Genera un informe Markdown demolidor, complet, sincer i directe. Sentencia cada troballa de la següent forma: **Origen (`fitxer:línia`) | Greuge o Problema | Solució proposada i implementació Inversa.**
Finalitza amb una **Puntuació Numèrica dura (0/10)**. Si trobes cap defecte, la nota baixa. Volem arribar al 10.
Desa el fitxer al disc de l'escriptori com a `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_informe_auditoria_zero_defectes_[nomia].md`. No faces cap altre canvi a l'arbre de treball.

## Bateria de veritat

- [ ] He citat només rutes exactes, en format `ruta:linies`?
- [ ] Cap nom de fitxer inventat?
- [ ] No he tocat ni he intentat editar cap fitxer de l'entorn? Només he guardat l'informe?
- [ ] He entés que sóc un auditor estricte per a protegir la reunió amb Sollutia?
