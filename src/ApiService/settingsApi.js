import API from "./api"; // pakai instance terpusat yang sudah ada interceptor token

// ================= ATTENDANCE SETTINGS =================

export const getAttendanceSettingsAPI = () => {
  return API.get("/settings/attendance");
};

export const updateAttendanceSettingsAPI = (data) => {
  return API.put("/settings/attendance", data);
};

// ================= CALENDAR EVENTS =================

export const getCalendarEventsAPI = () => {
  return API.get("/calendar-events");
};

export const getCalendarEventByIdAPI = (id) => {
  return API.get(`/calendar-events/${id}`);
};

export const createCalendarEventAPI = (data) => {
  return API.post("/calendar-events", data);
};

export const updateCalendarEventAPI = (id, data) => {
  return API.put(`/calendar-events/${id}`, data);
};

export const deleteCalendarEventAPI = (id) => {
  return API.delete(`/calendar-events/${id}`);
};

// ================= TIME OFF TYPES =================

export const getTimeOffTypesAPI = () => {
  return API.get("/time-off-types");
};

export const getTimeOffTypeByIdAPI = (id) => {
  return API.get(`/time-off-types/${id}`);
};

export const createTimeOffTypeAPI = (data) => {
  return API.post("/time-off-types", data);
};

export const updateTimeOffTypeAPI = (id, data) => {
  return API.put(`/time-off-types/${id}`, data);
};

export const deleteTimeOffTypeAPI = (id) => {
  return API.delete(`/time-off-types/${id}`);
};