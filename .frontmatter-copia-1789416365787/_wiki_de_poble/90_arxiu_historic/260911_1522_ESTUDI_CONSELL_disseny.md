# 🧠 ESTUDI DEL CONSELL: AUDITORIA DE DISSENY (PEDRA SECA)

Aquest document és el repositori central on s'analitzen i es consoliden les auditories i propostes rebudes per part del Consell d'IAs (Gemini, Claude, Qwen, Vibe, etc.) respecte a l'estandardització del sistema de disseny i la neteja de CSS mort.

---

## 1. APORTACIONS DE GEMINI

Gemini ha realitzat una anàlisi exhaustiva de la fragmentació estructural.

### A. Diagnòstic de Fragmentació
- **Taules:** Estan construïdes amb estils en línia i tokens falsos (`--sdp-borde`, `--sdp-text-mut`, etc.). També afecten `PoblacioSection` (classes òrfenes) i `DesignSectionContent`.
- **Formularis:** Dispersió entre `.form-group`, `.input-trellat`, padding en línia, i classes residuals com `.onb-icon-action`.
- **Alertes i Modals:** Manca de consolidació de classes `.alert-*` vs `.sdp-avisador-efimer`. Els modals no utilitzen el `<dialog>` natiu ni encapsulament.
- **Llistes:** La llista de gestor està bé, però les de contactes, perfil i onboarding estan fetes de forma aïllada.

### B. Inventari CSS Fantasma Detectat
- Falsos tokens a Gestoria: `--sdp-borde`, `--sdp-text-mut`, `--sdp-color-text`, `--sdp-color-success`, `--sdp-bg-mut`, `--sdp-text-brand`.
- Tokens residuals a `index.css`: `--sdp-espai-6`, `--sdp-radi-3xl`, `--sdp-text-xs`, etc.
- Classes òrfenes (estucat): `.fab-button`, `.cms-badge`, `.sdp-scroll-reveal`, etc.
- Utilitats dinàmiques mortes: `.sdp-gap-8`, `.sdp-mb-0`, `.sdp-p-2`, etc.
- Selectors desprotegits: `table`, `th`, `td`, `tbody tr:hover`.

### C. Proposta de CSS Canònic de Gemini
1. **Taules (`.sdp-taula-*`):** Un sistema robust basat en tokens existents, amb variants interactiva i zebra, i controls d'alineació (ex. `.sdp-taula__dreta`).
2. **Formularis (`.sdp-camp`, `.sdp-control`):** Eliminació de "Tailwindització", creant contenidors de camps estandarditzats.
3. **Alertes (`.sdp-alerta--*`):** 4 tipus clars (info, exit, avis, error) ben definits i contrastats.
4. **Modals (`.sdp-dialeg`):** Ús preparat per al `<dialog>` natiu de HTML5, aprofitant el `::backdrop`.

### D. Pla d'Implementació Proposat per Gemini (Fase 1)
1. Inserir `.sdp-taula-*` a `index.css`.
2. Refactoritzar les 4 vistes de Gestoria per fer ús d'aquesta taula i netejar l'estil inline.
3. Migrar `PoblacioSection`.
4. Purgar 52 classes òrfenes de l'arxiu d'estucat.

---

## 2. APORTACIONS DE GROK

Grok aprofundeix en la col·lisió actual de codi i proposa una variant del CSS basat en el prefix històric `.sdp-table` en lloc de `.sdp-taula`.

### A. Diagnòstic de Fragmentació (Punts Clau)
- **CSS Públic Intocable:** Adverteix que `public/assets/pedra-seca.css` conté tokens legacy (`--sp-*`) que no s'han de tocar fins a migrar tot, ja que és un asset públic.
- **Doble Implementació Taules:** Actualment conviuen dos blocs a `index.css`:
  1. El genèric (`table`, `.table-wrapper`, `.table-zebra`) que no està protegit.
  2. El bloc parcial `.sdp-table` que està orfe excepte a Població.
- **Accions Inline (Gestoria):** Produeixen CSS fantasma implícit.

### B. Proposta de CSS Canònic de Grok
- Prefix: Aposta per utilitzar **`.sdp-table`** (en lloc del proposat per Gemini `.sdp-taula`), aprofitant el nom que ja hi havia sembrat.
- Wrapper obligatori: `.sdp-table-wrapper` per a scroll horitzontal independent.
- Qualificadors: Ús de `.sdp-table--zebra`, `.sdp-table--compact`, `.sdp-table--sticky` (per fixar thead).
- Alineació per atributs: Enlloc de classes com `.sdp-taula__dreta`, proposa emprar `data-align="right"` en els `<th>` i `<td>`.
- Gestió d'estats: Afegeix `.sdp-table-empty` i accions per fila `.sdp-table-action`.

