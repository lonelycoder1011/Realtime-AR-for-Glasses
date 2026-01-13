'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { FaceDetectionState, FaceDetectionConfig } from '@/types/face-detection';

interface FaceDetectionContextType {
  state: FaceDetectionState;
  startDetection: (videoElement: HTMLVideoElement) => Promise<void>;
  stopDetection: () => void;
  updateConfig: (config: Partial<FaceDetectionConfig>) => void;
  isReady: boolean;
}

const FaceDetectionContext = createContext<FaceDetectionContextType | undefined>(undefined);

interface FaceDetectionProviderProps {
  children: ReactNode;
  config?: Partial<FaceDetectionConfig>;
}

export const FaceDetectionProvider: React.FC<FaceDetectionProviderProps> = ({ 
  children, 
  config 
}) => {
  const faceDetection = useFaceDetection(config);

  return (
    <FaceDetectionContext.Provider value={faceDetection}>
      {children}
    </FaceDetectionContext.Provider>
  );
};

export const useFaceDetectionContext = (): FaceDetectionContextType => {
  const context = useContext(FaceDetectionContext);
  if (context === undefined) {
    throw new Error('useFaceDetectionContext must be used within a FaceDetectionProvider');
  }
  return context;
};
