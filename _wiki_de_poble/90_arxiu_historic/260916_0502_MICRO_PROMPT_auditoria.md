---
tipus: petorreta
estat: esborrany
description: "Consulta al Consell: Neteja d'Entropia, Tags residuals i Lògica del Tractor"
tags:
  - maquina
  - trellat
---
# Petorreta Internacional — Consell de la Petorreta (Neteja Gràfica i Tractor)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-CONSELL-260916 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 05:02 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[tractor-cervell-ia]]

## Entrades

- `260916_0502_MICRO_BUNDLE_auditoria.md` · sha256 del manifest: a49acb09c0147339099ae8e396300e1ff6697dc9cf026dcafaee62de72e69f8f

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe ·
Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt (és un *Micro-Bundle* acotat al codi d'Agents, Skills i Tooling de Sóc de Poble).
2. Tota afirmació sobre codi es cita com `ruta:linies`.
3. **MITIGACIÓ "PEDRA SECA"**: El nostre paradigma visual i tècnic.

## Informe d'avanç

Acabem de buidar l'arxiu històric de més de 200 MB de brossa i antigues auditories, però la nostra Vista Gràfica de l'Obsidian encara mostra "pous gravitatoris" de tags residuals i categories fantasma al llarg de la Wiki viva. Hem desenvolupat un **Tractor d'Auto-Categorització** (`tractor-cervell-ia.mjs`) que converteix l'orfenesa i les metadades en un procés mecànic 100% lliure d'inferència LLM externa.

## Situació i dades opaques

El *Micro-Bundle* adjunt conté les `skills` actuals i les eines del `tooling/wiki`. Fixa't especialment en `tooling/wiki/tractor-cervell-ia.mjs` i `tooling/wiki/schema.json` (que defineix el nostre esquema V2.1 tancat i rígid).

Volem que ens ajudeu a polir aquesta arquitectura de destil·lació abans de continuar.

## Missió per al Consell

1. **Revisió del Tractor:** Analitzeu `tractor-cervell-ia.mjs` i `schema.json`. El mecanisme actual purga les claus forasteres (`socdepoble`, `authoring_agent`, `doc_id`, etc.) i ancora els orfes. Hi detecteu algun buit lògic o risc de recursivitat ara que tenim més de 200 fitxers vius a la Wiki?
2. **Estratègia Anti-Soroll:** Què hem de fer amb les propietats/etiquetes (tags) que el Tractor no ha esborrat però que no tenen cap pes semàntic? Com podem "assecar" el graf visual perquè només apareguen les relacions que de veritat importen?
3. **Validació del "Trellat":** Aporteu lliçons a `skill-memoria-historica`. Tenint en compte que estem intentant mantindre el sistema sense dependències externes innecessàries (ni pel front-end, ni per l'auto-etiquetatge)... Estem aplicant bé l'espartanisme o hem creat una solució sobre-enginyeritzada amb el Tractor?

## Eixida esperada

markdown (directe, amb to frugal i pràctic, sense *AI slop*).

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"a20fd218eb0846e440c283f61831707834c48e7be7b4eaa86ef0c1777165ef69","_wiki_de_poble/01_ser/00_bios.md":"a5ccfb085a095a684c0864809605402dffdd0b224cc7fab0e945d494057abf90","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"af8b7435e89d89ebe9a5e05a0105f4d8967876127fa6b9855ef8d7288912440b"} -->
