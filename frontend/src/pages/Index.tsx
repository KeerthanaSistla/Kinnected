
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 text-center">
      <div className="flex items-center justify-center mb-6">
        <img src="/logo.png" alt="Kinnected Logo" className="h-20 w-20" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ea591a] to-green-600 bg-clip-text text-transparent -ml-3 translate-y-2">
          innected
        </h1>
      </div>

        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Visualize and explore your family connections
        </h2>
        
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          Discover, map, and navigate your family relationships with our interactive node-based family tree.
          Connect with relatives, share memories, and understand your family structure.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link to="/register">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-[#e95416] text-green-600 hover:bg-[#d48c28] text-[#e95416]">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-green-50">
              <div className="mx-auto flex justify-center text-green-600 mb-4">
                <Icons.nodes className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Visualization</h3>
              <p className="text-gray-600">Explore family connections through an intuitive node-based interface</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-blue-50">
              <div className="mx-auto flex justify-center text-blue-600 mb-4">
                <Icons.profile className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Profiles</h3>
              <p className="text-gray-600">Create detailed profiles with both public and personal information</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-amber-50">
              <div className="mx-auto flex justify-center text-amber-600 mb-4">
                <Icons.ai className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Relationship AI</h3>
              <p className="text-gray-600">Ask questions about relationships and navigate complex family connections</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 text-center text-gray-600 bg-gray-50">
        <p>© 2025 Kinnected. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
