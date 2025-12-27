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
                    <div
                        style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}
                        onClick={() => toggleFolder(subject.id)}
                    >
                        <span>{expandedFolders[subject.id] ? '📂' : '📁'} {subject.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleAddNote(subject.id); }}>+ Note</button>
                    </div>

                    {/* Render Notes if folder is expanded */}
                    {expandedFolders[subject.id] && (
                        <div style={{ marginLeft: '20px', marginTop: '5px' }}>
                            {subject.Notes && subject.Notes.map(note => (
                                <div
                                    key={note.id}
                                    className="note-item"
                                    onClick={() => onNoteSelect(note)}
                                >
                                    {/* Smart Title Logic */}
                                    <span>
                                        {note.title && note.title.trim() !== ""
                                            ? note.title
                                            : (note.content.replace(/[#*`]/g, '').substring(0, 20) + (note.content.length > 20 ? "..." : ""))}
                                    </span>
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