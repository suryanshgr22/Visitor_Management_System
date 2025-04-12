import { useState, useEffect } from 'react';
import { hostAPI } from '../services/api';
import { BellIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePDF } from 'react-to-pdf';

export default function HostDashboard({ user, onLogout, socket }) {
  const [visitors, setVisitors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [preApprovedVisitors, setPreApprovedVisitors] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showBadge, setShowBadge] = useState(false);
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [showVisitorDetails, setShowVisitorDetails] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    purpose: '',
    expectedCheckInFrom: '',
    expectedCheckInTo: ''
  });
  const { toPDF, targetRef } = usePDF({ filename: 'visitor-badge.pdf' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('HostDashboard mounted, fetching initial data');
    fetchVisitors();
    fetchPendingRequests();
    fetchPreApprovedVisitors();

    if (socket) {
      console.log('Setting up socket listeners for host:', user.data.id);
      
      // Listen for new approval requests
      socket.on('newApprovalRequest', (data) => {
        console.log('Received new approval request:', data);
        // Refresh pending requests when a new request arrives
        fetchPendingRequests();
        setShowNotifications(true);
      });

      // Listen for visitor status updates
      socket.on('visitorStatusUpdated', (data) => {
        console.log('Received visitor status update:', data);
        // Refresh all visitor lists when status changes
        fetchVisitors();
        fetchPendingRequests();
        fetchPreApprovedVisitors();
      });
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket listeners');
        socket.off('newApprovalRequest');
        socket.off('visitorStatusUpdated');
      }
    };
  }, [socket, user.data.id]);

  const fetchVisitors = async () => {
    try {
      console.log('Fetching all visitors');
      const response = await hostAPI.getVisitors();
      console.log('Visitors fetched:', response.data);
      setVisitors(response.data.visitors || []);
    } catch (error) {
      console.error(' Error fetching visitors:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      console.log('Fetching pending requests');
      const response = await hostAPI.getPendingRequests();
      console.log('Pending requests fetched:', response.data);
      setPendingRequests(response.data.visitors || []);
    } catch (error) {
      console.error(' Error fetching pending requests:', error);
    }
  };

  const fetchPreApprovedVisitors = async () => {
    try {
      console.log('Fetching pre-approved visitors');
      const response = await hostAPI.getPreApprovedVisitors();
      console.log('Pre-approved visitors fetched:', response.data);
      setPreApprovedVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Error fetching pre-approved visitors:', error);
    }
  };

  const handleApprove = async (visitorId) => {
    try {
      console.log('Approving visitor:', visitorId);
      const response = await hostAPI.approveVisitor(visitorId);
      console.log('Approval response:', response.data);
      
      // Update local state
      setPendingRequests(prev => prev.filter(v => v._id !== visitorId));
      setShowNotifications(false);
      setShowVisitorDetails(false);
      
      // Refresh all visitor data to ensure everything is in sync
      fetchVisitors();
      fetchPendingRequests();
      fetchPreApprovedVisitors();
      
      // Emit a socket event to notify the gate of the status change
      if (socket) {
        console.log('Emitting visitorStatusUpdated event for visitor:', visitorId);
        socket.emit('visitorStatusUpdated', { 
          visitorId, 
          status: 'Approved',
          timestamp: new Date().toISOString()
        });
        
        // Also emit a more specific event for the gate
        socket.emit('gateNotification', {
          type: 'visitorApproved',
          visitorId,
          message: 'A visitor has been approved'
        });
      }
    } catch (error) {
      console.error('Error approving visitor:', error);
    }
  };

  const handleDecline = async (visitorId) => {
    try {
      console.log('Declining visitor:', visitorId);
      const response = await hostAPI.decline(visitorId);
      console.log('Decline response:', response.data);
      
      // The socket event will trigger a refresh, but we can also update locally
      setPendingRequests(prev => prev.filter(v => v._id !== visitorId));
      setShowNotifications(false);
    } catch (error) {
      console.error('Error declining visitor:', error);
    }
  };

  const handleGenerateQR = async (visitor) => {
    try {
      if (!visitor.preApproved) {
        console.error('Visitor is not pre-approved');
        return;
      }
      if (visitor.status !== 'Approved') {
        console.error('Visitor is not approved yet');
        return;
      }
      console.log('Generating QR code for visitor:', visitor._id);
      const response = await hostAPI.generateQR(visitor._id);
      console.log('QR code generated:', response.data);
      setSelectedVisitor({ ...visitor, badgeData: response.data.badgeData });
      setShowBadge(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    try {
      await hostAPI.addVisitor(formData);
      setShowAddVisitor(false);
      setFormData({
        fullname: '',
        email: '',
        phone: '',
        purpose: '',
        expectedCheckInFrom: '',
        expectedCheckInTo: ''
      });
      fetchVisitors();
      fetchPreApprovedVisitors();
    } catch (error) {
      console.error('Error adding visitor:', error);
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddVisitor(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Visitor
              </button>
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
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Pending Requests Section */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Pending Approvals</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div
                  key={request.visitorId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedVisitor(request);
                    setShowVisitorDetails(true);
                  }}
                >
                  <div className="flex items-center space-x-4">
                    {request.photo && (
                      <img
                        src={request.photo}
                        alt={request.fullname}
                        className="h-12 w-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{request.fullname}</p>
                      <p className="text-sm text-gray-500">{request.purpose}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-3 text-center py-4">No pending approvals</p>
            )}
          </div>
        </div>

        {/* Pre-approved Visitors Section */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Pre-approved Visitors</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preApprovedVisitors.map((visitor) => (
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

        {/* All Visitors Section */}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Visitor Modal */}
      {showAddVisitor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Add New Visitor</h3>
              <button
                onClick={() => setShowAddVisitor(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddVisitor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purpose
                </label>
                <textarea
                  required
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Check-in From
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.expectedCheckInFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedCheckInFrom: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Check-in To
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.expectedCheckInTo}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedCheckInTo: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddVisitor(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Add Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visitor Details Modal */}
      {showVisitorDetails && selectedVisitor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Visitor Details</h3>
              <button
                onClick={() => setShowVisitorDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {selectedVisitor.photo && (
                  <img
                    src={selectedVisitor.photo}
                    alt={selectedVisitor.fullname}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                )}
                <div className="text-center">
                  <p className="font-medium text-lg">{selectedVisitor.fullname}</p>
                  <p className="text-sm text-gray-500">{selectedVisitor.purpose}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{selectedVisitor.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{selectedVisitor.phone}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleDecline(selectedVisitor._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleApprove(selectedVisitor._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {showBadge && selectedVisitor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Visitor Badge</h3>
              <button
                onClick={() => setShowBadge(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {/* Print-friendly version */}
            <div className="bg-white p-6 rounded-lg" ref={targetRef}>
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
                    <p className="mt-1">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Time</p>
                    <p className="mt-1">{selectedVisitor.badgeData?.time || new Date().toLocaleString()}</p>
                  </div>
                </div>
                {selectedVisitor.badgeData?.qrCode && (
                  <div className="flex justify-center">
                    <img
                      src={selectedVisitor.badgeData.qrCode}
                      alt="QR Code"
                      className="h-32 w-32"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Action buttons outside the print area */}
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