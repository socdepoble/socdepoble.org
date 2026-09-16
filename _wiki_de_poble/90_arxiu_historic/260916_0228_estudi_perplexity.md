---
tipus: document
estat: esborrany
description: "Estudi Perplexity — Auditoria Extrema v2 (Mode: Investigació Profunda)"
---
# Estudi Perplexity — Auditoria Extrema v2 (Mode: Investigació Profunda)
Data: 2026-09-16
Nota: **7.5 / 10**

## 1. Resultats Globals
L'informe de Perplexity (generat amb el mode d'agents "Investigació Profunda") és **excel·lent i totalment verídic**. Ha demostrat una capacitat lectora del codi superior a altres IAs, identificant patrons arquitectònics complexos com el *rate limiting atòmic a la base de dades* (`pg_advisory_xact_lock`) i l'estratègia de segellat.

Aquesta eina es consolida com un auditor Tier 1 per a Sóc de Poble.

## 2. Punts d'Atenció (Deures Reals)

A diferència de Vibe, Perplexity ens ha donat dos vectors d'atac **demostrables i precisos**:

1. **CSP Permissiu (T1)**: Ens alerta que a `index.html` tenim la política de seguretat de continguts (CSP) massa oberta (`'unsafe-inline'` i comodins `https:`). Això significa que si hi haguera un XSS a l'amfitrió, el navegador no bloquejaria la fuita de dades cap a servidors de tercers. És un "Quick Win" fàcil d'arreglar i augmentarà molt la nostra resiliència.
2. **Segrest de l'Atribut Supabase-Url (I1)**: Aquesta és una troballa arquitectònica brillant. Com que el Web Component s'alimenta de l'atribut `supabase-url`, si un editor *maliciós* de WordPress aconsegueix modificar l'HTML de la pàgina on estem incrustats, podria canviar eixa URL per la del seu propi servidor fals. En fer-ho, Sóc de Poble li enviaria el JWT de l'usuari a ell! Tot i que la responsabilitat de qui pot editar l'HTML cau en Sollutia, és un vector de risc molt real en entorns multi-tenant o amb permisos mal configurats a WordPress.

## 3. Conclusió
El 7.5 és just i constructiu. Ens obliga a endurir el CSP i a documentar molt bé per a Sollutia que l'accés a l'editor on s'incrusta `<soc-de-poble>` ha de ser limitat a administradors, ja que l'atribut `supabase-url` actua com una frontera de confiança.
