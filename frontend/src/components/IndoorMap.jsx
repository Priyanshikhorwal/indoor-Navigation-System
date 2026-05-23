import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import RoomLayer from './RoomLayer';
import RouteRenderer from './RouteRenderer';

const IndoorMap = ({
    rooms,
    path,
    selectedFloorId,
    onRoomClick,
    sourceId,
    destinationId
}) => {
    // Zoom & Pan states
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [hoveredRoom, setHoveredRoom] = useState(null);

    const svgWidth = 800;
    const svgHeight = 500;

    // Zoom and Pan Handlers
    const handlePointerDown = (e) => {
        if (e.target.tagName === 'svg' || e.target.tagName === 'rect' || e.target.tagName === 'path') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e) => {
        if (!isPanning) return;
        setPan({
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
        });
    };

    const handlePointerUp = (e) => {
        if (isPanning) {
            setIsPanning(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    const handleWheel = (e) => {
        const zoomFactor = 1.1;
        const nextZoom = e.deltaY < 0 ? Math.min(zoom * zoomFactor, 4) : Math.max(zoom / zoomFactor, 0.6);
        setZoom(nextZoom);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.2, 4));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.2, 0.6));
    };

    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div className="relative border border-gray-200 dark:border-darkBorder rounded-3xl overflow-hidden bg-[#fafcfa] dark:bg-darkBg aspect-[8/5] shadow-lg">
            
            {/* Tooltip Overlay */}
            {hoveredRoom && (
                <div
                    className="absolute bg-white/95 dark:bg-darkCard/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-gray-150 dark:border-darkBorder z-30 pointer-events-none transition-all duration-100 max-w-[200px]"
                    style={{
                        left: `${((hoveredRoom.xCoordinate ?? 400) * zoom + pan.x) / svgWidth * 100}%`,
                        top: `${((hoveredRoom.yCoordinate ?? 250) * zoom + pan.y) / svgHeight * 100 - 8}%`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="text-xs font-black text-teal-950 dark:text-teal-200">{hoveredRoom.name}</div>
                    {hoveredRoom.type && (
                        <div className="text-[9px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wide mt-0.5">
                            {hoveredRoom.type}
                        </div>
                    )}
                    {hoveredRoom.description && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-normal font-medium">
                            {hoveredRoom.description}
                        </div>
                    )}
                    <div className="text-[9px] text-teal-500 dark:text-teal-400 font-bold mt-1.5 italic select-none">
                        Click to select endpoint
                    </div>
                </div>
            )}

            {/* Interactive SVG Canvas */}
            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full select-none touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
            >
                {/* Blueprint grid pattern definition */}
                <defs>
                    <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e6ece9" strokeWidth="1" className="dark:stroke-darkHover/30" />
                        <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#dbe5e0" strokeWidth="1.5" className="dark:stroke-darkHover/50" />
                    </pattern>
                </defs>

                {/* Grid underlay inside pan/zoom group */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    
                    {/* Background Grid */}
                    <rect width={svgWidth} height={svgHeight} fill="url(#blueprint-grid)" className="dark:fill-darkBg" />
                    
                    {/* Outer Building Wall Outline */}
                    <rect
                        x="30"
                        y="30"
                        width={svgWidth - 60}
                        height={svgHeight - 60}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="opacity-20 dark:opacity-40"
                    />

                    {/* Rooms layer */}
                    <RoomLayer
                        rooms={rooms}
                        onRoomClick={onRoomClick}
                        sourceId={sourceId}
                        destinationId={destinationId}
                        path={path}
                        onRoomHover={setHoveredRoom}
                    />

                    {/* Route renderer */}
                    <RouteRenderer
                        path={path}
                        currentFloorId={selectedFloorId}
                    />
                </g>
            </svg>

            {/* Floating Zoom & Pan Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/90 dark:bg-darkCard/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-gray-100 dark:border-darkBorder">
                <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-darkHover rounded-xl text-teal-950 dark:text-gray-200 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-darkHover rounded-xl text-teal-950 dark:text-gray-200 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleResetView}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-darkHover rounded-xl text-teal-950 dark:text-gray-200 transition-colors"
                    title="Reset View"
                >
                    <Maximize className="w-4 h-4" />
                </button>
            </div>

            {/* Help Indicator Overlay */}
            <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-teal-950/80 backdrop-blur-md rounded-xl text-[10px] text-white font-extrabold shadow-md pointer-events-none select-none tracking-wide uppercase">
                Drag to Pan • Scroll to Zoom
            </div>
        </div>
    );
};

export default IndoorMap;
