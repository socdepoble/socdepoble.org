---
tipus: plantilla
estat: canonic
description: Plantilla de referència per a un MacroBundle generat automàticament.
tags:
  - govern
  - saber
aliases:
  - plantilla macro bundle
---

# Plantilla MacroBundle

Aquesta és l'estructura de referència d'un MacroBundle generat pel sistema (`crear_bundle.mjs`). Els MacroBundles s'utilitzen juntament amb un `MACRO_PROMPT` per a enviar context complet a IAs amb alta capacitat (Claude, Gemini, Grok, Qwen, Codex).

## Manifest

```yaml
---
# El manifest inclou tots els fitxers encapsulats amb el seu hash
_wiki_de_poble/00_index.md: 3f8a...
src/App.jsx: 9b2c...
---
```

## Contingut (Exemple)

---

## Fitxer: _wiki_de_poble/00_index.md

```markdown
(Contingut del fitxer)
```

---

## Fitxer: src/App.jsx

```javascript
(Contingut del fitxer)
```

---

<<<FI_DEL_BUNDLE>>>
