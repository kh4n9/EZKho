import mongoose from 'mongoose';
import Supplier from '@/models/Supplier';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getSupplierById = (userId, supplierId) => {
  return Supplier.findOne({ _id: supplierId, user_id: userId });
};

const updateSupplierById = (userId, supplierId, updateFields) => {
  return Supplier.findOneAndUpdate(
    { _id: supplierId, user_id: userId },
    updateFields,
    { new: true, runValidators: true }
  );
};

const deleteSupplierById = (userId, supplierId) => {
  return Supplier.findOneAndDelete({ _id: supplierId, user_id: userId });
};

export const supplierService = {
  isValidId,
  getSupplierById,
  updateSupplierById,
  deleteSupplierById,
};
