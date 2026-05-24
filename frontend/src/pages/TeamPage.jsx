import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role === 'admin') {
      fetchTeamData();
    }
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/team');
      setTeamData(response.data.teamData);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 text-xl font-semibold">Only admins can view team metrics</p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading team data...</div>;

  const totalLeads = teamData.reduce((sum, member) => sum + member.totalLeads, 0);
  const totalWon = teamData.reduce((sum, member) => sum + member.wonLeads, 0);
  const avgConversion = teamData.length > 0
    ? (teamData.reduce((sum, m) => sum + parseFloat(m.conversionRate), 0) / teamData.length).toFixed(1)
    : 0;

  // Real-world maximums for capacity bars
  const MAX_ACTIVE_LEADS = 50; 
  const MAX_ACTIVE_TASKS = 20;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">Monitor team performance and balance workloads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Team Members</p>
          <p className="text-4xl font-bold text-foreground mt-2">{teamData.length}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Total Leads</p>
          <p className="text-4xl font-bold text-foreground mt-2">{totalLeads}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Average Conversion</p>
          <p className="text-4xl font-bold text-primary mt-2">{avgConversion}%</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b bg-muted/20">
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'performance' ? 'border-b-2 border-primary text-primary bg-background' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Performance Metrics
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'workload' ? 'border-b-2 border-primary text-primary bg-background' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Workload Planner
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {activeTab === 'performance' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Member</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Total Leads</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Won Deals</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Total Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teamData.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </td>
                      <td className="px-6 py-4">{member.totalLeads}</td>
                      <td className="px-6 py-4 font-semibold text-success">{member.wonLeads}</td>
                      <td className="px-6 py-4">₹{(member.totalValue / 100000).toFixed(2)}L</td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                          {member.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'workload' && (
            <div className="p-6 space-y-8">
              {teamData.map((member) => {
                const leadsPercent = Math.min(100, (member.activeLeads / MAX_ACTIVE_LEADS) * 100);
                const tasksPercent = Math.min(100, (member.activeTasks / MAX_ACTIVE_TASKS) * 100);
                const isOverloaded = leadsPercent > 90 || tasksPercent > 90;

                return (
                  <div key={member.id} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1">
                      <p className="font-semibold text-lg">{member.name}</p>
                      {isOverloaded && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded mt-1 inline-block">Over Capacity</span>}
                    </div>
                    
                    <div className="md:col-span-3 space-y-4">
                      {/* Active Leads Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground font-medium">Active Leads</span>
                          <span className="font-bold">{member.activeLeads} <span className="text-muted-foreground font-normal">/ {MAX_ACTIVE_LEADS}</span></span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${leadsPercent > 85 ? 'bg-destructive' : leadsPercent > 60 ? 'bg-warning' : 'bg-success'}`}
                            style={{ width: `${leadsPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Active Tasks Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground font-medium">Active Tasks</span>
                          <span className="font-bold">{member.activeTasks} <span className="text-muted-foreground font-normal">/ {MAX_ACTIVE_TASKS}</span></span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${tasksPercent > 85 ? 'bg-destructive' : tasksPercent > 60 ? 'bg-warning' : 'bg-primary'}`}
                            style={{ width: `${tasksPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
