import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Navigation2, MapPin, Compass, RotateCcw, Star, ArrowRight, Loader2 } from 'lucide-react';

// ── Teal Palette ──────────────────────────────────────────────────────────────
const T = {
  900: '#1a4a4a',
  800: '#2a6b6b',
  600: '#3d8b8b',
  500: '#5aadad',
  300: '#8dd4d4',
  100: '#c4eaea',
  50:  '#eaf7f7',
};

// ── Inline Loader ──────────────────────────────────────────────────────────────
const TealLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px' }}>
    <Loader2 size={28} color={T[500]} style={{ animation: 'spin 1s linear infinite' }} />
  </div>
);

// ── Navigation Page ────────────────────────────────────────────────────────────
const Navigation = () => {
  const [searchParams] = useSearchParams();
  const [locations, setLocations]         = useState([]);
  const [source, setSource]               = useState('');
  const [destination, setDestination]     = useState('');
  const [path, setPath]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [fetchingLocs, setFetchingLocs]   = useState(true);
  const [error, setError]                 = useState('');
  const [selectedMapFloor, setSelectedMapFloor] = useState('All');
  const [hoveredNode, setHoveredNode]     = useState(null);
  const [isSaved, setIsSaved]             = useState(false);

  // A* animation state
  const [animatedPathIndices, setAnimatedPathIndices] = useState(new Set());
  const animTimerRef = useRef(null);

  useEffect(() => { fetchLocations(); }, []);

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

  // Animate path reveal cell by cell
  const animatePath = (pathData) => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setAnimatedPathIndices(new Set());
    let i = 0;
    animTimerRef.current = setInterval(() => {
      if (i < pathData.length) {
        setAnimatedPathIndices(prev => new Set([...prev, i]));
        i++;
      } else {
        clearInterval(animTimerRef.current);
      }
    }, 180);
  };

  useEffect(() => { return () => { if (animTimerRef.current) clearInterval(animTimerRef.current); }; }, []);

  const handleFindPath = async (e) => {
    if (e) e.preventDefault();
    if (source === destination) { setError('Source and destination cannot be the same.'); return; }
    setLoading(true);
    setError('');
    setPath([]);
    setAnimatedPathIndices(new Set());
    try {
      const response = await api.get(`/path/find?sourceId=${source}&destinationId=${destination}`);
      if (response.data.length === 0) {
        setError('No path found between selected locations.');
      } else {
        setPath(response.data);
        animatePath(response.data);
        const startLoc = response.data[0];
        if (startLoc && startLoc.floor) setSelectedMapFloor(startLoc.floor);
        else setSelectedMapFloor('All');

        // Log search history
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        if (token && email) {
          const savedHistory = localStorage.getItem(`history_${email}`);
          let historyArray = savedHistory ? JSON.parse(savedHistory) : [];
          const sourceLoc = locations.find(l => l.id.toString() === source);
          const destLoc = locations.find(l => l.id.toString() === destination);
          if (sourceLoc && destLoc) {
            const newQuery = {
              sourceId: source, destinationId: destination,
              sourceName: sourceLoc.name, destinationName: destLoc.name,
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

  useEffect(() => { setIsSaved(false); }, [source, destination]);

  const handleSaveFavorite = () => {
    const email = localStorage.getItem('email');
    if (!email) return;
    const savedFavorites = localStorage.getItem(`favorites_${email}`);
    let favoritesArray = savedFavorites ? JSON.parse(savedFavorites) : [];
    const sourceLoc = locations.find(l => l.id.toString() === source);
    const destLoc = locations.find(l => l.id.toString() === destination);
    if (sourceLoc && destLoc) {
      const isAlreadySaved = favoritesArray.some(fav => fav.sourceId === source && fav.destinationId === destination);
      if (!isAlreadySaved) {
        favoritesArray.push({
          sourceId: source, destinationId: destination,
          sourceName: sourceLoc.name, destinationName: destLoc.name,
          floorSummary: sourceLoc.floor === destLoc.floor ? `Floor ${sourceLoc.floor}` : `Floors ${sourceLoc.floor} → ${destLoc.floor}`
        });
        localStorage.setItem(`favorites_${email}`, JSON.stringify(favoritesArray));
        setIsSaved(true);
      }
    }
  };

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
      setSource(locIdStr); setDestination(''); setPath([]); setError(''); setAnimatedPathIndices(new Set());
    } else {
      if (source === locIdStr) { setError('Source and destination cannot be the same.'); return; }
      setDestination(locIdStr);
    }
  };

  const handleReset = () => {
    setSource(''); setDestination(''); setPath([]); setError('');
    setSelectedMapFloor('All'); setAnimatedPathIndices(new Set());
    if (animTimerRef.current) clearInterval(animTimerRef.current);
  };

  useEffect(() => { if (source && destination) handleFindPath(); }, [source, destination]);

  const mapFloors = ['All', ...new Set(locations.map(loc => loc.floor).filter(Boolean))];

  // SVG sizing
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
  const scaleX = (x) => padding + ((x - minX) / (maxX - minX || 1)) * (svgWidth - 2 * padding);
  const scaleY = (y) => padding + ((y - minY) / (maxY - minY || 1)) * (svgHeight - 2 * padding);

  const isPathActive = path.length > 1;

  // Simulated room status (for demo — toggle based on location id)
  const getRoomStatus = (loc) => loc.id % 3 === 0 ? 'Occupied' : 'Available';

  // ── Styles ──────────────────────────────────────────────────────────────────
  const selectStyle = {
    width: '100%', padding: '10px 12px',
    border: `0.5px solid ${T[100]}`, borderRadius: '8px',
    backgroundColor: '#ffffff', color: T[900],
    fontSize: '13px', fontWeight: 400, fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none', cursor: 'pointer',
    transition: 'border-color 0.18s',
  };

  const labelStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    color: T[800], fontSize: '12px', fontWeight: 500,
    marginBottom: '6px',
  };

  return (
    <div className="nav-page-wrapper" style={{
      backgroundColor: T[50], minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif',
      padding: '40px',
    }}>
      {/* Keyframe animations & responsive overrides */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        .marker-pulse { transform-origin: center; animation: pulse-ring 2s infinite ease-in-out; }
        @keyframes path-flow { to { stroke-dashoffset: -20; } }
        .route-line-animated { stroke-dasharray: 8 4; animation: path-flow 1s linear infinite; }

        @media (max-width: 768px) {
          .nav-grid-container {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .nav-sidebar {
            order: 2 !important;
          }
          .nav-map-container {
            order: 1 !important;
          }
        }
        @media (max-width: 375px) {
          .nav-page-wrapper {
            padding: 20px 12px !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="nav-grid-container" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>

<<<<<<< HEAD
    // SVG coordinates mapping and normalization - absolute coordinates system (identity scaling)
    const svgWidth = 800;
    const svgHeight = 550;

    const scaleX = (x) => x;
    const scaleY = (y) => y;


    const isPathActive = path.length > 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary to-secondary-dark dark:from-darkBg dark:to-darkBg py-12 px-4">
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
                        <div className="bg-white dark:bg-darkCard rounded-2xl shadow-soft-lg dark:shadow-none overflow-hidden border border-gray-100 dark:border-darkHover">
                            <div className="bg-gradient-to-r from-primary to-primary-light dark:from-darkCard dark:to-darkBg p-6 text-white flex items-center justify-between dark:border-b dark:border-darkHover">
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
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
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
                                                className="w-full p-3 border border-gray-300 dark:border-darkHover dark:bg-darkBg dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                                            >
                                                <option value="">Select source...</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>
                                                        {loc.name} {loc.floor && `(${loc.floor.floorName})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
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
                                                className="w-full p-3 border border-gray-300 dark:border-darkHover dark:bg-darkBg dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                                            >
                                                <option value="">Select destination...</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>
                                                        {loc.name} {loc.floor && `(${loc.floor.floorName})`}
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
                        <div className="bg-gradient-to-r from-primary to-primary-light/5 dark:from-darkCard dark:to-darkBg p-4 rounded-2xl border border-primary/10 dark:border-darkHover text-xs text-primary dark:text-gray-300 leading-relaxed flex gap-2">
                            <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span>
                                <strong>Interactive Map Tip:</strong> You can click any room directly on the visual map coordinate graph to set your starting point and destination!
                            </span>
                        </div>

                        {/* Text Route Guidance Timeline */}
                        {isPathActive && (
                            <div className="bg-white dark:bg-darkCard rounded-2xl shadow-soft-lg dark:shadow-none p-6 border border-gray-100 dark:border-darkHover animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
                                        <MapPin className="text-accent" />
                                        Route Guidance
                                    </h2>
                                    {totalDistance > 0 && (
                                        <span className="bg-accent/15 text-accent text-xs font-black px-2.5 py-1 rounded-full border border-accent/10">
                                            Est: {totalDistance.toFixed(1)}m (~{Math.ceil(totalDistance / 1.4 / 60)} min walk)
                                        </span>
                                    )}
                                </div>

                                {/* Dynamic Pinned Favorites Action Widget */}
                                {localStorage.getItem('token') && localStorage.getItem('role') === 'ROLE_USER' ? (
                                    <button
                                        type="button"
                                        onClick={handleSaveFavorite}
                                        disabled={isSaved}
                                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border mb-5 ${isSaved
                                                ? 'bg-green-55 border-green-200 text-green-750 cursor-default'
                                                : 'bg-white dark:bg-darkBg border-gray-200 dark:border-darkHover hover:border-primary text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-darkHover'
                                            }`}
                                    >
                                        <Star className={`w-4 h-4 ${isSaved ? 'fill-green-600 text-green-600' : 'text-primary'}`} />
                                        <span>{isSaved ? 'Saved to Favorites!' : 'Save Route to Favorites'}</span>
                                    </button>
                                ) : !localStorage.getItem('token') ? (
                                    <div className="bg-gradient-to-r from-primary to-primary-light/5 dark:from-darkCard dark:to-darkBg border border-primary/10 dark:border-darkHover rounded-xl p-3.5 mb-5 flex flex-col gap-2 animate-in fade-in duration-200">
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-white">
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
                                                        className={`absolute -left-[32px] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center ${index === 0
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
                                                    {loc.landmarkDescription && <p className="text-primary text-[10px] mt-0.5 italic">Landmark: {loc.landmarkDescription}</p>}
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
                    <div className="lg:col-span-8 bg-white dark:bg-darkCard rounded-2xl shadow-soft-lg dark:shadow-none p-6 border border-gray-100 dark:border-darkHover flex flex-col space-y-4">

                        {/* Map Header & Floor Tab Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-darkHover pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-primary dark:text-white">Interactive Floor Map</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Visual representation of nodes and computed routes</p>
                            </div>

                            {/* Dynamic Floor Selector Tabs */}
                            <div className="flex flex-wrap gap-1.5 bg-gradient-to-br from-secondary to-secondary-dark p-1 rounded-xl">
                                {mapFloors.map(floor => (
                                    <button
                                        type="button"
                                        key={floor}
                                        onClick={() => setSelectedMapFloor(floor)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedMapFloor === floor
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
                        <div className="relative border border-gray-100 dark:border-darkHover rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-darkBg aspect-[8/5.5]">

                            {/* Tooltip Overlay */}
                            {hoveredNode && (
                                <div
                                    className="absolute bg-white/95 dark:bg-darkCard/95 backdrop-blur p-3 rounded-xl shadow-soft-lg dark:shadow-none border border-gray-100 dark:border-darkHover z-30 pointer-events-none transition-all duration-100"
                                    style={{
                                        left: `${((hoveredNode.xCoordinate * zoom + pan.x) / svgWidth) * 100}%`,
                                        top: `${((hoveredNode.yCoordinate * zoom + pan.y) / svgHeight) * 100 - 15}%`,
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
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onWheel={handleWheel}
                            >
                                {/* Pattern grid definition for blueprint map layout */}
                                <defs>
                                    <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2EAE7" strokeWidth="1" />
                                    </pattern>
                                </defs>

                                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                                    <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
                                    {bgMapImageUrl && (
                                        <image
                                            href={bgMapImageUrl}
                                            width="100%"
                                            height="100%"
                                            preserveAspectRatio="xMidYMid slice"
                                            opacity="0.85"
                                        />
                                    )}

                                    {/* Draw All Calculated Path Connections (Underlay lines) */}
                                    {isPathActive && path.map((loc, idx) => {
                                        if (idx === path.length - 1) return null;
                                        const nextLoc = path[idx + 1];
                                        const isOnActiveFloor = selectedMapFloorId === 'All' ||
                                            (loc.floor?.id === selectedMapFloorId && nextLoc.floor?.id === selectedMapFloorId);

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

                                        const isFloorVisible = selectedMapFloorId === 'All' || loc.floor?.id === selectedMapFloorId;

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
                                                className={`cursor-pointer transition-all duration-200 ${isFloorVisible ? 'opacity-100' : 'opacity-15'
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
                                </g></svg>
                            

                            {/* Floating zoom/pan controls */}
                            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                <button
                                    type="button"
                                    onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
                                    className="p-2 bg-white/90 hover:bg-white text-primary rounded-xl shadow-soft border border-gray-150 transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.5))}
                                    className="p-2 bg-white/90 hover:bg-white text-primary rounded-xl shadow-soft border border-gray-150 transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                                    className="p-2 bg-white/90 hover:bg-white text-primary rounded-xl shadow-soft border border-gray-150 transition-colors"
                                    title="Reset View"
                                >
                                    <Maximize className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Dynamic Floor Label display overlay */}
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-primary-light/95 dark:from-darkCard dark:to-darkCard/95 text-white backdrop-blur text-xs font-bold px-3 py-1.5 rounded-xl shadow-soft dark:shadow-none border dark:border-darkHover flex items-center gap-1.5 select-none pointer-events-none">
                                <Compass className="w-3.5 h-3.5" />
                                <span>Active Floor: {selectedMapFloorId === 'All' ? 'Full Layout' : (floors.find(f => f.id === selectedMapFloorId)?.floorName || `Floor ${selectedMapFloorId}`)}</span>
                            </div>
                        </div>

                        {/* Map Footer Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-6 bg-gradient-to-br from-secondary to-secondary-dark/50 dark:from-darkBg dark:to-darkBg p-3 rounded-xl text-xs text-primary dark:text-gray-300 border border-gray-100 dark:border-darkHover">
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
=======
          {/* ═══════════════════════════ LEFT SIDEBAR ═══════════════════════ */}
          <div className="nav-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
>>>>>>> 105537a30c8120dd220da95a7d4abf29fbbec492

            {/* ── Route Form Card ── */}
            <div style={{ backgroundColor: '#fff', border: `0.5px solid ${T[100]}`, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Card header */}
              <div style={{
                backgroundColor: T[900], padding: '18px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation2 size={18} color={T[500]} />
                  <span style={{ color: T[50], fontSize: '15px', fontWeight: 500 }}>Find Your Route</span>
                </div>
                {(source || destination || isPathActive) && (
                  <button onClick={handleReset} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: T[300], fontSize: '11px', fontWeight: 500,
                    border: `0.5px solid ${T[600]}`, borderRadius: '6px',
                    padding: '4px 10px', background: 'transparent', cursor: 'pointer',
                    transition: 'background 0.18s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = T[800]}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <RotateCcw size={11} /><span>Clear</span>
                  </button>
                )}
              </div>

              {/* Card body */}
              <div style={{ padding: '20px' }}>
                {fetchingLocs ? <TealLoader /> : (
                  <form onSubmit={handleFindPath} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Source dropdown */}
                    <div>
                      <label style={labelStyle}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T[500] }} />
                        Start Room
                      </label>
                      <select required value={source}
                        onChange={(e) => { setSource(e.target.value); setPath([]); setAnimatedPathIndices(new Set()); }}
                        style={selectStyle}
                        onFocus={e => e.target.style.borderColor = T[500]}
                        onBlur={e => e.target.style.borderColor = T[100]}>
                        <option value="">Select source...</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} {loc.floor && `(Floor ${loc.floor})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Destination dropdown */}
                    <div>
                      <label style={labelStyle}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T[600] }} />
                        End Room
                      </label>
                      <select required value={destination}
                        onChange={(e) => { setDestination(e.target.value); setPath([]); setAnimatedPathIndices(new Set()); }}
                        style={selectStyle}
                        onFocus={e => e.target.style.borderColor = T[500]}
                        onBlur={e => e.target.style.borderColor = T[100]}>
                        <option value="">Select destination...</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} {loc.floor && `(Floor ${loc.floor})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Error */}
                    {error && (
                      <div style={{
                        backgroundColor: '#fef2f2', border: `0.5px solid ${T[100]}`,
                        borderRadius: '8px', padding: '10px 14px',
                        color: '#b91c1c', fontSize: '12px', fontWeight: 400,
                      }}>
                        {error}
                      </div>
                    )}

                    {/* Submit button */}
                    <button type="submit" disabled={loading || !source || !destination}
                      style={{
                        width: '100%', padding: '11px',
                        backgroundColor: (!source || !destination || loading) ? T[100] : T[500],
                        color: (!source || !destination || loading) ? T[600] : T[50],
                        border: `0.5px solid ${(!source || !destination || loading) ? T[100] : T[600]}`,
                        borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                        cursor: (!source || !destination || loading) ? 'not-allowed' : 'pointer',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        transition: 'background-color 0.18s',
                      }}
                      onMouseEnter={e => { if (source && destination && !loading) e.currentTarget.style.backgroundColor = T[600]; }}
                      onMouseLeave={e => { if (source && destination && !loading) e.currentTarget.style.backgroundColor = T[500]; }}>
                      {loading ? 'Calculating...' : 'Find Shortest Path'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── Tip card ── */}
            <div style={{
              backgroundColor: T[50], border: `0.5px solid ${T[100]}`,
              borderRadius: '10px', padding: '14px 16px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <Compass size={16} color={T[500]} style={{ marginTop: '1px', flexShrink: 0 }} />
              <p style={{ color: T[800], fontSize: '12px', fontWeight: 400, lineHeight: 1.6, margin: 0 }}>
                <span style={{ fontWeight: 500, color: T[900] }}>Tip:</span> Click any room node on the map to set start/end points directly.
              </p>
            </div>

            {/* ── Route Steps Sidebar ── */}
            {isPathActive && (
              <div style={{
                backgroundColor: '#fff', border: `0.5px solid ${T[100]}`,
                borderRadius: '12px', padding: '20px', overflow: 'hidden',
              }}>
                <h2 style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: T[900], fontSize: '14px', fontWeight: 500, marginBottom: '16px',
                }}>
                  <MapPin size={15} color={T[500]} />
                  Route Steps ({path.length} nodes)
                </h2>

                {/* Save favorite */}
                {localStorage.getItem('token') && localStorage.getItem('role') === 'ROLE_USER' && (
                  <button onClick={handleSaveFavorite} disabled={isSaved}
                    style={{
                      width: '100%', padding: '8px', marginBottom: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      backgroundColor: isSaved ? T[50] : '#fff',
                      border: `0.5px solid ${isSaved ? T[300] : T[100]}`,
                      borderRadius: '8px', fontSize: '11px', fontWeight: 500,
                      color: isSaved ? T[600] : T[800],
                      cursor: isSaved ? 'default' : 'pointer',
                      transition: 'border-color 0.18s',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                    onMouseEnter={e => { if (!isSaved) e.currentTarget.style.borderColor = T[500]; }}
                    onMouseLeave={e => { if (!isSaved) e.currentTarget.style.borderColor = T[100]; }}>
                    <Star size={12} color={isSaved ? T[500] : T[600]} fill={isSaved ? T[500] : 'none'} />
                    {isSaved ? 'Saved to Favorites!' : 'Save Route'}
                  </button>
                )}

                {!localStorage.getItem('token') && (
                  <div style={{
                    backgroundColor: T[50], border: `0.5px solid ${T[100]}`,
                    borderRadius: '8px', padding: '12px 14px', marginBottom: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Star size={12} color={T[500]} fill={T[500]} />
                      <span style={{ color: T[900], fontSize: '11px', fontWeight: 500 }}>Save this route</span>
                    </div>
                    <p style={{ color: T[600], fontSize: '11px', fontWeight: 400, lineHeight: 1.5, margin: 0 }}>
                      Log in to save favourite routes.
                    </p>
                    <Link to="/login?tab=register" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      color: T[500], fontSize: '11px', fontWeight: 500,
                      textDecoration: 'none', marginTop: '6px',
                    }}>
                      <span>Create Account</span><ArrowRight size={10} />
                    </Link>
                  </div>
                )}

                {/* Timeline */}
                <div style={{ borderLeft: `2px solid ${T[100]}`, marginLeft: '9px', paddingLeft: '18px' }}>
                  {path.map((loc, index) => {
                    const showTransition = index > 0 && loc.floor !== path[index - 1].floor;
                    const isStart = index === 0;
                    const isEnd   = index === path.length - 1;

                    // Dot color
                    let dotBg = T[500];
                    if (isStart) dotBg = T[800];
                    else if (isEnd) dotBg = T[600];

                    const status = getRoomStatus(loc);

                    return (
                      <React.Fragment key={index}>
                        {/* Floor transition */}
                        {showTransition && (
                          <div style={{ marginBottom: '14px', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', left: '-24px', top: '1px',
                              width: '10px', height: '10px', borderRadius: '50%',
                              backgroundColor: T[300], border: `2px solid #fff`,
                            }} />
                            <div style={{
                              backgroundColor: T[50], border: `0.5px solid ${T[100]}`,
                              borderRadius: '8px', padding: '10px 12px',
                              display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T[500]} strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                              </svg>
                              <div>
                                <p style={{ color: T[500], fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                                  Floor Transition
                                </p>
                                <p style={{ color: T[800], fontSize: '12px', fontWeight: 400, margin: '2px 0 0' }}>
                                  Go to <span style={{ fontWeight: 500, color: T[900] }}>Floor {loc.floor}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step item */}
                        <div style={{ marginBottom: index < path.length - 1 ? '14px' : '0', position: 'relative' }}>
                          {/* Timeline dot */}
                          <div style={{
                            position: 'absolute', left: '-24px', top: '2px',
                            width: '10px', height: '10px', borderRadius: '50%',
                            backgroundColor: dotBg, border: `2px solid #fff`,
                          }} />
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <p style={{ color: T[900], fontSize: '13px', fontWeight: 500, margin: 0, lineHeight: 1.3 }}>{loc.name}</p>
                              {loc.description && (
                                <p style={{ color: T[600], fontSize: '11px', fontWeight: 400, margin: '2px 0 0' }}>{loc.description}</p>
                              )}
                              {loc.floor && (
                                <span style={{
                                  display: 'inline-block', marginTop: '4px',
                                  backgroundColor: T[50], border: `0.5px solid ${T[100]}`,
                                  borderRadius: '4px', padding: '1px 6px',
                                  fontSize: '10px', fontWeight: 500, color: T[600],
                                  textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>
                                  Floor {loc.floor}
                                </span>
                              )}
                            </div>
                            {/* Room status badge */}
                            <span style={{
                              flexShrink: 0, marginTop: '2px',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '10px', fontWeight: 500,
                              backgroundColor: status === 'Available' ? T[50] : '#fef2f2',
                              color: status === 'Available' ? T[600] : '#b91c1c',
                              border: `0.5px solid ${status === 'Available' ? T[100] : '#fecaca'}`,
                            }}>
                              {status}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════ RIGHT: MAP CANVAS ═════════════════════════ */}
          <div className="nav-map-container" style={{
            backgroundColor: '#fff', border: `0.5px solid ${T[100]}`,
            borderRadius: '12px', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>

            {/* Map header + floor tabs */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: '14px', borderBottom: `0.5px solid ${T[100]}`, flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <h2 style={{ color: T[900], fontSize: '16px', fontWeight: 500, margin: 0 }}>Interactive Floor Map</h2>
                <p style={{ color: T[600], fontSize: '12px', fontWeight: 400, margin: '3px 0 0' }}>
                  Click nodes to set route · Visual pathfinding
                </p>
              </div>

              {/* Floor switcher */}
              <div style={{
                display: 'flex', gap: '4px',
                backgroundColor: T[50], border: `0.5px solid ${T[100]}`,
                borderRadius: '8px', padding: '3px',
              }}>
                {mapFloors.map(floor => (
                  <button key={floor} onClick={() => setSelectedMapFloor(floor)}
                    style={{
                      padding: '5px 12px', borderRadius: '6px',
                      fontSize: '11px', fontWeight: 500,
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      backgroundColor: selectedMapFloor === floor ? T[900] : 'transparent',
                      color: selectedMapFloor === floor ? T[50] : T[600],
                      transition: 'background-color 0.18s, color 0.18s',
                    }}>
                    {floor === 'All' ? 'All' : `F${floor}`}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG map */}
            <div style={{
              position: 'relative', border: `0.5px solid ${T[100]}`,
              borderRadius: '10px', overflow: 'hidden', backgroundColor: T[50],
              aspectRatio: '8 / 5.5',
            }}>
              {/* Tooltip */}
              {hoveredNode && (
                <div style={{
                  position: 'absolute', zIndex: 30, pointerEvents: 'none',
                  left: `${(scaleX(hoveredNode.xCoordinate) / svgWidth) * 100}%`,
                  top: `${(scaleY(hoveredNode.yCoordinate) / svgHeight) * 100 - 12}%`,
                  transform: 'translate(-50%, -100%)',
                  backgroundColor: '#fff', border: `0.5px solid ${T[100]}`,
                  borderRadius: '8px', padding: '10px 12px',
                }}>
                  <p style={{ color: T[900], fontSize: '12px', fontWeight: 500, margin: 0 }}>{hoveredNode.name}</p>
                  {hoveredNode.floor && (
                    <p style={{ color: T[600], fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', margin: '2px 0 0' }}>
                      Floor {hoveredNode.floor}
                    </p>
                  )}
                  {hoveredNode.description && (
                    <p style={{ color: T[600], fontSize: '10px', fontWeight: 400, margin: '3px 0 0', maxWidth: '160px' }}>
                      {hoveredNode.description}
                    </p>
                  )}
                  <p style={{ color: T[500], fontSize: '9px', fontWeight: 500, marginTop: '5px', fontStyle: 'italic' }}>Click to select</p>
                </div>
              )}

              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
                {/* Grid pattern */}
                <defs>
                  <pattern id="teal-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke={T[100]} strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#teal-grid)" />

                {/* Path lines — animated cell by cell */}
                {isPathActive && path.map((loc, idx) => {
                  if (idx === path.length - 1) return null;
                  const nextLoc = path[idx + 1];
                  const isRevealed = animatedPathIndices.has(idx + 1);
                  const isOnFloor = selectedMapFloor === 'All' ||
                    (loc.floor === selectedMapFloor && nextLoc.floor === selectedMapFloor);

                  return (
                    <g key={`path-seg-${idx}`} style={{ opacity: isRevealed ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                      {/* Glow underlay */}
                      <line
                        x1={scaleX(loc.xCoordinate)} y1={scaleY(loc.yCoordinate)}
                        x2={scaleX(nextLoc.xCoordinate)} y2={scaleY(nextLoc.yCoordinate)}
                        stroke={T[500]} strokeWidth="8" strokeLinecap="round"
                        opacity={isOnFloor ? 0.2 : 0.04}
                      />
                      {/* Animated dash line */}
                      <line
                        x1={scaleX(loc.xCoordinate)} y1={scaleY(loc.yCoordinate)}
                        x2={scaleX(nextLoc.xCoordinate)} y2={scaleY(nextLoc.yCoordinate)}
                        stroke={T[500]} strokeWidth="3" strokeLinecap="round"
                        className="route-line-animated"
                        opacity={isOnFloor ? 1 : 0.08}
                      />
                    </g>
                  );
                })}

                {/* Node circles */}
                {locations.map(loc => {
                  if (loc.xCoordinate === null || loc.yCoordinate === null) return null;

                  const cx = scaleX(loc.xCoordinate);
                  const cy = scaleY(loc.yCoordinate);
                  const isSource = source === loc.id.toString();
                  const isDest = destination === loc.id.toString();
                  const isInPath = path.some(p => p.id === loc.id);
                  const isFloorVisible = selectedMapFloor === 'All' || loc.floor === selectedMapFloor;

                  let fillCol = '#ffffff';
                  let strokeCol = T[300];
                  let radius = 7;
                  const status = getRoomStatus(loc);

                  if (isSource) { fillCol = T[800]; strokeCol = T[300]; radius = 9.5; }
                  else if (isDest) { fillCol = T[600]; strokeCol = T[100]; radius = 9.5; }
                  else if (isInPath) { fillCol = T[500]; strokeCol = T[300]; radius = 8; }
                  else if (status === 'Occupied') { fillCol = '#fef2f2'; strokeCol = '#fecaca'; }

                  return (
                    <g key={loc.id}
                      onClick={() => isFloorVisible && handleNodeClick(loc)}
                      onMouseEnter={() => isFloorVisible && setHoveredNode(loc)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{
                        cursor: isFloorVisible ? 'pointer' : 'default',
                        opacity: isFloorVisible ? 1 : 0.12,
                        transition: 'opacity 0.2s',
                      }}>
                      {/* Pulse ring for source/dest */}
                      {(isSource || isDest) && isFloorVisible && (
                        <circle cx={cx} cy={cy} r={radius + 6}
                          fill="none" stroke={isSource ? T[800] : T[600]}
                          strokeWidth="1.5" className="marker-pulse" />
                      )}
                      {/* Hit area */}
                      <circle cx={cx} cy={cy} r={radius + 4} fill="transparent" />
                      {/* Node */}
                      <circle cx={cx} cy={cy} r={radius}
                        fill={fillCol} stroke={strokeCol} strokeWidth="2" />
                      {/* Label */}
                      {isFloorVisible && !isSource && !isDest && !isInPath && (
                        <text x={cx} y={cy - 12} textAnchor="middle"
                          style={{ fontSize: '9px', fontWeight: 500, fill: T[600], pointerEvents: 'none', userSelect: 'none' }}>
                          {loc.name.length > 10 ? `${loc.name.substring(0, 8)}..` : loc.name}
                        </text>
                      )}
                      {/* Start/End label */}
                      {isFloorVisible && (isSource || isDest) && (
                        <text x={cx} y={cy - 16} textAnchor="middle"
                          style={{ fontSize: '10px', fontWeight: 500, fill: T[900], pointerEvents: 'none', userSelect: 'none' }}>
                          {isSource ? 'START' : 'END'}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floor label overlay */}
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                backgroundColor: T[900], color: T[50],
                borderRadius: '6px', padding: '5px 10px',
                fontSize: '10px', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '5px',
                pointerEvents: 'none', userSelect: 'none',
              }}>
                <Compass size={11} color={T[500]} />
                {selectedMapFloor === 'All' ? 'All Floors' : `Floor ${selectedMapFloor}`}
              </div>
            </div>

            {/* Legend bar */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px',
              backgroundColor: T[50], border: `0.5px solid ${T[100]}`,
              borderRadius: '8px', padding: '10px 16px',
            }}>
              {[
                { color: T[800], label: 'Start' },
                { color: T[600], label: 'End' },
                { color: T[500], label: 'Route Node' },
                { color: '#ffffff', border: T[300], label: 'Available' },
                { color: '#fef2f2', border: '#fecaca', label: 'Occupied' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: item.color, display: 'inline-block',
                    border: `1.5px solid ${item.border || item.color}`,
                  }} />
                  <span style={{ color: T[600], fontSize: '11px', fontWeight: 400 }}>{item.label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '16px', height: '2px', backgroundColor: T[500], borderRadius: '1px' }} />
                <span style={{ color: T[600], fontSize: '11px', fontWeight: 400 }}>A* Path</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Navigation;
