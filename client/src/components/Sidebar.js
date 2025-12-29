import React, { useState } from 'react';
import axios from 'axios';

const Sidebar = ({ subjects, onRefresh, onAddSubject, onNoteSelect, activeNote }) => {
    const [expandedFolders, setExpandedFolders] = useState({});
    const [newSubjectName, setNewSubjectName] = useState('');

    // Toggle folder visibility
    const toggleFolder = (id) => {
        setExpandedFolders(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Create a new Subject (Folder)
    const handleAddSubject = async () => {
        if (!newSubjectName) return;
        try {
            await axios.post('http://localhost:5000/api/subjects/create',
                { name: newSubjectName },
                { withCredentials: true }
            );
            setNewSubjectName('');
            onRefresh(); // Trigger Dashboard to fetch updated data
        } catch (err) {
            console.error("Error creating subject", err);
        }
    };

    //rename subject
    const handleRenameSubject = async (id, oldName) => {
        const newName = window.prompt("Rename subject to:", oldName);
        if (newName && newName !== oldName) {
            try {
                await axios.put(`http://localhost:5000/api/subjects/${id}`, { name: newName }, { withCredentials: true });
                onRefresh(); // Refresh the list
            } catch (err) {
                console.error("Error renaming subject", err);
            }
        }
    };

    //delete subject
    const handleDeleteSubject = async (id) => {
        if (window.confirm("Are you sure? This will delete all notes in this subject!")) {
            try {
                await axios.delete(`http://localhost:5000/api/subjects/${id}`, { withCredentials: true });
                onRefresh();
            } catch (err) {
                console.error("Error deleting subject", err);
            }
        }
    };

    // Create a new Note inside a Subject
    const handleAddNote = async (subjectId) => {
        try {
            await axios.post('http://localhost:5000/api/notes',
                { title: 'New Note', subjectId: subjectId },
                { withCredentials: true }
            );
            onRefresh();
        } catch (err) {
            console.error("Error creating note", err);
        }
    };

    //rename note
    const handleRenameNote = async (id, oldTitle) => {
        const newTitle = window.prompt("Rename note to:", oldTitle);
        if (newTitle && newTitle !== oldTitle) {
            try {
                // We use the same update endpoint your editor uses!
                await axios.put(`http://localhost:5000/api/notes/${id}`,
                    { title: newTitle },
                    { withCredentials: true }
                );
                onRefresh(); // Updates the sidebar list
            } catch (err) {
                console.error("Error renaming note", err);
            }
        }
    };

    //delete note
    const handleDeleteNote = async (id) => {
        if (window.confirm("Delete this note?")) {
            try {
                await axios.delete(`http://localhost:5000/api/notes/${id}`, { withCredentials: true });
                onRefresh();
                // Optimization: You might want to tell the Dashboard 
                // to clear the selection if the deleted note was the active one.
            } catch (err) {
                console.error("Error deleting note", err);
            }
        }
    };

    return (
        <div className="sidebar-content" style={{ padding: '15px' }}>
            <h3>My Subjects</h3>

            {/* Create Subject Input */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="New Subject..."
                    style={{ width: '70%' }}
                />
                <button onClick={handleAddSubject}>+</button>
            </div>

            <hr />

            {/* List Subjects and nested Notes */}
            {subjects.map(subject => (
                <div key={subject.id} style={{ marginBottom: '10px' }}>
                    {/* Unified Header Row */}
                    <div
                        style={{
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '5px 0'
                        }}
                        onClick={() => toggleFolder(subject.id)}
                    >
                        {/* Left Side: Icon and Name */}
                        <span>{expandedFolders[subject.id] ? '📂' : '📁'} {subject.name}</span>

                        {/* Right Side: All Actions Inline */}
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                                onClick={(e) => { e.stopPropagation(); handleRenameSubject(subject.id, subject.name); }}
                                title="Rename"
                            >
                                ✏️
                            </button>
                            <button
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                                onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                                title="Delete Subject"
                            >
                                🗑️
                            </button>
                            <button
                                className="add-note-btn"
                                onClick={(e) => { e.stopPropagation(); handleAddNote(subject.id); }}
                            >
                                + Note
                            </button>
                        </div>
                    </div>

                    {/* Render Notes if folder is expanded */}
                    {expandedFolders[subject.id] && (
                        <div style={{ marginLeft: '20px', marginTop: '5px' }}>
                            {subject.Notes.map(note => (
                                <div
                                    key={note.id}
                                    className="note-item-wrapper"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        borderRadius: '4px'
                                    }}
                                    onClick={() => onNoteSelect(note)}
                                >
                                    <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        📄 {note.title || 'Untitled'}
                                    </span>

                                    <div className="note-actions" style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '10px', opacity: 0.6 }}
                                            onClick={(e) => { e.stopPropagation(); handleRenameNote(note.id, note.title); }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '10px', opacity: 0.6 }}
                                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {subject.Notes?.length === 0 && <small>No notes yet</small>}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Sidebar;