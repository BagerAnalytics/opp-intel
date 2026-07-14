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
    <div className="flex-1 overflow-auto bg-transparent">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-400" />
          Compliance & Document Vault
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-600/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 border border-emerald-500/30"
        >
          <Plus size={16} /> Track New Document
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Readiness Dashboard */}
        <div className="glass-panel rounded-xl p-6 shadow-sm mb-8 flex items-center justify-between border-emerald-500/20 relative overflow-hidden">
          <div className="absolute -left-20 top-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white">Execution Readiness</h3>
            <p className="text-gray-400 text-sm mt-1">Keep your standard docs updated to easily pass eligibility checks.</p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="text-right">
              <span className="text-3xl font-bold text-white">{readinessScore}%</span>
              <span className="text-sm text-gray-500 block uppercase tracking-wider font-medium">Ready</span>
            </div>
            <div className="w-24 h-24 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={readinessScore === 100 ? '#10b981' : '#6366f1'} strokeWidth="4" strokeDasharray={`${readinessScore}, 100`} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : docs.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border-dashed border border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <FileCheck size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No documents tracked yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Track essential documents like Tax Clearances, Pitch Decks, and Audited Financials to let the AI check your eligibility for grants.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium hover:bg-emerald-600/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              Track First Document
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-sm font-semibold text-gray-400 uppercase tracking-wider backdrop-blur-md">
                  <th className="p-4 pl-6">Document Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 pl-6 font-medium text-white">
                      {doc.document_name}
                    </td>
                    <td className="p-4">
                      <select 
                        value={doc.status}
                        onChange={(e) => handleStatusUpdate(doc.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 outline-none border cursor-pointer appearance-none text-center bg-[#121214]
                          ${doc.status === 'Uploaded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            doc.status === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}
                        `}
                      >
                        <option className="bg-[#121214]" value="Missing">Missing</option>
                        <option className="bg-[#121214]" value="Uploaded">Uploaded</option>
                        <option className="bg-[#121214]" value="Expired">Expired</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        {doc.expiry_date ? <><Clock size={14} className="text-gray-500" /> {doc.expiry_date}</> : <span className="text-gray-600 italic">No expiry</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400 max-w-[200px] truncate">
                      {doc.notes || '-'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium mr-4">View File</a>
                      ) : null}
                      <button 
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
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
          <div className="bg-[#121214] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white text-lg">Track Compliance Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDoc} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Document Name *</label>
                <input required type="text" value={formData.document_name} onChange={e => setFormData({...formData, document_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white" placeholder="E.g. Tax Clearance, Pitch Deck" />
                <p className="text-xs text-gray-500 mt-1">Name it exactly as grants typically ask for it.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white">
                  <option className="bg-[#121214]" value="Missing">Missing (Need to obtain)</option>
                  <option className="bg-[#121214]" value="Uploaded">Uploaded (Ready to use)</option>
                  <option className="bg-[#121214]" value="Expired">Expired (Need renewal)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date (Optional)</label>
                <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Link to File</label>
                <input type="url" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white" placeholder="Expires every April..."></textarea>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-medium hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-600/30 rounded-lg transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  Track Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
