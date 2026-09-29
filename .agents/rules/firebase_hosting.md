---
type: rule
description: Regla per a CI/CD amb Firebase Hosting (Canvi d'octubre 2026)
---
# Regla de Desplegament a Firebase Hosting

**Context:** A partir del 15 d'octubre de 2026, Firebase deixa de crear automàticament el lloc web per defecte (Hosting site) en crear un projecte nou. Això fa que els scripts automàtics de CI/CD (com GitHub Actions) fallen amb un error `404 Site Not Found` si intenten fer un `firebase deploy` en un projecte nou que encara no té el lloc creat.

**Regla Estricta per a IAs:**
Si Sóc de Poble s'arriba a desplegar utilitzant Firebase Hosting i una IA ha de crear o modificar un *pipeline* automatitzat (CI/CD) per a nous entorns o projectes, **OBLIGATÒRIAMENT** ha d'incloure l'ordre de creació explícita del lloc web abans del primer `firebase deploy`.

```yaml
# Exemple per a scripts de CI/CD (GitHub Actions, GitLab CI, etc.):
# Abans de fer el deploy, cal assegurar-se que el lloc existeix.
- name: Create Firebase Hosting Site (if new project)
  run: firebase hosting:sites:create <site-id> --project=<project-id> || true

- name: Deploy to Firebase Hosting
  run: firebase deploy --only hosting
```

*Nota:* Això només afecta la creació de *nous* projectes/entorns a Firebase. Si l'allotjament el proveeix Sollutia sense Firebase, aquesta regla queda inactiva, però es manté per precaució arquitectònica.
