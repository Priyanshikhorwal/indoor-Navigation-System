import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { Navigation2, MapPin, Compass, RotateCcw, Star, ArrowRight } from 'lucide-react';

const Navigation = () => {
    const [searchParams] = useSearchParams();
    const [locations, setLocations] = useState([]);
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingLocs, setFetchingLocs] = useState(true);
    const [error, setError] = useState('');
    const [selectedMapFloor, setSelectedMapFloor] = useState('All');
    const [hoveredNode, setHoveredNode] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await api.get('/locations');
            setLocations(response.data);
            setFetchingLocs(false);
        } catch (err) {
            setError('Failed to load locations.');
            setFetchingLocs(false);
        }
    };

    const handleFindPath = async (e) => {
        if (e) e.preventDefault();
        if (source === destination) {
            setError('Source and destination cannot be the same.');
            return;
        }
        setLoading(true);
        setError('');
        setPath([]);
        try {
            const response = await api.get(`/path/find?sourceId=${source}&destinationId=${destination}`);
            if (response.data.length === 0) {
                setError('No path found between selected locations.');
            } else {
                setPath(response.data);
                // Automatically switch map floor to source floor for visual focus
                const startLoc = response.data[0];
                if (startLoc && startLoc.floor) {
                    setSelectedMapFloor(startLoc.floor);
                } else {
                    setSelectedMapFloor('All');
                }

                // Log search in user history
                const token = localStorage.getItem('token');
                const email = localStorage.getItem('email');
                if (token && email) {
                    const savedHistory = localStorage.getItem(`history_${email}`);
                    let historyArray = savedHistory ? JSON.parse(savedHistory) : [];
                    
                    const sourceLoc = locations.find(l => l.id.toString() === source);
                    const destLoc = locations.find(l => l.id.toString() === destination);
                    
                    if (sourceLoc && destLoc) {
                        const newQuery = {
                            sourceId: source,
                            destinationId: destination,
                            sourceName: sourceLoc.name,
                            destinationName: destLoc.name,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
                            floors: sourceLoc.floor === destLoc.floor ? `Floor ${sourceLoc.floor}` : `Floors ${sourceLoc.floor} → ${destLoc.floor}`
                        };
                        
                        const isDuplicate = historyArray.some(item => item.sourceId === source && item.destinationId === destination);
                        if (!isDuplicate) {
                            historyArray.unshift(newQuery);
                            if (historyArray.length > 8) historyArray.pop();
                            localStorage.setItem(`history_${email}`, JSON.stringify(historyArray));
                        }
                    }
                }
            }
        } catch (err) {
            setError('Failed to find path. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // Reset saved state when source/destination changes
    useEffect(() => {
        setIsSaved(false);
    }, [source, destination]);

    // Handle saving favorite route
    const handleSaveFavorite = () => {
        const email = localStorage.getItem('email');
        if (!email) return;

        const savedFavorites = localStorage.getItem(`favorites_${email}`);
        let favoritesArray = savedFavorites ? JSON.parse(savedFavorites) : [];

        const sourceLoc = locations.find(l => l.id.toString() === source);
        const destLoc = locations.find(l => l.id.toString() === destination);

        if (sourceLoc && destLoc) {
            const isAlreadySaved = favoritesArray.some(
                fav => fav.sourceId === source && fav.destinationId === destination
            );

            if (!isAlreadySaved) {
                const newFavorite = {
                    sourceId: source,
                    destinationId: destination,
                    sourceName: sourceLoc.name,
                    destinationName: destLoc.name,
                    floorSummary: sourceLoc.floor === destLoc.floor ? `Floor ${sourceLoc.floor}` : `Floors ${sourceLoc.floor} → ${destLoc.floor}`
                };
                favoritesArray.push(newFavorite);
                localStorage.setItem(`favorites_${email}`, JSON.stringify(favoritesArray));
                setIsSaved(true);
            }
        }
    };

    // Prefill coordinates from URL search queries
    useEffect(() => {
        const sourceId = searchParams.get('sourceId');
        const destinationId = searchParams.get('destinationId');
        if (sourceId && destinationId && locations.length > 0) {
            setSource(sourceId);
            setDestination(destinationId);
        }
    }, [searchParams, locations]);

    const handleNodeClick = (loc) => {
        const locIdStr = loc.id.toString();
        if (!source || (source && destination)) {
            setSource(locIdStr);
            setDestination('');
            setPath([]);
            setError('');
        } else {
            if (source === locIdStr) {
                setError('Source and destination cannot be the same.');
                return;
            }
            setDestination(locIdStr);
        }
    };

    const handleReset = () => {
        setSource('');
        setDestination('');
        setPath([]);
        setError('');
        setSelectedMapFloor('All');
    };

    // Calculate path automatically when source and destination are both set via map clicking
    useEffect(() => {
        if (source && destination) {
            handleFindPath();
        }
    }, [source, destination]);

    // Unique floors list for tabs
    const mapFloors = ['All', ...new Set(locations.map(loc => loc.floor).filter(Boolean))];

    // SVG coordinates mapping and normalization
    const padding = 60;
    const svgWidth = 800;
    const svgHeight = 550;

    const validLocations = locations.filter(l => l.xCoordinate !== null && l.yCoordinate !== null);
    const xCoords = validLocations.map(l => l.xCoordinate);
    const yCoords = validLocations.map(l => l.yCoordinate);

    const minX = xCoords.length > 0 ? Math.min(...xCoords) : 0;
    const maxX = xCoords.length > 0 ? Math.max(...xCoords) : 100;
    const minY = yCoords.length > 0 ? Math.min(...yCoords) : 0;
    const maxY = yCoords.length > 0 ? Math.max(...yCoords) : 100;

    const scaleX = (x) => {
        const range = maxX - minX || 1;
        return padding + ((x - minX) / range) * (svgWidth - 2 * padding);
    };

    const scaleY = (y) => {
        const range = maxY - minY || 1;
        return padding + ((y - minY) / range) * (svgHeight - 2 * padding);
    };

    const isPathActive = path.length > 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary to-secondary-dark py-12 px-4">
            {/* Embedded styles for pulse animation and animated route lines */}
            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.6; }
                    100% { transform: scale(0.95); opacity: 1; }
                }
                .marker-pulse {
                    transform-origin: center;
                    animation: pulse-ring 2s infinite ease-in-out;
                }
                @keyframes path-flow {
                    to { stroke-dashoffset: -20; }
                }
                .route-line-animated {
                    stroke-dasharray: 8 4;
                    animation: path-flow 1.2s linear infinite;
                }
            `}</style>

            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Form & Route Guidance */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Navigation2 className="w-7 h-7" />
                                    <h1 className="text-xl font-bold">Find Your Route</h1>
                                </div>
                                {(source || destination || isPathActive) && (
                                    <button 
                                        type="button"
                                        onClick={handleReset} 
                                        className="text-gray-200 hover:text-white flex items-center gap-1 text-xs border border-gray-400 hover:border-white px-2 py-1 rounded transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Clear
                                    </button>
                                )}
                            </div>
                            
                            <div className="p-6">
                                {fetchingLocs ? <Loader /> : (
                                    <form onSubmit={handleFindPath} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                                Current Location
                                            </label>
                                            <select 
                                                required
                                                value={source} 
                                                onChange={(e) => {
                                                    setSource(e.target.value);
                                                    setPath([]);
                                                }}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                                            >
                                                <option value="">Select source...</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>
                                                        {loc.name} {loc.floor && `(Floor ${loc.floor})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent to-accent-light"></div>
                                                Destination
                                            </label>
                                            <select 
                                                required
                                                value={destination} 
                                                onChange={(e) => {
                                                    setDestination(e.target.value);
                                                    setPath([]);
                                                }}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                                            >
                                                <option value="">Select destination...</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>
                                                        {loc.name} {loc.floor && `(Floor ${loc.floor})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {error && <div className="text-accent bg-red-50 p-3 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
                                        
                                        <button 
                                            type="submit" 
                                            disabled={loading || !source || !destination}
                                            className="w-full bg-gradient-to-r from-accent to-accent-light text-white py-3.5 rounded-xl font-bold text-base hover:bg-opacity-95 transition-all disabled:opacity-50 shadow-soft shadow-red-200"
                                        >
                                            {loading ? 'Calculating Path...' : 'Find Shortest Path'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Interactive map helper note */}
                        <div className="bg-gradient-to-r from-primary to-primary-light/5 p-4 rounded-2xl border border-primary/10 text-xs text-primary leading-relaxed flex gap-2">
                            <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span>
                                <strong>Interactive Map Tip:</strong> You can click any room directly on the visual map coordinate graph to set your starting point and destination!
                            </span>
                        </div>

                        {/* Text Route Guidance Timeline */}
                        {isPathActive && (
                            <div className="bg-white rounded-2xl shadow-soft-lg p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-bold text-primary mb-5 flex items-center gap-2">
                                    <MapPin className="text-accent" />
                                    Route Guidance
                                </h2>

                                {/* Dynamic Pinned Favorites Action Widget */}
                                {localStorage.getItem('token') && localStorage.getItem('role') === 'ROLE_USER' ? (
                                    <button 
                                        type="button"
                                        onClick={handleSaveFavorite} 
                                        disabled={isSaved}
                                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border mb-5 ${
                                            isSaved 
                                                ? 'bg-green-55 border-green-200 text-green-750 cursor-default' 
                                                : 'bg-white border-gray-200 hover:border-primary text-primary hover:bg-gray-50'
                                        }`}
                                    >
                                        <Star className={`w-4 h-4 ${isSaved ? 'fill-green-600 text-green-600' : 'text-primary'}`} />
                                        <span>{isSaved ? 'Saved to Favorites!' : 'Save Route to Favorites'}</span>
                                    </button>
                                ) : !localStorage.getItem('token') ? (
                                    <div className="bg-gradient-to-r from-primary to-primary-light/5 border border-primary/10 rounded-xl p-3.5 mb-5 flex flex-col gap-2 animate-in fade-in duration-200">
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                            <Star className="w-4 h-4 text-accent fill-accent shrink-0" />
                                            <span>Pin this Route to Favorites</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                            Register or log in to your personal navigation account to pin your common commutes and travel routes here!
                                        </p>
                                        <Link 
                                            to="/login?tab=register" 
                                            className="text-[10px] font-black text-accent hover:underline flex items-center gap-0.5 mt-0.5"
                                        >
                                            <span>Create a Free Account</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ) : null}
                                
                                <div className="relative border-l-2 border-primary/20 ml-3.5">
                                    {path.map((loc, index) => {
                                        const showTransition = index > 0 && loc.floor !== path[index - 1].floor;
                                        return (
                                            <React.Fragment key={index}>
                                                {showTransition && (
                                                    <div className="mb-6 ml-6 relative">
                                                        <div className="absolute -left-[32px] w-4.5 h-4.5 rounded-full border-2 border-white bg-gradient-to-r from-accent to-accent-light flex items-center justify-center shadow-soft">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                        </div>
                                                        <div className="bg-gradient-to-r from-accent to-accent-light/5 border border-accent/15 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-200">
                                                            <div className="p-1.5 bg-gradient-to-r from-accent to-accent-light/10 text-accent rounded-lg">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Floor Transition</h4>
                                                                <p className="text-xs text-gray-700 mt-0.5 font-medium">
                                                                    Take Stairs / Elevator up to <strong className="text-accent font-black">Floor {loc.floor}</strong>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="mb-6 ml-6 relative">
                                                    {/* Glowing indicator circles */}
                                                    <div 
                                                        className={`absolute -left-[32px] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center ${
                                                            index === 0 
                                                                ? 'bg-green-500 shadow-soft shadow-green-200' 
                                                                : index === path.length - 1 
                                                                    ? 'bg-gradient-to-r from-accent to-accent-light shadow-soft shadow-red-200' 
                                                                    : 'bg-gradient-to-r from-primary to-primary-light'
                                                        }`}
                                                    >
                                                        {/* Minor inner dot for visually premium look */}
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-gray-800 leading-none">{loc.name}</h3>
                                                    {loc.description && <p className="text-gray-500 text-xs mt-1">{loc.description}</p>}
                                                    {loc.floor && (
                                                        <span className="inline-block mt-1 text-[10px] font-bold bg-gradient-to-br from-secondary to-secondary-dark text-primary px-1.5 py-0.5 rounded uppercase">
                                                            Floor {loc.floor}
                                                        </span>
                                                    )}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Visual Map Coordinate Grid */}
                    <div className="lg:col-span-8 bg-white rounded-2xl shadow-soft-lg p-6 border border-gray-100 flex flex-col space-y-4">
                        
                        {/* Map Header & Floor Tab Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-primary">Interactive Floor Map</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Visual representation of nodes and computed routes</p>
                            </div>
                            
                            {/* Dynamic Floor Selector Tabs */}
                            <div className="flex flex-wrap gap-1.5 bg-gradient-to-br from-secondary to-secondary-dark p-1 rounded-xl">
                                {mapFloors.map(floor => (
                                    <button
                                        type="button"
                                        key={floor}
                                        onClick={() => setSelectedMapFloor(floor)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            selectedMapFloor === floor
                                                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-soft'
                                                : 'text-primary/70 hover:text-primary hover:bg-white/50'
                                        }`}
                                    >
                                        {floor === 'All' ? 'All Floors' : `Floor ${floor}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Graph Canvas Wrapper */}
                        <div className="relative border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50 aspect-[8/5.5]">
                            
                            {/* Tooltip Overlay */}
                            {hoveredNode && (
                                <div 
                                    className="absolute bg-white/95 backdrop-blur p-3 rounded-xl shadow-soft-lg border border-gray-100 z-30 pointer-events-none transition-all duration-100"
                                    style={{
                                        left: `${(scaleX(hoveredNode.xCoordinate) / svgWidth) * 100}%`,
                                        top: `${(scaleY(hoveredNode.yCoordinate) / svgHeight) * 100 - 15}%`,
                                        transform: 'translate(-50%, -100%)'
                                    }}
                                >
                                    <div className="text-xs font-bold text-primary">{hoveredNode.name}</div>
                                    {hoveredNode.floor && <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Floor {hoveredNode.floor}</div>}
                                    {hoveredNode.description && <div className="text-[10px] text-gray-500 mt-1 max-w-[160px] line-clamp-2">{hoveredNode.description}</div>}
                                    <div className="text-[9px] text-accent font-bold mt-1.5 italic">Click to select</div>
                                </div>
                            )}

                            {/* SVG Container */}
                            <svg 
                                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                                className="w-full h-full"
                            >
                                {/* Pattern grid definition for blueprint map layout */}
                                <defs>
                                    <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2EAE7" strokeWidth="1"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

                                {/* Draw All Calculated Path Connections (Underlay lines) */}
                                {isPathActive && path.map((loc, idx) => {
                                    if (idx === path.length - 1) return null;
                                    const nextLoc = path[idx + 1];
                                    const isOnActiveFloor = selectedMapFloor === 'All' || 
                                                           (loc.floor === selectedMapFloor && nextLoc.floor === selectedMapFloor);
                                    
                                    return (
                                        <g key={`path-segment-${idx}`}>
                                            {/* Glowing Under-layer Path shadow */}
                                            <line 
                                                x1={scaleX(loc.xCoordinate)}
                                                y1={scaleY(loc.yCoordinate)}
                                                x2={scaleX(nextLoc.xCoordinate)}
                                                y2={scaleY(nextLoc.yCoordinate)}
                                                stroke="#FB3640"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                opacity={isOnActiveFloor ? 0.25 : 0.05}
                                            />
                                            {/* Glowing flow animated pathway line */}
                                            <line 
                                                x1={scaleX(loc.xCoordinate)}
                                                y1={scaleY(loc.yCoordinate)}
                                                x2={scaleX(nextLoc.xCoordinate)}
                                                y2={scaleY(nextLoc.yCoordinate)}
                                                stroke="#FB3640"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                className="route-line-animated"
                                                opacity={isOnActiveFloor ? 1 : 0.1}
                                            />
                                        </g>
                                    );
                                })}

                                {/* Draw Node Circles */}
                                {locations.map(loc => {
                                    if (loc.xCoordinate === null || loc.yCoordinate === null) return null;

                                    const cx = scaleX(loc.xCoordinate);
                                    const cy = scaleY(loc.yCoordinate);
                                    const isSource = source === loc.id.toString();
                                    const isDest = destination === loc.id.toString();
                                    const isInPath = path.some(p => p.id === loc.id);
                                    
                                    const isFloorVisible = selectedMapFloor === 'All' || loc.floor === selectedMapFloor;
                                    
                                    // Visual color configuration
                                    let strokeColor = '#94A3B8';
                                    let fillCol = '#FFFFFF';
                                    let radius = 7;

                                    if (isSource) {
                                        fillCol = '#22C55E';
                                        strokeColor = '#86EFAC';
                                        radius = 9.5;
                                    } else if (isDest) {
                                        fillCol = '#FB3640';
                                        strokeColor = '#FECACA';
                                        radius = 9.5;
                                    } else if (isInPath) {
                                        fillCol = '#0A2463';
                                        strokeColor = '#93C5FD';
                                        radius = 8;
                                    }

                                    return (
                                        <g 
                                            key={loc.id}
                                            onClick={() => isFloorVisible && handleNodeClick(loc)}
                                            onMouseEnter={() => isFloorVisible && setHoveredNode(loc)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                            className={`cursor-pointer transition-all duration-200 ${
                                                isFloorVisible ? 'opacity-100' : 'opacity-15'
                                            }`}
                                        >
                                            {/* Glowing pulse ring around start and end locations */}
                                            {(isSource || isDest) && isFloorVisible && (
                                                <circle 
                                                    cx={cx} 
                                                    cy={cy} 
                                                    r={radius + 6} 
                                                    fill="none" 
                                                    stroke={isSource ? '#22C55E' : '#FB3640'} 
                                                    strokeWidth="1.5"
                                                    className="marker-pulse"
                                                />
                                            )}

                                            {/* Outer clickable focus ring anchor */}
                                            <circle 
                                                cx={cx} 
                                                cy={cy} 
                                                r={radius + 3.5} 
                                                fill="transparent" 
                                                className="hover:fill-primary/5 transition-colors"
                                            />

                                            {/* Standard Room Node */}
                                            <circle 
                                                cx={cx} 
                                                cy={cy} 
                                                r={radius} 
                                                fill={fillCol}
                                                stroke={strokeColor}
                                                strokeWidth="2.5"
                                                className="transition-all"
                                            />

                                            {/* Room name abbreviation/initial label inside node */}
                                            {isFloorVisible && !isSource && !isDest && !isInPath && (
                                                <text 
                                                    x={cx} 
                                                    y={cy - 12} 
                                                    textAnchor="middle" 
                                                    className="text-[10px] font-bold fill-primary/70 pointer-events-none select-none"
                                                >
                                                    {loc.name.length > 10 ? `${loc.name.substring(0, 8)}..` : loc.name}
                                                </text>
                                            )}

                                            {/* Highlight labels for key path milestones */}
                                            {isFloorVisible && (isSource || isDest) && (
                                                <text 
                                                    x={cx} 
                                                    y={cy - 16} 
                                                    textAnchor="middle" 
                                                    className="text-[11px] font-black fill-primary pointer-events-none select-none bg-white px-1"
                                                >
                                                    {isSource ? 'START 📍' : 'END 🏁'}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Dynamic Floor Label display overlay */}
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-primary-light/95 text-white backdrop-blur text-xs font-bold px-3 py-1.5 rounded-xl shadow-soft flex items-center gap-1.5 select-none pointer-events-none">
                                <Compass className="w-3.5 h-3.5" />
                                <span>Active Floor: {selectedMapFloor === 'All' ? 'Full Layout' : `Floor ${selectedMapFloor}`}</span>
                            </div>
                        </div>

                        {/* Map Footer Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-6 bg-gradient-to-br from-secondary to-secondary-dark/50 p-3 rounded-xl text-xs text-primary border border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500 border border-green-200"></div>
                                <span className="font-semibold">Start Location (Source)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-accent to-accent-light border border-red-200"></div>
                                <span className="font-semibold">End Destination</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary-light border border-blue-200"></div>
                                <span className="font-semibold">Route Node</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-1 bg-gradient-to-r from-accent to-accent-light relative flex items-center justify-center">
                                    <div className="absolute w-full h-[1.5px] bg-red-400 route-line-animated"></div>
                                </div>
                                <span className="font-semibold">Computed Pathway</span>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default Navigation;
