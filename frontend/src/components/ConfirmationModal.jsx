import React, { useEffect } from 'react';

export default function ConfirmationModal({ message, visitorDetails, mode, onClose }) {
  useEffect(() => {
    console.log('ConfirmationModal mounted with:', {
      message,
      visitorDetails,
      mode
    });
  }, [message, visitorDetails, mode]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">
            {mode === 'checkin' ? 'Check In Successful' : 'Check Out Successful'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 bg-green-50 text-green-700 rounded-md mb-4">
          <p className="font-medium">{message}</p>
        </div>
        
        {visitorDetails ? (
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-4 mb-4">
              {visitorDetails.photo && (
                <img
                  src={visitorDetails.photo}
                  alt={visitorDetails.fullname}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium text-lg">{visitorDetails.fullname}</p>
                <p className="text-sm text-gray-500">{visitorDetails.purpose}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Host</p>
                <p className="font-medium">{visitorDetails.hostEmployee?.fullname || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium">
                  {mode === 'checkin' 
                    ? new Date(visitorDetails.checkIn).toLocaleString() 
                    : new Date(visitorDetails.checkOut).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <p className="text-center text-gray-500">No visitor details available</p>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 