import React, { useState, useEffect } from 'react'; // Added useRef
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import "../App.css"

const Editor = ({ activeNote, onLocalContentUpdate, isReadOnly }) => {
    const [content, setContent] = useState(activeNote?.content || '');
    const [saveStatus, setSaveStatus] = useState('Saved');

    useEffect(() => {
        // 1. If there's no note, or the content is EXACTLY what is already in the database, STOP.
        if (!activeNote || content === activeNote.content) {
            return;
        }
        //2. Write roles check
        if (isReadOnly) return;

        if (!activeNote || content === activeNote.content) {
            return;
        }

        // 3. Only start the timer if the local content is different from the saved content
        const delayDebounceFn = setTimeout(async () => {
            try {
                setSaveStatus('Saving...');
                await axios.put(`http://localhost:5000/api/notes/${activeNote.id}`,
                    { content },
                    { withCredentials: true }
                );

                // 4. Inform the parent that a save happened so the Sidebar stays in sync
                onLocalContentUpdate(activeNote.id, content);

                setSaveStatus('Saved');
            } catch (err) {
                console.error("Save failed", err);
                setSaveStatus('Error');
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [content, activeNote.id]); // <--- Only watch content and the note ID, not the whole note object

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

            {/* MAIN AREA */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT: INPUT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', borderRight: '1px solid #bea6a6ff' }}>
                    <textarea
                        className="zen-textarea"
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontSize: '16px',
                            backgroundColor: isReadOnly ? '#f9f9f9' : 'transparent', // Light gray if locked
                            cursor: isReadOnly ? 'not-allowed' : 'text'             // Show lock cursor
                        }}
                        value={content}
                        onChange={(e) => !isReadOnly && setContent(e.target.value)} // Double protection
                        onPaste={(e) => !isReadOnly && handlePaste(e)}             // Block image pastes
                        readOnly={isReadOnly} // <--- The actual HTML attribute
                        placeholder={isReadOnly ? "This note is read-only" : "Start typing..."}
                    />
                </div>

                {/* RIGHT: PREVIEW */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fff' }}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>

            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '20px',
                fontSize: '11px',
                color: saveStatus === 'Saving...' ? '#6366f1' : '#999',
                fontStyle: 'italic',
                background: 'rgba(255,255,255,0.8)',
                padding: '2px 8px',
                borderRadius: '10px'
            }}>
                {saveStatus}
            </div>
        </div>
    );
};

export default Editor;