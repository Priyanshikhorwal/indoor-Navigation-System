import React from 'react';

// Hardcoded SVG geometry bounds for each seeded room name
const roomLayouts = {
    // Ground Floor
    "Reception": { x: 150, y: 60, w: 220, h: 120, color: "fill-teal-50 stroke-teal-400 dark:fill-teal-950/20 dark:stroke-teal-700" },
    "Admin Office": { x: 430, y: 60, w: 220, h: 120, color: "fill-emerald-50 stroke-emerald-400 dark:fill-emerald-950/20 dark:stroke-emerald-700" },
    "Room G101": { x: 150, y: 300, w: 220, h: 110, color: "fill-sky-50 stroke-sky-400 dark:fill-sky-950/20 dark:stroke-sky-700" },
    "Room G102": { x: 430, y: 300, w: 220, h: 110, color: "fill-sky-50 stroke-sky-400 dark:fill-sky-950/20 dark:stroke-sky-700" },
    "Stairs G": { x: 60, y: 190, w: 80, h: 100, color: "fill-amber-50 stroke-amber-400 dark:fill-amber-950/20 dark:stroke-amber-700" },
    "Lift G": { x: 660, y: 190, w: 80, h: 100, color: "fill-purple-50 stroke-purple-400 dark:fill-purple-950/20 dark:stroke-purple-700" },
    "Entry/Exit": { x: 360, y: 420, w: 80, h: 30, color: "fill-rose-50 stroke-rose-400 dark:fill-rose-950/20 dark:stroke-rose-700" },
    "Corridor G": { x: 140, y: 190, w: 520, h: 100, color: "fill-gray-100/50 stroke-gray-300 dark:fill-gray-900/30 dark:stroke-gray-700" },

    // First Floor
    "Classroom 101": { x: 120, y: 60, w: 150, h: 120, color: "fill-sky-50 stroke-sky-400 dark:fill-sky-950/20 dark:stroke-sky-700" },
    "Classroom 102": { x: 325, y: 60, w: 150, h: 120, color: "fill-sky-50 stroke-sky-400 dark:fill-sky-950/20 dark:stroke-sky-700" },
    "Lab 1": { x: 530, y: 60, w: 150, h: 120, color: "fill-indigo-50 stroke-indigo-400 dark:fill-indigo-950/20 dark:stroke-indigo-700" },
    "Lab 2": { x: 150, y: 300, w: 220, h: 110, color: "fill-indigo-50 stroke-indigo-400 dark:fill-indigo-950/20 dark:stroke-indigo-700" },
    "Faculty Room": { x: 430, y: 300, w: 220, h: 110, color: "fill-emerald-50 stroke-emerald-400 dark:fill-emerald-950/20 dark:stroke-emerald-700" },
    "Stairs 1": { x: 60, y: 190, w: 80, h: 100, color: "fill-amber-50 stroke-amber-400 dark:fill-amber-950/20 dark:stroke-amber-700" },
    "Lift 1": { x: 660, y: 190, w: 80, h: 100, color: "fill-purple-50 stroke-purple-400 dark:fill-purple-950/20 dark:stroke-purple-700" },
    "Corridor 1": { x: 140, y: 190, w: 520, h: 100, color: "fill-gray-100/50 stroke-gray-300 dark:fill-gray-900/30 dark:stroke-gray-700" },

    // Second Floor
    "Library": { x: 120, y: 60, w: 260, h: 120, color: "fill-teal-50 stroke-teal-400 dark:fill-teal-950/20 dark:stroke-teal-700" },
    "Seminar Hall": { x: 420, y: 60, w: 260, h: 120, color: "fill-rose-50 stroke-rose-400 dark:fill-rose-950/20 dark:stroke-rose-700" },
    "Server Room": { x: 150, y: 300, w: 220, h: 110, color: "fill-red-50 stroke-red-400 dark:fill-red-950/20 dark:stroke-red-700" },
    "Research Lab": { x: 430, y: 300, w: 220, h: 110, color: "fill-indigo-50 stroke-indigo-400 dark:fill-indigo-950/20 dark:stroke-indigo-700" },
    "Stairs 2": { x: 60, y: 190, w: 80, h: 100, color: "fill-amber-50 stroke-amber-400 dark:fill-amber-950/20 dark:stroke-amber-700" },
    "Lift 2": { x: 660, y: 190, w: 80, h: 100, color: "fill-purple-50 stroke-purple-400 dark:fill-purple-950/20 dark:stroke-purple-700" },
    "Corridor 2": { x: 140, y: 190, w: 520, h: 100, color: "fill-gray-100/50 stroke-gray-300 dark:fill-gray-900/30 dark:stroke-gray-700" }
};

