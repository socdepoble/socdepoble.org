/* ENX-13 (261006) · Cada traductor torna un DTO tancat i congelat: només els
   camps que nomena, mai el JSON cru de Sollutia. Un camp que Sollutia afija
   demà no arriba a la UI fins que algú l'afig ací explícitament. */
export const RECURSOS = {
  perfil: {
    traductor: (payload) => {
      if (!payload || typeof payload !== 'object') throw new Error("Manca payload");
      const ident = payload.id || payload.uuid;
      const nom = payload.display_name || payload.name;
      if (typeof ident !== 'string') throw new Error("Manca id o uuid (ha de ser string)");
      if (typeof payload.email !== 'string') throw new Error("Manca email (ha de ser string)");
      if (typeof nom !== 'string') throw new Error("Manca display_name o name (ha de ser string)");
      return Object.freeze({ id: ident, email: payload.email, name: nom, display_name: nom });
    }
  }
};
