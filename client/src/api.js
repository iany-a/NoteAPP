import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // This handles the http://localhost:5000 part
  withCredentials: true
});

export default instance;