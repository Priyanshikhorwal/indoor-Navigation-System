import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import FloorSelector from '../components/FloorSelector';
import IndoorMap from '../components/IndoorMap';
import NavigationPanel from '../components/NavigationPanel';

const Navigation = () => {
    const [searchParams] = useSearchParams();
    const [rooms, setRooms] = useState([]);
    const [floors, setFloors] = useState([]);
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [path, setPath] = useState([]);
    const [instructions, setInstructions] = useState([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [error, setError] = useState('');
    const [selectedMapFloorId, setSelectedMapFloorId] = useState('All');
    const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [roomsRes, floorsRes] = await Promise.all([
                api.getRooms(),
                api.getFloors()
            ]);
            setRooms(roomsRes);
            setFloors(floorsRes);
            setFetchingData(false);
        } catch (err) {
            setError('Failed to load building map data.');
            setFetchingData(false);
        }
    };

    // Prefill coordinates from URL search queries
    useEffect(() => {
        const sourceId = searchParams.get('sourceId');
        const destinationId = searchParams.get('destinationId');
        if (sourceId && destinationId && rooms.length > 0) {
            setSource(sourceId);
            setDestination(destinationId);
        }
    }, [searchParams, rooms]);

    // Reset saved state when endpoints change
    useEffect(() => {
        setIsSaved(false);
    }, [source, destination, wheelchairAccessible]);

    // Auto-calculate route when source & destination are both set
    useEffect(() => {
        if (source && destination) {
            handleFindPath();
        }
    }, [source, destination, wheelchairAccessible]);

    const handleFindPath = async (e) => {
        if (e) e.preventDefault();
        if (source === destination) {
            setError('Starting room and destination cannot be the same.');
            return;
        }
        setLoading(true);
        setError('');
        setPath([]);
        setInstructions([]);
        setTotalDistance(0);

        try {
            const data = await api.getRoute({
                sourceId: parseInt(source),
                destinationId: parseInt(destination),
                wheelchairAccessible
            });

            if (!data.path || data.path.length === 0) {
                setError('No route found between selected rooms.');
            } else {
                setPath(data.path);
                setInstructions(data.instructions || []);
                setTotalDistance(data.totalDistance || 0);

                // Auto-switch to source floor on route load
                const startNode = data.path[0];
                if (startNode && startNode.floor) {
                    setSelectedMapFloorId(startNode.floor.id);
                }

                // Log search to local history for user dashboard convenience
                const email = localStorage.getItem('email');
                if (email) {
                    const savedHistory = localStorage.getItem(`history_${email}`);
                    let historyArray = savedHistory ? JSON.parse(savedHistory) : [];

                    const sourceRoom = rooms.find(r => r.id.toString() === source);
                    const destRoom = rooms.find(r => r.id.toString() === destination);

                    if (sourceRoom && destRoom) {
                        const newQuery = {
                            sourceId: source,
                            destinationId: destination,
                            sourceName: sourceRoom.name,
                            destinationName: destRoom.name,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
                            floors: sourceRoom.floor?.id === destRoom.floor?.id
                                ? `${sourceRoom.floor?.floorName || 'Unknown Floor'}`
                                : `${sourceRoom.floor?.floorName || 'Floor'} ΓåÆ ${destRoom.floor?.floorName || 'Floor'}`
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
            setError('Failed to compute route. Make sure the backend server is online.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFavorite = () => {
        const email = localStorage.getItem('email');
        if (!email) return;

        const savedFavorites = localStorage.getItem(`favorites_${email}`);
        let favoritesArray = savedFavorites ? JSON.parse(savedFavorites) : [];

        const sourceRoom = rooms.find(r => r.id.toString() === source);
        const destRoom = rooms.find(r => r.id.toString() === destination);

        if (sourceRoom && destRoom) {
            const isAlreadySaved = favoritesArray.some(
                fav => fav.sourceId === source && fav.destinationId === destination
            );

            if (!isAlreadySaved) {
                favoritesArray.push({
                    sourceId: source,
                    destinationId: destination,
                    sourceName: sourceRoom.name,
                    destinationName: destRoom.name,
                    floorSummary: sourceRoom.floor?.id === destRoom.floor?.id
                        ? `${sourceRoom.floor?.floorName || 'Unknown Floor'}`
                        : `${sourceRoom.floor?.floorName || 'Floor'} ΓåÆ ${destRoom.floor?.floorName || 'Floor'}`
                });
                localStorage.setItem(`favorites_${email}`, JSON.stringify(favoritesArray));
                setIsSaved(true);
            }
        }
    };

    const handleRoomClick = (room) => {
        const roomIdStr = room.id.toString();
        if (!source || (source && destination)) {
            setSource(roomIdStr);
            setDestination('');
            setPath([]);
            setInstructions([]);
            setTotalDistance(0);
            setError('');
        } else {
            if (source === roomIdStr) {
                setError('Starting room and destination cannot be the same.');
                return;
            }
            setDestination(roomIdStr);
        }
    };

    const handleReset = () => {
        setSource('');
        setDestination('');
        setPath([]);
        setInstructions([]);
        setTotalDistance(0);
        setError('');
        setSelectedMapFloorId('All');
    };

    // Filter rooms list to display on current floor view
    const visibleRooms = rooms.filter(room => 
        selectedMapFloorId === 'All' || (room.floor && room.floor.id.toString() === selectedMapFloorId.toString())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-darkBg py-12 px-4">
            
            {/* SVG styling rules for animations */}
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
                    stroke-dasharray: 8 5;
                    animation: path-flow 1.2s linear infinite;
                }
            `}</style>

            <div className="container mx-auto max-w-7xl">
                {fetchingData ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <Loader />
                        <p className="text-xs font-black text-teal-600 uppercase tracking-widest">
                            Loading Campus Blueprint Map...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Side: Route selection control panels */}
                        <div className="lg:col-span-4">
                            <NavigationPanel
                                locations={rooms}
                                source={source}
                                destination={destination}
                                onSourceChange={setSource}
                                onDestinationChange={setDestination}
                                onSubmit={handleFindPath}
                                onReset={handleReset}
                                loading={loading}
                                error={error}
                                path={path}
                                instructions={instructions}
                                totalDistance={totalDistance}
                                wheelchairAccessible={wheelchairAccessible}
                                onWheelchairToggle={() => setWheelchairAccessible(!wheelchairAccessible)}
                                isSaved={isSaved}
                                onSaveFavorite={handleSaveFavorite}
                            />
                        </div>

                        {/* Right Side: Map Canvas */}
                        <div className="lg:col-span-8 bg-white dark:bg-darkCard rounded-3xl shadow-md p-6 border border-gray-100 dark:border-darkBorder flex flex-col space-y-5">
                            
                            {/* Map Title and Floor selection header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-darkHover pb-5">
                                <div>
                                    <h2 className="text-lg font-black text-teal-950 dark:text-white">
                                        Campus Building Floor Plan
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                                        Navigate room-to-room using A* shortest path calculation
                                    </p>
                                </div>
                                <FloorSelector
                                    floors={floors}
                                    selectedFloorId={selectedMapFloorId}
                                    onFloorSelect={setSelectedMapFloorId}
                                />
                            </div>

                            {/* SVG Blueprint Map Component */}
                            <IndoorMap
                                rooms={visibleRooms}
                                path={path}
                                selectedFloorId={selectedMapFloorId}
                                onRoomClick={handleRoomClick}
                                sourceId={source}
                                destinationId={destination}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navigation;
