import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Circle, Line } from 'react-konva';
import axios from 'axios';

/**
 * GraphViewer renders nodes and edges on top of the CAD map.
 * Props:
 *   floorId – current floor identifier used to fetch graph data.
 *   routeEdges – array of edge ids representing the active route (optional).
 *   onNodeSelect – callback(nodeId) when a node is clicked.
 */
export default function GraphViewer({ floorId, routeEdges = [], onNodeSelect }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const stageRef = useRef(null);

  useEffect(() => {
    // Load graph data for the selected floor
    async function fetchGraph() {
      try {
        const { data } = await axios.get(`/api/graph/floor/${floorId}`);
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (err) {
        console.error('Failed to load graph', err);
      }
    }
    fetchGraph();
  }, [floorId]);

  const isEdgeInRoute = (edgeId) => routeEdges.includes(edgeId);

  const handleNodeClick = (nodeId) => {
    if (onNodeSelect) onNodeSelect(nodeId);
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
      <Layer>
        {edges.map((e) => (
          <Line
            key={e.id}
            points={[e.sourceX, e.sourceY, e.targetX, e.targetY]}
            stroke={isEdgeInRoute(e.id) ? '#ffcc00' : '#555'}
            strokeWidth={isEdgeInRoute(e.id) ? 4 : 2}
            lineCap="round"
          />
        ))}
        {nodes.map((n) => (
          <Circle
            key={n.id}
            x={n.x}
            y={n.y}
            radius={8}
            fill={routeEdges.length && routeEdges.includes(n.id) ? '#ff6600' : '#00aaff'}
            stroke="#fff"
            strokeWidth={2}
            onClick={() => handleNodeClick(n.id)}
            perfectDrawEnabled={false}
          />
        ))}
      </Layer>
    </Stage>
  );
}
