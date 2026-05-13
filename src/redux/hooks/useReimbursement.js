import { useDispatch, useSelector } from "react-redux";
import {
  fetchReimbursements,
  fetchReimbursementById,
  createReimbursement,
  updateReimbursement,
  deleteReimbursement,
  approveReimbursement,
  rejectReimbursement,
} from "../slices/reimbursementSlice";

export const useReimbursement = () => {
  const dispatch = useDispatch();

  const { list = [], loading = false, error = null } =
    useSelector((state) => state.reimbursements || {});

  return {
    reimbursements: list,
    loading,
    error,

    fetchReimbursements:    ()       => dispatch(fetchReimbursements()),
    getReimbursementById:   (id)     => dispatch(fetchReimbursementById(id)).unwrap(),
    createReimbursement:    (data)   => dispatch(createReimbursement(data)).unwrap(),
    updateReimbursement:    (data)   => dispatch(updateReimbursement(data)).unwrap(),
    deleteReimbursement:    (id)     => dispatch(deleteReimbursement(id)).unwrap(),
    approveReimbursement:   (params) => dispatch(approveReimbursement(params)).unwrap(),
    rejectReimbursement:    (params) => dispatch(rejectReimbursement(params)).unwrap(),
  };
};
