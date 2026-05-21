import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { 
    User, Star, Clock, Compass, MapPin, 
    ArrowRight, Navigation, Trash2, Award, Zap
} from 'lucide-react';

const UserDashboard = () => {
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('email') || 'User';
    
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [history, setHistory] = useState([]);
    const [quickSource, setQuickSource] = useState('');
    const [quickDest, setQuickDest] = useState('');
    const [dashboardError, setDashboardError] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        setDashboardError('');
        try {
            // Load building locations from backend database
            const response = await api.get('/locations');
            setLocations(response.data);
        } catch (err) {
            console.error('Failed to load database locations:', err);
            setDashboardError('Could not fetch active building map data. Showing local offline workspace.');
        } finally {
            setLoading(false);
        }

        // Load user-specific local storage states
        const savedFavorites = localStorage.getItem(`favorites_${userEmail}`);
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }

        const savedHistory = localStorage.getItem(`history_${userEmail}`);
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    };

    // Remove a route from saved favorites
    const handleRemoveFavorite = (e, indexToRemove) => {
        e.stopPropagation(); // Avoid triggering route launch
        const updatedFavorites = favorites.filter((_, idx) => idx !== indexToRemove);
        setFavorites(updatedFavorites);
        localStorage.setItem(`favorites_${userEmail}`, JSON.stringify(updatedFavorites));
    };

    // Clear user history
    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem(`history_${userEmail}`);
    };

    // Trigger a path selection by navigating directly to /navigate with query params
    const handleLaunchRoute = (sourceId, destId) => {
        navigate(`/navigate?sourceId=${sourceId}&destinationId=${destId}`);
    };

    const handleQuickLaunch = (e) => {
        e.preventDefault();
        if (quickSource && quickDest) {
            if (quickSource === quickDest) {
                setDashboardError('Starting point and destination cannot be identical.');
                return;
            }
            handleLaunchRoute(quickSource, quickDest);
        }
    };

    // Calculate interactive statistics
    const uniqueFloors = [...new Set(locations.map(loc => loc.floor).filter(Boolean))];
    const totalRooms = locations.length;
    const totalConnectionsCount = locations.length > 1 ? Math.floor(locations.length * 1.3) : 0; // Estimation

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary to-secondary-dark py-10 px-4">
            <div className="container mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Header Widget */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-r from-primary to-primary-light/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shadow-soft-lg shadow-blue-900/10">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">User Dashboard</div>
                            <h1 className="text-2xl font-black text-primary mt-0.5">{userEmail}</h1>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary/70 font-semibold">
                                <Award className="w-3.5 h-3.5 text-accent" />
                                <span>Verified Navigation Terminal Guest</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 relative z-10 w-full md:w-auto">
                        <Link 
                            to="/navigate" 
                            className="flex-1 md:flex-initial text-center bg-gradient-to-r from-accent to-accent-light text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-soft shadow-red-200 flex items-center justify-center gap-2"
                        >
                            <Compass className="w-4 h-4" />
                            <span>Launch Map Terminal</span>
                        </Link>
                    </div>
                </div>

                {dashboardError && (
                    <div className="bg-amber-50 text-amber-800 border border-amber-150 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <Zap className="w-4 h-4 shrink-0" />
                        <span>{dashboardError}</span>
                    </div>
                )}

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: "Mapped Rooms / Labs", val: loading ? "..." : totalRooms, icon: <MapPin className="text-blue-500" />, desc: "Nodes in Graph Database" },
                        { title: "Active Building Floors", val: loading ? "..." : uniqueFloors.length, icon: <Compass className="text-emerald-500" />, desc: "Elevations Configured" },
                        { title: "My Favorite Paths", val: favorites.length, icon: <Star className="text-amber-500" />, desc: "Pinned Travel Quicklinks" },
                        { title: "Recent Routes Searched", val: history.length, icon: <Clock className="text-accent" />, desc: "Travel Query Logs" }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.title}</span>
                                <div className="p-2 bg-gray-50 rounded-xl">{stat.icon}</div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-black text-primary leading-none">{stat.val}</h3>
                                <p className="text-[10px] text-gray-500 mt-1.5 font-medium">{stat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Core Work Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Saved Favorites & Recent History */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Favorites Widget */}
                        <div className="bg-white rounded-3xl shadow-soft p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                                <h2 className="text-lg font-black text-primary flex items-center gap-2">
                                    <Star className="text-amber-400 fill-amber-400" />
                                    <span>My Saved Travel Favorites</span>
                                </h2>
                                <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                                    {favorites.length} Saved
                                </span>
                            </div>

                            {favorites.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 space-y-4">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                        <Star className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary text-sm">No Pinned Routes</h3>
                                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                            Search paths on the navigation screen and click the favorite star to save routes for fast one-click loading here!
                                        </p>
                                    </div>
                                    <Link to="/navigate" className="inline-block text-xs font-bold text-accent hover:underline">
                                        Start Navigating Now
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {favorites.map((fav, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => handleLaunchRoute(fav.sourceId, fav.destinationId)}
                                            className="group bg-gray-50/50 hover:bg-gradient-to-r from-primary to-primary-light/5 p-4 rounded-2xl border border-gray-100 hover:border-primary/10 cursor-pointer transition-all duration-200 flex items-center justify-between relative overflow-hidden"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    <span className="text-xs font-bold text-primary truncate max-w-[150px]">{fav.sourceName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-accent to-accent-light"></span>
                                                    <span className="text-xs font-bold text-primary truncate max-w-[150px]">{fav.destinationName}</span>
                                                </div>
                                                {fav.floorSummary && (
                                                    <span className="inline-block text-[9px] font-bold bg-white text-primary px-1.5 py-0.5 rounded border border-gray-150 uppercase tracking-wide">
                                                        {fav.floorSummary}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button 
                                                    onClick={(e) => handleRemoveFavorite(e, index)}
                                                    className="p-2 text-gray-400 hover:text-accent rounded-xl hover:bg-white transition-colors"
                                                    title="Delete favorite link"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="bg-white p-2 rounded-xl group-hover:bg-gradient-to-r from-primary to-primary-light group-hover:text-white transition-colors shadow-soft">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Travel Logs Timeline */}
                        <div className="bg-white rounded-3xl shadow-soft p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                                <h2 className="text-lg font-black text-primary flex items-center gap-2">
                                    <Clock className="text-primary" />
                                    <span>Recent Navigation Audits</span>
                                </h2>
                                {history.length > 0 && (
                                    <button 
                                        onClick={handleClearHistory}
                                        className="text-xs font-bold text-gray-400 hover:text-accent transition-colors"
                                    >
                                        Clear History
                                    </button>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-xs">
                                    Your pathfinding history is empty. Calculated paths will appear here automatically.
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-primary/10 ml-3 space-y-6">
                                    {history.map((hist, idx) => (
                                        <div key={idx} className="ml-6 relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Node Anchor */}
                                            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-gradient-to-r from-primary to-primary-light flex items-center justify-center">
                                                <div className="w-1 h-1 rounded-full bg-white"></div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <div className="text-xs font-black text-primary">
                                                    {hist.sourceName} <span className="font-normal text-gray-400 mx-1">→</span> {hist.destinationName}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-2">
                                                    <span>{hist.timestamp}</span>
                                                    {hist.floors && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span className="uppercase text-primary/70">{hist.floors}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleLaunchRoute(hist.sourceId, hist.destinationId)}
                                                className="self-start md:self-auto text-[10px] font-bold text-accent hover:text-primary transition-colors flex items-center gap-1 shrink-0 bg-gradient-to-br from-secondary to-secondary-dark px-3 py-1.5 rounded-lg border border-gray-150"
                                            >
                                                <Navigation className="w-3 h-3" />
                                                <span>Re-navigate</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Quick Travel Launcher */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-soft space-y-6">
                        <div>
                            <h2 className="text-base font-black text-primary">Quick travel launcher</h2>
                            <p className="text-xs text-gray-400 mt-1">Prefill and launch pathfinding vectors instantly</p>
                        </div>

                        {loading ? <Loader /> : (
                            <form onSubmit={handleQuickLaunch} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-primary/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        Source
                                    </label>
                                    <select 
                                        required
                                        value={quickSource}
                                        onChange={(e) => setQuickSource(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl outline-none text-xs focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gradient-to-br from-secondary to-secondary-dark/30"
                                    >
                                        <option value="">Choose start room...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name} {loc.floor && `(Floor ${loc.floor})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-primary/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-accent to-accent-light"></div>
                                        Destination
                                    </label>
                                    <select 
                                        required
                                        value={quickDest}
                                        onChange={(e) => setQuickDest(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl outline-none text-xs focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gradient-to-br from-secondary to-secondary-dark/30"
                                    >
                                        <option value="">Choose target room...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name} {loc.floor && `(Floor ${loc.floor})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!quickSource || !quickDest}
                                    className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-3.5 rounded-xl font-bold text-xs hover:bg-opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-soft shadow-blue-900/10"
                                >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Calculate Shortest Route</span>
                                </button>
                            </form>
                        )}

                        <div className="p-4 bg-gradient-to-r from-primary to-primary-light/5 rounded-2xl border border-primary/10 text-[10px] text-primary/80 leading-relaxed flex gap-2">
                            <Compass className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                            <span>
                                <strong>Coordinate Normalizer Note:</strong> Rooms are plotted on physical map coordinates. The system automatically finds transitions like stairs and elevations!
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
