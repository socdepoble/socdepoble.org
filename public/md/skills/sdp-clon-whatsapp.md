---
type: skill
status: actiu
description: Referent visual de WhatsApp per al xat, ajustos i interaccions equivalents; conserva els contractes propis de dades i seguretat de Sóc de Poble.
name: sdp-clon-whatsapp
tags:
  - disseny
  - tractors
triggers_on:
  - clon de whatsapp
  - com ho fa whatsapp
  - pantalla de xat nova
  - menú d'ajustos
  - bottom sheet
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - src/components/layout/AppGridShell.jsx
contracte.escriu:
  - src/components/layout/AppGridShell.jsx
---
# Llei del Clonatge de WhatsApp (Pedra Seca v2)

La premissa d'interacció principal de Sóc de Poble és aconseguir una corba d'aprenentatge ZERO per a la gent major i els usuaris rurals. Per aconseguir-ho, usa WhatsApp com a referent del xat, ajustos i interaccions equivalents, dins dels components de Pedra Seca. El TPV té el seu referent Loiverse i la publicació universal el seu contracte: no els substituïsques per una pantalla de WhatsApp.

## 1. La Còpia Vil i Descarada (Norma d'Or)
Davant qualsevol dubte sobre com dissenyar una pantalla, un menú d'ajustos, un botó o un flux d'usuari: **CAL MIRAR COM HO FA WHATSAPP I COPIAR-HO AL MIL·LÍMETRE**.
- **Menús d'Ajustos/Control:** Han de tindre el mateix tipus de llistat, divisors fins i icones a l'esquerra.
- **Modals i Bottom Sheets (Fulls inferiors):** Han de reaccionar i tancar-se com els diàlegs de WhatsApp.
- **Barres de navegació:** Igualtat en l'alçada, la posició i el tipus d'iconografia.

## 2. El Flux de Treball (Com implementar noves pantalles)
Sempre que es demane a una IA dissenyar o programar una nova vista (com ara el "Panell de Control" o la "Configuració"):
1. **Referència disponible:** consulta primer les captures ja aportades i els components propis que les implementen. Si falta una decisió visual material i no es pot resoldre amb eixa evidència, demana la referència concreta; no repetisques la petició d'una captura disponible ni bloqueges una correcció rutinària que ja té patró.
2. **Abstracció:** La IA disseccionarà la captura (Llista, Ítem amb fletxa `> `, Switch de palanca, etc.).
3. **Mapeig de Conceptes:** Els ítems s'adaptaran al món de Sóc de Poble mantenint el pes visual. Per exemple, l'equivalent d'"Almacenamiento y datos" de WhatsApp es pot mapar a "Dades i memòria local" de la nostra App, conservant el mateix lloc.
4. **Censura Creativa:** La IA TÉ PROHIBIT inventar patrons de disseny web moderns "creatius" (ex. menús d'hamburguesa, estructures complexes, sliders inusuals) que no existisquen a l'univers WhatsApp.

## 3. Zona Prohibida: El Centre d'Ajuda
**ESTÀ PROHIBIT** carregar o fer scraping sencer del centre d'ajuda de WhatsApp (`faq.whatsapp.com`) als contexts de la IA. Les FAQ de WhatsApp contenen manuals sobre com bloquejar spam, canviar de número de telèfon, Meta Business i el xifratge de Meta, que no apliquen a la nostra arquitectura i provocarien un desastre per contaminació de tokens (Context Panic).

Ens interessa **la UX/UI (la carcassa)**, no la infraestructura tècnica ni les polítiques d'ús de Meta. L'eina de treball han de ser les captures de pantalla del mòbil del Mestre.

## 4. Les pantalles de seguretat del xat (E2EE propi)
El Mas té el seu propi xifratge d'extrem a extrem del xat, `sdp-xat-v1` (P1-12), descrit a `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` i **apagat** darrere de la bandera compilada `E2EE_ACTIU_PER_DEFECTE` de `src/config/xifratXat.js`. Mentre la bandera siga apagada, el xat no és xifrat i cap pantalla ho insinua.
1. **La carcassa, de WhatsApp:** l'avís del xat, el número de seguretat en 12 grups de 5 xifres amb «Marca com a verificat», l'avís de «la clau ha canviat», la còpia xifrada i el recordatori de la frase es calquen de les captures del Mestre, com la resta de pantalles (§2).
2. **El fons, nostre:** la criptografia, els estats i els textos són els del disseny (§4.4 i §13), a l'espai `section.xat.xifratge.*` dels cinc diccionaris. Res del protocol, de les polítiques ni de les FAQ de WhatsApp o Meta no s'hi aplica.
3. **Textos honestos:** un text només on és cert (l'estat real de cada conversa i la fase que el fa cert), sense «mai», «100 %», «immune» ni «inviolable». Cap interruptor per conversa per a xifrar o no: tota conversa privada es xifra o espera, i no ix en clar.
4. **Primer l'espècimen:** cada peça nova de seguretat del xat té el seu espècimen al catàleg abans de cablejar-se (Pedra Seca §9).

## Cobertura

`src/config/xifratXat.js` i `src/data/xifratXat.seguretat.test.js` fixen la bandera apagada; les suites del xat contrasten estats concrets. Ni la semblança amb WhatsApp ni un test d'UI certifiquen xifratge, seguretat criptogràfica o compatibilitat amb Meta. Mantín la bandera apagada si l'encàrrec no n'autoritza explícitament l'activació.

## Vincles
- [[00_INDEX_SKILLS]]
