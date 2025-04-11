import { useState, useEffect } from 'react';
import { hostAPI } from '../services/api';
import { BellIcon } from '@heroicons/react/24/outline';
import { usePDF } from 'react-to-pdf';

export default function HostDashboard({ user, onLogout, socket }) {
  const [visitors, setVisitors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showBadge, setShowBadge] = useState(false);
  const { toPDF, targetRef } = usePDF({ filename: 'visitor-badge.pdf' });

  useEffect(() => {
    fetchVisitors();
    fetchPendingRequests();

    if (socket) {
      socket.on('new-visit-request', (request) => {
        setPendingRequests((prev) => [...prev, request]);
        setShowNotifications(true);
      });
    }

    return () => {
      if (socket) {
        socket.off('new-visit-request');
      }
    };
  }, [socket]);

  const fetchVisitors = async () => {
    try {
      const response = await hostAPI.getVisitors();
      setVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await hostAPI.getPendingRequests();
      setPendingRequests(response.data.visitors || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    }
  };

  const handleApprove = async (visitorId) => {
    try {
      await hostAPI.approveVisitor(visitorId);
      setPendingRequests((prev) =>
        prev.filter((request) => request.visitorId !== visitorId)
      );
      fetchVisitors();
    } catch (error) {
      console.error('Error approving visitor:', error);
    }
  };

  const handleDecline = async (visitorId) => {
    try {
      await hostAPI.declineVisitor(visitorId);
      setPendingRequests((prev) =>
        prev.filter((request) => request.visitorId !== visitorId)
      );
    } catch (error) {
      console.error('Error declining visitor:', error);
    }
  };

  const handleGenerateQR = async (visitor) => {
    try {
      const response = await hostAPI.generateQR(visitor._id);
      setSelectedVisitor({ ...visitor, qrCode: response.data.qrCode });
      setShowBadge(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Host Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                className="relative p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon className="h-6 w-6" />
                {pendingRequests.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400" />
                )}
              </button>
              <button
                onClick={onLogout}
                className="ml-4 px-4 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showNotifications && pendingRequests.length > 0 && (
          <div className="mb-6 bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Pending Approvals</h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.visitorId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{request.fullname}</p>
                    <p className="text-sm text-gray-500">{request.purpose}</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleApprove(request.visitorId)}
                      className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecline(request.visitorId)}
                      className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">All Visitors</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visitors.map((visitor) => (
              <div
                key={visitor._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  {visitor.photo && (
                    <img
                      src={visitor.photo}
                      alt={visitor.fullname}
                      className="h-12 w-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{visitor.fullname}</p>
                    <p className="text-sm text-gray-500">{visitor.purpose}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Status:{' '}
                    <span
                      className={`font-medium ${
                        visitor.status === 'Approved'
                          ? 'text-green-600'
                          : visitor.status === 'Declined'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {visitor.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Expected: {new Date(visitor.expectedCheckInFrom).toLocaleString()}
                  </p>
                </div>
                {visitor.status === 'Approved' && (
                  <button
                    onClick={() => handleGenerateQR(visitor)}
                    className="mt-2 w-full px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
                  >
                    Generate Badge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showBadge && selectedVisitor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" ref={targetRef}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Visitor Badge</h3>
              <button
                onClick={() => setShowBadge(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedVisitor.photo && (
                  <img
                    src={selectedVisitor.photo}
                    alt={selectedVisitor.fullname}
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{selectedVisitor.fullname}</p>
                  <p className="text-sm text-gray-500">{selectedVisitor.purpose}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Host</p>
                  <p className="mt-1">{selectedVisitor.hostEmployee?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="mt-1">
                    {new Date(selectedVisitor.expectedCheckInFrom).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedVisitor.qrCode && (
                <div className="flex justify-center">
                  <img
                    src={selectedVisitor.qrCode}
                    alt="QR Code"
                    className="h-32 w-32"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Print
              </button>
              <button
                onClick={() => toPDF()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 