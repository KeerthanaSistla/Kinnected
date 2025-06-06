import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { NodeGraph } from "../components/NodeGraph";
import { AddRelativeModal } from "../components/AddRelativeModal";
import { NavigationMenu } from "../components/NavigationMenu";
import { useToast } from "../hooks/use-toast";
import api from "../services/api";

type RelationType = "mother" | "father" | "sibling" | "spouse" | "child";

interface Connection {
  id: string;
  username: string;
  fullName: string;
  relation: RelationType;
  nickname?: string;
  description?: string;
  status: "empty" | "placeholder" | "pending" | "connected";
  profilePicture?: string;
}

interface Connections {
  mother?: Connection;
  father?: Connection;
  siblings: Connection[];
  spouse?: Connection;
  children: Connection[];
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"relations" | "general">("relations");
  const [selectedRelation, setSelectedRelation] = useState<RelationType | null>(null);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connections, setConnections] = useState<Connections>({
    siblings: [],
    children: []
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("kinnected_isLoggedIn") === "true";
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    
    const userData = localStorage.getItem("kinnected_user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    fetchConnections();
  }, [navigate]);

  const fetchConnections = async (userId?: string) => {
    try {
      let response;
      if (userId) {
        response = await api.get(`/api/connections/relations?userId=${userId}`);
      } else {
        response = await api.get('/api/connections/relations');
      }
      const relations = response.data?.relations || response.relations || [];

      const newConnections: Connections = {
        siblings: [],
        children: []
      };

      relations.forEach((relation: any) => {
        const connectionData: Connection = {
          id: relation._id,
          username: relation.toUser?.username || "",
          fullName: relation.fullName || "",
          relation: relation.relationType,
          nickname: relation.nickname,
          description: relation.description,
          status: relation.isPlaceholder ? 'placeholder' : 
                 relation.status === 'accepted' ? 'connected' : 'pending',
          profilePicture: relation.toUser?.profilePicture
        };

        switch (relation.relationType) {
          case 'mother':
            newConnections.mother = connectionData;
            break;
          case 'father':
            newConnections.father = connectionData;
            break;
          case 'sibling':
            newConnections.siblings.push(connectionData);
            break;
          case 'spouse':
            newConnections.spouse = connectionData;
            break;
          case 'child':
            newConnections.children.push(connectionData);
            break;
        }
      });

      setConnections(newConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to load family connections",
        variant: "destructive"
      });
    }
  };

  const handleNodeClick = (node: any) => {
    setCurrentUser({
      id: node.id,
      username: node.username,
      fullName: node.fullName,
      profilePicture: node.profilePicture
    });
    fetchConnections(node.id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: `${searchType === "relations" ? "Searching relations" : "Searching for relations"}`,
      description: `Searching for "${searchQuery}"...`,
    });
  };
  
  const handleLogout = () => {
    localStorage.removeItem("kinnected_isLoggedIn");
    navigate("/login");
  };

  const handleAddRelative = async (data: any) => {
    try {
      const newConnection: Connection = {
        id: data.id || `temp-${Date.now()}`,
        username: data.username || "",
        fullName: data.fullName || "",
        relation: data.relation as RelationType,
        nickname: data.nickname,
        description: data.description,
        status: data.userId ? "pending" : "placeholder",
        profilePicture: data.profilePicture
      };
      
      setConnections(prevConnections => {
        const updatedConnections = {
          ...prevConnections,
          siblings: [...(prevConnections.siblings || [])],
          children: [...(prevConnections.children || [])]
        };
        
        switch (data.relation) {
          case 'mother':
            updatedConnections.mother = newConnection;
            break;
          case 'father':
            updatedConnections.father = newConnection;
            break;
          case 'sibling':
            if (!updatedConnections.siblings.some(s => s.id === newConnection.id)) {
              updatedConnections.siblings = [...updatedConnections.siblings, newConnection];
            }
            break;
          case 'spouse':
            updatedConnections.spouse = newConnection;
            break;
          case 'child':
            if (!updatedConnections.children.some(c => c.id === newConnection.id)) {
              updatedConnections.children = [...updatedConnections.children, newConnection];
            }
            break;
        }
        
        return updatedConnections;
      });
      
      fetchConnections().catch(error => {
        console.error("Error fetching updated connections:", error);
      });
      
      toast({
        title: "Success",
        description: "Relative added successfully"
      });
    } catch (error) {
      console.error("Error adding relative:", error);
      toast({
        title: "Error",
        description: "Failed to add relative. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!currentUser) return null;
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-[#f7f0e2] border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/favicon.ico" alt="Kinnected Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-green-700">Kinnected</span>
            </div>

            <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="hidden md:flex items-center bg-background rounded-lg shadow-sm px-3 py-1 border border-border focus:outline-none">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <Input
                    type="text"
                    placeholder={searchType === "relations" ? "Search your relations..." : "Search for relations..."}
                    className="w-64 px-2 py-1 border-none focus:ring-0 focus:outline-none text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="ml-2 bg-muted text-muted-foreground !bg-[#dcfce7] text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-0 focus:border border-border"
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

      <main className="flex-1 flex relative">
        <NavigationMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          user={currentUser} 
          onLogout={handleLogout} 
        />
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <NodeGraph 
            currentUser={currentUser}
            connections={connections}
            onAddRelative={(data: any) => {
              setSelectedRelation(data.relation);
              setShowAddRelative(true);
            }}
            onNodeClick={handleNodeClick}
          />
        </div>
      </main>
      
      {showAddRelative && selectedRelation && (
        <AddRelativeModal
          onClose={() => {
            setShowAddRelative(false);
            setSelectedRelation(null);
          }}
          currentUser={currentUser}
          onAddRelative={handleAddRelative}
          selectedRelation={selectedRelation}
        />
      )}
    </div>
  );
};

export default Home;
