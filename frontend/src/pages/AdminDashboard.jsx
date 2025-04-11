import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminDashboard({ user, onLogout }) {
  const [hosts, setHosts] = useState([]);
  const [gates, setGates] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [newHost, setNewHost] = useState({
    name: '',
    department: '',
    employeeId: '',
    username: '',
    password: '',
    contact: ''
  });
  
  const [newGate, setNewGate] = useState({
    name: '',
    loginId: '',
    password: ''
  });
  
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    password: ''
  });
  
  const [preApprovalLimit, setPreApprovalLimit] = useState({
    hostId: '',
    limit: 1
  });
  
  const [globalLimit, setGlobalLimit] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hostsRes, gatesRes, visitorsRes] = await Promise.all([
        adminAPI.getHosts(),
        adminAPI.getGates(),
        adminAPI.getVisitors()
      ]);
      console.log('Gates data:', gatesRes.data.gates);
      setHosts(hostsRes.data.hosts || []);
      setGates(gatesRes.data.gates || []);
      setVisitors(visitorsRes.data.visitors || []);
      setAdmins([]); // We don't have an endpoint for this yet
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHost = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addHost(newHost);
      setNewHost({
        name: '',
        department: '',
        employeeId: '',
        username: '',
        password: '',
        contact: ''
      });
      fetchData();
    } catch (err) {
      setError('Failed to add host');
    }
  };

  const handleAddGate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addGate(newGate);
      setNewGate({
        name: '',
        loginId: '',
        password: ''
      });
      fetchData();
    } catch (err) {
      setError('Failed to add gate');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addAdmin(newAdmin);
      setNewAdmin({
        name: '',
        username: '',
        password: ''
      });
      // Show success message
      setError('');
      alert('Admin added successfully!');
    } catch (err) {
      setError('Failed to add admin: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteHost = async (hostId) => {
    try {
      await adminAPI.deleteHost(hostId);
      fetchData();
    } catch (err) {
      setError('Failed to delete host: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteGate = async (gateId) => {
    try {
      console.log('Deleting gate with ID:', gateId);
      console.log('Gate ID type:', typeof gateId);
      // Make sure we're sending the gateId in the correct format
      await adminAPI.deleteGate(gateId);
      fetchData();
    } catch (err) {
      console.error('Delete Gate Error:', err);
      setError('Failed to delete gate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSetHostLimit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.setLimit(preApprovalLimit.hostId, preApprovalLimit.limit);
      setPreApprovalLimit({ hostId: '', limit: 1 });
      fetchData();
    } catch (err) {
      setError('Failed to set host limit: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSetGlobalLimit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.setLimitAll(globalLimit);
      setGlobalLimit(1);
      fetchData();
    } catch (err) {
      setError('Failed to set global limit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              Hosts
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              Gates
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              Visitors
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              Admins
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              Pre-Approval Limits
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Hosts</h2>
                
                {/* Add Host Form */}
                <form onSubmit={handleAddHost} className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-3">Add New Host</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newHost.name}
                        onChange={(e) => setNewHost({...newHost, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <input
                        type="text"
                        value={newHost.department}
                        onChange={(e) => setNewHost({...newHost, department: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <input
                        type="text"
                        value={newHost.employeeId}
                        onChange={(e) => setNewHost({...newHost, employeeId: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <input
                        type="text"
                        value={newHost.username}
                        onChange={(e) => setNewHost({...newHost, username: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={newHost.password}
                        onChange={(e) => setNewHost({...newHost, password: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact</label>
                      <input
                        type="text"
                        value={newHost.contact}
                        onChange={(e) => setNewHost({...newHost, contact: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Host
                    </button>
                  </div>
                </form>
                
                {/* Hosts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pre-Approval Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {hosts.map((host) => (
                        <tr key={host._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {host.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {host.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {host.employeeId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {host.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {host.contact}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                value={preApprovalLimit.hostId === host._id ? preApprovalLimit.limit : host.preApprovalLimit || 1}
                                onChange={(e) => setPreApprovalLimit({ hostId: host._id, limit: parseInt(e.target.value) })}
                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <button
                                onClick={() => handleSetHostLimit({ preventDefault: () => {} })}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Set Limit
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => handleDeleteHost(host._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Gates</h2>
                
                {/* Add Gate Form */}
                <form onSubmit={handleAddGate} className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-3">Add New Gate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newGate.name}
                        onChange={(e) => setNewGate({...newGate, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Login ID</label>
                      <input
                        type="text"
                        value={newGate.loginId}
                        onChange={(e) => setNewGate({...newGate, loginId: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={newGate.password}
                        onChange={(e) => setNewGate({...newGate, password: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Gate
                    </button>
                  </div>
                </form>
                
                {/* Gates Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Login ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gates.map((gate) => (
                        <tr key={gate._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {gate.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {gate.loginId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => {
                                console.log('Gate object:', gate);
                                console.log('Gate ID:', gate._id);
                                handleDeleteGate(gate._id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Visitors</h2>
                
                {/* Visitors Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Host
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pre-Approved
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visitors.map((visitor) => (
                        <tr key={visitor._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visitor.fullname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visitor.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visitor.hostEmployee?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              visitor.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              visitor.status === 'Declined' ? 'bg-red-100 text-red-800' : 
                              visitor.status === 'Checked In' ? 'bg-blue-100 text-blue-800' : 
                              visitor.status === 'Checked Out' ? 'bg-gray-100 text-gray-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {visitor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visitor.checkIn ? new Date(visitor.checkIn).toLocaleString() : 'Not checked in'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visitor.checkOut ? new Date(visitor.checkOut).toLocaleString() : 'Not checked out'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visitor.preApproved ? 'Yes' : 'No'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Admins</h2>
                
                {/* Add Admin Form */}
                <form onSubmit={handleAddAdmin} className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-3">Add New Admin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <input
                        type="text"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Admin
                    </button>
                  </div>
                </form>
                
                {/* Note about admin listing */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Note: The admin listing functionality is not available in the current backend implementation. 
                    You can still add new administrators using the form above.
                  </p>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Pre-Approval Limits</h2>
                
                {/* Set Global Limit Form */}
                <form onSubmit={handleSetGlobalLimit} className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-3">Set Global Pre-Approval Limit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Limit for All Hosts</label>
                      <input
                        type="number"
                        min="1"
                        value={globalLimit}
                        onChange={(e) => setGlobalLimit(parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Set Global Limit
                      </button>
                    </div>
                  </div>
                </form>
                
                {/* Set Individual Host Limit Form */}
                <form onSubmit={handleSetHostLimit} className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-md font-medium mb-3">Set Individual Host Pre-Approval Limit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Select Host</label>
                      <select
                        value={preApprovalLimit.hostId}
                        onChange={(e) => setPreApprovalLimit({...preApprovalLimit, hostId: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Select a host</option>
                        {hosts.map((host) => (
                          <option key={host._id} value={host._id}>
                            {host.name} ({host.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Limit</label>
                      <input
                        type="number"
                        min="1"
                        value={preApprovalLimit.limit}
                        onChange={(e) => setPreApprovalLimit({...preApprovalLimit, limit: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Set Host Limit
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  );
} 