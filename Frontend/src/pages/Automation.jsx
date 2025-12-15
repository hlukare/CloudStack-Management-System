import React, { useState, useEffect } from 'react';
import { automationAPI, vmAPI } from '../api/api';
import { Zap, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Info, Clock, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Automation() {
  const [rules, setRules] = useState([]);
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    vmId: '',
    enabled: true,
    conditions: [],
    actions: [],
    schedule: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, vmsRes] = await Promise.all([
        automationAPI.list(),
        vmAPI.list()
      ]);
      setRules(rulesRes.data);
      setVMs(vmsRes.data);
    } catch (error) {
      toast.error('Failed to fetch automation rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await automationAPI.update(editingRule._id, formData);
        toast.success('Rule updated successfully');
      } else {
        await automationAPI.create(formData);
        toast.success('Rule created successfully');
      }
      setShowModal(false);
      setEditingRule(null);
      setFormData({ name: '', vmId: '', enabled: true, conditions: [], actions: [], schedule: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save rule');
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await automationAPI.toggle(id);
      toast.success(`Rule ${enabled ? 'disabled' : 'enabled'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await automationAPI.delete(id);
      toast.success('Rule deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleExecute = async (id) => {
    try {
      await automationAPI.execute(id);
      toast.success('Rule executed successfully');
    } catch (error) {
      toast.error('Failed to execute rule');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation</h1>
          <p className="text-gray-600 mt-1">Create and manage automated VM operations</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditingRule(null); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900">No Automation Rules</p>
          <p className="text-gray-600 mt-2">Create your first rule to automate VM operations</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
            Create Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rules.map(rule => (
            <div key={rule._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>VM:</strong> {vms.find(v => v._id === rule.vmId)?.name || 'Unknown'}</p>
                    {rule.conditions && rule.conditions.length > 0 && (
                      <p><strong>Conditions:</strong> {rule.conditions.map(c => `${c.metric} ${c.operator} ${c.value}`).join(', ')}</p>
                    )}
                    {rule.actions && rule.actions.length > 0 && (
                      <p><strong>Actions:</strong> {rule.actions.join(', ')}</p>
                    )}
                    {rule.schedule && (
                      <p className="flex items-center gap-1"><Clock className="w-4 h-4" /><strong>Schedule:</strong> {rule.schedule}</p>
                    )}
                    <p><strong>Last Executed:</strong> {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleExecute(rule._id)} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" title="Execute Now">
                    <Play className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleToggle(rule._id, rule.enabled)} className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="Toggle">
                    {rule.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditingRule(rule); setFormData(rule); setShowModal(true); }} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(rule._id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingRule ? 'Edit' : 'Create'} Automation Rule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select VM</label>
                <select value={formData.vmId} onChange={(e) => setFormData({...formData, vmId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Choose VM</option>
                  {vms.map(vm => (
                    <option key={vm._id} value={vm._id}>{vm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Cron Expression - Optional)</label>
                <input type="text" value={formData.schedule} onChange={(e) => setFormData({...formData, schedule: e.target.value})} placeholder="0 18 * * *" className="w-full px-3 py-2 border rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">Example: 0 18 * * * (daily at 6 PM)</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowModal(false); setEditingRule(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Common Automation Examples</h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-4">
          <li><strong>Cost Optimization:</strong> Stop development VMs outside business hours (Mon-Fri 6PM-9AM)</li>
          <li><strong>Auto-Scaling:</strong> Start additional VMs when CPU &gt; 80% for 10 minutes</li>
          <li><strong>Maintenance:</strong> Restart VMs weekly for patching (Sunday 3 AM)</li>
          <li><strong>Backup:</strong> Create snapshots daily at midnight</li>
          <li><strong>Idle Detection:</strong> Stop VMs with CPU &lt; 5% for 2 hours</li>
        </ul>
      </div>
    </div>
  );
}
