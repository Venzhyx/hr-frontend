import API from "./api";

// ================= COMPANY =================

export const createCompanyAPI = (data) => {
  return API.post("/companies", data);
};

export const getCompaniesAPI = () => {
  return API.get("/companies");
};

export const getCompanyByIdAPI = (id) => {
  return API.get(`/companies/${id}`);
};

export const updateCompanyAPI = (id, data) => {
  return API.put(`/companies/${id}`, data);
};

export const deleteCompanyAPI = (id) => {
  return API.delete(`/companies/${id}`);
};