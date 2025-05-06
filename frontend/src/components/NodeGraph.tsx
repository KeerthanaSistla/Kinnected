import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { getUserRelations } from "../services/api";
import { AddRelativeModal } from "./AddRelativeModal";

// Define relationship types
type RelationType = "mother" | "father" | "sibling" | "spouse" | "child";
type NodeStatus = "empty" | "placeholder" | "pending" | "connected";

// Define node structure
interface INode {
  id: string;
  username: string;
  name?: string;
  fullName: string;
  relation?: string; // changed from RelationType to string to fix type conflict
  nickname?: string;
  description?: string;
  status: NodeStatus;
  profilePicture?: string;
}

// Define relative data structure for onAddRelative callback
interface RelativeData {
  id: string;
  username: string;
  userId?: string;
  relation: string;
  nickname?: string;
  description?: string;
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
  if (!node) {
    return null;
  }

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
        className={`${isCenter ? "w-24 h-24 sm:w-28 sm:h-28" : "w-16 h-16 sm:w-20 sm:h-20"} rounded-full flex items-center justify-center ${getBorderStyle()} ${getBgStyle()} shadow-sm`}
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
            <span className="ml-1 text-[#c57317]">(Pending)</span>
          )}
        </div>
      )}
    </div>
  );
};

interface RelativeData {
  id: string;
  username: string;
  userId?: string;
  relation: string;
  nickname?: string;
  description?: string;
  profilePicture?: string;
}

