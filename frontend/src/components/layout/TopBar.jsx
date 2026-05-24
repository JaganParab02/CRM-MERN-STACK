import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, Sun, Moon, Sparkles, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

export default function TopBar() {
  const { toggleSidebar, user, theme, toggleTheme, notifications, markNotificationRead } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setShowResults(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowResults(true);
    try {
      const res = await axiosInstance.post('/ai/search', { query: searchQuery });
      setSearchResults(res.data.leads || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur shadow-sm">
      <button 
        onClick={toggleSidebar}
        className="text-muted-foreground hover:text-foreground transition block"
      >
        <Menu className="w-5 h-5" />
      </button>


      <div className="md:hidden font-bold text-lg flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
        CRM
      </div>

      <div className="ml-auto flex items-center gap-4">

        <div ref={searchRef} className="relative hidden sm:block z-50">
          <form onSubmit={handleSearch} className="relative">
            <Sparkles className="absolute left-2.5 top-2.5 h-4 w-4 text-primary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask AI (e.g., 'show high priority deals in negotiation')"
              className="h-9 w-96 rounded-full border border-primary/50 bg-primary/5 pl-9 pr-10 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-3 bg-muted/50 border-b flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Search Results</span>
                {isSearching && <span className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> Thinking...</span>}
              </div>
              <div className="overflow-y-auto custom-scrollbar p-2">
                {!isSearching && searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No leads match your AI query. Try rephrasing!
                  </div>
                ) : (
                  searchResults.map(lead => (
                    <div 
                      key={lead._id} 
                      onClick={() => {
                        navigate('/leads');
                        setShowResults(false);
                      }}
                      className="p-3 hover:bg-muted cursor-pointer rounded-md transition-colors flex justify-between items-start mb-1"
                    >
                      <div>
                        <h4 className="font-semibold text-sm">{lead.company}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><User className="w-3 h-3"/> {lead.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                          ${lead.priority === 'high' ? 'bg-destructive/10 text-destructive' : 
                            lead.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                          {lead.priority}
                        </span>
                        <p className="text-xs font-bold mt-1">₹{lead.dealValue?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>


        <button 
          onClick={toggleTheme}
          className="relative h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>


        <div className="relative group">
          <button className="relative h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
            )}
          </button>
          

          <div className="absolute right-0 top-full mt-2 w-80 rounded-md border bg-popover p-4 shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <h4 className="font-semibold mb-2">Notifications</h4>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={`p-2 text-sm rounded ${n.read ? 'opacity-50' : 'bg-accent'}`} onClick={() => markNotificationRead(n.id)}>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-muted-foreground text-xs">{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-opacity cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{user?.name}</div>
            <div className="text-xs text-muted-foreground mt-1 capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm group-hover:bg-primary/30 transition-colors">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
}
