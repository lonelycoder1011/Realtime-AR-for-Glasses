'use client';

import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { useCameraContext } from './CameraProvider';
import { cn } from '@/lib/utils';

interface VideoDisplayProps {
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onLoadedMetadata?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
}

export const VideoDisplay = forwardRef<HTMLVideoElement, VideoDisplayProps>(
  ({ className, autoPlay = true, muted = true, playsInline = true, onLoadedMetadata }, ref) => {
    const { state } = useCameraContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Combine refs
    const combinedRef = (node: HTMLVideoElement | null) => {
      if (videoRef) {
        videoRef.current = node;
      }
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    useEffect(() => {
      const video = videoRef.current;
      if (!video) {
        console.log('VideoDisplay: No video element found');
        return;
      }
      
      console.log('VideoDisplay: Stream state:', { 
        hasStream: !!state.stream, 
        isActive: state.isActive,
        isLoading: state.isLoading,
        error: state.error 
      });
      
      if (state.stream) {
        console.log('VideoDisplay: Setting stream to video element');
        // Only set srcObject if it's different
        if (video.srcObject !== state.stream) {
          video.srcObject = state.stream;
        }
        
        // Handle video ready to play
        const handleCanPlay = () => {
          console.log('VideoDisplay: Video can play, attempting to play');
          video.play()
            .then(() => {
              console.log('VideoDisplay: Video playing successfully');
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('VideoDisplay: Play failed:', err.message);
              setIsPlaying(false);
            });
        };
        
        video.addEventListener('canplay', handleCanPlay);
        
        // If already can play, trigger immediately
        if (video.readyState >= 3) {
          console.log('VideoDisplay: Video already ready, playing immediately');
          handleCanPlay();
        }
        
        return () => {
          video.removeEventListener('canplay', handleCanPlay);
        };
      } else {
        console.log('VideoDisplay: No stream, clearing video');
        video.srcObject = null;
        setIsPlaying(false);
      }
    }, [state.stream]);

    // Handle video cleanup
    useEffect(() => {
      return () => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = null;
        }
      };
    }, []);

    return (
      <video
        ref={combinedRef}
        className={cn(
          'w-full h-full object-cover rounded-lg',
          isPlaying ? 'bg-transparent' : 'bg-gray-900',
          className
        )}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        onLoadedMetadata={onLoadedMetadata}
        style={{
          transform: 'scaleX(-1)', // Mirror the video for selfie mode
          backgroundColor: '#000000', // Explicit black background to prevent orange screen
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
    );
  }
);

VideoDisplay.displayName = 'VideoDisplay';
