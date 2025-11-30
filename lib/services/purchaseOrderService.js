const { Product, PurchaseOrder, Supplier } = require('@/models');

class PurchaseOrderService {
  /**
   * Check for products that need reordering and create automatic purchase orders
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of created purchase orders
   */
  static async checkAndCreateReorderOrders(userId) {
    try {
      const { connectToDatabase } = require('@/lib/mongodb');
      await connectToDatabase();

      // Find all products that need reordering
      const productsNeedingReorder = await Product.find({
        user_id: userId,
        is_active: true
      }).select('product_id product_name current_stock reorder_level preferred_supplier_id lead_time_days');

      const createdOrders = [];

      for (const product of productsNeedingReorder) {
        if (product.needsReorder()) {
          const recommendedQty = product.calculateReorderQuantity();
          
          // Find preferred supplier or fallback to any supplier
          let supplierId = product.preferred_supplier_id;
          if (!supplierId) {
            const suppliers = await Supplier.find({
              user_id: userId,
              is_active: true
            }).limit(1);
            supplierId = suppliers.length > 0 ? suppliers[0]._id : null;
          }

          // Create purchase order
          const purchaseOrderData = {
            user_id: userId,
            product_id: product.product_id,
            supplier_id: supplierId,
            quantity: recommendedQty,
            unit_price: 0, // Will be calculated by supplier
            status: 'pending',
            expected_delivery_date: new Date(Date.now() + (product.lead_time_days || 7) * 24 * 60 * 60 * 1000), // Lead time in milliseconds
            notes: `Tự động tạo đơn - Mức tồn kho: ${product.current_stock}, Mức tái đặt: ${product.reorder_level}, Suggested quantity: ${recommendedQty}`,
            auto_generated: true
          };

          const purchaseOrder = new PurchaseOrder(purchaseOrderData);
          await purchaseOrder.save();
          createdOrders.push(purchaseOrder);

          console.log(`Created auto purchase order for product ${product.product_id}:`, {
            currentStock: product.current_stock,
            reorderLevel: product.reorder_level,
            recommendedQty: recommendedQty
          });
        }
      }

      return createdOrders;

    } catch (error) {
      console.error('Error in checkAndCreateReorderOrders:', error);
      throw error;
    }
  }

  /**
   * Get purchase order statistics for dashboard
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Order statistics
   */
  static async getPurchaseOrderStats(userId) {
    try {
      const { connectToDatabase } = require('@/lib/mongodb');
      await connectToDatabase();

      const stats = await PurchaseOrder.getOrderStats(userId);
      
      return {
        totalOrders: stats.length,
        pendingOrders: stats.filter(s => s.status === 'pending').length,
        approvedOrders: stats.filter(s => s.status === 'approved').length,
        totalValue: stats.reduce((sum, s) => sum + s.total_amount, 0)
      };

    } catch (error) {
      console.error('Error in getPurchaseOrderStats:', error);
      throw error;
    }
  }

  /**
   * Get pending purchase orders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of pending orders
   */
  static async getPendingOrders(userId) {
    try {
      const { connectToDatabase } = require('@/lib/mongodb');
      await connectToDatabase();

      return await PurchaseOrder.getPendingOrders(userId);

    } catch (error) {
      console.error('Error in getPendingOrders:', error);
      throw error;
    }
  }

  /**
   * Update purchase order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated order
   */
  static async updateOrderStatus(orderId, status, notes = '') {
    try {
      const { connectToDatabase } = require('@/lib/mongodb');
      await connectToDatabase();

      const order = await PurchaseOrder.findById(orderId);
      if (!order) {
        throw new Error('Purchase order not found');
      }

      order.status = status;
      if (notes) {
        order.notes = notes;
      }

      await order.save();

      return order;

    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  }
}

module.exports = PurchaseOrderService;