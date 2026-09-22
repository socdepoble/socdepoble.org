---
type: plantilla
status: canonic
description: Plantilla de referència per a un Macro_Bundle generat automàticament.
tags:
  - govern
  - saber
aliases:
  - plantilla macro bundle
---

<!-- SDP:EIXIDA
type: petorreta
status: esborrany
description: "<12-220 caràcters: quin abocament conté i per a quina IA>"
tags: [consell]
-->

# Plantilla Macro_Bundle

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

## [Exemple] Fitxer: _wiki_de_poble/00_index.md

```markdown
(Contingut del fitxer)
```

---

## [Exemple] Fitxer: src/App.jsx

```javascript
(Contingut del fitxer)
```

---

<<<FI_DEL_BUNDLE>>>


## Generació amb contracte executable

La ruta `bundle` de `.agents/protocolledge.json` defineix les seccions obligatòries. El bloc SDP:EIXIDA és l’exemple de metadades; la resta d’aquesta plantilla és context de redacció. Usa `document.mjs context` per rebre la plantilla i el rebut persistent, i `document.mjs create` per preparar el document amb totes les seccions. No copies el frontmatter de la plantilla com si fora el del fill.
