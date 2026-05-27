import { useState } from 'react';
import { X, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Device {
  id: number;
  name: string;
  status: boolean;
  thresholdPrice: number | null;
  connectionType: string;
  description: string | null;
  connectionParams: string;
}

interface DeviceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onDeviceAdded: () => void;
  onDeviceDeleted: () => void;
}

export const DeviceManager = ({ isOpen, onClose, devices, onDeviceAdded, onDeviceDeleted }: DeviceManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    connectionType: 'IP',
    connectionParams: '{"ip": "192.168.1.100"}',
    thresholdPrice: '',
    isCritical: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        connectionType: formData.connectionType,
        connectionParams: JSON.parse(formData.connectionParams)
      };

      const res = await fetch(`${API_URL}/api/devices/test-connection`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        thresholdPrice: formData.thresholdPrice ? parseFloat(formData.thresholdPrice) : null,
        connectionParams: JSON.parse(formData.connectionParams)
      };

      const res = await fetch(`${API_URL}/api/devices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add device');
      }

      setIsAdding(false);
      setFormData({
        name: '', description: '', connectionType: 'IP', connectionParams: '{"ip": "192.168.1.100"}', thresholdPrice: '', isCritical: false
      });
      setTestResult(null);
      onDeviceAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/devices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        onDeviceDeleted();
      } else {
        alert('Failed to delete device');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Manage Devices</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {!isAdding ? (
            <>
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 border-dashed text-slate-300 py-4 rounded-xl transition-all mb-6"
              >
                <Plus size={20} /> Add New Device
              </button>

              <div className="space-y-4">
                {devices.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No devices configured yet.</p>
                ) : (
                  devices.map(device => (
                    <div key={device.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                          {device.status ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-slate-500" />}
                          {device.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Type: {device.connectionType} • Limit: {device.thresholdPrice ? `€${device.thresholdPrice}/MWh` : 'Manual'}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDelete(device.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleAddDevice} className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">Add New Device</h3>
              
              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                  {testResult.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Device Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Water Heater" />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Connection Type</label>
                  <select value={formData.connectionType} onChange={e => setFormData({...formData, connectionType: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="IP">IP Address</option>
                    <option value="API">API Endpoint</option>
                    <option value="MQTT">MQTT Topic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Price Threshold (€/MWh)</label>
                  <input type="number" step="0.01" value={formData.thresholdPrice} onChange={e => setFormData({...formData, thresholdPrice: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 10.50 (Leave blank for manual)" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Connection Params (JSON)</label>
                  <textarea required value={formData.connectionParams} onChange={e => setFormData({...formData, connectionParams: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm h-24" placeholder='{"ip": "192.168.1.100"}' />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <input type="checkbox" checked={formData.isCritical} onChange={e => setFormData({...formData, isCritical: e.target.checked})} className="rounded" />
                    Critical Device (stays on in Holiday Mode)
                  </label>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleTestConnection}
                disabled={testingConnection || !formData.name}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50 mb-4"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => { setIsAdding(false); setTestResult(null); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Device'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
