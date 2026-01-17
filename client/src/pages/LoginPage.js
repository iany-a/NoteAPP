import React from 'react';

const LoginPage = () => {
  const handleLogin = () => {
    // Redirects the whole browser to the backend auth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/microsoft`;
  };

  return (
    <div className="login-container">
      <h1>ASE Study Notes</h1>
      <p>Organize your academic life in one place.</p>
      <button onClick={handleLogin} className="ase-btn">
        Login with @stud.ase.ro
      </button>
    </div>
  );
};

export default LoginPage;