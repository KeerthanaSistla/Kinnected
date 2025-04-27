import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRelativeModal } from "./AddRelativeModal";

// Define relationship types
type RelationType = "mother" | "father" | "sibling" | "spouse" | "child";
type NodeStatus = "empty" | "placeholder" | "pending" | "connected";

// Define node structure
interface INode {
  id: string;
  username: string;
  fullName: string;
  relation?: RelationType;
  nickname?: string;
  description?: string;
  status: NodeStatus;
  profilePicture?: string;
}

// Default empty node structure for suggested relatives
const EmptyNode = (relation: RelationType): INode => ({
  id: `empty-${relation}-${Math.random().toString(36).substring(7)}`,
  username: "",
  fullName: relation.charAt(0).toUpperCase() + relation.slice(1),
  relation,
  status: "empty"
});

interface NodeProps {
  node: INode;
  isCenter?: boolean;
  onClick?: () => void;
  onAddClick?: () => void;
}

const Node: React.FC<NodeProps> = ({ node, isCenter = false, onClick, onAddClick }) => {
  // Add null check for node
  if (!node) {
    return null;
  }

  // Determine visual styles based on node status
  const getBorderStyle = () => {
    if (isCenter) {
      return "border-2 border-[#c57317]";
    }
    if (node.status === "empty") {
      return "border-2 border-dashed border-[#3a975c]";
    }
    return "border-2 border-[#3a975c]";
  };

  const getBgStyle = () => {
    if (isCenter) return "[background-color:#f7f0e2]";
    return "bg-white";
  };

  const getNodeLabel = () => {
    if (node.status === "empty") {
      return node.relation;
    }
    if (node.status === "placeholder") {
      return node.nickname || node.fullName || node.relation;
    }
    return node.username || node.nickname || node.fullName;
  };

  return (
    <div 
      className={`relative flex flex-col items-center ${node.status !== "empty" ? "cursor-pointer transition-transform hover:scale-105" : ""}`}
      onClick={node.status !== "empty" ? onClick : undefined}
    >
      <div 
        className={`${isCenter ? "w-28 h-28" : "w-20 h-20"} rounded-full flex items-center justify-center ${getBorderStyle()} ${getBgStyle()} shadow-sm`}
      >
        {node.profilePicture ? (
          <img
            src={node.profilePicture}
            alt={getNodeLabel()}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-sm font-medium text-center px-2 block w-full h-5 leading-5 truncate">
            {getNodeLabel()}
          </span>
        )}

        {/* Show add button only on the central node */}
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
      
      {!isCenter && node.status !== "empty" && (
        <div className="mt-1 text-xs text-gray-600">
          {node.relation}
          {node.status === "pending" && (
            <span className="ml-1 text-yellow-600">(Pending)</span>
          )}
        </div>
      )}
    </div>
  );
};

