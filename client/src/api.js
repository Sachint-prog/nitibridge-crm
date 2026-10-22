import axios from 'axios';

const api = axios.create({
    baseURL: 'https://nitibridge-crm-s4ek.onrender.com',
    // baseURL: 'http://localhost:5000',
    withCredentials: true
});

export default api;


