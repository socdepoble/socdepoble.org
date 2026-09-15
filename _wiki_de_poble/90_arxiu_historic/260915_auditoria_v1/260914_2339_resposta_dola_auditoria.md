---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: Dola"
---
# 🛡️ AUDITORIA DEL PAQUET AUDITORIA — Informe (Dola)

## Bloc Fixe d'Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** Sóc de Poble és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Online-First' ni 'Online-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Resum Executiu

El paquet **auditoria** presenta una **desincronització entre la guia documental (`auditoria_canonica.md`) i la realitat del codi**. El skill descriu rutes, estructures i comandes que ja no existeixen o han canviat de ubicació. Això no trenca l'execució tècnica (els scripts reals funcionen), però sí que **enganya el Consell d'IAs** quan intenta seguir la guia, generant diagnòstics falsos per "no trobar" fonts de veritat que sí existeixen però en altres rutes.

---

## TROBALLA 1 — Rutes de fonts de veritat obsoletes

**Severitat:** ⚠️ CRÍTICA  
**Font de veritat en conflicte:** `_wiki_de_poble/02_saber/skills/auditoria_canonica.md` secció "Fonts de veritat" vs. estructura física real del bundle.

### Evidència

El skill declara:
```
1. `03_GOVERNAR_Normativa_Regles/` governa les normes.
2. `02_ACTUAR_Maquina_Tecnica/scripts/schema.json` governa el frontmatter v2.
3. `autoneteja_wiki.mjs` governa l'auditoria estructural i del graf.
4. `.agents/PROTOCOL_PETORRETA.md` governa qualsevol efecte lateral mitjançant el Reflex.
```

Realitat verificada al bundle MANIFEST:
| Ruta declarada al skill | Ruta real al bundle | Estat |
|---|---|---|
| `03_GOVERNAR_Normativa_Regles/` | No existeix com a directori | ❌ Ruta obsoleta |
| `02_ACTUAR_Maquina_Tecnica/scripts/schema.json` | `tooling/wiki/schema.json` | ❌ Ruta obsoleta |
| `autoneteja_wiki.mjs` | `tooling/wiki/autoneteja_wiki.mjs` | ⚠️ Ruta sense prefix |
| `.agents/PROTOCOL_PETORRETA.md` | `.agents/PROTOCOL_PETORRETA.md` | ✅ Correcte |

### Proposta de correcció mínima
Modificar només les 4 línies de la secció "Fonts de veritat" a `auditoria_canonica.md`.

---

## TROBALLA 2 — Arquitectura 4+2 desincronitzada

**Severitat:** ⚠️ ALTA  
**Font de veritat en conflicte:** `auditoria_canonica.md` secció "Arquitectura 4+2" vs. estructura física vs. `tooling/wiki/core/ontology.json`.

### Evidència

El skill declara els pilars: `00_SER`, `01_SABER`, `02_ACTUAR`, `03_GOVERNAR` + espais `04_ARXIU`, `05_Escriptori`.

Realitat física (MANIFEST del bundle):
| Declaració | Realitat |
|---|---|
| `00_SER` | `_wiki_de_poble/01_ser/` |
| `01_SABER` | `_wiki_de_poble/02_saber/` |
| `02_ACTUAR` | `_wiki_de_poble/03_actuar/` |
| `03_GOVERNAR` | ❌ No existeix |
| `04_ARXIU` | `_wiki_de_poble/10_actes/` |
| `05_Escriptori` | `_wiki_de_poble/04_escriptori/` |

A més, `tooling/wiki/core/ontology.json` encara defineix les zones velles: `00_SER_Brain_Identitat`, etc.

---

## TROBALLA 3 — Comandes canòniques no definides

**Severitat:** ⚠️ MITJANA  
**Font de veritat en conflicte:** `auditoria_canonica.md` secció "Comandes canòniques" vs. `package.json`.

### Evidència

El skill llista:
`npm run wiki:audit`, `npm run wiki:audit:strict`, `npm run precommit:sdp`, `npm run reflex:doctor`.

`package.json` real: **CAP d'aquestes comandes existeix**. Les equivalents reals són `porta:frontmatter`, `porta:llaurador`, etc.

---

## TROBALLA 4 — Inconsistència d'ontologia: estat "futur"

**Severitat:** ⚠️ MITJANA  
**Font de veritat en conflicte:** `tooling/wiki/core/ontology.json` vs. `tooling/wiki/schema.json`.

### Evidència

`ontology.json` enumera els estats: `canonic, actiu, esborrany, arxivat, quarantena, generat`.
`schema.json` enumera un més: `futur`.
Fitxers com `contingencia_offline.md` usen `estat: futur` correctament segons l'esquema, però l'ontologia no ho reconeix.

### Proposta de correcció mínima
Afegir `"futur"` a l'array `estats` de `tooling/wiki/core/ontology.json`.

---

## TROBALLA 5 — Enllaços trencats i auto-referències

**Severitat:** ⚠️ BAIXA  
**Font de veritat en conflicte:** Secció final de `auditoria_canonica.md`.

### Evidència
```
**Categoria:** skills (BROKEN LINK: skills) <!-- TODO: fix link -->
```

---

## Resum de correccions mínimes verificables

| # | Fitxer | Canvi |
|---|---|---|
| 1 | `_wiki_de_poble/02_saber/skills/auditoria_canonica.md` | Corregir 4 rutes de "Fonts de veritat" |
| 2 | `_wiki_de_poble/02_saber/skills/auditoria_canonica.md` | Actualitzar "Arquitectura 4+2" |
| 3 | `_wiki_de_poble/02_saber/skills/auditoria_canonica.md` | Actualitzar "Comandes canòniques" |
| 4 | `tooling/wiki/core/ontology.json` | Afegir `"futur"` a `estats` |
| 5 | `tooling/wiki/core/ontology.json` | Actualitzar zones `live` |
| 6 | `_wiki_de_poble/02_saber/skills/auditoria_canonica.md` | Arreglar `BROKEN LINK: skills` |
