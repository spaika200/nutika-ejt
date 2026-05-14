import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Power, Settings, ShieldAlert, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeviceManager } from '../components/DeviceManager';

interface PriceData {
  timestamp: number;
  price: number;
}

interface Device {
  id: number;
  name: string;
  status: boolean;
  thresholdPrice: number | null;
  connectionType: string;
  description: string | null;
  connectionParams: string;
  manualOverride: boolean;
  isCritical: boolean;
}

const Dashboard = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [savings, setSavings] = useState({ totalSavingsEur: 0, totalSavingsPercentage: 0 });
  const [holidayMode, setHolidayMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDevices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const deviceRes = await fetch('http://localhost:5000/api/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (deviceRes.ok) {
        const deviceData = await deviceRes.json();
        setDevices(deviceData);
      }
    } catch (err) {
      console.error("Failed to fetch devices", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Prices
        const priceRes = await fetch('http://localhost:5000/api/prices');
        const priceData = await priceRes.json();
        
        const formattedPrices = priceData.map((p: any) => ({
          time: new Date(p.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat((p.price / 10).toFixed(2)) // Convert EUR/MWh to cents/kWh
        }));
        setPrices(formattedPrices);

        await fetchDevices();

        // Fetch Savings
        const savingsRes = await fetch('http://localhost:5000/api/savings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (savingsRes.ok) {
          const savingsData = await savingsRes.json();
          setSavings(savingsData);
        }

        // Fetch Holiday Mode
        const holidayRes = await fetch('http://localhost:5000/api/devices/holiday', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (holidayRes.ok) {
          const holidayData = await holidayRes.json();
          setHolidayMode(holidayData.isHolidayMode);
        }

      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDevice = async (id: number, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    try {
      // Optimistic update
      setDevices(devices.map(d => d.id === id ? { ...d, status: !currentStatus } : d));
      
      const res = await fetch(`http://localhost:5000/api/devices/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: !currentStatus })
      });

      if (!res.ok) {
        // Revert on failure
        setDevices(devices.map(d => d.id === id ? { ...d, status: currentStatus } : d));
        alert('Failed to toggle device');
      }
    } catch (error) {
      console.error(error);
      setDevices(devices.map(d => d.id === id ? { ...d, status: currentStatus } : d));
    }
  };

  const toggleManualOverride = async (id: number, currentOverride: boolean) => {
    const token = localStorage.getItem('token');
    try {
      setDevices(devices.map(d => d.id === id ? { ...d, manualOverride: !currentOverride } : d));
      const res = await fetch(`http://localhost:5000/api/devices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ manualOverride: !currentOverride })
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      setDevices(devices.map(d => d.id === id ? { ...d, manualOverride: currentOverride } : d));
    }
  };

  const toggleHolidayMode = async () => {
    const token = localStorage.getItem('token');
    try {
      const newStatus = !holidayMode;
      setHolidayMode(newStatus);
      const res = await fetch('http://localhost:5000/api/devices/holiday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enable: newStatus })
      });
      if (res.ok) {
        fetchDevices(); // Refetch devices since their status might have changed
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Nutika Elektrivõrgu Juhtimiskeskus
          </h1>
          <p className="text-slate-400 mt-1">Smart Power Grid Control Center</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
          <h3 className="text-slate-400 mb-2 font-medium">Current Price (cents/kWh)</h3>
          <p className="text-4xl font-bold text-white">{prices.length > 0 ? prices[12]?.price || 'N/A' : '...'}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
          <h3 className="text-slate-400 mb-2 font-medium">Estimated Savings (Week)</h3>
          <p className="text-4xl font-bold text-emerald-400">€ {savings.totalSavingsEur.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 flex flex-col justify-center items-center">
          <button 
            onClick={toggleHolidayMode}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${holidayMode ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]'} text-white`}
          >
            <ShieldAlert size={20} />
            {holidayMode ? 'Disable Holiday Mode' : 'Activate Holiday Mode'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-bold mb-6">Nord Pool 24h Forecast</h2>
          <div className="h-80">
            {loading && prices.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">Loading forecast...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prices} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} unit="c" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Heater Threshold', fill: '#ef4444', fontSize: 12 }} />
                  <Line type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Devices */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Active Devices</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1" onClick={() => setIsManageModalOpen(true)}>
              <Settings size={16} /> Manage
            </button>
          </div>
          
          <div className="space-y-4">
            {devices.length === 0 && !loading && (
              <p className="text-slate-400 text-sm">No devices found.</p>
            )}
            {devices.map(device => (
              <DeviceCard 
                key={device.id}
                name={device.name} 
                status={device.status} 
                threshold={device.thresholdPrice ? `${device.thresholdPrice} EUR/MWh` : 'Manual'} 
                type={device.connectionType} 
                isOverridden={device.manualOverride}
                onToggle={() => toggleDevice(device.id, device.status)}
                onOverrideToggle={(e) => { e.stopPropagation(); toggleManualOverride(device.id, device.manualOverride); }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <DeviceManager 
        isOpen={isManageModalOpen} 
        onClose={() => setIsManageModalOpen(false)} 
        devices={devices}
        onDeviceAdded={fetchDevices}
        onDeviceDeleted={fetchDevices}
      />
    </div>
  );
};

const DeviceCard = ({ name, status, threshold, type, isOverridden, onToggle, onOverrideToggle }: { name: string, status: boolean, threshold: string, type: string, isOverridden: boolean, onToggle: () => void, onOverrideToggle: (e: any) => void }) => (
  <div 
    onClick={onToggle}
    className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-between group hover:border-slate-500 transition-colors cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg transition-colors ${status ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-slate-800 text-slate-500'}`}>
          <Power size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-200">{name}</h4>
          <p className="text-xs text-slate-400">Limit: {threshold} • {type}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={`text-xs font-bold px-2 py-1 rounded transition-colors ${status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
          {status ? 'ON' : 'OFF'}
        </div>
        <button 
          onClick={onOverrideToggle}
          className={`text-[10px] px-2 py-0.5 rounded border ${isOverridden ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
        >
          {isOverridden ? 'Overridden' : 'Auto'}
        </button>
      </div>
    </div>
  </div>
);

export default Dashboard;
