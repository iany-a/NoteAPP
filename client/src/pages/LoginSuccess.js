import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Look at the URL (e.g., /login-success?token=eyJhbG...)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // 2. Save it forever (until logout)
      localStorage.setItem('token', token);
      
      // 3. Go to dashboard
      navigate('/dashboard');
    } else {
      // If no token found, go back to login
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <h2>Finalizing login...</h2>
    </div>
  );
};

export default LoginSuccess;