### C. Pla d'Implementació Proposat per Grok (Fase 1 i 2)
1. Integrar el bloc `.sdp-table-*` sota la capa components de `index.css`.
2. Migrar totes les vistes de Gestoria de inline a `.sdp-table`.
3. Actualitzar els exemples a `DesignSectionContent.jsx`.
4. Deprecar els blocs genèrics `table { }` i `.table-zebra` antics.
5. Deixar els formularis i alertes per a la Fase 2.

---

## 3. APORTACIONS DE CODEX

L'auditoria de Codex és magistral i proporciona el full de ruta tècnic definitiu. 

### A. Diagnòstic de Fragmentació (Punts Clau)
- **166 blocs d'estil en línia** a la Gestoria.
- Detectats 9 àlies `--sdp-*` falsos i 5 amb tipus incorrecte (emprant mides com a colors).
- No existeix cap `<dialog>` ni `<dl>` productiu, malgrat estar documentats.

### B. Proposta de CSS Canònic de Codex
Codex ha generat un bloc CSS complet i llest per a producció que cobreix:
1. **Taules Universals:** Ús de `:where(.sdp-root) table` combinat amb `.sdp-table` i `.sdp-taula` per retrocompatibilitat segura.
2. **Formularis:** `.sdp-formulari`, `.sdp-camp`, eliminant classes supèrflues.
3. **Botons i Insígnies:** `.sdp-boto` i `.sdp-insignia` netejats.
4. **Alertes, Diàlegs i Estats:** Completament estandarditzats sota `--sdp-*`.
5. **Pujada de fitxers:** `.sdp-pujada` per substituir la zona de la Gestoria.

### C. Pla d'Implementació Proposat per Codex (Fase 1)
1. **Taules:** Reemplaçar els dos blocs antics pel bloc canònic de Codex. Migrar Població i Gestoria.
2. **Gestoria:** Netejar els 166 estils en línia i mapar-ho tot a la nova semàntica.
3. **Tokens:** Corregir les 9 referències inexistents i 5 mal tipades.
4. **Catàleg:** Actualitzar `DesignSectionContent.jsx`.
5. **Quarantena:** Moure temporalment els 41 candidats orfes detectats a un fitxer separat.

---

## 4. APORTACIONS DE VIBE

Vibe presenta una visió més orientada a components React que a pur CSS semàntic, i ofereix mètriques contundents.

### A. Diagnòstic de Fragmentació i CSS Fantasma (Punts Clau)
- Estima que hi ha **~2,500 línies de CSS fantasma** a `index.css`.
- Assenyala duplicacions entre `AppGridShell.css` i `UniversalManager.css`.
- Identifica regles de components eliminats (`old-table`, `legacy-*`, `table-2023`).

### B. Proposta de Disseny i Arquitectura de Vibe
La gran diferència de Vibe respecte a Codex i Grok és que proposa l'encapsulament estricte en components React a `src/components/sdp/` en lloc de dependre purament de l'HTML semàntic amb classes CSS.
- Suggereix crear: `SdpTable.jsx`, `SdpForm.jsx`, `SdpAlert.jsx`, `SdpModal.jsx`, `SdpList.jsx`, `SdpBadge.jsx`.
- *Nota d'Alerta Tècnica:* Vibe ha inventat alguns noms de tokens (ex: `--sdp-spacing-sm` en lloc del nostre real `--sdp-space-2`, o `--sdp-color-primary` en lloc de `--sdp-accio`). Açò confirma que Codex té una comprensió molt més precisa del nostre catàleg actual de tokens.

### C. Pla d'Implementació Proposat per Vibe (Fase 1)
1. Crear un fitxer nou `src/css/sdp-components.css` (o integrar-ho a `index.css`).
2. Crear els 6 components React estructurals a `src/components/sdp/`.
3. Eliminar ~2,500 línies fantasma amb l'ajuda de PurgeCSS.
4. Refactoritzar Gestoria perquè importe `<SdpTable />` passant les dades per props.

---

## 5. APORTACIONS DE PERPLEXITY

L'auditoria de Perplexity és potser la més avançada pel que fa a l'arquitectura de CSS modern i seguretat de refactorització.

### A. Diagnòstic de Fragmentació (Punts Clau)
- Diferencia sàviament entre l'estil visual i l'estructura de domini. Exemple: `connect-panel` pot existir per semàntica o JS, però el seu estil visual l'ha de posar `.sdp-panel`. 
- Identifica exactament les limitacions d'una eina de poda: els noms dinàmics (Tiptap, classList) no es poden esborrar a cegues.

