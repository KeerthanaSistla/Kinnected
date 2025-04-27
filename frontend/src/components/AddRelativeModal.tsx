import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const RELATIONS = ["mother", "father", "sibling", "spouse", "child"];

interface UserSuggestion {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
}

interface FormData {
  username: string;
  userId: string;
  fullName: string;
  relation: string;
  nickname: string;
  description: string;
}

interface AddRelativeModalProps {
  onClose: () => void;
  currentUser: any;
  onAddRelative: (data: FormData) => void;
  selectedRelation?: string;
}

export const AddRelativeModal: React.FC<AddRelativeModalProps> = ({
  onClose,
  currentUser,
  onAddRelative,
  selectedRelation
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    userId: "",
    fullName: "",
    relation: selectedRelation || "mother",
    nickname: "",
    description: ""
  });
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, username: value, userId: "" }));
    setShowSuggestions(true);
    if (value.length > 1) {
      try {
        const res = await api.get(`/api/users/search?query=${value}`);
        setSuggestions(res.data.users || []);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (user: UserSuggestion) => {
    setFormData(prev => ({
      ...prev,
      username: user.username,
      userId: user._id,
      fullName: user.fullName || ""
    }));
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.nickname && !formData.username) {
      setError("Nickname is required for placeholder relatives");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/api/connections", {
        relationType: formData.relation,
        toUser: formData.userId || undefined,
        fullName: formData.fullName || undefined,
        nickname: formData.nickname,
        description: formData.description,
        isPlaceholder: !formData.userId
      });
      
      // Create a data object with the response data
      const relativeData = {
        id: response.data.relation?._id || `temp-${Date.now()}`,
        username: formData.username,
        userId: formData.userId,
        fullName: formData.fullName,
        relation: formData.relation,
        nickname: formData.nickname,
        description: formData.description,
        profilePicture: response.data.relation?.toUser?.profilePicture
      };
      
      // Call onAddRelative to update the parent component
      onAddRelative(relativeData);
      
      // Show a toast for feedback
      if (formData.userId) {
        toast({
          title: "Request Sent!",
          description: `Connection request sent to ${formData.fullName || formData.username}`,
        });
        onClose();
      } else {
        toast({
          title: "Placeholder Added!",
          description: `Placeholder relative added to your tree.`,
        });
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add relative");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Relative</DialogTitle>
          <DialogDescription>
            Add a new relative to your family tree. You can either connect with an existing user or create a placeholder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relation">Relationship Type *</Label>
            <Select
              value={formData.relation}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relation: value }))}
              disabled={!!selectedRelation}
            >
              <SelectTrigger id="relation">
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONS.map(r => (
                  <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              placeholder="Search by username..."
              value={formData.username}
              onChange={handleUsernameChange}
              autoComplete="off"
              ref={inputRef}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && (suggestions?.length ?? 0) > 0 && (
              <div 
                ref={inputRef}
                className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-auto"
              >
                {suggestions.map((user) => (
                  <div
                    key={user._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSuggestionClick(user)}
                  >
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.fullName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name {!formData.username && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={handleChange}
              required={!formData.username}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">
              Nickname {!formData.username && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="nickname"
              placeholder="Add a personal nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required={!formData.username}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this relation"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {error && <div className="text-red-500 mb-2">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Adding..." : formData.userId ? "Send Request" : "Add Placeholder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
