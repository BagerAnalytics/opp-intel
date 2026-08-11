'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, ShieldCheck, FileText, AlertCircle, Clock, Trash2, X, UploadCloud, CheckCircle2 } from 'lucide-react';

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://opp-intel-production.up.railway.app');
      const response = await axios.get(`${apiUrl}/api/compliance`).catch(() => ({ data: [] }));
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://opp-intel-production.up.railway.app');
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://opp-intel-production.up.railway.app');
      await axios.delete(`${apiUrl}/api/compliance/${id}`);
      fetchDocs();
    } catch (error) {
      console.error("Failed to delete doc", error);
    }
  };

  const handleFileUpload = async (id: number, file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Only PDF files are supported for compliance documents.");
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://opp-intel-production.up.railway.app');
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      await axios.post(`${apiUrl}/api/compliance/${id}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDocs();
    } catch (error) {
      console.error("Failed to upload file to NAS", error);
      alert("Failed to upload file to NAS. Is the server running and Tailscale connected?");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(id, e.dataTransfer.files[0]);
    }
  };

  const readinessScore = docs.length === 0 ? 0 : Math.round((docs.filter(d => d.status === 'Uploaded').length / docs.length) * 100);
  const missingDocs = docs.filter(d => d.status === 'Missing');
  const uploadedDocs = docs.filter(d => d.status === 'Uploaded');

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] bg-white/20 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      
      <div className="max-w-7xl mx-auto w-full p-10 flex flex-col gap-10 pb-20">
        
        {/* READINESS DASHBOARD */}
        <div className="bg-white rounded-none border border-slate-200 p-10 flex flex-col md:flex-row items-center justify-between gap-12 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="2" />
                <circle 
                  cx="18" cy="18" r="16" 
                  fill="none" 
                  className={readinessScore === 100 ? "stroke-emerald-600" : "stroke-slate-800"} 
                  strokeWidth="2.5" 
                  strokeDasharray="100"
                  strokeDashoffset={100 - (readinessScore > 0 ? readinessScore : 0)}
                  strokeLinecap="square"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-slate-800 tracking-tighter">{readinessScore}%</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Audit Readiness</h2>
              <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm leading-relaxed">
                Your compliance vault tracks mandatory documentation required for tender and grant submissions.
              </p>
            </div>
          </div>

          <div className="flex-1 w-full bg-white/20 backdrop-blur-md border border-slate-200 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={18} className="text-slate-800" strokeWidth={2.5} />
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest">Status Report</h3>
            </div>
            {docs.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500 mt-2 flex items-center gap-2">
                <AlertCircle size={14} /> Vault is empty. No documents are currently being tracked.
              </p>
            ) : missingDocs.length > 0 ? (
              <p className="text-sm font-semibold text-rose-700 mt-2 flex items-center gap-2">
                <AlertCircle size={14} /> Action Required: {missingDocs.length} document{missingDocs.length > 1 ? 's are' : ' is'} missing.
              </p>
            ) : (
              <p className="text-sm font-semibold text-emerald-700 mt-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> All compliance documents are securely vault-stored and ready.
              </p>
            )}
          </div>
        </div>

        {/* VAULT CONTROLS */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-3">
            <FileText size={20} className="text-slate-400" /> Secure Documents
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Tracker
          </button>
        </div>

        {/* VAULT GRID */}
        {isLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
        ) : docs.length === 0 ? (
          <div className="border border-slate-200 bg-white p-20 text-center flex flex-col items-center">
            <ShieldCheck size={48} className="text-slate-200 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Vault is Empty</h3>
            <p className="text-slate-500 font-medium max-w-md">Add your first document tracker (e.g. Tax Clearance Certificate) to begin monitoring your compliance status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {docs.map(doc => (
              <div 
                key={doc.id} 
                className="bg-white border border-slate-200 p-6 flex flex-col relative group transition-colors hover:border-slate-300"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, doc.id)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${doc.status === 'Uploaded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {doc.status}
                  </div>
                  <button 
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-800 mb-1 leading-tight line-clamp-2">{doc.document_name}</h3>
                
                {doc.expiry_date && (
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-3">
                    <Clock size={12} /> Valid Until: {doc.expiry_date}
                  </p>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 relative">
                  {doc.status === 'Uploaded' && doc.file_url ? (
                    <a 
                      href={doc.file_url.replace('/volume1/OppIntel_NAS/', '/api/nas/')}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-white/20 backdrop-blur-md hover:bg-slate-100 border border-slate-200 text-slate-700 py-3 text-sm font-medium transition-colors"
                    >
                      <FileText size={16} /> View Document
                    </a>
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(doc.id, e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 w-full bg-white/20 backdrop-blur-md border border-dashed border-slate-300 text-slate-500 py-6 text-sm font-medium transition-colors group-hover:border-slate-400 group-hover:bg-slate-100">
                        <UploadCloud size={20} className="text-slate-400" />
                        <span className="text-xs font-medium uppercase tracking-widest">Drop PDF to Upload</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/20 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Add Document Tracker</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleAddDoc} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Document Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.document_name}
                  onChange={(e) => setFormData({...formData, document_name: e.target.value})}
                  placeholder="e.g. Tax Clearance Certificate"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-slate-200 focus:bg-white focus:border-slate-800 outline-none transition-colors font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-slate-200 focus:bg-white focus:border-slate-800 outline-none transition-colors font-semibold text-slate-800"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 font-medium hover:bg-white/20 backdrop-blur-md border border-transparent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 font-medium transition-colors"
                >
                  Create Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
