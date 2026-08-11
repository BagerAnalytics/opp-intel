'use client';

import React, { useState, useEffect } from 'react';
import { User, Users, Database, CreditCard, Shield, Key, Bell, CheckCircle2, ChevronRight, Activity, Plus, Search, MoreVertical, Zap, Loader2 } from 'lucide-react';
import axios from 'axios';

type TabType = 'profile' | 'team' | 'engine' | 'billing';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://opp-intel-production.up.railway.app');

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ theme: 'light', ai_threshold: 80, email_notifications: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem('oppintel_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setProfileData({ name: user.name || '', email: user.email || '' });
          
          // Fetch settings
          const settingsRes = await axios.get(`${apiUrl}/api/settings/${user.id}`);
          setSettings(settingsRes.data);
          
          // Fetch team
          const teamRes = await axios.get(`${apiUrl}/api/users`);
          setTeamMembers(teamRes.data);
        }
      } catch (err) {
        console.error("Error loading settings data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await axios.post(`${apiUrl}/api/settings/${currentUser.id}`, { [key]: value });
    } catch (err) {
      console.error("Failed to update setting", err);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const res = await axios.put(`${apiUrl}/api/users/${currentUser.id}`, {
        full_name: profileData.name,
        email: profileData.email
      });
      const updatedUser = { ...currentUser, name: res.data.name, email: res.data.email };
      setCurrentUser(updatedUser);
      localStorage.setItem('oppintel_user', JSON.stringify(updatedUser));
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!currentUser) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${apiUrl}/api/users/${currentUser.id}`, {
        password: passwordData.newPassword
      });
      setIsEditingPassword(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      alert("Password updated successfully!");
    } catch (err) {
      console.error("Failed to update password", err);
      alert("Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-6">Profile & Account</h2>
            
            <div className="flex items-center gap-8 mb-10 pb-10 border-b border-slate-100">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl gradient-accent flex items-center justify-center text-3xl font-semibold shadow-lg shadow-sm">
                  {currentUser?.name?.substring(0,2).toUpperCase() || 'US'}
                </div>
                <button className="absolute -bottom-3 -right-3 w-10 h-10 glass-panel rounded-3xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-gradient transition-colors">
                  <User size={18} strokeWidth={2.5} />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{currentUser?.name || 'User'}</h3>
                <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">{currentUser?.role || 'User'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full bg-white/40 backdrop-blur-md border border-slate-200 px-5 py-3 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full bg-white/40 backdrop-blur-md border border-slate-200 px-5 py-3 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" 
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button 
                  onClick={updateProfile}
                  disabled={saving}
                  className="px-6 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest mb-6">Security</h3>
              <div className="flex flex-col p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-slate-200 mb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-500">
                      <Key size={18} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">Password</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Change your account password.</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditingPassword(!isEditingPassword)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors">
                    {isEditingPassword ? "Cancel" : "Change Password"}
                  </button>
                </div>
                {isEditingPassword && (
                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                      <input 
                        type="password" 
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-slate-400" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                      <input 
                        type="password" 
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-slate-400" 
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button 
                        onClick={updatePassword}
                        disabled={saving || !passwordData.newPassword}
                        className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save New Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-500">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Two-Factor Authentication</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Secure your account with 2FA.</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Team Management</h2>
                <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Manage access & roles</p>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 gradient-accent text-sm font-medium rounded-xl shadow-md shadow-sm hover:bg-indigo-700 transition-colors">
                <Plus size={16} strokeWidth={2.5} /> Invite Member
              </button>
            </div>

            <div className="border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/20 backdrop-blur-md border-b border-slate-200">
                    <th className="py-4 px-6 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">User</th>
                    <th className="py-4 px-6 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="py-4 px-6 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/20 backdrop-blur-md/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-sm ${user.role === 'Admin' ? 'gradient-accent' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {user.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-xs font-medium text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{user.role}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 w-max">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'engine':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="w-14 h-14 bg-indigo-50 text-gradient rounded-2xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Scraping Engine</h2>
                <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Configure Data Ingestion</p>
              </div>
              {saving && <Loader2 className="ml-auto animate-spin text-slate-300 w-5 h-5" />}
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white border border-slate-200 rounded-[24px] shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Email Notifications</h3>
                  <p className="text-sm text-slate-500 font-medium">Get alerted when high-match opportunities are found.</p>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${settings.email_notifications ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  onClick={() => updateSetting('email_notifications', !settings.email_notifications)}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.email_notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-[24px] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Target Data Sources</h3>
                    <p className="text-sm text-slate-500 font-medium">Active websites currently being monitored.</p>
                  </div>
                  <button className="text-sm font-medium text-gradient hover:text-indigo-700 flex items-center gap-1">
                    <Plus size={16} /> Add Source
                  </button>
                </div>
                
                <div className="space-y-3">
                  {['Grants.gov', 'EU Funding Tenders', 'Africa Innovates Hub'].map((source, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/20 backdrop-blur-md rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-slate-700">{source}</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Monitoring Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-8">Billing & Subscription</h2>
            
            <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Zap size={120} />
              </div>
              <div className="relative z-10">
                <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-semibold uppercase tracking-widest mb-6 inline-block">Current Plan</span>
                <h3 className="text-3xl font-semibold mb-2">Enterprise Intelligence</h3>
                <p className="text-slate-400 text-sm font-medium mb-8 max-w-sm">Unlimited API calls, dedicated scraping targets, and advanced geospatial mapping.</p>
                
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-semibold">$499</span>
                  <span className="text-slate-400 font-medium mb-1">/ month</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl border border-slate-200 flex items-center justify-center">
                    <CreditCard size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Mastercard ending in 4242</h4>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Expires 12/28</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/20 backdrop-blur-md border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors">
                  Update
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'engine', label: 'Scraping Engine', icon: Database },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] bg-white/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto w-full p-10 flex gap-10">
        
        {/* LEFT NAV PANEL */}
        <div className="w-72 shrink-0">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mb-8">Settings</h1>
          <div className="flex flex-col gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-white shadow-[0_8px_24px_rgb(0,0,0,0.04)] border border-slate-100' 
                      : 'hover:bg-slate-100/50 border border-transparent text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-gradient' : 'text-slate-400'}`}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className={`font-medium text-sm ${isActive ? 'text-slate-800' : ''}`}>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} className="text-slate-300" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="flex-1">
          <div className="glass-panel rounded-3xl border border-slate-100 min-h-[600px] p-12">
            {renderContent()}
          </div>
        </div>

      </div>
    </div>
  );
}
