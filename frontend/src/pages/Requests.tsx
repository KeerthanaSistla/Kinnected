import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Check, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu } from "@/components/NavigationMenu";
import { Icons } from "@/components/Icons";
import { useToast } from "@/hooks/use-toast";
import api from '@/services/api';

interface ConnectionRequest {
  _id: string;
  fromUser: {
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  relationType: string;
  createdAt: string;
}

const Requests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  
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
      
      // Fetch real pending requests from backend
      api.get('/api/connections/pending')
        .then(res => {
          setConnectionRequests(res.data.requests || []);
        })
        .catch(() => {
          setConnectionRequests([]);
        });
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem("kinnected_isLoggedIn");
    navigate("/login");
  };
  
  const handleAcceptRequest = async (requestId: string) => {
    const request = connectionRequests.find(req => req._id === requestId);
    if (!request) return;
    try {
      await api.patch(`/api/connections/accept/${requestId}`);
      setConnectionRequests(connectionRequests.filter(req => req._id !== requestId));
      toast({
        title: "Connection Accepted",
        description: `You are now connected with ${request.fromUser.fullName} as ${request.relationType}`
      });
    } catch {
      toast({ title: "Error", description: "Failed to accept request" });
    }
  };
  
  const handleRejectRequest = async (requestId: string) => {
    const request = connectionRequests.find(req => req._id === requestId);
    if (!request) return;
    try {
      await api.patch(`/api/connections/reject/${requestId}`);
      setConnectionRequests(connectionRequests.filter(req => req._id !== requestId));
      toast({
        title: "Request Declined",
        description: `Connection request from ${request.fromUser.fullName} has been declined`
      });
    } catch {
      toast({ title: "Error", description: "Failed to decline request" });
    }
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-[#f7f0e2] border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Replace the icon with your custom favicon */}
              <img src="/favicon.ico" alt="Kinnected Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-green-700">Kinnected</span>
            </div>

            <div className="flex items-center gap-4">
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
        
        {/* Requests Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="rounded-xl shadow-sm p-6 max-w-3xl mx-auto" style={{ backgroundColor: "#dcfce7" }}>
            <div className="flex items-center mb-6">
              <UserPlus className="h-6 w-6 text-[#c57317] mr-2" /> {/* Change the color here */}
              <h1 className="text-2xl font-bold text-gray-800">Connection Requests</h1>
            </div>

            {connectionRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">You have no pending connection requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    style={{ backgroundColor: "#f7f0e2", borderColor: "#15803d" }}
                  >
                    <div>
                      <h3 className="font-medium">{request.fromUser.fullName}</h3>
                      <p className="text-sm text-gray-500">@{request.fromUser.username}</p>
                      <p className="text-sm mt-1">
                        Wants to connect as your <span className="font-medium">{request.relationType}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleRejectRequest(request._id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptRequest(request._id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Requests;
