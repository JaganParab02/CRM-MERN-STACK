import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, MoreHorizontal, User, Clock, ChevronDown, Sparkles, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function PipelinePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiModalLead, setAiModalLead] = useState(null);
  const [aiStrategy, setAiStrategy] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const statuses = [
    { id: 'new', label: 'New', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'contacted', label: 'Contacted', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'qualified', label: 'Qualified', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { id: 'proposal', label: 'Proposal', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 'won', label: 'Won', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { id: 'lost', label: 'Lost', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axiosInstance.get('/leads');
      setLeads(response.data.leads);
    } catch (error) {
      toast.error('Failed to fetch pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      // Optimistic update
      setLeads(leads.map(l => l._id === leadId ? { ...l, status: newStatus } : l));
      await axiosInstance.patch(`/leads/${leadId}/status`, { status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
      fetchLeads(); // Revert on failure
    }
  };

  const openAIModal = async (lead) => {
    setAiModalLead(lead);
    setAiStrategy('');
    setAiLoading(true);
    try {
      const res = await axiosInstance.get(`/ai/lead-summary/${lead._id}`);
      setAiStrategy(res.data.summary);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate AI Strategy');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading pipeline...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-muted-foreground mt-1">Drag and drop leads to update their status.</p>
      </div>

      <div className="flex-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full items-start">
          {statuses.map((status) => {
            const columnLeads = leads.filter((lead) => lead.status === status.id);
            const totalValue = columnLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

            return (
              <div 
                key={status.id} 
                className="w-full flex flex-col max-h-[600px] bg-muted/40 rounded-xl border border-border"
              >
                {/* Column Header */}
                <div className={`p-3 border-b-2 rounded-t-xl flex justify-between items-center ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                  <div>
                    <h3 className={`font-bold text-sm uppercase tracking-wider ${status.color.split(' ')[2]}`}>
                      {status.label}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {columnLeads.length} leads • ₹{(totalValue / 100000).toFixed(2)}L
                    </p>
                  </div>
                  <button className="p-1 hover:bg-black/5 rounded text-muted-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  <AnimatePresence>
                    {columnLeads.length === 0 ? (
                      <div className="text-center p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm font-medium">
                        Drop leads here
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={lead._id}
                          className="bg-card p-4 rounded-lg shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-1">{lead.company}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0
                              ${lead.priority === 'high' ? 'bg-destructive/10 text-destructive' : 
                                lead.priority === 'medium' ? 'bg-warning/10 text-warning' : 
                                'bg-success/10 text-success'}`}>
                              {lead.priority?.charAt(0)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAIModal(lead);
                              }}
                              className="ml-2 p-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition"
                              title="AI Insights"
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 line-clamp-1" title={`Contact: ${lead.name}`}>
                            <User className="w-3 h-3" /> {lead.name}
                          </p>
                          <p className="text-xs flex items-center gap-1.5 line-clamp-1" title={`Assigned to: ${lead.assignedTo?.name}`}>
                            <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                              {lead.assignedTo?.name?.charAt(0) || 'U'}
                            </div> 
                            <span className="font-medium text-muted-foreground">{lead.assignedTo?.name || 'Unassigned'}</span>
                          </p>
                          
                          <div className="flex justify-between items-end mt-4 pt-3 border-t border-border/50">
                            <div className="font-bold text-sm text-foreground">
                              ₹{lead.dealValue?.toLocaleString()}
                            </div>
                            
                            {/* Quick status mover */}
                            <div className="relative">
                              <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                className={`text-xs appearance-none rounded-full py-1 pl-3 pr-7 font-bold cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${statuses.find(s => s.id === lead.status)?.color || 'bg-muted text-muted-foreground'}`}
                              >
                                {statuses.map(s => (
                                  <option key={s.id} value={s.id} className="bg-background text-foreground font-medium">
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${statuses.find(s => s.id === lead.status)?.color.split(' ')[2]}`} />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights Modal */}
      {aiModalLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-primary/5 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">AI Sales Strategy</h3>
                  <p className="text-sm text-muted-foreground">For {aiModalLead.company} ({aiModalLead.name})</p>
                </div>
              </div>
              <button onClick={() => setAiModalLead(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {aiLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground font-medium">Analyzing history & generating strategy...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{aiStrategy}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
