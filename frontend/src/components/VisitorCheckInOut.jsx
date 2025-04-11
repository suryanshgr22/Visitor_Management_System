import React, { useState } from 'react';
import { gateAPI } from '../services/api';
import QRScanner from './QRScanner';

export default function VisitorCheckInOut({ onSuccess, onClose }) {
  const [mode, setMode] = useState('checkin'); // 'checkin' or 'checkout'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = async (visitorId) => {
    console.log('handleScan called with visitorId:', visitorId);
    try {
      setLoading(true);
      setError('');
      
      console.log(`Processing ${mode} for visitor ID: ${visitorId}`);
      
      if (mode === 'checkin') {
        console.log('Calling checkIn API...');
        const response = await gateAPI.checkIn(visitorId);
        console.log('Check-in API response:', response);
      } else {
        console.log('Calling checkOut API...');
        const response = await gateAPI.checkOut(visitorId);
        console.log('Check-out API response:', response);
      }
      
      console.log('Operation successful, closing scanner');
      setShowScanner(false);
      
      console.log('Notifying parent component of success');
      onSuccess();
    } catch (error) {
      console.error(`Error during ${mode}:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || `Failed to ${mode} visitor`);
      setShowScanner(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">
            {mode === 'checkin' ? 'Check In Visitor' : 'Check Out Visitor'}
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
        
        <div className="mb-4">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setMode('checkin')}
              className={`flex-1 py-2 px-4 rounded-md ${
                mode === 'checkin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Check In
            </button>
            <button
              onClick={() => setMode('checkout')}
              className={`flex-1 py-2 px-4 rounded-md ${
                mode === 'checkout'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Check Out
            </button>
          </div>
          
          <button
            onClick={() => {
              console.log('Opening QR scanner for mode:', mode);
              setShowScanner(true);
            }}
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Scan QR Code'}
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
      
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => {
            console.log('Closing QR scanner');
            setShowScanner(false);
          }}
          mode={mode}
        />
      )}
    </div>
  );
} 