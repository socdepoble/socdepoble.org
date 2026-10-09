import { createContext, useContext, useState, useMemo } from 'react';

const ContentContext = createContext({});

export function ContentProvider({ children, initialConfig = {} }) {
  const [config, setConfig] = useState(initialConfig);

  const updateConfig = (newConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const value = useMemo(() => ({
    config,
    updateConfig,
  }), [config]);

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}

