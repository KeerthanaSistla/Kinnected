
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NavigationMenu } from "@/components/NavigationMenu";
import { Icons } from "@/components/Icons";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  bio: string;
  phone?: string;
  location?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);
  
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
      const parsedUser = JSON.parse(userData);
      
      // Enhance with default profile fields if not present
      const enhancedUser = {
        ...parsedUser,
        bio: parsedUser.bio || "Tell others about yourself...",
        email: parsedUser.email || "user@example.com",
        phone: parsedUser.phone || "",
        location: parsedUser.location || ""
      };
      
      setCurrentUser(enhancedUser);
      setEditProfile(enhancedUser);
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem("kinnected_isLoggedIn");
    navigate("/login");
  };
  
  const handleSaveProfile = () => {
    if (!editProfile) return;
    
    // Update local storage
    localStorage.setItem("kinnected_user", JSON.stringify(editProfile));
    setCurrentUser(editProfile);
    setIsEditing(false);
    
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated."
    });
  };
  
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!editProfile) return;
    
    setEditProfile({
      ...editProfile,
      [field]: value
    });
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
        
        {/* Profile Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="rounded-xl shadow-sm p-6 max-w-3xl mx-auto" style={{ backgroundColor: "#dcfce7" }}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              {isEditing ? (
                <Button 
                  onClick={handleSaveProfile}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  variant="outline"
                >
                  Edit Profile
                </Button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-green-100 border-2 border-[#c57317] flex items-center justify-center mb-4">
                  <User className="h-16 w-16 text-[#c57317]" />
                </div>
                {isEditing && (
                  <Button variant="outline" size="sm" className="text-xs" disabled>
                    Upload Photo
                  </Button>
                )}
              </div>

              {/* Profile Form */}
              <div className="flex-1 space-y-4">
                {/* Username (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editProfile?.username || ""}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Usernames cannot be changed
                  </p>
                </div>
                
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={editProfile?.fullName || ""}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editProfile?.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editProfile?.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                    rows={4}
                  />
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={editProfile?.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={editProfile?.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
