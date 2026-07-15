'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, ShieldCheck, FileCheck, AlertCircle, Clock, Trash2, X } from 'lucide-react';

interface ComplianceDoc {
  id: number;
  document_name: string;
  status: string;
  expiry_date: string | null;
  file_url: string | null;
  notes: string | null;
}

export default function CompliancePage() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    document_name: '',
    status: 'Missing',
    expiry_date: '',
    file_url: '',
    notes: ''
  });

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/compliance`);
      setDocs(response.data);
    } catch (error) {
      console.error("Error fetching docs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/compliance`, formData);
      setIsModalOpen(false);
      setFormData({
        document_name: '', status: 'Missing', expiry_date: '', file_url: '', notes: ''
      });
      fetchDocs();
    } catch (error) {
      console.error("Failed to add document", error);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm('Are you sure you want to remove this document tracker?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${apiUrl}/api/compliance/${id}`);
      fetchDocs();
    } catch (error) {
      console.error("Failed to delete doc", error);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const doc = docs.find(d => d.id === id);
      if (doc) {
        await axios.put(`${apiUrl}/api/compliance/${id}`, { ...doc, status: newStatus });
        fetchDocs();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const readinessScore = docs.length === 0 ? 0 : Math.round((docs.filter(d => d.status === 'Uploaded').length / docs.length) * 100);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden">
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2">
        <h2 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-3">
          Compliance Vault
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-600/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 border border-emerald-500/30"
        >
          <Plus size={16} /> Track New Document
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-8 px-2">
        {/* Readiness Dashboard */}
        <div className="bg-[#1e2029] rounded-2xl p-8 shadow-md mb-8 flex items-center justify-between border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute -left-20 top-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white tracking-tight mb-2">Execution Readiness</h3>
            <p className="text-gray-400 text-sm">Keep your standard docs updated to easily pass eligibility checks.</p>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="text-right">
              <span className="text-4xl font-bold text-white">{readinessScore}%</span>
              <span className="text-xs text-emerald-400 block uppercase tracking-widest font-bold mt-1">Ready</span>
            </div>
            <div className="w-20 h-20 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={readinessScore === 100 ? '#10b981' : '#6366f1'} strokeWidth="4" strokeDasharray={`${readinessScore}, 100`} strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : docs.length === 0 ? (
          <div className="w-full max-w-3xl mx-auto bg-[#16181f]/80 backdrop-blur-md rounded-2xl border border-white/[0.03] p-12 text-center mt-12">
            <div className="w-16 h-16 bg-[#1e2029] rounded-2xl border border-white/[0.04] shadow-md flex items-center justify-center mx-auto mb-6">
              <FileCheck size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No documents tracked yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Track essential documents like Tax Clearances, Pitch Decks, and Audited Financials to let the AI check your eligibility for grants.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium hover:bg-emerald-600/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              Track First Document
            </button>
          </div>
        ) : (
          <div className="bg-[#1e2029] rounded-2xl overflow-hidden shadow-md border border-white/[0.04]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#16181f] border-b border-white/[0.04] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="p-5 pl-8">Document Name</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Expiry Date</th>
                  <th className="p-5">Notes</th>
                  <th className="p-5 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5 pl-8 font-bold text-white text-[15px]">
                      {doc.document_name}
                    </td>
                    <td className="p-5">
                      <select 
                        value={doc.status}
                        onChange={(e) => handleStatusUpdate(doc.id, e.target.value)}
                        className={`text-[11px] uppercase tracking-widest font-bold rounded-full px-4 py-1.5 outline-none border cursor-pointer appearance-none text-center bg-[#121214]
                          ${doc.status === 'Uploaded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                            doc.status === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]'}
                        `}
                      >
                        <option className="bg-[#1e2029]" value="Missing">Missing</option>
                        <option className="bg-[#1e2029]" value="Uploaded">Uploaded</option>
                        <option className="bg-[#1e2029]" value="Expired">Expired</option>
                      </select>
                    </td>
                    <td className="p-5 text-sm text-gray-400 font-medium">
                      <div className="flex items-center gap-2">
                        {doc.expiry_date ? <><Clock size={14} className="text-[#4352ff]" /> {doc.expiry_date}</> : <span className="text-gray-600 italic">No expiry</span>}
                      </div>
                    </td>
                    <td className="p-5 text-sm text-gray-400 max-w-[200px] truncate">
                      {doc.notes || '-'}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-[#4352ff] hover:text-blue-400 transition-colors text-sm font-bold mr-6">View File</a>
                      ) : null}
                      <button 
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Delete Tracker"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16181f] rounded-3xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg tracking-wide uppercase">Track Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDoc} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Document Name *</label>
                <input required type="text" value={formData.document_name} onChange={e => setFormData({...formData, document_name: e.target.value})} className="w-full bg-[#1e2029] border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white text-sm" placeholder="E.g. Tax Clearance, Pitch Deck" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Current Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#1e2029] border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white text-sm appearance-none">
                  <option className="bg-[#1e2029]" value="Missing">Missing (Need to obtain)</option>
                  <option className="bg-[#1e2029]" value="Uploaded">Uploaded (Ready to use)</option>
                  <option className="bg-[#1e2029]" value="Expired">Expired (Need renewal)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Expiry Date (Optional)</label>
                <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full bg-[#1e2029] border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Link to File</label>
                <input type="url" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} className="w-full bg-[#1e2029] border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full bg-[#1e2029] border border-white/5 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white text-sm" placeholder="Expires every April..."></textarea>
              </div>
              
              <div className="mt-8 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-semibold hover:bg-white/5 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-600/30 rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] text-sm flex items-center gap-2">
                  <ShieldCheck size={16} /> Track Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
