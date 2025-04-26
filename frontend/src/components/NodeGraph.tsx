import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Define relationship types
type RelationType = "mother" | "father" | "sibling" | "spouse" | "child" | "parent";

// Define node structure
interface INode {
  id: string;
  username: string;
  fullName: string;
  relation?: RelationType;
  nickname?: string;
  description?: string;
  isSolid: boolean; // true for established connections, false for suggested/dotted
  profilePicture?: string;
}

// Default empty node structure for suggested relatives
const EmptyNode = (relation: RelationType): INode => ({
  id: `empty-${relation}-${Math.random().toString(36).substring(7)}`,
  username: relation.charAt(0).toUpperCase() + relation.slice(1),
  fullName: "",
  relation,
  isSolid: false,
});

interface NodeProps {
  node: INode;
  isCenter?: boolean;
  onClick?: () => void;
  onAddClick?: () => void;
}

const Node: React.FC<NodeProps> = ({ node, isCenter = false, onClick, onAddClick }) => {
  const borderClass = node.isSolid 
    ? "border-2 [border-color:#c57317]" 
    : "border-2 border-dashed [border-color:#15803d]";  

    
    const bgClass = isCenter 
    ? "[background-color:#f7f0e2]" 
    : (node.isSolid ? "[background-color:#f7f0e2]" : "bg-gray-50");
  
    
  return (
    <div 
      className={`relative flex flex-col items-center cursor-pointer transition-transform hover:scale-105`}
      onClick={node.isSolid || isCenter ? onClick : undefined}
    >
      <div 
        className={`${isCenter ? "w-28 h-28" : "w-20 h-20"} rounded-full flex items-center justify-center ${borderClass} ${bgClass} shadow-sm`}
      >
        {node.profilePicture ? (
          <img
            src={node.profilePicture}
            alt={node.username}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-sm font-medium">{node.username}</span>
        )}
      </div>
      
      {!isCenter && (
        <div className="mt-1 text-xs text-gray-600">
          {node.relation}
        </div>
      )}
      
      {/* Only show add button on the central node */}
      {isCenter && (
        <div className="absolute bottom-1 right-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
            className="bg-[#c57317] text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-[#a85f11]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};

interface LineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDotted: boolean;
}

const Line: React.FC<LineProps> = ({ startX, startY, endX, endY, isDotted }) => {
  const strokeDasharray = isDotted ? "5,5" : "none";
  
  return (
    <line
      x1={startX}
      y1={startY}
      x2={endX}
      y2={endY}
      stroke={isDotted ? "#9CA3AF" : "#10B981"}
      strokeWidth="2"
      strokeDasharray={strokeDasharray}
    />
  );
};

interface NodeGraphProps {
  currentUser: any;
  onAddRelative: () => void;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ currentUser, onAddRelative }) => {
  const [connections, setConnections] = useState<INode[]>([]);
  const [centerNode, setCenterNode] = useState<INode>({
    id: "current-user",
    username: currentUser.username,
    fullName: currentUser.fullName,
    isSolid: true,
  });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Create suggested connections if none exist
  useEffect(() => {
    // Check if we're coming back to the central user
    if (centerNode.id === "current-user" && connections.length === 0) {
      const initialSuggestions: INode[] = [
        EmptyNode("mother"),
        EmptyNode("father"),
        EmptyNode("sibling"),
        EmptyNode("spouse"),
        EmptyNode("child"),
      ];
      
      setConnections(initialSuggestions);
    }
  }, [centerNode, connections.length]);
  
  const handleNodeClick = (node: INode) => {
    if (!node.isSolid) return;
    
    // Simulate exploring another user's connections
    setCenterNode(node);
    
    // Generate some random connections for this node
    // In a real app, you would fetch this data from your backend
    const newConnections: INode[] = [];
    
    if (node.id !== "current-user") {
      // Generate some random connections
      const relations: RelationType[] = ["mother", "father", "sibling", "spouse", "child"];
      const randomNum = Math.floor(Math.random() * 4) + 1; // 1-4 connections
      
      for (let i = 0; i < randomNum; i++) {
        const relation = relations[Math.floor(Math.random() * relations.length)];
        newConnections.push({
          id: `random-${Math.random().toString(36).substring(7)}`,
          username: `User${Math.floor(Math.random() * 1000)}`,
          fullName: `Random User ${i+1}`,
          relation,
          isSolid: Math.random() > 0.3, // 70% chance to be solid
        });
      }
      
      // Always add a connection back to the current user
      newConnections.push({
        id: "current-user",
        username: currentUser.username,
        fullName: currentUser.fullName,
        relation: node.relation === "child" ? "parent" : 
                node.relation === "parent" ? "child" : 
                "sibling",
        isSolid: true,
      });
    }
    
    setConnections(newConnections);
  };
  
  // Draw connecting lines using an effect
  useEffect(() => {
    if (!svgRef.current || !centerNodeRef.current) return;
    
    // Clear previous lines
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    // Get center node position
    const centerRect = centerNodeRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    
    const centerX = centerRect.left + centerRect.width / 2 - svgRect.left;
    const centerY = centerRect.top + centerRect.height / 2 - svgRect.top;
    
    // Draw lines to each connection
    Object.entries(nodeRefs.current).forEach(([relation, nodeRef]) => {
      if (!nodeRef) return;
      
      const nodeRect = nodeRef.getBoundingClientRect();
      const nodeX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
      const nodeY = nodeRect.top + nodeRect.height / 2 - svgRect.top;
      
      const connection = connections.find(n => n.relation === relation);
      if (!connection) return;
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX.toString());
      line.setAttribute('y1', centerY.toString());
      line.setAttribute('x2', nodeX.toString());
      line.setAttribute('y2', nodeY.toString());
      line.setAttribute('stroke', connection.isSolid ? '#714618' : '#714618');
      line.setAttribute('stroke-width', '2');
      
      if (!connection.isSolid) {
        line.setAttribute('stroke-dasharray', '5,5');
      }
      
      svgRef.current.appendChild(line);
    });
  }, [connections, centerNodeRef.current, nodeRefs.current, svgRef.current]);
  
  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl shadow-sm p-4 flex items-center justify-center" style={{ backgroundColor: "#dcfce7" }}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {/* Lines will be dynamically rendered here */}
      </svg>
      
      <div className="relative grid grid-cols-5 gap-16 p-8 items-center">

      {/* Top row (Mother, Father) */}
      <div className="col-start-2 col-span-1 flex justify-end -mt-6" ref={el => nodeRefs.current['mother'] = el}>
        {connections.find(n => n.relation === "mother") && (
          <Node 
            node={connections.find(n => n.relation === "mother")!} 
            onClick={() => handleNodeClick(connections.find(n => n.relation === "mother")!)}
            onAddClick={onAddRelative}
          />
        )}
      </div>
      <div className="col-start-4 col-span-1 flex justify-start -mt-6" ref={el => nodeRefs.current['father'] = el}>
        {connections.find(n => n.relation === "father") && (
          <Node 
            node={connections.find(n => n.relation === "father")!}
            onClick={() => handleNodeClick(connections.find(n => n.relation === "father")!)}
            onAddClick={onAddRelative}
          />
        )}
      </div>

      {/* Middle row (Sibling, You, Spouse) */}
      <div className="col-start-1 col-span-1 flex justify-center" ref={(el) => nodeRefs.current['sibling'] = el}>
        {connections.find((n) => n.relation === "sibling") && (
          <Node
            node={connections.find((n) => n.relation === "sibling")!}
            onClick={() => handleNodeClick(connections.find((n) => n.relation === "sibling")!)}
            onAddClick={onAddRelative}
          />
        )}
      </div>

      <div className="col-start-3 col-span-1 flex justify-center" ref={centerNodeRef}>
        <Node 
          node={centerNode} 
          isCenter={true}
          onClick={() => {
            if (centerNode.id !== "current-user") {
              setCenterNode({
                id: "current-user",
                username: currentUser.username,
                fullName: currentUser.fullName,
                isSolid: true,
              });
              setConnections([]);
            }
          }}
          onAddClick={onAddRelative}
        />
      </div>

      <div className="col-start-5 col-span-1 flex justify-center" ref={el => nodeRefs.current['spouse'] = el}>
        {connections.find(n => n.relation === "spouse") && (
          <Node 
            node={connections.find(n => n.relation === "spouse")!}
            onClick={() => handleNodeClick(connections.find(n => n.relation === "spouse")!)}
            onAddClick={onAddRelative}
          />
        )}
      </div>

      {/* Bottom row (Child) */}
      <div className="col-start-3 col-span-1 flex justify-center mt-6" ref={el => nodeRefs.current['child'] = el}>
        {connections.find(n => n.relation === "child") && (
          <Node 
            node={connections.find(n => n.relation === "child")!}
            onClick={() => handleNodeClick(connections.find(n => n.relation === "child")!)}
            onAddClick={onAddRelative}
          />
        )}
      </div>
      </div>


    </div>
  );
};
