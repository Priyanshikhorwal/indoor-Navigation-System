import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import FloorSelector from '../components/FloorSelector';
import IndoorMap from '../components/IndoorMap';
import { useToast } from '../context/ToastContext';
import { MapPin, Navigation2, Compass, AlertCircle, Volume2, VolumeX, ArrowRight, CheckCircle } from 'lucide-react';

const T = {
  900: '#1a4a4a', // Dark slate/teal
  800: '#2a6b6b',
  600: '#3d8b8b',
  500: '#5aadad',
  300: '#8dd4d4',
  100: '#c4eaea',
  50:  '#eaf7f7',
};

const SmartNavigation = () => {
    const [searchParams] = useSearchParams();
    const [token] = useState(searchParams.get('token'));
    const [payload, setPayload] = useState(null);
    const [status, setStatus] = useState('initializing'); // initializing, far_away, navigating, error, arrived
    const [errorMsg, setErrorMsg] = useState('');
    
    // GPS & Proximity
    const [userCoords, setUserCoords] = useState(null);
    const [distanceToBuilding, setDistanceToBuilding] = useState(null);
    
    // Navigation/Path data
    const [buildingInfo, setBuildingInfo] = useState(null);
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [path, setPath] = useState([]);
    const [instructions, setInstructions] = useState([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [selectedMapFloorId, setSelectedMapFloorId] = useState('All');
    
    // Voice & Toast
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const { showToast } = useToast();

    // 1. Validate Token on Load
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Smart navigation link is missing or corrupted.');
            return;
        }
        validateNavigationLink();
    }, [token]);

    const validateNavigationLink = async () => {
        try {
            const res = await api.get(`/navigation/validate-token?token=${token}`);
            if (res.data && res.data.valid) {
                setPayload(res.data);
                showToast('Navigation token validated successfully!', 'success');
                
                // Fetch building and map details
                await loadMapData(res.data.buildingId);
            } else {
                setStatus('error');
                setErrorMsg(res.data.error || 'This link has expired or is invalid.');
                showToast('Invalid or expired token', 'error');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Failed to connect to the authentication server.');
            showToast('Connection error', 'error');
        }
    };

    const loadMapData = async (buildingId) => {
        try {
            // Load map components (buildings, floors, rooms)
            const [bldgRes, floorsRes, roomsRes] = await Promise.all([
                api.get('/buildings'),
                api.get('/floors'),
                api.get('/rooms')
            ]);

            const building = bldgRes.data.find(b => b.id === buildingId);
            if (!building) {
                throw new Error("Building details not found.");
            }
            setBuildingInfo(building);

            // Filter floors and rooms associated with this building
            const buildingFloors = floorsRes.data.filter(f => f.building?.id === buildingId);
            setFloors(buildingFloors);
            
            const buildingRooms = roomsRes.data.filter(r => r.floor?.building?.id === buildingId);
            setRooms(buildingRooms);

            // Start watching GPS position for proximity checks
            startProximityTracking(building);

        } catch (err) {
            setStatus('error');
            setErrorMsg('Could not load indoor blueprint map data.');
            showToast('Map initialization failed', 'error');
        }
    };

    // 2. Haversine Distance Formula (metres)
    const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // 3. Real-time GPS Tracker & Geofence
    const startProximityTracking = (bldg) => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Your device does not support GPS geolocation.');
            showToast('GPS not supported', 'error');
            return;
        }

        showToast('Acquiring GPS location...', 'success');

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                setUserCoords({ latitude: userLat, longitude: userLon });

                // If building doesn't have lat/long configured, bypass and start navigation
                if (!bldg.latitude || !bldg.longitude) {
                    setDistanceToBuilding(0);
                    triggerRouteCalculation(bldg);
                    return;
                }

                const distance = getHaversineDistance(userLat, userLon, bldg.latitude, bldg.longitude);
                setDistanceToBuilding(distance);

                if (distance <= 50) {
                    if (status !== 'navigating' && status !== 'arrived') {
                        showToast('Welcome! You have entered the building perimeter.', 'success');
                        speakGuidance("You have entered the building. Starting indoor navigation.");
                        triggerRouteCalculation(bldg);
                    }
                } else {
                    setStatus('far_away');
                }
            },
            (err) => {
                console.error(err);
                setStatus('error');
                setErrorMsg('GPS location access denied. Please grant permission to locate the building.');
                showToast('GPS access denied', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    };

    // 4. Trigger Path calculation via A* Service
    const triggerRouteCalculation = async (bldg) => {
        try {
            // Auto detect entrance if start node is not provided
            const sourceId = payload?.startNodeId || bldg.entranceNodeId;
            const destId = payload?.destinationNodeId;

            if (!sourceId || !destId) {
                setStatus('error');
                setErrorMsg('Invalid entrance or destination configuration.');
                return;
            }

            const res = await api.get(`/path/find?sourceId=${sourceId}&destinationId=${destId}`);
            if (res.data && res.data.path && res.data.path.length > 0) {
                setPath(res.data.path);
                setInstructions(res.data.instructions || []);
                setTotalDistance(res.data.totalDistance || 0);
                
                // Auto set map focus to the first node's floor
                const startNode = res.data.path[0];
                if (startNode && startNode.floor) {
                    setSelectedMapFloorId(startNode.floor.id);
                }

                setStatus('navigating');
                showToast('Indoor path generated!', 'success');
                if (res.data.instructions && res.data.instructions.length > 0) {
                    speakGuidance(res.data.instructions[0].instruction);
                }
            } else {
                setStatus('error');
                setErrorMsg('No navigation path could be calculated to the room.');
                showToast('Pathfinding failed', 'error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg('Failed to calculate shortest path route.');
            showToast('Routing failed', 'error');
        }
    };

    // 5. Text to Speech Guidance Engine
    const speakGuidance = (phrase) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // cancel current speech
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    // Filter rooms list to display on current floor view
    const visibleRooms = rooms.filter(room => 
        selectedMapFloorId === 'All' || (room.floor && room.floor.id.toString() === selectedMapFloorId.toString())
    );

    // Render loading screen
    if (status === 'initializing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-teal-50/20 p-4 text-center">
                <Loader />
                <h2 className="mt-4 text-lg font-bold text-teal-900">Configuring Smart Link...</h2>
                <p className="text-sm text-gray-500">Decrypting target destination coordinates</p>
            </div>
        );
    }

    // Render error screen
    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-teal-50/20 p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-red-100 flex flex-col items-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-gray-800">Navigation Cancelled</h2>
                    <p className="text-gray-500 text-sm mt-3 leading-relaxed">{errorMsg}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full bg-teal-700 text-white py-2.5 rounded-lg font-semibold hover:bg-teal-800 transition-colors"
                    >
                        Retry Validation
                    </button>
                </div>
            </div>
        );
    }

    // Render far away/outside building radius screen
    if (status === 'far_away') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-teal-50/20 p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-teal-50 flex flex-col items-center">
                    <MapPin className="w-16 h-16 text-orange-500 mb-4 animate-bounce" />
                    <h2 className="text-xl font-bold text-teal-950">Approaching Building</h2>
                    <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                        Personalized link verified for <strong>{buildingInfo?.name}</strong>.
                    </p>
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 w-full mt-5">
                        <span className="text-xs text-teal-700 uppercase font-black tracking-widest block">Geofence Status</span>
                        <span className="text-2xl font-black text-teal-900 mt-1 block">
                            {distanceToBuilding ? `${Math.round(distanceToBuilding)}m` : '--'} remaining
                        </span>
                        <span className="text-[11px] text-teal-600 block mt-1">Please move within 50m of entrance to start indoor path.</span>
                    </div>
                </div>
            </div>
        );
    }

    // Render navigation guidance UI
    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col items-center">
            
            {/* SVG styling rules for navigation route path animations */}
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

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Real-time steps & directions */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Header Details */}
                    <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-800 text-white p-2.5 rounded-2xl">
                                    <Navigation2 className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-teal-950 text-base leading-tight">Smart Navigator</h1>
                                    <span className="text-[11px] text-gray-400 font-bold block mt-0.5">{buildingInfo?.name}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setVoiceEnabled(!voiceEnabled);
                                    showToast(voiceEnabled ? 'Voice guide disabled' : 'Voice guide enabled', 'success');
                                }}
                                className={`p-2.5 rounded-full transition-all border ${voiceEnabled ? 'bg-teal-50 border-teal-100 text-teal-800' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                title={voiceEnabled ? 'Mute Speech' : 'Unmute Speech'}
                            >
                                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Target Destination:</span>
                                <span className="font-bold text-teal-950">{payload?.destination}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Route Distance:</span>
                                <span className="font-bold text-teal-950">{totalDistance ? `${totalDistance.toFixed(1)} meters` : '--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Step by Step list */}
                    <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 max-h-[500px] overflow-y-auto">
                        <h2 className="text-xs font-black uppercase text-teal-900 tracking-widest mb-4">Route Instructions</h2>
                        <div className="relative border-l-2 border-teal-50 ml-3">
                            {instructions.map((step, idx) => (
                                <div key={idx} className="mb-6 ml-6 relative">
                                    {/* Icon decorator */}
                                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-600"></div>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-normal">{step.instruction}</p>
                                    <span className="text-[10px] font-bold text-teal-600 mt-1 block uppercase">{step.floorName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Map Renderer */}
                <div className="lg:col-span-8 bg-white rounded-3xl shadow-md p-6 border border-gray-100 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                            <h2 className="text-lg font-black text-teal-950">Indoor Layout Blueprint</h2>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">Real-time shortest path visualization</p>
                        </div>
                        <FloorSelector
                            floors={floors}
                            selectedFloorId={selectedMapFloorId}
                            onFloorSelect={setSelectedMapFloorId}
                        />
                    </div>

                    {/* Render the SVG map */}
                    <div className="relative border border-gray-50 rounded-2xl overflow-hidden aspect-[8/5]">
                        <IndoorMap
                            rooms={visibleRooms}
                            path={path}
                            selectedFloorId={selectedMapFloorId}
                            onRoomClick={() => {}}
                            sourceId={payload?.startNodeId || (buildingInfo?.entranceNodeId ? buildingInfo.entranceNodeId.toString() : '')}
                            destinationId={payload?.destinationNodeId ? payload.destinationNodeId.toString() : ''}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartNavigation;
