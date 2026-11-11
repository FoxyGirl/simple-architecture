import { useCallback, useRef, useState } from 'react';

import { STATUS } from './constants.js';

export const useHomePage = () => {
  const [snapshot, setSnapshot] = useState({
    status: STATUS.IDLE,
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
