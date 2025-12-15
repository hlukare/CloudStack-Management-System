import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/api';
import { TrendingUp, Brain, AlertCircle, Info, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [costTrends, setCostTrends] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, utilizationRes, costTrendsRes, insightsRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getUtilizationTrends({ days: 30 }),
        analyticsAPI.getCostTrends({ days: 30 }),
        analyticsAPI.getPerformanceInsights()
      ]);
      setOverview(overviewRes.data);
      setUtilization(utilizationRes.data);
      setCostTrends(costTrendsRes.data);
      if (insightsRes.data.anomalies) setAnomalies(insightsRes.data.anomalies);
      if (insightsRes.data.predictions) setPredictions(insightsRes.data.predictions);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">ML-powered insights and predictions</p>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total VMs</p>
                <p className="text-3xl font-bold text-gray-900">{overview.totalVMs || 0}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-gray-700" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-3xl font-bold text-gray-900">{overview.avgUtilization?.toFixed(1) || 0}%</p>
              </div>
              <Activity className="w-10 h-10 text-gray-700" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anomalies Detected</p>
                <p className="text-3xl font-bold text-orange-600">{anomalies.length || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Efficiency Score</p>
                <p className="text-3xl font-bold text-gray-900">{overview.efficiencyScore?.toFixed(0) || 0}</p>
              </div>
              <Brain className="w-10 h-10 text-gray-700" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resource Utilization Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#10b981" name="Memory" />
              <Line type="monotone" dataKey="disk" stroke="#f59e0b" name="Disk" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="cost" fill="#8b5cf6" name="Daily Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {predictions && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-gray-700" />
            ML Predictions & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictions.costForecast && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Next Month Cost Forecast</p>
                <p className="text-2xl font-bold text-gray-900">${predictions.costForecast.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Based on current trends</p>
              </div>
            )}
            {predictions.resourceNeeds && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Predicted Resource Needs</p>
                <p className="text-lg font-semibold text-gray-900">{predictions.resourceNeeds}</p>
                <p className="text-xs text-gray-500 mt-1">For next week</p>
              </div>
            )}
            {predictions.recommendation && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Top Recommendation</p>
                <p className="text-sm font-semibold text-gray-800">{predictions.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Detected Anomalies (ML-Based)
          </h3>
          <div className="space-y-3">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="border-l-4 border-gray-500 bg-gray-50 p-4 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{anomaly.vmName || 'Unknown VM'}</p>
                    <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span><strong>Metric:</strong> {anomaly.metric}</span>
                      <span><strong>Value:</strong> {anomaly.value?.toFixed(2)}</span>
                      <span><strong>Expected:</strong> {anomaly.expected?.toFixed(2)}</span>
                      <span><strong>Deviation:</strong> {anomaly.deviation?.toFixed(1)}σ</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-200 text-orange-800">
                    {anomaly.severity || 'Medium'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Understanding ML Analytics</h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-4">
          <li><strong>Anomaly Detection:</strong> Uses Isolation Forest algorithm to detect unusual patterns (&gt;3σ deviation)</li>
          <li><strong>Cost Forecasting:</strong> Random Forest Regressor trained on 365 days of historical data</li>
          <li><strong>Resource Prediction:</strong> Time-series analysis of last 12 data points (1 hour)</li>
          <li><strong>Instance Recommendations:</strong> ML classifier suggests upgrade/downgrade/keep based on usage</li>
          <li><strong>Efficiency Score:</strong> Weighted metric combining utilization, cost, and performance (0-100)</li>
        </ul>
      </div>
    </div>
  );
}
