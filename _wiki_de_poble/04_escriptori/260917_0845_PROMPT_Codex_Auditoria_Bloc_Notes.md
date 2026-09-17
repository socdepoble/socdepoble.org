---
tipus: petorreta
estat: esborrany
description: "Auditoria d'arquitectura inversa i integració amb Sollutia"
tags:
  - maquina
  - seguretat
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609170645 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 06:45 |
| Modificació | 2026-09-17 06:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-17 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- **Accés Natiu Local**: Com a agent integrat, tens accés de lectura a tot el directori `socdepoble.org`. No s'adjunta cap bundle.

## Consell convocat

Codex (Agent d'Entorn Local)

## Contracte de realitat

1. **Accés Directe**: Tens accés de lectura a l'arrel del repositori. Utilitza les teues eines d'escriptori per a inspeccionar els fitxers de codi directament.
2. **Només-Lectura (Prohibit trencar res)**: Aquesta és una auditoria. **TENS PROHIBIT MODIFICAR, AFEGIR O ESBORRAR CAP FITXER.** L'informe l'has de generar a banda i no has d'alterar cap línia de codi del projecte, per tal de no trencar la integració assolida.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca)**: Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi local.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem finalitzat una exhaustiva refactorització de seguretat i arquitectura: la llista blanca de dominis OAuth ara és dinàmica, s'ha aplicat el CSP `frame-ancestors` i el sistema compila perfectament en verd superant tots els Tractors i Portes. A més, hem netejat el vell `sdp.css` i migrat a l'arquitectura de Pedra Seca. El sistema està en el seu millor moment.

## Situació i dades opaques

El projecte és a la carpeta `socdepoble.org`. Has d'explorar el codi local.

No obstant això, les pàgines de "Notes" i "Disseny" estan trencades visualment per culpa de restes, divs morts i "fantasmes" d'estils anteriors. L'usuari adjuntarà a aquesta conversa una captura de pantalla d'un "mockup" del Bloc de Notes que s'ha d'implementar.

## Missió

1. **Auditoria Hiper-Extrema (Sollutia & Seguretat):** Fes una auditoria extremadament rigorosa de l'estat actual. Busca forats de seguretat residuals, defectes d'arquitectura, problemes de SEO o friccions en la integració (Enchufabilitat Absoluta) amb Sollutia. El sistema està molt polit, així que has de buscar defectes profunds.
2. **Arquitectura del Bloc de Notes (Sense Fantasmes):** Analitza les seccions de Notes/Disseny i retira tots els "fantasmes" (divs morts, estructures obsoletes).
3. **Generació del Codi Visual:** Basant-te en la captura de pantalla adjunta i el sistema de disseny "Pedra Seca", **escriu el codi complet (React/HTML/CSS)** per implementar la vista del "Bloc de Notes". Aquesta arquitectura ha de ser pura i altament versàtil: ha de servir per a albergar notes, perfils d'usuari, grups, empreses i gestoria.

## Eixida esperada

Un document Markdown detallat que incloga l'Auditoria (amb troballes profundes) i els blocs de codi complets amb la nova implementació dels components visuals per al Bloc de Notes.

## Incògnites

- Els detalls exactes de color i tipografia del "mockup" es desprenen de la imatge que adjuntarà l'usuari; utilitza els tokens equivalents de Pedra Seca del repositori.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"cf3301f9751f9f1d4ddbdd9affcaa566af99a06e8a9bfe42679e439ca94c60ed","_wiki_de_poble/01_ser/00_bios.md":"9558f0da85ef1979d4a9597ff2b62173a954658408cf50f51a1e8811931dd2df","_wiki_de_poble/01_ser/02_genotip.md":"4f8bc44c5a364546fd6023dd733282551be62819f4cb7af14e0c848b27a3a73c","_wiki_de_poble/02_saber/doc_governanca.md":"8357042f0428371fcfcc033f598e7465a992f086cbe23482beae8e3463b5df42","_wiki_de_poble/02_saber/doc_logos_oficials.md":"9b138b99ce206f2c9298b28e3759e5e25e1952acf9eceb59448f509a61f57da1","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"bff770c9a5d7bb4f43cca129709140b00eeb31490a2384ea7de9542673488cc7"} -->
