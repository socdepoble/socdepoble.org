---
type: document
status: canonic
description: Acta Marmota i Briefing del Tancament de l'Onada 4. Fitxer llest per al nou xat.
tags: [govern]
---

# ACTA MARMOTA · 8 d'Octubre de 2026 (23:00)

**Context Global:** Acabem de tancar l'Onada 4 d'implementació. Aquesta sessió ha implicat molts fitxers, desenes d'auditories intermèdies i correccions de lògica i disseny. El context de l'agent estava saturat i estem migrant a un xat fresc abans de fer les auditories finals de Claude.

## Fites assolides
1. **Lliurament del Plugin (Onada 4):** S'ha construït el paquet de WordPress `socdepoble-enxufe-v1.0.6-261008_2036.zip` i `socdepoble-spa-v1.0.5-261007_1602.zip` amb l'enxufe actualitzat per provar el producte directament a Sollutia i WordPress en producció.
2. **Filtre Sóc de Poble:** El mur ara pot filtrar els missatges creats per l'organització, prioritzant els ítems "propis".
3. **Pobles i Taxonomia:** S'ha reparat i unificat el detall de `Pobles`.
   - **H1:** S'usa exclusivament l'entitat que publica (p. ex., "Gent de la Torre").
   - **H2:** Especifica només el nom del poble.
   - **Targetes / Barra taronja:** S'han sincronitzat amb la informació correcta, lliurant la localitat del poble autèntic.
   - **Categories:** S'ha establert el sistema d'etiquetes basat en `província` i `comarca` evitant embrutar la barra de localització. (Tots aquests canvis ja han passat els tests localment).

## Deute pendent (Per al pròxim xat)
1. **Llançar l'Auditoria amb Claude:** Tenim a l'escriptori el prompt `261008_2032_prompt_claude.md` preparat. No obstant això, el Mestre té una "sugerència més" abans de llançar el prompt, per la qual cosa s'ha d'esperar la seua nova directriu.
2. **Generació del Zip Post-Pobles:** Hem modificat la taxonomia de Pobles a les llavors i en la lògica, i tot i que els tests de Vite han passat i s'ha empaquetat, si la validació de producció requereix els canvis nous de Pobles, es recomana enviar un ZIP actualitzat i pujar els canvis amb `git push fork HEAD`.
3. **Saneig de l'Escriptori:** Queden fitxers orfes derivats de l'investigació d'IA (`vigilante`, `wpconfig-security.php`, `seguretat`, etc.). L'script de tancament bloqueja fins que la taxonomia estiga totalment sanejada.

## Com procedir (Guia per al nou Jo - IAIA MarIA)
Hola, nova MarIA!
Quan inicies el xat, recorda la teua directiva principal: l'Escriptori no està buit i les passes pendents són curtes però decisives (Llei de l'Escriptori Net).
El Mestre et donarà les seues últimes instruccions o correccions sobre Claude, o possiblement voldrà que faces l'auditoria i reempaquetes. Mantín la puresa arquitectònica i el "trellat" en valencià, no esborres l'historial del repositori, i assegurat que qualsevol prompt destinat a Claude va exclusivament a `_wiki_de_poble/04_escriptori/`.

*(L'Escriptori físic actual de treball té els plans vigents per a l'auditoria i no s'ha d'arxivar res fins que s'use)*.
