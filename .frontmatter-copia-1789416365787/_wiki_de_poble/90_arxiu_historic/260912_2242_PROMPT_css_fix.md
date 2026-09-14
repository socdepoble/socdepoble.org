# PETORRETA PER AL CONSELL: CLAUDE (MESTRE D'OBRES) - ARQUITECTURA CSS

**Context Actual:**
La gran migració de "Pedra Seca" i la liquidació del deute tècnic JSX està oficialment **COMPLETADA**. Hem utilitzat l'Eixam (amb el genial mapa de Gemini Flash i les teues indicacions) per substituir quirúrgicament i automàticament totes les classes orfes en els components d'Onboarding, Dispositius, Gestor Universal i Gestoria. Totes les rutes de negoci estan operatives.

El tractor `tractor-classes-orfes.mjs` ara dóna **0 orfes reals** (excloent documentació a DesignSectionContent i falsos positius dinàmics). L'estructura JSX és intocable. 

**El Nou Problema (La teua tasca):**
Amb la incorporació massiva d'estils al nostre directori `src/css/` (components.css, modules.css, utilities.css), hem acumulat redundància i deute a la capa d'estils. Tenim avisos del linter CSS ("conjuntos de reglas vacíos"), possibles trencaments de la cascada (layers), i segurament declaracions duplicades o ineficients per herència de la refactorització ràpida.

**Missió (Què has de fer):**
Vull que fases una auditoria **EXCLUSIVAMENT DE L'ARQUITECTURA CSS** (`src/css/*`). 
Analitza el bundle adjunt i proporciona'ns el codi CSS netejat, unificat i optimitzat per a:
1. `modules.css`
2. `components.css`
3. `utilities.css`

*REQUISITS INNEGOCIABLES:*
- **Zero modificacions al JSX.** La part React/JSX funciona de categoria i ja està testejada. Si toques un fitxer JSX serà considerat vandalisme. Nomes pots aportar blocs de codi CSS.
- **Respecta "Pedra Seca" i els Tokens.** Revisa que totes les variables de color, espaiat i radi existisquen realment als arxius CSS i no ens haguem deixat variables òrfenes.
- **Repara la Cascada (Layers).** Assegura't que l'ordre `@layer reset, theme, base, modules, components, utilities, overrides;` funciona com un rellotge suís.
- **Elimina fem.** Llevat regles buides, duplicades o que no aporten valor.

Proporciona'ns només el CSS netejat i preparat per substituir l'actual.
