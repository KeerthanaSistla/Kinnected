import { UserCircle, Home, Users, BrainCircuit, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
    // Removed toast for sections under development
  };
  
  const handleLogout = () => {
    onLogout();
    toast("Logged out successfully", {
      description: "You have been logged out of your account"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:relative lg:inset-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 lg:hidden" 
        onClick={onClose}
      />

      {/* Sidebar - Using Sheet component for better animation */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="p-0 w-64">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">User navigation and settings</SheetDescription>
          <div className="flex flex-col h-full">
            {/* User Info */}
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center mb-4">
                <UserCircle className="h-12 w-12" style={{ color: "#c57317" }} />
              </div>

              <h2 className="text-lg font-semibold">{user.fullName}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>

            <Separator className="my-4" />

            {/* Navigation */}
            <nav className="flex-1">
              <ul className="space-y-2 px-4">
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => handleNavigation("/home")}
                  >
                    <Home className="h-5 w-5 mr-3" />
                    Home
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleNavigation("/profile")}
                  >
                    <UserCircle className="h-5 w-5 mr-3" />
                    My Profile
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleNavigation("/requests")}
                  >
                    <Users className="h-5 w-5 mr-3" />
                    Connection Requests
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleNavigation("/ai")}
                  >
                    <BrainCircuit className="h-5 w-5 mr-3" />
                    Kinnected AI
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleNavigation("/settings")}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Button>
                </li>
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
