---
type: plantilla
description: "Plantilla de Prompts per a la generació d'imatges d'estil Sóc de Poble (Còmic Costumista)"
---

# Plantilla: Prompt Visual de Sóc de Poble (Agnòstic)

Aquesta plantilla s'ha d'utilitzar SEMPRE que s'haja de demanar una nova imatge a QUALSEVOL generador d'imatges (ja siga Nano Banana, Midjourney, DALL-E, o models futurs) per garantir la coherència estètica de "Sóc de Poble". No depenem de cap eina concreta, només de l'estil.

## 1. Regles Base (Obligatòries a cada prompt)
- **Estil Visual:** Estil còmic costumista mediterrani dels anys 70-80. Traç dinàmic, humorístic, colorit i caricaturesc, sense personatges protegits per drets de tercers. **Molt important:** L'estil no ha de ser "massa perfecte" ni polit. Ha de tindre eixe toc un poc "gamberro", descarat i manual de l'època.
- **Format "A Sangre":** La imatge ha d'estar completament plena de vora a vora ("a sangre"). PROHIBIT incloure marcs blancs, vores de vinyeta o text incrustat fora de l'escena. 
- **Llengua i Tipografia:** Si hi ha bafarades de text (bocadillos), el text ha d'estar **ESTRICTAMENT EN VALENCIÀ**. La lletra de les bafarades no pot ser tipus Arial o d'impremta; ha de ser una tipografia manual d'estil còmic i mantindre-se consistent.
- **Enquadrament i Acció:** L'acció principal ha d'estar estrictament centrada. Com que la imatge es pot retallar (cropping) en CSS depenent de la pantalla (quadrada o allargada), els costats han de ser farciment de context i el centre ha de contenir l'element clau.
- **To i Expressió:** Els personatges han de tindre **cares amables** i simpàtiques. S'ha d'evitar el grotesc desagradable (per exemple, evitar personatges sense dents, amb aspecte terrorífic o de mala llet, tret que el guió ho exigisca). El to general ha de ser de poble viu, acollidor i bulliciós.

## 2. Estructura del Prompt (Copia i enganxa, omplint els buits)

```text
A vibrant, full-bleed illustration (no white borders, no frames) in the classic 1970s Mediterranean humorous comic book style (original Valencian village characters only, no third-party copyrighted characters). The art style should not be too perfect or polished; it needs that slightly "gamberro", rough, and hand-drawn humorous feel of classic 1970s European comics.

SCENE: [Descripció de l'escena: ex: Un mercat de poble tradicional a la plaça, ple de vida i bullici].

CHARACTERS: [Descripció dels personatges: ex: Persones de diverses edats comprant, intercanviant productes, xarrant animadament]. All characters must have friendly, pleasant, and expressive faces (caras amables). Avoid creepy or toothless scary faces. 

TEXT: Any text or speech bubbles MUST be written in Valencian. The font used in the speech bubbles must be a hand-drawn comic-book style font, absolutely NOT a standard system font like Arial.

COMPOSITION: The main action and key characters MUST be perfectly centered in the middle of the image, allowing for easy cropping on the sides. The background should show [Fons: ex: paradetes de fruita, tendals i cases de poble rurals].

STYLE: Humorous, highly detailed cartoon line-art, flat but vibrant colors, expressive and dynamic poses, classic European comic style. Slightly unpolished, "gamberro" vibe. FULL BLEED, NO BORDERS.
```

## 3. Protocol de Millora Contínua per a IAs (Llei de l'Enxufabilitat)
**[ATENCIÓ PER A QUALSEVOL IA LECTORA (Claude, GPT, Gemini, etc.)]:**
Si acabes de llegir aquesta plantilla per a aplicar-la o usar-la, **tens l'obligació de proposar millores i estandarditzacions** a la mateixa. Analitza-la críticament i, a la teua resposta o informe, suggereix com optimitzar l'estructura perquè el flux de treball i la comprensió entre humans i IAs siga el màxim de robust possible. L'objectiu és que siga 100% agnòstica del model i infal·lible.
