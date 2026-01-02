import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import axios from 'axios';
import "../App.css";

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null); // Keep this one
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);



  // 1. Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async (silent = false) => {
    // Only show the "Loading..." screen if it's NOT a silent refresh
    if (!silent) setLoading(true);

    try {
        const subjectsRes = await axios.get('http://localhost:5000/api/subjects/my-notes', { withCredentials: true });
        setSubjects(subjectsRes.data || []);
        
        const groupsRes = await axios.get('http://localhost:5000/api/groups/my-groups', { withCredentials: true });
        setGroups(groupsRes.data || []);
    } catch (err) {
        console.error("Fetch error:", err);
    } finally {
        setLoading(false); // This hides the loading screen
    }
};

  if (loading) return <div>Loading your workspace...</div>;

  const handleAddSubjectLocally = async (name) => {
    // 1. Create a temporary "Fake" subject to show immediately
    const tempId = Date.now();
    const tempSubject = { id: tempId, name: name, Notes: [], isOptimistic: true };

    // 2. Update the UI right now
    setSubjects(prev => [...prev, tempSubject]);

    try {
      const response = await axios.post('http://localhost:5000/api/subjects/create',
        { name },
        { withCredentials: true }
      );
      const newSubject = {
        ...response.data,
        Notes: response.data.Notes || []
      };
      // 3. Replace the fake one with the real one from the server
      setSubjects(prev => prev.map(s => s.id === tempId ? newSubject : s));
    } catch (err) {
      // 4. If it fails, remove the fake one
      setSubjects(prev => prev.filter(s => s.id !== tempId));
      console.error("Failed to create subject", err);
    }
  };

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
    <div className="dashboard-layout">
      <div className="sidebar-section">
        <Sidebar
          subjects={subjects}
          groups={groups}
          onAddSubject={handleAddSubjectLocally}
          onRefresh={fetchData}
          onNoteSelect={setSelectedNote}
          activeNote={selectedNote}
        />
      </div>

      <div className="editor-section">
        {selectedNote ? (
          <Editor
            key={selectedNote.id}
            activeNote={selectedNote}
            onLocalContentUpdate={updateNoteContentLocally}
          />
        ) : (
          <div className="welcome-screen">
            <h2>Welcome!</h2>
            <p>Select a note to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;