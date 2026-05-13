import { useDispatch, useSelector } from "react-redux";
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../slices/companySlice";

export const useCompany = () => {
  const dispatch = useDispatch();

  const { list = [], loading = false, error = null } =
    useSelector((state) => state.companies || {});

  return {
    companies: list,
    loading,
    error,

    fetchCompanies: () => dispatch(fetchCompanies()),

    createCompany: (formData) =>
      dispatch(createCompany(formData)),

    updateCompany: (id, formData) =>
      dispatch(updateCompany({ id, formData })),

    deleteCompany: (id) =>
      dispatch(deleteCompany(id)),
  };
};