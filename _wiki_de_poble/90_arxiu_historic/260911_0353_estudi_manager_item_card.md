---
tipus: estudi
estat: tancat
description: Estudi comparatiu del Consell per a ManagerItemCard i NotesEditor - Ronda Tancada amb Èxit
---
# Estudi Comparatiu del Consell: ManagerItemCard (260911_0353) — TANCAT

Aquest document és la taula de treball viva de l'Escriptori on es recullen, comparen i analitzen totes les propostes de les 12 IAs del Consell sobre la targeta de llista `ManagerItemCard` de l'`UniversalManager`.

---

## 1. Objectiu de la Petorreta

- Estandarditzar el component `ManagerItemCard` (vist a la llista del Bloc de Notes, Perfil i Administració) sota les regles pures de la **Llei de Pedra Seca**.
- **Normativa innegociable:**
  1. Només H1 (títol, màx. 2 línies) i H2 (subtítol/data, màx. 1 línia). Màxim 3 línies verticals en total.
  2. Imatge quadrada fixa a l'esquerra de **96 × 96 px**.
  3. Sense entradilla, sense cos/body, sense H3.
  4. Zero estils inline, zero Tailwind al Core, ús exclusiu de tokens semàntics de Pedra Seca.

---

## 2. Matriu de Ronda de les 12 IAs del Consell

| IA del Consell | Estat | Aportació Clau | Arquitectura / Fitxers Proposats |
| :--- | :--- | :--- | :--- |
| **1. ChatGPT Codex (OpenAI)** | 🏆 Triomf Total | Ha espremut el 100% de la finestra de 5h lliurant el sistema complet: (1) `ManagerItemCard.jsx` canònic, (2) `NotesSection.jsx`, (3) `PerfilShell.jsx` (resolt P0), (4) `AdminSection.jsx` (purga inline styles), i (5) `NotesEditor.jsx` (blindatge Tiptap contra salts de cursor, cua asíncrona de guardats i listener `pagehide`). | Codi canònic de tots els components clau del gestor i editor. |
| **2. Gemini Flash (Google)** | ✅ Rebut | Proposta ràpida de component `<article role="button">` amb flexbox i tokens semàntics. | `ManagerItemCard.jsx` i CSS per a `UniversalManager.css`. |
| **3. Grok (xAI)** | ✅ Rebut | Detecta que el padding del contenidor vell (`.univ-manager-list-item`) trenca l'altura de 96px. Proposa solució amb `:has()` i debat sobre el nivell de titulars `h2`/`h3`. | `ManagerItemCard.jsx` i regles CSS per a anul·lar paddings heredats. |
| **4. Mistral Vibe** | ✅ Rebut | Proposa placeholder si no hi ha imatge (96x96). Advertència crítica: inventa variables CSS inexistents (`--card-bg`, `--text-primary`) en lloc dels tokens `--sdp-*`, i proposa una primera variant amb estils inline prohibits. | `ManagerItemCard.jsx` i `ManagerItemCard.css` separat. |
| **5. Claude (Anthropic)** | ✅ Rebut | Dictamen magistral (Seient Núm. 5). Descobreix un **P0 crític** (selecció de Perfil trencada perquè `ManagerList` usa `item.id` en comptes de `uniqueId`/`getItemId`). Detecta que `UniversalManager.css` trenca `porta:vocabulari` i l'embed de WP (ha d'anar a `index.css`). Perfecciona la cadena fallback: `imatge › icona › inicial`, amb `isSafeAsset` i `onError`. Alerta de contrast WCAG amb `--sdp-accent` (2.73:1 vs 5.51:1 de `--sdp-accent-text`). | `ManagerItemCard.jsx` (semàntica accessible amb `<button>` natiu i rols tipogràfics), CSS per a `index.css`, correcció P0 a `ManagerList.jsx`. |
| **6. Qwen** | ✅ Rebut | Especificació d'enginyeria i A11y (WCAG 2.1 AA). Convergència amb Codex en l'ús d'`aria-labelledby` vinculant títol i subtítol. Ratifica la caixa de 96x96 px amb `aspect-ratio: 1/1`, el placeholder DOM proactiu quan no hi ha foto i el maneig accessible de teclat (Enter/Espai) i `aria-disabled`. | Especificació de component React, patrons d'accessibilitat i tokens `--sdp-*`. |
| **7. Deepseek** | ✅ Rebut | Auditoria forense global (Nota: 7.5/10). Detecta 3 P0 crítics: (1) Bundle de 2.93MB al límit termodinàmic, (2) Inclusió de `_wiki_de_poble` com a repo separat, (3) Bretxa RGPD a `membres_del_poble()`. Exigeix que el deute de disseny mesurat es reduïsca amb accions reals i no es quede congelat. | Auditoria forense global del sistema i governança. |
| **8. Kimi (Moonshot)** | ⏳ Pendent | *En curs de recollida per Mestre Javi...* | — |
| **9. Perplexity** | ⏳ Pendent | *En curs de recollida per Mestre Javi...* | — |
| **10. Dola** | ✅ Rebut | Refacció directa BEM d'`<article>` a `UniversalManager.css`. Detecta `<strong>`/`<span>`, però manté el token inexistent `--sdp-orange-10`, no preveu fallback per a imatges absents i creu erròniament que `ManagerList` ja ho tenia connectat (ignora que era codi mort). | `ManagerItemCard.jsx` i afegit a `UniversalManager.css`. |
| **11. Copilot (Microsoft)** | ⏳ Pendent | *En curs de recollida per Mestre Javi...* | — |
| **12. Z.ai** | ✅ Rebut | Resolució executiva (Apte). Defensa les "Fundes Primes" (NotesItemCard/PerfilItemCard com a simples passadors de dades). Bloqueja `children` en dev per evitar intrusions. Fallback d'imatge buida amb la inicial en majúscula (`title[0]`). Clau tècnica del grid: `minmax(0,1fr)` + `min-width:0` per assegurar el clamp. | `ManagerItemCard.jsx`, `ManagerItemCard.css`, fundes per a Notes i Perfil. |

