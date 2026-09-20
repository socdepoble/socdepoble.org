---
type: document
status: esborrany
description: Documenta el mètode Pedra Seca per produir una PWA mantenible sense sobreenginyeria.
tags:
  - disseny
  - saber
---
# Llibre Blanc de Producció (El Mètode Pedra Seca)

Aquest document és el monument de la **Segona Oportunitat**. S'escriu per a evitar repetir "els sis mesos de plorar per desesperació" que vàrem passar creant un sistema que treia un 10 a les auditories però que era impossible de mantindre i d'escalar en el món real.

Aquesta és la metodologia estricta per a muntar un "[[el_projecte|Sóc de Poble]]" des de zero sense entropessar amb la sobre-enginyeria casolana.

---

## Fase 1: La Delegació Estructural (El Ciment)

L'error d'arrel és intentar que una IA o un sol humà cree i gestione tota l'arquitectura DevOps, el router, la base de dades i les regles de desplegament. 

**La Regla:** No faces l'arquitectura de base si pots delegar-la.
- Paga o delega en professionals i arquitectes sènior (en el nostre cas, **Sollutia**) perquè instal·len els fonaments.
- Nosaltres rebem un entorn (Vite, React, Tailwind, Supabase) ja tancat, segur, amb autenticació i regles de carpeta clares.
- Construïm a partir d'eixe ciment; no el dissenyem nosaltres en fals.

## Fase 2: El Parasitisme Intel·ligent (El Disseny UI)

L'altre gran pou de desesperació és dibuixar (i programar) components complexos (un *slider*, un *dropdown*, un modal amb animacions) des de zero confiant en *prompts* de la IA.

**La Regla:** No dibuixes la roda. Empra un *Design System* consolidat i modifica'l.
- **A nivell de Figma:** Utilitza una base testada mundialment (ex: *Material 3 Design Kit* de Google). Modifica els *tokens* essencials perquè respiren l'ànima del projecte: la teua tipografia (Noto Sans), els teus colors purs (Taronja `FF7300` / Blau `0984E3`) i la mida *Bancal Mode* (botons grans de 48px). Lleva-li les ombres innecessàries per apropar-ho a la "Pedra Seca".
- **A nivell de Codi:** Utilitza una llibreria *Headless* o totalment accessible (ex: Radix UI). La llibreria ja resol la lògica del teclat, focus, lectors de pantalles i l'estat d'accessibilitat. Tu només li passes per damunt la "mà de pintura" (variables CSS/Tailwind) amb el teu disseny.

## Fase 3: La Contenció de l'IA (L'Eixam Tancat)

Un problema massiu va ser tindre IAs generant arxius per tot arreu, inventant noms de carpetes i redactant literatura abstracta interminable.

**La Regla:** Món tancat per a les Màquines.
- Totes les normes han d'estar injectades al directori arrel del projecte (ex: `.agents/`). L'IA no pot eixir d'aquestes normes (les *Lleis de Pedra Seca*).
- L'IA treballa sempre amb una **Safata d'Entrada** única (ex: `05_Escriptori`). Des d'allí es processa i s'audita abans d'integrar-se en l'arxiu històric.
- Les "Skills" o ferramentes que fa servir l'IA han de tindre un propòsit singular.

## Fase 4: La Llei del Trasplantament i Migració

Quan hem de reescriure o migrar una plataforma vella cap a la nova, no es fa de colp i no s'hereten els vicis visuals del passat.

**La Regla:** El Patró *Strangler Fig*.
1. **Quarantena:** Tot el codi que ve del passat es posa fora de l'arrel de producció perquè no contamine.
2. **Trasplantament:** Extraiem i adaptem únicament la *Lògica* i els *Serveis*.
3. **Reescriptura Visual:** La vista (JSX / CSS) s'esborra i es reconstrueix peça per peça usant els *UniversalComponents* creats en la Fase 2.

## Fase 5: El Tractor Mestre (La Duana Cega)

Les bones intencions no frenen l'entropia; només els processos mecànics ho fan.

**La Regla:** Si el codi trenca el disseny, el codi no es guarda.
- Instal·la *hooks* pre-commit o ĺinters d'AST (El Tractor Mestre) que rebutgen immediatament el codi si detecten invents manuals de l'IA o del desenvolupador.
- Està rigorosament prohibit usar valors *hardcoded* (`FF7300`, `text-[12px]`) dins d'un component UI final. Només s'accepten tokens del *Design System* (`--sp-primary-color`).

---

*Nota Final: Aquest llibre és una declaració d'intencions, escrit just al moment de reprendre la refundació del projecte des de la carpeta `Som de Poble`. Ací queda gravada l'esperança i la mètrica d'èxit de no tornar a "llorar per desesperació".*


**Ancoratge de Seguretat:** [[00_index]]

