---
tipus: plantilla
estat: canonic
description: Plantilla ISO de Petorreta — frontmatter mínim v2.1 i cos de registre
tags:
  - govern
  - saber
aliases:
  - plantilla petorreta
  - petorreta iso
---

# Plantilla ISO de Petorreta

El frontmatter d'esta plantilla és el seu propi, real i vàlid: no conté cap
marcador. El bloc que has de copiar està dins d'un tancat de codi, i per això
no es pot llegir mai com a frontmatter. Una plantilla amb marcadors al seu
frontmatter és el vector de reinfecció de l'esquema vell; ací no n'hi ha cap.

## Com s'instancia

1. Crea `docs/psiquiatria_forense/AAAAMMDD_HHMM_tema.md` — any de **4 xifres**.
2. Substituïx el frontmatter sencer del fitxer nou pel bloc de §Frontmatter.
3. Ompli `description` (entre 12 i 140 caràcters) i tria els `tags`.
4. Passa la porta: `node tooling/wiki/tractor-frontmatter.mjs --estricte`.

## Frontmatter

Nou claus i cap més. `additionalProperties: false` vol dir que qualsevol clau
afegida ací cau com a F2. La procedència no viu al frontmatter: viu al
§Registre del cos.

```yaml
---
tipus: petorreta
estat: esborrany
description: Avaluació del Tractor de Metadades i del blindatge de l'esquema
tags:
  - govern
  - arquitectura
---
```

### Domini de les claus

`tipus` · acta, briefing, document, hub, index, informe, norma, plantilla,
prompt, protocol, registre, skill, petorreta.

`estat` · canonic, actiu, esborrany, arxivat, quarantena, generat, futur.

`description` · text de 12 a 140 caràcters. És l'única prosa que la màquina
llig. No és el títol: és què conté el document i quan cal obrir-lo.

`aliases` · fins a 5, sense repetits, d'1 a 80 caràcters. Opcional.

`tags` · llista sense repetits. Vocabulari operatiu: acta, arquitectura, core,
disseny, escriptori, genoma, govern, graf, identitat, legal, maquina, saber,
seguretat, skills, sollutia, temporal. Dos com a màxim: un tag que apareix a
tot arreu no partix res i acaba caient per F5.

Les claus `name`, `triggers_on`, `core` i `prioritat` existixen a l'esquema
però són del contracte d'skills. Una petorreta no les porta.

## Cos canònic

Tot el que abans anava al frontmatter i no es consultava mai baixa ací. Són
dades de procedència: es lligen quan s'obri el document, no es filtren per
tot el corpus. El cens 260901 ja ho va dir amb aritmètica — 17 de 34
propietats amb entropia 0,00 — i este és el lloc on van.

# Petorreta — {tema}

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-AAAAMMDD |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | AAAA-MM-DD HH:MM |
| Modificació | AAAA-MM-DD HH:MM |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · AAAA-MM-DD |
| Revisió pendent | sí / no |

`estat: esborrany` i una aprovació amb data són incompatibles. Si el document
està aprovat, l'estat és `actiu` o `canonic`. Si encara no ho està, l'aprovació
queda en «pendent». La taula i el frontmatter no es poden contradir.

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- `AAAAMMDD_HHMM_BUNDLE_tema.md` · sha256 del manifest: …

L'entrada no es pot dir com el document. Un fitxer que es llista a si mateix
com a entrada no declara res.

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

{on estem i què ha canviat des de l'última petorreta}

## Situació i dades opaques

{què no sabem i per què ho preguntem}

## Missió

1. {encàrrec verificable}
2. {encàrrec verificable}

Cada encàrrec ha de poder acabar en un veredicte citable. «Avalua a fons» no
és un encàrrec: és un desig.

## Eixida esperada

{format, extensió i on es desa el producte}

## Incògnites

- {allò que el bundle no permet respondre}

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