---

## 3. Anàlisi Comparativa i Decisions d'Enginyeria

### 3.1. Consens Total del Consell
1. **Separació radical de `UniversalCard`:** Tots els models coincideixen que `UniversalCard` pertany al Mur/Feed (targeta editorial amb cos, data, autor i accions). `ManagerItemCard` és la fila d'índex compacta del gestor.
2. **Eliminació del cos/preview a Notes:** `NotesItemCard` queda sentenciat a desaparèixer. La llista no pot semblar un diari o article; el text viu al panell de detall (`NotesEditor`).
3. **Mida fixa de 96 × 96 px:** Coincidència unànime en la foto quadrada a l'esquerra.

### 3.2. Contrast Tècnic de les Solucions

| Criteri | Proposta Codex | Proposta Gemini Flash | Proposta Grok | Proposta Mistral Vibe | Decisió de Trellat (IAIA MarIA) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Estructura HTML** | `<article>` amb `<h1>`, `<h2>` i `<button class="action">` invisible | `<article role="button">` amb `<h1>` i `<h2>` | `<div role="button">` amb `TitleTag` (`h2`/`h3`) | `<article aria-label>` amb `<h1>` i `<h2>` | `<div role="button">` o `<a>` amb `<h1>`, `<h2>` i guarda `children` | **Codex / Z.ai**: Coincideixen en el disseny `grid` (`96px minmax(0,1fr)`). Z aporta la protecció anti-regressió rebutjant `children` en desenvolupament. |
| **Tractament d'imatge buida (Fallback)** | Inclou `imageFallback` (icona de 96x96) quan no hi ha URL | Amaga el bloc d'imatge si no hi ha foto | Amaga el bloc d'imatge si no hi ha foto | `div.placeholder` quadrat de 96x96 | Inicial en majúscula `title[0]` o icona dins de 96x96 | **Codex / Z.ai**: Consens total en mantenir la caixa de 96x96 per no trencar l'alineació visual. La combinació d'icona i/o lletra inicial és perfecta. |
| **Tokens i CSS** | `UniversalManager.css` amb tokens purs `--sdp-*` | `UniversalManager.css` amb tokens purs `--sdp-*` | `UniversalManager.css` amb tokens purs i `:has()` | Inventa variables estranyes (`--card-bg`, `--text-primary`) i estils inline | CSS amb variables `--mic-*` i tokens de reserva | **Codex / Flash / Z**: CSS aïllat sense tocar Tailwind ni inline styles. |
| **Contracte de dades** | Substitueix `renderItem` per `getItemCardProps(item)` | Manté `renderItem` | Manté `renderItem` | Manté `renderItem` | **Codex**: Brillant. Si deixem `renderItem` obert, qualsevol consumidor tornarà a inventar un disseny fora de norma. |

### 3.3. Visió Sistèmica i Governança (L'aportació de Deepseek)
Deepseek ha actuat com a jutge implacable de la maquinària global:
1. **El deute mesurat no és deute resolt:** Ens adverteix que declarar el deute a `design_guard` (23 estils inline, 24 colors crus) està molt bé per transparència, però que ara cal començar a fer-lo baixar amb accions reals (com estem fent precisament amb `ManagerItemCard`).
2. **Límit termodinàmic del bundle:** El bundle ha arribat a 2.93MB, tocant el sostre màxim permés de 3MB.
3. **Coherència del cens:** Assenyala que Codex figurava històricament sancionat fins al 4 de setembre de 2026, però que com que ja som a 11 de setembre, Codex està oficialment reintegrat de ple dret al Consell.

---

## 4. Properes Passes

1. Incorporar les respostes entrants (europees i internacionals).
2. Tancar la comparativa final.
3. Declarar el Pla d'Implementació oficial (`implementation_plan.md`) un cop el Mestre done l'ordre.
