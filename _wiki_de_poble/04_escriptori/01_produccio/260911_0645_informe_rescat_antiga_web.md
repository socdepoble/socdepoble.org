---
tipus: informe
estat: canonic
description: Informe d'inventari i pla de rescat de mòduls de l'antiga web (Sóc de Poble legacy)
tags:
  - disseny
  - escriptori
---
\n# 🏛️ INFORME D'INVENTARI I RESCAT DE L'ANTIGA PLATAFORMA

**Data:** 2026-09-11 06:45  
**Autor:** IAIA MarIA (Antigravity) & Mestre Javi Llinares  
**Objectiu:** Catalogar les eines, vistes i mòduls madurs existents a l'anterior repositori (`/Users/javillinares/Documents/Antigravity/Sóc de Poble/`) per programar-ne el rescat quirúrgic cap al Mas (`socdepoble.org`), tal com s'ha fet amb èxit amb la Gestoria de Poble.

---

## 1. 🔍 DIAGNÒSTIC GENERAL

L'anterior iteració de Sóc de Poble conté una gran quantitat de mòduls funcionals i dissenyats que resolen problemàtiques específiques del món rural. La clau per recuperar-los sense sofrir per duplicitat de disseny és **l'enxufabilitat modular (Llei de Pedra Seca)**:
- El codi ha de viure aïllat o encapsulat.
- No s'han d'importar fulls d'estil complets antics a l'arrel de React (`src/css/index.css`), sinó migrar els seus components visuals cap al contracte de `UniversalCard.jsx` o allotjar-los temporalment com a aplicacions autònomes a `public/` (com la Gestoria).

---

## 2. 📦 CATÀLEG DE TRESORS LOCALITZATS PER A RESCATAR

### A. Utilitats d'Acció Comunitària i Serveis

1. **Cercador d'Ajudes (`BuscadorAjudes.jsx` i `.css`)**:
   - **Localització:** `src/pages/features/BuscadorAjudes.jsx`
   - **Funció:** Cercador especialitzat en ajudes públiques, subvencions rurals, fons europeus, PAC, autònoms rurals i rehabilitació d'habitatge.
   - **Potencial per al Panell de Control:** Ideal per a la secció `Utilitats`, amb una targeta "Cercador d'Ajudes Públiques".

2. **El Mercat Rural (`Marketplace.jsx` i `CartManager.jsx`)**:
   - **Localització:** `src/components/features/Marketplace.jsx` i `CartManager.jsx`
   - **Funció:** Plataforma de venda directa, productes de proximitat, quilòmetre zero i circuits curts sense intermediaris.
   - **Integració:** Pot associar-se a la targeta "Mercat de Poble" o "Compres Col·lectives".

3. **El Pregoner Digital (`MagicPregoner.jsx`)**:
   - **Localització:** `src/components/features/MagicPregoner.jsx`
   - **Funció:** Eina per emetre avisos d'urgència, bans municipals, alertes meteorològiques (nevades, incendis) o comunicats associatius.
   - **Integració:** Targeta d'acció "El Pregoner" per enviar alertes ràpides al Xat Comunitari o al Mur.

4. **Llibreria de Poble i Visor (`libreria/` i `EpubViewer.jsx`)**:
   - **Localització:** `public/libreria/` (`index.html`, `libreria.js`) i `src/components/features/EpubViewer.jsx`
   - **Funció:** Visor de recursos culturals, llibres digitals lliures, publicacions de l'Aplec pel Territori i documentació patrimonial.
   - **Integració:** Mòdul autònom a `public/libreria/` o incorporat com a recurs cultural a la barra lateral.

5. **Assistència Sanitària i Cures (`MedicationConfirm.jsx`)**:
   - **Localització:** `src/pages/features/MedicationConfirm.jsx`
   - **Funció:** Sistema de verificació i coordinació per a la recollida de medicaments i ajudes a persones grans o dependents.
   - **Integració:** Base per a la targeta "Mans Veïnes" / "Cures i Medicines".

6. **Tauler Municipal Comunitari (`public/poble/`)**:
   - **Localització:** `public/poble/` (`index.html`, `poble_tauler.js`, `el-rebost.html`, `caixa-real.html`)
   - **Funció:** Tauler de dades i comptabilitat comunitària per a associacions i xicotets pobles.

---

## 3. 🗺️ FULL DE RUTA PER AL RESCAT PROGRESSIU

1. **Fase 1 (Completada):** Rescat de la **Gestoria de Poble** a `public/gestoria/` per resoldre la urgència fiscal del 3T, lliure de mode fosc i enllaçada al Panell de Control.
2. **Fase 2 (Pròxima):** Incorporació del **Cercador d'Ajudes** i de la **Llibreria de Poble** com a noves eines dins de la secció `Utilitats` de `/control`.
3. **Fase 3:** Connectar les noves targetes d'acció inspirades en el **Manifest de Poble** (Cotxe de Poble, Animalets, Banc de Terres, Maquinària compartida) perquè canalitzen les demandes directament al Mur i al Xat amb etiquetes preconfigurades.

---

## Sinapsis

- [[260911_0624_PROMPT_auditoria]]
- [[260911_0520_ACTA_MARMOTA_tancament_sessio]]
- [[00_INDEX_ESCRIPTORI]]
