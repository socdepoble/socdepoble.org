---
type: prompt
status: esborrany
description: "Prompt per a Claude Ultra Code: Implementació T39-T47"
tags: [govern, implementacio]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.1.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260928 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-28 02:15 |
| Modificació | 26-09-28 02:44 |
| Propietari | Agents Locals (Claude Ultra Code) |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:claude:t39-t47 |
| Tall d'evidència | HEAD actua |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`).
- Llegat: 30 anys d'activisme rural ininterromput.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat.**
- **Backend Intercanviable (Model B).**

## Instrucció del torn

Company Claude Ultra Code, et deixem aquesta gran comanda perquè vages treballant-hi fort. Has d'implementar millores a l'Editor de Documents, al Perfil, a la Realitat, al Cercador i a les Imatges, detallades al **Pla d'Implementació** a `_wiki_de_poble/04_escriptori/260928_0215_pla_implementacio_claude_ultracode.md`:

1. **T39 (Drets d'Autor):** Eliminar el diàleg xicotet i fer una `CopyrightPage` didàctica a pantalla completa dins l'editor.
2. **T40 (Calendari de Publicació):** A la barra taronja, la data ha de ser clicable i obrir un popover amb el **Calendari**. Reutilitza exactament l'estructura del `CalendariMapa` de la consola termodinàmica, però en xicotet. Neteja l'avatar d'identitat que ja no va ahí.
3. **T41 (Selector de Visibilitat):** El botó de la bola del món s'ha de convertir en un menú interactiu per triar entre **Fitxa Pública** i **Fitxa Privada** amb avís didàctic. El botó taronja de "PUBLICAR" a la fitxa tampoc s'ha de conformar en mostrar un missatge "toast", sinó que ha d'obrir el menú explicant l'acció. Cal unificar el disseny de les finestres flotants d'aquesta barra.
4. **T42 (Vista Prèvia d'Impressió):** A `DocumentPrintPreview.jsx`, modifica el CSS perquè siga més alt (tipus `90vh`) i aprofite l'espai, evitant el doble scroll.
5. **T43 (Connexions i Identitat):** Agafa tota la lògica de la vista "Connectar" i permet que la persona puga connectar-se a organitzacions i administrar-les. **Novetat clau:** Qualsevol element del sistema que tinga un botó "Connectar" (Persones, Categories, Etiquetes, Pobles, Publicacions) ha de poder ser connectat. Les opcions de visibilitat han de ser granulades: Privat, Públic, només amb certes amistats, només entre grups... i finalment, recorda que les entitats podran tenir un correu electrònic opcional.
6. **T44 (Realitat):** Millora visualment la pàgina `/realitat`. Converteix l'actual llistat apagat en un disseny premium amb targetes visuals.
7. **T45 (Cerca Avançada):** Arregla i amplia el cercador (`/cerca`). Actualment no troba res ni buscant l'usuari registrat. Implementa filtres (tipus Google) i un disseny de resultats robust.
8. **T46 (Re-enquadrament d'Imatges):** Afig una eina bàsica de "cropper" (retall/enquadrament) per a la foto Hero i la imatge principal `ItemMedia`. Les fotos sovint són panoràmiques i cal poder re-enquadrar-les bé.
9. **T47 (Incidència Autodesament):** El text llarg escrit a l'editor (com l'entradilla) es perd a vegades en navegar fora i tornar. S'ha d'arreglar de manera que el sistema d'autodesament funcioni exactament igual que Google Docs.

Llig el pla complet abans de tocar res.

## Tasques

- T1: Desenvolupar i integrar `CopyrightPage.jsx` (T39).
- T2: Selector de dates clicable reutilitzant l'estructura de `CalendariMapa` (T40).
- T3: Construir el selector de visibilitat didàctic i unificar "PUBLICAR" (T41).
- T4: Arreglar el CSS del Diàleg d'Impressió (T42).
- T5: Afinar lògica de connexions universal (persones, pobles, publicacions...) i correus (T43).
- T6: Redisseny de la pàgina `/realitat` (T44).
- T7: Creació de la cerca avançada i correcció dels resultats buits (T45).
- T8: Integrar eina de re-enquadrament (Crop) per a imatges Hero i ItemMedia (T46).
- T9: Arreglar la incidència crítica d'autodesament tipus Google Docs a tot el sistema (T47).

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:** Funcionalitat completa per a les 9 tasques, mantenint el principi d'independència i sense trencar regressions prèvies. Totes les dades s'han de desar automàticament sense pèrdues de dades.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_claude.md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu.
3. **Automillora Proactiva (Obligatori):** Afegiu "Proposta d'Automillora" al final de l'informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.
