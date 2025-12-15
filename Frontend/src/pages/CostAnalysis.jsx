import React, { useState, useEffect } from 'react';
import { costAPI } from '../api/api';
import { DollarSign, TrendingUp, TrendingDown, Info, AlertTriangle, Lightbulb, RefreshCw, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CostAnalysis() {
  const [summary, setSummary] = useState(null);
  const [detailed, setDetailed] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingCosts, setFetchingCosts] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('aws');
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));
      
      const [summaryRes, detailedRes, optimizationsRes, forecastRes] = await Promise.all([
        costAPI.getSummary({ days: timeRange }),
        costAPI.getDetailed(startDate.toISOString(), endDate.toISOString()),
        costAPI.getOptimizations(),
        costAPI.getForecast({ days: 30 })
      ]);
      setSummary(summaryRes.data);
      setDetailed(detailedRes.data);
      setOptimizations(optimizationsRes.data);
      setForecast(forecastRes.data);
      console.log('Cost Summary:', summaryRes.data);
      console.log('By Provider:', summaryRes.data?.byProvider);
    } catch (error) {
      console.error('Cost fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch cost data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderCosts = async () => {
    setFetchingCosts(true);
    try {
      let response;
      if (selectedProvider === 'aws') {
        response = await costAPI.fetchAWS();
      } else if (selectedProvider === 'azure') {
        response = await costAPI.fetchAzure();
      } else if (selectedProvider === 'gcp') {
        response = await costAPI.fetchGCP();
      }
      
      const providerName = selectedProvider.toUpperCase();
      toast.success(`${providerName} cost data fetched successfully! Refreshing...`);
      await fetchData(); // Refresh the data
    } catch (error) {
      console.error(`${selectedProvider.toUpperCase()} cost fetch error:`, error);
      const errorMessage = error.response?.data?.message || `Failed to fetch ${selectedProvider.toUpperCase()} cost data`;
      
      if (errorMessage.includes('AccessDenied') || errorMessage.includes('UnauthorizedOperation')) {
        toast.error(`Permission Error: Check your ${selectedProvider.toUpperCase()} credentials and permissions`, { duration: 8000 });
      } else if (errorMessage.includes('not subscribed') || errorMessage.includes('Cost Explorer')) {
        toast.error(`Cost tracking not enabled. Enable it in your ${selectedProvider.toUpperCase()} console`, { duration: 6000 });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setFetchingCosts(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cost Analysis</h1>
        <p className="text-gray-600">Monitor and optimize your cloud spending</p>
      </div>

      <div className="flex justify-between items-center gap-2 mb-6">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
        
        <div className="flex gap-2">
          <select 
            value={selectedProvider} 
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>
          
          <button
            onClick={fetchProviderCosts}
            disabled={fetchingCosts}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {fetchingCosts ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fetching from {selectedProvider.toUpperCase()}...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Fetch {selectedProvider.toUpperCase()} Cost Data
              </>
            )}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-3xl font-bold text-gray-900">${summary.total?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500 mt-1">Last {timeRange} days</p>
              </div>
              <DollarSign className="w-10 h-10 text-gray-700" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Daily Average</p>
                <p className="text-3xl font-bold text-gray-900">${summary.dailyAvg?.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-gray-700" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Savings</p>
                <p className="text-3xl font-bold text-gray-800">${summary.potentialSavings?.toFixed(2) || '0.00'}</p>
              </div>
              <Lightbulb className="w-10 h-10 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className={`text-3xl font-bold ${
Number(summary.trend) > 0 ? 'text-gray-700' : 'text-gray-900'}`}>
                  {Number(summary.trend) > 0 ? '+' : ''}{Number(summary.trend || 0).toFixed(1)}%
                </p>
              </div>
              {Number(summary.trend) > 0 ? <TrendingUp className="w-10 h-10 text-gray-600" /> : <TrendingDown className="w-10 h-10 text-gray-700" />}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={detailed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#3b82f6" name="Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 rounded-lg shadow p-6 border-2 border-gray-300">
          <h3 className="text-lg font-semibold mb-4">Cost by Provider</h3>
          {summary?.byProvider && summary.byProvider.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={summary.byProvider} 
                  dataKey="cost" 
                  nameKey="provider" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  label
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {summary.byProvider.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-white border-2 border-dashed border-gray-400 rounded-lg">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                <p className="text-base font-medium text-gray-700">No cost data available</p>
                <p className="text-sm mt-2 text-gray-600">Click "Fetch AWS Cost Data" button above to load billing information</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {optimizations && optimizations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-gray-600" />
            Optimization Recommendations
          </h3>
          <div className="space-y-3">
            {optimizations.map((opt, idx) => (
              <div key={idx} className="border-l-4 border-gray-500 bg-gray-50 p-4 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{opt.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                    <p className="text-sm text-gray-800 font-semibold mt-2">Potential Savings: ${opt.savings?.toFixed(2)}/month</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-200 text-gray-800">
                    {opt.priority || 'Medium'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Cost Optimization Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-4">
          <li><strong>Idle Resources:</strong> Stop or terminate unused VMs, especially in non-production environments.</li>
          <li><strong>Right-Sizing:</strong> Downgrade over-provisioned instances based on actual usage patterns.</li>
          <li><strong>Reserved Instances:</strong> Use reserved/committed instances for predictable workloads (save up to 70%).</li>
          <li><strong>Auto-Scaling:</strong> Implement auto-scaling to match resources with demand.</li>
          <li><strong>Spot Instances:</strong> Use spot/preemptible instances for fault-tolerant workloads (save up to 90%).</li>
        </ul>
      </div>
    </div>
  );
}
