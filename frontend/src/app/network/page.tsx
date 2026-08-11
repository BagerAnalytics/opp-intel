'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Filter, MoreHorizontal, Building, Mail, Link as LinkIcon, UserPlus, X, Trash2, CheckCircle2, Target } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  organization: string;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  relationship_strength: string | null;
  notes: string | null;
}

export default function NetworkPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    role: '',
    email: '',
    linkedin_url: '',
    relationship_strength: 'Cold',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      const response = await axios.get(`${apiUrl}/api/contacts`).catch(() => ({ data: [] }));
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this target?')) return;
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.delete(`${apiUrl}/api/contacts/${id}`);
      fetchContacts();
    } catch (error) {
      console.error("Failed to delete contact", error);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.post(`${apiUrl}/api/contacts`, formData);
      setIsModalOpen(false);
      setFormData({
        name: '', organization: '', role: '', email: '', 
        linkedin_url: '', relationship_strength: 'Cold', notes: ''
      });
      fetchContacts();
    } catch (error) {
      console.error("Failed to add contact", error);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || c.relationship_strength === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] bg-[#f5f7fa] overflow-hidden animate-in fade-in duration-300">
      
      {/* MASSIVE SEARCH & FILTER HEADER (Figma Jobie Style) */}
      <div className="bg-white rounded-b-[40px] px-12 py-10 shadow-[0_12px_40px_rgb(0,0,0,0.03)] z-10 shrink-0 border-b border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Targets & Entities</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm font-medium gradient-accent px-5 py-2.5 rounded-2xl shadow-lg shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <UserPlus size={16} /> Add Target
          </button>
        </div>

        {/* Search Bar Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white border-2 border-slate-100 rounded-3xl flex items-center shadow-sm overflow-hidden focus-within:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 pl-6 pr-4 py-4 border-r border-slate-100 shrink-0">
              <MapPin size={18} className="text-gradient" />
              <span className="text-sm font-medium text-slate-600">Global Search</span>
            </div>
            <div className="flex-1 flex items-center px-4">
              <Search size={18} className="text-slate-400 mr-3" />
              <input 
                type="text" 
                placeholder="Search by Target Name, Organization, or keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder-slate-400"
              />
            </div>
            <button className="flex items-center gap-2 text-slate-500 px-6 font-medium text-sm hover:text-indigo-600 transition-colors border-l border-slate-100 h-full">
              <Filter size={16} /> FILTER
            </button>
            <button className="gradient-accent font-medium text-sm px-10 h-full py-4 transition-colors flex items-center justify-center shadow-inner shrink-0">
              FIND
            </button>
          </div>
        </div>

        {/* Suggestion Pills */}
        <div className="flex items-center gap-4 mt-8">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mr-2">Suggestions</span>
          {['All', 'Strong', 'Warm', 'Cold'].map(filter => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === filter ? 'gradient-accent shadow-md' : 'bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100/50'}`}
            >
              {filter === 'All' ? 'Your Network' : `${filter} Leads`}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID CONTENT */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* FADE GRADIENT FOR SMOOTH SCROLLING */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#f5f7fa] to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto px-12 py-10">
        
        {/* Results Counter & Toggles */}
        <div className="flex justify-between items-center mb-10">
          <p className="text-sm font-semibold text-slate-800">
            Showing {(currentPage - 1) * 6 + 1}-{Math.min(currentPage * 6, filteredContacts.length)} of {filteredContacts.length} Network Targets
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Based on your filters</span>
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Pipeline</span>
              <div className="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Sort by:</span>
              <button className="text-sm font-medium text-slate-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Newest <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF]"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="w-full bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Target size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No targets found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search filters or add a new target entity.</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
              {filteredContacts.slice((currentPage - 1) * 6, currentPage * 6).map(contact => (
                <div key={contact.id} className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full">
                
                {/* Delete Button (Hover) */}
                <button 
                  onClick={() => handleDeleteContact(contact.id)}
                  className="absolute top-6 right-6 w-8 h-8 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <Trash2 size={14} />
                </button>

                {/* Card Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f5f7fa] flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.organization)}&background=f5f7fa&color=3f20b3&font-size=0.4&rounded=false&bold=true`}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="pr-8">
                    <h3 className="font-medium text-sm text-slate-400 mb-1">{contact.organization}</h3>
                    <h2 className="font-semibold text-slate-800 text-lg leading-tight line-clamp-1 group-hover:text-gradient transition-colors">{contact.name}</h2>
                  </div>
                </div>

                {/* Role / Value */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gradient flex items-center gap-2">
                    <Building size={14} /> {contact.role || 'Strategic Target'}
                  </p>
                </div>

                {/* Description / Notes */}
                <div className="mb-8 flex-1">
                  <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">
                    {contact.notes || 'No specific strategy notes or background information has been recorded for this contact yet.'}
                  </p>
                </div>

                {/* Footer Pill & Location */}
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest ${
                    contact.relationship_strength === 'Strong' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                    contact.relationship_strength === 'Warm' ? 'bg-orange-50 text-orange-600 border border-orange-100/50' :
                    'bg-indigo-50 text-gradient border border-indigo-100/50'
                  }`}>
                    {contact.relationship_strength || 'Cold'} Lead
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 hover:bg-[#007AFF] hover:text-white transition-all shadow-sm">
                        <Mail size={14} />
                      </a>
                    )}
                    {contact.linkedin_url && (
                      <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 hover:bg-[#007AFF] hover:text-white transition-all shadow-sm">
                        <LinkIcon size={14} />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            ))}
            </div>

            {/* PAGINATION */}
            {filteredContacts.length > 6 && (
              <div className="mt-auto flex items-center justify-between px-8 py-6 border-t border-slate-100 bg-white rounded-3xl shadow-sm mb-10">
                <span className="text-sm font-semibold text-slate-500">
                  Page {currentPage} of {Math.ceil(filteredContacts.length / 6)}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1 hidden md:flex">
                    {Array.from({ length: Math.ceil(filteredContacts.length / 6) }).map((_, i) => {
                      const pageNum = i + 1;
                      const totalPages = Math.ceil(filteredContacts.length / 6);
                      if (pageNum === 1 || pageNum === totalPages || Math.abs(currentPage - pageNum) <= 1) {
                        return (
                          <button 
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${currentPage === pageNum ? 'gradient-accent shadow-lg shadow-sm' : 'bg-white/20 backdrop-blur-md text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (Math.abs(currentPage - pageNum) === 2) {
                        return <span key={i} className="w-10 h-10 flex items-center justify-center text-slate-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredContacts.length / 6), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredContacts.length / 6)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* MODAL - Add Contact */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/20 backdrop-blur-md">
              <h3 className="font-semibold text-slate-800 text-xl tracking-tight">Add New Target</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-sm transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Target Organization *</label>
                <input required type="text" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="w-full border-b-2 border-slate-200 py-2 focus:ring-0 focus:border-[#007AFF] outline-none transition-all text-slate-800 font-semibold text-sm bg-transparent" placeholder="e.g. World Bank" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Contact Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b-2 border-slate-200 py-2 focus:ring-0 focus:border-[#007AFF] outline-none transition-all text-slate-800 font-semibold text-sm bg-transparent" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Job Role</label>
                  <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border-b-2 border-slate-200 py-2 focus:ring-0 focus:border-[#007AFF] outline-none transition-all text-slate-800 font-semibold text-sm bg-transparent" placeholder="Director" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Relationship Strength</label>
                  <select value={formData.relationship_strength} onChange={e => setFormData({...formData, relationship_strength: e.target.value})} className="w-full border-b-2 border-slate-200 py-2 focus:ring-0 focus:border-[#007AFF] outline-none transition-all text-slate-800 font-semibold text-sm bg-transparent appearance-none">
                    <option value="Cold">Cold Lead</option>
                    <option value="Warm">Warm Connection</option>
                    <option value="Strong">Strong Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-b-2 border-slate-200 py-2 focus:ring-0 focus:border-[#007AFF] outline-none transition-all text-slate-800 font-semibold text-sm bg-transparent" placeholder="john@org.com" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">Strategic Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full border-b-2 border-slate-200 py-2 focus:ring-0 focus:border-[#007AFF] outline-none transition-all text-slate-800 font-semibold text-sm bg-transparent resize-none" placeholder="Context on this relationship..."></textarea>
              </div>
              
              <div className="mt-8 pt-6">
                <button type="submit" className="w-full py-4 gradient-accent font-medium rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-sm text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Save Target Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
