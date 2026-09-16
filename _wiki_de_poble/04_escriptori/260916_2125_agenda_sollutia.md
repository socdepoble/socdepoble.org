# Agenda Tècnica — Reunió amb Sollutia

Aquest document recull els punts clau que s'han de tractar amb l'equip de Sollutia per resoldre dependències i friccions de la integració (Model B).

## 1. Autoritat d'Autenticació (OAuth)
Hem de determinar qui és l'emissor final del token d'autenticació i qui manté el sistema de referència dels usuaris:
- Si Sollutia vol interceptar l'inici de sessió, com i on es produeix l'intercanvi de dades entre el seu back-end i l'SdP-Element (web component).
- Possibilitats de gestió unificada d'identitat (SSO) perquè l'usuari no s'haja de fer un compte a Sóc de Poble separat del sistema de l'ajuntament, i com afecten les restriccions CSP i CORS de Supabase a esta integració.

## 2. Segrest del SEO i SSR
Actualment, Sóc de Poble està pensat com a una Single Page Application (SPA), mentre que Sollutia allotjarà el web component a les seues pròpies pàgines (com una etiqueta d'HTML embeddada).
- Com tractaran els cercadors el SEO del contingut que es pinta dinàmicament a l'embed? Sóc de Poble ara mateix no empra Server Side Rendering (SSR).
- Ha de Sollutia pre-renderitzar l'etiqueta o extraure el JSON de `schema.org` / `og:tags` abans d'enviar l'HTML al client?

## 3. Gestió del Port i Integració CSP
Volem confirmar la política de Content-Security-Policy final a producció.
- L'SdP-Element requereix permisos per establir WebSockets (wss://) amb el back-end de Supabase i carregar mapes.
- Hi ha cap requeriment o llista blanca al seu costat que necessitem saber?

## 4. Normalització i API Proxy (Frontissa)
Ja tenim la Frontissa configurada al costat de Sóc de Poble per rebre les dades (actua de proxy o mock amb els `tractor-adaptadors.mjs`). 
- Necessitem verificar l'estructura exacta de JSON que escopirà Sollutia a producció per a mercat i esdeveniments, per assegurar que els adaptadors no fallaran.
