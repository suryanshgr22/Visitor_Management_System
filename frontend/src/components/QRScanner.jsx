import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onClose, mode }) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanningInterval = useRef(null);

  useEffect(() => {
    console.log('QRScanner mounted');
    return () => {
      console.log('QRScanner unmounting, clearing interval');
      if (scanningInterval.current) {
        clearInterval(scanningInterval.current);
      }
    };
  }, []);

  const startScanning = () => {
    console.log('Starting QR scan...');
    setScanning(true);
    scanningInterval.current = setInterval(() => {
      if (webcamRef.current && canvasRef.current) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          console.log('Video frame ready, dimensions:', {
            width: video.videoWidth,
            height: video.videoHeight
          });

          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          console.log('Image data captured, size:', imageData.data.length);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            console.log('QR code detected:', code);
            console.log('Raw QR code data:', code.data);
            
            // Try to parse as JSON first
            try {
              const jsonData = JSON.parse(code.data);
              console.log('Parsed QR data as JSON:', jsonData);
              
              if (jsonData.visitorId) {
                console.log('Valid visitor ID found in JSON:', jsonData.visitorId);
                clearInterval(scanningInterval.current);
                setScanning(false);
                onScan(jsonData.visitorId);
                return;
              }
            } catch (e) {
              console.log('Not a JSON format, trying as plain string');
            }
            
            // If not JSON or doesn't have visitorId, try as plain string
            // Check if it looks like a MongoDB ObjectId (24 hex characters)
            if (/^[0-9a-fA-F]{24}$/.test(code.data)) {
              console.log('Valid visitor ID found as plain string:', code.data);
              clearInterval(scanningInterval.current);
              setScanning(false);
              onScan(code.data);
            } else {
              console.log('QR code data is not a valid visitor ID');
            }
          }
        } else {
          console.log('Video not ready, state:', video.readyState);
        }
      } else {
        console.log('Webcam or canvas ref not available');
      }
    }, 100);
  };

  const handleError = (error) => {
    console.error('Camera error:', error);
    setError('Failed to access camera. Please ensure camera permissions are granted.');
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">
            Scan QR Code for {mode === 'checkin' ? 'Check In' : 'Check Out'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="relative mb-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            onUserMediaError={handleError}
            className="w-full rounded-lg"
            videoConstraints={{
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }}
            onUserMedia={() => console.log('Camera access granted')}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={startScanning}
            disabled={scanning}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Start Scanning'}
          </button>
        </div>
      </div>
    </div>
  );
} 