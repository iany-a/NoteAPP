import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const Sidebar = ({ subjects, onRefresh, onNoteSelect, activeNote }) => {
    const [expandedFolders, setExpandedFolders] = useState({});
    const [newSubjectName, setNewSubjectName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // NEW STATES FOR INLINE EDITING
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [tempName, setTempName] = useState("");

    // --- SEARCH FILTERING LOGIC ---
    const filteredSubjects = subjects.map(subject => {
        const query = searchTerm.toLowerCase();
        const subjectNameMatches = subject.name.toLowerCase().includes(query);
        const filteredNotes = subject.Notes.filter(note => {
            if (subjectNameMatches) return true;
            const noteTitle = (note.title || '').toLowerCase();
            const noteContent = (note.content || '').toLowerCase();
            const noteDate = new Date(note.createdAt).toLocaleDateString().toLowerCase();
            return noteTitle.includes(query) || noteContent.includes(query) || noteDate.includes(query);
        });
        return { ...subject, Notes: filteredNotes };
    }).filter(subject => {
        const query = searchTerm.toLowerCase();
        return subject.Notes.length > 0 || subject.name.toLowerCase().includes(query);
    });

    const toggleFolder = (id) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddSubject = async () => {
        if (!newSubjectName) return;
        try {
            await axios.post('http://localhost:5000/api/subjects/create', { name: newSubjectName }, { withCredentials: true });
            setNewSubjectName('');
            onRefresh();
        } catch (err) { console.error("Error creating subject", err); }
    };

    // --- NEW INLINE SUBMIT HANDLERS ---
    const handleSubjectRenameSubmit = async (id) => {
        const finalName = tempName.trim() || "Untitled Subject";
        try {
            await axios.put(`http://localhost:5000/api/subjects/${id}`, { name: finalName }, { withCredentials: true });
            setEditingSubjectId(null);
            onRefresh();
        } catch (err) { console.error("Error renaming subject", err); }
    };

    const handleNoteRenameSubmit = async (id) => {
        const finalTitle = tempName.trim() || "Untitled Note";
        try {
            await axios.put(`http://localhost:5000/api/notes/${id}`, { title: finalTitle }, { withCredentials: true });
            setEditingNoteId(null);
            onRefresh();
        } catch (err) { console.error("Error renaming note", err); }
    };

    const handleDeleteSubject = async (id) => {
        if (window.confirm("Are you sure? This will delete all notes in this subject!")) {
            try {
                await axios.delete(`http://localhost:5000/api/subjects/${id}`, { withCredentials: true });
                onRefresh();
            } catch (err) { console.error("Error deleting subject", err); }
        }
    };

    const handleAddNote = async (subjectId) => {
        try {
            const res = await axios.post('http://localhost:5000/api/notes', { title: 'New Note', subjectId: subjectId }, { withCredentials: true });
            await onRefresh();
            // Automatically start editing the new note's title
            setEditingNoteId(res.data.id);
            setTempName('New Note');
        } catch (err) { console.error("Error creating note", err); }
    };

    const handleDeleteNote = async (id) => {
        if (window.confirm("Delete this note?")) {
            try {
                await axios.delete(`http://localhost:5000/api/notes/${id}`, { withCredentials: true });
                onRefresh();
            } catch (err) { console.error("Error deleting note", err); }
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
                                    value={tempName} 
                                    onChange={(e) => setTempName(e.target.value)} 
                                    onClick={(e) => e.stopPropagation()} 
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
                                <div key={note.id} className="note-item-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', borderBottom: '1px solid #f9f9f9', background: activeNote?.id === note.id ? '#f0f0f0' : 'transparent' }} onClick={() => onNoteSelect(note)}>
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                                        {editingNoteId === note.id ? (
                                            <input 
                                                autoFocus 
                                                value={tempName} 
                                                onChange={(e) => setTempName(e.target.value)} 
                                                onClick={(e) => e.stopPropagation()} 
                                                onBlur={() => handleNoteRenameSubmit(note.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleNoteRenameSubmit(note.id)}
                                                style={{ fontSize: '14px', width: '90%' }} 
                                            />
                                        ) : (
                                            <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                📄 {note.title || 'Untitled'}
                                            </span>
                                        )}
                                        <small style={{ fontSize: '10px', color: '#999' }}>{new Date(note.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <div className="note-actions">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(note.id); setTempName(note.title); }}>✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Sidebar;