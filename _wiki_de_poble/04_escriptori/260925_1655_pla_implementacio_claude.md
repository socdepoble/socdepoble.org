---
type: document
status: esborrany
description: Regularització documental del fitxer actiu amb original immutable i rebut actual; contingut editorial original conservat
tags:
  - implementacio
visibility: private
reflex: sdp:torn_38e3e8e5-ec5c-4070-8cce-c55d6341b6d4:94004141-d077-485b-81c4-7db632f52fec
---
# Pla Claude importat amb procedència documental verificable

**Estat del Pla:** en elaboració (regularització; no canvia l’aprovació de l’original)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_38e3e8e5-ec5c-4070-8cce-c55d6341b6d4:94004141-d077-485b-81c4-7db632f52fec |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T15:19:52.304Z |
| Modificació | 2026-09-25T15:19:52.304Z |
| Propietari | codex-regularitzacio |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Regularització: GPT-6, variant no exposada. Model de l’original no verificat. |
| Tokens consumits | Mesura no disponible; estimació no calculada. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-25T15:19:52.304Z: revisió d’importació; original conservat, revisió editorial pendent.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Importació explícita de _wiki_de_poble/04_escriptori/260925_1655_pla_implementacio_claude.md; SHA-256 original 161becb7f98b839f218b325ff4d5e3e9ee80112f81662f6178f54658b691620e. No acredita una lectura anterior ni revalida les conclusions de l’original.

### Pla d'Implementació Claude: Formateig Editorial i Pedra Seca

<!-- SDP:SECTION pla.local.s0 -->
### Context
El Mestre ha detectat que l'estil visual i el formateig dels arxius `.md` a la Universal Page grinyola. Els títols massa llargs es desborden, algunes pàgines no tenen "entradilla" (resum sota el títol), i l'exportador/parsejador de MD a HTML no acaba de deixar-ho tot net i bonic. S'exigeix l'entrada de **Claude Ultra Code** per arreglar el disseny editorial del sistema Pedra Seca.

<!-- SDP:SECTION pla.local.s1 -->
### Fase 1: Enfortiment del CSS Editorial i Parseig
Cal investigar el parseig actual de Markdown i perfeccionar-lo (per suportar entradilles). També s'han d'afegir les regles de CSS `word-break: break-all` o `overflow-wrap: break-word` als elements del Sidebar o contenidors perquè els títols llargs sense espais es tallen correctament sense eixir del marge. Títols sense punts finals.

<!-- SDP:SECTION pla.local.s2 -->
### Fase 2: Revisió Profunda dels Arxius MD
Revisar i reformatejar tots els arxius Markdown de `_wiki_de_poble/` i les seues "entradilles". Claude té autorització per inventar o redactar les entradilles adients. També cal detectar i eliminar duplicitats o contradiccions conceptuals en estos fitxers històrics antics.

<!-- SDP:SECTION pla.local.s3 -->
### Fase 3: Reformateig de la Consola i Targetes "At a Glance"
El Mestre ha revisat la Consola Termodinàmica i exigeix les següents millores visuals i funcionals per a fer-la una vertadera eina forense i psiquiàtrica:
1. **Format Editorial Complet:** Totes les sub-pàgines de la consola han de tindre obligatòriament el seu H2 i la seua "entradilla" descriptiva. Cal revisar totes les vistes i redactar/generar les que falten perquè totes isquen amb el format editorial correcte.
2. **Targetes Enriquides i Etiquetes:** Les targetes de resum han de mostrar d'un colp d'ull què passa dins, utilitzant etiquetes o "badges" de colors (ex: "cal reparar", "important", "canvis nous") perquè el Mestre no haja de fer clic innecessàriament.
3. **Reparació Funcional i Visual:** Les seccions desplegables de tipus "Veure detall de..." actualment es queden a mitges i es mostren lletges, a més de generar errors. Cal arreglar aquest comportament i dissenyar-ho de manera atractiva i funcional.
4. **Eliminar Duplicat del Graf:** Elimina la pàgina/targeta `obrir_graf` de la llista de la Wiki (arrel), ja que ara en tenim una versió nova i millorada a la Consola Termodinàmica (`consola/explorador`). **Molt important:** No esborres el codi (lògica React) que dibuixa el graf, perquè la versió de la consola el necessita per a funcionar; només lleva l'accés duplicat antic.
5. **Efecte WOW i Zoom a l'Explorador del Cervell:** A la pàgina de l'explorador de la Consola, actualment els filtres ocupen tota la part superior i empenyen el graf cap avall. Reorganitza la interfície perquè el graf siga el primer que es veja en entrar (efecte WOW), i els filtres es mostren baix o en una consola lateral ben dissenyada i compacta. A més, **implementa el zoom in/out amb la rodeta del ratolí** perquè siga idèntic a Obsidian i l'usuari puga navegar còmodament per la galàxia de nodes.
6. **Mecànica Mobile (Pull to Refresh):** Implementar o perfeccionar la funcionalitat de "pull to refresh" (lliscar el dit cap avall per a recarregar la pàgina) en dispositius mòbils. Açò aporta tranquil·litat a l'usuari i és un estàndard d'usabilitat fonamental.
7. **Barra Lateral Plegada (Icones i Emojis):** Quan la barra lateral es plega, els elements sense icona mostren una lletra (o espai buit per a les carpetes). Claude ha de permetre que categories, carpetes, etiquetes i documents puguen tindre assignat un emoticono (emoji) o una icona de Pedra Seca. Així, un usuari expert podrà navegar per la barra plegada reconeixent cada secció només per la icona.


<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Importació explícita de _wiki_de_poble/04_escriptori/260925_1655_pla_implementacio_claude.md; SHA-256 original 161becb7f98b839f218b325ff4d5e3e9ee80112f81662f6178f54658b691620e. No acredita una lectura anterior ni revalida les conclusions de l’original.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Importació explícita de _wiki_de_poble/04_escriptori/260925_1655_pla_implementacio_claude.md; SHA-256 original 161becb7f98b839f218b325ff4d5e3e9ee80112f81662f6178f54658b691620e. No acredita una lectura anterior ni revalida les conclusions de l’original.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
