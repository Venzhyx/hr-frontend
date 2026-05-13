import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  clearError,
} from '../slices/timeOffTypeSlice';

export const useTimeOffType = () => {
  const dispatch = useDispatch();
  const { types, loading, saving, error } = useSelector(s => s.timeOffTypes);

  return {
    // state
    types,
    loading,
    saving,
    error,
    // actions
    fetchTypes:   ()             => dispatch(fetchTimeOffTypes()),
    createType:   (payload)      => dispatch(createTimeOffType(payload)),
    updateType:   (id, payload)  => dispatch(updateTimeOffType({ id, ...payload })),
    deleteType:   (id)           => dispatch(deleteTimeOffType(id)),
    clearError:   ()             => dispatch(clearError()),
  };
};
