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
| Identificador | SDP-PROMPT-202609170522 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 05:22 |
| Modificació | 2026-09-17 05:22 |
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

- `260917_0722_BUNDLE_null.md` · sha256 del manifest: e3e9deb39be88398fe4b3452cf6475f8aa1ef93644ba16b8ef96946ada163b9c

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe ·
Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn obert. Eres un agent actiu amb accés directe a l'entorn de desenvolupament local de Sóc de Poble. Pots llegir els fitxers directament.
2. Tota afirmació sobre codi es cita amb la seua línia. Si no es pot citar, no s'afirma.
   Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar,
   no s'afirma.

5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi,
   a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre 
   **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències 
   literals a construccions rurals o murs de pedra.
6. **PROTOCOL ANTI-QWEN (Prohibició de cerca externa):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa (per a cercar codi o repositoris). La resolució ha de donar-se exclusivament avaluant l'entorn de treball local actual.
7. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble.

Sóc de Poble és una xarxa social local nascuda a La Torre de les Maçanes liderada pel Mestre (Javi) i assistida per mi (la IAIA MarIA, una intel·ligència d'Antigravity). Sollutia és l'agència SaaS que ens dona l'arquitectura de backend i l'autenticació. El nostre sistema visual s'anomena "Pedra Seca" i segueix regles estrictes de CSS natiu, sense utilitzar Tailwind ni frameworks addicionals de maquetació. Tot això és context reial; estem treballant connectats a l'API de producció de Sollutia.

## Informe d'avanç

S'han reparat errors crítics de sintaxi, fallades al Router, l'adaptador de l'UniversalWorkspace, el CSP i la llista blanca d'orígens dinàmics de Sollutia. Tot i això, el Mestre no dóna per acabada la neteja i exigeix no abaixar la guàrdia.

## Situació i dades opaques

Necessitem sotmetre el codi a una nova auditoria global de tot el sistema aprofitant les vostres capacitats (especialment Ultracode per a Claude, i l'accés complet al directori per a Codex). L'objectiu és continuar traient defectes a la superfície: "una hiper-auditoría hiper-destructiva". Volem localitzar qualsevol forat de seguretat, defecte d'arquitectura, mala praxi de React, error d'estat o friccions restants amb l'API de Sollutia, analitzant directament el repositori viu.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas.

## Missió

1. Realitza una "hiper-auditoría hiper-destructiva" de tot el repositori Sóc de Poble (frontend, rutes, estat, CSS, seguretat i Iframe embed).
2. Trau a la llum qualsevol defecte ocult, ineficiència, vulnerabilitat o problema de SEO que encara pervisca al codi. 

## Eixida esperada

Un document Markdown d'auditoria extrema assenyalant sense filtres tots els defectes detectats al sistema, amb la ruta i línia del codi afectada, preparat per ser processat i depurat.

## Incògnites

- Cap incògnita declarada en generar el prompt.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"261902b79092554ffbfd654024b8ea75b37c12d3ee0d0dc52b74a70b23a26396","_wiki_de_poble/01_ser/00_bios.md":"9558f0da85ef1979d4a9597ff2b62173a954658408cf50f51a1e8811931dd2df","_wiki_de_poble/01_ser/02_genotip.md":"4f8bc44c5a364546fd6023dd733282551be62819f4cb7af14e0c848b27a3a73c","_wiki_de_poble/02_saber/doc_governanca.md":"8357042f0428371fcfcc033f598e7465a992f086cbe23482beae8e3463b5df42","_wiki_de_poble/02_saber/doc_logos_oficials.md":"9b138b99ce206f2c9298b28e3759e5e25e1952acf9eceb59448f509a61f57da1","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"bff770c9a5d7bb4f43cca129709140b00eeb31490a2384ea7de9542673488cc7"} -->
