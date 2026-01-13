'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { CameraContextType } from '@/types/camera';

const CameraContext = createContext<CameraContextType | undefined>(undefined);

interface CameraProviderProps {
  children: ReactNode;
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const cameraHook = useCamera();

  return (
    <CameraContext.Provider value={cameraHook}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraContext = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
};
