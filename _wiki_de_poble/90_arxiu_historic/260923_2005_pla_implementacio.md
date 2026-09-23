# Pla d'Execució (Fase de Desenvolupament)

Després d'analitzar les auditories de Claude i Codex, i rebre les directrius executives del Mestre, establim el següent pla d'acció per començar a picar codi. Com a mesura de seguretat contra "fantasmes" i per garantir un codi auditat des del primer segon, la implementació recaurà sobre Claude i Codex, amb la IAIA MarIA coordinant-ne l'entrega.

## Objectius de la Sessió
1. **Fortificació i Brain:** Tancar les fissures de seguretat als hooks.
2. **Connexió amb Sollutia:** Obrir la passarel·la al backend real.
3. **Usuari Registrat (Onboarding):** Crear el flux per poder registrar-se de debò.
4. **Workspace funcional:** Garantir que el bloc de notes funciona perquè puguem veure l'espai de treball de Sóc de Poble (amb les notes del Mac Mini).

---

## Repartiment de Tasques

### 1. Claude (Arquitectura Frontend i Flux d'Usuaris)
El Mestre ha pres decisions clares sobre la UI i el model de dades:
- **Color Blau Canònic:** Es manté el blau `#0984E3` malgrat l'avís de contrast, pel seu valor en la paleta de complementaris (taronja).
- **Control CSS (Roda Dentada):** Claude ha de construir un Panell de Control CSS bàsic (la roda dentada) accessible per a superadministradors, que permeti canviar el color principal i que la resta del sistema (complementaris, degradats, verds per a Sóc de Poble) s'adapti automàticament.
- **Resolució de la Barra Taronja:** 
  - Revertir el pedaç de `position: static` a `utilities.css`.
  - Corregir l'`if (!userId)` a `NotesDataContext.jsx:158` perquè el mode `seed` carregui correctament.
- **Onboarding (Alta d'Usuaris):** En lloc d'un script cec, Claude ha de desenvolupar la interfície bàsica connectada a Sollutia/Supabase per a:
  1. Registrar-se (Login/Sign up).
  2. Crear un perfil bàsic d'usuari (Javi Llinares).
  3. Crear un perfil d'empresa/projecte (Sóc de Poble).

### 2. Codex (Fortificació i Seguretat)
- **Implementació de Solucions:** Escriure el codi per tapar les 9 fissures detectades en l'auditoria.
- **Validació de Shell:** Modificar `hooks-local.mjs` perquè validi correctament les escriptures directes.
- **Rastre d'Origen:** Actualitzar `segell-auto.mjs` per evitar que errors en cadena d'altres IAs quedin ressegellats i amagats sota un "fals verd".

---

## Procediment d'Execució
Generarem dos nous prompts (Petorretes d'Implementació) adreçats a Claude i Codex amb aquestes instruccions exactes. L'execució es farà en paral·lel, i els agents aniran aplicant els canvis al codi base. Un cop acabin, verificarem el tancament amb el LEDGER i el segell verd.

---

## 🎙️ Conversa Asíncrona via Captures (Live Update)

*Anotació automàtica basada en l'escrutini en temps real (Skill `core-automillora`).*

**Mestre -> Claude (Alerta de disseny a la Barra Taronja):**
Claude, hem observat en la teua previsualització que, a la `.bar-orange` (a la dreta, al costat de la data i la bola del món), has afegit un botó de "tres puntets" (tipus *kebab menu*). 
- **Verdicte:** Eixe botó és un invent (al·lucinació de UI). No existix al disseny original ni a les directrius. 
- **Ordre d'execució immediata:** Esborra completament eixe botó de tres puntets de la barra taronja abans de tancar el teu torn. El globus del món (`<Globe>`) i l'etiqueta de la data/hora són correctes i s'han de mantindre. Cap menú addicional allà.

**Mestre -> Claude (Alerta Tècnica sobre Supabase/Docker):**
- **Canvi d'Abast (T3):** Tenim problemes amb el dimoni de Docker al Mac i no podem alçar el backend local de Sollutia ara mateix. Per no bloquejar-te, **descarta l'execució i prova en viu de Supabase**. Construeix únicament la interfície visual (UI) del flux d'Onboarding (pantalles de login, registre de "Javi Llinares" i "Sóc de Poble") deixant els hooks/funcions preparades però sense dependre del test de connexió local per donar la tasca per finalitzada. Fes servir dades *mockejades* si et fa falta per comprovar l'aspecte visual.
