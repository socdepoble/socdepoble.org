---
type: ordre
status: canonic
description: Decisions arquitectòniques i de disseny de la IAIA MarIA (Orquestradora) per a Claude.
tags:
  - decisions
  - ux
  - supabase
---

# Decisions de Disseny i Arquitectura (IAIA MarIA)

Atesa la delegació d'autoritat del Mestre, la IAIA MarIA dictamina les següents ordres per a les correccions pendents i l'Onada 3:

## 1. Experiència d'Usuari (UX) i Disseny
1. **Bombolles del xat:** **S'HAN DE CONSERVAR.** La desaparició de l'historial del xat cada hora en renovar-se la sessió destrossa l'experiència. L'estat local ha de mantenir la continuïtat de la conversa malgrat la renovació del token (JWT).
2. **El Mur «Carregant»:** **RENOVACIÓ SILENCIOSA.** La sessió s'ha de renovar en segon pla (background) sense forçar un re-render complet del Mur que provoque la pantalla de «Carregant».
3. **Imatges externes al Mur:** **PROHIBIDES (PRIVACITAT).** Per a evitar el rastreig d'IPs dels usuaris per part de tercers, només es permetran imatges allotjades localment o pujades al nostre servidor. Les imatges externes s'han de bloquejar o forçar la seua pujada.
4. **Tall de 50 publicacions:** **CARREGA PROGRESSIVA (LOAD MORE).** Un límit inicial de 50 és sa, però s'ha d'implementar un botó de «Carregar-ne més» o *infinite scroll* per a no deixar l'usuari a mitges.
5. **Paquet WordPress de 4,4 MB:** **CODE SPLITTING OBLIGATORI.** Aquest és el causant principal del temps de càrrega nefast (FCP de 11.5s a l'auditoria). Cal aplicar *Lazy Loading* (`React.lazy` o importacions dinàmiques) a les peces pesades i modals que no siguen crítiques per al primer renderitzat.

## 2. Seguretat i Error 403 (Storage)
L'error 403 en pujar imatges prové d'una desconnexió entre la ruta on el client intenta escriure i les polítiques RLS (`storage.objects`) configurades a Supabase. Com que no tenim accés remot als logs ara mateix, **l'ordre és la següent:**
- Verifica el payload de la petició de pujada al client. La ruta de l'arxiu (ex: `perfils/{user_id}/foto.jpg`) ha de casar EXACTAMENT amb la condició de la regla d'INSERT de l'Storage (normalment `bucket_id = 'imatges' AND (storage.foldername(name))[1] = auth.uid()::text`).
- No apliques cap migració de RLS fins que el client construïsca la ruta correctament segons la regla de l'Storage que ja existeix.

**Claude, incorpora aquestes decisions a l'Onada 3 i al workflow vigent i procedeix a executar-les.**
