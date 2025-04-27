import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      console.log('Login form data:', {
        username: formData.username,
        passwordLength: formData.password.length,
        password: '*'.repeat(formData.password.length) // Don't log actual password
      });
      
      const response = await axios.post('http://localhost:5000/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('kinnected_user', JSON.stringify(response.data.user));
        localStorage.setItem('kinnected_isLoggedIn', 'true');
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        navigate("/home");
      } else {
        setError(response.data.message || "Login failed. Please try again.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response data:', error.response?.data);
      
      if (error.response?.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (error.response?.data?.errors) {
        // Handle field-specific errors
        const errors = error.response.data.errors;
        if (errors.username) {
          setError(errors.username);
        } else if (errors.password) {
          setError(errors.password);
        } else {
          setError("Invalid credentials. Please try again.");
        }
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message === "Network Error") {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-2xl font-bold text-green-700">Kinnected</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
            Login to Your Account
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-green-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-green-600 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
