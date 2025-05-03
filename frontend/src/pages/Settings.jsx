import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Menu } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { getUserProfile, updateUserProfile } from "../services/api";
import { NavigationMenu } from "../components/NavigationMenu";
import { useTheme } from "../contexts/ThemeContext";

const Settings = () => {
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Fetch user profile and sync theme from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getUserProfile();
        setUserSettings(data.user);

        // Sync theme if different
        if (data.user?.appPreferences?.theme && data.user.appPreferences.theme !== theme) {
          setTheme(data.user.appPreferences.theme);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load user settings", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [setTheme, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = { ...userSettings };
      if (newPassword.trim()) {
        if (!currentPassword.trim()) {
          toast({ title: "Error", description: "Please enter your current password to change password", variant: "destructive" });
          setSaving(false);
          return;
        }
        updateData.currentPassword = currentPassword.trim();
        updateData.newPassword = newPassword.trim();
      }
      await updateUserProfile(updateData);
      toast({ title: "Success", description: "Settings saved successfully" });
      setNewPassword("");
      setCurrentPassword("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="bg-[#f7f0e2] border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/favicon.ico" alt="Kinnected Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-primary">Kinnected</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full p-2 hover:bg-muted">
                <Menu className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex relative">
        <NavigationMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={userSettings}
          onLogout={() => {}}
        />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="rounded-xl shadow-sm p-6 max-w-3xl mx-auto" style={{ backgroundColor: theme === "dark" ? "#4cae4f" : "#dcfce7" }}>
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            {/* Account Settings */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">⚙️ Account Settings</h2>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={userSettings.username}
                  onChange={(e) => setUserSettings({ ...userSettings, username: e.target.value })}
                  label="Username"
                />
                <div className="mt-6 mb-2">
                  <h3 className="text-md font-semibold">🔐 Change Password</h3>
                </div>
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  label="Current Password"
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  label="New Password"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={userSettings.accountRecoveryEnabled || false}
                    onCheckedChange={(checked) =>
                      setUserSettings({ ...userSettings, accountRecoveryEnabled: checked })
                    }
                  />
                  <label className="font-medium">Enable/Disable Account Recovery Options</label>
                </div>
              </div>
            </section>

            {/* Display Preferences */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4">🖼️ Display Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">App Theme</label>
                  <div role="radiogroup" aria-label="App Theme" className="flex flex-col space-y-2">
                    {["light", "dark", "system"].map((option) => (
                      <label key={option} className="inline-flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="app-theme"
                          value={option}
                          checked={theme === option}
                          onChange={async (e) => {
                            const value = e.target.value;
                            // Resolve 'system' theme to 'light' or 'dark' before saving
                            let resolvedTheme = value;
                            if (value === "system") {
                              resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                            }
                            setTheme(value);
                            const updated = {
                              ...userSettings,
                              appPreferences: { ...userSettings.appPreferences, theme: resolvedTheme },
                            };
                            setUserSettings(updated);

                            try {
                              const {
                                appPreferences,
                                privacySettings,
                                familyTreePreferences,
                                notificationSettings,
                                relationManagementSettings,
                              } = updated;

                              await updateUserProfile({
                                appPreferences,
                                privacySettings,
                                familyTreePreferences,
                                notificationSettings,
                                relationManagementSettings,
                              });

                              toast({ title: "Success", description: "Theme preference saved" });
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to save theme", variant: "destructive" });
                            }
                          }}
                        />
                        <span className="capitalize">{option === "system" ? "System Default" : option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: theme === "dark" ? "#dcfce7" : undefined, color: theme === "dark" ? "black" : undefined }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
