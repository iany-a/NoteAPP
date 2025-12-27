import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const Editor = ({ note, onSave }) => {
  const [content, setContent] = useState(note.content || '');
  const [isPreview, setIsPreview] = useState(false);

  // When the user clicks a different note in the sidebar, update the editor text
  useEffect(() => {
    setContent(note.content || '');
  }, [note]);

  return (
    <div className="editor-container">
      <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2>{note.title}</h2>
        <div>
          <button onClick={() => setIsPreview(!isPreview)}>
            {isPreview ? 'Edit Mode' : 'Preview Mode'}
          </button>
          <button 
            onClick={() => onSave(content)} 
            style={{ marginLeft: '10px', backgroundColor: '#28a745', color: 'white' }}
          >
            Save Note
          </button>
        </div>
      </div>

      {isPreview ? (
        <div className="markdown-preview" style={{ border: '1px solid #ddd', padding: '20px', minHeight: '400px', borderRadius: '8px' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          style={{ width: '100%', height: '400px', padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your course notes here (Markdown supported)..."
        />
      )}
      
      <div style={{ marginTop: '10px', color: '#666' }}>
        <small>Tip: Use # for headers, * for bullets, and **bold** for emphasis.</small>
      </div>
    </div>
  );
};

export default Editor;