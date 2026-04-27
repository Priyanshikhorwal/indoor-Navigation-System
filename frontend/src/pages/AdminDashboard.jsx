import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Plus, Trash2, Edit } from 'lucide-react';

const AdminDashboard = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLoc, setNewLoc] = useState({ name: '', description: '', xCoordinate: '', yCoordinate: '', floor: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await api.get('/locations');
            setLocations(res.data);
        } catch (err) {
            setError('Failed to fetch locations');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLocation = async (e) => {
        e.preventDefault();
        try {
            await api.post('/locations', newLoc);
            setSuccess('Location added successfully!');
            setNewLoc({ name: '', description: '', xCoordinate: '', yCoordinate: '', floor: '' });
            fetchLocations();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to add location');
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/locations/${id}`);
            fetchLocations();
        } catch (err) {
            setError('Failed to delete. May have connected paths.');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>
            
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Location Form */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 lg:col-span-1">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-accent"/> Add Location</h2>
                    <form onSubmit={handleAddLocation} className="space-y-4">
                        <input type="text" placeholder="Location Name" required value={newLoc.name} onChange={e=>setNewLoc({...newLoc, name: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="Description" value={newLoc.description} onChange={e=>setNewLoc({...newLoc, description: e.target.value})} className="w-full p-2 border rounded" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="X Coord" required value={newLoc.xCoordinate} onChange={e=>setNewLoc({...newLoc, xCoordinate: e.target.value})} className="w-full p-2 border rounded" />
                            <input type="number" placeholder="Y Coord" required value={newLoc.yCoordinate} onChange={e=>setNewLoc({...newLoc, yCoordinate: e.target.value})} className="w-full p-2 border rounded" />
                        </div>
                        <input type="text" placeholder="Floor (e.g. Ground, 1st)" value={newLoc.floor} onChange={e=>setNewLoc({...newLoc, floor: e.target.value})} className="w-full p-2 border rounded" />
                        <button type="submit" className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-opacity-90">Save Location</button>
                    </form>
                </div>

                {/* Location List */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Manage Locations</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Coords (X,Y)</th>
                                    <th className="p-3">Floor</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map(loc => (
                                    <tr key={loc.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">{loc.id}</td>
                                        <td className="p-3 font-semibold">{loc.name}</td>
                                        <td className="p-3">{loc.xCoordinate}, {loc.yCoordinate}</td>
                                        <td className="p-3">{loc.floor}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleDelete(loc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {locations.length === 0 && <p className="text-center py-6 text-gray-500">No locations found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
