import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Navigation2, MapPin } from 'lucide-react';

const Navigation = () => {
    const [locations, setLocations] = 0 ? [] : useState([]); // trick to bypass syntax highlighting issue
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingLocs, setFetchingLocs] = useState(true);
    const [error, setError] = useState('');

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
        e.preventDefault();
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
            }
        } catch (err) {
            setError('Failed to find path. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-primary p-6 text-white flex items-center gap-3">
                        <Navigation2 className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">Find Your Route</h1>
                    </div>
                    
                    <div className="p-8">
                        {fetchingLocs ? <Loader /> : (
                            <form onSubmit={handleFindPath} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Location</label>
                                        <select 
                                            required
                                            value={source} 
                                            onChange={(e) => setSource(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        >
                                            <option value="">Select source...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name} {loc.floor && `(Floor ${loc.floor})`}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
                                        <select 
                                            required
                                            value={destination} 
                                            onChange={(e) => setDestination(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        >
                                            <option value="">Select destination...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name} {loc.floor && `(Floor ${loc.floor})`}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {error && <div className="text-accent bg-red-50 p-3 rounded text-sm font-medium">{error}</div>}
                                
                                <button 
                                    type="submit" 
                                    disabled={loading || !source || !destination}
                                    className="w-full bg-accent text-white py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Calculating Path...' : 'Find Shortest Path'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {path.length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                            <MapPin className="text-accent" />
                            Route Guidance
                        </h2>
                        
                        <div className="relative border-l-4 border-primary ml-4">
                            {path.map((loc, index) => (
                                <div key={index} className="mb-8 ml-6 relative">
                                    <div className={`absolute -left-[35px] w-6 h-6 rounded-full border-4 border-white ${index === 0 ? 'bg-green-500' : index === path.length - 1 ? 'bg-accent' : 'bg-primary'}`}></div>
                                    <h3 className="text-lg font-bold text-gray-800">{loc.name}</h3>
                                    {loc.description && <p className="text-gray-500 text-sm mt-1">{loc.description}</p>}
                                    {loc.floor && <p className="text-gray-400 text-xs mt-1 font-semibold uppercase">Floor {loc.floor}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navigation;
