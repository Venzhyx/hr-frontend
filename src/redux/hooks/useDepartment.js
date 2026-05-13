import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDepartments,
  fetchDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../slices/departmentSlice";

export const useDepartment = () => {
  const dispatch = useDispatch();

  const { list = [], loading = false, error = null } =
    useSelector((state) => state.departments || {});

  const getDepartmentById = (id) =>
    dispatch(fetchDepartmentById(id)).unwrap();

  const fetchDepartmentsAction = () => dispatch(fetchDepartments());

  return {
    departments: list,
    loading,
    error,
    fetchDepartments: fetchDepartmentsAction,
    createDepartment: (data) => dispatch(createDepartment(data)),
    updateDepartment: (department) => dispatch(updateDepartment(department)),
    deleteDepartment: (id) => dispatch(deleteDepartment(id)).unwrap(),
    getDepartmentById,
  };
};