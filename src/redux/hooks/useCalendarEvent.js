import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  clearError,
} from '../slices/calendarEventSlice';

export const useCalendarEvent = () => {
  const dispatch = useDispatch();
  const { events, loading, saving, error } = useSelector(s => s.calendarEvents);

  return {
    // state
    events,
    loading,
    saving,
    error,
    // actions
    fetchEvents:  ()              => dispatch(fetchCalendarEvents()),
    createEvent:  (payload)       => dispatch(createCalendarEvent(payload)),
    updateEvent:  (id, payload)   => dispatch(updateCalendarEvent({ id, ...payload })),
    deleteEvent:  (id)            => dispatch(deleteCalendarEvent(id)),
    clearError:   ()              => dispatch(clearError()),
  };
};
