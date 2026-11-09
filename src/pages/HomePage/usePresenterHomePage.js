import { useCallback, useRef, useState } from 'react';

export const usePresenterHomePage = () => {
  const [snapshot, setSnapshot] = useState({
    status: 'idle',
    data: [],
    queryEcho: '',
  });

  const controlsRef = useRef(null);

  const handleSearchChange = useCallback((nextSnapshot) => {
    setSnapshot(nextSnapshot);
  }, []);

  const registerControls = useCallback((controls) => {
    controlsRef.current = controls;
  }, []);

  const retry = useCallback(() => {
    controlsRef.current?.retry();
  }, []);

  const clearSearch = useCallback(() => {
    controlsRef.current?.clearSearch();
  }, []);

  return {
    data: snapshot.data,
    queryEcho: snapshot.queryEcho,
    status: snapshot.status,
    retry,
    clearSearch,
    onSearchChange: handleSearchChange,
    registerControls,
  };
};
