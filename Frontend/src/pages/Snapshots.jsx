import React, { useState, useEffect, useRef } from 'react';
import { snapshotAPI, vmAPI } from '../api/api';
import { Camera, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Snapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({});
  const [selectedVM, setSelectedVM] = useState('');
  const autoRefreshTimers = useRef({});

  useEffect(() => {
    fetchData();
    
    // Cleanup timers on unmount
    return () => {
      Object.values(autoRefreshTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const fetchData = async () => {
    try {
      const [snapshotsRes, vmsRes] = await Promise.all([
        snapshotAPI.list(),
        vmAPI.list()
      ]);
      setSnapshots(snapshotsRes.data);
      setVMs(vmsRes.data);
      
      // Set up auto-refresh for pending snapshots (only once after 2 minutes)
      snapshotsRes.data.forEach(snap => {
        if (snap.status === 'pending' && !autoRefreshTimers.current[snap._id]) {
          autoRefreshTimers.current[snap._id] = setTimeout(() => {
            refreshSnapshot(snap._id);
            delete autoRefreshTimers.current[snap._id];
          }, 120000); // 2 minutes
        }
      });
    } catch (error) {
      toast.error('Failed to fetch snapshots');
    } finally {
      setLoading(false);
    }
  };

  const refreshSnapshot = async (snapshotId) => {
    setRefreshing(prev => ({ ...prev, [snapshotId]: true }));
    try {
      const response = await snapshotAPI.get(snapshotId);
      setSnapshots(prev => prev.map(s => s._id === snapshotId ? response.data : s));
      toast.success('Snapshot status updated');
    } catch (error) {
      toast.error('Failed to refresh snapshot');
    } finally {
      setRefreshing(prev => ({ ...prev, [snapshotId]: false }));
    }
  };

  const createSnapshot = async () => {
    if (!selectedVM) {
      toast.error('Please select a VM');
      return;
    }
    try {
      await snapshotAPI.create({ vmId: selectedVM });
      toast.success('Snapshot created successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to create snapshot');
    }
  };

  const deleteSnapshot = async (id) => {
    if (!confirm('Are you sure you want to delete this snapshot?')) return;
    
    // Clear auto-refresh timer if exists
    if (autoRefreshTimers.current[id]) {
      clearTimeout(autoRefreshTimers.current[id]);
      delete autoRefreshTimers.current[id];
    }
    
    try {
      await snapshotAPI.delete(id);
      toast.success('Snapshot deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete snapshot');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Snapshots</h1>
          <p className="text-gray-600 mt-1">Manage VM snapshots</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedVM}
            onChange={(e) => setSelectedVM(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select VM</option>
            {vms.map(vm => (
              <option key={vm._id} value={vm._id}>{vm.name}</option>
            ))}
          </select>
          <button
            onClick={createSnapshot}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center"
          >
            <Camera className="w-4 h-4 mr-2" />
            Create Snapshot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {snapshots.map((snapshot) => (
          <div key={snapshot._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{snapshot.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {snapshot.vmId?.name || 'Unknown VM'} • {snapshot.provider.toUpperCase()} • {snapshot.region}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => refreshSnapshot(snapshot._id)}
                  disabled={refreshing[snapshot._id]}
                  className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  title="Refresh Status"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing[snapshot._id] ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => deleteSnapshot(snapshot._id)}
                  className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                  title="Delete Snapshot"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Snapshot ID</p>
                <p className="text-sm font-mono mt-1">{snapshot.snapshotId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                  snapshot.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  snapshot.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {snapshot.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Progress</p>
                <p className="text-sm font-medium mt-1">{snapshot.progress || '0%'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Storage Tier</p>
                <p className="text-sm mt-1">{snapshot.storageTier || 'standard'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Full Snapshot Size</p>
                <p className="text-sm font-medium mt-1">{snapshot.size ? `${snapshot.size} GiB` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Volume Size</p>
                <p className="text-sm font-medium mt-1">{snapshot.volumeSize ? `${snapshot.volumeSize} GiB` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Started</p>
                <p className="text-sm mt-1">
                  {snapshot.startTime ? new Date(snapshot.startTime).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {snapshot.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase">Description</p>
                <p className="text-sm mt-1">{snapshot.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500 uppercase">Encryption</p>
                <p className="text-sm mt-1">{snapshot.encryption?.enabled ? 'Encrypted' : 'Not encrypted'}</p>
              </div>
              {snapshot.encryption?.keyId && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">KMS Key ID</p>
                    <p className="text-sm font-mono mt-1">{snapshot.encryption.keyId}</p>
                  </div>
                  {snapshot.encryption?.keyAlias && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">KMS Key Alias</p>
                      <p className="text-sm mt-1">{snapshot.encryption.keyAlias}</p>
                    </div>
                  )}
                </>
              )}
              {snapshot.outpostArn && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Outpost ARN</p>
                  <p className="text-sm font-mono mt-1">{snapshot.outpostArn}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
