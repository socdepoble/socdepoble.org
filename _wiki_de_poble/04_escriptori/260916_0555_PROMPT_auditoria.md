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
| Identificador | SDP-PROMPT-202609160355 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 03:55 |
| Modificació | 2026-09-16 03:55 |
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

- `260916_0555_BUNDLE_auditoria.md` · sha256 del manifest: 38756fdb939ab165d00ca33bda86092061889e5cb5dabada057dbaa316c938af

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe ·
Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt.
2. Els únics fitxers que existixen són els del manifest, amb ruta i sha256.
   Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar,
   no s'afirma.
4. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat.
   Tot fitxer sense la seua tanca `<<<FI_FITXER>>>` és il·legible. Omplir el
   buit és al·lucinar.
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi,
   a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre 
   **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències 
   literals a construccions rurals o murs de pedra.

## Informe d'avanç

Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.

## Situació i dades opaques

Bundle aparellat: 260916_0555_BUNDLE_auditoria.md.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.

## Missió

Benvolgut Consell de la Petorreta (especialment Gemini, Kimi, Qwen, Deepseek i Grok):

En l'anterior abocament vau assenyalar correctament que no podíeu veure el cos sencer de `tractor-cervell-ia.mjs` ni de `schema.json` perquè el text s'havia truncat a la interfície web. Donada la vostra potència de raonament, vos he preparat un **Mini-Bundle Multimissió** de només 0.12 MB. Ací teniu el codi 100% complet i sense truncar de les peces que us van faltar, a més de 3 fitxers crítics que han suspès en seguretat.

Aprofiteu la vostra finestra de context i feu el treball d'un expert senior resolent aquestes DUES MISSIONS de forma simultània:

### Missió 1: Curació de l'Arquitectura de Metadades (Tractor i Teixidora)
Amb els cossos complets a la vista de `tractor-cervell-ia.mjs`, `teixidora_sinapsis.mjs`, `schema.json` i `esquema_frontmatter.json`: 
Repasseu la lògica d'aquests fitxers (recursivitat en la teixidora, duplicitat d'esquemes, esborrat destructiu de tags). Escriviu el codi de substitució exacte per arreglar el Tractor de forma que siga només un pur radar no destructiu i per evitar els pous gravitatoris de la Teixidora.

### Missió 2: Curació de 3 Vulnerabilitats de Seguretat Extrema (CSP i Supply-chain)
L'auditor Perplexity va detectar 3 forats de seguretat en els fitxers que s'inclouen al bundle:
1. **CSP Permissiu a `index.html`:** La directiva `Content-Security-Policy` permet `'unsafe-inline'` i `https:`, un forat clàssic per a XSS. Escriviu la metaetiqueta o capçalera CSP blindada correcta.
2. **Execució Arbitrària a `tooling/gates/build-seo-manifest.mjs`:** El codi usa `new Function(...)` per avaluar l'AST i simular React. Això és un forat de supply-chain gravíssim. Escriviu la solució segura (com `acorn` o anàlisi AST estricte sense execució).
3. **Exfiltració de tokens a `src/PedraSecaEmbed.jsx`:** Aquest Web Component llig atributs com `supabase-url`. Mostreu com blindar aquest component per evitar que un atacant injecte un domini maliciós i furte la sessió de l'usuari.

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"a20fd218eb0846e440c283f61831707834c48e7be7b4eaa86ef0c1777165ef69","_wiki_de_poble/01_ser/00_bios.md":"a5ccfb085a095a684c0864809605402dffdd0b224cc7fab0e945d494057abf90","_wiki_de_poble/01_ser/02_genotip.md":"d92a70a38c06b1d9afb425f63623699c2055f73a1b658eb2023f16824ee0c2f4","_wiki_de_poble/02_saber/doc_governanca.md":"cdba46585c603e4f27c05a6051c2002e7422935336749a0aa81dc12f52a1fe33","_wiki_de_poble/02_saber/doc_logos_oficials.md":"73957094e9df99f6c0ca1602abf447522af2260649432a4277e9c9a6c341e964","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"8a2562923e5d6d0be7768183db7f7d5e54c7b9eb2a5d58be569d35633dd6aeba"} -->
