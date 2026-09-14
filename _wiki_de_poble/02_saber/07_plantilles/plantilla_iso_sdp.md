---
tipus: plantilla
estat: esborrany
description: Plantilla base per crear documents coherents amb l'esquema de metadades v2 de la Wiki.
tags:
  - maquina
---
# PLANTILLA ISO SDP

## Font de Logos

Els logos oficials no s’incrusten ací.

Consulta sempre: [[doc_logos_oficials]]

---

## Frontmatter Obligatori

```yaml
---
estat: 'esborrany'
tipus: '{document|index|norma|protocol|registre|skill|plantilla|acta|informe|prompt|petorreta}'
description: '{descripció concreta i accionable, de 12 a 140 caràcters}'
aliases:
  - '{àlies opcional; elimina aquest bloc si no en cal cap}'
---
```

`aliases` i `revisat` són opcionals. Només una decisió humana pot canviar
`estat` a `canonic`; Git i el rebut del Reflex en són la traça autoritativa.
Si cal mostrar la data dins d'Obsidian, es pot afegir `revisat: 'AAAA-MM-DD'`
sense convertir-la en un duplicat obligatori. El directori, el `tipus` i els
enllaços del cos fan de taxonomia: no reintroduïsques `categoria` ni `tags`.

## Objectiu

Defineix en una frase què ha de fer aquest document.

`OBJECTIU: {text}`

## Context Necessari

Llista només el context imprescindible. (Si açò és una petorreta, ací es descriu el bundle adjunt).

- `{context_1}`
- `{context_2}`

## Instrucció Principal

Escriu en imperatiu.

<INSTRUCCIO>
`EXECUTA: {accio concreta}`
</INSTRUCCIO>

## Output Esperat

Defineix format exacte.

<EXPECTATIVA>
`FORMAT: {markdown|json|taula|codi|llista}`
</EXPECTATIVA>

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Local-First' ni 'Offline-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## [IF:tipus=skill]

### Activació

Aquesta skill s’activa quan:

- `{trigger_1}`
- `{trigger_2}`

### Regles d’Execució

1. `{regla_obligatoria_1}`
2. `{regla_obligatoria_2}`
3. `{regla_obligatoria_3}`

### Output de Skill

La skill ha de retornar:

```json
{
  "ok": true,
  "summary": "string",
  "actions": [],
  "warnings": [],
  "errors": []
}
```

---

## [IF:tipus=acta]

### Decisions Preses

| Decisió | Motiu | Impacte |
|---|---|---|
| `{decisio}` | `{motiu}` | `{impacte}` |

### Pròxims Passos

- `{pas_1}`
- `{pas_2}`

---

## [IF:tipus=informe]

### Criteris

- estructura
- contradiccions
- duplicats
- scripts
- governança
- Core/Forja
- privacitat

### Output Obligatori

```json
{
  "ok": false,
  "score": 0,
  "critical": [],
  "high": [],
  "medium": [],
  "low": [],
  "next_actions": []
}
```

---

## [IF:tipus=protocol]

### Precondicions

- `{precondicio_1}`
- `{precondicio_2}`

### Procediment

1. `{pas_1}`
2. `{pas_2}`
3. `{pas_3}`

### Criteri d’Èxit

`EXIT: {criteri verificable}`

---

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.
- PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn aïllat (air-gapped). Tens prohibit malbaratar tokens cercant termes a internet (ex: noms de fitxers, 'oauthRelay.js', conceptes propis o 'Pedra Seca'). Tota la informació està en el bundle adjunt. Llig-lo i no el busques fora.

## Sinapsis

- [[00_bios]]
- [[02_genotip]]
- [[doc_governanca]]
- [[doc_logos_oficials]]
- enginyeria_inversa_mit


## Taxonomia
- **Categoria:** [[maquina]]
- **Etiquetes:** [[graf]]


**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[PLANTILLA_ISO_SDP|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md...
- [[02_genotip|00_SER_Brain_Identitat/02_GENOTIP.md]] — [[PLANTILLA_ISO_SDP|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md...
- [[doc_logos_oficials|00_SER_Brain_Identitat/DOC_Logos_Oficials.md]] — [[plantilla_iso_sdp]]
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — [[PLANTILLA_ISO_SDP|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[PLANTILLA_ISO_SDP|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md...
- [[maquina|01_SABER_Cultura_Coneixement/Maquina.md]] — [[PLANTILLA_ISO_SDP|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md...
- [[00_plantilles|02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md]] — [[PLANTILLA_ISO_SDP.md|Plantilla Prompt ISO històrica]]
- [[plantilla_iso_sdp|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md]] — [[00_index|00_INDEX.md]] — [[plantilla_iso_sdp|02_ACTUAR_Maquina_Tecnica/plan...
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[PLANTILLA_ISO_SDP|02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
