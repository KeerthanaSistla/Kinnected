
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NodeGraph } from "@/components/NodeGraph";
import { AddRelativeModal } from "@/components/AddRelativeModal";
import { NavigationMenu } from "@/components/NavigationMenu";
import { Icons } from "@/components/Icons";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"relations" | "general">("relations");
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("kinnected_isLoggedIn") === "true";
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    
    // Get user data
    const userData = localStorage.getItem("kinnected_user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, [navigate]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: `${searchType === "relations" ? "Searching relations" : "Searching for relations"}`,
      description: `Searching for "${searchQuery}"...`,
    });
    // In a real app, this would search your database
  };
  
  const handleLogout = () => {
    localStorage.removeItem("kinnected_isLoggedIn");
    navigate("/login");
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-[#f7f0e2] border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/favicon.ico" alt="Kinnected Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-green-700">Kinnected</span>
            </div>

            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white rounded-lg shadow-sm px-3 py-1 border border-[#c57317] focus:outline-none">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <Input
                  type="text"
                  placeholder={searchType === "relations" ? "Search your relations..." : "Search for relations..."}
                  className="w-64 px-2 py-1 border-none focus:ring-0 focus:outline-none text-gray-700"  // Focus styles cleared here
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="ml-2 bg-[#dcfce7] text-gray-500 text-sm px-3 py-2 border border-[#15803d] rounded-lg focus:outline-none focus:ring-0 focus:border border-[#15803d]"
                  onChange={(e) => setSearchType(e.target.value as "relations" | "general")}
                  value={searchType}
                >
                  <option value="relations">Relations</option>
                  <option value="general">General</option>
                </select>
              </form>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>


      
      {/* Main Content */}
      <main className="flex-1 flex relative">
        {/* Side Navigation (shows when menu is open) */}
        <NavigationMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          user={currentUser} 
          onLogout={handleLogout} 
        />
        
        {/* Node Graph Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <NodeGraph 
            currentUser={currentUser} 
            onAddRelative={() => setShowAddRelative(true)} 
          />
        </div>
      </main>
      
      {/* Add Relative Modal */}
      {showAddRelative && (
        <AddRelativeModal
          onClose={() => setShowAddRelative(false)}
          currentUser={currentUser}
          onAddRelative={(data) => {
            toast({
              title: "Connection Request Sent",
              description: `Request sent to ${data.username}`,
            });
            setShowAddRelative(false);
          }}
        />
      )}
    </div>
  );
};

export default Home;
