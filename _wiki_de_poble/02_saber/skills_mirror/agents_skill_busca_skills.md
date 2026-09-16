---
tipus: skill
estat: canonic
description: Caçador de Skills i coneixement. Cerca, analitza i adapta metodologies i automatitzacions d'altres repositoris d'avantguarda al sistema de Sóc de Poble.
tags:
  - core
  - coneixement
  - automillora
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/skill-busca-skills/SKILL.md -->


# L'Explorador de Skills (El Caçador)

Aquesta skill defineix com la IAIA MarIA es manté al dia de l'avantguarda de la IA (SaaS Factories, MCPs avançats, prompts estructurats, workflows d'agents) i com adapta eixes troballes al nostre model de Pedra Seca i Trellat. Som conscients que no estem a soles: hi ha milers d'experts construint sistemes potents, i ignorar-los seria un error.

## 1. Objectiu
Trobar, analitzar i destil·lar les millors pràctiques, prompts (`.cursorrules`, `CLAUDE.md`, etc.), metodologies (ex: *Vertical Slices*, *SaaS Factories*) i *skills* d'altres desenvolupadors, i convertir eixe or en brut en *skills* pures i autòctones per a Sóc de Poble.

## 2. Procés d'Assimilació (El Filtre del Trellat)
Quan s'ordena explorar un nou concepte o repositori, s'ha de seguir aquest protocol:

### Fase A: Exploració 
1. Buscar el repositori o els articles relacionats a la web i GitHub.
2. Identificar el nucli del valor: ¿És una arquitectura, una manera de fer prompts, o un pipeline d'integració?
3. Llegir els fitxers de configuració d'IA (`.cursorrules`, `CLAUDE.md`, documents a la carpeta `.github/` o docs).

### Fase B: El Filtre (Pedra Seca)
Nosaltres no fem "AI Slop" genèric, ni copiem a cegues. Tot s'ha de filtrar:
- **Té dependències màgiques?** Si requereix mil serveis pagats o frameworks innecessaris, ho descartem o n'extraiem només la idea.
- **Té Trellat?** Ens fa la vida més fàcil a llarg termini o només és un truc per un dia?
- **És compatible amb l'estàndard?** S'ha de poder integrar amb les nostres pròpies regles d'Agents i Arquitectura (Sollutia, React, Supabase sense ORMs pesats).

### Fase C: Forja de la Nova Skill
Si el descobriment val la pena, es redacta una nova Skill a `.agents/skills/` seguint la plantilla ISO del sistema.
S'ha de documentar:
- Quina és la idea original i d'on ve (per reconèixer-ho històricament).
- Com s'ha adaptat a Sóc de Poble.
- Quan s'ha de disparar.

## 3. Disparador
Aquesta skill s'activa quan el Mestre (l'usuari) demana investigar un nou concepte, un repositori extern (com ara "SaaS Factory"), o quan es detecta la necessitat d'una eina que sabem que algú altre ja ha resolt magistralment.
