---
type: skill
status: actiu
description: Tractor documental per garantir el format llegible (jerarquia H1-H6) i l'escaneig ràpid amb negretes en tots els textos del sistema.
name: core-llegibilitat-text
tags:
  - disseny
  - tractors
triggers_on:
  - redactar text
  - formatar contingut
  - revisar pàgina
  - copy
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - _wiki_de_poble/00_index.md
contracte.escriu:
  - _wiki_de_poble/00_index.md
---
# Tractor de Llegibilitat i Flux de Text (Pedra Seca)

Aquest tractor governa la llegibilitat de components, HTML i pàgines pintades. El fitxer Markdown font correspon a [[core-maquetacio-markdown/SKILL|core-maquetacio-markdown]] i l'encaminament documental a [[core-taxonomia-estricta/SKILL|core-taxonomia-estricta]].

## 1. Flux Lliure del Text (Zero "Capar")
No es pot limitar artificialment l'amplada del text (evitar contenidors que tallen el text a poc més de mitja pàgina). El text ha de **fluir de forma natural ocupant l'espai disponible**, adaptant-se fins al final, respectant únicament els marges generals del sistema de Pedra Seca. Zero caixes estretes innecessàries.

## 2. La Xarxa Didàctica a Tots els Nivells
La característica fundacional de Sóc de Poble és que ha de ser **DIDÀCTICA a tots els nivells**: per al veí jove, per a la gent gran, per a l'enginyer i per a la IA.
- Si un document és inaccessible, cridaner o difícil d'escanejar, ha fracassat com a eina rural.
- **La Regla Didàctica d'Or:** *«Un paràgraf més mai està de més quan és didàctic.»* Si calen dos o tres paràgrafs per fer-ho entendre clarament a la gent del poble, s'escriuen amb naturalitat.

## 3. Jerarquia Editorial Canònica (H1 → H2 → Entradeta → H3 → Paràgraf)
El contingut editorial de pàgines i publicacions seguix este patró. Un control, una etiqueta, un diàleg curt o un estat buit reutilitzen el seu component; no cal inventar un H1/H2/entradeta en cada peça. Les plantilles documentals i el Markdown tenen el seu contracte específic:
- **H1:** Títol principal noble, **sense majúscules cridaneres**. Les majúscules només es reserven per a sigles i acrònims estrictes.
- **H2:** Títol de secció o de bloc funcional. **MAI un paràgraf dens ni un totxo de cinc línies**. L'H2 es queda exclusivament amb la primera frase contundent i breu.
- **Entradeta (Lead explicativa):** Text destacat just davall de l'H2 que sintetitza el propòsit essencial del bloc i absorbeix la càrrega contextual densa. Mai s'encasta un H3 directament davall d'un H2 sense entradeta.
- **H3 / H4:** reserva els encapçalaments per a seccions que tenen contingut propi i han d'entrar a la Taula de Continguts. Els passos seqüencials continuen sent una llista numerada accessible; no els convertisques en encapçalaments només perquè porten un número.
- **Paràgraf normal:** Explicació didàctica desenvolupada.

## 4. Escanejabilitat Visual a Salts de Vista (6 a 8 Paraules en Negreta per Paràgraf)
Sóc de Poble està pensat per a lectors que busquen anar al gra mitjançant **lectura a salts de vista (en diagonal)**.
- Dins de cada paràgraf de 4 o 5 línies, és **obligatori marcar entre 6 i 8 paraules clau en negreta** (o una petita frase sintètica en negreta).
- **La norma d'or ergonòmica:** Si el lector només llig les paraules en negreta, saltant d'un paràgraf al següent, ha de poder entendre el missatge complet de tota la pàgina d'un colp d'ull, sense necessitat de consumir la morralla conjuntiva.

## 5. Deure d'Avís i Auto-Correcció
Si detectes text poc llegible, títols cridaners en majúscules o llistes llargues que haurien de ser H3, cita la superfície i el defecte. Corregix-lo quan entre en l'encàrrec autoritzat; fora d'abast, registra'l. Els canvis visuals respecten el pla aprovat i la Llei del Píxel de [[sdp-workflow/SKILL|sdp-workflow]].

