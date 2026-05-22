import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

/**
 * CADMapViewer renders an uploaded CAD/floor map.
 * Props:
 *   src: URL of the floor image (PNG/SVG converted on backend)
 *   width, height: viewport dimensions
 *   onZoomChange: callback(currentScale) → void
 *   layers: optional array of { id, visible, name }
 */
export default function CADMapViewer({ src, width = 800, height = 600, onZoomChange, layers = [] }) {
  const [image] = useImage(src);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isFullScreen, setFullScreen] = useState(false);

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.02;
    const oldScale = stageRef.current.scaleX();
    const pointer = stageRef.current.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stageRef.current.x()) / oldScale,
      y: (pointer.y - stageRef.current.y()) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);
    stageRef.current.scale({ x: newScale, y: newScale });
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stageRef.current.position(newPos);
    stageRef.current.batchDraw();
    if (onZoomChange) onZoomChange(newScale);
  };

  // Dragging the stage
  const handleDrag = (e) => {
    stageRef.current.batchDraw();
  };

  const toggleFullScreen = () => {
    setFullScreen(!isFullScreen);
  };

  // Adjust stage size when fullscreen toggles
  useEffect(() => {
    if (isFullScreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullScreen]);

  return (
    <div className="relative" style={{ width: isFullScreen ? '100%' : width, height: isFullScreen ? '100%' : height }}>
      <button
        className="absolute top-2 left-2 z-10 p-1 bg-gray-800 text-white rounded"
        onClick={toggleFullScreen}
      >
        {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      <Stage
        width={isFullScreen ? window.innerWidth : width}
        height={isFullScreen ? window.innerHeight : height}
        draggable
        onDragMove={handleDrag}
        onWheel={handleWheel}
        ref={stageRef}
        style={{ background: '#1e1e1e' }}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={image.width}
              height={image.height}
            />
          )}
        </Layer>
        {/* Additional layers (e.g., grid, annotations) could be inserted here */}
      </Stage>
    </div>
  );
}
