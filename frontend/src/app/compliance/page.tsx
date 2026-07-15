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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-3">
          Compliance Vault
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus size={16} /> Track New Document
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-8 px-2">
        {/* Readiness Dashboard */}
        <div className="bg-emerald-50 rounded-2xl p-8 shadow-sm mb-8 flex items-center justify-between border border-emerald-100 relative overflow-hidden">
          <div className="absolute -left-20 top-0 w-40 h-40 bg-white/40 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Execution Readiness</h3>
            <p className="text-slate-600 text-sm">Keep your standard docs updated to easily pass eligibility checks.</p>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="text-right">
              <span className="text-4xl font-bold text-emerald-900">{readinessScore}%</span>
              <span className="text-xs text-emerald-600 block uppercase tracking-widest font-bold mt-1">Ready</span>
            </div>
            <div className="w-20 h-20 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={readinessScore === 100 ? '#10b981' : '#059669'} strokeWidth="4" strokeDasharray={`${readinessScore}, 100`} strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center mt-12 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-6">
              <FileCheck size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No documents tracked yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Track essential documents like Tax Clearances, Pitch Decks, and Audited Financials to let the AI check your eligibility for grants.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              Track First Document
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-5 pl-8">Document Name</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Expiry Date</th>
                  <th className="p-5">Notes</th>
                  <th className="p-5 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-5 pl-8 font-bold text-slate-900 text-[15px]">
                      {doc.document_name}
                    </td>
                    <td className="p-5">
                      <select 
                        value={doc.status}
                        onChange={(e) => handleStatusUpdate(doc.id, e.target.value)}
                        className={`text-[11px] uppercase tracking-widest font-bold rounded-full px-4 py-1.5 outline-none border cursor-pointer appearance-none text-center
                          ${doc.status === 'Uploaded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            doc.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-100' : 
                            'bg-yellow-50 text-yellow-700 border-yellow-100'}
                        `}
                      >
                        <option value="Missing">Missing</option>
                        <option value="Uploaded">Uploaded</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </td>
                    <td className="p-5 text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        {doc.expiry_date ? <><Clock size={14} className="text-emerald-600" /> {doc.expiry_date}</> : <span className="text-slate-400 italic">No expiry</span>}
                      </div>
                    </td>
                    <td className="p-5 text-sm text-slate-600 max-w-[200px] truncate">
                      {doc.notes || '-'}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-bold mr-6">View File</a>
                      ) : null}
                      <button 
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Track Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-xl border border-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDoc} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Document Name *</label>
                <input required type="text" value={formData.document_name} onChange={e => setFormData({...formData, document_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" placeholder="E.g. Tax Clearance, Pitch Deck" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Current Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm appearance-none">
                  <option value="Missing">Missing (Need to obtain)</option>
                  <option value="Uploaded">Uploaded (Ready to use)</option>
                  <option value="Expired">Expired (Need renewal)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Expiry Date (Optional)</label>
                <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Link to File</label>
                <input type="url" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" placeholder="Expires every April..."></textarea>
              </div>
              
              <div className="mt-8 flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2">
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
