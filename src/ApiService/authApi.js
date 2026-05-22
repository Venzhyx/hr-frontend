import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

// Instance terpisah — tidak pakai interceptor token
// supaya tidak circular dependency saat refresh
const authAxios = axios.create({ baseURL: BASE_URL });

export const authApi = {

  login: async ({ username, password }) => {
    const res = await authAxios.post('/auth/login', { username, password });
    return res.data; // { success, message, data: { token, role, userId, employeeId, ... } }
  },

  register: async ({ username, password, role, employeeId }) => {
    const res = await authAxios.post('/auth/register', { username, password, role, employeeId });
    return res.data;
  },
};
