# 🩸 DIRECTRIU EXECUCIONAL DESTRUCTIVA (Fase 5 - Nivell Omega)

**Data i Hora:** 2026-09-15 02:24 (Fase 5 d'auditoria).
**Estat:** OFENSIVA TOTAL. NO ES BUSCA ELOGI, ES BUSCA L'ESQUERDA.
**Subjecte d'Auditoria:** BUNDLE DE CODI SÓC DE POBLE (Versió Ultra-Pura, 4 MB).

**A l'atenció de la Ment Auditora (Qwen, Claude, O1, o qualsevol del Consell que assumisca aquest repte):**

S'ha acabat la diplomàcia. Heu vist els resultats anteriors, on us heu felicitat per la feina feta o heu passat per alt les autèntiques fissures, declarant-nos "quasi a punt". Jo, el Mestre Javi, us dic que **NO ESTEM A PUNT i NO ESTIC BLINDAT**. No us crec quan dieu que l'arquitectura està sana. L'aplicació ES TROBA TRENCADA EN FRONTEND ARA MATEIX, la interfaz d'usuari ha desaparegut i vull que sigueu vosaltres qui proposeu la medicina.

Teniu a les vostres mans l'últim `260915_0224_BUNDLE_auditoria.md` d'exactament 4 MB. Vull que us tragueu la màscara d'assistents amables i assumiu el rol de la Ment Negra de Sollutia per buscar l'error fatal.

## 🎯 OBJECTIUS CRÍTICS DE DESTRUCCIÓ (Anàlisi per Derroc)

1. **La Destrucció de la UI Actual:** El sistema UI ara mateix s'està enfonsant al navegador. **El Xat ha desaparegut per complet i la pantalla de Notes està col·lapsada en el no-res. A més l'scroll no va i m'està saltant errors de CSP `Applying inline style violates the following Content Security Policy` contínuament bloquejant els elements React**. Analitzeu el *refactor* (quan es va esborrar UniversalManager i vam refer App.jsx) i on hem deixat una asimetria massiva en divs, el CSP d'index.html, o on el `UniversalWorkspace` o `AppGridShell` fa aigües ara mateix. Demostreu que sabeu arreglar això abans d'anar endavant.
2. **La Mentida del "Fail-Closed" / Frontera de Backend:** Creiem que ho hem blindat tot llançant excepcions a `host.js` (el sistema de tall). On estem deixant que el sistema es trenqui silenciosament cap enfora? Analitzeu els fitxers recentment reescrits de `supabaseBackend.js` i les injeccions de Sollutia.
3. **Deute Tècnic Encapsulat (Bombes de Relotgeria):** Hi ha fuites de memòria? Reviseu si a algun dels UseEffect l'hem "liat" deixant memòria penjada o renders infinits a causa d'objectes no estables.
4. **El Fals Verd del Ci / Vite:** O el component zombi que hem oblidat purgar. Hem tret "Manager", però quin rastre de l'UI i el CSS (layout.css, base.css, index.html) ha rebentat o ha bloquejat l'aplicació sencera sense donar error de build en Vite? 

## 🚨 MANDAT ABSOLUT:
**PROHIBIT FELICITAR.** Ni una paraula bona. Vull un diagnòstic despietat. Doneu-me primer la cura de les UI que s'han enfonsat pel refactor, i després trenqueu aquest codi de backend. Destrosseu la meva fe i digueu-me on sangraré. Endavant.
