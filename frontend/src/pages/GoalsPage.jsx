import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Target, Plus, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const { user } = useStore();
  const [goalToDelete, setGoalToDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'revenue',
    targetValue: '',
    deadline: '',
    assignedTo: ''
  });

  useEffect(() => {
    fetchGoals();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const res = await axiosInstance.get('/goals');
      setGoals(res.data.goals);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/goals', formData);
      setShowForm(false);
      setFormData({ title: '', type: 'revenue', targetValue: '', deadline: '', assignedTo: '' });
      fetchGoals();
      toast.success('Goal created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create goal');
    }
  };

  const deleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await axiosInstance.delete(`/goals/${goalToDelete}`);
      fetchGoals();
      toast.success('Goal deleted');
    } catch (error) {
      toast.error('Failed to delete goal');
    } finally {
      setGoalToDelete(null);
    }
  };

  return (
    <>
      <ConfirmModal 
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={deleteGoal}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
      />
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals & Objectives</h1>
          <p className="text-muted-foreground mt-2">Track revenue targets and deal quotas.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-lg max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="title" placeholder="Goal Title (e.g. Q3 Sales)" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
              
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required>
                <option value="revenue">Revenue Quota (in ₹)</option>
                <option value="deals_won">Deal Count Target (Number of Deals)</option>
              </select>

              <input type="number" name="targetValue" placeholder={formData.type === 'revenue' ? "Target Revenue (₹)" : "Target Number of Deals"} value={formData.targetValue} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required min="1" />
              
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
              
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                <option value="">Company Wide Goal (Unassigned)</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-md font-medium">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-md font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 rounded-xl border border-dashed">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No active goals</h3>
          <p className="text-muted-foreground mt-1">Create goals to motivate the team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const displayPercent = Math.round((goal.currentValue / goal.targetValue) * 100);
            const barPercent = Math.min(100, displayPercent);
            const isRevenue = goal.type === 'revenue';
            
            return (
              <Card key={goal._id} className="relative overflow-hidden group">
                <div 
                  className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
                    goal.status === 'completed' ? 'bg-success' : 
                    goal.status === 'failed' ? 'bg-destructive' : 'bg-primary'
                  }`} 
                  style={{ width: `${barPercent}%` }}
                ></div>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {goal.assignedTo ? `Assigned to: ${goal.assignedTo.name}` : 'Company Goal'}
                    </p>
                  </div>
                  {goal.status === 'completed' && <CheckCircle2 className="text-success w-5 h-5" />}
                  {goal.status === 'failed' && <AlertCircle className="text-destructive w-5 h-5" />}
                  {goal.status === 'active' && <TrendingUp className="text-primary w-5 h-5" />}
                </CardHeader>
                <CardContent>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Progress</p>
                      <p className="text-2xl font-bold">
                        {isRevenue ? `₹${(goal.currentValue / 100000).toFixed(1)}L` : goal.currentValue}
                        <span className="text-sm text-muted-foreground font-normal ml-1">
                          / {isRevenue ? `₹${(goal.targetValue / 100000).toFixed(1)}L` : goal.targetValue}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{displayPercent}%</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                    <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                    {user?.role === 'admin' && (
                      <button onClick={() => setGoalToDelete(goal._id)} className="text-destructive hover:underline hidden group-hover:block">
                        Delete
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
