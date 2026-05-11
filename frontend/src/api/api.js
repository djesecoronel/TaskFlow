import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Ajusta si usas la IP 192.168...
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;