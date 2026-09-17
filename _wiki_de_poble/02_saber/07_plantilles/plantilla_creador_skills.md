---
type: plantilla
status: canonic
description: Plantilla ISO per dissenyar skills amb gallets, abast, regles, proves i eixida verificable.
tags:
  - maquina
  - skills
---
# 📜 PLANTILLA ISO: Creador de Skills Antigravity (La Fàbrica)
**Versió ISO:** 2.0.0 (Actualitzada a l'era 100% Online Sollutia)
**Categoria:** Plantilla
**Data Modificació:** 2026-09-15

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangular Negre (Per a Light Mode):** `/assets/system/ui/logo-socdepoble-rect-negre.svg`
- **Rectangular Estàndard:** `/assets/system/ui/logo-socdepoble-rect.svg`

## MISSIÓ DEL PROTOCOL
Estandarditzar com es construeixen i es documenten les noves "Skills" (protocols automatitzats). Totes les skills han de reflectir la realitat actual del projecte: **Arquitectura 100% Online, modularitat, i integració amb Sollutia (Supabase)**. Queda prohibit programar skills basades en supòsits històrics de PWA Offline o iPads A10 aïllats. Les plantilles ISO són l'estàndard viu de l'aplicació, i han d'evolucionar.

## 1. ESTRUCTURA DE FITXERS
Tota Skill del Mas ha de viure a la carpeta corresponent en `.agents/skills/<nom_skill>/`.
- `SKILL.md`: La lògica i instruccions mestres (Aquest nom d'arxiu és innegociable perquè el motor d'Antigravity el llija automàticament).

## 2. FORMAT DEL SKILL.md (YAML Frontmatter i Cos)
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
version: "2.0.0"
---
```

Després del YAML, l'estructura de la skill ha d'incloure:
1. **Propòsit de la Skill:** Què fa i quan s'ha d'activar.
2. **Frontera de Confiança:** Quines accions destructives té prohibides.
3. **Instruccions d'Execució:** Passos clars, prioritzant l'Efecte Matrix (cerca de plantilles ISO prèvies abans de generar documents).
4. **Context Tècnic Actualitzat:** Sempre s'ha d'assumir l'entorn de producció vigent (100% Online, React, Pedra Seca).

## 3. WORKFLOW D'EXECUCIÓ I MANTENIMENT ISO (Per a la IA)
1. **Planificació i Cerca Matrix:** Abans d'executar, verifica si hi ha plantilles ISO existents.
2. **Validació:** Verificar si els inputs de l'usuari són suficients (Trellat check).
3. **Execució:** Realitzar la tasca aplicant les regles de la marca (Pedra Seca).
4. **Manteniment ISO (CRÍTIC):** Les plantilles s'han d'actualitzar al 100% quan l'arquitectura canvia. Si modifiques una decisió base (com passar d'offline a online), és la teua obligació d'actualitzar les plantilles ISO (`07_plantilles/`) per reflectir la nova realitat i incrementar-ne la versió (`version_semver`).

---
_Fent poble amb [[el_projecte|Sóc de Poble]]! © 2026_
---

**Ancoratge de Seguretat:** [[00_index]]
