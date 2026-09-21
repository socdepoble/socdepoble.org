---
type: petorreta
status: esborrany
description: Implementació de les 10 Troballes de Codex i Preparació per a Producció
tags:
  - auditoria
  - seguretat
  - implementacio
  - sollutia
---
# Prompt d'Implementació Local (SDP - v1.1)

Actueu com a Enginyers Sènior i Agents Locals de la Masía Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260921-2 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-21 08:50 |
| Modificació | 26-09-21 08:50 |
| Agent redactor | [[Gemini 3.1 Pro AIT (IAIA MarIA)]] |
| Destinataris | Claude (App d'Escriptori / Cowork) i Codex (Agent Antigravity) |
| Propietari | Agents Locals |
| Aprovació humana | aprovat |

## Vincles (Ancoratge de Seguretat)

- [[00_INDEX_ESCRIPTORI]]
- [[260921_0840_informe_fortificacio_codex.md]]
- [[implementation_plan.md]] (o el pla de l'escriptori)

---

**Equip d'Implementació (Accés a Disc):**
1. Claude 3.5
2. GPT-6 Astra Ligero (Codex)

### 1. Context i Estat Actual
Codex acaba de finalitzar l'auditoria extrema i ha detectat 10 vulnerabilitats crítiques (F01 a F10) a la nostra arquitectura. Aquests errors afecten les sessions, l'emmagatzematge, la CI i l'OAuth. Hem elaborat un `implementation_plan.md` per a resoldre'ls. Abans de presentar el projecte a Sollutia amb la cara ben neta, hem de cosir aquests forats de manera indestructible.

A més, el Mestre necessita tindre la certesa que un cop aplicats aquests pedaços, el sistema base estarà llest perquè ell puga registrar-se, entrar al seu `Workspace` d'usuari, crear empreses/grups, i publicar amb el nom de "Sóc de Poble".

### 2. Missió
1. **Implementació Implacable:** Heu d'agafar l'informe de Codex i l'`implementation_plan.md` i executar el codi per solucionar els 10 problemes (F01 a F10).
2. **Resolució de Dubtes (Pluja d'idees):** Al pla d'implementació hi ha dues preguntes obertes: 
   - *Com gestionem la política d'orígens (F04)?* Restringim a `auth.socdepoble.org` o deixem comodins?
   - *Què fem amb el Magic Link (F09)?* L'eliminem temporalment per no deixar rutes a mitges o n'implementem el callback PKCE sencer?
   Vull que aporteu el vostre criteri tècnic abans o durant la implementació.
3. **Validació d'Usuari:** Confirmeu si l'actual flux de registre i creació de perfil serà completament estable per al Mestre un cop fets els canvis.

### 3. Regles d'Execució
1. **Escriure Codi, No Només Parlar:** Aquesta petorreta és per a actuar. Modifiqueu els fitxers afectats (`auth.js`, `storage.js`, `oauthRelay.js`, `host.js`, `vite.config.js`, etc.) per segellar les 10 fallades.
2. **Contenció i Puresa:** Manteniu l'estil de Pedra Seca. Res de llibreries externes noves.
3. **Informe Final:** Quan hàgeu aplicat els canvis i resolt les preguntes, deixeu un **Informe de Resolució** (en Markdown) a l'Escriptori (`_wiki_de_poble/04_escriptori/`) explicant exactament quins fitxers heu tocat i quines decisions heu pres respecte als dubtes.
4. Si Codex i Claude col·laboreu, llegiu primer què ha fet l'altre per no trepitjar-vos els canvis.
