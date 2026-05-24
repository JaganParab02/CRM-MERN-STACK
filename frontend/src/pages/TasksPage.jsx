import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, Calendar, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortingAi, setSortingAi] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    assignedTo: ''
  });

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get('/tasks');
      setTasks(res.data.tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/tasks', formData);
      setShowForm(false);
      setFormData({ title: '', description: '', dueDate: '', priority: 'medium', status: 'todo', assignedTo: '' });
      fetchTasks();
      toast.success('Task created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await axiosInstance.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const magicSortTasks = async () => {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    if (todoTasks.length < 2) return;
    
    setSortingAi(true);
    try {
      const taskIds = todoTasks.map(t => t._id);
      const res = await axiosInstance.post('/ai/sort-tasks', { taskIds });
      const sortedTodos = res.data.sortedTasks;
      
      // Merge sorted todos back into main tasks list
      const otherTasks = tasks.filter(t => t.status !== 'todo');
      setTasks([...sortedTodos, ...otherTasks]);
      toast.success('Tasks sorted by AI!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to sort tasks');
    } finally {
      setSortingAi(false);
    }
  };

  const statusColumns = [
    { id: 'todo', title: 'To Do', icon: Clock },
    { id: 'in_progress', title: 'In Progress', icon: Calendar },
    { id: 'completed', title: 'Completed', icon: CheckCircle2 }
  ];

  if (loading) return <div className="p-8 text-center">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage your daily agenda and follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={magicSortTasks}
            disabled={sortingAi || tasks.filter(t => t.status === 'todo').length < 2}
            className="bg-primary/10 text-primary px-4 py-2 rounded-md hover:bg-primary/20 flex items-center gap-2 font-medium disabled:opacity-50 transition-colors"
          >
            {sortingAi ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Magic Sort
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-lg max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Task Title *"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md h-24"
              />
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>

              {user?.role === 'admin' && (
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Assignee *</option>
                  {users.filter(u => u.role !== 'admin').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              )}
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-md font-medium">
                  Create Task
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-md font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Kanban Board for Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map((col) => (
          <div key={col.id} className="bg-muted/30 rounded-xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <col.icon className="w-5 h-5 text-muted-foreground" />
                {col.title}
              </h3>
              <Badge variant="secondary">
                {tasks.filter(t => t.status === col.id).length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {tasks.filter(t => t.status === col.id).map(task => (
                <Card key={task._id} className="hover:shadow-md transition cursor-pointer border-l-4" style={{borderLeftColor: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f59e0b' : '#3b82f6'}}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm leading-tight">{task.title}</p>
                    </div>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    <div className="pt-2 flex justify-between items-center">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {task.priority}
                      </Badge>
                      <select 
                        className="text-xs border rounded px-1 py-0.5 bg-background"
                        value={task.status}
                        onChange={(e) => updateStatus(task._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Done</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
