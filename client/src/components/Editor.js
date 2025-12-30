import React, { useState, useEffect } from 'react'; // Added useRef
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Editor = ({ activeNote, onLocalContentUpdate }) => {
    const [content, setContent] = useState(activeNote?.content || '');
    const [saveStatus, setSaveStatus] = useState('Saved');

    useEffect(() => {
        if (content === activeNote.content) return;

        const delayDebounceFn = setTimeout(async () => {
            try {
                setSaveStatus('Saving...');
                await axios.put(`http://localhost:5000/api/notes/${activeNote.id}`,
                    { content: content },
                    { withCredentials: true }
                );

                setSaveStatus('Saved');

                // THIS IS THE KEY: Update the parent's memory
                if (onLocalContentUpdate) {
                    onLocalContentUpdate(activeNote.id, content);
                }
            } catch (err) {
                console.error("Error saving", err);
                setSaveStatus('Error');
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [content, activeNote.id, activeNote.content, onLocalContentUpdate]);

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