### B. Proposta de CSS Canònic de Perplexity (El Sant Grial del CSS)
Aporta una tècnica de CSS Modern revolucionària per a aquest projecte: **L'ús de `:where()` per a establir defaults de zero especificitat.**
- `:where(table)`, `:where(button)`: Açò garanteix que qualsevol element semàntic base prenga l'estil de Pedra Seca, però sense xafar **cap** classe que s'hi pose al damunt, evitant conflictes històrics.
- Combina l'HTML semàntic base amb el sistema BEM (`.sdp-table`, `.sdp-form`, etc.).
- Comprén perfectament els tokens reals del projecte.

### C. Pla d'Implementació Proposat per Perplexity (Fase 1 a 3)
1. **Fase 1 - Primitives:** Integrar el CSS avançat (taules, formularis, alertes, modals, etc.) i aplicar-ho primer a Gestoria per ser on més valor operatiu hi ha.
2. **Fase 2 - Reducció de classes:** Substituir progressivament `connect-panel` per `.sdp-panel`, etc.
3. **Fase 3 - Poda segura:** No esborrar fins a classificar el deute (Eliminable, Migrable, Dinàmic, Exclòs), aprofitant la lògica de `tractor-poda-css.mjs`.

---

## 6. APORTACIONS DE DOLA

Dola ha fet un repàs sistemàtic molt net i ha aportat dues peces d'or per a la refactorització:
1. El **mapeig exacte** dels tokens falsos de la Gestoria cap als tokens canònics reals (ex: `--sdp-borde` passa a ser `--sdp-vora`, `--sdp-text-mut` passa a `--sdp-text-suau`).
2. Una taula resum amb tots els **Tokens SDP Oficials Disponibles** (fons, text, vores, accent, acció, estats, radis, ombres i espais), que confirma definitivament que Vibe estava al·lucinant noms i que l'arquitectura de Codex/Perplexity té raó.

---

## 7. APORTACIONS DE DEEPSEEK

Deepseek ha fet una auditoria molt forense, detectant anomalies d'estat i d'integritat:
1. S'ha adonat que al bundle hi havia l'antic prompt de les 06:24 (que demanava auditar `public/gestoria/index.html`), xocant amb el bundle de les 15:11 (on eixos fitxers ja s'havien migrat a React). Açò demostra una gran capacitat per entendre l'espai-temps del projecte.
2. Suggereix directament **esborrar `public/assets/pedra-seca.css`** per ser un sistema paral·lel obsolet. Caldrà verificar-ho contra el que deia Grok (que era un asset públic intocable).
3. Ens recorda la necessitat de crear el component `PillToggle` (que es mencionava a l'antic prompt).
4. Ens avisa d'un problema de **sensibilitat a majúscules** (`04_ESCRIPTORI` vs `04_escriptori`) que podria trencar enllaços en sistemes Linux/CI.

---

## 8. APORTACIONS DE CLAUDE (SEIENT 5)

L'auditoria de Claude és absolutament magistral i quirúrgica, revelant problemes estructurals profunds que anaven més enllà del simple CSS orfe:
1. **La premissa era falsa:** Les taules SÍ tenien estil a `legacy`, però la Gestoria se'ls saltava amb els 166 estils en línia.
2. **El problema del Shadow DOM (D6):** Ha detectat que `UniversalManager.css` s'injecta al document, però l'aplicació corre dins d'un Shadow Root, fent que 11 selectors siguen lletra morta per aïllament d'especificitat. 
3. **Ordre de les capes CSS:** S'ha adonat que el `reset` vivia dins de `legacy`, cosa que feia impossible posar la `base` per davall sense que el reset xafara els coixins. Proposa traure el reset a una capa pròpia.
4. **Falsos positius d'especificitat:** Un `:focus-visible` global a `legacy` (L556) estava canviant el radi de tots els controls en rebre el focus.
5. **Doble font de veritat:** Ha detectat 24 selectors redefinits i zones sense capa (`@layer`) on el CSS s'escapava de l'arquitectura.

Claude proposa un "SDP-LOCK" amb 5 esborrats que necessiten signatura (Pedaç de capes, regles mortes, `pedra-seca.css`, fusionar `UniversalManager.css` i resoldre `.badge`).

---

## 9. CONCLUSIONS DEL CONSELL I PAS A LA IMPLEMENTACIÓ

Totes les IAs coincideixen en la mateixa malaltia i la mateixa cura, però cadascuna ha aportat una peça única del trencaclosques:
1. **El diagnòstic unànime:** Gestoria depèn d'estils en línia inacceptables.
2. **La solució guanyadora:** 
   - L'arquitectura semàntica HTML amb CSS modern. 
   - L'arquitectura de zero especificitat (`:where()`) de Perplexity.
   - L'ordre de capes i la fusió de Shadow DOM de Claude.
   - El mapa de tokens de Dola.
   - La puresa i neteja proposada per Deepseek i Grok.

Amb aquests coneixements consolidats, el Pla d'Implementació s'ha actualitzat per incloure l'SDP-LOCK de Claude i està llest per a l'aprovació.
