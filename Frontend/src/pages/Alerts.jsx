import React, { useState, useEffect } from 'react';
import { alertAPI } from '../api/api';
import { AlertTriangle, Bell, CheckCircle, XCircle, Clock, Info, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: 'all', status: 'all' });

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const [alertsRes, countsRes] = await Promise.all([
        alertAPI.list(filter),
        alertAPI.getCounts()
      ]);
      setAlerts(alertsRes.data);
      setCounts(countsRes.data);
    } catch (error) {
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id);
      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertAPI.resolve(id);
      toast.success('Alert resolved');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-gray-900 bg-gray-200 border-gray-700';
      case 'high': return 'text-gray-800 bg-gray-100 border-gray-600';
      case 'medium': return 'text-gray-700 bg-gray-100 border-gray-500';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-400';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical': return <XCircle className="w-6 h-6 text-gray-900" />;
      case 'high': return <AlertTriangle className="w-6 h-6 text-gray-800" />;
      case 'medium': return <Bell className="w-6 h-6 text-gray-700" />;
      case 'low': return <Info className="w-6 h-6 text-gray-600" />;
      default: return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="text-gray-600 mt-1">Monitor and manage system alerts and notifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{counts.active || 0}</p>
            </div>
            <Bell className="w-10 h-10 text-gray-700" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-gray-800">{counts.critical || 0}</p>
            </div>
            <XCircle className="w-10 h-10 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acknowledged</p>
              <p className="text-3xl font-bold text-gray-800">{counts.acknowledged || 0}</p>
            </div>
            <Clock className="w-10 h-10 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-gray-900">{counts.resolved || 0}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-gray-700" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 items-center">
          <Filter className="w-5 h-5 text-gray-500" />
          <select value={filter.severity} onChange={(e) => setFilter({...filter, severity: e.target.value})} className="px-3 py-2 border rounded-lg">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} className="px-3 py-2 border rounded-lg">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">No Alerts</p>
            <p className="text-gray-600 mt-2">All systems are running smoothly!</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert._id} className={`bg-white rounded-lg shadow border-l-4 p-6 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${alert.status === 'resolved' ? 'bg-gray-200 text-gray-900' : alert.status === 'acknowledged' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-700'}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>VM: {alert.vmName || 'N/A'}</span>
                      <span>Type: {alert.type}</span>
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    {alert.metadata && (
                      <div className="mt-2 text-sm text-gray-600">
                        {Object.entries(alert.metadata).map(([key, value]) => (
                          <span key={key} className="mr-4"><strong>{key}:</strong> {value}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <button onClick={() => handleAcknowledge(alert._id)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button onClick={() => handleResolve(alert._id)} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Alert Severity Levels</h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-4">
          <li><strong className="text-gray-900">Critical:</strong> Requires immediate action. System down or severe performance issues.</li>
          <li><strong className="text-gray-800">High:</strong> Important issue requiring prompt attention. May impact users.</li>
          <li><strong className="text-gray-700">Medium:</strong> Moderate issue. Should be addressed during business hours.</li>
          <li><strong className="text-gray-700">Low:</strong> Informational. No immediate action required.</li>
        </ul>
      </div>
    </div>
  );
}
