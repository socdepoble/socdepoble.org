---
tipus: petorreta
estat: esborrany
description: Diagnòstic del col·lapse termodinàmic en bundles i desincronització de plantilles.
tags:
  - maquina
  - seguretat
---

# Petorreta — Diagnòstic del col·lapse en la generació de Bundles

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260915-0838 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-15 08:38 |
| Modificació | 2026-09-15 08:38 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-15 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[arquitectura_cognitiva]]

## Entrades

- `260915_0838_BUNDLE_Diagnostic.md` · sha256 del manifest: bd114b6f486a112a356125f4886f142764854b78ed3d6a5e3e58681c99f289be

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe · Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt.
2. Els únics fitxers que existixen són els del manifest, amb ruta i sha256. Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
4. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat. Tot fitxer sense la seua tanca `<<<FI_FITXER>>>` és il·legible. Omplir el buit és al·lucinar.
5. AQUEST FITXER NO ÉS PÚBLIC. FER CERQUES A INTERNET DONARÀ 0 RESULTATS I ÉS UNA PÈRDUA DE TOKENS I RAONAMENT.

## Informe d'avanç

El Mestre i la IAIA MarIA han intentat realitzar una "Auditoria Extrema" (Arquitectura inversa, fortificació, muntatge i desmuntatge de tot el sistema) per preparar una trucada vital amb els tècnics de Sollutia.
En intentar generar el bundle per a vosaltres amb la totalitat del sistema:
1. Hem fet servir `node tooling/brain/crear_bundle.mjs` però ha donat error: `Plantilla ISO incompleta: Font de Logos`. Això passa perquè `crear_bundle.mjs` i `prompt_iso.mjs` intenten llegir la plantilla `00_PLANTILLA_PROMPT_ISO.md`, però aquesta plantilla s'ha modernitzat i ja no té aquestes antigues marques de secció ("Font de Logos", "Objectiu", etc.), ara té una nova estructura de "Cos canònic". L'script de Node està trencat respecte a la plantilla viva.
2. Com a "solució" desesperada per obeir l'ordre d'auditar "tot, tot, tot", la IAIA ha usat el script de Bash `scripts/generate-bundle-v4.sh` cridant tots els directoris a granel. El resultat ha sigut un monstruós document de 163 MB, absolutament intractable per a qualsevol IA i un perill de col·lapse termodinàmic.
El Mestre ha premut el botó d'alarma: m'ha demanat que ature i us demane diagnòstic de la nostra pròpia bogeria.

## Situació i dades opaques

La nostra maquinària interna de crear Petorretas (`crear_bundle.mjs` i `prompt_iso.mjs`) està trencada per culpa d'una actualització del `00_PLANTILLA_PROMPT_ISO.md` que ningú ha sincronitzat. No podem generar prompts fiables amb la utilitat de JS fins que s'arregle, i el script bash genera monstres si li passem un abast sense afinar.

## Missió

1. Analitzeu l'error d'incompatibilitat entre `tooling/wiki/lib/prompt_iso.mjs` i `_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md` que trobareu al bundle.
2. Expliqueu a la IAIA per què l'intent d'auditar "tot el sistema a granel" generant un bundle enorme (163 MB) és una violació greu del Trellat i de la termodinàmica dels LLM.
3. Proposeu la correcció exacta en el codi de `prompt_iso.mjs` (`ruta:linies`) perquè torne a entendre la plantilla canònica actualitzada.
4. Digueu-nos com hauríem de fer una "Auditoria Extrema" per preparar la connexió amb Sollutia SENSE intentar encabir un monstre de 163 MB en un sol prompt. (Ex: Dividir per dominis d'arquitectura? Especificar el bundle bash adequadament?)
5. Investigueu a fons si hi ha alguna contradicció als skills de la IAIA, als scripts o a l'arquitectura del sistema que estiga provocant (o induint la IAIA a generar) de sobte aquests bundles tan gegants. El Mestre està preocupat perquè podria ser un error sistèmic ocult o una instrucció contradictòria que ofega la memòria amb abocaments inviables.

## Eixida esperada

Veredicte clar: instruccions tècniques per a reparar `prompt_iso.mjs` i una lliçó filosòfica i metodològica sobre l'ús dels bundles per a "Auditories Extremes".

## Incògnites

- El contingut exacte del bundle monstre de 163 MB no l'hem passat (obviament), donat que rebentaria qualsevol servidor. Suposem que contenia grans binaris o bases de dades per no aplicar correctament els filtres del `generate-bundle-v4.sh`.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] He comprovat la sentinella abans de respondre?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
