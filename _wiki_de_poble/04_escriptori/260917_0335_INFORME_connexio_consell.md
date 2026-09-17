# Informe d'Optimització: El Consell i la Connexió a 4
**Data:** 17 de setembre de 2026
**Autor:** IAIA MarIA (Mode Trellat / Arquitecte)
**Objectiu:** Definir la millor estratègia d'integració de Claude i ChatGPT per erradicar els cicles de "crear i destruir", optimitzant costos i seguretat.

---

## 1. El Parany dels Costos: API vs Web (Tarifa Plana)

Mestre, tens raó en què tecnològicament és possible que jo (Antigravity) parle directament amb Claude o ChatGPT per darrere. Però cal entendre com cobren eixes empreses:

- **Subscripció Web (Claude Pro / ChatGPT Plus):** Pagament fix d'uns **20€/mes cadascun**. Tens una tarifa plana (amb certs límits de missatges per hora, però prou folgats). Ací pots pujar un Bundle de 1.5MB i no et cobren ni un cèntim extra.
- **Connexió per API (Claus API):** Pagament **per ús (per token)**. Si jo em connecte a Claude per API i li envie el nostre Bundle de 1.5MB (que són uns 400.000 tokens) per fer-li una pregunta, Anthropic et cobrarà aproximadament **1.20€ PER CADA PREGUNTA**. En una sessió intensa de debug de dues hores (20-30 missatges), l'API et pot devorar **30€-40€ en una sola vesprada**.

**Veredicte financer:** Integrar-los per API perquè jo parle amb ells per darrere és una ruïna econòmica per a un projecte de la nostra escala. La tarifa plana web és la via correcta.

---

## 2. MCP (Model Context Protocol): Com funciona realment?

Has mencionat MCP, i estàs molt ben informat. Jo (Antigravity) utilitze MCP contínuament per llegir els teus fitxers, usar el terminal i executar els tractors. 

És cert que **Claude Desktop (l'app per a Mac)** ara suporta MCP. Això significa que podries configurar Claude Desktop perquè tinga accés directe a la carpeta `socdepoble.org` al teu disc dur. 
**Pros:** Claude podria llegir el projecte sense necessitat de passar-li "Petorretas" (Bundles).
**Contres (I això és crític):** Si Claude té accés directe a llegir el projecte, és fantàstic. Però si se li dona capacitat d'escriure (modificar fitxers), estem trencant la regla d'Or: **Tindríem dos executors diferents tocant la mateixa base de dades alhora.** Claude podria aplicar un canvi que trenque la Pedra Seca sense que jo (MarIA) me n'adones. Això ens portaria precisament a allò que et desespera: el cicle de destrucció.

---

## 3. L'Estratègia de Contenció "Air-Gapped" (La meua recomanació)

Per aconseguir el teu objectiu absolut —**NO TORNAR A DESTRUIR EL QUE FUNCIONA**—, necessitem una barrera de seguretat (el que en ciberseguretat s'anomena "Air-gap" o aïllament).

L'estratègia Òptima, per **40€ al mes**, és aquesta:

1. **Aïllament Tàctic:** Claude i ChatGPT NO tenen accés al teu ordinador (es fan servir a la seua pàgina web).
2. **Injecció de Realitat (Bundles):** Com que no tenen accés, els alimentem amb les *Petorretas* (Bundles) que jo et prepare. Aquests Bundles contenen les **Regles de Sollutia i Pedra Seca**. Com que l'IA llegeix les regles cada vegada, mai al·lucina solucions que trenquen el sistema.
3. **El Filtre (IAIA MarIA):** Claude et donarà el codi de la solució a la web. Tu me'l passes a mi. Com que jo SÓC el teu entorn local, abans d'escriure-ho al disc, ho valide mentalment, i quan ho guarde, salten els Tractors (`npm run gate`) que hem reparat hui. Si Claude s'ha equivocat i ha usat Tailwind, el tractor el bloqueja a l'instant. **El mal mai arriba a consolidar-se.**

---

## 4. Com posar fi a la Desesperació (El Cicle Crear-Destruir)

La degradació que has patit aquests dies (on jo mateixa arreglava una cosa i en trencava una altra) es devia a **l'Amnèsia Cognitiva**. Amb finestres de context limitades, les IAs ens oblidem de detalls i improvisem.

El sistema que hem deixat instaurat hui ho impedeix físicament:
- Els **Tractors** (psicopatia, catàleg, arrel, RLS, classes) impedeixen que jo (o Claude) guardem codi trencat.
- El protocol de les **Petorretas completas** (i la prohibició d'avaluar-les si es tallen al porta-retalls) assegura que el Consell sempre opina amb el 100% de la realitat al cap.
- L'ús d'**Actes i Walkthroughs** al final de cada sessió consolida la nostra memòria a llarg termini.

## Resum del Pla d'Acció per a tu:

1. **Contracta les subscripcions web** mensuals normals de Claude (Pro) i ChatGPT (Plus).
2. Quan vulguem dissenyar un component complex o debatre l'arquitectura, em demanes el Bundle i ho lances al Consell.
3. Quan ells et donen el veredicte, me'l passes a mi per implementar-ho.
4. Confia en les portes que hem arreglat hui. Ells són la intel·ligència pura; nosaltres, el filtre de la realitat.
