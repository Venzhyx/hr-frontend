import API from "./api";

const BASE      = "/time-off-requests";
const TYPE_BASE = "/time-off-types";

export const getAllTimeOffRequestsAPI        = ()                => API.get(BASE);
export const getTimeOffRequestByIdAPI        = (id)              => API.get(`${BASE}/${id}`);
export const getTimeOffRequestsByEmployeeAPI = (employeeId)      => API.get(`${BASE}/employee/${employeeId}`);
export const createTimeOffRequestAPI         = (data)            => API.post(BASE, data);
export const updateTimeOffRequestAPI         = (id, data)        => API.put(`${BASE}/${id}`, data);
export const deleteTimeOffRequestAPI         = (id)              => API.delete(`${BASE}/${id}`);

// body opsional: { notes: "..." }
export const approveTimeOffRequestAPI        = (id, body)        => API.patch(`${BASE}/${id}/approve`, body ?? {});
export const rejectTimeOffRequestAPI         = (id, body)        => API.patch(`${BASE}/${id}/reject`,  body ?? {});

export const getAllTimeOffTypesAPI            = ()                => API.get(TYPE_BASE);

// Upload attachment — returns permanent URL string
export const uploadAttachmentAPI = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
