export const RECURSOS = {
  perfil: {
    traductor: (payload) => {
      if (!payload) throw new Error("Manca payload");
      const ident = payload.id || payload.uuid;
      const nom = payload.display_name || payload.name;
      if (typeof ident !== 'string') throw new Error("Manca id o uuid (ha de ser string)");
      if (typeof payload.email !== 'string') throw new Error("Manca email (ha de ser string)");
      if (typeof nom !== 'string') throw new Error("Manca display_name o name (ha de ser string)");
      return { _sollutia: true, ...payload, id: ident, name: nom, display_name: nom };
    }
  }
};
