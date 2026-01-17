import React, { useState } from 'react';
import api from '../api';
import '../App.css';



const Sidebar = ({ subjects, groups = [], onRefresh, onNoteSelect, activeNote, onAddSubject, currentUser }) => {
    const [expandedFolders, setExpandedFolders] = useState({});
    const [newSubjectName, setNewSubjectName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sharingNoteId, setSharingNoteId] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    //const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [isJoining, setIsJoining] = useState(false); // Toggle between Create/Join UI

    // NEW STATES FOR INLINE EDITING
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [tempName, setTempName] = useState("");
    const [visibleCodeId, setVisibleCodeId] = useState(null);

    const [addingNoteToGroupId, setAddingNoteToGroupId] = useState(null);
    const [newNoteTitle, setNewNoteTitle] = useState("");


    // --- SEARCH FILTERING LOGIC ---
    const filteredSubjects = (subjects || []).map(subject => {
        const query = searchTerm.toLowerCase();
        const subjectNameMatches = (subject.name || '').toLowerCase().includes(query);

        // Safety check: ensure subject.Notes exists before filtering
        const notesArray = subject.Notes || [];

        const filteredNotes = notesArray.filter(note => {
            if (subjectNameMatches) return true;
            const noteTitle = (note.title || '').toLowerCase();
            const noteContent = (note.content || '').toLowerCase();
            const noteDate = note.createdAt ? new Date(note.createdAt).toLocaleDateString().toLowerCase() : '';
            return noteTitle.includes(query) || noteContent.includes(query) || noteDate.includes(query);
        });

        return { ...subject, Notes: filteredNotes };
    }).filter(subject => {
        const query = searchTerm.toLowerCase();
        // Return subject if it has notes OR if the name matches the search
        return (subject.Notes && subject.Notes.length > 0) || (subject.name || '').toLowerCase().includes(query);
    });

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;

        // 1. Tell the Dashboard to add it to the UI immediately
        onAddSubject(newSubjectName);

        // 2. Clear the input box immediately
        setNewSubjectName('');

        // Notice: No onRefresh() here! The Dashboard handles the update.
    };

    const toggleFolder = (id) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };



    // --- NEW INLINE SUBMIT HANDLERS ---
    const handleSubjectRenameSubmit = async (id) => {
        const finalName = tempName.trim() || "Untitled Subject";
        try {
            await api.put(`/api/subjects/${id}`, { name: finalName }, { withCredentials: true });
            setEditingSubjectId(null);
            onRefresh(true);
        } catch (err) { console.error("Error renaming subject", err); }
    };



    const handleDeleteSubject = async (id) => {
        if (window.confirm("Are you sure? This will delete all notes in this subject!")) {
            try {
                await api.delete(`/api/subjects/${id}`, { withCredentials: true });
                onRefresh(true);
            } catch (err) { console.error("Error deleting subject", err); }
        }
    };

    const handleAddNote = async (subjectId) => {
        try {
            const res = await api.post('/api/notes',
                { title: 'New Note', subjectId: subjectId },
                { withCredentials: true });

            setExpandedFolders(prev => ({
                ...prev,
                [subjectId]: true
            }));
            await onRefresh(true);
            onNoteSelect(res.data);
            // Automatically start editing the new note's title
            setTempName('New Note');
            setEditingNoteId(res.data.id);

        } catch (err) { console.error("Error creating note", err); }
    };

    const handleNoteRenameSubmit = async (id) => {
        const finalTitle = tempName.trim() || "Untitled Note";
        try {
            await api.put(`/api/notes/${id}`,
                { title: finalTitle },
                { withCredentials: true });
            if (activeNote && activeNote.id === id) {
                onNoteSelect({ ...activeNote, title: finalTitle });
            }

            setEditingNoteId(null);
            onRefresh(true);
        } catch (err) { console.error("Error renaming note", err); }
    };

    const handleDeleteNote = async (id) => {
        if (window.confirm("Delete this note?")) {
            try {
                await api.delete(`/api/notes/${id}`, { withCredentials: true });
                onRefresh(true);
            } catch (err) { console.error("Error deleting note", err); }
        }
    };

    const handleShareSubmit = async (noteId) => {
        if (!shareEmail.includes('@')) {
            alert("Please enter a valid email");
            return;
        }
        try {
            await api.post('/api/share/share-note', {
                noteId: noteId,
                colleagueEmail: shareEmail
            }, { withCredentials: true });

            alert("Note shared successfully!");
            setSharingNoteId(null);
            setShareEmail('');
        } catch (err) {
            alert(err.response?.data?.message || "User not found or error sharing");
        }
    };

    // Function 1: Create a new Study Group
    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        try {
            await api.post('/api/groups/create',
                { name: newGroupName },
                { withCredentials: true }
            );
            setNewGroupName(''); // Clear input
            onRefresh(true);        // Refresh Dashboard data
        } catch (err) {
            alert("Error creating group");
        }
    };

    // Function 2: Join an existing group with a code
    const handleJoinGroup = async () => {
        if (!inviteCodeInput) return;
        try {
            await api.post('/api/groups/join',
                { inviteCode: inviteCodeInput },
                { withCredentials: true }
            );
            setInviteCodeInput('');
            setIsJoining(false); // Switch back to "Create" view
            onRefresh(true);
        } catch (err) {
            alert(err.response?.data?.message || "Could not join group");
        }
    };

    // Trigger the inline naming field
    const triggerAddGroupNote = (groupId) => {
        setAddingNoteToGroupId(groupId);
        setNewNoteTitle("");
    };

    // Actually send the new note to the database
    const submitGroupNote = async (groupId) => {
        const title = newNoteTitle.trim();
        if (!title) {
            setAddingNoteToGroupId(null);
            return;
        }

        try {
            const res = await api.post('/api/notes', {
                title: title,
                groupId: groupId
            }, { withCredentials: true });

            setAddingNoteToGroupId(null);
            setNewNoteTitle("");

            // Refresh so it appears, then select the new note automatically
            await onRefresh(true);
            onNoteSelect(res.data);

            // Optional: If you want to immediately rename it further like subjects do:
            // setTempName(title);
            // setEditingNoteId(res.data.id);

        } catch (err) {
            console.error("Error creating group note", err);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (window.confirm("Are you sure? This will delete the group and all its shared notes for everyone.")) {
            try {
                await api.delete(`/api/groups/${groupId}`, { withCredentials: true });
                onRefresh(true); // Silent refresh to update the sidebar instantly
            } catch (err) {
                console.error("Error deleting group:", err);
                alert("Could not delete group.");
            }
        }
    };

    return (
        <div className="sidebar-content" style={{ padding: '15px' }}>
            <h3>My Subjects</h3>
            <div style={{ marginBottom: '15px' }}>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
                <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="New Subject..." style={{ width: '70%', padding: '5px' }} />
                <button onClick={handleAddSubject} style={{ padding: '5px 10px' }}>+</button>
            </div>
            <hr />

            {filteredSubjects.map(subject => (
                <div key={subject.id} style={{ marginBottom: '10px' }}>
                    <div className="subject-header-row" style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }} onClick={() => toggleFolder(subject.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <span>{expandedFolders[subject.id] || searchTerm ? '📂' : '📁'} </span>
                            {editingSubjectId === subject.id ? (
                                <input
                                    autoFocus
                                    className="rename-input"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    //onClick={(e) => e.stopPropagation()}
                                    onBlur={() => handleSubjectRenameSubmit(subject.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubjectRenameSubmit(subject.id)}
                                    style={{ marginLeft: '5px', width: '80%' }}
                                />
                            ) : (
                                <span style={{ marginLeft: '5px' }}>{subject.name}</span>
                            )}
                        </div>
                        <div className="subject-actions">
                            <button onClick={(e) => { e.stopPropagation(); setEditingSubjectId(subject.id); setTempName(subject.name); }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}>🗑️</button>
                            <button className="add-note-btn" onClick={(e) => { e.stopPropagation(); handleAddNote(subject.id); }}>+ Note</button>
                        </div>
                    </div>

                    {(expandedFolders[subject.id] || searchTerm) && (
                        <div style={{ marginLeft: '20px', marginTop: '5px' }}>
                            {subject.Notes.map(note => (
                                <div key={note.id}
                                    className="note-item-wrapper"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column', // Changed to column to fit the share box below
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        borderBottom: '1px solid #f9f9f9',
                                        backgroundColor: activeNote?.id === note.id ? '#f0f0f0' : 'transparent'
                                    }}
                                    onClick={() => onNoteSelect(note)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                                            {editingNoteId === note.id ? (
                                                <input
                                                    autoFocus
                                                    className="rename-input"
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onBlur={() => handleNoteRenameSubmit(note.id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleNoteRenameSubmit(note.id)}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    📄 {note.title || 'Untitled'}
                                                </span>
                                            )}
                                            <small style={{ fontSize: '10px', color: '#999' }}>{new Date(note.createdAt).toLocaleDateString()}</small>
                                        </div>

                                        <div className="note-actions">
                                            {/* --- NEW SHARE BUTTON --- */}
                                            <button title="Share Note" onClick={(e) => {
                                                e.stopPropagation();
                                                setSharingNoteId(sharingNoteId === note.id ? null : note.id);
                                            }}>👤</button>

                                            <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(note.id); setTempName(note.title); }}>✏️</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}>🗑️</button>
                                        </div>
                                    </div>

                                    {/* --- NEW SHARE INPUT BOX --- */}
                                    {sharingNoteId === note.id && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '10px',
                                            background: '#fff',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '5px'
                                        }} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                placeholder="Colleague's email..."
                                                value={shareEmail}
                                                onChange={(e) => setShareEmail(e.target.value)}
                                                style={{ fontSize: '12px', padding: '5px' }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleShareSubmit(note.id)}
                                            />
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button style={{ flex: 1, fontSize: '11px' }} onClick={() => handleShareSubmit(note.id)}>Share</button>
                                                <button style={{ flex: 1, fontSize: '11px' }} onClick={() => setSharingNoteId(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <hr />
            <h3>Study Groups</h3>

            {/* Create or Join Toggle */}
            <div style={{ marginBottom: '15px' }}>
                {isJoining ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            placeholder="Enter Invite Code..."
                            value={inviteCodeInput}
                            onChange={(e) => setInviteCodeInput(e.target.value)}
                            style={{ flex: 1, padding: '5px' }}
                        />
                        <button onClick={handleJoinGroup}>Join</button>
                        <button onClick={() => setIsJoining(false)}>x</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            placeholder="New Group Name..."
                            value={newGroupName}
                            onChange={(e) => {
                                if (e.target.value.length <= 20) {
                                    setNewGroupName(e.target.value);
                                }
                            }}
                            maxLength={20} // Physical limit on the input
                            style={{ flex: 1, padding: '5px' }}
                        />
                        <button onClick={handleCreateGroup}>+</button>
                        <button onClick={() => setIsJoining(true)} title="Join with code">🔗</button>
                    </div>
                )}
            </div>

            {/* List of Groups */}
            {groups.map(group => (
                <div key={group.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '150px' // Keeps the name from pushing the button off-screen
                        }}>
                            👥 {group.name}
                        </span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {/* Toggle Invite Code Button */}
                            <button
                                title="Show Invite Code"
                                onClick={() => setVisibleCodeId(visibleCodeId === group.id ? null : group.id)}
                                style={{ padding: '2px 5px', fontSize: '12px', cursor: 'pointer' }}
                            >
                                🔑
                            </button>

                            <button
                                title="Delete Group"
                                onClick={() => handleDeleteGroup(group.id)}
                                style={{ padding: '2px 5px', fontSize: '12px', color: 'red', border: '1px solid red', borderRadius: '4px', background: 'none', cursor: 'pointer' }}
                            >
                                🗑️
                            </button>

                            <button
                                className="add-note-btn"
                                style={{ flexShrink: 0 }}
                                onClick={(e) => { e.stopPropagation(); triggerAddGroupNote(group.id); }}
                            >
                                + Note
                            </button>
                        </div>
                    </div>

                    {visibleCodeId === group.id && (
                        <div style={{
                            marginTop: '8px',
                            padding: '5px',
                            background: '#f8f9fa',
                            border: '1px dashed #ccc',
                            borderRadius: '4px',
                            textAlign: 'center'
                        }}>
                            <small style={{ color: '#666', display: 'block' }}>Invite Code:</small>
                            <strong style={{ letterSpacing: '1px', color: '#333' }}>{group.inviteCode}</strong>
                        </div>
                    )}

                    {/* Render notes belonging to this group */}
                    <div style={{ marginLeft: '15px', marginTop: '5px' }}>

                        {/* NEW: Inline input for naming the group note */}
                        {addingNoteToGroupId === group.id && (
                            <div style={{ marginBottom: '5px' }}>
                                <input
                                    autoFocus
                                    placeholder="Note title..."
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    onBlur={() => submitGroupNote(group.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') submitGroupNote(group.id);
                                        if (e.key === 'Escape') setAddingNoteToGroupId(null);
                                    }}
                                    style={{ width: '90%', padding: '2px 5px', fontSize: '13px', border: '1px solid #6366f1' }}
                                />
                            </div>
                        )}

                        {group.Notes && group.Notes.map(groupNote => (
                            <div key={groupNote.id}
                                className="note-item-wrapper"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    backgroundColor: activeNote?.id === groupNote.id ? '#f0f0f0' : 'transparent'
                                }}
                                onClick={() => onNoteSelect(groupNote)}
                            >
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    {editingNoteId === groupNote.id ? (
                                        <input
                                            autoFocus
                                            className="rename-input"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={() => handleNoteRenameSubmit(groupNote.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleNoteRenameSubmit(groupNote.id)}
                                            style={{ width: '90%', fontSize: '13px' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            📄 {groupNote.title || 'Untitled'}
                                        </span>
                                    )}
                                </div>

                                <div className="note-actions">
                                    {/* Logic: Only show buttons if the note's UserId matches 
                                        the ID of the person currently logged in.
                                    */}
                                    {groupNote.UserId === currentUser?.id ? (
                                        <>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingNoteId(groupNote.id);
                                                setTempName(groupNote.title);
                                            }}>✏️</button>

                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNote(groupNote.id);
                                            }}>🗑️</button>
                                        </>
                                    ) : (
                                        /* If not the owner, show a "Read Only" lock or icon */
                                        <span title="Read-only" style={{ fontSize: '10px', opacity: 0.5, marginRight: '5px' }}>🔒</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Sidebar;