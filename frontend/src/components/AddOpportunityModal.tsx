'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, Link as LinkIcon, FileText, Sparkles } from 'lucide-react';

interface AddOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOpportunityModal({ isOpen, onClose, onSuccess }: AddOpportunityModalProps) {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'bulk'>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    funder: '',
    value: '',
    closing_date: '',
    link: '',
    opp_type: 'Grant',
    target_entity: 'Both',
    description: '',
    benefits: '',
    eligibility_criteria: '',
    selection_criteria: '',
    application_process: '',
    past_winners: ''
  });

  if (!isOpen) return null;

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/opportunities/manual`, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding opportunity manually", error);
      if (error.response?.status === 409 || error.response?.data?.detail?.includes("already exists")) {
        alert("Link already exists! This opportunity has already been uploaded.");
      } else {
        alert("Failed to add opportunity manually. Check console for details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/opportunities/extract-link`, { url: urlInput });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error auto-extracting opportunity", error);
      if (error.response?.status === 409 || error.response?.status === 500 && error.response?.data?.detail?.includes("already exists")) {
        alert("Link already exists! This opportunity has already been uploaded.");
      } else {
        alert("AI Extraction failed. The link might be protected or unreadable. Try manual entry.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrlsInput) return;
    const urls = bulkUrlsInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) {
      alert("Please enter valid URLs starting with http.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/opportunities/bulk-import`, { urls });
      alert(response.data.message);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error bulk extracting", error);
      alert("Failed to start bulk import. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Add Opportunity
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('auto')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'auto' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Sparkles size={18} />
            Smart Auto-Extract
          </button>
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'bulk' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Sparkles size={18} />
            Bulk Import
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'manual' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText size={18} />
            Manual Entry
          </button>
        </div>
        
        <div className="overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'auto' ? (
             <form id="auto-opp-form" onSubmit={handleAutoExtract} className="space-y-6 max-w-2xl mx-auto py-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="text-emerald-600 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Paste a link to any opportunity</h3>
                  <p className="text-slate-500 mt-2">Our AI will visit the page, read the contents, extract all necessary details, and generate a Match Score and Strategy automatically.</p>
                </div>
                
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LinkIcon className="text-slate-400" size={20} />
                    </div>
                    <input 
                      required 
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-lg shadow-sm" 
                      placeholder="https://example.com/grant-opportunity" 
                    />
                  </div>
                </div>
              </form>
          ) : activeTab === 'bulk' ? (
              <form id="bulk-opp-form" onSubmit={handleBulkImport} className="space-y-6 max-w-2xl mx-auto py-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="text-blue-600 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Bulk Import Opportunities</h3>
                  <p className="text-slate-500 mt-2">Paste multiple links below (one per line). We will instantly queue them up and run the AI crawler on all of them securely in the background!</p>
                </div>
                
                <div>
                  <div className="relative">
                    <textarea 
                      required 
                      value={bulkUrlsInput}
                      onChange={(e) => setBulkUrlsInput(e.target.value)}
                      disabled={isSubmitting}
                      rows={8}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm shadow-sm font-mono custom-scrollbar" 
                      placeholder={"https://example.com/grant-opportunity\nhttps://opportunitydesk.org/...\nhttps://etenders.gov.za/..."} 
                    />
                  </div>
                </div>
              </form>
          ) : (
            <form id="add-opp-form" onSubmit={handleManualSubmit} className="space-y-8">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Opportunity Name *</label>
                    <input required name="name" value={formData.name} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="e.g. Google AI Impact Grant" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Funder / Organization</label>
                    <input name="funder" value={formData.funder} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="e.g. Google.org" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Value / Funding Amount</label>
                    <input name="value" value={formData.value} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="e.g. $100,000" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Closing Date</label>
                    <input name="closing_date" value={formData.closing_date} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="e.g. October 15, 2026 or Open" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Application Link</label>
                    <input name="link" type="url" value={formData.link} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="https://" />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Categorization */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Categorization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Opportunity Type</label>
                    <select name="opp_type" value={formData.opp_type} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white">
                      <option value="Grant">Grant</option>
                      <option value="Tender">Tender</option>
                      <option value="Award">Award</option>
                      <option value="Other">Other / Fellowship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target Entity</label>
                    <select name="target_entity" value={formData.target_entity} onChange={handleManualChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white">
                      <option value="Premier Agric">Premier Agric</option>
                      <option value="Badger Analytics">Badger Analytics</option>
                      <option value="Both">Both (General)</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Deep Details */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  Deep Details (AI Context)
                </h3>
                <p className="text-sm text-slate-500 mb-6">The AI Matcher algorithm will read these fields to automatically generate a Match Score and Strategy upon submission.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Summary *</label>
                    <textarea required name="description" value={formData.description} onChange={handleManualChange} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="Detailed description of the opportunity..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Eligibility Criteria</label>
                    <textarea name="eligibility_criteria" value={formData.eligibility_criteria} onChange={handleManualChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="Who can apply? Requirements?" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Benefits / What you get</label>
                    <textarea name="benefits" value={formData.benefits} onChange={handleManualChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="Funding, mentorship, resources..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Selection Criteria</label>
                    <textarea name="selection_criteria" value={formData.selection_criteria} onChange={handleManualChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="How do they choose the winners?" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Application Process</label>
                    <textarea name="application_process" value={formData.application_process} onChange={handleManualChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="Steps to apply..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Past Winners (if known)</label>
                    <textarea name="past_winners" value={formData.past_winners} onChange={handleManualChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" placeholder="Provide context of previous winners..." />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form={activeTab === 'auto' ? "auto-opp-form" : activeTab === 'bulk' ? "bulk-opp-form" : "add-opp-form"}
            disabled={isSubmitting}
            className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              isSubmitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 hover:-translate-y-0.5'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {activeTab === 'bulk' ? 'Queueing...' : 'Processing...'}
              </>
            ) : (
              activeTab === 'auto' ? 'Extract with AI' : activeTab === 'bulk' ? 'Start Bulk Import' : 'Save Opportunity'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
