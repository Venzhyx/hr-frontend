import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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