import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vmAPI } from '../api/api';
import { Server, Play, Square, RefreshCw, Cloud, Plus, Info, Trash2, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VMList() {
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addVMForm, setAddVMForm] = useState({
    provider: 'aws',
    instanceId: '',
    region: 'us-east-1',
    name: ''
  });

  useEffect(() => {
    fetchVMs();
  }, []);

  const fetchVMs = async () => {
    try {
      const response = await vmAPI.list();
      setVMs(response.data);
    } catch (error) {
      toast.error('Failed to fetch VMs');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (provider, region) => {
    setSyncing(true);
    try {
      await vmAPI.sync(provider, region);
      toast.success('VMs synced successfully');
      fetchVMs();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to sync VMs';
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (action, vmId) => {
    try {
      await vmAPI[action](vmId);
      toast.success(`VM ${action} initiated`);
      fetchVMs();
    } catch (error) {
      toast.error(`Failed to ${action} VM`);
    }
  };

  const handleAddVM = async (e) => {
    e.preventDefault();
    try {
      await vmAPI.addByInstanceId(addVMForm);
      toast.success('VM added successfully');
      setShowAddModal(false);
      setAddVMForm({ provider: 'aws', instanceId: '', region: 'us-east-1', name: '' });
      fetchVMs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add VM');
    }
  };

  const handleDelete = async (vmId, vmName) => {
    if (!window.confirm(`Are you sure you want to delete "${vmName}"? This will remove it from your dashboard.`)) {
      return;
    }
    try {
      await vmAPI.delete(vmId);
      toast.success('VM deleted successfully');
      fetchVMs();
    } catch (error) {
      toast.error('Failed to delete VM');
    }
  };

  const handleRefresh = async (vmId) => {
    try {
      await vmAPI.refresh(vmId);
      toast.success('VM details refreshed');
      fetchVMs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to refresh VM');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Virtual Machines</h1>
          <p className="text-gray-600 mt-1">Manage your cloud VMs across AWS, Azure, and GCP</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add VM by ID
          </button>
          <button
            onClick={() => handleSync('aws', 'us-east-1')}
            disabled={syncing}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Sync AWS
          </button>
        </div>
      </div>

      {/* Add VM Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add VM by Instance ID</h2>
            <form onSubmit={handleAddVM} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cloud Provider
                </label>
                <select
                  value={addVMForm.provider}
                  onChange={(e) => setAddVMForm({ ...addVMForm, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="aws">AWS</option>
                  <option value="azure">Azure</option>
                  <option value="gcp">GCP</option>
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
                  placeholder={addVMForm.provider === 'aws' ? 'i-1234567890abcdef0' : addVMForm.provider === 'azure' ? '/subscriptions/.../resourceGroups/.../providers/...' : 'instance-name'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={addVMForm.region}
                  onChange={(e) => setAddVMForm({ ...addVMForm, region: e.target.value })}
                  placeholder="us-east-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VM Name (Optional)
                </label>
                <input
                  type="text"
                  value={addVMForm.name}
                  onChange={(e) => setAddVMForm({ ...addVMForm, name: e.target.value })}
                  placeholder="My Production Server"
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

      <div className="grid grid-cols-1 gap-4">
        {vms.map((vm) => (
          <div key={vm._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <Link to={`/vms/${vm._id}`} className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                  {vm.name}
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  {vm.provider.toUpperCase()} • {vm.region} • {vm.instanceType}
                </p>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  vm.state === 'running' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-800'
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
                      onClick={() => handleAction('restart', vm._id)}
                      className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      title="Restart"
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
              <div className="grid grid-cols-3 gap-4 mt-4">
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