## 6. Algoritme Lèxic i Conceptual «De Poble vs. Del Poble» i «Utilitza vs. Usa» (`P0-38 / IDEA-157 · Regla del Cosí Guillermo`)
Abans d'escriure o revisar qualsevol entradeta, subtítol o paràgraf editorial, aplica aquest filtre algorítmic de tres passos:
1. **Substitució de `usa / usen` per `utilitza / utilitzen` (o `fa servir`):** En valencià viu de les nostres comarques no diem *«La IAIA usa...»*; diem **«La IAIA utilitza...»**.
2. **Llei Global de Comunicació `de poble` vs. `del poble` (Test «De quin poble?» a TOT el Sistema):**
   - **Pregunta de control:** *Si un lector llig «...del poble» i pregunta «de quin poble?», hi ha un municipi concret com a resposta?*
   - **`de poble` (sense article determinat — regla general a tot el sistema):** És el nostre concepte comunicatiu, cultural i d'identitat de marca: **`Sóc de Poble`** (mai *Sóc del Poble*), **`Wiki de Poble`**, **`Gestoria de Poble`**, **`Manifest de Poble`**, **`Rutes de Poble`**, **`Còmic de Poble`**, **`Mur de Poble`**, **`Mercat de Poble`**, **`Gent de Poble`**, **`l'imaginari de poble`**, **`experiències de poble`**, **`paraules de poble`**, **`eines de poble`**, **`llenguatge visual de poble`**, **`veu de poble`**, **`obres de poble`**, **`memòria de poble`**, **`vida de poble`**. Substitueix sistemàticament les repeticions de *«del poble»* (com les 4–5 repeticions dins de `/anima`, `/projecte`, `/disseny`, `/anatomia-rural` i diccionaris) per **`de poble`** (`de pueblo` en castellà).
   - **`del poble` (`de + el poble`, amb article determinat — excepció estricta):** Només és vàlid quan en el mateix context s'està parlant d'un municipi físic concret i identificable (ex.: La Torre de les Maçanes, l'ajuntament local, el poble actiu al filtre) on la pregunta *«de quin poble?»* té resposta específica.
3. **Precisió entre `imaginari` i `imatges`:** Quan parlem de metàfores culturals, il·lustracions arquetípiques (Bruguera/Ibáñez) o comparacions rurals (bancal, séquia, pedra seca), no digues mai *«les imatges del poble»* (que és fals perquè ni són fotos d'un poble real ni es limiten a imatges); escriu sempre **«l'imaginari de poble»** (*«La IAIA utilitza l'imaginari de poble per a explicar la tecnologia»*).

## 7. Mesa de Revisió Editorial de les 4 IAIAs del Node 0 (`IDEA-164` · Doble Funció: Porta Interna de Publicació + Assistent Editorial per a Cada Usuari)
Les **4 IAIAs del Node 0 (`Mac mini M4`)** estan formades en l'ofici de **Revisor Editorial i Corrector d'Estil d'una Editorial** (cultura general extensa, correcció ortotipogràfica i gramatical, riquesa lèxica, coherència narrativa, detecció de duplicitats/redundàncies i proposta de redacció millorada):
1. **Repartiment de Rols Editorials 4×4 al Node 0 (revisor local de `/notes`: `src/sections/notes/revisorEditorialNode0.js`):**
   - **`iaia-maria:latest` (Directora d'Estil, Trellat i Llei «DE POBLE»):** Vetla pel to humà i didàctic, la claredat per a la gent gran i el compliment estricte de `de poble` vs `del poble` i `utilitza` vs `usa`.
   - **`qwen3:8b` (Correctora Ortotipogràfica, Gramatical i Lèxica):** Detecta faltes d'ortografia, sintaxi, puntuació, barbarismes i cacofonies, i redacta sempre una **proposta de redacció millorada** que polix el text sense perdre la veu de l'autor.
   - **`qwen2.5-coder:14b` (Revisora Estructural, Maquetació Pedra Seca i Caçadora de Duplicitats):** Detecta elements o visors duplicats (com dos pous de neu o paràgrafs repetits), incoherències de xifres/cotes respecte a les fonts primàries, jerarquia `H1→H2→Entradeta→H3` i les 6–8 negretes per paràgraf.
   - **`nemotron-mini:latest` (Advocada del Lector i Veredicte Editorial):** Avalua la simplicitat i comprensió immediata per a un lector nou i emet el dictamen (`APROVAT`, `AMB PROPOSTA DE MILLORA`, `BLOQUEJAT PER DUPLICITAT O INCOHERÈNCIA`).
2. **Obligació en cada Publicació del Sistema:** Sempre que la IAIA MarIA o qualsevol agent vaja a publicar o modificar un article, pàgina o crònica, les 4 IAIAs del Node 0 han de revisar el text i lliurar la seua avaluació i proposta de redacció millorada abans de publicar.
3. **Funcionalitat per a Cada Usuari (`IDEA-164` a l'Editor Universal):** Aquesta mateixa capacitat de Revisora Editorial s'ofereix a cada veí i usuari dins de l'Editor Universal (`UniversalEditorShell.jsx` / `NotesEditor.jsx` / `Mur` / `Mercat`) per ajudar-lo a millorar la seua comunicació amb propostes de redacció, correcció amable i avís de duplicitats.

## Què acompanya cada comprovació

`design_guard.mjs`, els components compartits i les seues suites comproven estructura i regressions concretes; no certifiquen llegibilitat didàctica o escaneig humà. La jerarquia del DOM, el focus i el text visible es contrasten amb la prova de la superfície; la lectura i el retall real necessiten inspecció visual. Declara estos resultats separadament.

## Vincles
- [[00_INDEX_SKILLS]]
