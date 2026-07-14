'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Users, Building, Mail, ExternalLink, UserPlus, X, Trash2 } from 'lucide-react';

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
      case 'Strong': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">Strong</span>;
      case 'Strong': return <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">Strong</span>;
      case 'Warm': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/20">Warm</span>;
      default: return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs font-semibold rounded-full border border-gray-500/20">Cold</span>;
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-transparent">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} className="text-indigo-400" />
          Funder CRM & Network Map
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2 border border-indigo-500"
        >
          <Plus size={16} /> Add Contact
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border-dashed border border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <UserPlus size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Your network is empty</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Start adding your contacts at various funding organizations. The AI will automatically map these to live opportunities to find you warm introductions.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contacts.map(contact => (
              <div key={contact.id} className="glass-panel premium-card rounded-xl p-6 group relative bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <div className="absolute top-6 right-6 flex items-center gap-3">
                  {getStrengthBadge(contact.relationship_strength)}
                  <button 
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 p-1.5 rounded-md border border-white/5 hover:border-red-500/20"
                    title="Delete Contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg border border-indigo-500/30 shrink-0 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)]">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg tracking-tight">{contact.name}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1.5">
                      {contact.role && <span>{contact.role}</span>}
                      {contact.role && <span>@</span>}
                      <span className="font-medium text-indigo-300">{contact.organization}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail size={14} className="text-gray-500" />
                      <a href={`mailto:${contact.email}`} className="hover:text-indigo-400 transition-colors">{contact.email}</a>
                    </div>
                  )}
                  {contact.organization && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Building size={14} className="text-gray-500" />
                      {contact.organization}
                    </div>
                  )}
                  {contact.notes && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-sm text-gray-400">
                      <p className="line-clamp-2">{contact.notes}</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white text-lg">Add New Contact</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Organization (Funder) *</label>
                <input required type="text" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Strength</label>
                  <select value={formData.relationship_strength} onChange={e => setFormData({...formData, relationship_strength: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white">
                    <option className="bg-[#121214]" value="Cold">Cold</option>
                    <option className="bg-[#121214]" value="Warm">Warm</option>
                    <option className="bg-[#121214]" value="Strong">Strong</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white"></textarea>
              </div>
              
              <div className="mt-6 flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-medium hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-500 rounded-lg transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-500">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
