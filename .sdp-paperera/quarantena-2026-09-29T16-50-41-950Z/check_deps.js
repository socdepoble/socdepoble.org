const prevDepsRef = useRef(null);
useEffect(() => {
  if (prevDepsRef.current) {
    const prev = prevDepsRef.current;
    console.error("DEPS CHANGED!", 
      "token:", prev[0] !== token, 
      "tick:", prev[1] !== tick, 
      "config:", prev[2] !== config, 
      "scopeKey:", prev[3] !== scopeKey
    );
  }
  prevDepsRef.current = [token, tick, config, scopeKey];
}, [token, tick, config, scopeKey]);
