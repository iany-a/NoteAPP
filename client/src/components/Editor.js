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

    const handlePaste = async (e) => {
        const items = e.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                // It's an image! Prevent default paste behavior
                e.preventDefault();
                const blob = items[i].getAsFile();

                // Send to server
                const formData = new FormData();
                formData.append('image', blob);

                try {
                    const res = await axios.post('http://localhost:5000/api/notes/upload-image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        withCredentials: true
                    });

                    // Insert Markdown at the current cursor position
                    const imageUrl = res.data.url;
                    const markdownImage = `\n![Image](${imageUrl})\n`;

                    // Update content state
                    const { selectionStart, selectionEnd } = e.target;
                    const newContent = content.substring(0, selectionStart) + markdownImage + content.substring(selectionEnd);
                    setContent(newContent);

                } catch (err) {
                    console.error("Upload failed", err);
                }
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

            {/* TOOLBAR */}
            <div style={{ height: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 20px', background: '#6c6c6cff', alignItems: 'center' }}>
                <span>Auto-saving...</span>
            </div>

            {/* MAIN AREA */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT: INPUT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', borderRight: '1px solid #bea6a6ff' }}>
                    <textarea
                        className="zen-textarea"
                        style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '16px' }} // Added inline flex: 1 to be safe
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Start typing or paste an image..."
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