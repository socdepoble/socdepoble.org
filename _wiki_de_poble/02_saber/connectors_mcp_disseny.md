---
type: document
status: esborrany
description: Especifica una possible integració futura amb connectors de disseny que sempre requerix discovery real.
tags:
  - core
  - genoma
  - identitat
---
# Connectors MCP de disseny

Especificació futura de com podrien treballar Affinity, Stitch i Figma amb el sistema de disseny de Sóc de Poble. Cap connector, UUID ni nom d'eina d'esta pàgina es dona per disponible fins que el runtime el descobrisca i la documentació oficial en confirme el contracte.

Si discovery no mostra un connector, l'agent s'atura i no inventa la crida.

---

## 1. Affinity (el motor vectorial i de render)

Affinity només podria assumir este paper si s'instal·la un connector auditat i discovery en confirma les operacions.

### L'UUID com a clau de pas
Una integració futura haurà d'obtindre l'identificador que declare l'API real; `document_session_uuid` és un nom de disseny, no un fet verificat.
- **Regla d'or:** abans de demanar cap renderitzat o modificació, cal obtindre l'identificador del document actiu amb l'operació que exposa l'API real (per exemple, un script preliminar semblant a `app.documents[0].uuid`, sense verificar). Sense eixa clau, la porta està tancada.

### Catàleg hipotètic d'eines (no disponible)
1. **Motor de renderitzat visual (els ulls)**
   - `Affinity:render_spread`: captura d'un plec sencer.
   - `Affinity:render_selection`: captura únicament l'element seleccionat.
2. **Execució de codi (les mans)**
   - `Affinity:execute_script`: permet injectar JavaScript pur per manipular capes i colors.
3. **Sistema nerviós i memòria (la biblioteca de scripts)**
   - `Affinity:list_library_scripts` / `read_library_script`: recupera codi guardat.
   - `Affinity:save_script_to_library`: guarda procediments automatitzats.
4. **Intel·ligència col·lectiva**
   - `Affinity:search_sdk_hints` / `add_sdk_hint`: registre d'automillora visual.

---

## 2. StitchMCP (el sistema de disseny i UI)

Mentre que Affinity és la nostra eina de base vectorial, **Stitch** actuaria com a pont estructural per a l'arquitectura de pantalles (UI/UX) de l'aplicació web i la generació de sistemes de disseny automàtics.

### Flux de treball condicionat a discovery (Stitch)
- **Sistemes de disseny:** eines com `create_design_system` o `apply_design_system` propagarien els tokens semàntics `--sdp-*` de `src/css/tokens.css` i les tipografies per tot [[el_projecte|el projecte]].
- **Prototipatge de pantalles:** amb `generate_screen_from_text`, Stitch permetria alçar pantalles o ginys HTML abans de picar codi en profunditat.
- **Auditoria de l'estat:** el Mestre podria llistar i recuperar dissenys amb `list_screens` i `get_screen`.

---

## 3. Figma (el llenç de col·laboració i interfície)

*(Reservat per a connexió.)* Si el projecte ho requerix, ací s'unificaran les capacitats d'exportació de components de Figma perquè Affinity i Figma es regisquen pels mateixos tokens `--sdp-*` de `src/css/tokens.css`, sense duplicar el codi de la *Pedra Seca*.

## Vincles

- [[el_projecte]]
- [[00_index_identitat]]
- [[identitat_visual]]
