import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  fetchUserById,
  updateUser,
  toggleUserActive,
  deleteUser,
  clearSelected,
  clearError,
} from "../slices/userSlice";

export function useUser() {
  const dispatch = useDispatch();
  const { list, selected, loading, actionLoading, error } = useSelector(
    (state) => state.users
  );

  return {
    // state
    list,
    selected,
    loading,
    actionLoading,
    error,

    // actions
    fetchUsers: () => dispatch(fetchUsers()),
    fetchUserById: (id) => dispatch(fetchUserById(id)),
    updateUser: (id, data) => dispatch(updateUser({ id, data })),
    toggleUserActive: (id) => dispatch(toggleUserActive(id)),
    deleteUser: (id) => dispatch(deleteUser(id)),
    clearSelected: () => dispatch(clearSelected()),
    clearError: () => dispatch(clearError()),
  };
}
