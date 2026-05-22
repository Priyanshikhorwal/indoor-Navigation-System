import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CADMapViewer from '../components/CADMapViewer';
import GraphViewer from '../components/GraphViewer';
import FloorSwitcher from '../components/FloorSwitcher';
import NavigationPanel from '../components/NavigationPanel';
import { useNavigate } from 'react-router-dom';

/**
 * MapPage composes the GIS viewer.
 * It loads the selected floor image, graph data and provides UI controls.
 */
export default function MapPage() {
  const [floorId, setFloorId] = useState(null);
  const [floorImage, setFloorImage] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [routeEdges, setRouteEdges] = useState([]);
  const [instructions, setInstructions] = useState([]);

  // Load available floors on mount
  useEffect(() => {
    async function fetchFloors() {
      try {
        const { data } = await axios.get('/api/floors');
        if (data && data.length) {
          setFloorId(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch floors', e);
      }
    }
    fetchFloors();
  }, []);

  // Load floor image whenever floor changes
  useEffect(() => {
    if (!floorId) return;
    async function fetchImage() {
      try {
        const { data } = await axios.get(`/api/floors/${floorId}/image`);
        setFloorImage(data.imageUrl);
      } catch (e) {
        console.error('Failed to load floor image', e);
      }
    }
    fetchImage();
  }, [floorId]);

  const handleGenerateRoute = async () => {
    if (!selectedSource || !selectedTarget) return;
    try {
      const { data } = await axios.post('/api/navigation/route', {
        sourceId: selectedSource,
        destinationId: selectedTarget,
        floorId,
      });
      setRouteEdges(data.edgeIds);
      setInstructions(data.instructions);
    } catch (e) {
      console.error('Route generation failed', e);
    }
  };

  const handleNodeSelect = (nodeId) => {
    if (!selectedSource) {
      setSelectedSource(nodeId);
    } else if (!selectedTarget) {
      setSelectedTarget(nodeId);
    }
  };

  const resetSelection = () => {
    setSelectedSource(null);
    setSelectedTarget(null);
    setRouteEdges([]);
    setInstructions([]);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar UI controls */}
      <div className="w-64 p-4 bg-gray-800 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Navigation Controls</h2>
        <FloorSwitcher floorId={floorId} setFloorId={setFloorId} />
        <button
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 py-2 rounded"
          onClick={handleGenerateRoute}
          disabled={!selectedSource || !selectedTarget}
        >
          Generate Route
        </button>
        <button
          className="mt-2 w-full bg-gray-600 hover:bg-gray-500 py-2 rounded"
          onClick={resetSelection}
        >
          Reset
        </button>
        <NavigationPanel instructions={instructions} />
      </div>

      {/* Main map area */}
      <div className="flex-1 relative">
        {floorImage && (
          <CADMapViewer src={floorImage} width={window.innerWidth - 256} height={window.innerHeight} />
        )}
        {floorId && (
          <GraphViewer
            floorId={floorId}
            routeEdges={routeEdges}
            onNodeSelect={handleNodeSelect}
          />
        )}
      </div>
    </div>
  );
}
