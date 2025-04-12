import { useState, useEffect, useRef } from 'react';
import { gateAPI } from '../services/api';
import { BellIcon, CameraIcon, QrCodeIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { usePDF } from 'react-to-pdf';
import Webcam from 'react-webcam';
import config from '../utils/config';
import VisitorBadge from '../components/VisitorBadge';
import VisitorCheckInOut from '../components/VisitorCheckInOut';

export default function GateDashboard({ user, onLogout, socket }) {
  const [visitors, setVisitors] = useState([]);
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCheckInOut, setShowCheckInOut] = useState(false);
  const webcamRef = useRef(null);
  const { toPDF, targetRef } = usePDF({ filename: 'visitor-badge.pdf' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [badgeData, setBadgeData] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fullname: '',
    purpose: '',
    email: '',
    contact: '',
    organisation: '',
    employeeId: '',
    hostEmployee: '',
    photo: null,
    gateId: ''
  });

  useEffect(() => {
    console.log('GateDashboard mounted, fetching initial data');
    fetchVisitors();
    fetchHosts();

    if (socket) {
      console.log('Setting up socket listeners for gate:', user.data.id);
      
      // Listen for any visitor status updates
      socket.on('visitorStatusUpdated', (data) => {
        console.log('Socket event received - visitorStatusUpdated:', data);
        fetchVisitors();
      });

      // Debug socket connection
      socket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    } else {
      console.warn('Socket not available in GateDashboard');
    }

    return () => {
      if (socket) {
        console.log('Cleaning up socket listeners');
        socket.off('visitorStatusUpdated');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('error');
      }
    };
  }, [socket, user.data.id]);

  const fetchHosts = async () => {
    try {
      const response = await gateAPI.getHosts();
      setHosts(response.data.hosts || []);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      setError('Failed to fetch hosts');
    }
  };

  const fetchVisitors = async () => {
    try {
      const response = await gateAPI.getVisitors();
      setVisitors(response.data || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720,
      quality: 1
    });
    setCapturedImage(imageSrc);
    setShowCamera(false);
    setFormData(prev => ({
      ...prev,
      photo: imageSrc
    }));
  };

  const resetForm = () => {
    setFormData({
      fullname: '',
      purpose: '',
      email: '',
      contact: '',
      organisation: '',
      employeeId: '',
      hostEmployee: '',
      photo: null,
      gateId: ''
    });
    setCapturedImage(null);
    setShowCamera(false);
    setError('');
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.fullname) {
      setError('Full name is required');
      return false;
    }
    if (!formData.purpose) {
      setError('Purpose is required');
      return false;
    }
    if (!formData.hostEmployee) {
      setError('Host is required');
      return false;
    }
    if (!capturedImage) {
      setError('Photo is required');
      return false;
    }
    
    // Check either email or contact
    if (!formData.email && !formData.contact) {
      setError('Either email or contact is required');
      return false;
    }
    
    return true;
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Convert base64 to blob for Cloudinary upload
      const base64Data = capturedImage.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      // Upload photo to Cloudinary
      setUploadingPhoto(true);
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', blob, 'visitor-photo.jpg');
      cloudinaryFormData.append('upload_preset', config.cloudinary.uploadPreset);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to upload photo');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      console.log('Photo uploaded to Cloudinary:', cloudinaryData);

      // Prepare visitor data with gateId
      const visitorData = {
        fullname: formData.fullname,
        purpose: formData.purpose,
        email: formData.email,
        contact: formData.contact,
        organisation: formData.organisation,
        employeeId: formData.employeeId,
        hostEmployee: formData.hostEmployee,
        photo: cloudinaryData.secure_url,
        gateId: user.data.id  // Make sure gateId is included
      };

      console.log('Adding new visitor with data:', visitorData);
      const response = await gateAPI.addVisitor(visitorData);

      if (response && response.data) {
        console.log('Visitor added successfully:', response.data);
        
        // Automatically request approval for the newly added visitor
        try {
          const visitorId = response.data.visitor?._id || response.data.visitor?.id || response.data._id || response.data.id;
          if (!visitorId) {
            console.error('No visitor ID found in response:', response.data);
            throw new Error('No visitor ID found in response');
          }
          
          console.log('Requesting approval for visitor ID:', visitorId);
          await gateAPI.requestApproval(visitorId, user.data.id);
          console.log('Approval request sent successfully');
          
        } catch (approvalError) {
          console.error('Error requesting approval:', approvalError);
          // Don't block the success flow if approval request fails
        }
        
        setShowAddVisitor(false);
        resetForm();
        fetchVisitors();
      }
    } catch (error) {
      console.error('Error adding visitor:', error);
      setError(error.response?.data?.message || 'Failed to add visitor');
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const handleApprove = async (visitorId) => {
    try {
      setLoading(true);
      // Use the existing requestApproval endpoint
      console.log('Requesting approval for visitor ID:', visitorId);
      const response = await gateAPI.requestApproval(visitorId, user.data.id);
      if (response && response.data) {
        console.log('Approval request successful:', response.data);
        fetchVisitors();
      }
    } catch (error) {
      console.error('Error approving visitor:', error);
      console.error('Approval error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Failed to approve visitor');
    } finally {
      setLoading(false);
    }
  };

  const generateBadge = async (visitor) => {
    try {
      setLoading(true);
      // Use the existing generateQR endpoint
      const response = await gateAPI.generateQR(visitor._id);
      if (response && response.data) {
        // The backend already provides the badge data with the correct host name
        setBadgeData(response.data.badgeData);
        setShowBadge(true);
      }
    } catch (error) {
      console.error('Error generating badge:', error);
      setError(error.response?.data?.message || 'Failed to generate badge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Gate Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddVisitor(true)}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add Visitor
              </button>
              <button
                onClick={() => setShowCheckInOut(true)}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Check In/Out
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
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Today's Visitors</h2>
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
                      className="h-12 w-12 rounded-full object-cover object-center"
                    />
                  )}
                  <div>
                    <p className="font-medium">{visitor.fullname}</p>
                    <p className="text-sm text-gray-500">{visitor.purpose}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${
                      visitor.status === 'Approved' ? 'text-green-600' :
                      visitor.status === 'Waiting' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>{visitor.status}</span>
                  </p>
                  <div className="mt-2 flex space-x-2">
                    {visitor.status === 'Approved' && (
                      <button
                        onClick={() => generateBadge(visitor)}
                        disabled={loading}
                        className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Generate Badge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Visitor Modal */}
      {showAddVisitor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">Add New Visitor</h3>
              <button
                onClick={() => {
                  setShowAddVisitor(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddVisitor} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.fullname}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Purpose *
                  </label>
                  <input
                    type="text"
                    name="purpose"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.purpose}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.contact}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organisation"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.organisation}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Host *
                </label>
                <select
                  name="hostEmployee"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.hostEmployee}
                  onChange={handleInputChange}
                >
                  <option value="">Select a host</option>
                  {hosts.map((host) => (
                    <option key={host._id} value={host._id}>
                      {host.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Photo
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  {showCamera ? (
                    <div className="relative">
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="rounded-lg h-48 w-48 object-cover"
                        videoConstraints={{
                          width: 1280,
                          height: 720,
                          facingMode: "user",
                          aspectRatio: 1
                        }}
                        screenshotQuality={1}
                      />
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg"
                      >
                        <CameraIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  ) : capturedImage ? (
                    <div className="relative">
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="rounded-lg h-48 w-48 object-cover"
                        style={{ imageRendering: 'high-quality' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg"
                      >
                        <CameraIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="h-48 w-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                    >
                      <CameraIcon className="h-8 w-8 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVisitor(false);
                    resetForm();
                  }}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingPhoto}
                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : uploadingPhoto ? 'Uploading Photo...' : 'Add Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace the QR Scanner Modal with the VisitorCheckInOut component */}
      {showCheckInOut && (
        <VisitorCheckInOut
          onSuccess={() => {
            setShowCheckInOut(false);
            fetchVisitors();
          }}
          onClose={() => setShowCheckInOut(false)}
        />
      )}

      {/* Badge Modal */}
      {showBadge && badgeData && (
        <VisitorBadge 
          badgeData={badgeData} 
          onClose={() => setShowBadge(false)} 
        />
      )}
    </div>
  );
} 