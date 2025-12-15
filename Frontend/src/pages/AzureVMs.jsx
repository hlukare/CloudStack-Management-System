import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vmAPI } from '../api/api';
import { Server, Play, Square, RefreshCw, Cloud, Plus, RotateCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AzureVMs() {
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchVMs();
  }, []);

  const fetchVMs = async () => {
    try {
      const response = await vmAPI.list();
      // Filter only Azure VMs
      const azureVMs = response.data.filter(vm => vm.provider === 'azure');
      setVMs(azureVMs);
    } catch (error) {
      toast.error('Failed to fetch Azure VMs');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await vmAPI.sync('azure');
      toast.success('Azure VMs synced successfully');
      fetchVMs();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to sync Azure VMs';
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

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Azure Virtual Machines</h1>
          <p className="text-gray-600 mt-1">Manage your Microsoft Azure VMs</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Azure VMs'}
        </button>
      </div>

      {vms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Azure VMs Found</h3>
          <p className="text-gray-600 mb-6">
            Connect your Azure account to start managing your virtual machines
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {vms.map(vm => (
            <div key={vm._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      vm.state === 'running' ? 'bg-gray-100' : 
                      vm.state === 'stopped' ? 'bg-gray-200' : 
                      'bg-gray-100'
                    }`}>
                      <Server className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link 
                          to={`/azure-vms/${vm._id}`}
                          className="text-xl font-semibold text-gray-900 hover:text-gray-700"
                        >
                          {vm.name}
                        </Link>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          vm.state === 'running' ? 'bg-gray-200 text-gray-800' :
                          vm.state === 'stopped' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {vm.state}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">VM ID</p>
                          <p className="text-gray-900 font-mono text-xs">{vm.instanceId}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Size</p>
                          <p className="text-gray-900">{vm.instanceType}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Region</p>
                          <p className="text-gray-900">{vm.region}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Public IP</p>
                          <p className="text-gray-900 font-mono text-xs">{vm.publicIp || 'N/A'}</p>
                        </div>
                      </div>
                      {vm.tags && vm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {vm.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200">
                              {tag.key}: {tag.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {vm.state === 'stopped' ? (
                      <button
                        onClick={() => handleAction('start', vm._id)}
                        className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                        title="Start VM"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('stop', vm._id)}
                        className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                        title="Stop VM"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction('reboot', vm._id)}
                      className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      title="Reboot VM"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
