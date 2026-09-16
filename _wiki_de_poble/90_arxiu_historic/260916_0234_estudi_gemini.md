---
tipus: document
estat: esborrany
description: Estudi Gemini — Auditoria Extrema v2 (Bundle 1.4MB)
---
# Estudi Gemini — Auditoria Extrema v2 (Bundle 1.4MB)
Data: 2026-09-16
Nota: **3.5 / 10**

## 1. Resultats Globals
Gemini ha fet una auditoria espectacular sobre el bundle de 1.4MB. A diferència d'altres IAs, Gemini ha entrecreuat l'esquema SQL amb el codi React i ha trobat **defectes catastròfics reals** (tant de seguretat com d'arquitectura) que Grok i Perplexity van passar per alt. La nota de 3.5 és dura, però completament justificada: l'aplicació actual fallaria en producció per a usuaris anònims, els xats estan trencats i hi ha fuites de sessió.

## 2. Punts Crítics (P0 i P1 - Deures Urgents)

1. **Pantalla de la Mort per a Anònims (RLS)**: La portada intenta llegir `public.notes`. Però la migració de notes revoca els permisos a `anon`. Resultat: l'usuari rep un 401, i l'aplicació mostra una pantalla d'error fatal per a tots els visitants no loguejats.
2. **Sintaxi SQL trencada a Perfils**: Hi ha polítiques de seguretat a Supabase que intenten usar `membres_del_poble` com a taula (quan és una funció) i referencien columnes que no existeixen (`town_id` en comptes de `town_name`). Les lectures de perfils petaran.
3. **Bypass RLS d'Organitzacions**: PostgreSQL avalua les regles `FOR INSERT` amb un `OR`. Tenim una regla antiga que deia que només certs membres podien crear organitzacions, però n'hem afegit una altra (`orgs_insert_auth`) massa permissiva. Qualsevol pot crear organitzacions en pobles d'altres saltant-se les regles velles!
4. **Fuita de Sessions (Singleton)**: El client de Supabase a `config.js` és un Singleton (`let supabaseClient = null`). Si fem logout, no el reinicialitzem. El pròxim usuari que use eixe mateix navegador reutilitzarà les capçaleres velles!
5. **Trencament Chat & Storage**: L'autenticació es fa manualment via `fetch` i `sessionStorage`, però `xat.js` usa `supabase.auth.getUser()`. Com el SDK de Supabase no sap res de la sessió manual, el xat i la pujada d'arxius donaran "Usuari no identificat".
6. **Split-Brain amb Sollutia**: `host.js` llança error si l'adaptador no compleix els 32 mètodes del contracte. Però a Sollutia només hi ha `llig` i `escriu`. La integració petarà només arrencar.
7. **Desajust DTO al Xat**: El backend retorna `usuari_id` i `fil_id`, però el component React busca `membre.id` i `membre.filId`. Donarà `undefined` i serà impossible obrir un xat.
8. **Agents invisibles**: La regla RLS oculta els `agents` a qui no siga superadmin, deixant la llista de personatges buida per a la gent del poble.
9. **XSS via JSON-LD**: Hem d'escapar els `</script>` del SEO per evitar injeccions de scripts en les metadades.
10. **Camps Perduts al Perfil**: Estem guardant `biography` quan la base de dades es diu `bio`. Les biografies no s'estan guardant.

## 3. Conclusió
Aquest és l'informe d'auditoria més valuós que hem rebut. Les troballes són 100% reals, verificables i bloquejadores. Cal paralitzar qualsevol nou desenvolupament i dedicar un sprint de refactorització massiva (Estat de Tancament) per resoldre tots aquests punts abans d'integrar-nos amb Sollutia.
