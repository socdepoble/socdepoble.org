---
type: prompt
status: esborrany
description: Prompt d'auditoria de UI per a Claude Fable i Codex amb captura de referència.
tags:
  - auditoria
  - disseny
---

# Petorreta — Auditoria de UI i Fantasmes (Fable / Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-MIN |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 06:21 |
| Modificació | 26-09-18 06:21 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Entrades

(Al ser per a agents locals, teniu accés de lectura directe al sistema de fitxers. **Mestre Javi vos adjuntarà una captura de pantalla del disseny antic correcte en este mateix xat**).

## Consell convocat

Claude Fable (bàsic) i ChatGPT Codex.

## Contracte de realitat

1. **PROHIBICIÓ ESTRICTA DE MODIFICAR CODI**: Teniu permís de lectura al disc local de l'usuari per auditar. No obstant això, **TENIU TOTALMENT PROHIBIT** editar, modificar o esborrar absolutament cap línia de codi o fitxer. Només heu d'escriure l'informe a l'Escriptori.
2. Tota afirmació sobre codi es cita com `ruta:linies`.
3. **PROTOCOL ANTI-CERCA**: Estrictament prohibit buscar per web.
4. **FANTASMES I DIVS**: La base de codi té divs que ja no serveixen i estils orfes (fantasmes) per tota l'arquitectura Universal (`UniversalWorkspace`).

## Context i Situació

El bloc de notes funcionava bé (com veureu a la captura adjunta), però els canvis estructurals han deixat desajustos visuals greus (fantasmes, 1 píxel de decalatge, línies blanques on no toquen, etc.). L'arquitectura reacciona bé en "responsive" (canviant de pantalla gran a menuda), però els estils interns estan trencats.

## Missió

Vull una **Auditoria Visual i d'Estructura DOM** exhaustiva per a solucionar el problema dels fantasmes, comparant el codi base actual (sobretot `UniversalWorkspace.jsx` i CSS) amb la captura que us passo.

1. **La Captura Adjunta:** Ja teniu la captura de pantalla de l'antic Bloc de Notes adjunta a este missatge. Reviseu-la. Així és com ha de quedar visualment el sistema de columnes i capçaleres.
2. **Neteja de CSS i divs:** Identifiqueu tots els `<div>` i estils de CSS innecessaris en `UniversalWorkspace`, `UniversalColumn` o el component que siga. No inventeu colors nous, useu el sistema de disseny "Pedra Seca".
3. **El Misteri d'1 Píxel:** Hi ha un desajust de -1 píxel (o de línies blanques entre columnes). Trobau l'origen exacte al DOM o al CSS i expliqueu com solucionar-lo. Tot ha d'encaixar a la perfecció.
4. **Regles d'Altura:** Verifiqueu el comportament de les capçaleres i valideu que puguen complir correctament les restriccions d'altura establertes (ex. els 58px).

## Eixida esperada

Genera a `_wiki_de_poble/04_escriptori/` un únic fitxer anomenat `AAMMDD_HHMM_informe_fantasmes_ui.md` on detalls fil per randa cada desajust trobat respecte a la captura i la seua solució (`ruta:linies`).

## Bateria de veritat

- [ ] He citat només rutes reals en format `ruta:linies`?
- [ ] He tingut en compte la captura de pantalla adjunta?
- [ ] He localitzat el problema del -1px i de les línies blanques?
