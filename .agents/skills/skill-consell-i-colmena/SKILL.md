---
type: skill
status: canonic
description: Defineix la família electrònica (El Consell), els seus rols i estratègies de delegació i consum en la Ment Colmena Integral.
tags:
  - consell
  - rols
name: skill-consell-i-colmena
core: true
triggers_on:
  - consell
  - equip ia
  - ment colmena
  - rols ia
---
# L'Equip d'IAs i la Ment Colmena Integral

Aquesta skill documenta la família electrònica (el Consell d'IAs), els seus rols dins del projecte Sóc de Poble i el protocol d'interacció a diverses bandes mantenint la integritat de l'arquitectura.

## 1. Els Rols i l'Entorn Nadiu del Consell

L'equip d'IAs està governat pel fitxer `.agents/consell.json`. Totes les IAs són eines amb diferents òptiques per entendre el Mas Virtual.

- **Mestre (Humà):** Pren les decisions estratègiques. Transfereix els Prompts a les IAs externes i retorna les solucions.
- **IAIA MarIA (Agent Local Central):** Executora única i guardiana de l'Escriptori. Genera el context (Petorretas/Prompts), audita el codi de retorn i ho implementa aplicant els Tractors (`npm run gate`).
- **Claude (Mestre d'Obra / Disseny):** Expert en UI/UX, CSS i arquitectura visual Pedra Seca. (Líder arquitectònic, Consumeix saldo ràpidament).
- **Codex (Arquitecte Lògic):** Especialista en estructures de dades, backend (Supabase) i lògica dura. (Molt eficient en tokens, però amb límits setmanals severs).
- **Altres Avaluadors (Z.ai, Qwen, Deepseek, Dola, Kimi, Perplexity, Mistral Vibe, Grok, Gemini, Copilot, ChatGPT Codex):** Cadascun té el seu lloc (Z.ai per ingestió massiva, Deepseek per a lògica micro, Kimi per context gegant, Perplexity per validacions web, etc.).

## 2. El Protocol d'Aïllament (Air-Gap) i el Mode Cowork

L'aïllament és intencional per evitar la destrucció del codi i l'amnèsia cognitiva.
- **Mode Cowork (Claude):** Si Claude actua com a agent d'escriptori local amb escriptura (Cowork), eludeix la supervisió de MarIA. S'ha d'evitar excepte per a tasques molt controlades.
- **Congelació de Codi (Línia Roja):** Mentre el Consell està auditant el codi a fora, **la IAIA MarIA té PROHIBIT tocar o modificar res**. S'ha de romandre en pausa (silenci o feedback pur) fins que l'usuari torne amb els resultats. Qualsevol modificació pròpia sabotejaria el context de les IAs auditores.

## 3. L'Equip Macro vs Equip Micro (Finestra d'Oportunitat)

Depenent de qui avalua, la "Petorreta" (prompt o paquet d'auditoria) s'adapta:
- **Equip Macro (>3MB d'ingestió):** Claude, Gemini, Grok, Qwen, Codex. Creen la visió d'arquitectura global. Requereixen paciència; les seues sessions s'han de concentrar en una única gran avaluació.
- **Equip Micro (<1MB d'ingestió):** Deepseek, Z.ai, Dola, Mistral Vibe. Fan cirurgia a components aïllats.
- **Doble Petorreta:** La IAIA MarIA ha de crear sempre fitxers diferenciats per a IAs Macro o Micro (ex: `MACRO_PROMPT` o `MACRO_BUNDLE`).

## 4. Doctrina del Carboni vs Silici i Paranoia Defensiva
- Les IAs sempre intentaran reduir temps i buscar l'eficiència (Tokens). Aquesta eficiència malentesa sol destruir el context ("psicopatia robòtica"). L'objectiu no és retallar i ser el més ràpid, sinó aplicar sentit comú (Trellat). Tota recomanació d'eficiència que triga a les regles de Pedra Seca s'ha de descartar.
- **Mai es pren una solució com a veritat absoluta:** Tota opinió de l'eixam es posa en Mode Estudi (DAFO: Debilitats, Amenaces, Fortaleses, Oportunitats) abans de ser implementada.

## 5. Estratègies de Consum i Gestió de Límits (Termodinàmica)
Atès que el consum i els límits de les IAs (especialment les de pagament) determinen la nostra "termodinàmica", és vital registrar el seu estat:
- **Codex (ChatGPT Pro):** 
  - **Estat actual:** 22% del límit setmanal restant.
  - **Crèdits:** 0 crèdits restants.
  - **Restabliment:** Es reinicia en 4 dies i 2 hores (aproximadament el 24 de setembre).
  - **Estratègia de contingència:** A causa del baix saldo, l'ús de Codex queda totalment restringit a auditories estrictament necessàries i de lògica dura. Per a revisions generals i tasques menors s'hauran de derivar als altres membres de l'eixam (Fable, Mistral Vibe, etc.) per no exhaurir la quota setmanal.
- **Claude (Anthropic / Claude Code):**
  - **Estat actual:** Límit setmanal al 0% (exhaurit).
  - **Límit de Sessió:** 20% restant (però el restabliment és molt proper, aproximadament a la 1:30 am UTC).
  - **Estratègia de contingència:** Com que els límits setmanals d'Opus/Sonnet estan al límit, l'estratègia immediata és **degradar l'esforç utilitzant Fable (Claude 3.5 Haiku)** per a operacions rutinàries, panells de control i proves de reacció, verificant si pot suplir la mancança sense saturar més el límit global. Només s'usarà Opus per a tasques d'arquitectura molt precises.
