import React from 'react';
import UploadCAD from '../components/UploadCAD';
import { motion } from 'framer-motion';

export default function AdminCAD() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-darkCard p-6 rounded-xl shadow border border-gray-100 dark:border-gray-800"
      >
        <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
          CAD / DXF Upload Center
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Drag‑and‑drop a CAD/DXF file to generate floor maps and navigation graphs.
          The system will parse the file, detect rooms, corridors, stairs, and lifts,
          generate graph nodes/edges and store them for user navigation.
        </p>
        <UploadCAD />
      </motion.div>
    </div>
  );
}