interface NodeGraphProps {
  currentUser: any;
  onAddRelative: (data: RelativeData) => void;
  connections: {
    mother?: INode;
    father?: INode;
    siblings: INode[];
    spouse?: INode;
    children: INode[];
  };
  onNodeClick?: (node: INode) => void;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ 
  currentUser, 
  onAddRelative,
  connections: initialConnections,
  onNodeClick
}) => {
  const { toast } = useToast();
  const [showAddRelativeModal, setShowAddRelativeModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<RelationType | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // State to track the currently centered node id (initially currentUser id)
  const [centeredNodeId, setCenteredNodeId] = useState<string>(currentUser.id);

  // State to hold connections for the centered node
  const [connections, setConnections] = useState(initialConnections);

  // State to track the selected node for profile display (central or relative)
  const [selectedNode, setSelectedNode] = useState<INode | null>(null);

  // State to track if profile box is open
  const [showProfile, setShowProfile] = useState(false);

  // Helper function to get dummy connections with default 5 dummy nodes
  const getDummyConnections = () => {
    return {
      mother: EmptyNode("mother"),
      father: EmptyNode("father"),
      siblings: [EmptyNode("sibling")],
      spouse: EmptyNode("spouse"),
      children: [EmptyNode("child")]
    };
  };

  // Fetch connections when centeredNodeId changes
  useEffect(() => {
    // If centeredNodeId corresponds to a placeholder node, set dummy connections and skip fetch
    if (centeredNodeId.startsWith("placeholder-")) {
      setConnections(getDummyConnections());
      return;
    }

    const fetchConnections = async () => {
      try {
        const data = await getUserRelations(centeredNodeId);
        if (data && data.relations) {
          // Transform relations into connections object similar to initialConnections
          const newConnections = {
            mother: undefined,
            father: undefined,
            siblings: [],
            spouse: undefined,
            children: []
          };

          data.relations.forEach((relation: any) => {
            // Filter out reciprocal relations that point back to the centered user to avoid duplicates
            if (relation.toUser?._id === centeredNodeId) {
              return;
            }
          const node: INode = {
            id: relation.toUser?._id || `placeholder-${relation._id}`,
            username: relation.toUser?.username || "",
            name: relation.toUser?.name || relation.toUser?.fullName || "",
            fullName: relation.toUser?.fullName || relation.fullName || "",
            relation: relation.relationType,
            nickname: relation.nickname,
            description: relation.description,
            status: relation.status === "accepted" ? "connected" : "pending",
            profilePicture: relation.toUser?.profilePicture
          };

            switch (relation.relationType) {
              case "mother":
                newConnections.mother = node;
                break;
              case "father":
                newConnections.father = node;
                break;
              case "sibling":
                newConnections.siblings.push(node);
                break;
              case "spouse":
                newConnections.spouse = node;
                break;
              case "child":
                newConnections.children.push(node);
                break;
            }
          });

          setConnections(newConnections);
        }
      } catch (error) {
        toast({ description: "Failed to load connections" });
      }
    };

    fetchConnections();
  }, [centeredNodeId, toast]);

  // Handler to convert FormData from AddRelativeModal to RelativeData and call parent's onAddRelative
  const handleAddRelativeFromModal = (data: any) => {
    const relativeData: RelativeData = {
      id: `temp-${Date.now()}`,
      username: data.username,
      userId: data.userId,
      relation: data.relation,
      nickname: data.nickname,
      description: data.description,
      profilePicture: undefined
    };
    onAddRelative(relativeData);
  };

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
      mother: { ...nodes.mother, onAddClick: addButton(nodes.mother, "mother"), onClick: () => {
        if(nodes.mother.status === "placeholder") {
          setCenteredNodeId(nodes.mother.id);
          setConnections(getDummyConnections());
          setShowProfile(false);
          onNodeClick?.(nodes.mother);
        } else if(nodes.mother.status !== "empty") {
          setCenteredNodeId(nodes.mother.id);
          setShowProfile(false);
          onNodeClick?.(nodes.mother);
        }
      }},
      father: { ...nodes.father, onAddClick: addButton(nodes.father, "father"), onClick: () => {
        if(nodes.father.status === "placeholder") {
          setCenteredNodeId(nodes.father.id);
          setConnections(getDummyConnections());
          setShowProfile(false);
          onNodeClick?.(nodes.father);
        } else if(nodes.father.status !== "empty") {
          setCenteredNodeId(nodes.father.id);
          setShowProfile(false);
          onNodeClick?.(nodes.father);
        }
      }},
      sibling: { ...nodes.sibling, onAddClick: addButton(nodes.sibling, "sibling"), onClick: () => {
        if(nodes.sibling.status === "placeholder") {
          setCenteredNodeId(nodes.sibling.id);
          setConnections(getDummyConnections());
          setShowProfile(false);
          onNodeClick?.(nodes.sibling);
        } else if(nodes.sibling.status !== "empty") {
          setCenteredNodeId(nodes.sibling.id);
          setShowProfile(false);
          onNodeClick?.(nodes.sibling);
        }
      }},
      spouse: { ...nodes.spouse, onAddClick: addButton(nodes.spouse, "spouse"), onClick: () => {
        if(nodes.spouse.status === "placeholder") {
          setCenteredNodeId(nodes.spouse.id);
          setConnections(getDummyConnections());
          setShowProfile(false);
          onNodeClick?.(nodes.spouse);
        } else if(nodes.spouse.status !== "empty") {
          setCenteredNodeId(nodes.spouse.id);
          setShowProfile(false);
          onNodeClick?.(nodes.spouse);
        }
      }},
      child: { ...nodes.child, onAddClick: addButton(nodes.child, "child"), onClick: () => {
        if(nodes.child.status === "placeholder") {
          setCenteredNodeId(nodes.child.id);
          setConnections(getDummyConnections());
          setShowProfile(false);
          onNodeClick?.(nodes.child);
        } else if(nodes.child.status !== "empty") {
          setCenteredNodeId(nodes.child.id);
          setShowProfile(false);
          onNodeClick?.(nodes.child);
        }
      }}
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
    const drawLines = () => {
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
    };

    drawLines();

    window.addEventListener('resize', drawLines);
    return () => {
      window.removeEventListener('resize', drawLines);
    };
  }, [baseNodes]);

  const centerNode: INode = {
    id: centeredNodeId,
    username: currentUser.username,
    fullName: currentUser.fullName,
    status: "connected",
    profilePicture: currentUser.profilePicture
  };

  // Calculate profile box dimensions based on window size and 75% coverage
  const [profileBoxStyle, setProfileBoxStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updateProfileBoxStyle = () => {
      const width = window.innerWidth * 0.75;
      const height = window.innerHeight * 0.75;
      const aspectRatio = window.innerWidth / window.innerHeight;

      let boxWidth = width;
      let boxHeight = height;

      // Adjust box dimensions to maintain aspect ratio
      if (boxWidth / boxHeight > aspectRatio) {
        boxWidth = boxHeight * aspectRatio;
      } else {
        boxHeight = boxWidth / aspectRatio;
      }

      setProfileBoxStyle({
        width: boxWidth,
        height: boxHeight,
        position: "fixed",
        top: `calc(50% - ${boxHeight / 2}px)`,
        left: `calc(50% - ${boxWidth / 2}px)`,
        backgroundColor: "white",
        boxShadow: "0 0 15px 5px #5cab79",
        borderRadius: "12px",
        padding: "20px",
        zIndex: 1000,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      });
    };

    updateProfileBoxStyle();
    window.addEventListener("resize", updateProfileBoxStyle);
    return () => window.removeEventListener("resize", updateProfileBoxStyle);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl shadow-sm p-4 flex items-center justify-center" style={{ backgroundColor: "#dcfce7" }}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {/* Lines will be dynamically rendered here */}
      </svg>

      <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8 md:gap-16 p-2 sm:p-8 items-center">
        {/* Top row (Mother, Father) */}
        <div className="col-start-2 col-span-1 flex justify-end -mt-3 sm:-mt-6" ref={el => nodeRefs.current['mother'] = el}>
          <Node
            node={baseNodes.mother}
            onClick={() => {
              if (baseNodes.mother.status !== "empty") {
                setSelectedNode(baseNodes.mother);
                setShowProfile(true);
              }
              baseNodes.mother.onClick && baseNodes.mother.onClick();
            }}
            onAddClick={baseNodes.mother?.onAddClick}
          />
        </div>
        <div className="col-start-4 col-span-1 flex justify-start -mt-3 sm:-mt-6" ref={el => nodeRefs.current['father'] = el}>
          <Node
            node={baseNodes.father}
            onClick={() => {
              if (baseNodes.father.status !== "empty") {
                setSelectedNode(baseNodes.father);
                setShowProfile(true);
              }
              baseNodes.father.onClick && baseNodes.father.onClick();
            }}
            onAddClick={baseNodes.father?.onAddClick}
          />
        </div>

        {/* Middle row (Sibling, You, Spouse) */}
        <div className="col-start-1 col-span-1 flex justify-center" ref={el => nodeRefs.current['sibling'] = el}>
          <Node
            node={baseNodes.sibling}
            onClick={() => {
              if (baseNodes.sibling.status !== "empty") {
                setSelectedNode(baseNodes.sibling);
                setShowProfile(true);
              }
              baseNodes.sibling.onClick && baseNodes.sibling.onClick();
            }}
            onAddClick={baseNodes.sibling?.onAddClick}
          />
        </div>

        <div className="col-start-3 col-span-1 flex justify-center" ref={centerNodeRef}>
          <Node
            node={centerNode}
            isCenter={true}
            onClick={() => {
              setSelectedNode(centerNode);
              setShowProfile(true);
            }}
            onAddClick={() => {
              setSelectedRelation(null);
              setShowAddRelativeModal(true);
            }}
          />
        </div>

        <div className="col-start-5 col-span-1 flex justify-center" ref={el => nodeRefs.current['spouse'] = el}>
          <Node
            node={baseNodes.spouse}
            onClick={() => {
              if (baseNodes.spouse.status !== "empty") {
                setSelectedNode(baseNodes.spouse);
                setShowProfile(true);
              }
              baseNodes.spouse.onClick && baseNodes.spouse.onClick();
            }}
            onAddClick={baseNodes.spouse?.onAddClick}
          />
        </div>

        {/* Bottom row (Child) */}
        <div className="col-start-3 col-span-1 flex justify-center mt-6" ref={el => nodeRefs.current['child'] = el}>
          <Node
            node={baseNodes.child}
            onClick={() => {
              if (baseNodes.child.status !== "empty") {
                setSelectedNode(baseNodes.child);
                setShowProfile(true);
              }
              baseNodes.child.onClick && baseNodes.child.onClick();
            }}
            onAddClick={baseNodes.child?.onAddClick}
          />
        </div>
      </div>

      {showProfile && selectedNode && (
        <div style={profileBoxStyle} onClick={(e) => e.stopPropagation()}>
          <h2 className="text-2xl font-bold mb-4 text-center">Profile</h2>
          <div className="space-y-4 text-center">
            {selectedNode.username && (
              <div><strong>Username:</strong> {selectedNode.username}</div>
            )}
            {selectedNode.nickname && (
              <div><strong>Nickname:</strong> {selectedNode.nickname}</div>
            )}
            <div><strong>Full Name:</strong> {selectedNode.name ?? selectedNode.fullName}</div>
            {/* Optionally show other details if available */}
            {selectedNode.description && <div><strong>Description:</strong> {selectedNode.description}</div>}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-[#5cab79] text-white rounded hover:bg-[#4a8a62]"
            onClick={() => setShowProfile(false)}
          >
            Close
          </button>
        </div>
      )}

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
            handleAddRelativeFromModal(data);
            // Refresh connections after adding relative
            getUserRelations(centeredNodeId).then(data => {
              if (data && data.relations) {
                const newConnections = {
                  mother: undefined,
                  father: undefined,
                  siblings: [],
                  spouse: undefined,
                  children: []
                };
                data.relations.forEach((relation: any) => {
                  const node: INode = {
                    id: relation.toUser?._id || `placeholder-${relation._id}`,
                    username: relation.toUser?.username || "",
                    fullName: relation.fullName || "",
                    relation: relation.relationType,
                    nickname: relation.nickname,
                    description: relation.description,
                    status: relation.status === "accepted" ? "connected" : "pending",
                    profilePicture: relation.toUser?.profilePicture
                  };
                  switch (relation.relationType) {
                    case "mother":
                      newConnections.mother = node;
                      break;
                    case "father":
                      newConnections.father = node;
                      break;
                    case "sibling":
                      newConnections.siblings.push(node);
                      break;
                    case "spouse":
                      newConnections.spouse = node;
                      break;
                    case "child":
                      newConnections.children.push(node);
                      break;
                  }
                });
                setConnections(newConnections);
              }
            });
          }}
        />
      )}
    </div>
  );
};
