---
type: petorreta
status: esborrany
description: Auditoria d'arquitectura inversa i integració amb Sollutia
tags:
  - maquina
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609162248 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 22:48 |
| Modificació | 2026-09-16 22:48 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-16 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- `260917_0048_MACRO_BUNDLE_auditoria_fase4.md` · sha256 del manifest: 52a1a637130f98b8e9b3f799a40c1d66307ce5199df585cc86fcb404f60e196e

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe · Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt.
2. Els únics fitxers que existixen són els del manifest, amb ruta i sha256. Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
4. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat. Tot fitxer sense la seua tanca `<<<FI_FITXER>>>` és il·legible. Omplir el buit és al·lucinar.
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.

## Context Global del Projecte (Llegiu obligatòriament)

Som **Sóc de Poble**, un portal web rural per connectar les comarques de l'interior d'Alacant. Naixem de l'Associació El Rentonar com a resposta a l'incendi forestal de l'estiu de 2022. La nostra missió és enfortir la identitat i l'economia local. La plataforma tecnològica que esteu auditant està completament enfocada a l'eficiència, usant vanilla CSS modular (Pedra Seca) i React, sense llibreries innecessàries.
El nostre host/proveïdor de backend és **Sollutia**. Sóc de Poble s'incrusta dins de Sollutia via iframe, i rebrà la identitat dels usuaris (autenticació) mitjançant un canal segur `postMessage`.

## Informe d'avanç

Hem aplicat totes les recomanacions de seguretat del Consell per a tancar la vulnerabilitat del canal iframe. A més, hem aplicat els retocs finals detectats per Grok a l'última auditoria de la frontera d'autenticació: 
- Hem assegurat que `injectaSessio` requerix `emissorEsperat`, passant-lo automàticament des de l'`event.origin` a l'Iframe, i hem actualitzat l'informe d'integració.
- Hem afegit explícitament l'exportació de `configura` dins de `exposaGlobal` a `host.js`.
- Hem bloquejat els orígens de `localhost` quan no estem a l'entorn de desenvolupament a `host.js`.

## Situació i dades opaques

Sollutia requereix una validació final de Fase 4 (Enxufabilitat i Seguretat). 
A més, tenim pendent migrar el CSS antic (legat.css) cap a la nova arquitectura modular basada en el sistema de disseny PedraSeca.

## Missió

1. **Auditoria Extrema de Seguretat (Fase 4):** Revisa el pont de comunicació iframe a `src/host.js` i `src/main.jsx`. Comprova si l'arquitectura en dues fases (Configuració -> Segellat) i el pont via `postMessage` són completament estancs a atacs cross-origin i manipulacions de la sessió.
2. **Auditoria d'Arquitectura (Fase 5 - Pedra Seca):** Avalua l'estat actual de la migració de disseny. Analitza on ens trobem pel que fa a l'eliminació del codi zombi de `legat.css` i la integració del nou sistema PedraSeca. 
3. Proposa els passos tècnics exactes per a buidar completament el `legat.css` de manera segura, sense trencar la presentació visual actual.

## Eixida esperada

markdown

## Incògnites

- Cap incògnita declarada en generar el prompt.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"a20fd218eb0846e440c283f61831707834c48e7be7b4eaa86ef0c1777165ef69","_wiki_de_poble/01_ser/00_bios.md":"9558f0da85ef1979d4a9597ff2b62173a954658408cf50f51a1e8811931dd2df","_wiki_de_poble/01_ser/02_genotip.md":"4f8bc44c5a364546fd6023dd733282551be62819f4cb7af14e0c848b27a3a73c","_wiki_de_poble/02_saber/doc_governanca.md":"8357042f0428371fcfcc033f598e7465a992f086cbe23482beae8e3463b5df42","_wiki_de_poble/02_saber/doc_logos_oficials.md":"9b138b99ce206f2c9298b28e3759e5e25e1952acf9eceb59448f509a61f57da1","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"bff770c9a5d7bb4f43cca129709140b00eeb31490a2384ea7de9542673488cc7"} -->
