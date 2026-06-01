import axios from 'axios';

const api = axios.create({
  // 1. Usamos 127.0.0.1 en lugar de localhost para evitar resolución de DNS
  baseURL: "http://127.0.0.1:5000/api", 
  
  // 2. Timeout para que no se quede colgado si el backend no responde
  timeout: 5000,
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 3. Interceptor para depurar qué está pasando exactamente antes de que salga la petición
api.interceptors.request.use(request => {
  console.log('🚀 [AXIOS_REQUEST]:', request.method.toUpperCase(), request.url);
  // Añadimos configuración dinámica para evitar caché en métodos PATCH/PUT
  if (['patch', 'put'].includes(request.method)) {
    request.headers['Cache-Control'] = 'no-cache';
  }
  return request;
});

api.interceptors.response.use(
  response => response,
  error => {
    // NUEVA FUNCIONALIDAD: Detección proactiva de fallos de conexión
    if (!error.response) {
      console.error('⚠️ [AXIOS_NETWORK_ERROR]: No se pudo conectar con el servidor en 127.0.0.1:5000. Verifica que el backend esté activo.');
    } else {
      console.error('❌ [AXIOS_ERROR]:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// NUEVA FUNCIONALIDAD: Exportación de métodos directos para facilitar la firma en ProjectContext
export const patchTask = (taskId, data) => api.patch(`/tasks/${taskId}`, data);
export const putTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);

export default api;