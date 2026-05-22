import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

/**
 * FloorSwitcher component fetches floor list and allows user to switch floors.
 * Props:
 *   floorId - currently selected floor id
 *   setFloorId - function to update selected floor
 */
export default function FloorSwitcher({ floorId, setFloorId }) {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getFloors()
      .then((data) => {
        if (mounted) {
          setFloors(data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const id = e.target.value;
    setFloorId(id);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-200 mb-1">Select Floor</label>
      {loading ? (
        <div className="text-gray-400">Loading floors…</div>
      ) : (
        <motion.select
          className="w-full bg-gray-700 text-white py-2 px-3 rounded"
          value={floorId || ''}
          onChange={handleChange}
          whileTap={{ scale: 0.95 }}
        >
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} (Level {f.level})
            </option>
          ))}
        </motion.select>
      )}
      <AnimatePresence>
        {floorId && (
          <motion.p
            className="mt-2 text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Active Floor: {floors.find((f) => f.id === floorId)?.name || ''}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