interface NodeGraphProps {
  currentUser: any;
  onAddRelative: (relation: RelationType) => void;
  connections: {
    mother?: INode;
    father?: INode;
    siblings: INode[];
    spouse?: INode;
    children: INode[];
  };
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ 
  currentUser, 
  onAddRelative,
  connections
}) => {
  const { toast } = useToast();
  const [showAddRelativeModal, setShowAddRelativeModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<RelationType | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Create base nodes with proper positioning
  const getBaseNodes = () => {
    const nodes = {
      mother: connections.mother || EmptyNode("mother"),
      father: connections.father || EmptyNode("father"),
      sibling: connections.siblings.length > 0 ? connections.siblings[0] : EmptyNode("sibling"),
      spouse: connections.spouse || EmptyNode("spouse"),
      child: connections.children.length > 0 ? connections.children[0] : EmptyNode("child")
    };

    // Only show + button on empty nodes
    const addButton = (node: INode, relation: RelationType) => {
      if (node.status === "empty") {
        return () => {
          setSelectedRelation(relation);
          setShowAddRelativeModal(true);
        };
      }
      return undefined;
    };

    return {
      mother: { ...nodes.mother, onAddClick: addButton(nodes.mother, "mother") },
      father: { ...nodes.father, onAddClick: addButton(nodes.father, "father") },
      sibling: { ...nodes.sibling, onAddClick: addButton(nodes.sibling, "sibling") },
      spouse: { ...nodes.spouse, onAddClick: addButton(nodes.spouse, "spouse") },
      child: { ...nodes.child, onAddClick: addButton(nodes.child, "child") }
    };
  };

  // Initialize baseNodes with a default value
  const [baseNodes, setBaseNodes] = useState<ReturnType<typeof getBaseNodes>>(getBaseNodes());

  // Update base nodes when connections change
  useEffect(() => {
    setBaseNodes(getBaseNodes());
  }, [connections]);

  // Draw connecting lines
  useEffect(() => {
    if (!svgRef.current || !centerNodeRef.current) return;
    
    // Clear previous lines
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
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
      
      const node = baseNodes[relation as keyof ReturnType<typeof getBaseNodes>];
      if (!node) return; // Skip if node is undefined
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX.toString());
      line.setAttribute('y1', centerY.toString());
      line.setAttribute('x2', nodeX.toString());
      line.setAttribute('y2', nodeY.toString());
      
      // Line style based on node status
      if (node.status === "empty") {
        line.setAttribute('stroke', '#743a10');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
      } else {
        line.setAttribute('stroke', '#743a10');
        line.setAttribute('stroke-width', '2');
        line.removeAttribute('stroke-dasharray');
      }
      
      svgRef.current.appendChild(line);
    });
  }, [baseNodes]);

  const centerNode: INode = {
    id: "current-user",
    username: currentUser.username,
    fullName: currentUser.fullName,
    status: "connected",
    profilePicture: currentUser.profilePicture
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl shadow-sm p-4 flex items-center justify-center" style={{ backgroundColor: "#dcfce7" }}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {/* Lines will be dynamically rendered here */}
      </svg>
      
      <div className="relative grid grid-cols-5 gap-16 p-8 items-center">
        {/* Top row (Mother, Father) */}
        <div className="col-start-2 col-span-1 flex justify-end -mt-6" ref={el => nodeRefs.current['mother'] = el}>
          <Node 
            node={baseNodes.mother}
            onClick={() => baseNodes.mother?.status !== "empty" && toast({ description: "View mother's family tree" })}
          />
        </div>
        <div className="col-start-4 col-span-1 flex justify-start -mt-6" ref={el => nodeRefs.current['father'] = el}>
          <Node 
            node={baseNodes.father}
            onClick={() => baseNodes.father?.status !== "empty" && toast({ description: "View father's family tree" })}
          />
        </div>

        {/* Middle row (Sibling, You, Spouse) */}
        <div className="col-start-1 col-span-1 flex justify-center" ref={el => nodeRefs.current['sibling'] = el}>
          <Node 
            node={baseNodes.sibling}
            onClick={() => baseNodes.sibling?.status !== "empty" && toast({ description: "View sibling's family tree" })}
          />
        </div>

        <div className="col-start-3 col-span-1 flex justify-center" ref={centerNodeRef}>
          <Node 
            node={centerNode}
            isCenter={true}
            onAddClick={() => {
              setSelectedRelation(null); // Reset selected relation when using central button
              setShowAddRelativeModal(true);
            }}
          />
        </div>

        <div className="col-start-5 col-span-1 flex justify-center" ref={el => nodeRefs.current['spouse'] = el}>
          <Node 
            node={baseNodes.spouse}
            onClick={() => baseNodes.spouse?.status !== "empty" && toast({ description: "View spouse's family tree" })}
          />
        </div>

        {/* Bottom row (Child) */}
        <div className="col-start-3 col-span-1 flex justify-center mt-6" ref={el => nodeRefs.current['child'] = el}>
          <Node 
            node={baseNodes.child}
            onClick={() => baseNodes.child?.status !== "empty" && toast({ description: "View child's family tree" })}
          />
        </div>
      </div>

      {showAddRelativeModal && (
        <AddRelativeModal
          onClose={() => {
            setShowAddRelativeModal(false);
            setSelectedRelation(null);
          }}
          currentUser={currentUser}
          selectedRelation={selectedRelation || undefined}
          onAddRelative={(data) => {
            setShowAddRelativeModal(false);
            // Pass the full data to the parent component
            onAddRelative(data.relation as RelationType);
            
            // Update the local state to reflect the change immediately
            setBaseNodes(prev => {
              // Create a completely new set of nodes
              return getBaseNodes();
            });
          }}
        />
      )}
    </div>
  );
};
