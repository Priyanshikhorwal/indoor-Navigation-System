import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import Loader from '../components/Loader';
import { MapPin, Navigation2, Compass, AlertCircle, Volume2 } from 'lucide-react';

const SmartNavigation = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState(searchParams.get('token'));
    const [payload, setPayload] = useState(null);
    const [status, setStatus] = useState('initializing'); // initializing, far_away, navigating, error
    const [errorMsg, setErrorMsg] = useState('');
    const [path, setPath] = useState([]);
    const [buildingInfo, setBuildingInfo] = useState(null);
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Invalid or missing navigation link.');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const isExpired = decoded.exp * 1000 < Date.now();
            if (isExpired) {
                setStatus('error');
                setErrorMsg('This navigation link has expired (24 hours limit).');
                return;
            }
            setPayload(decoded);
            fetchBuilding(decoded.buildingId);
        } catch (err) {
            setStatus('error');
            setErrorMsg('Corrupt navigation token.');
        }
    }, [token]);

    const fetchBuilding = async (bId) => {
        try {
            const res = await api.get(`/buildings`);
            const bldg = res.data.find(b => b.id === bId);
            if (bldg) {
                setBuildingInfo(bldg);
                checkProximity(bldg);
            } else {
                throw new Error("Building not found");
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Failed to load building details.');
        }
    };

    const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; 
    };

    const checkProximity = (bldg) => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                
                // If building lacks GPS, fallback to mock near scenario for testing
                if (!bldg.latitude || !bldg.longitude) {
                    initiateNavigation(bldg);
                    return;
                }

                const dist = getHaversineDistance(userLat, userLon, bldg.latitude, bldg.longitude);
                if (dist <= 50) {
                    initiateNavigation(bldg);
                } else {
                    setStatus('far_away');
                }
            },
            (err) => {
                setStatus('error');
                setErrorMsg('Please allow GPS access to use Smart Navigation.');
            },
            { enableHighAccuracy: true }
        );
    };

    const initiateNavigation = async (bldg) => {
        try {
            const sourceId = payload.start || bldg.entranceNodeId;
            if (!sourceId) {
                setStatus('error');
                setErrorMsg('Building has no designated entrance node.');
                return;
            }

            const response = await api.get(`/path/find?sourceId=${sourceId}&destinationId=${payload.destination}`);
            if (response.data && response.data.length > 0) {
                setPath(response.data);
                setStatus('navigating');
            } else {
                setStatus('error');
                setErrorMsg('No path found to the destination.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Failed to calculate path.');
        }
    };

    const speakGuidance = () => {
        if (!('speechSynthesis' in window) || path.length < 2) return;
        setVoiceEnabled(true);
        let text = "Navigation started. Head towards " + path[1].name;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    if (status === 'initializing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <Loader />
                <h2 className="mt-4 text-lg font-bold text-primary">Validating Navigation Link...</h2>
                <p className="text-sm text-gray-500">Checking GPS proximity</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Navigation Failed</h2>
                <p className="text-gray-600 mt-2">{errorMsg}</p>
            </div>
        );
    }

    if (status === 'far_away') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <MapPin className="w-16 h-16 text-orange-500 mb-4 animate-bounce" />
                <h2 className="text-xl font-bold text-gray-800">Move Closer</h2>
                <p className="text-gray-600 mt-2 max-w-sm">
                    You are currently too far from <strong>{buildingInfo?.name}</strong>. Please move within 50 meters of the building entrance to start your indoor navigation.
                </p>
                <button 
                    onClick={() => setStatus('initializing')} 
                    className="mt-6 bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-opacity-90"
                >
                    Re-check GPS Proximity
                </button>
            </div>
        );
    }

    // navigating
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-primary p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-bold text-lg flex items-center gap-2">
                            <Navigation2 className="w-6 h-6" /> Smart Guidance
                        </h1>
                        <p className="text-primary-foreground/80 text-xs mt-1">To: Destination #{payload?.destination}</p>
                    </div>
                    <button 
                        onClick={speakGuidance}
                        className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-accent text-white shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative border-l-2 border-primary/20 ml-4">
                        {path.map((loc, index) => {
                            const showTransition = index > 0 && loc.floor !== path[index - 1].floor;
                            return (
                                <React.Fragment key={index}>
                                    {showTransition && (
                                        <div className="mb-6 ml-6 relative">
                                            <div className="absolute -left-[32px] w-4.5 h-4.5 rounded-full border-2 border-white bg-accent flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                            </div>
                                            <div className="bg-accent/5 border border-accent/15 rounded-xl p-3 flex items-center gap-3">
                                                <Compass className="text-accent w-4 h-4" />
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-accent uppercase">Floor Transition</h4>
                                                    <p className="text-xs text-gray-700">Go to Floor {loc.floor}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mb-6 ml-6 relative">
                                        <div className={`absolute -left-[32px] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center ${index === 0 ? 'bg-green-500' : index === path.length - 1 ? 'bg-accent' : 'bg-primary'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-800">{loc.name}</h3>
                                        {loc.floor && <span className="inline-block mt-1 text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">Floor {loc.floor}</span>}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartNavigation;
