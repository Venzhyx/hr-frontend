import API from "./api";

// ================= ATTENDANCE CORRECTION =================

export const createCorrectionAPI = (data) => {
  return API.post("/attendance-corrections", data);
};

export const getAllCorrectionsAPI = () => {
  return API.get("/attendance-corrections");
};

export const getMyCorrectionsByEmployeeAPI = (employeeId) => {
  return API.get(`/attendance-corrections/my/${employeeId}`);
};

// Approve - hanya kirim adminId sebagai query param
export const approveCorrectionAPI = (id, adminId) => {
  return API.put(`/attendance-corrections/${id}/approve?adminId=${adminId}`);
};

// Reject - hanya kirim adminId sebagai query param
export const rejectCorrectionAPI = (id, adminId) => {
  return API.put(`/attendance-corrections/${id}/reject?adminId=${adminId}`);
};

// TAMBAH: Update Correction
export const updateCorrectionAPI = (id, data) => {
  return API.put(`/attendance-corrections/${id}`, data);
};

// TAMBAH: Delete Correction
export const deleteCorrectionAPI = (id) => {
  return API.delete(`/attendance-corrections/${id}`);
};