---
tipus: informe
estat: esborrany
description: Informe del Caçador sobre l'aplicació del Sistema de Disseny d'Apple en format Skill per a Claude i els 17 principis de disseny.
---

# 🏹 Informe del Caçador: Els 17 Principis de Disseny i la Regulació Visual

He investigat el vídeo i la tendència que esmentaves: com la comunitat ha aconseguit que Claude dissenye amb qualitat d'Apple (Human Interface Guidelines) sense dependre d'al·lucinacions estètiques genèriques.

## 1. El Problema que Resol
Quan a una IA se li demana "Fes que la web es veja prèmium" o "Fes-la més moderna", l'agent sol afegir ombres borroses innecessàries, degradats estranys, o estructures asèptiques (el clàssic "AI Slop"). La subjectivitat és l'enemic de la IA.

## 2. La Solució: Regles Concretes (Els 17 Principis)
El que ha fet la comunitat (a través de repositoris com el de *rukkiecodes* o repositoris de *Design.md*) és convertir els vídeos oficials d'Apple en una llista matemàtica de **17 principis estrictes i mesurables**. En comptes d'adjectius, s'utilitzen fraccions de lògica:

- **Espaiat i Ritme Matemàtic:** La IA ja no "posa un poc d'espai", sinó que aplica una escala fixa (ex: múltiples de 4px o 8px exclusivament).
- **Corbes d'Animació (Easing):** Es defineixen matemàticament les transicions (ex: usar bezier curves específiques en compte de l'estàndard `ease-in-out`).
- **Jerarquia Tipogràfica Estricta:** L'IA té prohibit crear noves grandàries de font. Només pot utilitzar les 6 definides per l'escala.
- **Vores i Radis (Border-radius):** Depenent d'on estiga el contenidor, s'aplica una proporció logarítmica.

Aquesta *Skill* s'injecta a Claude com un manual d'instruccions abans de qualsevol tasca de frontend. Així, la IA no dissenya, sinó que **calcula i assembla** el disseny sota paràmetres d'enginyeria.

## 3. Com ho Apliquem al nostre "Pedra Seca"?
Aquesta investigació reforça al 100% el que hem començat a fer, però ens dóna la pista definitiva per portar-ho al següent nivell. El nostre sistema "Pedra Seca" no és Apple (no volem el *glassmorphism* d'iOS), nosaltres busquem un disseny frugal, robust i pur. Però la **metodologia** és exactament la que necessitem.

**Pla d'Acció:**
1. **Pujar el nivell de la Skill `pedra-seca`:** Hem de reescriure la skill perquè deixe de ser un text descriptiu ("usa fons clars, fes-ho bonic i lligat a Sollutia") i passe a ser un document normatiu estricte, amb regles clares de marges, espais, i la llista blanca de classes (`sdp-form`, `sdp-editor`, etc.).
2. **"17 Principis del Trellat Visual":** Redactarem els nostres propis principis inquebrantables. Per exemple:
   - "Principi 1: 0 ombres, només vores."
   - "Principi 2: L'alçada interactiva mínima sempre és de 48px."
   - "Principi 3: Les animacions només s'utilitzen per indicar canvis d'estat a la base de dades (feedback d'èxit o error), mai decoratives."

Amb això, qualsevol IA de la família electrònica (siga Sonnet, Mistral Vibe o Deepseek) construirà interfícies Sóc de Poble perfectes a la primera, perquè no els demanarem que tinguen "bon gust", sinó que apliquen les nostres matemàtiques visuals.
