export const RECURSOS = {
  perfil: {
    traductor: (payload) => {
      if (!payload) throw new Error("Manca payload");
      return { _sollutia: true, ...payload };
    }
  }
};
