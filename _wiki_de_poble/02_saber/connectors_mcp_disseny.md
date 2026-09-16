---
tipus: document
estat: esborrany
description: Especifica una possible integració futura amb connectors de disseny que sempre requerix discovery real.
tags:
  - core
  - genoma
  - identitat
---
# 04. Connectors MCP de Disseny (Arquitectura PWA i Visual)

Aquest document és una especificació futura. Cap connector, UUID ni nom d'eina ací escrit es considera disponible fins que el runtime el descobrisca i la documentació oficial en confirme el contracte. Si discovery no el mostra, l'agent s'atura i no inventa la crida.

---

## 1. Affinity (El Motor Vectorial i de Render)

Affinity només podria assumir este paper si s'instal·la un connector auditat i discovery confirma les operacions.

### L'UUID com a Clau de Pas
Una integració futura haurà d'obtindre l'identificador que declare l'API real; `document_session_uuid` és un nom de disseny, no un fet verificat.
- **Regla d'Or Innegociable:** Abans de demanar cap renderitzat o modificació, és obligatori executar un script preliminar per a extraure l'UUID del document actiu (ex: `app.documents[0].uuid`). Sense aquesta clau mestra, la porta està tancada.

### Catàleg hipotètic d'eines (no disponible)
1. **Motor de Renderitzat Visual (Els Ulls)**
   - `Affinity:render_spread`: Captura d'un plec sencer.
   - `Affinity:render_selection`: Captura únicament l'element seleccionat.
2. **Execució de Codi (Les Mans)**
   - `Affinity:execute_script`: Permet injectar JavaScript pur per manipular capes i colors.
3. **Sistema Nerviós i Memòria (La Biblioteca de Scripts)**
   - `Affinity:list_library_scripts` / `read_library_script`: Recupera codi guardat.
   - `Affinity:save_script_to_library`: Guarda procediments automatitzats.
4. **Intel·ligència Col·lectiva**
   - `Affinity:search_sdk_hints` / `add_sdk_hint`: Registre d'automillora visual.

---

## 2. StitchMCP (El Sistema de Disseny i UI)

Mentre que Affinity és la nostra eina de base vectorial, **Stitch** actua com el nostre pont estructural per a l'arquitectura de pantalles (UI/UX) de la PWA i la generació de sistemes de disseny automàtics.

### Flux de treball condicionat a discovery (Stitch)
- **Sistemes de Disseny:** Usarem eines com `create_design_system` o `apply_design_system` per propagar els colors (tokens) i tipografies per tot [[el_projecte|el projecte]].
- **Prototipatge de Pantalles:** A través de `generate_screen_from_text`, Stitch ens permetrà alçar pantalles o ginys HTML abans de picar codi en profunditat.
- **Auditoria de l'Estat:** El Mestre pot llistar i recuperar dissenys directament usant `list_screens` i `get_screen`.

---

## 3. Figma (El Llenç de Col·laboració i Interfície)

*(Reservat per a connexió)*. Si el projecte ho requereix, ací s'unificaran les capacitats d'exportació de components de Figma per assegurar que tant Affinity com Figma es regeixen pels mateixos tokens CSS globals sense duplicar el codi de la *Pedra Seca*.

---


**Ancoratge de Seguretat:** [[00_index_identitat]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[connectors_mcp_disseny]]
- [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[connectors_mcp_disseny]]
- [[connectors_mcp_disseny|00_SER_Brain_Identitat/connectors_mcp_disseny.md]] — [[00_index|00_INDEX.md]] — [[connectors_mcp_disseny]]
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — [[connectors_mcp_disseny|00_SER_Brain_Identitat/connectors_mcp_disseny.md]] —...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[connectors_mcp_disseny|00_SER_Brain_Identitat/connectors_mcp_disseny.md]] —...
- [[identitat|01_SABER_Cultura_Coneixement/Identitat.md]] — [[connectors_mcp_disseny|00_SER_Brain_Identitat/connectors_mcp_disseny.md]] —...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
