import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import axios from 'axios';

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null); // Keep this one
  const [loading, setLoading] = useState(true);

  

  // 1. Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects/my-notes', { withCredentials: true });
      setSubjects(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notes", err);
    }
  };

  if (loading) return <div>Loading your workspace...</div>;

  const updateNoteContentLocally = (noteId, newContent) => {
  setSubjects(prevSubjects => 
    prevSubjects.map(subject => ({
      ...subject,
      Notes: subject.Notes.map(note => 
        note.id === noteId ? { ...note, content: newContent } : note
      )
    }))
  );
};

  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh' }}>
      <div className="sidebar-section" style={{ width: '300px', borderRight: '1px solid #ddd' }}>
        <Sidebar
          subjects={subjects}
          onNoteSelect={(note) => setSelectedNote(note)} // Updates selectedNote
          onRefresh={fetchData}
          activeNote={selectedNote} // Pass it back so Sidebar knows which is highlighted
        />
      </div>
      
      <div className="editor-section" style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedNote ? (
          <Editor
            key={selectedNote.id} // Use selectedNote here
            activeNote={selectedNote} // Use selectedNote here
            onLocalContentUpdate={updateNoteContentLocally}
          />
        ) : (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Welcome!</h2>
            <p>Select a note to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;