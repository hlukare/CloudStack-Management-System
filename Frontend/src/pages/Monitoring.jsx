import React, { useState, useEffect } from 'react';
import { monitoringAPI, vmAPI } from '../api/api';
import { Activity, AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown, Server } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Monitoring() {
  const [dashboard, setDashboard] = useState(null);
  const [vms, setVMs] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [vmMetrics, setVMMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedVM) {
      fetchVMMetrics(selectedVM);
    }
  }, [selectedVM, timeRange]);

  const fetchData = async () => {
    try {
      const [dashboardRes, vmsRes] = await Promise.all([
        monitoringAPI.getDashboard(),
        vmAPI.list()
      ]);
      setDashboard(dashboardRes.data);
      setVMs(vmsRes.data);
      if (vmsRes.data.length > 0 && !selectedVM) {
        setSelectedVM(vmsRes.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVMMetrics = async (vmId) => {
    try {
      const response = await vmAPI.getMetrics(vmId, timeRange);
      setVMMetrics(response.data);
    } catch (error) {
      toast.error('Failed to fetch VM metrics');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monitoring</h1>
        <p className="text-gray-600 mt-1">Real-time VM performance and health metrics</p>
      </div>

      {/* Health Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healthy VMs</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.healthy || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-gray-700" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warning</p>
                <p className="text-3xl font-bold text-gray-800">{dashboard.warning || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-gray-700">{dashboard.critical || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg CPU Usage</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.avgCPU?.toFixed(1) || 0}%</p>
              </div>
              <Activity className="w-10 h-10 text-gray-700" />
            </div>
          </div>
        </div>
      )}

      {/* VM Selector and Time Range */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select VM</label>
            <select
              value={selectedVM || ''}
              onChange={(e) => setSelectedVM(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {vms.map(vm => (
                <option key={vm._id} value={vm._id}>
                  {vm.name} ({vm.provider.toUpperCase()} - {vm.state})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last 1 Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current VM Status */}
      {selectedVM && vms.find(v => v._id === selectedVM) && (
        <>
          {/* VM Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              {vms.find(v => v._id === selectedVM).name} - VM Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Instance ID</p>
                <p className="text-sm font-mono mt-1">{vms.find(v => v._id === selectedVM).instanceId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Instance Type</p>
                <p className="text-sm font-medium mt-1">{vms.find(v => v._id === selectedVM).instanceType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">State</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                  vms.find(v => v._id === selectedVM).state === 'running' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-800'
                }`}>
                  {vms.find(v => v._id === selectedVM).state}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Platform</p>
                <p className="text-sm mt-1">{vms.find(v => v._id === selectedVM).platform || 'linux'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Provider</p>
                <p className="text-sm font-medium mt-1">{vms.find(v => v._id === selectedVM).provider.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Region</p>
                <p className="text-sm mt-1">{vms.find(v => v._id === selectedVM).region}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Public IP</p>
                <p className="text-sm font-mono mt-1">{vms.find(v => v._id === selectedVM).publicIp || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Private IP</p>
                <p className="text-sm font-mono mt-1">{vms.find(v => v._id === selectedVM).privateIp || 'N/A'}</p>
              </div>
              {vms.find(v => v._id === selectedVM).launchTime && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Launch Time</p>
                  <p className="text-sm mt-1">{new Date(vms.find(v => v._id === selectedVM).launchTime).toLocaleString()}</p>
                </div>
              )}
              {vms.find(v => v._id === selectedVM).zone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Availability Zone</p>
                  <p className="text-sm mt-1">{vms.find(v => v._id === selectedVM).zone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Metrics Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Current Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {vms.find(v => v._id === selectedVM).metrics && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">CPU Utilization</p>
                    <div className="relative inline-block">
                      <div className={`text-4xl font-bold ${
                        vms.find(v => v._id === selectedVM).metrics.cpuUtilization > 80 ? 'text-gray-700' :
                        vms.find(v => v._id === selectedVM).metrics.cpuUtilization > 60 ? 'text-gray-800' :
                        'text-gray-900'
                      }`}>
                        {vms.find(v => v._id === selectedVM).metrics.cpuUtilization?.toFixed(1)}%
                      </div>
                      {vms.find(v => v._id === selectedVM).metrics.cpuUtilization > 70 ? 
                        <TrendingUp className="w-5 h-5 text-gray-600 absolute -top-2 -right-6" /> :
                        <TrendingDown className="w-5 h-5 text-gray-600 absolute -top-2 -right-6" />
                      }
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Memory Usage</p>
                    <div className={`text-4xl font-bold ${
                      vms.find(v => v._id === selectedVM).metrics.memoryUtilization > 85 ? 'text-gray-700' :
                      vms.find(v => v._id === selectedVM).metrics.memoryUtilization > 70 ? 'text-gray-800' :
                      'text-gray-900'
                    }`}>
                      {vms.find(v => v._id === selectedVM).metrics.memoryUtilization?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Disk Usage</p>
                    <div className={`text-4xl font-bold ${
                      vms.find(v => v._id === selectedVM).metrics.diskUtilization > 90 ? 'text-gray-700' :
                      vms.find(v => v._id === selectedVM).metrics.diskUtilization > 75 ? 'text-gray-800' :
                      'text-gray-900'
                    }`}>
                      {vms.find(v => v._id === selectedVM).metrics.diskUtilization?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Network In/Out</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {(vms.find(v => v._id === selectedVM).metrics.networkIn / 1024).toFixed(1)} KB/s
                      <div className="text-sm text-gray-500">
                        {(vms.find(v => v._id === selectedVM).metrics.networkOut / 1024).toFixed(1)} KB/s
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Metrics Charts */}
      {vmMetrics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">CPU Utilization Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={vmMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpuUtilization" 
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  name="CPU %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Memory Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Memory Utilization Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={vmMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="memoryUtilization" 
                  stroke="#10b981" 
                  fill="#6ee7b7" 
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Disk Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Disk Utilization Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={vmMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="diskUtilization" 
                  stroke="#f59e0b" 
                  fill="#fcd34d" 
                  name="Disk %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Network Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Network Traffic</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={vmMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value) => `${(value / 1024).toFixed(2)} KB/s`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="networkIn" 
                  stroke="#8b5cf6" 
                  name="Network In (bytes/s)"
                />
                <Line 
                  type="monotone" 
                  dataKey="networkOut" 
                  stroke="#ec4899" 
                  name="Network Out (bytes/s)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Understanding Monitoring Metrics</h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-4">
          <li><strong>CPU Utilization:</strong> Percentage of CPU capacity being used. High sustained usage (&gt;80%) may indicate need for scaling.</li>
          <li><strong>Memory Usage:</strong> RAM utilization. Values above 85% may cause performance issues.</li>
          <li><strong>Disk Usage:</strong> Storage space used. Critical when exceeding 90%.</li>
          <li><strong>Network Traffic:</strong> Data transmitted in/out. Spikes may indicate DDoS or heavy traffic.</li>
          <li><strong>Health Status:</strong> Green = healthy, Yellow = warning (threshold exceeded), Red = critical (action needed).</li>
        </ul>
      </div>
    </div>
  );
}
