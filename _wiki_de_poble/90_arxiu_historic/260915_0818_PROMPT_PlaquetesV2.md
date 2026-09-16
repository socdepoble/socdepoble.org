---
tipus: petorreta
estat: esborrany
description: Sol·licitud al Consell per a dissenyar Plaquetes v2 (mode autònom CRON i purga real d'enllaços orfes).
tags:
  - govern
---

# Petorreta — Disseny de Plaquetes v2 (El Sistema Autònom)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260915-0818 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-15 08:18 |
| Modificació | 2026-09-15 08:18 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-15 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[arquitectura_cognitiva]]
- [[governanca_i_manaments]]

## Entrades

- `260915_0818_BUNDLE_Plaquetes.md` · sha256 del manifest: c65d8006301ee0ec3dc421b2d3c2684c95b50a5214bef762e14ea96af17fd4c8

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

## Informe d'avanç

El Mestre ha identificat que la Wiki continua mostrant dotzenes d'enllaços orfes al panell d'Obsidian (especialment cap a rutes com `00_SER_Brain_Identitat/...` i `02_saber/skills_mirror/...`).

El nostre script encarregat d'això és `scripts/immunitari/plaquetes.mjs`. Al bundle adjunt trobareu aquest script i la seua configuració `.immunitari/config.json`. He detectat dues causes que ens impedeixen tindre un cervell completament net d'orfes:
1. **Plaquetes v1 prohibeix l'execució autònoma:** A la línia 23 hi ha una "LÍNIA ROJA" explícita que avorta l'execució si es crida amb `--autonom`.
2. **Exclusions Cegues:** El `config.json` exclou `00_AGENTS_I_SKILLS_MIRROR` directament. Açò provoca que, si hi ha enllaços trencats dins d'aquells fitxers, les Plaquetes no els veuen ni els esborren, però l'Obsidian sí que els llista com a "Unresolved links".
3. **Format d'Esborrat (Llàpides):** Actualment, Plaquetes substitueix l'enllaç trencat per un enllaç al Memorial (ex: `[[00_MEMORIAL_Lapides#nom|nom †]]`).

## Situació i dades opaques

El Mestre ha donat l'ordre: "Que todo lo que no existe se borre como enlace de la Wiki. Estamos intentando crear un cerebro realmente limpio". També demana que el script es convertisca en un CRON que s'execute automàticament (p. ex: cada hora o a cada sessió) sense requerir signatura humana.
Volem que dissenyeu l'arquitectura de la v2.

## Missió

1. **Dissenyar el Mode Autònom (CRON):** Proposeu els canvis a fer en `plaquetes.mjs` per retirar la "LÍNIA ROJA" i permetre l'execució `--autonom`. Aquesta execució ha d'aplicar les operacions (lapidar o esborrar) de forma directa al disc i fer commit, evitant bucles infinits.
2. **Definir l'Estratègia d'Esborrat:** Us plantegem aquest dubte de disseny: és millor canviar l'script perquè **elimine els claudàtors** dels enllaços trencats (convertint `[[nom]]` en `nom`) per fer-los desaparéixer per complet del panell d'Obsidian, o bé mantenim el patró de les "Llàpides"?
3. **Solucionar les Exclusions:** Com adaptem el `config.json` o la lògica del script perquè netege *tot* el vault d'orfes, incloent-hi els *Mirrors* dels Agents, sense trencar res important?
4. Redacteu el codi refactoritzat per a `plaquetes.mjs` que incorpore estes solucions.

## Eixida esperada

Un informe complet amb l'avaluació de riscos de permetre l'autonomia al script, la resposta a l'estratègia d'esborrat (Llàpida vs text pla), i el codi per substituir completament el script actual.

## Incògnites

- Quin és el millor mecanisme tècnic local per a llançar aquest procés periòdicament a la màquina del Mestre?
  > **AVÍS DE TRELLAT:** El Mestre exigeix la solució amb **menys deute tècnic possible**. No volem eines feixugues (com PM2) si hi ha alternatives més netes i natives que no compliquen la vida quan el projecte siga lliurat a tercers. Proposeu la via més senzilla i resilient.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
