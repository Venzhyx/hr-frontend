import API from "./api";

const BASE_URL = "/overtimes";

export const overtimeApi = {
  // GET
  getAllOvertimes: async () => {
    const response = await API.get(BASE_URL);
    return response.data;
  },

  getOvertimesByEmployee: async (employeeId) => {
    const response = await API.get(`${BASE_URL}/my/${employeeId}`);
    return response.data;
  },

  getTotalOvertimeByEmployee: async (employeeId, month, year) => {
    const response = await API.get(`${BASE_URL}/total/${employeeId}`, {
      params: { month, year },
    });
    return response.data;
  },

  // POST
  createOvertime: async (payload) => {
    const response = await API.post(BASE_URL, payload);
    return response.data;
  },

  // FIXED: approve dengan notes
  approveOvertime: async (id, approverId, notes) => {
    const response = await API.put(
      `${BASE_URL}/${id}/approve`,
      { notes },
      {
        params: { approverId },
      }
    );
    return response.data;
  },

  // FIXED: reject dengan notes
  rejectOvertime: async (id, approverId, notes) => {
    const response = await API.put(
      `${BASE_URL}/${id}/reject`,
      { notes },
      {
        params: { approverId },
      }
    );
    return response.data;
  },

  // TAMBAH: Update Overtime
  updateOvertime: async (id, payload) => {
    const response = await API.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  // TAMBAH: Delete Overtime
  deleteOvertime: async (id) => {
    const response = await API.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};