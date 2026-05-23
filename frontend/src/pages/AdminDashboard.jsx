import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { MapPin, Layers, Users, Plus, Trash2, Edit, LogOut, X, Check, Building, Mail } from 'lucide-react';

const T = {
  900: '#1a4a4a',
  800: '#2a6b6b',
  600: '#3d8b8b',
  500: '#5aadad',
  300: '#8dd4d4',
  100: '#c4eaea',
  50:  '#eaf7f7',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Protection Redirect
  useEffect(() => {
    if (!token || role !== 'ROLE_ADMIN') {
      navigate('/admin/login');
    }
  }, [token, role, navigate]);

  // Tabs: 'rooms' | 'floors' | 'users'
  const [activeTab, setActiveTab] = useState('rooms');

  // Email Form State
  const [emailForm, setEmailForm] = useState({
    email: '',
    buildingId: '',
    start: '',
    destination: '',
  });
  const [sendingEmail, setSendingEmail] = useState(false);

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

      if (buildRes.data.length > 0) {
        setEmailForm(prev => ({ ...prev, buildingId: buildRes.data[0].id.toString() }));
      }

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
    const updated = [...users, newUser];
    localStorage.setItem('admin_users', JSON.stringify(updated));
    setUsers(updated);
    showToast('User added successfully!', 'success');
    setUserForm({ email: '', role: 'ROLE_USER' });
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id) => {
    if (id === 1) {
      showToast('Cannot delete default system administrator.', 'error');
      return;
    }
    if (!window.confirm('Delete this user account?')) return;
    const updated = users.filter(u => u.id !== id);
    localStorage.setItem('admin_users', JSON.stringify(updated));
    setUsers(updated);
    showToast('User deleted successfully.', 'success');
  };

  const handleSendEmailLink = async (e) => {
    e.preventDefault();
    if (!emailForm.email || !emailForm.buildingId || !emailForm.destination) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    setSendingEmail(true);
    try {
      const payload = {
        email: emailForm.email,
        buildingId: parseInt(emailForm.buildingId),
        destination: parseInt(emailForm.destination),
        start: emailForm.start ? parseInt(emailForm.start) : null,
      };
      
      await api.post('/admin/send-navigation-link', payload);
      showToast('Smart navigation link sent successfully!', 'success');
      setEmailForm(prev => ({ ...prev, email: '', start: '', destination: '' }));
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to send navigation link.';
      showToast(errMsg, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!token || role !== 'ROLE_ADMIN') {
    return null;
  }

  return (
    <div className="admin-container" style={{
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        .admin-table {
          min-width: 600px !important;
        }
        @media (max-width: 768px) {
          .admin-container {
            flex-direction: column !important;
          }
          .admin-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 0.5px solid ${T[800]} !important;
          }
          .admin-sidebar > div:first-child {
            padding: 16px 24px !important;
          }
          .admin-nav {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            padding: 12px 24px !important;
            gap: 8px !important;
          }
          .admin-nav button {
            width: auto !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
          }
          .admin-sidebar-footer {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 16px 24px !important;
            border-top: 0.5px solid ${T[800]} !important;
          }
          .admin-sidebar-footer > div {
            flex-direction: row !important;
            gap: 8px !important;
          }
          .admin-sidebar-footer button {
            width: auto !important;
            padding: 6px 12px !important;
            margin-top: 0 !important;
          }
          .admin-main {
            padding: 24px !important;
          }
        }
        @media (max-width: 375px) {
          .admin-sidebar-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .admin-sidebar-footer > div {
            flex-direction: column !important;
            gap: 2px !important;
          }
          .admin-main {
            padding: 16px 12px !important;
          }
          .admin-main h2 {
            font-size: 18px !important;
          }
        }
      `}</style>
      
      {/* ΓöÇΓöÇ SIDEBAR ΓöÇΓöÇ */}
      <aside className="admin-sidebar" style={{
        width: '240px',
        backgroundColor: T[900],
        borderRight: `0.5px solid ${T[800]}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Title */}
        <div style={{
          padding: '24px',
          borderBottom: `0.5px solid ${T[800]}`,
        }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            margin: 0,
            textTransform: 'uppercase',
          }}>
            Indoor Nav Console
          </h1>
        </div>

        {/* Navigation links */}
        <nav className="admin-nav" style={{ flexGrow: 1, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'rooms', label: 'Rooms', icon: MapPin },
            { id: 'floors', label: 'Floors', icon: Layers },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'smart-nav', label: 'Send Link', icon: Mail },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsModalOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: isActive ? T[800] : 'transparent',
                  color: isActive ? T[50] : T[300],
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = T[50];
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = T[300];
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className="admin-sidebar-footer" style={{
          padding: '24px',
          borderTop: `0.5px solid ${T[800]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Administrator
            </span>
            <span style={{ color: T[300], fontSize: '11px', fontWeight: 400 }}>
              {localStorage.getItem('email') || 'admin@example.com'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              backgroundColor: 'transparent',
              border: `0.5px solid ${T[300]}`,
              color: T[300],
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = T[300];
              e.currentTarget.style.borderColor = T[300];
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ΓöÇΓöÇ MAIN CONTENT AREA ΓöÇΓöÇ */}
      <main className="admin-main" style={{
        flexGrow: 1,
        backgroundColor: '#ffffff',
        padding: '40px',
        overflowY: 'auto',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontSize: '13px', color: T[800], fontWeight: 400 }}>Loading control console data...</span>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: `0.5px solid ${T[100]}`, paddingBottom: '20px' }}>
              <div>
                <h2 style={{ color: T[900], fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>
                  {activeTab === 'rooms' ? 'Rooms Directory' : activeTab === 'floors' ? 'Building Floors' : activeTab === 'users' ? 'Administrators' : 'Send Smart Navigation'}
                </h2>
                <p style={{ color: T[800], fontSize: '13px', fontWeight: 400, marginTop: '4px', margin: 0 }}>
                  {activeTab === 'rooms' ? 'Create, modify coordinates, and manage live availability statuses of campus rooms.'
                    : activeTab === 'floors' ? 'Configure structures, building links, and map floor indices.'
                    : activeTab === 'users' ? 'Manage role authorizations and admin account emails.'
                    : 'Dispatch secure temporal navigation links directly to user inbox.'}
                </p>
              </div>

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

            {/* TAB PANELS */}
            
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
                              X: {room.xcoordinate ?? room.xCoordinate} ┬╖ Y: {room.ycoordinate ?? room.yCoordinate}
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
                                <button
                                  onClick={() => handleDeleteRoom(room.id)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: `0.5px solid #fecaca`,
                                    color: '#b91c1c',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="Delete Room"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 2. FLOORS TABLE */}
            {activeTab === 'floors' && (
              <div style={{ overflowX: 'auto' }}>
                {floors.length === 0 ? (
                  <div style={{ border: `0.5px solid ${T[100]}`, padding: '40px', textAlign: 'center', fontSize: '13px', color: T[800] }}>
                    No building floors configured. Click Add Floor to structure campus maps.
                  </div>
                ) : (
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: T[50], borderBottom: `0.5px solid ${T[300]}` }}>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Building Name</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Floor Descriptor</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Floor Index</th>
                        <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800], textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floors.map(floor => (
                        <tr key={floor.id} style={{ borderBottom: `0.5px solid ${T[100]}` }}>
                          <td style={{ padding: '16px', fontSize: '13px', fontWeight: 500, color: T[900] }}>
                            {floor.building?.name || 'Building'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', fontWeight: 400, color: T[900] }}>
                            {floor.floorName}
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', fontWeight: 400, color: T[800], fontFamily: 'monospace' }}>
                            {floor.floorNumber}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteFloor(floor.id)}
                              style={{
                                backgroundColor: 'transparent',
                                border: `0.5px solid #fecaca`,
                                color: '#b91c1c',
                                borderRadius: '4px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete Floor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 3. USERS TABLE */}
            {activeTab === 'users' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: T[50], borderBottom: `0.5px solid ${T[300]}` }}>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Account Email</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800] }}>Authorized Role</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', color: T[800], textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{ borderBottom: `0.5px solid ${T[100]}` }}>
                        <td style={{ padding: '16px', fontSize: '13px', fontWeight: 500, color: T[900] }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            backgroundColor: user.role === 'ROLE_ADMIN' ? T[900] : T[50],
                            color: user.role === 'ROLE_ADMIN' ? '#ffffff' : T[800],
                            border: `0.5px solid ${user.role === 'ROLE_ADMIN' ? T[900] : T[100]}`,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === 1}
                            style={{
                              backgroundColor: 'transparent',
                              border: user.id === 1 ? '0.5px solid #e0e0e0' : '0.5px solid #fecaca',
                              color: user.id === 1 ? '#cccccc' : '#b91c1c',
                              borderRadius: '4px',
                              padding: '6px',
                              cursor: user.id === 1 ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Delete User"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. SEND SMART LINK PANEL */}
            {activeTab === 'smart-nav' && (
              <div style={{ maxWidth: '500px', border: `0.5px solid ${T[100]}`, padding: '32px', borderRadius: '4px' }}>
                <form onSubmit={handleSendEmailLink} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="userNavEmail" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Recipient Email Address</label>
                    <input
                      id="userNavEmail"
                      type="email"
                      required
                      value={emailForm.email}
                      onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                      placeholder="user@example.com"
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '10px 14px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="navBuilding" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Target Building</label>
                    <select
                      id="navBuilding"
                      required
                      value={emailForm.buildingId}
                      onChange={e => setEmailForm({ ...emailForm, buildingId: e.target.value, start: '', destination: '' })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '10px 14px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="">Select Building...</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="navStart" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Start Location (Optional)</label>
                    <select
                      id="navStart"
                      value={emailForm.start}
                      onChange={e => setEmailForm({ ...emailForm, start: e.target.value })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '10px 14px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="">Default Building Entrance Node</option>
                      {locations
                        .filter(loc => loc.floor?.building?.id === parseInt(emailForm.buildingId) && loc.nodeId !== null)
                        .map(loc => (
                          <option key={loc.id} value={loc.nodeId}>{loc.name} (Floor {loc.floor?.floorName})</option>
                        ))
                      }
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="navDest" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Destination Location</label>
                    <select
                      id="navDest"
                      required
                      value={emailForm.destination}
                      onChange={e => setEmailForm({ ...emailForm, destination: e.target.value })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '10px 14px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="">Select Destination Room...</option>
                      {locations
                        .filter(loc => loc.floor?.building?.id === parseInt(emailForm.buildingId) && loc.nodeId !== null)
                        .map(loc => (
                          <option key={loc.id} value={loc.nodeId}>{loc.name} (Floor {loc.floor?.floorName})</option>
                        ))
                      }
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    style={{
                      backgroundColor: T[600],
                      color: '#ffffff',
                      border: `0.5px solid ${T[800]}`,
                      borderRadius: '4px',
                      padding: '12px 24px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: sendingEmail ? 'not-allowed' : 'pointer',
                      opacity: sendingEmail ? 0.7 : 1,
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { if (!sendingEmail) e.currentTarget.style.backgroundColor = T[800]; }}
                    onMouseLeave={e => { if (!sendingEmail) e.currentTarget.style.backgroundColor = T[600]; }}
                  >
                    {sendingEmail ? 'Generating & Dispatching...' : 'Dispatch Smart Link'}
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </main>

      {/* ΓöÇΓöÇ FLAT MODAL DRAWER ΓöÇΓöÇ */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26, 74, 74, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: `0.5px solid ${T[300]}`,
            borderRadius: '4px',
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            boxShadow: 'none',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: T[900], fontSize: '16px', fontWeight: 500, margin: 0 }}>
                {activeTab === 'rooms' ? (modalMode === 'add' ? 'Add Room Location' : 'Edit Room Details')
                  : activeTab === 'floors' ? 'Add Building Floor' : 'Create Admin User'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: T[600] }}
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM BODY FOR ROOMS */}
            {activeTab === 'rooms' && (
              <form onSubmit={handleRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="roomName" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Room Name</label>
                  <input
                    id="roomName"
                    type="text"
                    required
                    value={roomForm.name}
                    onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="e.g. Lab 102"
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="roomDesc" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Description</label>
                  <input
                    id="roomDesc"
                    type="text"
                    value={roomForm.description}
                    onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
                    placeholder="e.g. Physics Department Lab"
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="roomFloor" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Floor Assignment</label>
                    <select
                      id="roomFloor"
                      required
                      value={roomForm.floorId}
                      onChange={e => setRoomForm({ ...roomForm, floorId: e.target.value })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      {floors.map(fl => (
                        <option key={fl.id} value={fl.id}>{fl.building?.name} - {fl.floorName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="roomStatus" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Availability Status</label>
                    <select
                      id="roomStatus"
                      required
                      value={roomForm.status}
                      onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="roomX" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>X Grid Position</label>
                    <input
                      id="roomX"
                      type="number"
                      required
                      value={roomForm.xCoordinate}
                      onChange={e => setRoomForm({ ...roomForm, xCoordinate: e.target.value })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="roomY" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Y Grid Position</label>
                    <input
                      id="roomY"
                      type="number"
                      required
                      value={roomForm.yCoordinate}
                      onChange={e => setRoomForm({ ...roomForm, yCoordinate: e.target.value })}
                      style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ backgroundColor: 'transparent', border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 16px', fontSize: '13px', color: T[800], cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: T[600], border: `0.5px solid ${T[800]}`, borderRadius: '4px', padding: '8px 16px', fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* FORM BODY FOR FLOORS */}
            {activeTab === 'floors' && (
              <form onSubmit={handleFloorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="floorBuilding" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Building Link</label>
                  <select
                    id="floorBuilding"
                    required
                    value={floorForm.buildingId}
                    onChange={e => setFloorForm({ ...floorForm, buildingId: e.target.value })}
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Select Building...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="floorName" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Floor Name</label>
                  <input
                    id="floorName"
                    type="text"
                    required
                    value={floorForm.floorName}
                    onChange={e => setFloorForm({ ...floorForm, floorName: e.target.value })}
                    placeholder="e.g. Ground Floor"
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="floorNum" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Floor Index Number</label>
                  <input
                    id="floorNum"
                    type="number"
                    required
                    value={floorForm.floorNumber}
                    onChange={e => setFloorForm({ ...floorForm, floorNumber: e.target.value })}
                    placeholder="e.g. 0, 1, 2"
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ backgroundColor: 'transparent', border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 16px', fontSize: '13px', color: T[800], cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: T[600], border: `0.5px solid ${T[800]}`, borderRadius: '4px', padding: '8px 16px', fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}
                  >
                    Save Floor
                  </button>
                </div>
              </form>
            )}

            {/* FORM BODY FOR USERS */}
            {activeTab === 'users' && (
              <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="userEmail" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>User Email Address</label>
                  <input
                    id="userEmail"
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="e.g. admin-sec@example.com"
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="userRole" style={{ fontSize: '11px', fontWeight: 500, color: T[800], textTransform: 'uppercase' }}>Authorized Role</label>
                  <select
                    id="userRole"
                    required
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 12px', fontSize: '13px', fontWeight: 400, outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="ROLE_USER">ROLE_USER</option>
                    <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ backgroundColor: 'transparent', border: `0.5px solid ${T[300]}`, borderRadius: '4px', padding: '8px 16px', fontSize: '13px', color: T[800], cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: T[600], border: `0.5px solid ${T[800]}`, borderRadius: '4px', padding: '8px 16px', fontSize: '13px', color: '#ffffff', cursor: 'pointer' }}
                  >
                    Add User Account
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
