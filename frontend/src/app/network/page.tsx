'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Users, Building, Mail, ExternalLink, UserPlus, X, Trash2, CheckCircle2 } from 'lucide-react';

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${apiUrl}/api/contacts/${id}`);
      fetchContacts();
    } catch (error) {
      console.error("Failed to delete contact", error);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

  const getStrengthBadge = (strength: string | null) => {
    switch (strength) {
      case 'Strong': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest rounded-full">Strong</span>;
      case 'Warm': return <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-widest rounded-full">Warm</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-full">Cold</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden">
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-3">
          Contacts Network
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-2"
        >
          <Plus size={16} /> Add Contact
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-8 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center mt-12 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-6">
              <UserPlus size={24} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Your network is empty</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Start adding your contacts at various funding organizations. The AI will automatically map these to live opportunities to find you warm introductions.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contacts.map(contact => (
              <div key={contact.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all p-6 group relative">
                <div className="absolute top-6 right-6 flex items-center gap-3">
                  {getStrengthBadge(contact.relationship_strength)}
                  <button 
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100"
                    title="Delete Contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-100 shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-slate-900 text-[15px] tracking-tight">{contact.name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">
                      {contact.organization}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {contact.role && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <div className="w-5 flex justify-center"><Building size={14} className="text-slate-400" /></div>
                      {contact.role}
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-5 flex justify-center"><Mail size={14} className="text-slate-400" /></div>
                      <a href={`mailto:${contact.email}`} className="hover:text-emerald-600 transition-colors">{contact.email}</a>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="mt-5 pt-5 border-t border-slate-100 text-sm text-slate-600">
                      <p className="line-clamp-2 leading-relaxed">{contact.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Add New Contact</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-xl border border-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Full Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Organization (Funder) *</label>
                <input required type="text" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Role</label>
                  <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Strength</label>
                  <select value={formData.relationship_strength} onChange={e => setFormData({...formData, relationship_strength: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm appearance-none">
                    <option value="Cold">Cold</option>
                    <option value="Warm">Warm</option>
                    <option value="Strong">Strong</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm"></textarea>
              </div>
              
              <div className="mt-8 flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
