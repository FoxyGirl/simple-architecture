import { useCallback, useRef, useState } from 'react';

import type { SearchChange, SearchControls, SearchSnapshot } from './types';

import { STATUS } from './constants';

export const useHomePage = () => {
  const [snapshot, setSnapshot] = useState<SearchSnapshot>({
    status: STATUS.IDLE,
    data: [],
    queryEcho: '',
  });

  const controlsRef = useRef<SearchControls | null>(null);

  const handleSearchChange = useCallback((change: SearchChange) => {
    setSnapshot((prevSnapshot) => ({ ...prevSnapshot, ...change }));
  }, []);

  const registerControls = useCallback((controls: SearchControls | null) => {
    controlsRef.current = controls;
  }, []);

  const retry = () => {
    controlsRef.current?.retry();
  };

  const clearSearch = () => {
    controlsRef.current?.clearSearch();
  };

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
