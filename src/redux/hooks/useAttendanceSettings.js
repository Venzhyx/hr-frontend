import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAttendanceSettings,
  updateAttendanceSettings,
  clearError,
} from '../slices/attendanceSettingsSlice';

export const useAttendanceSettings = () => {
  const dispatch = useDispatch();
  const { data, loading, saving, error } = useSelector(s => s.attendanceSettings);

  return {
    // state
    settings: data,
    loading,
    saving,
    error,
    // actions
    fetchSettings:  ()        => dispatch(fetchAttendanceSettings()),
    updateSettings: (payload) => dispatch(updateAttendanceSettings(payload)),
    clearError:     ()        => dispatch(clearError()),
  };
};
