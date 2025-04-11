import React, { useState } from 'react';
import { gateAPI } from '../services/api';
import QRScanner from './QRScanner';

export default function VisitorCheckInOut({ onSuccess, onClose }) {
  const [mode, setMode] = useState('checkin'); // 'checkin' or 'checkout'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [serverMessage, setServerMessage] = useState('');

  console.log('VisitorCheckInOut rendered with state:', {
    mode,
    loading,
    error,
    showScanner,
    visitorInfo: visitorInfo ? 'present' : 'null',
    serverMessage
  });

  const handleScan = async (visitorId) => {
    console.log('handleScan called with visitorId:', visitorId);
    try {
      setLoading(true);
      setError('');
      
      console.log(`Processing ${mode} for visitor ID: ${visitorId}`);
      
      let response;
      if (mode === 'checkin') {
        console.log('Calling checkIn API...');
        response = await gateAPI.checkIn(visitorId);
        console.log('Check-in API response:', response);
        console.log('Check-in API response data:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('Calling checkOut API...');
        response = await gateAPI.checkOut(visitorId);
        console.log('Check-out API response:', response);
        console.log('Check-out API response data:', JSON.stringify(response.data, null, 2));
      }
      
      console.log('Operation successful, closing scanner');
      setShowScanner(false);
      
      // Store the response data
      if (response && response.data) {
        console.log('Setting server message:', response.data.message);
        setServerMessage(response.data.message);
        
        if (response.data.info) {
          console.log('Setting visitor info:', response.data.info);
          setVisitorInfo(response.data.info);
        } else {
          console.log('No visitor info in response');
        }
      } else {
        console.log('No response data available');
      }
      
      // Don't call onSuccess yet, wait for user to close the popup
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

  const handleClose = () => {
    console.log('handleClose called');
    setVisitorInfo(null);
    setServerMessage('');
    onClose();
  };

  const handleContinue = () => {
    console.log('handleContinue called');
    setVisitorInfo(null);
    setServerMessage('');
    onSuccess();
  };

  // If we have visitor info, show the confirmation popup
  if (visitorInfo) {
    console.log('Rendering confirmation popup with visitor info:', visitorInfo);
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium">
              {mode === 'checkin' ? 'Check In Successful' : 'Check Out Successful'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-md mb-4">
              {serverMessage}
            </div>
            
            <div className="flex items-center mb-4">
              {visitorInfo.photo && (
                <img 
                  src={visitorInfo.photo} 
                  alt={visitorInfo.fullname} 
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
              )}
              <div>
                <h4 className="font-medium">{visitorInfo.fullname}</h4>
                <p className="text-sm text-gray-500">{visitorInfo.purpose}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Status:</div>
              <div>{mode === 'checkin' ? 'Checked In' : 'Checked Out'}</div>
              
              {visitorInfo.email && (
                <>
                  <div className="font-medium">Email:</div>
                  <div>{visitorInfo.email}</div>
                </>
              )}
              
              {visitorInfo.contact && (
                <>
                  <div className="font-medium">Contact:</div>
                  <div>{visitorInfo.contact}</div>
                </>
              )}
              
              {visitorInfo.organisation && (
                <>
                  <div className="font-medium">Organization:</div>
                  <div>{visitorInfo.organisation}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the scanner interface
  console.log('Rendering scanner interface');
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
              onClick={() => {
                console.log('Switching to check-in mode');
                setMode('checkin');
              }}
              className={`flex-1 py-2 px-4 rounded-md ${
                mode === 'checkin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Check In
            </button>
            <button
              onClick={() => {
                console.log('Switching to check-out mode');
                setMode('checkout');
              }}
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