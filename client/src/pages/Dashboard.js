import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import api from '../api';
import "../App.css";

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  // 1. Initial Load: Token capture and Data Fetching
  useEffect(() => {
    const initializeDashboard = async () => {
      // a. Check if we just arrived from Microsoft login with a token in the URL
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');

      if (urlToken) {
        localStorage.setItem('token', urlToken);
        // Clean the URL address bar immediately
        navigate('/dashboard', { replace: true });
      }

      // b. Verify we have a token (either just saved or already in storage)
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No token found, redirecting to login.");
        navigate('/');
        return;
      }

      // c. Fetch Identity and Data in parallel
      try {
        const [userRes, subjectsRes, groupsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/api/subjects/my-notes'),
          api.get('/api/groups/my-groups')
        ]);

        console.log("✅ Identity Confirmed:", userRes.data.name);
        setUser(userRes.data);
        setSubjects(subjectsRes.data || []);
        setGroups(groupsRes.data || []);
      } catch (err) {
        console.error("Dashboard initialization failed:", err);
        // If the token is invalid or server rejects it, clear and boot
        localStorage.removeItem('token');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

  // Manual refresh logic for the sidebar button
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [subjectsRes, groupsRes] = await Promise.all([
        api.get('/api/subjects/my-notes'),
        api.get('/api/groups/my-groups')
      ]);
      setSubjects(subjectsRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (err) {
      console.error("Fetch error during refresh:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubjectLocally = async (name) => {
    // 1. Create a temporary "Fake" subject to show immediately
    const tempId = Date.now();
    const tempSubject = { id: tempId, name: name, Notes: [], isOptimistic: true };

    // 2. Update the UI right now
    setSubjects(prev => [...prev, tempSubject]);

    try {
      const response = await api.post('/api/subjects/create', { name });
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
    // 1. Update Personal Notes (Subjects)
    setSubjects(prevSubjects =>
      prevSubjects.map(subject => ({
        ...subject,
        Notes: subject.Notes.map(note =>
          note.id === noteId ? { ...note, content: newContent } : note
        )
      }))
    );

    // 2. Update Group Notes
    setGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        Notes: group.Notes ? group.Notes.map(note =>
          note.id === noteId ? { ...note, content: newContent } : note
        ) : []
      }))
    );
  };

  if (loading) return <div>Loading your workspace...</div>;

  return (
    <div className="dashboard-layout">
      <div className="sidebar-section">
        <Sidebar
          subjects={subjects}
          groups={groups}
          currentUser={user}
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
            isReadOnly={selectedNote.UserId && selectedNote.UserId !== user?.id}
          />
        ) : (
          <div className="welcome-screen">
            <h2>Welcome, {user?.name || 'Student'}!</h2>
            <p>Select a note from the sidebar to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;