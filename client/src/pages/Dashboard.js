import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import axios from 'axios';

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all subjects and notes on load
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

  // 2. Handle saving a note
  const handleSaveNote = async (updatedContent) => {
    if (!selectedNote) return;
    try {
      await axios.put(`http://localhost:5000/api/notes/${selectedNote.id}`, {
        content: updatedContent
      }, { withCredentials: true });
      
      // Refresh data to keep sidebar and editor in sync
      fetchData();
    } catch (err) {
      alert("Failed to save note");
    }
  };

  if (loading) return <div>Loading your workspace...</div>;

  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh' }}>
      <div className="sidebar-section" style={{ width: '300px', borderRight: '1px solid #ddd' }}>
        <Sidebar 
          subjects={subjects} 
          onNoteSelect={(note) => setSelectedNote(note)} 
          onRefresh={fetchData}
        />
      </div>
      <div className="editor-section" style={{ flex: 1, padding: '20px' }}>
        {selectedNote ? (
          <Editor 
            note={selectedNote} 
            onSave={handleSaveNote} 
          />
        ) : (
          <div className="empty-state">
            <h2>Welcome!</h2>
            <p>Select a note from the sidebar or create a new subject to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;