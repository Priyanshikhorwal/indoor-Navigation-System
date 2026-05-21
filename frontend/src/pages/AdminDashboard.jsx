import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Plus, Trash2, Edit, Compass, Database, Check, Copy, AlertCircle, Sparkles, MapPin, Building, Layers, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
    const { showToast } = useToast();
    const [connSearchTerm, setConnSearchTerm] = useState("");
    const [editingConn, setEditingConn] = useState(null);
    const [locations, setLocations] = useState([]);
    const [connections, setConnections] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [graphHealth, setGraphHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('locations'); // 'locations' or 'connections'
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Add location form state
    const [newLoc, setNewLoc] = useState({ name: '', description: '', xCoordinate: '', yCoordinate: '', floorId: '', type: 'ROOM' });
    const [newBuilding, setNewBuilding] = useState({ name: '', description: '' });
    const [newFloor, setNewFloor] = useState({ floorName: '', floorNumber: '', buildingId: '' });
    const [mapFile, setMapFile] = useState(null);
    
    // Edit modal state
    const [editingLoc, setEditingLoc] = useState(null);
    
    // Search/filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [floorFilter, setFloorFilter] = useState('');
    
    // Path Connection Seeding states
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    const [sqlCopySuccess, setSqlCopySuccess] = useState(false);
    const [activeMapFloor, setActiveMapFloor] = useState('All');
    
    // Drag and Drop Mapping & Blueprint Overlay states
    const [blueprintUrl, setBlueprintUrl] = useState('');
    const [draggedNode, setDraggedNode] = useState(null);
    const svgRef = useRef(null);

    // Route tester
    const [testRouteSource, setTestRouteSource] = useState('');
    const [testRouteDest, setTestRouteDest] = useState('');
    const [testRouteResult, setTestRouteResult] = useState(null);

    

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [locRes, connRes, buildRes, floorRes, healthRes] = await Promise.all([
                api.get('/locations'),
                api.get('/connections'),
                api.get('/buildings'),
                api.get('/floors'),
                api.get('/locations/validate')
            ]);
            setLocations(locRes.data);
            setConnections(connRes.data);
            setBuildings(buildRes.data);
            setFloors(floorRes.data);
            setGraphHealth(healthRes.data);
        } catch (err) {
            showToast('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await api.get('/locations');
            setLocations(res.data);
        } catch (err) {
            showToast('Failed to fetch locations', 'error');
        }
    };

    const fetchConnections = async () => {
        try {
            const res = await api.get('/connections');
            setConnections(res.data);
        } catch (err) {
            showToast('Failed to fetch connections', 'error');
        }
    };

    const fetchBuildings = async () => {
        try {
            const res = await api.get('/buildings');
            setBuildings(res.data);
        } catch (err) {
            showToast('Failed to fetch buildings', 'error');
        }
    };

    const fetchFloors = async () => {
        try {
            const res = await api.get('/floors');
            setFloors(res.data);
        } catch (err) {
            showToast('Failed to fetch floors', 'error');
        }
    };

    const handleAddLocation = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newLoc,
                floor: newLoc.floorId ? { id: parseInt(newLoc.floorId) } : null
            };
            await api.post('/locations', payload);
            showToast('Location added successfully!', 'success');
            setNewLoc({ name: '', description: '', xCoordinate: '', yCoordinate: '', floorId: '', type: 'ROOM' });
            setShowAddForm(false);
            fetchLocations();
            setTimeout(() => showToast('', 'success'), 3000);
        } catch (err) {
            showToast('Failed to add location', 'error');
        }
    };

    const handleEditLocation = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/locations/${editingLoc.id}`, editingLoc);
            showToast('Location updated successfully!', 'success');
            setEditingLoc(null);
            fetchLocations();
            setTimeout(() => showToast('', 'success'), 3000);
        } catch (err) {
            showToast('Failed to update location', 'error');
        }
    };

    
    const handleEditConnection = async () => {
        try {
            await api.put(`/connections/${editingConn.id}`, {
                sourceLocationId: editingConn.sourceLocation.id,
                destinationLocationId: editingConn.destinationLocation.id,
                distance: editingConn.distance,
                isAccessible: editingConn.isAccessible
            });
            showToast('Path connection updated successfully!', 'success');
            setEditingConn(null);
            fetchConnections();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update connection.', 'error');
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/locations/${id}`);
            fetchLocations();
        } catch (err) {
            showToast('Failed to delete. May have connected paths.', 'error');
        }
    };

    const handleAddBuilding = async (e) => {
        e.preventDefault();
        try {
            await api.post('/buildings', newBuilding);
            showToast('Building added!', 'success');
            setNewBuilding({ name: '', description: '' });
            fetchBuildings();
            setTimeout(() => showToast('', 'success'), 3000);
        } catch (err) {
            showToast('Failed to add building', 'error');
        }
    };

    const handleDeleteBuilding = async (id) => {
        if(!window.confirm('Are you sure? Deleting a building may delete all its floors.')) return;
        try {
            await api.delete(`/buildings/${id}`);
            fetchBuildings();
        } catch (err) {
            showToast('Failed to delete building.', 'error');
        }
    };

    const handleAddFloor = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                floorName: newFloor.floorName,
                floorNumber: parseInt(newFloor.floorNumber),
                building: { id: parseInt(newFloor.buildingId) }
            };
            const res = await api.post('/floors', payload);
            
            if (mapFile) {
                const formData = new FormData();
                formData.append('file', mapFile);
                await api.post(`/floors/${res.data.id}/map`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            
            showToast('Floor added!', 'success');
            setNewFloor({ floorName: '', floorNumber: '', buildingId: '' });
            setMapFile(null);
            fetchFloors();
            setTimeout(() => showToast('', 'success'), 3000);
        } catch (err) {
            showToast('Failed to add floor', 'error');
        }
    };

    const handleDeleteFloor = async (id) => {
        if(!window.confirm('Are you sure? Deleting a floor may delete its locations.')) return;
        try {
            await api.delete(`/floors/${id}`);
            fetchFloors();
        } catch (err) {
            showToast('Failed to delete floor.', 'error');
        }
    };

    // Calculate distance for edge weight
    const calculateDistance = (n1, n2) => {
        if (!n1 || !n2) return 0;
        const dx = n1.xCoordinate - n2.xCoordinate;
        const dy = n1.yCoordinate - n2.yCoordinate;
        return Math.sqrt(dx * dx + dy * dy).toFixed(2);
    };

    const handleMapNodeClick = (loc) => {
        if (!startNode || (startNode && endNode)) {
            setStartNode(loc);
            setEndNode(null);
        } else {
            if (startNode.id === loc.id) {
                showToast('A path connection cannot connect a room to itself.', 'error');
                return;
            }
            setEndNode(loc);
        }
    };

    const handleCreateConnection = async () => {
        if (!startNode || !endNode) return;
        try {
            const distance = calculateDistance(startNode, endNode);
            await api.post('/connections', {
                sourceLocationId: startNode.id,
                destinationLocationId: endNode.id,
                distance: parseFloat(distance),
                isAccessible: true
            });
            showToast('Path connection created successfully!', 'success');
            setStartNode(null);
            setEndNode(null);
            fetchConnections();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create connection.', 'error');
        }
    };

    const handleDeleteConnection = async (connId) => {
        if(!window.confirm('Delete this path connection?')) return;
        try {
            await api.delete(`/connections/${connId}`);
            fetchConnections();
            showToast('Connection deleted.', 'success');
        } catch (err) {
            showToast('Failed to delete connection.', 'error');
        }
    };

    const handleTestRoute = async () => {
        if (!testRouteSource || !testRouteDest) {
            showToast('Select both source and destination to test route.', 'error');
            return;
        }
        try {
            const res = await api.get(`/navigation/route?sourceId=${testRouteSource}&destinationId=${testRouteDest}&wheelchairAccessible=false`);
            setTestRouteResult(res.data);
        } catch (err) {
            showToast('Failed to calculate route.', 'error');
        }
    };

    // Coordinate scale reversals for drag-and-drop mapper
    const reverseScaleX = (rx) => {
        const range = maxX - minX || 1;
        const val = minX + ((rx - padding) / (svgWidth - 2 * padding)) * range;
        return Math.round(val);
    };

    const reverseScaleY = (ry) => {
        const range = maxY - minY || 1;
        const val = minY + ((ry - padding) / (svgHeight - 2 * padding)) * range;
        return Math.round(val);
    };

    const handlePointerDown = (e, loc) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggedNode(loc);
    };

    const handlePointerMove = (e) => {
        if (!draggedNode) return;
        e.preventDefault();
        const rect = svgRef.current.getBoundingClientRect();
        const rx = ((e.clientX - rect.left) / rect.width) * svgWidth;
        const ry = ((e.clientY - rect.top) / rect.height) * svgHeight;
        
        const clampedRx = Math.max(padding, Math.min(svgWidth - padding, rx));
        const clampedRy = Math.max(padding, Math.min(svgHeight - padding, ry));

        const newX = reverseScaleX(clampedRx);
        const newY = reverseScaleY(clampedRy);

        setLocations(prev => prev.map(l => {
            if (l.id === draggedNode.id) {
                return { ...l, xCoordinate: newX, yCoordinate: newY };
            }
            return l;
        }));
    };

    const handlePointerUp = async (e) => {
        if (!draggedNode) return;
        e.preventDefault();
        e.currentTarget.releasePointerCapture(e.pointerId);

        const finalNode = locations.find(l => l.id === draggedNode.id);
        setDraggedNode(null);

        if (finalNode) {
            try {
                await api.put(`/locations/${finalNode.id}`, finalNode);
                showToast(`Relocated ${finalNode.name} to coordinates (${finalNode.xCoordinate}, ${finalNode.yCoordinate}, 'success') & saved to database! 📍`);
                setTimeout(() => showToast('', 'success'), 2500);
                fetchLocations();
            } catch (err) {
                showToast('Failed to auto-save room drag relocation.', 'error');
            }
        }
    };

    // Location searching & filtering logic
    const uniqueFloors = [...new Set(locations.map(loc => loc.floor?.id).filter(Boolean))];
    const filteredLocations = locations.filter(loc => {
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (loc.description && loc.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFloor = !floorFilter || (loc.floor && loc.floor.id === parseInt(floorFilter));
        return matchesSearch && matchesFloor;
    });

    // SVG scaling variables for blueprint map
    const padding = 50;
    const svgWidth = 800;
    const svgHeight = 480;

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

    if (loading) return <Loader />;


    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure and manage building room grids and network connection weights</p>
                </div>
                
                {/* Tab Switchers */}
                <div className="flex bg-gradient-to-br from-secondary to-secondary-dark p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('buildings')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === 'buildings'
                                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-soft'
                                : 'text-primary/70 hover:text-primary hover:bg-white/50'
                        }`}
                    >
                        <Building className="w-4.5 h-4.5" />
                        Buildings
                    </button>
                    <button
                        onClick={() => setActiveTab('floors')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === 'floors'
                                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-soft'
                                : 'text-primary/70 hover:text-primary hover:bg-white/50'
                        }`}
                    >
                        <Layers className="w-4.5 h-4.5" />
                        Floors
                    </button>
                    <button
                        onClick={() => setActiveTab('locations')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === 'locations'
                                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-soft'
                                : 'text-primary/70 hover:text-primary hover:bg-white/50'
                        }`}
                    >
                        <Compass className="w-4.5 h-4.5" />
                        Manage Locations
                    </button>
                    <button
                        onClick={() => setActiveTab('connections')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === 'connections'
                                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-soft'
                                : 'text-primary/70 hover:text-primary hover:bg-white/50'
                        }`}
                    >
                        <Database className="w-4.5 h-4.5" />
                        Path Connections
                    </button>
                </div>
            </div>
            
            

            {/* TAB: MANAGE BUILDINGS */}
            {activeTab === 'buildings' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <Building className="text-accent"/> Add New Building
                        </h2>
                        <form onSubmit={handleAddBuilding} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="Building Name" required value={newBuilding.name} onChange={e=>setNewBuilding({...newBuilding, name: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                            <input type="text" placeholder="Description" value={newBuilding.description} onChange={e=>setNewBuilding({...newBuilding, description: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                            <button type="submit" className="bg-gradient-to-r from-accent to-accent-light text-white py-2.5 px-4 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all shadow-soft shadow-red-100 flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4"/> Save Building
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h2 className="text-xl font-bold text-primary mb-4 border-b border-gray-100 pb-4">Manage Buildings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {buildings.map(b => (
                                <div key={b.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-soft transition-shadow relative group bg-gray-50/50">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDeleteBuilding(b.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building className="w-4 h-4 text-primary"/> {b.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{b.description || 'No description'}</p>
                                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 font-mono">
                                        Building ID: #{b.id}
                                    </div>
                                </div>
                            ))}
                            {buildings.length === 0 && (
                                <p className="text-gray-500 text-sm col-span-full py-8 text-center">No buildings configured. Create one above.</p>
                            )}
                        </div>
                    </div>

                    {/* CONNECTIONS TABLE */}
                    <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow border border-gray-100 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                                <Database className="text-accent" /> Manage All Connections
                            </h3>
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by room name..." 
                                    value={connSearchTerm}
                                    onChange={(e) => setConnSearchTerm(e.target.value)}
                                    className="p-2 border rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Distance</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Accessible</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {connections.filter(c => {
                                        const term = connSearchTerm.toLowerCase();
                                        return c.sourceLocation.name.toLowerCase().includes(term) || 
                                               c.destinationLocation.name.toLowerCase().includes(term);
                                    }).map(conn => (
                                        <tr key={conn.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm text-gray-500">#{conn.id}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.sourceLocation.name}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.destinationLocation.name}</td>
                                            <td className="p-3.5 text-sm font-mono text-gray-600">{conn.distance.toFixed(1)}</td>
                                            <td className="p-3.5 text-sm">
                                                {conn.isAccessible ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">No</span>
                                                )}
                                            </td>
                                            <td className="p-3.5 flex items-center gap-2">
                                                <button onClick={() => setEditingConn(conn)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Connection">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDeleteConnection(conn.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Connection">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB: MANAGE FLOORS */}
            {activeTab === 'floors' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <Layers className="text-accent"/> Add New Floor
                        </h2>
                        <form onSubmit={handleAddFloor} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <select required value={newFloor.buildingId} onChange={e=>setNewFloor({...newFloor, buildingId: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="">Select Building...</option>
                                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <input type="text" placeholder="Floor Name (e.g. Ground Floor)" required value={newFloor.floorName} onChange={e=>setNewFloor({...newFloor, floorName: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                            <input type="number" placeholder="Floor Number (e.g. 0, 1, -1)" required value={newFloor.floorNumber} onChange={e=>setNewFloor({...newFloor, floorNumber: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                            
                            <div className="col-span-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Map Image (Optional)</label>
                                <input type="file" onChange={e => setMapFile(e.target.files[0])} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r from-primary to-primary-light/10 file:text-primary hover:file:bg-gradient-to-r from-primary to-primary-light/20 transition-colors" />
                            </div>

                            <div className="col-span-full flex justify-end mt-2">
                                <button type="submit" className="bg-gradient-to-r from-accent to-accent-light text-white py-2.5 px-6 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all shadow-soft shadow-red-100 flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4"/> Save Floor
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <h2 className="text-xl font-bold text-primary mb-4 border-b border-gray-100 pb-4">Manage Floors</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Building</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Floor Name</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Floor Number</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Map Image</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {floors.map(f => (
                                        <tr key={f.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{f.building?.name || 'Unknown'}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{f.floorName}</td>
                                            <td className="p-3.5 text-sm font-mono">{f.floorNumber}</td>
                                            <td className="p-3.5 text-sm">
                                                {f.mapImageUrl ? <a href={`http://localhost:8080${f.mapImageUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Map</a> : <span className="text-gray-300 italic">None</span>}
                                            </td>
                                            <td className="p-3.5">
                                                <button onClick={() => handleDeleteFloor(f.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Floor">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {floors.length === 0 && (
                                <p className="text-center py-10 text-gray-500 text-sm">No floors configured.</p>
                            )}
                        </div>
                    </div>

                    {/* CONNECTIONS TABLE */}
                    <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow border border-gray-100 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                                <Database className="text-accent" /> Manage All Connections
                            </h3>
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by room name..." 
                                    value={connSearchTerm}
                                    onChange={(e) => setConnSearchTerm(e.target.value)}
                                    className="p-2 border rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Distance</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Accessible</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {connections.filter(c => {
                                        const term = connSearchTerm.toLowerCase();
                                        return c.sourceLocation.name.toLowerCase().includes(term) || 
                                               c.destinationLocation.name.toLowerCase().includes(term);
                                    }).map(conn => (
                                        <tr key={conn.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm text-gray-500">#{conn.id}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.sourceLocation.name}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.destinationLocation.name}</td>
                                            <td className="p-3.5 text-sm font-mono text-gray-600">{conn.distance.toFixed(1)}</td>
                                            <td className="p-3.5 text-sm">
                                                {conn.isAccessible ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">No</span>
                                                )}
                                            </td>
                                            <td className="p-3.5 flex items-center gap-2">
                                                <button onClick={() => setEditingConn(conn)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Connection">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDeleteConnection(conn.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Connection">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB: MANAGE LOCATIONS */}
            {activeTab === 'locations' && (
                <div className="space-y-6">
                    {/* Expandable Add Location drawer trigger bar */}
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-primary to-primary-light/10 text-primary rounded-lg">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Add a New Room Location</h3>
                                <p className="text-xs text-gray-500">Insert coordinate coordinates directly into database grids</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-gradient-to-r from-primary to-primary-light text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-opacity-95 transition-all flex items-center gap-1.5"
                        >
                            <Plus className={`w-4 h-4 transition-transform duration-200 ${showAddForm ? 'rotate-45' : ''}`} />
                            {showAddForm ? 'Close Editor' : 'Open Location Form'}
                        </button>
                    </div>

                    {/* Expandable Add form slide container */}
                    {showAddForm && (
                        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200">
                            <h2 className="text-lg font-bold mb-4 text-primary flex items-center gap-2">
                                <Plus className="text-accent"/> Create New Node Record
                            </h2>
                            <form onSubmit={handleAddLocation} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" placeholder="Location Name" required value={newLoc.name} onChange={e=>setNewLoc({...newLoc, name: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                <input type="text" placeholder="Description" value={newLoc.description} onChange={e=>setNewLoc({...newLoc, description: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                <select required value={newLoc.floorId} onChange={e=>setNewLoc({...newLoc, floorId: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="">Select Floor...</option>
                                    {floors.map(f => (
                                        <option key={f.id} value={f.id}>{f.building?.name} - {f.floorName}</option>
                                    ))}
                                </select>
                                <select required value={newLoc.type} onChange={e=>setNewLoc({...newLoc, type: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="ROOM">Room</option>
                                    <option value="CORRIDOR">Corridor</option>
                                    <option value="STAIRS">Stairs</option>
                                    <option value="ELEVATOR">Elevator</option>
                                    <option value="ENTRANCE">Entrance</option>
                                    <option value="EXIT">Exit</option>
                                </select>
                                <input type="number" placeholder="X Coordinate (Integer)" required value={newLoc.xCoordinate} onChange={e=>setNewLoc({...newLoc, xCoordinate: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                <input type="number" placeholder="Y Coordinate (Integer)" required value={newLoc.yCoordinate} onChange={e=>setNewLoc({...newLoc, yCoordinate: e.target.value})} className="p-2.5 border rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                <button type="submit" className="bg-gradient-to-r from-accent to-accent-light text-white py-2.5 px-4 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all shadow-soft shadow-red-100">
                                    Save Location Record
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Filter and Location Table */}
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-primary">Manage Locations</h2>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="Search locations..." 
                                    value={searchTerm} 
                                    onChange={e=>setSearchTerm(e.target.value)} 
                                    className="p-2 border rounded-lg text-sm w-full sm:w-48 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                                />
                                <select 
                                    value={floorFilter} 
                                    onChange={e=>setFloorFilter(e.target.value)} 
                                    className="p-2 border rounded-lg text-sm w-full sm:w-32 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">All Floors</option>
                                    {uniqueFloors.map(floorId => {
                                        const floorObj = floors.find(f => f.id === floorId);
                                        return <option key={floorId} value={floorId}>{floorObj ? floorObj.floorName : `Floor ID: ${floorId}`}</option>
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinates (X, Y)</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Floor Elevation</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLocations.map(loc => (
                                        <tr key={loc.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm text-gray-500">#{loc.id}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{loc.name}</td>
                                            <td className="p-3.5 text-sm text-gray-600 font-mono">({loc.xCoordinate}, {loc.yCoordinate})</td>
                                            <td className="p-3.5 text-sm">{loc.floor ? loc.floor.floorName : <span className="text-gray-300 italic">None</span>}</td>
                                            <td className="p-3.5 flex items-center gap-2">
                                                <button onClick={() => setEditingLoc(loc)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Location">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDelete(loc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Location">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLocations.length === 0 && (
                                <p className="text-center py-10 text-gray-500 text-sm">
                                    {locations.length === 0 ? 'No locations configured.' : 'No locations match your search filters.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* CONNECTIONS TABLE */}
                    <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow border border-gray-100 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                                <Database className="text-accent" /> Manage All Connections
                            </h3>
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by room name..." 
                                    value={connSearchTerm}
                                    onChange={(e) => setConnSearchTerm(e.target.value)}
                                    className="p-2 border rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Distance</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Accessible</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {connections.filter(c => {
                                        const term = connSearchTerm.toLowerCase();
                                        return c.sourceLocation.name.toLowerCase().includes(term) || 
                                               c.destinationLocation.name.toLowerCase().includes(term);
                                    }).map(conn => (
                                        <tr key={conn.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm text-gray-500">#{conn.id}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.sourceLocation.name}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.destinationLocation.name}</td>
                                            <td className="p-3.5 text-sm font-mono text-gray-600">{conn.distance.toFixed(1)}</td>
                                            <td className="p-3.5 text-sm">
                                                {conn.isAccessible ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">No</span>
                                                )}
                                            </td>
                                            <td className="p-3.5 flex items-center gap-2">
                                                <button onClick={() => setEditingConn(conn)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Connection">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDeleteConnection(conn.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Connection">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB 2: PATH CONNECTIONS & SQL GENERATOR */}
            {activeTab === 'connections' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* SVG Map Link Selector Column */}
                    <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow border border-gray-100 flex flex-col space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Interactive Room Connect</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Click any two room circles to establish link pathways</p>
                            </div>
                            
                            {/* Map Floor select Tab list */}
                            <div className="flex flex-wrap gap-1.5 bg-gradient-to-br from-secondary to-secondary-dark p-1 rounded-xl">
                                {['All', ...uniqueFloors].map(floorId => {
                                    const floorLabel = floorId === 'All' ? 'All Floors' : (floors.find(f => f.id === floorId)?.floorName || `Floor ID: ${floorId}`);
                                    return (
                                        <button
                                            key={floorId}
                                            onClick={() => setActiveMapFloor(floorId)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                activeMapFloor === floorId
                                                    ? 'bg-gradient-to-r from-primary to-primary-light text-white'
                                                    : 'text-primary/70 hover:text-primary hover:bg-white/50'
                                            }`}
                                        >
                                            {floorLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {graphHealth && (
                            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in ${graphHealth.healthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div>
                                    <h4 className={`font-bold flex items-center gap-2 ${graphHealth.healthy ? 'text-green-800' : 'text-red-800'}`}>
                                        {graphHealth.healthy ? <Check className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>} 
                                        {graphHealth.healthy ? 'Graph is Healthy' : 'Graph Issues Detected'}
                                    </h4>
                                    <p className={`text-xs mt-1 ${graphHealth.healthy ? 'text-green-600' : 'text-red-600'}`}>
                                        {graphHealth.totalLocations} Nodes, {graphHealth.totalConnections} Edges, {graphHealth.totalComponents} Components.
                                    </p>
                                </div>
                                {!graphHealth.healthy && (
                                    <div className="text-xs text-red-700 space-y-1">
                                        {graphHealth.isolatedNodes.length > 0 && <p>• {graphHealth.isolatedNodes.length} isolated nodes.</p>}
                                        {graphHealth.unreachableFloors.length > 0 && <p>• Unreachable floors detected.</p>}
                                        {graphHealth.totalComponents > 1 && <p>• Graph is broken into {graphHealth.totalComponents} disconnected areas.</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Blueprint overlay controls */}
                        <div className="bg-gradient-to-br from-secondary to-secondary-dark/40 p-3 rounded-xl border border-gray-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                            <span className="font-bold text-primary/80 shrink-0 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent"/> Blueprint Image URL:</span>
                            <input 
                                type="text" 
                                placeholder="Paste floor plan image URL to show as overlay underlay (e.g. PNG, SVG)..." 
                                value={blueprintUrl}
                                onChange={e => setBlueprintUrl(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary focus:border-transparent text-gray-700 text-xs font-mono"
                            />
                        </div>

                        {/* Node map container */}
                        <div className="relative border border-gray-100 rounded-2xl bg-gray-50 overflow-hidden aspect-[8/4.8]">
                            <svg 
                                ref={svgRef}
                                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                                className="w-full h-full select-none"
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                            >
                                <defs>
                                    <pattern id="admin-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5ECE9" strokeWidth="1"/>
                                    </pattern>
                                </defs>
                                
                                {blueprintUrl ? (
                                    <image 
                                        href={blueprintUrl} 
                                        width="100%" 
                                        height="100%" 
                                        preserveAspectRatio="xMidYMid slice" 
                                        opacity="0.8" 
                                    />
                                ) : (
                                    <rect width="100%" height="100%" fill="url(#admin-grid)" />
                                )}

                                {/* Draw existing path connections */}
                                {connections.map(conn => {
                                    const source = locations.find(l => l.id === conn.sourceLocation.id);
                                    const dest = locations.find(l => l.id === conn.destinationLocation.id);
                                    if (!source || !dest || source.xCoordinate === null || source.yCoordinate === null || dest.xCoordinate === null || dest.yCoordinate === null) return null;
                                    
                                    const isVisible = activeMapFloor === 'All' || (source.floor?.id === activeMapFloor && dest.floor?.id === activeMapFloor);
                                    
                                    return (
                                        <g key={conn.id} onClick={() => isVisible && handleDeleteConnection(conn.id)} className={`cursor-pointer transition-all duration-200 ${isVisible ? 'opacity-100' : 'opacity-10'}`}>
                                            <line 
                                                x1={scaleX(source.xCoordinate)}
                                                y1={scaleY(source.yCoordinate)}
                                                x2={scaleX(dest.xCoordinate)}
                                                y2={scaleY(dest.yCoordinate)}
                                                stroke="#94A3B8"
                                                strokeWidth="4"
                                                className="hover:stroke-red-500 transition-colors"
                                            />
                                            {isVisible && (
                                                <title>Click to delete connection between {source.name} and {dest.name}</title>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Draw selected draft line indicator */}
                                {startNode && endNode && (
                                    <line 
                                        x1={scaleX(startNode.xCoordinate)}
                                        y1={scaleY(startNode.yCoordinate)}
                                        x2={scaleX(endNode.xCoordinate)}
                                        y2={scaleY(endNode.yCoordinate)}
                                        stroke="#FB3640"
                                        strokeWidth="3.5"
                                        strokeDasharray="6 4"
                                    />
                                )}

                                {/* Draw room nodes */}
                                {locations.map(loc => {
                                    if (loc.xCoordinate === null || loc.yCoordinate === null) return null;

                                    const cx = scaleX(loc.xCoordinate);
                                    const cy = scaleY(loc.yCoordinate);
                                    const isStart = startNode && startNode.id === loc.id;
                                    const isEnd = endNode && endNode.id === loc.id;
                                    const isVisible = activeMapFloor === 'All' || loc.floor?.id === activeMapFloor;

                                    let fillCol = '#FFFFFF';
                                    let strokeCol = '#94A3B8';
                                    let radius = 7.5;

                                    if (isStart) {
                                        fillCol = '#22C55E';
                                        strokeCol = '#86EFAC';
                                        radius = 9.5;
                                    } else if (isEnd) {
                                        fillCol = '#FB3640';
                                        strokeCol = '#FECACA';
                                        radius = 9.5;
                                    }

                                    return (
                                        <g 
                                            key={loc.id} 
                                            onPointerDown={(e) => isVisible && handlePointerDown(e, loc)}
                                            onClick={() => isVisible && !draggedNode && handleMapNodeClick(loc)}
                                            className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                                isVisible ? 'opacity-100' : 'opacity-15'
                                            }`}
                                        >
                                            <circle cx={cx} cy={cy} r={radius + 3} fill="transparent" className="hover:fill-primary/5" />
                                            <circle cx={cx} cy={cy} r={radius} fill={fillCol} stroke={strokeCol} strokeWidth="2.5" />
                                            
                                            {isVisible && !isStart && !isEnd && (
                                                <text x={cx} y={cy - 11} textAnchor="middle" className="text-[10px] font-bold fill-primary/75 select-none pointer-events-none">
                                                    {loc.name}
                                                </text>
                                            )}

                                            {isVisible && (isStart || isEnd) && (
                                                <text x={cx} y={cy - 14} textAnchor="middle" className="text-[11px] font-black fill-primary select-none pointer-events-none">
                                                    {isStart ? 'Node A' : 'Node B'}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Seeding query generator columns */}
                    <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow border border-gray-100 flex flex-col space-y-5">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1.5"><Database className="text-accent" /> Edge SQL Generator</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Select two locations on the grid map to build SQL seeds</p>
                        </div>

                        {/* Selection summary */}
                        <div className="bg-gradient-to-br from-secondary to-secondary-dark/45 p-4 rounded-xl space-y-3 border border-gray-100 text-sm">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="text-gray-500 font-semibold">Start Location (A):</span>
                                <span className="font-bold text-primary">{startNode ? startNode.name : <span className="text-gray-400 italic">Select node</span>}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="text-gray-500 font-semibold">Target Location (B):</span>
                                <span className="font-bold text-accent">{endNode ? endNode.name : <span className="text-gray-400 italic">Select node</span>}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-semibold">Euclidean Distance:</span>
                                <span className="font-mono font-bold text-gray-800">{startNode && endNode ? `${calculateDistance(startNode, endNode)} units` : '--'}</span>
                            </div>
                        </div>

                        {/* Connection Creation action */}
                        {startNode && endNode ? (
                            <div className="space-y-3.5">
                                <button 
                                    onClick={handleCreateConnection}
                                    className="w-full bg-gradient-to-r from-accent to-accent-light text-white py-3 rounded-xl font-bold hover:bg-opacity-95 transition-all shadow-soft shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Path Connection
                                </button>
                                <button 
                                    onClick={() => { setStartNode(null); setEndNode(null); }}
                                    className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <div className="text-[10px] text-gray-400 leading-normal bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                                    <span>
                                        Clicking "Create Path Connection" will instantly save the link between these two nodes. You can delete connections by clicking their lines on the map.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                                <Compass className="w-10 h-10 text-gray-300 animate-spin" style={{ animationDuration: '4s' }} />
                                <h4 className="text-sm font-bold text-gray-500 mt-3">Select Nodes to Begin</h4>
                                <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-normal">Click a Start Node, then click another Target Node on the floor grid</p>
                            </div>
                        )}

                        {/* Route Tester */}
                        <div className="bg-gradient-to-br from-secondary to-secondary-dark/30 p-5 rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-primary" /> Route Tester
                            </h3>
                            <div className="space-y-3">
                                <select value={testRouteSource} onChange={e=>setTestRouteSource(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">Select Source...</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name} (Floor {l.floor?.floorName || '?'})</option>)}
                                </select>
                                <select value={testRouteDest} onChange={e=>setTestRouteDest(e.target.value)} className="w-full p-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">Select Destination...</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name} (Floor {l.floor?.floorName || '?'})</option>)}
                                </select>
                                <button onClick={handleTestRoute} className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-2 rounded-lg font-bold text-xs hover:bg-opacity-90 transition-colors">
                                    Simulate Pathfinding
                                </button>
                                
                                {testRouteResult && (
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                                        <p className="text-xs font-bold text-gray-800 mb-1">Resulting Path ({testRouteResult.totalDistance.toFixed(1)}m):</p>
                                        <div className="max-h-[150px] overflow-y-auto space-y-1">
                                            {testRouteResult.steps.map((step, idx) => (
                                                <div key={idx} className="text-[10px] text-gray-600 flex gap-2">
                                                    <span className="text-primary font-bold">{idx + 1}.</span> {step.instruction}
                                                </div>
                                            ))}
                                            {testRouteResult.steps.length === 0 && <span className="text-[10px] text-red-500">No valid path found.</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CONNECTIONS TABLE */}
                    <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow border border-gray-100 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                                <Database className="text-accent" /> Manage All Connections
                            </h3>
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by room name..." 
                                    value={connSearchTerm}
                                    onChange={(e) => setConnSearchTerm(e.target.value)}
                                    className="p-2 border rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Distance</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Accessible</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {connections.filter(c => {
                                        const term = connSearchTerm.toLowerCase();
                                        return c.sourceLocation.name.toLowerCase().includes(term) || 
                                               c.destinationLocation.name.toLowerCase().includes(term);
                                    }).map(conn => (
                                        <tr key={conn.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm text-gray-500">#{conn.id}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.sourceLocation.name}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.destinationLocation.name}</td>
                                            <td className="p-3.5 text-sm font-mono text-gray-600">{conn.distance.toFixed(1)}</td>
                                            <td className="p-3.5 text-sm">
                                                {conn.isAccessible ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">No</span>
                                                )}
                                            </td>
                                            <td className="p-3.5 flex items-center gap-2">
                                                <button onClick={() => setEditingConn(conn)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Connection">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDeleteConnection(conn.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Connection">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* Edit Location Modal */}
            {editingLoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-soft-lg w-full max-w-md border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                            <Edit className="text-accent"/> Edit Location
                        </h2>
                        <form onSubmit={handleEditLocation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Location Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingLoc.name} 
                                    onChange={e=>setEditingLoc({...editingLoc, name: e.target.value})} 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    value={editingLoc.description || ''} 
                                    onChange={e=>setEditingLoc({...editingLoc, description: e.target.value})} 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">X Coordinate</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={editingLoc.xCoordinate} 
                                        onChange={e=>setEditingLoc({...editingLoc, xCoordinate: parseInt(e.target.value) || 0})} 
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Y Coordinate</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={editingLoc.yCoordinate} 
                                        onChange={e=>setEditingLoc({...editingLoc, yCoordinate: parseInt(e.target.value) || 0})} 
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Floor</label>
                                <select 
                                    required 
                                    value={editingLoc.floor?.id || ''} 
                                    onChange={e=>setEditingLoc({...editingLoc, floor: { id: parseInt(e.target.value) }})} 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                >
                                    <option value="">Select Floor...</option>
                                    {floors.map(f => (
                                        <option key={f.id} value={f.id}>{f.building?.name} - {f.floorName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                                <select 
                                    required 
                                    value={editingLoc.type || 'ROOM'} 
                                    onChange={e=>setEditingLoc({...editingLoc, type: e.target.value})} 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                >
                                    <option value="ROOM">Room</option>
                                    <option value="CORRIDOR">Corridor</option>
                                    <option value="STAIRS">Stairs</option>
                                    <option value="ELEVATOR">Elevator</option>
                                    <option value="ENTRANCE">Entrance</option>
                                    <option value="EXIT">Exit</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingLoc(null)} 
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-gradient-to-r from-primary to-primary-light text-white py-2 rounded font-bold hover:bg-opacity-90 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* CONNECTIONS TABLE */}
                    <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow border border-gray-100 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1.5">
                                <Database className="text-accent" /> Manage All Connections
                            </h3>
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by room name..." 
                                    value={connSearchTerm}
                                    onChange={(e) => setConnSearchTerm(e.target.value)}
                                    className="p-2 border rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination Location</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Distance</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Accessible</th>
                                        <th className="p-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {connections.filter(c => {
                                        const term = connSearchTerm.toLowerCase();
                                        return c.sourceLocation.name.toLowerCase().includes(term) || 
                                               c.destinationLocation.name.toLowerCase().includes(term);
                                    }).map(conn => (
                                        <tr key={conn.id} className="border-b hover:bg-gray-50/55 transition-colors">
                                            <td className="p-3.5 text-sm text-gray-500">#{conn.id}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.sourceLocation.name}</td>
                                            <td className="p-3.5 text-sm font-bold text-gray-800">{conn.destinationLocation.name}</td>
                                            <td className="p-3.5 text-sm font-mono text-gray-600">{conn.distance.toFixed(1)}</td>
                                            <td className="p-3.5 text-sm">
                                                {conn.isAccessible ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Yes</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">No</span>
                                                )}
                                            </td>
                                            <td className="p-3.5 flex items-center gap-2">
                                                <button onClick={() => setEditingConn(conn)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Connection">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDeleteConnection(conn.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Connection">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* Edit Connection Modal */}
            {editingConn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-soft-lg w-full max-w-md border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                            <Edit className="text-accent"/> Edit Path Connection
                        </h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleEditConnection();
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Source Node</label>
                                <input type="text" disabled value={editingConn.sourceLocation.name} className="w-full p-2 border rounded bg-gray-50 text-gray-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Destination Node</label>
                                <input type="text" disabled value={editingConn.destinationLocation.name} className="w-full p-2 border rounded bg-gray-50 text-gray-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Distance (Calculated automatically on backend)</label>
                                <input type="number" step="0.1" disabled value={editingConn.distance} className="w-full p-2 border rounded bg-gray-50 text-gray-500 outline-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="accessible"
                                    checked={editingConn.isAccessible} 
                                    onChange={e=>setEditingConn({...editingConn, isAccessible: e.target.checked})} 
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" 
                                />
                                <label htmlFor="accessible" className="text-sm font-semibold text-gray-700">Wheelchair Accessible</label>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingConn(null)} 
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-gradient-to-r from-primary to-primary-light text-white py-2 rounded font-bold hover:bg-opacity-90 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
