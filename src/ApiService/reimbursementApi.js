import API from "./api";

const BASE = "/reimbursements";

export const getReimbursementsAPI      = ()              => API.get(BASE);
export const getReimbursementByIdAPI   = (id)            => API.get(`${BASE}/${id}`);
export const createReimbursementAPI    = (data)          => API.post(BASE, data);
export const updateReimbursementAPI    = (id, data)      => API.put(`${BASE}/${id}`, data);
export const deleteReimbursementAPI    = (id)            => API.delete(`${BASE}/${id}`);
export const approveReimbursementAPI   = (id, data)      => API.post(`${BASE}/${id}/approve`, data);
export const rejectReimbursementAPI    = (id, data)      => API.post(`${BASE}/${id}/reject`, data);