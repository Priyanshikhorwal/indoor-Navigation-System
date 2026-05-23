import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Plus, Trash2, Edit, Compass, Database, Check, Copy, AlertCircle, Sparkles, MapPin } from 'lucide-react';

const AdminDashboard = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('locations'); // 'locations' or 'connections'
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Add location form state
    const [newLoc, setNewLoc] = useState({ name: '', description: '', xCoordinate: '', yCoordinate: '', floor: '' });
    
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

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

  // Data states
  const [locations, setLocations] = useState([]);
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  
  // Room form payload
  const [roomForm, setRoomForm] = useState({
    id: '',
    name: '',
    floorId: '',
    status: 'Available',
    description: '',
    xCoordinate: '1',
    yCoordinate: '1',
  });

  // Floor form payload
  const [floorForm, setFloorForm] = useState({
    floorName: '',
    floorNumber: '',
    buildingId: '',
  });

  // User form payload
  const [userForm, setUserForm] = useState({
    email: '',
    role: 'ROLE_USER',
  });

  // Initialize data
  useEffect(() => {
    if (token && role === 'ROLE_ADMIN') {
      fetchData();
    }
  }, [token, role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, nodesRes, floorRes, buildRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/nodes'),
        api.get('/floors'),
        api.get('/buildings'),
      ]);

      const roomsData = roomsRes.data.map(room => {
        const matchingNode = nodesRes.data.find(node => node.room && node.room.id === room.id);
        return {
          ...room,
          xCoordinate: matchingNode ? matchingNode.xCoordinate : '',
          yCoordinate: matchingNode ? matchingNode.yCoordinate : '',
          nodeId: matchingNode ? matchingNode.id : null
        };
      });

      setLocations(roomsData);
      setFloors(floorRes.data);
      setBuildings(buildRes.data);

      // Load or initialize mock users in localStorage
      const savedUsers = localStorage.getItem('admin_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        const initialUsers = [
          { id: 1, email: 'admin@example.com', role: 'ROLE_ADMIN' },
          { id: 2, email: 'visitor@example.com', role: 'ROLE_USER' },
        ];
        localStorage.setItem('admin_users', JSON.stringify(initialUsers));
        setUsers(initialUsers);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch system data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/admin/login');
  };

  // Get dynamic room status from localStorage (synced with Home navigation mapping)
  const getRoomStatus = (loc) => {
    const saved = localStorage.getItem(`room_status_${loc.id}`);
    if (saved) return saved;
    return loc.id % 3 === 0 ? 'Occupied' : 'Available';
  };

  const updateRoomStatus = (id, status) => {
    localStorage.setItem(`room_status_${id}`, status);
  };

  // ROOM actions
  const openAddRoom = () => {
    setModalMode('add');
    setRoomForm({
      id: '',
      name: '',
      floorId: floors[0]?.id || '',
      status: 'Available',
      description: '',
      xCoordinate: '1',
      yCoordinate: '1',
    });
    setIsModalOpen(true);
  };

  const openEditRoom = (room) => {
    setModalMode('edit');
    setRoomForm({
      id: room.id,
      name: room.name,
      floorId: room.floor?.id || '',
      status: getRoomStatus(room),
      description: room.description || '',
      xCoordinate: room.xcoordinate ?? room.xCoordinate ?? '1',
      yCoordinate: room.ycoordinate ?? room.yCoordinate ?? '1',
    });
    setIsModalOpen(true);
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomPayload = {
        name: roomForm.name,
        description: roomForm.description,
        type: 'ROOM',
        floor: roomForm.floorId ? { id: parseInt(roomForm.floorId) } : null,
      };

      if (modalMode === 'add') {
        const res = await api.post('/rooms', roomPayload);
        const createdRoom = res.data;
        updateRoomStatus(createdRoom.id, roomForm.status);

        // Create matching Node coordinate mapping
        const nodePayload = {
          xCoordinate: parseInt(roomForm.xCoordinate),
          yCoordinate: parseInt(roomForm.yCoordinate),
          floor: roomForm.floorId ? { id: parseInt(roomForm.floorId) } : null,
          room: { id: createdRoom.id }
        };
        await api.post('/nodes', nodePayload);
        showToast('Room added successfully!', 'success');
      } else {
        const res = await api.put(`/rooms/${roomForm.id}`, { ...roomPayload, id: roomForm.id });
        const updatedRoom = res.data;
        updateRoomStatus(roomForm.id, roomForm.status);

        // Find existing nodeId to update
        const currentRoom = locations.find(r => r.id === roomForm.id);
        const nodePayload = {
          xCoordinate: parseInt(roomForm.xCoordinate),
          yCoordinate: parseInt(roomForm.yCoordinate),
          floor: roomForm.floorId ? { id: parseInt(roomForm.floorId) } : null,
          room: { id: updatedRoom.id }
        };

        if (currentRoom && currentRoom.nodeId) {
          await api.put(`/nodes/${currentRoom.nodeId}`, { ...nodePayload, id: currentRoom.nodeId });
        } else {
          await api.post('/nodes', nodePayload);
        }
        showToast('Room updated successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save room details.', 'error');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const currentRoom = locations.find(r => r.id === id);
      if (currentRoom && currentRoom.nodeId) {
        await api.delete(`/nodes/${currentRoom.nodeId}`);
      }
      await api.delete(`/rooms/${id}`);
      localStorage.removeItem(`room_status_${id}`);
      showToast('Room deleted successfully.', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete room. It might be linked to routing paths.', 'error');
    }
  };

  // FLOOR actions
  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        floorName: floorForm.floorName,
        floorNumber: parseInt(floorForm.floorNumber),
        building: floorForm.buildingId ? { id: parseInt(floorForm.buildingId) } : null,
      };

      await api.post('/floors', payload);
      showToast('Floor added successfully!', 'success');
      setFloorForm({ floorName: '', floorNumber: '', buildingId: '' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add floor.', 'error');
    }
  };

  const handleDeleteFloor = async (id) => {
    if (!window.confirm('Delete this floor? All linked locations might be impacted.')) return;
    try {
      await api.delete(`/floors/${id}`);
      showToast('Floor deleted successfully.', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete floor.', 'error');
    }
  };

  // USER actions (Mocked in localStorage for full admin capabilities)
  const handleUserSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: Date.now(),
      email: userForm.email,
      role: userForm.role,
    };

    const handleAddLocation = async (e) => {
        e.preventDefault();
        try {
            await api.post('/locations', newLoc);
            setSuccess('Location added successfully!');
            setNewLoc({ name: '', description: '', xCoordinate: '', yCoordinate: '', floor: '' });
            setShowAddForm(false);
            fetchLocations();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to add location');
        }
    };

    const handleEditLocation = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/locations/${editingLoc.id}`, editingLoc);
            setSuccess('Location updated successfully!');
            setEditingLoc(null);
            fetchLocations();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update location');
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
                setError('A path connection cannot connect a room to itself.');
                setTimeout(() => setError(''), 3000);
                return;
            }
            setEndNode(loc);
        }
    };

    const handleCopySql = (sqlText) => {
        navigator.clipboard.writeText(sqlText);
        setSqlCopySuccess(true);
        setTimeout(() => setSqlCopySuccess(false), 2000);
    };

    // Coordinate scale reversals for drag-and-drop mapper
    const reverseScaleX = (rx) => {
        const range = maxX - minX || 1;
        const val = minX + ((rx - padding) / (svgWidth - 2 * padding)) * range;
        return Math.round(val);
    };

              {/* Add Trigger Buttons */}
              <div>
                {activeTab === 'rooms' && (
                  <button
                    onClick={openAddRoom}
                    style={{
                      backgroundColor: T[600],
                      color: '#ffffff',
                      border: `0.5px solid ${T[800]}`,
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = T[800]}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = T[600]}
                  >
                    <Plus size={15} />
                    <span>Add Room</span>
                  </button>
                )}
                {activeTab === 'floors' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setModalMode('add'); setIsModalOpen(true); }}
                      style={{
                        backgroundColor: T[600],
                        color: '#ffffff',
                        border: `0.5px solid ${T[800]}`,
                        borderRadius: '4px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = T[800]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = T[600]}
                    >
                      <Plus size={15} />
                      <span>Add Floor</span>
                    </button>
                  </div>
                )}
                {activeTab === 'users' && (
                  <button
                    onClick={() => { setModalMode('add'); setIsModalOpen(true); }}
                    style={{
                      backgroundColor: T[600],
                      color: '#ffffff',
                      border: `0.5px solid ${T[800]}`,
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = T[800]}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = T[600]}
                  >
                    <Plus size={15} />
                    <span>Add User</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* 1. ROOMS TABLE */}
            {activeTab === 'rooms' && (
              <div style={{ overflowX: 'auto' }}>
                {locations.length === 0 ? (
                  <div style={{ border: `0.5px solid ${T[100]}`, padding: '40px', textAlign: 'center', fontSize: '13px', color: T[800] }}>
                    No rooms discovered in system database. Click Add Room to insert one.
                  </div>
                ) : (
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: T[50], borderBottom: `0.5px solid ${T[300]}` }}>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Room Name</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Floor Plan</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Coordinates</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Current Status</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800], textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map(room => {
                        const status = getRoomStatus(room);
                        return (
                          <tr key={room.id} style={{ borderBottom: `0.5px solid ${T[100]}` }}>
                            <td style={{ padding: '16px', fontSize: '13px', fontWeight: 500, color: T[900] }}>
                              <div>{room.name}</div>
                              {room.description && <div style={{ fontSize: '11px', fontWeight: 400, color: T[600], marginTop: '2px' }}>{room.description}</div>}
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', fontWeight: 400, color: T[900] }}>
                              {room.floor ? `${room.floor.building?.name || 'Building'} - ${room.floor.floorName}` : 'No Floor Assigned'}
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', fontWeight: 400, color: T[800], fontFamily: 'monospace' }}>
                              X: {room.xcoordinate ?? room.xCoordinate} · Y: {room.ycoordinate ?? room.yCoordinate}
                            </td>
                            <td style={{ padding: '16px' }}>
                              {status === 'Available' ? (
                                <span style={{ backgroundColor: T[50], color: T[600], border: `0.5px solid ${T[100]}`, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
                                  Available
                                </span>
                              ) : (
                                <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '0.5px solid #fecaca', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
                                  Occupied
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => openEditRoom(room)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: `0.5px solid ${T[300]}`,
                                    color: T[800],
                                    borderRadius: '4px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="Edit Room"
                                >
                                  <Edit size={13} />
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
                                    {uniqueFloors.map(floor => (
                                        <option key={floor} value={floor}>{floor}</option>
                                    ))}
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
                                            <td className="p-3.5 text-sm">{loc.floor || <span className="text-gray-300 italic">None</span>}</td>
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
                            <div className="flex flex-wrap gap-1.5 bg-secondary p-1 rounded-xl">
                                {['All', ...uniqueFloors].map(floor => (
                                    <button
                                        key={floor}
                                        onClick={() => setActiveMapFloor(floor)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            activeMapFloor === floor
                                                ? 'bg-primary text-white'
                                                : 'text-primary/70 hover:text-primary hover:bg-white/50'
                                        }`}
                                    >
                                        {floor === 'All' ? 'All Floors' : `Floor ${floor}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Blueprint overlay controls */}
                        <div className="bg-secondary/40 p-3 rounded-xl border border-gray-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
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
                                    const isVisible = activeMapFloor === 'All' || loc.floor === activeMapFloor;

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
                        <div className="bg-secondary/45 p-4 rounded-xl space-y-3 border border-gray-100 text-sm">
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
                                <span className="font-mono font-bold text-gray-800">{startNode && endNode ? `${calculatedWeight} units` : '--'}</span>
                            </div>
                        </div>

                        {/* Generated SQL script area */}
                        {startNode && endNode ? (
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" /> Auto Seeding SQL Script
                                    </label>
                                    <button 
                                        onClick={() => handleCopySql(generatedSql)}
                                        className="text-xs font-bold text-primary hover:text-opacity-80 flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg transition-all"
                                    >
                                        {sqlCopySuccess ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy SQL
                                            </>
                                        )}
                                    </button>
                                </div>
                                <textarea 
                                    readOnly 
                                    value={generatedSql} 
                                    rows="5"
                                    className="w-full p-3 font-mono text-xs bg-gray-900 text-green-400 border rounded-xl outline-none focus:ring-1 focus:ring-primary select-all leading-normal"
                                />
                                <div className="text-[10px] text-gray-400 leading-normal bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                                    <span>
                                        Execute the query above inside your PostgreSQL terminal (or seed SQL script) to link the rooms!
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
                    </div>
                </div>
            )}

            {/* Edit Location Modal */}
            {editingLoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 animate-in fade-in zoom-in duration-200">
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
                                <input 
                                    type="text" 
                                    value={editingLoc.floor || ''} 
                                    onChange={e=>setEditingLoc({...editingLoc, floor: e.target.value})} 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                />
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
                                    className="flex-1 bg-primary text-white py-2 rounded font-bold hover:bg-opacity-90 transition-colors"
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
