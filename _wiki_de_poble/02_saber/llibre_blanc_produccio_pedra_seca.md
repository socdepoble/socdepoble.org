---
type: document
status: esborrany
description: Documenta el mètode Pedra Seca per produir una aplicació web online i mantenible sense sobreenginyeria.
tags:
  - disseny
  - saber
---
# Llibre Blanc de Producció (El Mètode Pedra Seca)

Cinc fases per a construir Sóc de Poble sense tornar a caure en la sobreenginyeria: delegar la infraestructura, no reinventar components, tancar les IAs dins de les seues lleis, migrar per substitució gradual i deixar que les portes mecàniques guarden el disseny.

Aquest document és el monument de la **Segona Oportunitat**. S'escriu per a evitar repetir "els sis mesos de plorar per desesperació" que vàrem passar creant un sistema que treia un 10 a les auditories però que era impossible de mantindre i d'escalar en el món real.

Aquesta és la metodologia estricta per a muntar un "[[el_projecte|Sóc de Poble]]" des de zero sense entropessar amb la sobreenginyeria casolana.

---

## Fase 1: La Delegació Estructural (El Ciment)

L'error d'arrel és intentar que una IA o un sol humà cree i gestione tota l'arquitectura DevOps, l'allotjament, la base de dades i les regles de desplegament.

**La Regla:** No faces la infraestructura de base si pots delegar-la, però no delegues mai el disseny ni l'arquitectura del frontend.
- Sollutia, el nostre soci, fa d'amfitrió i dona suport d'infraestructura ([[soci_sollutia]]). No interferix en l'arquitectura ni en el disseny.
- El frontend és nostre i 100% modular: un Web Component (React i Vite, CSS natiu amb tokens `--sdp-*`) que s'endolla a l'amfitrió i llig l'API de Sollutia només per GET a través de la Frontissa, amb el Supabase de Sóc de Poble com a font de veritat (Model B, [[ADR-2026-09-SOLLUTIA-MODEL-B]]).
- Construïm a partir d'eixe ciment; no el dissenyem nosaltres en fals.

## Fase 2: El Parasitisme Intel·ligent (El Disseny UI)

L'altre gran pou de desesperació és dibuixar (i programar) components complexos (un *slider*, un *dropdown*, un modal amb animacions) des de zero confiant en *prompts* de la IA.

**La Regla:** No dibuixes la roda. Empra un *Design System* consolidat i modifica'l.
- **A nivell de Figma:** Utilitza una base testada mundialment (ex: *Material 3 Design Kit* de Google). Modifica els *tokens* essencials perquè respiren l'ànima del projecte: la teua tipografia (Noto Sans), els teus colors purs (Taronja `#FF7300` / Blau `#0984E3`) i la mida *Bancal Mode* (objectius tàctils còmodes de 48px, `--sdp-touch-comode`, i mai per davall dels 44px de `--sdp-touch`). Lleva-li les ombres innecessàries per apropar-ho a la "Pedra Seca".
- **A nivell de Codi:** El sistema propi Pedra Seca (tokens semàntics `--sdp-*` i components universals) ja resol esta capa. Una llibreria *headless* externa només entraria si aporta més valor que cost, justificada i dins del Baseline 2022; la "mà de pintura" són sempre les variables CSS del sistema.

## Fase 3: La Contenció de l'IA (L'Eixam Tancat)

Un problema massiu va ser tindre IAs generant arxius per tot arreu, inventant noms de carpetes i redactant literatura abstracta interminable.

**La Regla:** Món tancat per a les Màquines.
- Totes les normes han d'estar injectades al directori arrel del projecte (`AGENTS.md` i `.agents/`). L'IA no pot eixir d'aquestes normes (les *Lleis de Pedra Seca*).
- L'IA treballa sempre en un únic **Escriptori** (`_wiki_de_poble/04_escriptori/`). Allí es revisa i s'audita abans de passar a `10_actes/` o a l'arxiu històric (`90_arxiu_historic/`).
- Les "Skills" o ferramentes que fa servir l'IA han de tindre un propòsit singular.

## Fase 4: La Llei del Trasplantament i Migració

Quan hem de reescriure o migrar una plataforma vella cap a la nova, no es fa de colp i no s'hereten els vicis visuals del passat.

**La Regla:** El Patró *Strangler Fig*.
1. **Quarantena:** Tot el codi que ve del passat es posa fora de l'arrel de producció perquè no contamine.
2. **Trasplantament:** Extraiem i adaptem únicament la *Lògica* i els *Serveis*.
3. **Reescriptura Visual:** La vista (JSX / CSS) s'esborra i es reconstruïx peça per peça usant els *UniversalComponents* creats en la Fase 2.

## Fase 5: El Tractor Mestre (La Duana Cega)

Les bones intencions no frenen l'entropia; només els processos mecànics ho fan.

**La Regla:** Si el codi trenca el disseny, el codi no es guarda.
- Instal·la *hooks* pre-commit i linters d'AST (El Tractor Mestre, avui `npm run porta` i el hook de Husky) que rebutgen immediatament el codi si detecten invents manuals de l'IA o del desenvolupador.
- Està rigorosament prohibit usar valors *hardcoded* (`#FF7300`, `13px`) dins d'un component UI final. Només s'accepten tokens semàntics del *Design System* (`--sdp-accent`, `--sdp-accio`…).

---

*Nota Final: Aquest llibre és una declaració d'intencions, escrit just al moment de reprendre la refundació del projecte des de la carpeta `Som de Poble`. Ací queda gravada l'esperança i la mètrica d'èxit de no tornar a "plorar per desesperació".*

## Vincles

- [[00_index]]
- [[el_projecte]]
- [[soci_sollutia]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[identitat_visual]]
