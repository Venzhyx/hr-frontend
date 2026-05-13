import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;

// ================= DEPARTMENT =================

export const createDepartmentAPI = (data) => {
  return API.post("/departments", data);
};

export const getDepartmentsAPI = () => {
  return API.get("/departments");
};

export const getDepartmentByIdAPI = (id) => {
  return API.get(`/departments/${id}`);
};

export const updateDepartmentAPI = (id, data) => {
  return API.put(`/departments/${id}`, data);
};

export const deleteDepartmentAPI = (id) => {
  return API.delete(`/departments/${id}`);
};