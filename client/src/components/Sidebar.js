import React, { useState } from 'react';
import axios from 'axios';
import '../App.css'

const Sidebar = ({ subjects, onRefresh, onAddSubject, onNoteSelect, activeNote }) => {
    const [expandedFolders, setExpandedFolders] = useState({});
    const [newSubjectName, setNewSubjectName] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // NEW: Search state

    // --- SEARCH FILTERING LOGIC ---
    // We create a filtered copy of the subjects to display
    const filteredSubjects = subjects.map(subject => {
        const query = searchTerm.toLowerCase();
        const subjectNameMatches = subject.name.toLowerCase().includes(query);

        // If the folder name matches, show ALL notes in that folder.
        // Otherwise, only show notes that match the query.
        const filteredNotes = subject.Notes.filter(note => {
            if (subjectNameMatches) return true; // Keep all notes if folder matches

            const noteTitle = (note.title || '').toLowerCase();
            const noteContent = (note.content || '').toLowerCase();
            const noteDate = new Date(note.createdAt).toLocaleDateString().toLowerCase();

            return noteTitle.includes(query) ||
                noteContent.includes(query) ||
                noteDate.includes(query);
        });

        return { ...subject, Notes: filteredNotes };
    }).filter(subject => {
        const query = searchTerm.toLowerCase();
        // Keep the subject if it has matching notes OR the subject name itself matches
        return subject.Notes.length > 0 || subject.name.toLowerCase().includes(query);
    });

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

            {/* NEW: Search Bar */}
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Search notes or dates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
            </div>

            {/* Create Subject Input */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="New Subject..."
                    style={{ width: '70%', padding: '5px' }}
                />
                <button onClick={handleAddSubject} style={{ padding: '5px 10px' }}>+</button>
            </div>

            <hr />

            {/* CHANGE: Loop through filteredSubjects instead of subjects */}
            {filteredSubjects.map(subject => (
                <div key={subject.id} style={{ marginBottom: '10px' }}>
                    <div
                        className="subject-header-row"
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
                        <span>{expandedFolders[subject.id] || searchTerm ? '📂' : '📁'} {subject.name}</span>

                        <div className="subject-actions">
                            <button onClick={(e) => { e.stopPropagation(); handleRenameSubject(subject.id, subject.name); }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}>🗑️</button>
                            <button className="add-note-btn" onClick={(e) => { e.stopPropagation(); handleAddNote(subject.id); }}>+ Note</button>
                        </div>
                    </div>

                    {/* Render Notes if folder is expanded OR if we are searching */}
                    {(expandedFolders[subject.id] || searchTerm) && (
                        <div style={{ marginLeft: '20px', marginTop: '5px' }}>
                            {subject.Notes.map(note => (
                                <div
                                    key={note.id}
                                    className="note-item-wrapper"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        borderBottom: '1px solid #f9f9f9'
                                    }}
                                    onClick={() => onNoteSelect(note)}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            📄 {note.title || 'Untitled'}
                                        </span>
                                        {/* NEW: Date Display */}
                                        <small style={{ fontSize: '10px', color: '#999' }}>
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </small>
                                    </div>

                                    <div className="note-actions">
                                        <button onClick={(e) => { e.stopPropagation(); handleRenameNote(note.id, note.title); }}>✏️</button>
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