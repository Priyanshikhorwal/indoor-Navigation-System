import React, { useEffect, useState } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NavigationPanel provides UI for selecting source/destination nodes,
 * displays generated instructions, estimated distance/time.
 * Props:
 *   floorId - current floor id to fetch nodes
 *   routeEdges - optional list of edge IDs for visual feedback (unused here)
 *   onRouteGenerated - callback with route data (edgeIds, instructions)
 */
export default function NavigationPanel({ floorId, routeEdges, onRouteGenerated }) {
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);

  // Load nodes for the current floor
  useEffect(() => {
    if (!floorId) return;
    setLoadingNodes(true);
    api.getNodes(floorId)
      .then((data) => {
        setNodes(data);
        setLoadingNodes(false);
      })
      .catch(() => setLoadingNodes(false));
  }, [floorId]);

  const handleGenerate = async () => {
    if (!source || !target) return;
    setGenerating(true);
    try {
      const { data } = await api.getRoute({ sourceId: source, destinationId: target, floorId });
      setSummary({ distance: data.distance, time: data.estimatedTime, instructions: data.instructions });
      if (onRouteGenerated) onRouteGenerated(data);
    } catch (e) {
      console.error('Route generation error', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-200">Navigation Panel</h3>
      {loadingNodes ? (
        <p className="text-gray-400">Loading nodes…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <motion.select
            className="w-full bg-gray-700 text-white py-2 px-3 rounded"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            whileTap={{ scale: 0.95 }}
          >
            <option value="">Select source</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name || `Room ${n.id}`}
              </option>
            ))}
          </motion.select>
          <motion.select
            className="w-full bg-gray-700 text-white py-2 px-3 rounded"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            whileTap={{ scale: 0.95 }}
          >
            <option value="">Select destination</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name || `Room ${n.id}`}
              </option>
            ))}
          </motion.select>
          <button
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded disabled:opacity-50"
            onClick={handleGenerate}
            disabled={!source || !target || generating}
          >
            {generating ? 'Generating…' : 'Generate Route'}
          </button>
        </div>
      )}
      <AnimatePresence>
        {summary && (
          <motion.div
            className="mt-4 p-3 bg-gray-700 rounded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-sm text-gray-300">Distance: {summary.distance?.toFixed(2)} m</p>
            <p className="text-sm text-gray-300">Estimated time: {summary.time} sec</p>
            <ol className="mt-2 list-decimal list-inside text-gray-200 text-sm">
              {summary.instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
