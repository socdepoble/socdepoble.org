---
type: plantilla
status: canonic
description: Plantilla especial de Petorreta per a IAs internes de frontera (Codex, Claude)
tags:
  - govern
  - saber
aliases:
  - plantilla petorreta interna
  - petorreta frontera
---

# Plantilla Prompt Intern (Codex / Claude)

Aquesta plantilla està dissenyada exclusivament per a membres de l'equip amb accés natiu a l'entorn de treball (com ara Codex a Cursor o Claude a Cowork). Per a aquests agents NO s'ha de generar mai cap bundle; ells lligen directament els fitxers de la màquina local.

## Com s'instancia

1. Crea `_wiki_de_poble/04_ESCRIPTORI/AAAAMMDD_HHMM_CATEGORIA_tema.md` — any de **4 xifres**.
   **Les categories vàlides per a les petorretas són:**
   - `MACRO_PROMPT`
   - `MICRO_PROMPT`
   - `PROMPT` (legacy)
2. Substituïx el frontmatter sencer del fitxer nou pel bloc de §Frontmatter.
3. Ompli `description` (entre 12 i 140 caràcters) i tria els `tags`.
4. Passa la porta: `node tooling/wiki/tractor-frontmatter.mjs --estricte`.

## Frontmatter

```yaml
---
type: petorreta
status: esborrany
description: Avaluació del Tractor de Metadades per a Codex
tags:
  - govern
  - arquitectura
---
```

### Domini de les claus

`type` · petorreta, macro_prompt, micro_prompt.

`status` · canonic, actiu, esborrany, arxivat, quarantena, generat, futur.

`description` · text de 12 a 140 caràcters. És l'única prosa que la màquina
llig. No és el títol: és què conté el document i quan cal obrir-lo.

`aliases` · fins a 5, sense repetits, d'1 a 80 caràcters. Opcional.

`tags` · llista sense repetits. Vocabulari operatiu: acta, arquitectura, core,
disseny, escriptori, genoma, govern, graf, identitat, legal, maquina, saber,
seguretat, skills, sollutia, temporal. Dos com a màxim: un tag que apareix a
tot arreu no partix res i acaba caient per F5.

## Cos canònic

Tot el que abans anava al frontmatter i no es consultava mai baixa ací. Són
dades de procedència: es lligen quan s'obri el document, no es filtren per
tot el corpus.

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

`status: esborrany` i una aprovació amb data són incompatibles. Si el document
està aprovat, l'estat és `actiu` o `canonic`. Si encara no ho està, l'aprovació
queda en «pendent». La taula i el frontmatter no es poden contradir.

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

{on estem i què ha canviat des de l'última petorreta}

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

{què no sabem i per què ho preguntem}

## Missió

1. {encàrrec verificable}
2. {encàrrec verificable}

Cada encàrrec ha de poder acabar en un veredicte citable. «Avalua a fons» no és un encàrrec: és un desig.

## Eixida esperada

{format, extensió i on es desa el producte}

## Incògnites

- {allò que el teu accés natiu no et permeta aclarir}

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
