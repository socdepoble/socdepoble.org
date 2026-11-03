---
type: plantilla
status: canonic
description: Plantilla ISO per dissenyar skills amb gallets, abast, regles, proves i eixida verificable.
tags:
  - maquina
  - skills
---

<!-- SDP:EIXIDA
type: skill
status: esborrany
description: "<12-220 caràcters: quin procediment governa esta skill>"
tags: [skills]
-->
# 📜 PLANTILLA ISO: Creador de Skills Antigravity (La Fàbrica)
**Versió ISO:** 2.1.0 (Model B i excepcions locals explícites)
**Categoria:** Plantilla
**Data Modificació:** 2026-11-03

---


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | [pendent] |
| Versió del document | [pendent] |
| Entorn | [pendent] |
| Creació | [pendent] |
| Modificació | [pendent] |
| Propietari | [pendent] |
| Aprovació humana | [pendent] |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

[pendent]

## Contingut

[pendent]

### Guia editorial de la plantilla


### LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangular Negre (Per a Light Mode):** `/assets/system/ui/logo-socdepoble-rect-negre.svg`
- **Rectangular Estàndard:** `/assets/system/ui/logo-socdepoble-rect.svg`

### MISSIÓ DEL PROTOCOL
Estandarditzar com es construeixen i es documenten les noves "Skills" (protocols automatitzats). Totes les skills han de reflectir la **realitat actual** i la **VISIÓ MESTRA** del projecte: 
Les dades compartides tenen el Supabase de Sóc de Poble com a **font de veritat**. Sollutia és un amfitrió del **Model B**, amb frontissa GET de lectura; no és un backend d'escriptura. El codi inclou dades locals del dispositiu i una closca sense xarxa de `/app/*`; l'[[ADR-2026-10-APPS-DEL-DISPOSITIU]] en documenta la implementació parcial i la proposta d'abast, encara **pendent de signatura**. La resta continua online-first. **L'usuari decidix què publica**. Ja hi ha projecció pública estàtica ActivityPub (actors, outbox i NodeInfo); la federació interactiva en producció continua **pendent d'activació real**, tot i existir-ne la biblioteca d'inbox/Follow. La **sincronització CRDT continua sent visió futura**.

### 1. ESTRUCTURA DE FITXERS
Tota skill del sistema ha de viure a la carpeta corresponent en `.agents/skills/<nom_skill>/`.
- `SKILL.md`: La lògica i instruccions mestres (Aquest nom d'arxiu és innegociable perquè el motor d'Antigravity el llija automàticament).
- L'esborrany de treball, abans de ser skill viva, va a l'Escriptori amb el nom `aammdd_hhmm_skill_titol.md`. Llig la [[taxonomia_documental]] abans d'anomenar cap fitxer.

### 2. FORMAT DEL SKILL.md (YAML Frontmatter i Cos)
Cada document de skill ha de començar amb l'estàndard d'Antigravity:
```yaml
---
type: skill
status: canonic
description: "Descripció concisa de l'habilitat (màx 220 caràcters)."
name: "nom-de-la-skill"
triggers_on:
  - "paraula_clau_1"
  - "paraula_clau_2"
version: "2.1.0"
---
```

Després del YAML, l'estructura de la skill ha d'incloure:
1. **Propòsit de la Skill:** Què fa i quan s'ha d'activar.
2. **Frontera de Confiança:** Quines accions destructives té prohibides.
3. **Instruccions d'Execució:** Passos clars, prioritzant l'Efecte Matrix (cerca de plantilles ISO prèvies abans de generar documents).
4. **Context Tècnic Actualitzat:** Sempre s'ha d'assumir l'entorn de producció vigent (React, Pedra Seca i Model B), distingint dades compartides online-first de les excepcions locals documentades.

### 3. WORKFLOW D'EXECUCIÓ I MANTENIMENT ISO (Per a la IA)
1. **Planificació i Cerca Matrix:** Abans d'executar, verifica si hi ha plantilles ISO existents.
2. **Validació:** Verificar si els inputs de l'usuari són suficients (Trellat check).
3. **Execució:** Realitzar la tasca aplicant les regles de la marca (Pedra Seca).
4. **Manteniment ISO (CRÍTIC):** Les plantilles s'han d'actualitzar al 100% quan l'arquitectura canvia. Si modifiques una decisió base (com passar d'offline a online), és la teua obligació d'actualitzar les plantilles ISO (`_wiki_de_poble/03_actuar/plantilles/`) per reflectir la nova realitat i incrementar-ne la versió (`version_semver`).

---
_Fent poble amb [[el_projecte|Sóc de Poble]]! © 2026_
---

**Ancoratge de Seguretat:** [[00_index]]




## Verificació

[pendent]

## Vincles

- [[00_index]]
- [[taxonomia_documental]]
