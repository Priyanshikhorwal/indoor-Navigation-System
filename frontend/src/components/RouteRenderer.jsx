import React from 'react';

const RouteRenderer = ({ path, currentFloorId }) => {
    if (!path || path.length < 2) return null;

    const isAllFloors = currentFloorId === 'All';

    // Helper to check if a node is on the current floor
    const isNodeVisible = (node) => {
        if (isAllFloors) return true;
        return node.floor && node.floor.id.toString() === currentFloorId.toString();
    };

    // Filter connections (lines) between consecutive nodes on the current floor
    const segments = [];
    for (let i = 0; i < path.length - 1; i++) {
        const curr = path[i];
        const next = path[i + 1];

        // Draw connection if both nodes are on the current visible floor (or if "All Floors" is active)
        const currVisible = isNodeVisible(curr);
        const nextVisible = isNodeVisible(next);

        if (currVisible && nextVisible) {
            // Also ensure it is not an inter-floor transition line unless in "All Floors" mode
            const isSameFloor = curr.floor?.id === next.floor?.id;
            if (isSameFloor || isAllFloors) {
                segments.push({
                    key: `segment-${i}-${curr.id}-${next.id}`,
                    x1: curr.xcoordinate ?? curr.xCoordinate,
                    y1: curr.ycoordinate ?? curr.yCoordinate,
                    x2: next.xcoordinate ?? next.xCoordinate,
                    y2: next.ycoordinate ?? next.yCoordinate,
                    isTransition: !isSameFloor
                });
            }
        }
    }

    const startNode = path[0];
    const endNode = path[path.length - 1];

    const showStartMarker = isNodeVisible(startNode);
    const showEndMarker = isNodeVisible(endNode);

    const startX = startNode.xcoordinate ?? startNode.xCoordinate;
    const startY = startNode.ycoordinate ?? startNode.yCoordinate;

    const endX = endNode.xcoordinate ?? endNode.xCoordinate;
    const endY = endNode.ycoordinate ?? endNode.yCoordinate;

    return (
        <g id="route-layer">
            {/* Draw Path segments */}
            {segments.map((seg) => (
                <g key={seg.key}>
                    {/* Glowing under-line */}
                    <line
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke={seg.isTransition ? "#8b5cf6" : "#0d9488"} // Violet for floor change, Teal for walking
                        strokeWidth="7"
                        strokeLinecap="round"
                        opacity="0.25"
                    />
                    {/* Animated path line */}
                    <line
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke={seg.isTransition ? "#8b5cf6" : "#0d9488"}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={seg.isTransition ? "4 4" : "8 5"}
                        className="route-line-animated"
                    />
                </g>
            ))}

            {/* Start Pin Marker */}
            {showStartMarker && (
                <g transform={`translate(${startX}, ${startY})`} className="cursor-pointer">
                    {/* Pulsing Green circle */}
                    <circle r="14" fill="#10b981" opacity="0.3" className="marker-pulse" />
                    <circle r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <circle r="3" fill="#ffffff" />
                </g>
            )}

            {/* Destination Pin Marker */}
            {showEndMarker && (
                <g transform={`translate(${endX}, ${endY})`} className="cursor-pointer">
                    {/* Pulsing Teal circle */}
                    <circle r="14" fill="#0d9488" opacity="0.3" className="marker-pulse" />
                    <circle r="8" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                    <circle r="3" fill="#ffffff" />
                </g>
            )}
        </g>
    );
};

export default RouteRenderer;
