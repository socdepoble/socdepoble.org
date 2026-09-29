---
estat: actiu
tipus: skill
description: "Mirall humà de la skill Defuddle"
source: .agents/skills/defuddle/SKILL.md
---

> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/defuddle/SKILL.md` exclusivament en anglés tècnic.

# Defuddle

Utilitza el CLI de Defuddle per extraure contingut net i llegible de les pàgines web. Prefereix això abans que WebFetch per a pàgines web estàndard: elimina la navegació, els anuncis i el desordre, reduint molt l'ús de tokens.

Si no està instal·lat: `npm install -g defuddle`

## Ús

Utilitza sempre `--md` per obtenir l'eixida en markdown:

```bash
defuddle parse <url> --md
```

Guardar en un fitxer:

```bash
defuddle parse <url> --md -o content.md
```

Extraure metadades específiques:

```bash
defuddle parse <url> -p title
defuddle parse <url> -p description
defuddle parse <url> -p domain
```

## Formats d'eixida

| Flag | Format |
|------|--------|
| `--md` | Markdown (opció per defecte) |
| `--json` | JSON amb HTML i markdown |
| (cap) | HTML |
| `-p <name>` | Propietat de metadades específica |

---
**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