const RoomLayer = ({ rooms, onRoomClick, sourceId, destinationId, path, onRoomHover }) => {
    return (
        <g id="rooms-group">
            {rooms.map((room) => {
                const layout = roomLayouts[room.name];
                if (!layout) return null;

                const isSource = sourceId === room.id.toString();
                const isDest = destinationId === room.id.toString();
                const isInPath = path.some(p => p.room && p.room.id === room.id);

                let fillStrokeClass = layout.color;
                let isInteractive = room.type !== 'CORRIDOR';

                // Styling states
                if (isSource) {
                    fillStrokeClass = "fill-emerald-100 stroke-emerald-600 stroke-[3] dark:fill-emerald-950/40 dark:stroke-emerald-500";
                } else if (isDest) {
                    fillStrokeClass = "fill-rose-100 stroke-rose-600 stroke-[3] dark:fill-rose-950/40 dark:stroke-rose-500";
                } else if (isInPath) {
                    fillStrokeClass = "fill-teal-100/80 stroke-teal-500 stroke-[2] dark:fill-teal-900/40 dark:stroke-teal-500";
                }

                return (
                    <g
                        key={room.id}
                        className={`${isInteractive ? 'cursor-pointer group' : ''} transition-all duration-200`}
                        onClick={() => isInteractive && onRoomClick(room)}
                        onPointerOver={(e) => isInteractive && onRoomHover && onRoomHover(room)}
                        onPointerOut={() => isInteractive && onRoomHover && onRoomHover(null)}
                    >
                        {/* Room boundary box */}
                        <rect
                            x={layout.x}
                            y={layout.y}
                            width={layout.w}
                            height={layout.h}
                            rx={room.type === 'STAIRS' || room.type === 'LIFT' ? 6 : 8}
                            className={`${fillStrokeClass} transition-colors duration-200 hover:opacity-90`}
                            style={{ filter: isSource || isDest ? 'drop-shadow(0px 0px 4px rgba(0,0,0,0.1))' : 'none' }}
                        />

                        {/* Room Name Label */}
                        <text
                            x={layout.x + layout.w / 2}
                            y={layout.y + layout.h / 2 + 3}
                            textAnchor="middle"
                            className={`text-[11px] font-black pointer-events-none select-none ${
                                isSource
                                    ? 'fill-emerald-800 dark:fill-emerald-200'
                                    : isDest
                                    ? 'fill-rose-800 dark:fill-rose-200'
                                    : isInPath
                                    ? 'fill-teal-800 dark:fill-teal-200 font-extrabold'
                                    : 'fill-gray-700 dark:fill-gray-300'
                            }`}
                        >
                            {room.name}
                        </text>

                        {/* Visual icons/decorations for stairs or lifts */}
                        {room.type === 'STAIRS' && (
                            <path
                                d={`M ${layout.x + 10} ${layout.y + layout.h - 15} L ${layout.x + layout.w - 10} ${layout.y + 15}`}
                                stroke="#b45309"
                                strokeWidth="2"
                                strokeDasharray="3, 3"
                                className="pointer-events-none"
                                opacity="0.6"
                            />
                        )}
                        {room.type === 'LIFT' && (
                            <rect
                                x={layout.x + 10}
                                y={layout.y + 10}
                                width={layout.w - 20}
                                height={layout.h - 20}
                                fill="none"
                                stroke="#7e22ce"
                                strokeWidth="1"
                                className="pointer-events-none"
                                opacity="0.3"
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
};

export default RoomLayer;
