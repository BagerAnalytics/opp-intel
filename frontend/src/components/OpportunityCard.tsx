'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Zap, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Gift, ListChecks, FileText, Trophy, Target, AlertCircle, Plus, Users, Trash2, Sparkles } from 'lucide-react';

interface OpportunityCardProps {
  opp: {
    id: number;
    name: string;
    funder: string;
    closing_date: string | null;
    value: string;
    description: string;
    benefits: string | null;
    eligibility_criteria: string | null;
    selection_criteria: string | null;
    application_process: string | null;
    past_winners: string | null;
    match_score: number | null;
    match_reasoning: string | null;
    strategy: string | null;
    status: string;
    link: string | null;
    source?: string;
    opp_type?: string;
    target_entity?: string;
  };
  contacts?: any[];
  complianceDocs?: any[];
  onDeleteSuccess?: () => void;
}

const MatchScoreRing = ({ score }: { score: number | null }) => {
  const actualScore = score || 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (actualScore / 100) * circumference;
  
  let colorClass = "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]";
  if (actualScore < 70) colorClass = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]";
  if (actualScore < 50) colorClass = "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]";
  if (!score) colorClass = "text-slate-200 drop-shadow-none";

  return (
    <div className="relative flex items-center justify-center w-[64px] h-[64px]">
      <div className="absolute inset-0 bg-white rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"></div>
      <svg className="transform -rotate-90 w-full h-full relative z-10" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} className="stroke-slate-100" strokeWidth="4" fill="none" />
        <circle 
          cx="28" cy="28" r={radius} 
          className={colorClass} 
          stroke="currentColor"
          strokeWidth="4.5" 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center z-20">
        <span className="text-[15px] font-extrabold text-slate-900 tracking-tight">{score ? `${score}%` : 'N/A'}</span>
      </div>
    </div>
  );
};

