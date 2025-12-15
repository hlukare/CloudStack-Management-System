import React, { useState, useEffect } from 'react';
import { monitoringAPI, vmAPI, alertAPI, costAPI } from '../api/api';
import { Server, AlertTriangle, DollarSign, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [vms, setVMs] = useState([]);
  const [alertCounts, setAlertCounts] = useState({});
  const [costSummary, setCostSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, vmsRes, alertsRes, costsRes] = await Promise.all([
        monitoringAPI.getDashboard(),
        vmAPI.list(),
        alertAPI.getCounts(),
        costAPI.getSummary(30)
      ]);

      setDashboard(dashboardRes.data);
      setVMs(vmsRes.data.slice(0, 5)); // Top 5 VMs
      setAlertCounts(alertsRes.data);
      setCostSummary(costsRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Virtual Machines',
      value: dashboard?.totalVMs || 0,
      icon: Server,
      color: 'border-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Active Alerts',
      value: alertCounts?.active || 0,
      icon: AlertTriangle,
      color: 'border-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Monthly Cost (INR)',
      value: `₹${costSummary?.totalCost ? (parseFloat(costSummary.totalCost) * 83).toFixed(2) : '0.00'}`,
      icon: DollarSign,
      color: 'border-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Running Virtual Machines',
      value: dashboard?.runningVMs || 0,
      icon: Activity,
      color: 'border-gray-600',
      bgColor: 'bg-gray-50'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border-l-4 border-blue-600 p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800" style={{letterSpacing: '0.5px'}}>Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Cloud Infrastructure Overview and Statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white border-2 ${stat.color} p-4 shadow-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 border ${stat.color}`}>
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VMs by Provider */}
        <div className="bg-white border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">Virtual Machines by Provider</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'AWS', count: dashboard?.vmsByProvider?.aws || 0 },
              { name: 'Azure', count: dashboard?.vmsByProvider?.azure || 0 },
              { name: 'GCP', count: dashboard?.vmsByProvider?.gcp || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#374151" style={{fontSize: '12px'}} />
              <YAxis stroke="#374151" style={{fontSize: '12px'}} />
              <Tooltip contentStyle={{border: '1px solid #d1d5db', borderRadius: '0'}} />
              <Bar dataKey="count" fill="#1e40af" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Status */}
        <div className="bg-white border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">Health Status Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-700 mr-3"></div>
                <span className="text-sm text-gray-700 font-medium">Healthy</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{dashboard?.healthStatus?.healthy || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 mr-3"></div>
                <span className="text-sm text-gray-700 font-medium">Warning</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{dashboard?.healthStatus?.warning || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-300 mr-3"></div>
                <span className="text-sm text-gray-700 font-medium">Critical</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{dashboard?.healthStatus?.critical || 0}</span>
            </div>
          </div>
          {dashboard?.activeAnomalies > 0 && (
            <div className="mt-6 p-3 bg-gray-50 border-l-4 border-gray-500">
              <p className="text-sm text-gray-800">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {dashboard.activeAnomalies} active anomalies detected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent VMs */}
      <div className="bg-white border-2 border-gray-200 shadow-sm">
        <div className="p-4 border-b-2 border-blue-600 bg-gray-50">
          <h2 className="text-base font-bold text-gray-800">Recent Virtual Machines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide border border-blue-800">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide border border-blue-800">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide border border-blue-800">State</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide border border-blue-800">CPU</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide border border-blue-800">Memory</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300">
              {vms.map((vm) => (
                <tr key={vm._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{vm.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{vm.provider.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium border ${
                      vm.state === 'running' ? 'bg-gray-100 text-gray-900 border-gray-700' : 'bg-gray-50 text-gray-800 border-gray-600'
                    }`}>
                      {vm.state.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {vm.metrics?.cpuUtilization?.toFixed(1) || 'N/A'}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {vm.metrics?.memoryUtilization?.toFixed(1) || 'N/A'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
