---
type: acta
status: canonic
description: Acta Marmota del cicle nocturn. Destil·lació de la Llei de la Secretària Tècnica (core-secretaria-auditoria, zero tocar codi), to de poble autèntic (anti-pompositat, anti-empapussament), caça del f...
tags:
  - acta
  - marmota
visibility: private
reflex: sdp:torn_261027_0145:marmota_relleu_secretaria
---
# Acta Marmota: Llei de la Secretària Tècnica, To Pla de Poble i Relleu Fresc

> **Nota per a la IAIA:** Aquesta acta registra l'aprenentatge crucial de la relació humà-màquina assolit amb el Mestre Javi Llinares, fixa la directriu operativa per a no saturar el context i estableix les bases per al nou torn d'auditoria adversarial amb Claude, Gemini i Codex.

## 1. Registre

| Camp | Valor |
| --- | --- |
| Identificador | `sdp:torn_261027_0145:marmota_relleu_secretaria` |
| Versió del document | 1.0.0 |
| Data | 2026-10-27T01:45:00+01:00 |
| Propietari | IAIA MarIA (Secretària Tècnica i Orquestradora d'Alta Fidelitat) |
| Aprovació humana | Aprovat pel Mestre Javi Llinares en àudios i captures |
| Model IA | Antigravity (IAIA MarIA) + Claude Opus 5.5 |
| Branca | `backup-notes-publish` |

---

## 2. Lliçó d'Orquestració: La Llei de la Secretària Tècnica (`core-secretaria-auditoria`)

Durant la sessió nocturna, el Mestre ha donat una ordre fonamental de governança:
- **El problema de l'impulsivitat ("Fix-it-now"):** Quan el Mestre assenyala una errada visual o de text mentre Claude està treballant, l'acte reflex d'Antigravity de posar-se a inspeccionar i editar codi és nociu:
  1. Fa esperar al Mestre i talla la comunicació fluida quan té una idea immediata.
  2. Modifica fitxers alhora que Claude, generant col·lisions i invalidant les bateries de tests.
  3. Infla el context de la conversa amb desenes de lectures i cerques de codi (59 arxius al brain), apropant-se a la saturació.
- **La regla d'or de la Secretària Tècnica:**
  - **Claude i Codex són els mecànics del codi:** executen els tests, editen els components i verifiquen la implementació.
  - **MarIA és la Secretària Tècnica i Memòria Viva:** escolta al Mestre a l'instant, no el fa esperar, tradueix la seua visió a fites clares al Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`), prepara els prompts i les actes, i manté les portes de la Wiki i el sistema netes.
- **Codificació formal:** S'ha creat i segellat la skill canònica [core-secretaria-auditoria](file:///Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/.agents/skills/core-secretaria-auditoria/SKILL.md) i s'ha actualitzat el segell criptogràfic (`ae58ddf0...`).

---

## 3. Resolució de Producte i Disseny Humà (Instruccions del Mestre)

### A. To Autèntic de Poble (Anti-pompositat i Anti-politicisme, Fita `P1-52`)
- **El problema:** El text de la resposta simulada de la IAIA (*«Açò és una simulació. Registra't per a parlar amb els pobles de veritat!»*) era pompós, sobtat i amb un to polititzat estrany a la realitat quotidiana del poble.
- **La veritat del Mestre:** El poble no és solemnitat buida ni afectació de "lo meu"; és parlar pla, clar, divertit, absurd i normal. Si vols guardar la conversa, t'has de registrar, i ja està.
- **Decisió:** Claude canviarà el text a:
  > *"Açò és una simulació. Si vols guardar la conversa, has de registrar-te, i ja està."*

### B. Anti-empapussament al Xat (Fita `P1-54`)
- **El concepte valencià:** *Empapussar* (com donar-li a un pardalet més menjar del que pot tragar).
- **El problema:** Posar el bloc de botons («Descarrega l'App», «Connectar-se», «Registrar-se») davall de cada conversa oberta (a la pissarra de parlar) atabala el visitant i trenca la sensació de xat natural com WhatsApp.
- **Decisió:** Retirar el peu d'accés de la pissarra de conversa. Aquests botons només han de viure a la pàgina d'aterratge/inici del Xat (on no hi ha cap fil obert). Quan s'entra a una conversa, el xat ha de ser net i lliure d'empapussament.

### C. Caça del Fantasma dels 10px a la Llista de Converses (Fita `P1-53`)
- **El problema:** A la targeta de conversa de la llista (`button.sdp-xat-fila`), que mesura 96px, s'ha detectat un espai fantasma superior de ~10px respecte a la línia divisòria, mesurant ~106px en total i trencant l'encaix mil·limètric de la graella.
- **Decisió:** Claude investigarà el marge/padding fantasma superior per deixar la fila a 96px justos contra la línia.

### D. El Cercle Perfecte de Comunitat i Poble/Entitat (Fita `P1-55`)
- **La visió estratègica (WhatsApp Superpotenciat):**
  - **Comunitats de Poble (ex: *Gent de la Torre*, *Gent de Xixona*, *Gent de Relleu*):** A la dreta s'incrusta directament la pàgina viva del poble (`/pobles/[slug]` amb la foto de portada, descripció, mercat i avisos municipals).
  - **Comunitats d'Entitat (ex: *Sóc de Poble*):** A la dreta s'incrusta la pàgina oficial de l'entitat (`/socdepoble` amb la seua fitxa institucional i publicacions).
  - En pantalla d'ordinador o tauleta, la persona té a l'esquerra els canals de la comunitat i a la dreta la pàgina viva interactiva per navegar i connectar. Si es tria un canal concret, s'obri el fil de xat.

---

## 4. Estat Tècnic del Repositori

1. **Claude Opus 5.5:**
   - Té a punt la ronda 4: Card de Descàrregues (`P1-38`), reparació de 248 enllaços a la Wiki (`P1-39`), jerarquia TOC H1-H6 sota barra negra de 64px a Notes, files de 96px i avatar de 76px.
   - Les 3.627 proves passen (3.365 Vitest + 262 Node, 0 fallades).
   - Rebrà les noves fites `P1-52`, `P1-53`, `P1-54` i `P1-55` registrades al Llibre Mestre.
2. **Segell i Catàleg de Skills:**
   - 42 skills catalogades a `.agents/manifest.yaml` i `00_INDEX_SKILLS.md`.
   - Segell cryptogràfic `ae58ddf01b597754c8ce3952b4c63ada64298d158fb6af870db4d2ad506c4be1` validat amb èxit.
3. **Escriptori:**
   - Cap document solt abandonat; tot ancorat i ordenat.

---

## 5. Relleu per al Nou Inici (Pau Mental i Bateria Plena)

Aquesta acta marmota tanca netament la sessió actual. El Mestre pot eixir d'Antigravity IDE amb total tranquil·litat, recarregar l'aplicació i reprendre el flux en un context net i fresc, on procedirem amb l'auditoria adversarial del Consell (Gemini + Codex) i la revisió final de Claude.

## Vincles
- [[00_index]]