export default function OpportunityCard({ opp: initialOpp, contacts = [], complianceDocs = [], onDeleteSuccess }: OpportunityCardProps) {
  const [opp, setOpp] = useState(initialOpp);
  const [isScoring, setIsScoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scoreData, setScoreData] = useState<{score: number | null, reasoning: string | null, strategy: string | null}>({
    score: opp.match_score,
    reasoning: opp.match_reasoning,
    strategy: opp.strategy
  });

  React.useEffect(() => {
    setOpp(initialOpp);
    setScoreData({
      score: initialOpp.match_score,
      reasoning: initialOpp.match_reasoning,
      strategy: initialOpp.strategy
    });
  }, [initialOpp]);

  const handleScoreMatch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScoring(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/opportunities/${opp.id}/score`);
      setScoreData({
        score: response.data.match_score,
        reasoning: response.data.reasoning,
        strategy: response.data.strategy
      });
      setIsExpanded(true);
    } catch (error) {
      console.error("Failed to score opportunity", error);
    } finally {
      setIsScoring(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${apiUrl}/api/opportunities/${opp.id}`);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error("Failed to delete opportunity", error);
      alert("Failed to delete opportunity.");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasScore = scoreData.score !== null;
  const hasDeepData = [
    opp.benefits, 
    opp.eligibility_criteria, 
    opp.selection_criteria, 
    opp.application_process, 
    opp.past_winners
  ].some(str => str && str.trim().length > 0);
  const warmConnections = contacts.filter(c => c.organization?.toLowerCase().includes(opp.funder?.toLowerCase() || 'unmatchable') || opp.funder?.toLowerCase().includes(c.organization?.toLowerCase() || 'unmatchable'));

  const missingDocs = complianceDocs
    .filter(doc => doc.status !== 'Uploaded')
    .filter(doc => (opp.eligibility_criteria || '').toLowerCase().includes(doc.document_name.toLowerCase()) || 
                   (opp.application_process || '').toLowerCase().includes(doc.document_name.toLowerCase()));

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-emerald-100/50 transition-all duration-300 cursor-pointer relative group overflow-hidden
      ${missingDocs.length > 0 ? '!border-red-200 !shadow-[0_4px_24px_rgba(239,68,68,0.05)]' : ''}
    `} onClick={() => setIsExpanded(!isExpanded)}>
      
      {/* Top Bar / Summary */}
      <div className="p-7 flex flex-col md:flex-row gap-6 justify-between items-start relative z-10">
        
        <div className="flex-1 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight group-hover:text-emerald-700 transition-colors">{opp.name}</h3>
                {(opp.source === 'Manual Entry' || opp.source === 'Smart Link Extraction') && (
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 z-20"
                    title="Delete manually added opportunity"
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[13px] text-emerald-600 uppercase tracking-widest font-bold">{opp.funder}</p>
                {opp.opp_type && (
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                    opp.opp_type === 'Grant' ? 'bg-purple-100 text-purple-700' :
                    opp.opp_type === 'Tender' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {opp.opp_type}
                  </span>
                )}
                {opp.target_entity && (
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                    opp.target_entity === 'Premier Agric' ? 'bg-emerald-100 text-emerald-700' :
                    opp.target_entity === 'Badger Analytics' ? 'bg-sky-100 text-sky-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {opp.target_entity}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <p className="text-slate-400 text-[10px] mb-1.5 font-bold tracking-widest uppercase">AI Fit</p>
              <MatchScoreRing score={scoreData.score} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50">
              <p className="text-slate-400 text-[10px] mb-1 font-bold tracking-widest uppercase">Value</p>
              <p className="text-slate-900 text-[15px] font-extrabold">{opp.value || '$---'}</p>
            </div>
            <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50">
              <p className="text-slate-400 text-[10px] mb-1 font-bold tracking-widest uppercase">Deadline</p>
              <p className="text-slate-900 text-[15px] font-extrabold">{opp.closing_date || 'Open'}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              {warmConnections.length > 0 ? (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 px-4 py-3 rounded-2xl flex items-center gap-3 w-full shadow-[inset_0_2px_10px_rgba(255,255,255,1)]">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <div>
                    <p className="text-emerald-600 text-[10px] font-bold tracking-widest uppercase mb-0.5">Warm Connection</p>
                    <p className="text-slate-900 text-[13px] font-extrabold">{warmConnections[0].name}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 border border-slate-100/50 px-4 py-3 rounded-2xl flex items-center gap-3 w-full">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Users size={14} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold">No warm connections found</p>
                </div>
              )}
            </div>
          </div>
            
          <p className={`text-slate-600 text-[15px] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {opp.description || "No description provided."}
          </p>
          
          {missingDocs.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-[13px] font-bold border border-red-100/50 shadow-sm shadow-red-100/50">
              <AlertCircle size={16} className="text-red-500" />
              Missing Docs: <span className="font-medium">{missingDocs.map(d => d.document_name).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col items-center gap-3 md:pl-8 md:border-l md:border-slate-100/50 h-full pt-2">
          {opp.status === "open" && (
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  await axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=interested`);
                  window.location.reload();
                } catch (err) {}
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-[14px] font-bold transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add to Pipeline
            </button>
          )}
          
          {opp.link ? (
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm('Do you want the AI to visit this link and extract all deep details (Benefits, Eligibility, etc.)?')) {
                  try {
                    const btn = e.currentTarget;
                    btn.innerHTML = '<span class="flex items-center justify-center gap-2 w-full"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scanning...</span>';
                    btn.setAttribute('disabled', 'true');
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    
                    await axios.post(`${apiUrl}/api/opportunities/${opp.id}/re-extract`, {}, { timeout: 110000 });
                    
                    if (onDeleteSuccess) onDeleteSuccess(); 
                  } catch (error) {
                    const btn = e.currentTarget;
                    btn.removeAttribute('disabled');
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg> Smart Scan Details';
                    alert('Failed to extract details. The AI might be blocked by the website or the connection timed out.');
                  }
                }
              }}
              className="w-full px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border mt-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-sm hover:scale-[1.02]"
              title="Automatically extract details and score fit"
            >
              <Sparkles size={18} className="text-emerald-500" />
              Smart Scan Details
            </button>
          ) : (
            <button 
              onClick={handleScoreMatch}
              disabled={isScoring}
              className={`w-full px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 flex items-center justify-center gap-2 border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:scale-[1.02] mt-2`}
            >
              {isScoring ? (
                <><Loader2 size={18} className="animate-spin text-emerald-600" /> Analyzing...</>
              ) : hasScore ? (
                <><Zap size={18} className="text-yellow-500 drop-shadow-sm" /> Re-Analyze Fit</>
              ) : (
                <><Zap size={18} className="text-yellow-500 drop-shadow-sm" /> Score Fit</>
              )}
            </button>
          )}
          <button className="p-3 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors self-start md:self-center mt-3 relative z-10 group-hover:bg-slate-50">
            {isExpanded ? <ChevronUp size={22} strokeWidth={2.5} /> : <ChevronDown size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Expanded Deep Data Section */}
      <div className={`transition-all duration-500 ease-in-out origin-top ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="border-t border-slate-100/60 p-7 bg-slate-50/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          
          {hasScore && scoreData.reasoning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white text-[15px] leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2.5 mb-4 text-emerald-700 font-extrabold text-[12px] uppercase tracking-widest">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Zap size={16} className="text-emerald-500" strokeWidth={3} />
                  </div>
                  AI Match Reasoning
                </div>
                <p className="text-slate-600">{scoreData.reasoning}</p>
              </div>
              {scoreData.strategy && (
               <div className="p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white text-[15px] leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2.5 mb-4 text-blue-700 font-extrabold text-[12px] uppercase tracking-widest">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <Target size={16} className="text-blue-500" strokeWidth={3} />
                    </div>
                    Strategy
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap">{scoreData.strategy}</p>
                </div>
              )}
            </div>
          )}

          {hasDeepData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {opp.benefits && (
                <div className="space-y-3 p-5 rounded-2xl hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-3 text-slate-900 font-extrabold text-[15px]">
                    <div className="p-2 bg-emerald-100/50 rounded-xl">
                      <Gift size={18} className="text-emerald-600" strokeWidth={2.5} />
                    </div>
                    Benefits
                  </div>
                  <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap pl-[52px]">{opp.benefits}</div>
                </div>
              )}
              
              {opp.eligibility_criteria && (
               <div className="space-y-3 p-5 rounded-2xl hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-3 text-slate-900 font-extrabold text-[15px]">
                    <div className="p-2 bg-blue-100/50 rounded-xl">
                      <ListChecks size={18} className="text-blue-600" strokeWidth={2.5} />
                    </div>
                    Eligibility
                  </div>
                  <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap pl-[52px]">{opp.eligibility_criteria}</div>
                </div>
              )}

              {opp.selection_criteria && (
                <div className="space-y-3 p-5 rounded-2xl hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-3 text-slate-900 font-extrabold text-[15px]">
                    <div className="p-2 bg-amber-100/50 rounded-xl">
                      <Target size={18} className="text-amber-600" strokeWidth={2.5} />
                    </div>
                    Selection Criteria
                  </div>
                  <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap pl-[52px]">{opp.selection_criteria}</div>
                </div>
              )}

              {opp.application_process && (
                <div className="space-y-3 p-5 rounded-2xl hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-3 text-slate-900 font-extrabold text-[15px]">
                    <div className="p-2 bg-purple-100/50 rounded-xl">
                      <FileText size={18} className="text-purple-600" strokeWidth={2.5} />
                    </div>
                    How to Apply
                  </div>
                  <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap pl-[52px]">{opp.application_process}</div>
                </div>
              )}

              {opp.past_winners && (
                <div className="space-y-3 p-5 rounded-2xl hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-3 text-slate-900 font-extrabold text-[15px]">
                    <div className="p-2 bg-rose-100/50 rounded-xl">
                      <Trophy size={18} className="text-rose-600" strokeWidth={2.5} />
                    </div>
                    Past Winners
                  </div>
                  <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap pl-[52px]">{opp.past_winners}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-white/40 rounded-3xl border border-dashed border-slate-200">
              <div className="text-[15px] text-slate-500 italic text-center">
                Deep data has not been scraped for this historical record. Please click the Smart Scan button at the top to automatically extract the information.
              </div>
            </div>
          )}

          {opp.link && (
            <div className="mt-8 pt-6 border-t border-slate-200/60 flex justify-end">
              <a 
                href={opp.link} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.2)] hover:-translate-y-0.5"
              >
                Apply Now <ExternalLink size={18} strokeWidth={2.5} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
