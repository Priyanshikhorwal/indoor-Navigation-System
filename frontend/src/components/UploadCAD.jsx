import React, { useRef, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';

/**
 * UploadCAD component allows users to drag‑and‑drop CAD/DXF files,
 * shows upload progress, parsing status and graph generation status.
 */
export default function UploadCAD() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState(''); // e.g. "Uploading", "Parsing", "Generating Graph", "Completed"
  const [message, setMessage] = useState('');

  const handleFiles = (files) => {
    if (files.length === 0) return;
    const selected = files[0];
    // Simple validation: allow only .dxf, .svg, .png, .jpg
    const allowed = /\.(dxf|svg|png|jpe?g)$/i;
    if (!allowed.test(selected.name)) {
      setMessage('Unsupported file type');
      return;
    }
    setFile(selected);
    setMessage('');
    uploadFile(selected);
  };

  const uploadFile = async (selectedFile) => {
    setStatus('Uploading');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await api.uploadCAD(formData, (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      });
      setStatus('Parsing');
      // backend should start async processing; we poll for status
      await pollProcessingStatus(response.data.uploadId);
    } catch (e) {
      console.error(e);
      setStatus('Failed');
      setMessage('Upload failed');
    }
  };

  const pollProcessingStatus = async (uploadId) => {
    const maxAttempts = 30;
    let attempt = 0;
    const interval = 3000; // ms
    const check = async () => {
      attempt++;
      try {
        const { data } = await api.getUploadStatus(uploadId);
        setStatus(data.status);
        setMessage(data.message || '');
        if (data.status === 'COMPLETED' || data.status === 'FAILED' || attempt >= maxAttempts) {
          return;
        }
        setTimeout(check, interval);
      } catch (e) {
        console.error(e);
        setStatus('Failed');
      }
    };
    await check();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    handleFiles(dt.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Upload CAD / DXF Floor Plan</h2>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded mb-4"
        onClick={openFileDialog}
      >
        Choose File
      </motion.button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".dxf,.svg,.png,.jpg,.jpeg"
      />
      {file && (
        <div className="mt-4 text-gray-300">
          <p>File: {file.name}</p>
          <p>Status: {status}</p>
          {status === 'Uploading' && (
            <div className="w-full bg-gray-700 rounded h-4 mt-2">
              <div
                className="bg-blue-500 h-4 rounded"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          {message && <p className="mt-2 text-sm text-yellow-300">{message}</p>}
        </div>
      )}
    </div>
  );
}
