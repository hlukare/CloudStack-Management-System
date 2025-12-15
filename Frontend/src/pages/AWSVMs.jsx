import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vmAPI } from '../api/api';
import { Server, Play, Square, RefreshCw, Cloud, Plus, RotateCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AWSVMs() {
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addVMForm, setAddVMForm] = useState({
    provider: 'aws',
    instanceId: '',
    region: 'eu-north-1',
    name: ''
  });

  useEffect(() => {
    fetchVMs();
  }, []);

  const fetchVMs = async () => {
    try {
      const response = await vmAPI.list();
      // Filter only AWS VMs
      const awsVMs = response.data.filter(vm => vm.provider === 'aws');
      setVMs(awsVMs);
    } catch (error) {
      toast.error('Failed to fetch AWS VMs');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (region) => {
    setSyncing(true);
    try {
      await vmAPI.sync('aws', region);
      toast.success('AWS VMs synced successfully');
      fetchVMs();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to sync AWS VMs';
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (action, vmId) => {
    try {
      await vmAPI[action](vmId);
      toast.success(`VM ${action} initiated`);
      setTimeout(fetchVMs, 2000);
    } catch (error) {
      toast.error(`Failed to ${action} VM`);
    }
  };

  const handleRefresh = async (vmId) => {
    try {
      await vmAPI.refresh(vmId);
      toast.success('VM details refreshed');
      fetchVMs();
    } catch (error) {
      toast.error('Failed to refresh VM');
    }
  };

  const handleDelete = async (vmId, vmName) => {
    if (window.confirm(`Are you sure you want to delete ${vmName}?`)) {
      try {
        await vmAPI.delete(vmId);
        toast.success('VM deleted successfully');
        fetchVMs();
      } catch (error) {
        toast.error('Failed to delete VM');
      }
    }
  };

  const handleAddVM = async (e) => {
    e.preventDefault();
    try {
      await vmAPI.addById(addVMForm);
      toast.success('AWS VM added successfully');
      setShowAddModal(false);
      setAddVMForm({
        provider: 'aws',
        instanceId: '',
        region: 'eu-north-1',
        name: ''
      });
      fetchVMs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add VM');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AWS Virtual Machines</h1>
          <p className="text-gray-600 mt-1">Manage your AWS EC2 instances</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSync('eu-north-1')}
            disabled={syncing}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <Cloud className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync AWS VMs'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add VM by Instance ID
          </button>
        </div>
      </div>

      {/* Add VM Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add AWS EC2 Instance</h2>
            <form onSubmit={handleAddVM} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Region
                </label>
                <select
                  value={addVMForm.region}
                  onChange={(e) => setAddVMForm({ ...addVMForm, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-1">US West (N. California)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                  <option value="eu-north-1">EU (Stockholm)</option>
                  <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instance ID
                </label>
                <input
                  type="text"
                  value={addVMForm.instanceId}
                  onChange={(e) => setAddVMForm({ ...addVMForm, instanceId: e.target.value })}
                  placeholder="i-1234567890abcdef0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={addVMForm.name}
                  onChange={(e) => setAddVMForm({ ...addVMForm, name: e.target.value })}
                  placeholder="My EC2 Instance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                >
                  Add VM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No AWS VMs Found</h3>
          <p className="text-gray-600 mb-4">
            Start by syncing your AWS EC2 instances or add them manually by Instance ID
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleSync('eu-north-1')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              Sync AWS VMs
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              Add VM by ID
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vms.map((vm) => (
            <div key={vm._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link to={`/aws-vms/${vm._id}`} className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                    {vm.name}
                  </Link>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 font-mono">{vm.instanceId}</p>
                    <p className="text-sm text-gray-600">
                      {vm.region} • {vm.instanceType} • {vm.availabilityZone}
                    </p>
                    {vm.vpcId && (
                      <p className="text-sm text-gray-600">
                        VPC: <span className="font-mono">{vm.vpcId}</span>
                      </p>
                    )}
                    {vm.privateIp && (
                      <p className="text-sm text-gray-600">
                        Private IP: <span className="font-mono">{vm.privateIp}</span>
                      </p>
                    )}
                    {vm.publicIp && (
                      <p className="text-sm text-gray-600">
                        Public IP: <span className="font-mono">{vm.publicIp}</span>
                      </p>
                    )}
                  </div>
                  <span className={`inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full ${
                    vm.state === 'running' ? 'bg-gray-200 text-gray-900' : 
                    vm.state === 'stopped' ? 'bg-gray-100 text-gray-700' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vm.state}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefresh(vm._id)}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    title="Refresh Details"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  {vm.state === 'stopped' && (
                    <button
                      onClick={() => handleAction('start', vm._id)}
                      className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                      title="Start"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {vm.state === 'running' && (
                    <>
                      <button
                        onClick={() => handleAction('reboot', vm._id)}
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        title="Reboot"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction('stop', vm._id)}
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        title="Stop"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(vm._id, vm.name)}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {vm.metrics && (
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">CPU</p>
                    <p className="text-lg font-semibold">{vm.metrics.cpuUtilization?.toFixed(1) || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Memory</p>
                    <p className="text-lg font-semibold">{vm.metrics.memoryUtilization?.toFixed(1) || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Disk</p>
                    <p className="text-lg font-semibold">{vm.metrics.diskUtilization?.toFixed(1) || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Network In</p>
                    <p className="text-lg font-semibold">{vm.metrics.networkIn?.toFixed(2) || 'N/A'} MB</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
