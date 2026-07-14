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
    <div className="flex-1 overflow-auto bg-[#f8faf9]">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <ShieldCheck size={20} className="text-green-600" />
          Compliance & Document Vault
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Track New Document
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Readiness Dashboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Execution Readiness</h3>
            <p className="text-gray-500 text-sm mt-1">Keep your standard docs updated to easily pass eligibility checks.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-3xl font-bold text-gray-900">{readinessScore}%</span>
              <span className="text-sm text-gray-500 block uppercase tracking-wider font-medium">Ready</span>
            </div>
            <div className="w-24 h-24 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={readinessScore === 100 ? '#10b981' : '#3b82f6'} strokeWidth="4" strokeDasharray={`${readinessScore}, 100`} />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents tracked yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Track essential documents like Tax Clearances, Pitch Decks, and Audited Financials to let the AI check your eligibility for grants.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              Track First Document
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 pl-6">Document Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-gray-900">
                      {doc.document_name}
                    </td>
                    <td className="p-4">
                      <select 
                        value={doc.status}
                        onChange={(e) => handleStatusUpdate(doc.id, e.target.value)}
                        className={`text-sm font-bold rounded-full px-3 py-1 outline-none border cursor-pointer appearance-none text-center
                          ${doc.status === 'Uploaded' ? 'bg-green-50 text-green-700 border-green-200' : 
                            doc.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-yellow-50 text-yellow-700 border-yellow-200'}
                        `}
                      >
                        <option value="Missing">Missing</option>
                        <option value="Uploaded">Uploaded</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        {doc.expiry_date ? <><Clock size={14} className="text-gray-400" /> {doc.expiry_date}</> : <span className="text-gray-400 italic">No expiry</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {doc.notes || '-'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium mr-4">View File</a>
                      ) : null}
                      <button 
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Track Compliance Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDoc} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input required type="text" value={formData.document_name} onChange={e => setFormData({...formData, document_name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" placeholder="E.g. Tax Clearance, Pitch Deck" />
                <p className="text-xs text-gray-500 mt-1">Name it exactly as grants typically ask for it.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white">
                  <option value="Missing">Missing (Need to obtain)</option>
                  <option value="Uploaded">Uploaded (Ready to use)</option>
                  <option value="Expired">Expired (Need renewal)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to File (Google Drive, Dropbox, etc.)</label>
                <input type="url" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" placeholder="Expires every April..."></textarea>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
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
