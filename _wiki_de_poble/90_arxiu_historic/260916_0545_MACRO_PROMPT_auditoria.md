---
tipus: petorreta
estat: esborrany
description: Auditoria d'arquitectura inversa i integració amb Sollutia
tags:
  - maquina
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609160345 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 03:45 |
| Modificació | 2026-09-16 03:45 |
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

- `260916_0545_MACRO_BUNDLE_auditoria.md` · sha256 del manifest: 44d27f72bae297a783ee5d9a616787e68fbc2a90357f616b7f0e47a28da2bb22

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

Bundle aparellat: 260916_0545_MACRO_BUNDLE_auditoria.md.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.

## Missió

Ets **Claude Code** i et trobes en mode de potència 'extra'. Acabes de realitzar una auditoria extrema on has detectat 10 defectes crítics en la integració amb Sollutia i en l'arquitectura de seguretat del portal. La teua missió ara **no és fer una altra auditoria, sinó EXECUTAR ELS CANVIS I CORREGIR ELS DEFECTES**. 

Aquest és el teu **Pla d'Acció de 10 Punts** que has d'implementar al repositori:

1. **No aplicar `260915_0100`.** Substituir-la per este SQL: Drop/create les polítiques de `organizations`, `app_content` i `organization_claims` per solucionar l'error de compilació de `private.es_superadmin()`.
2. **Arreglar `create_organization`.** A `initial_schema.sql:541`, canviar a `on conflict (id) do nothing`.
3. **Portal per a convidats.** A `content.js:15`, fer que només es consulte `notes` si hi ha sessió; gestionar l'error del Mur perquè no tombe el portal sencer.
4. **Client supabase-js.** Reiniciar el singleton amb cada auth-change i renovació. Substituir `auth.getUser()` per `usuariDeSessio()`. Recarregar la pàgina en fer logout.
5. **Xat.** Sondejar també el fil obert o activar la publicació Realtime comprovant-ne la RLS.
6. **Sollutia (ADR).** Escriure una ADR d'una pàgina al directori de govern on tries i justifiques formalment el Model B (o C) de la integració, i assegurar-te que el codi s'alinea amb la decisió.
7. **Build.** Alinear la ruta del plugin de WordPress amb la porta i corregir l'ordre del `build:seo` al `package.json`.
8. **Superfície pública.** Amagar Disseny, Skills, IA i Realitat del públic. Llevar l'espècimen fals. Deixar poble per defecte a `null`.
9. **SEO mínim.** Ruta arrel cap al Mur, `canonical` a cada pàgina, `noindex` al 404, imatge OG en PNG per defecte, no esborrar meta descripció.
10. **Proves d'OAuth.** Preparar o detallar l'entorn perquè puguem comprovar en 10 minuts Google, magic link, i dominis aprovats al relé `callback.html`.

Fes els canvis de forma atòmica i quirúrgica, i deixa el repositori en verd.

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
