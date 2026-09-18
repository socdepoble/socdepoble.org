# 🏹 Informe del Caçador: Metodologies "SaaS Factory" i Avantguarda IA

Aquest és el primer informe generat sota la nova directiva de l'Explorador de Skills. He analitzat l'ecosistema de repositoris tipus "SaaS Factory", els corrents de desenvolupament "Agent-First" amb Claude Code i Supabase, i les millors pràctiques globals per estructurar la ment d'un sistema IA.

## 1. El Concepte "SaaS Factory"

Més que un sol repositori, "SaaS Factory" és un **moviment metodològic** que s'ha popularitzat a GitHub. La premissa és construir aplicacions completes (Front i Back) a una velocitat extrema delegant el gruix de la feina a agents autònoms.

L'arquitectura base d'aquests repositoris sol ser:
- **Agents:** Claude Code CLI actuant directament sobre l'arrel del projecte.
- **Backend/DB:** Supabase, ja que permet governança de dades i autenticació que Claude pot entendre fàcilment a través de MCP (Model Context Protocol).
- **Nucli d'Instruccions:** Fitxers `CLAUDE.md` i `.cursorrules` extremadament esmolats.

## 2. Lliçons d'Arquitectura i "Spec-Driven Development"

La gent no deixa que l'IA improvise. He observat patrons que podem adoptar immediatament:

> [!TIP]
> **Menys bastides, més Model:** Les instruccions mestres (`CLAUDE.md`) es mantenen per davall de les 300 línies. Tot el que sobra es mou a subcarpetes (`@docs/architecture.md`). L'IA pateix "indigestió de context" si el prompt base és massa llarg. 

- **Spec-Driven (Guiat per PRD):** Abans de picar codi, obliguen a l'IA a crear un **PRD** (Product Requirements Document). L'IA no fa res que no estiga en el PRD. Això elimina les "al·lucinacions de funcionalitat".
- **Slices Verticals:** En comptes de separar "components", "pages" i "api" d'un mateix bloc, organitzen el codi per "Skills" o "Features" complertes. Si esborres la carpeta "Usuaris", s'esborra tot el front i back relacionat.

## 3. Sistemes de Disseny (L'Evolució de Pedra Seca)

El nostre sistema **Pedra Seca** ja va per bon camí, però l'avantguarda ha resolt el problema de com ensenyar-li disseny a una IA:

> [!WARNING]
> Mai s'ha de bolcar tots els colors HEX o variables CSS al prompt base del sistema. Això atordeix l'agent.

- **El patró `DESIGN.md`:** Els repositoris professionals dediquen un fitxer separat exclusiu per al disseny. Al prompt principal només diuen: *"Useu @DESIGN.md com a font de veritat visual"*.
- **Racionalitat vs Tokens:** En eixe fitxer de disseny, no s'enumeren els tokens, sinó **el raonament**. Expliquen *per què* s'utilitza una paleta, *quin sentiment* ha de donar un component, i quines accions visuals estan "prohibides" (ex: "No uses ombres complexes, usa vores negres i dures").

## 4. Adaptació a la nostra Ecosfera (Sóc de Poble i Sollutia)

Com ens apliquem tot això per ser millors sense perdre el nostre *Trellat*?

1. **Aprimament de les Actes/Prompts:** Actualment els nostres Prompts base són gegantins. Hauríem de tindre un `00_BIOS` o `CLAUDE.md` molt més curtet i fer que la IA invoque només les skills específiques quan les necessite.
2. **Creació d'un `DESIGN.md` (o reforç del nostre `pedra_seca.md`):** Convertir les guies visuals de Pedra Seca en un manual filosòfic per a l'IA, on li expliquem *quan* crear un camp nou i *com* ha de respirar la UI, en lloc de llistes tècniques asèptiques.
3. **El Repositori com a Contracte:** Incorporar la regla d'or dels "SaaS Factories": la IA mai tanca un pas sense escriure abans un `.md` temporal del que va a fer (l'equivalent al nostre mode "Plan" d'Antigravity), però amb una llista d'esgotament de tasques.

### Pròxims Passos Suggereits
- Revisar i reestructurar l'arrel de les nostres regles (la carpeta `.agents`) per seguir l'arquitectura d'alta definició observada.
- Instaurar el patró de *Vertical Slices* quan comencem a construir aplicacions sobre Supabase/Sollutia, tractant cada funcionalitat com un mòdul 100% autònom.
