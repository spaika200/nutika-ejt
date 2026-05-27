import { useEffect, useState } from 'react';
import { X, UserPlus, Shield, Trash2, Mail, Lock, AlertTriangle } from 'lucide-react';

interface User {
  id: number;
  email: string;
  role: 'MASTER' | 'STANDARD';
  isActive: boolean;
  createdAt: string;
}

interface UserManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const UserManager = ({ isOpen, onClose }: UserManagerProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New user form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MASTER' | 'STANDARD'>('STANDARD');

  const loggedInEmail = localStorage.getItem('email') || '';

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setError('');
      setSuccess('');
      setEmail('');
      setPassword('');
      setRole('STANDARD');
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    
    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      setSuccess('User created successfully');
      setEmail('');
      setPassword('');
      setRole('STANDARD');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean, userEmail: string) => {
    if (userEmail === loggedInEmail) {
      setError('You cannot deactivate your own account.');
      return;
    }
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');
      setSuccess(`User status updated`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleChangeRole = async (userId: number, currentRole: 'MASTER' | 'STANDARD', userEmail: string) => {
    if (userEmail === loggedInEmail) {
      setError('You cannot demote yourself.');
      return;
    }
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    const newRole = currentRole === 'MASTER' ? 'STANDARD' : 'MASTER';
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user role');
      setSuccess(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (userEmail === loggedInEmail) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user ${userEmail}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-500" size={24} />
            <h2 className="text-2xl font-bold text-slate-100">User Master</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Alerts */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-sm animate-fade-in">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl text-sm animate-fade-in">
            <span>{success}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
          {/* User List Panel (Left 3 columns) */}
          <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">All Accounts</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {loading && users.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Loading accounts...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No users found.</div>
              ) : (
                users.map(user => {
                  const isSelf = user.email === loggedInEmail;
                  return (
                    <div key={user.id} className={`p-4 rounded-xl border transition-all ${isSelf ? 'bg-indigo-950/20 border-indigo-500/40' : 'bg-slate-900 border-slate-700/60'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 text-sm break-all">{user.email}</span>
                            {isSelf && (
                              <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {/* Role Tag */}
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${user.role === 'MASTER' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
                              {user.role}
                            </span>
                            {/* Status Tag */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                              {user.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </div>
                        </div>

                        {/* Administrative Controls */}
                        <div className="flex items-center gap-2">
                          {/* Role Switcher */}
                          <button
                            onClick={() => handleChangeRole(user.id, user.role, user.email)}
                            disabled={isSelf}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${isSelf ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'}`}
                            title={isSelf ? 'Cannot demote self' : 'Toggle role'}
                          >
                            Change Role
                          </button>

                          {/* Deactivation Toggle */}
                          <button
                            onClick={() => handleToggleActive(user.id, user.isActive, user.email)}
                            disabled={isSelf}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${isSelf ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500' : user.isActive ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
                            title={isSelf ? 'Cannot deactivate self' : user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg border transition-all ${isSelf ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500' : 'bg-slate-800 border-slate-700 hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400'}`}
                            title={isSelf ? 'Cannot delete self' : 'Delete user'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Create User Panel (Right 2 columns) */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-700/60 p-5 rounded-2xl flex flex-col justify-between">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                <UserPlus className="text-emerald-400" size={18} />
                <h3 className="font-semibold text-slate-200 text-sm">Add New Account</h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@nutika.ee"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Lock size={12} /> Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  Role Permission
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                >
                  <option value="STANDARD">STANDARD (Own devices only)</option>
                  <option value="MASTER">MASTER (Full system control)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md text-sm"
              >
                Create Account
              </button>
            </form>

            <div className="text-[11px] text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-400 block mb-1">Authorization Details</span>
              New users created as STANDARD can only register/control their own devices. New MASTER users will have immediate access to all devices, reports, and this User Master manager.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
