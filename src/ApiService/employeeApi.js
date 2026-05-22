import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Inject token ke setiap request ──────────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("hr_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Handle 401 ───────────────────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;


// ================= EMPLOYEE =================

export const createEmployeeAPI = (data) => {
  return API.post("/employees", data);
};

export const getEmployeesAPI = () => {
  return API.get("/employees");
};

export const getEmployeeByIdAPI = (id) => {
  return API.get(`/employees/${id}`);
};

export const updateEmployeeAPI = (id, data) => {
  return API.put(`/employees/${id}`, data);
};

export const deleteEmployeeAPI = (id) => {
  return API.delete(`/employees/${id}`);
};

// ================= PRIVATE INFO =================

export const createEmployeePrivateInfoAPI = (data) => {
  return API.post("/employees/private-info", data);
};