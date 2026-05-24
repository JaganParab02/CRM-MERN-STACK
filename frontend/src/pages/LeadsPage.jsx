import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../store/useStore';
import { X, MessageSquare, Clock, AlignLeft, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null); // For editing
  const [viewLead, setViewLead] = useState(null); // For detailed view panel
  const [activeTab, setActiveTab] = useState('details');
  const [newNote, setNewNote] = useState('');
  const [aiStrategy, setAiStrategy] = useState('');
  const [aiEmail, setAiEmail] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEmailLoading, setAiEmailLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  
  const { user } = useStore();
  const [users, setUsers] = useState([]); // For assignment
  const [leadToDelete, setLeadToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    dealValue: 0,
    source: 'other',
    priority: 'medium',
    assignedTo: '',
    description: '',
  });

  useEffect(() => {
    fetchLeads();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/leads');
      setLeads(response.data.leads);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLead) {
        await axiosInstance.put(`/leads/${selectedLead._id}`, formData);
      } else {
        await axiosInstance.post('/leads', formData);
      }
      setShowForm(false);
      setSelectedLead(null);
      resetForm();
      fetchLeads();
      toast.success(selectedLead ? 'Lead updated successfully' : 'Lead created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      designation: '',
      dealValue: 0,
      source: 'other',
      priority: 'medium',
      assignedTo: '',
      description: '',
    });
  };

  const exportToCSV = () => {
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Priority', 'Deal Value', 'Assigned To'];
    const csvRows = leads.map(lead => [
      `"${lead.name}"`, `"${lead.email}"`, `"${lead.phone}"`, `"${lead.company}"`,
      `"${lead.status}"`, `"${lead.priority}"`, lead.dealValue,
      `"${lead.assignedTo?.name || 'Unassigned'}"`
    ].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await axiosInstance.patch(`/leads/${leadId}/status`, { status: newStatus });
      fetchLeads();
      if (viewLead && viewLead._id === leadId) {
        setViewLead({...viewLead, status: newStatus});
      }
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await axiosInstance.delete(`/leads/${leadToDelete}`);
      fetchLeads();
      toast.success('Lead deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete lead');
    } finally {
      setLeadToDelete(null);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await axiosInstance.post(`/leads/${viewLead._id}/notes`, { text: newNote });
      setViewLead(res.data.lead);
      setNewNote('');
      fetchLeads(); // refresh background list
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const openLeadDetails = async (lead) => {
    try {
      const res = await axiosInstance.get(`/leads/${lead._id}`);
      setViewLead(res.data.lead);
      setActiveTab('details');
      setAiStrategy(''); // Reset AI strategy when opening a new lead
      setAiEmail('');
    } catch (error) {
      console.error(error);
    }
  };

  const generateAIStrategy = async () => {
    if (!viewLead) return;
    setAiLoading(true);
    try {
      const res = await axiosInstance.get(`/ai/lead-summary/${viewLead._id}`);
      setAiStrategy(res.data.summary);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate AI Strategy');
    } finally {
      setAiLoading(false);
    }
  };

  const draftAIEmail = async () => {
    if (!viewLead) return;
    setAiEmailLoading(true);
    try {
      const res = await axiosInstance.post(`/ai/draft-email/${viewLead._id}`);
      setAiEmail(res.data.emailDraft);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to draft email');
    } finally {
      setAiEmailLoading(false);
    }
  };

  const analyzeProbability = async () => {
    if (!viewLead) return;
    setScoringLoading(true);
    try {
      const res = await axiosInstance.post(`/ai/score-lead/${viewLead._id}`);
      setViewLead({ ...viewLead, probabilityScore: res.data.score });
      fetchLeads(); // refresh the background list
      toast.success('Probability analyzed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to calculate probability');
    } finally {
      setScoringLoading(false);
    }
  };

  return (
    <>
      <ConfirmModal 
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This will also delete all associated notes and timeline events."
      />
      <div className="p-6 max-w-full mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track your potential customers.</p>
        </div>
        <div className="space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setSelectedLead(null);
              setShowForm(true);
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition font-medium"
          >
            + New Lead
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading leads...</div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-lg shadow border">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Company</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Priority</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Deal Value</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Assigned To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => openLeadDetails(lead)}>
                  <td className="px-6 py-4 font-medium">{lead.name}</td>
                  <td className="px-6 py-4 text-sm">{lead.company}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{lead.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={lead.priority === 'high' ? 'destructive' : lead.priority === 'medium' ? 'warning' : 'success'}>
                      {lead.priority?.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                      className="px-2 py-1 border rounded bg-background text-sm font-medium"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 font-semibold">₹{lead.dealValue?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    {lead.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLeadDetails(lead);
                        setActiveTab('ai'); // Jump straight to AI tab
                      }}
                      className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition mr-2"
                      title="AI Insights"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLead(lead);
                        setFormData({
                          name: lead.name, email: lead.email, phone: lead.phone,
                          company: lead.company, designation: lead.designation,
                          dealValue: lead.dealValue, source: lead.source,
                          priority: lead.priority || 'medium', assignedTo: lead.assignedTo?._id || user.id,
                          description: lead.description,
                        });
                        setShowForm(true);
                      }}
                      className="text-primary hover:underline text-sm font-semibold mr-3"
                    >
                      Edit
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => setLeadToDelete(lead._id)} className="text-destructive hover:underline text-sm font-semibold">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewLead && (
        <div className="fixed inset-0 bg-black/20 z-50 flex justify-end">
          <div className="bg-background w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">{viewLead.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground">{viewLead.company} • ₹{viewLead.dealValue}</p>
                  {viewLead.status === 'won' ? (
                    <Badge variant="success" className="ml-2">100% Win Prob</Badge>
                  ) : viewLead.status === 'lost' ? (
                    <Badge variant="destructive" className="ml-2">0% Win Prob</Badge>
                  ) : viewLead.probabilityScore !== null && viewLead.probabilityScore !== undefined ? (
                    <Badge variant={viewLead.probabilityScore > 70 ? 'success' : viewLead.probabilityScore > 40 ? 'warning' : 'destructive'} className="ml-2">
                      {viewLead.probabilityScore}% Win Prob
                    </Badge>
                  ) : null}
                </div>
              </div>
              <button onClick={() => setViewLead(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex border-b px-6 pt-2 space-x-6">
              {[
                { id: 'details', icon: AlignLeft, label: 'Details' },
                { id: 'notes', icon: MessageSquare, label: 'Notes' },
                { id: 'timeline', icon: Clock, label: 'Timeline' },
                { id: 'ai', icon: Sparkles, label: 'AI Insights' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-semibold">{viewLead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="font-semibold">{viewLead.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className="mt-1 capitalize">{viewLead.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Priority</p>
                      <Badge variant="outline" className="mt-1 capitalize">{viewLead.priority}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Win Probability</p>
                      {viewLead.status !== 'won' && viewLead.status !== 'lost' && (
                        <button 
                          onClick={analyzeProbability}
                          disabled={scoringLoading}
                          className="text-xs flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition disabled:opacity-50 font-bold"
                        >
                          {scoringLoading ? (
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {viewLead.probabilityScore !== null && viewLead.probabilityScore !== undefined ? 'Recalculate AI Score' : 'Calculate AI Score'}
                        </button>
                      )}
                    </div>
                    {viewLead.status === 'won' ? (
                      <div className="w-full bg-muted rounded-full h-4 relative overflow-hidden">
                        <div className="h-full bg-success" style={{ width: '100%' }}></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black/70 mix-blend-overlay">
                          100% (Won)
                        </span>
                      </div>
                    ) : viewLead.status === 'lost' ? (
                      <div className="w-full bg-muted rounded-full h-4 relative overflow-hidden">
                        <div className="h-full bg-destructive" style={{ width: '100%' }}></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-overlay">
                          0% (Lost)
                        </span>
                      </div>
                    ) : viewLead.probabilityScore !== null && viewLead.probabilityScore !== undefined ? (
                      <div className="w-full bg-muted rounded-full h-4 relative overflow-hidden">
                        <div 
                          className={`h-full ${viewLead.probabilityScore > 70 ? 'bg-success' : viewLead.probabilityScore > 40 ? 'bg-warning' : 'bg-destructive'}`} 
                          style={{ width: `${viewLead.probabilityScore}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black/70 mix-blend-overlay">
                          {viewLead.probabilityScore}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not analyzed yet.</p>
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{viewLead.description || 'No description provided.'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4 flex flex-col h-full">
                  <div className="flex-1 space-y-4 overflow-y-auto">
                    {!viewLead.notes || viewLead.notes.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No notes yet. Add one below!</p>
                    ) : (
                      viewLead.notes.map(note => (
                        <div key={note._id} className="bg-card p-4 rounded-lg border shadow-sm">
                          <p className="text-sm">{note.text}</p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {note.createdBy?.name || 'User'} • {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleAddNote} className="mt-auto relative flex items-center">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full pl-4 pr-12 py-3 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    />
                    <button type="submit" disabled={!newNote.trim()} className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-6 pl-4 border-l-2 border-muted relative">
                  {!viewLead.timeline || viewLead.timeline.length === 0 ? (
                    <p className="text-muted-foreground">No timeline events yet.</p>
                  ) : (
                    viewLead.timeline.map(event => (
                      <div key={event._id} className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
                        <p className="font-semibold text-sm">{event.action}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs font-medium text-muted-foreground/70 mt-1">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {!aiStrategy ? (
                    <div className="text-center py-12">
                      <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">AI Sales Assistant</h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                        Generate a personalized sales strategy based on this lead's profile, notes, and recent interactions.
                      </p>
                      <button 
                        onClick={generateAIStrategy}
                        disabled={aiLoading}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 mx-auto disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                            Analyzing Lead...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Generate Strategy
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <button 
                          onClick={generateAIStrategy}
                          disabled={aiLoading}
                          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" /> {aiLoading ? 'Regenerating...' : 'Regenerate'}
                        </button>
                      </div>
                      <div className="bg-card border rounded-xl p-6 shadow-sm prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{aiStrategy}</ReactMarkdown>
                      </div>
                      
                      <div className="border-t pt-6 mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <Send className="w-4 h-4 text-primary" /> Auto-Draft Follow Up
                          </h3>
                          <button 
                            onClick={draftAIEmail}
                            disabled={aiEmailLoading}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-bold hover:bg-primary/90 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" /> {aiEmailLoading ? 'Drafting...' : 'Draft Email'}
                          </button>
                        </div>
                        {aiEmail && (
                          <div className="relative">
                            <textarea 
                              readOnly 
                              value={aiEmail} 
                              className="w-full h-48 p-4 bg-muted/50 rounded-lg border text-sm font-medium custom-scrollbar"
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(aiEmail);
                                toast.success("Copied to clipboard!");
                              }}
                              className="absolute top-2 right-2 bg-background border px-2 py-1 rounded text-xs font-bold hover:bg-muted"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-8 rounded-xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6">
              {selectedLead ? 'Edit Lead' : 'Create New Lead'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="name" placeholder="Full Name *" value={formData.name || ''} onChange={handleChange} className="px-4 py-2 border rounded-lg" required />
                  <input type="email" name="email" placeholder="Email Address *" value={formData.email || ''} onChange={handleChange} className="px-4 py-2 border rounded-lg" required />
                  <input type="text" name="phone" placeholder="Phone Number *" value={formData.phone || ''} onChange={handleChange} className="px-4 py-2 border rounded-lg" required />
                  <input type="text" name="company" placeholder="Company Name *" value={formData.company || ''} onChange={handleChange} className="px-4 py-2 border rounded-lg" required />
                  <input type="number" name="dealValue" placeholder="Estimated Deal Value (₹)" value={formData.dealValue || ''} onChange={handleChange} className="px-4 py-2 border rounded-lg" />
                  <select name="priority" value={formData.priority || 'medium'} onChange={handleChange} className="px-4 py-2 border rounded-lg">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  {user?.role === 'admin' && (
                    <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleChange} className="px-4 py-2 border rounded-lg" required>
                      <option value="">Select Assignee *</option>
                      {users.filter(u => u.role !== 'admin').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  )}
                </div>
                <textarea name="description" placeholder="Lead Description or Requirements" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg h-32" />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium">Save Lead</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
