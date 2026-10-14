---
type: skill
status: actiu
description: Directriu arquitectònica i de disseny per clonar la UI/UX de WhatsApp al mil·límetre (Patró Pedra Seca).
name: sdp-clon-whatsapp
tags:
  - disseny
  - tractors
triggers_on:
  - clon de whatsapp
  - com ho fa whatsapp
  - pantalla nova
  - menú d'ajustos
  - bottom sheet
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - src/components/layout/AppGridShell.jsx
contracte.escriu:
  - src/components/layout/AppGridShell.jsx
---
# Llei del Clonatge de WhatsApp (Pedra Seca v2)

La premissa d'interacció principal de Sóc de Poble és aconseguir una corba d'aprenentatge ZERO per a la gent major i els usuaris rurals. Per aconseguir-ho, **l'aplicació ha de ser un clon visual i de comportament de WhatsApp** en tot el que siga tecnològicament possible i coherent amb les nostres dades.

## 1. La Còpia Vil i Descarada (Norma d'Or)
Davant qualsevol dubte sobre com dissenyar una pantalla, un menú d'ajustos, un botó o un flux d'usuari: **CAL MIRAR COM HO FA WHATSAPP I COPIAR-HO AL MIL·LÍMETRE**.
- **Menús d'Ajustos/Control:** Han de tindre el mateix tipus de llistat, divisors fins i icones a l'esquerra.
- **Modals i Bottom Sheets (Fulls inferiors):** Han de reaccionar i tancar-se com els diàlegs de WhatsApp.
- **Barres de navegació:** Igualtat en l'alçada, la posició i el tipus d'iconografia.

## 2. El Flux de Treball (Com implementar noves pantalles)
Sempre que es demane a una IA dissenyar o programar una nova vista (com ara el "Panell de Control" o la "Configuració"):
1. **Requeriment de Captura:** La IA pot i ha de demanar al Mestre una captura de pantalla de la vista equivalent a WhatsApp (si el Mestre no l'ha proporcionada ja).
2. **Abstracció:** La IA disseccionarà la captura (Llista, Ítem amb fletxa `> `, Switch de palanca, etc.).
3. **Mapeig de Conceptes:** Els ítems s'adaptaran al món de Sóc de Poble mantenint el pes visual. Per exemple, l'equivalent d'"Almacenamiento y datos" de WhatsApp es pot mapar a "Dades i memòria local" de la nostra App, conservant el mateix lloc.
4. **Censura Creativa:** La IA TÉ PROHIBIT inventar patrons de disseny web moderns "creatius" (ex. menús d'hamburguesa, estructures complexes, sliders inusuals) que no existisquen a l'univers WhatsApp.

## 3. Zona Prohibida: El Centre d'Ajuda
**ESTÀ PROHIBIT** carregar o fer scraping sencer del centre d'ajuda de WhatsApp (`faq.whatsapp.com`) als contexts de la IA. Les FAQ de WhatsApp contenen manuals sobre com bloquejar spam, canviar de número de telèfon, Meta Business, i xifratge extrem a extrem, que no apliquen a la nostra arquitectura i provocarien un desastre per contaminació de tokens (Context Panic). 

Ens interessa **la UX/UI (la carcassa)**, no la infraestructura tècnica ni les polítiques d'ús de Meta. L'eina de treball han de ser les captures de pantalla del mòbil del Mestre.

## Vincles
- [[00_INDEX_SKILLS]]
