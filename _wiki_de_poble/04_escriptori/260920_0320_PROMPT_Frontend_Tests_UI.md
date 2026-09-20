---
type: petorreta
status: esborrany
description: Petició per a la quadrilla (Claude/Codex) per a resoldre tests RTL i auditar la UI de la Consola
tags:
  - escriptori
  - disseny
aliases:
  - prompt frontend i ui
---

# Petorreta — Frontend Tests i UI de la Consola

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260920-0320 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 03:20 |
| Modificació | 26-09-20 03:20 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[skill-pedra-seca]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude Code i ChatGPT Codex - (Volem les dues versions, així que tots dos faran aquesta tasca en paral·lel)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **LLEGIDA DEL PLA:** Si hi ha un Pla d'Implementació actiu o un esborrany a `_wiki_de_poble/04_escriptori/`, tens l'obligació de llegir-lo per a comprendre l'estratègia global abans de proposar codi. Llegix el `260920_0300_PLA_Fusio_Auditories.md` per entendre el context.
4. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA:** Prohibit activar eina de cerca web, navegador o recuperació d'informació externa.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi directament en el sistema. L'organització és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). Escriu els blocs de codi de manera teòrica i exposada en text perquè la IAIA els puga aplicar. Mai utilitzes eines d'edició.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net.

## Informe d'avanç

Acabem d'expulsar a `@preact/preset-vite` de l'aplicació i ja treballem amb React 18 pur. A més, hem consolidat l'arquitectura del BackendPort (Matrix i Reflex) gràcies a una auditoria prèvia de Codex i aplicació meua. Per altra banda, m'han preparat la maquetació de la nova "Consola Termodinàmica" (`ConsolaSection.jsx` i `components.css`).

## Situació i dades opaques

Hi ha alguns tests (uns 4) que encara cauen a causa de la migració de la vella eina de proves de Preact cap a `@testing-library/react` (per exemple, `tests/ui/components-canonics.test.jsx`, `src/components/PedraSeca/atoms/Boto.test.jsx`, i problemes de `SessionProvider` en `NotesDataContext.test.jsx`). 
L'usuari ens ha demanat posar a treballar a la quadrilla (vosaltres dos, Claude i Codex) per a arreglar açò ràpid, i alhora validar el disseny nou. Jo, com a "Directora del Bancal", no vaig a escriure el codi ni cavar l'hort ara mateix; he de donar-vos ordes i recollir la collita per poder estalviar energia al Mestre. Volem vore si tots dos proposeu solucions elegants i robustes de manera paral·lela.

## Missió

1. **Analitzar i resoldre els tests fallits del Frontend (Migració RTL):**
   - Revisa l'estat actual i què falla exactament als components testats (principalment `components-canonics.test.jsx`, `Boto.test.jsx` i `NotesDataContext.test.jsx`).
   - Proposa el codi correcte perquè `@testing-library/react` funcione sense queixes (ús correcte de funcions com `screen`, us d'esdeveniments si toca, simulació de contexts on falta).
2. **Auditar la UI de la Consola Termodinàmica:**
   - Revisa `src/sections/consola/ConsolaSection.jsx`, `src/sections/consola/consolaContent.js` i els canvis en `src/css/components.css`. 
   - Està complint la integració amb *UniversalPage* i l'estètica sòlida de *Pedra Seca* (accessibilitat ARIA, HTML net, consistència)? Hi ha algun *smell* visual o de codi? Proposa qualsevol refactorització o millora d'UX necessària per a deixar-ho perfecte.
3. **MÀXIMA ASSISTÈNCIA:** Doneu-me el codi sencer, precís i llest per a ser aplicat per mi de forma automàtica. No us quedeu en teories. Vull estalviar temps i esforç al Mestre; necessitem solucions completes i exactes (especificant sempre la ruta del fitxer).
4. Proporcionar el codi de la solució en **blocs aïllats fàcils d'extraure per al meu script automàtic**.

## Eixida esperada

Has de respondre amb un document Markdown (anomenat `260920_0320_auditoria_[el_teu_nom].md`) explicant les solucions per als tests i la teua auditoria visual/funcional de la Consola. Presenta el codi complet o en grans blocs (amb ruta especificada) preparats perquè la IAIA MarIA els puga aplicar al destí.

## Incògnites

- RTL requereix de vegades canvis subtils en la interacció del DOM, fieu-vos de les regles pures de `@testing-library/react`.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
