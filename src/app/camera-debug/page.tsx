'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CameraDebugPage() {
  const [status, setStatus] = useState<string>('Click Start Camera');
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [streamInfo, setStreamInfo] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Find HP camera from device list
  const findHPCamera = (videoDevices: MediaDeviceInfo[]): MediaDeviceInfo | undefined => {
    // First try to find HP camera specifically
    let hpCamera = videoDevices.find(d => 
      d.label.toLowerCase().includes('hp')
    );
    
    // If no HP camera, try integrated webcam (not DroidCam)
    if (!hpCamera) {
      hpCamera = videoDevices.find(d => 
        (d.label.toLowerCase().includes('integrated') || 
         d.label.toLowerCase().includes('webcam')) &&
        !d.label.toLowerCase().includes('droid')
      );
    }
    
    // If still no match, use first non-DroidCam camera
    if (!hpCamera) {
      hpCamera = videoDevices.find(d => 
        !d.label.toLowerCase().includes('droid')
      );
    }
    
    return hpCamera;
  };

  // Start camera function
  const startCameraWithDevice = async (deviceId?: string) => {
    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setStatus('Requesting camera access...');
      setError(null);
      setCameraActive(false);
      
      // First, get permission and enumerate devices to find HP camera
      if (!deviceId) {
        // Get temporary stream to trigger permission
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(t => t.stop());
        
        // Now enumerate devices to find HP camera
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        
        // Find HP camera
        const hpCamera = findHPCamera(videoDevices);
        if (hpCamera) {
          deviceId = hpCamera.deviceId;
          setSelectedDeviceId(hpCamera.deviceId);
          setStatus(`Found HP camera: ${hpCamera.label}`);
        } else if (videoDevices.length > 0) {
          deviceId = videoDevices[0].deviceId;
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      }
      
      // Get camera stream with specific device
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Get stream info
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      setStreamInfo(`${videoTrack.label} (${settings.width}x${settings.height})`);
      
      // Connect to video element
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not found');
      }
      
      video.srcObject = stream;
      
      // Wait for metadata and play
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Video load error'));
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
      });
      
      await video.play();
      
      setStatus('✅ Camera is playing!');
      setCameraActive(true);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setStatus('❌ Camera failed: ' + errorMsg);
      setCameraActive(false);
    }
  };
  
  // Handle device selection change
  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    if (cameraActive || streamRef.current) {
      startCameraWithDevice(newDeviceId);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStreamInfo('');
    setStatus('Camera stopped');
  };
  
  // Auto-start camera on mount with HP camera
  useEffect(() => {
    const autoStart = async () => {
      await startCameraWithDevice();
    };
    
    const timer = setTimeout(autoStart, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Camera Debug Test</h1>
      
      {/* Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px',
        backgroundColor: cameraActive ? '#d4edda' : '#fff3cd',
        border: `1px solid ${cameraActive ? '#c3e6cb' : '#ffeeba'}`,
        borderRadius: '8px'
      }}>
        <strong>Status:</strong> {status}
      </div>

      {/* Error */}
      {error && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Camera Selector */}
      {devices.length > 0 && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#e2e3e5',
          border: '1px solid #d6d8db',
          borderRadius: '8px'
        }}>
          <strong>Select Camera:</strong>
          <select 
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            style={{
              marginLeft: '10px',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stream Info */}
      {streamInfo && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px'
        }}>
          <strong>Stream Info:</strong> {streamInfo}
        </div>
      )}

      {/* Video Element */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            backgroundColor: '#000000'
          }}
        />
        
        {!cameraActive && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
            <div>Waiting for camera...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => startCameraWithDevice(selectedDeviceId || undefined)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {cameraActive ? 'Restart Camera' : 'Start Camera'}
        </button>
        
        <button
          onClick={stopCamera}
          disabled={!cameraActive}
          style={{
            padding: '10px 20px',
            backgroundColor: cameraActive ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: cameraActive ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          Stop Camera
        </button>
      </div>

      {/* Debug Info */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h3 style={{ marginTop: 0 }}>Debug Info</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Video element exists: {videoRef.current ? '✅ Yes' : '❌ No'}</li>
          <li>Stream exists: {streamRef.current ? '✅ Yes' : '❌ No'}</li>
          <li>Camera active: {cameraActive ? '✅ Yes' : '❌ No'}</li>
          <li>Video srcObject set: {videoRef.current?.srcObject ? '✅ Yes' : '❌ No'}</li>
        </ul>
      </div>
    </div>
  );
}
