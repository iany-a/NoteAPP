import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Editor = ({ activeNote, onNoteUpdated }) => {
    console.log("Editor received activeNote:", activeNote);
    const [title, setTitle] = useState(activeNote?.title || '');
    const [content, setContent] = useState(activeNote?.content || '');

    // Update local state when a different note is selected
    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote?.title || '');
            setContent(activeNote?.content || '');
        }
    }, [activeNote]);

    // The function that actually talks to the database
    const saveNote = useCallback(async (updatedTitle, updatedContent) => {
        if (!activeNote) return;
        try {
            await axios.put(`http://localhost:5000/api/notes/${activeNote.id}`, {
                title: updatedTitle,
                content: updatedContent
            }, { withCredentials: true });

            // Tell the parent (App.js) to refresh the sidebar so the title updates
            onNoteUpdated();
        } catch (err) {
            console.error("Failed to auto-save", err);
        }
    }, [activeNote, onNoteUpdated]);

    // Debounce logic: Wait 1000ms after typing stops to save
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (activeNote && (title !== activeNote.title || content !== activeNote.content)) {
                saveNote(title, content);
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [title, content, activeNote, saveNote]);

    if (!activeNote) return <div className="no-note">Select a note to start editing</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

            {/* TOOLBAR */}
            <div style={{ height: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 20px', background: '#eee', alignItems: 'center' }}>
                <span>Auto-saving...</span>
            </div>

            {/* MAIN AREA */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT: INPUT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', borderRight: '1px solid #ddd' }}>
                    <input
                        style={{ fontSize: '24px', fontWeight: 'bold', border: 'none', outline: 'none', marginBottom: '10px' }}
                        placeholder="Title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '16px' }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {/* RIGHT: PREVIEW */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fff' }}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>

            </div>
        </div>
    );
};

export default Editor;