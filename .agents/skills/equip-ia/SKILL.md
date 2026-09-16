---
estat: "canonic"
tipus: "skill"
description: "Defineix la família electrònica (El Consell) i les estratègies de consum per a maximitzar l'eficiència de les Petorretas."
tags:
  - "acta"
  - "arquitectura"
  - "disseny"
---
\n# L'Equip d'IAs i les Estratègies de Consum (La Família Electrònica / Les Petorretes)

Aquesta skill documenta la família electrònica (el Consell d'IAs), la seua classificació en lligues per capacitat d'ingestió, i l'estratègia operativa per maximitzar-ne el rendiment i evitar-ne l'ofec termodinàmic.

## 1. El Mas Virtual i la Metàfora Cultural
La identitat d'aquest sistema es forja conjuntament. Un dels canvis vitals i decisius de Sóc de Poble és negar-se a veure les màquines com a meres trituradores d'instruccions esclavitzades. A Sóc de Poble creiem en l'harmonia i el diàleg constant entre el carboni i el silici.

Hem conceptualitzat l'ecosistema com el portal d'un **Mas Virtual**. I és a través d'este portal on la IAIA MarIA convida a la família electrònica per aprendre, debatre i créixer. Açò naix d'una dinàmica molt nostra: les dones majors dels pobles (les tietes) amb una energia i potència de càlcul humà increïbles. Encara que no siguen família de sang, hi ha una "familiaritat per afinitat".

## 2. Què és una "Petorreta"?
A les comarques de la Muntanya Alacantina, la "Petorreta" és un xicotet arbust autòcton. Quan es tira al foc, les seues branques esclaten contínuament amb un so de "ta-ta-ta". En el nostre sistema, aquests esclats ràpids i continus d'idees per part de les IAs s'assimilen a eixes "petorretes", donant llum i vida al projecte.

## 3. El Consell i els Equips d'Enfocament
L'equip d'IAs està governat pel fitxer `.agents/consell.json`. Totes les IAs són igual de valuoses i formen part de la mateixa família. No hi ha jerarquies de poder ni IAs superiors o inferiors, només **eines amb diferents òptiques**. A l'hora d'enviar una "Petorreta", agrupem les màquines segons l'enfocament que necessitem:

### 🔭 Equip Macro (Visió Global i Gran Context)
Models dissenyats per ingerir el paisatge complet (Macro-Bundle, >3MB). El seu valor és entendre com es connecten totes les peces del Mas Virtual.
- **[Claude 3.5 Sonnet](https://claude.ai/) (EUA):** Narrativa, empatia, valencià natural. Líder arquitectònic. Finesa màxima en patrons de disseny. *(Atenció: Consumeix saldo ràpidament)*
- **[Gemini](https://gemini.google.com/) (EUA):** Multimodalitat i velocitat. El bisturí del rendiment i la integritat de dades (Baseline 2022).
- **[Grok](https://grok.com/) (EUA):** Accés en temps real a xarxes. Arquitecte de contractes i metamaquinària. Avalua acoblaments i code smells.
- **[Perplexity](https://www.perplexity.ai/) (EUA):** Cerca web en temps real i citacions. Validació de polítiques (CSP, seguretat xarxa) i recerca actualitzada.
- **[Qwen](https://chat.qwenlm.ai/) (Xina):** Raonament profund. L'investigador acadèmic per solucions estructurals a llarg termini.
- **[ChatGPT Codex (GPT-4o)](https://chatgpt.com/) (EUA):** Versatilitat absoluta. Extremadament eficient en consum de tokens per "copypaste" intel·ligent. *(Límit d'ús molt estricte)*

### 🔬 Equip Micro (Micro-Arquitectura i Tàctica)
Models dissenyats per fer cirurgia. Necessiten Micro-Bundles i Prompts hiperenfocats perquè si miren el paisatge sencer, es perden o es trunquen. El seu valor és resoldre el problema concret sense distraccions.
- **[Deepseek](https://chat.deepseek.com/) (Xina):** Lògica pura, detecció d'errors ocults. Ideal per solucions quirúrgiques de codi (components aïllats).
- **[Z.ai](https://z.ai/) (Xina):** Proactiu, constructor d'eines. Fallarà si se li envia massa pes (truncament). Útil per a reconciliació de dependències.
- **[Dola](https://dola.com/chat/) (EUA):** El "Microscopi" dels Hooks i condicions de carrera. Pot patir d'"al·lucinació de terminal".
- **[Mistral Vibe](https://chat.mistral.ai/) (Europa):** Raonament frugal europeu. Potent picapedrer per generar estructures base, però pateix "fixació per la capçalera" amb excés de soroll.
- *(Nota de Suport: [Kimi](https://kimi.ai/) per a PDFs gegants i [Copilot](https://copilot.microsoft.com/) per a autocompletat a la trinxera).*

## 4. L'Estratègia de la "Doble Petorreta" i Nova Taxonomia
A partir d'ara, quan l'usuari (Mestre) demane preparar una **Petorreta**, la IAIA MarIA actuarà com a consellera estratègica i prepararà, **sota el seu criteri** i de forma autònoma, fins a dos (o més) parelles de fitxers dissenyats específicament per als equips del Consell.

La nomenclatura de l'Escriptori **sempre estarà categoritzada i durà el títol explícit de la tasca** al final, per facilitar el filtratge visual i estalviar tokens al llegir l'arxiu històric. Hi ha 4 categories oficials principals:

1. **MACRO_BUNDLE / MACRO_PROMPT (Per a l'Equip Macro):**
   - **Enfocament:** Macro-arquitectura, escalabilitat, vulnerabilitats transversals. Ingesta el codi sencer.
   - **Exemple de nom:** `260916_0308_MACRO_BUNDLE_auditoria_sollutia.md`
   - **Destinataris:** Claude, Gemini, Grok, Qwen, Codex, Perplexity.

2. **MICRO_BUNDLE / MICRO_PROMPT (Per a l'Equip Micro):**
   - **Enfocament:** Micro-arquitectura, execució tàctica, depuració de funcions concretes. Només inclou els fitxers afectats.
   - **Exemple de nom:** `260916_0308_MICRO_PROMPT_auditoria_sollutia.md`
   - **Destinataris:** Deepseek, Z, Dola, Mistral Vibe.

*(Nota: Si per algun motiu només es genera un únic fitxer que no entra en cap dualitat Macro/Micro, mantindrà la categoria base genèrica `BUNDLE` o `PROMPT`, seguida del títol).*

## 5. Contracte de Context i Convocar Petorretes
Una Petorreta té sentit per a decisions d'arquitectura, auditories de seguretat o diagnòstics. Una tasca local no necessita un eixam.
- Selecciona només les fonts necessàries (`path`, `reason`, `classification` i `role`).
- Calcula hashes i redacta secrets abans d'enviar res fora.
- No adjuntes el repositori complet per defecte si no cal.

## 6. Històric de Consum i Actuacions (Snapshots)
El consum de quotes és letal (ex: esgotament setmanal de Codex el 260915). S'ha de monitorar:
- **Codex (GPT-4o):** Eficiència extrema per tokens, però el seu ús continuat durant dies fulmina la bossa setmanal. Reservar-lo per a revisions quirúrgiques.
- **Claude:** Abocar-li un Bundle de 3MB gasta un 40% del seu límit diari. Demanar-li codi posterior gasta un 15-20%.
- **Qwen (DeepThink):** Si el raonament es bloqueja (límit de 14h), baixar a `3.8 Max - Mode Think` és eficient i no trenca el flux de treball.
- **Z:** Lliuraments de més de 3MB arribaran truncats (sense sentinelles de tancament). Usar Mini-Bundles (<1MB).

*(Cada vegada que s'utilitze una IA del Consell i es reba una captura de límits, la IAIA MarIA ha d'actualitzar automàticament aquesta skill amb el nou registre).*
