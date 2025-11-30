const { Product, PurchaseOrder } = require('@/models');

class InventoryCheckService {
  /**
   * Check all products and create purchase orders for items below reorder level
   * This should be run periodically (e.g., daily)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Results of the check
   */
  static async checkAndCreateReorderOrders(userId) {
    try {
      const { connectToDatabase } = require('@/lib/mongodb');
      await connectToDatabase();

      console.log('Starting inventory check for reorder orders...');
      
      // Get all products that need reordering
      const productsNeedingReorder = await Product.find({
        user_id: userId,
        is_active: true
      }).select('product_id product_name current_stock reorder_level');

      const reorderResults = {
        totalProducts: productsNeedingReorder.length,
        productsReordered: 0,
        ordersCreated: [],
        errors: []
      };

      // Check each product and create reorder orders if needed
      for (const product of productsNeedingReorder) {
        try {
          if (product.needsReorder()) {
            const recommendedQty = product.calculateReorderQuantity();
            
            // Find preferred supplier or fallback to any supplier
            let supplierId = product.preferred_supplier_id;
            if (!supplierId) {
              // This would require Supplier model import - for now, we'll skip
              console.log(`No preferred supplier found for product ${product.product_id}`);
            }

            // Create purchase order
            const { PurchaseOrder } = require('@/models');
            const purchaseOrderData = {
              user_id: userId,
              product_id: product.product_id,
              supplier_id: supplierId,
              quantity: recommendedQty,
              unit_price: 0, // Will be calculated by supplier
              status: 'pending',
              expected_delivery_date: new Date(Date.now() + (product.lead_time_days || 7) * 24 * 60 * 60 * 1000),
              notes: `Tự động tạo đơn - Mức tồn kho: ${product.current_stock}, Mức tái đặt: ${product.reorder_level}, Suggested quantity: ${recommendedQty}`,
              auto_generated: true
            };

            const purchaseOrder = new PurchaseOrder(purchaseOrderData);
            await purchaseOrder.save();
            
            reorderResults.productsReordered++;
            reorderResults.ordersCreated.push({
              product_id: product.product_id,
              product_name: product.product_name,
              quantity: recommendedQty,
              order_id: purchaseOrder.order_id
            });

            console.log(`Created auto purchase order for product ${product.product_id}:`, {
              currentStock: product.current_stock,
              reorderLevel: product.reorder_level,
              recommendedQty: recommendedQty
            });

          } else {
            console.log(`Product ${product.product_id} does not need reordering. Current stock: ${product.current_stock}, Reorder level: ${product.reorder_level}`);
          }
        } catch (error) {
          console.error(`Error creating reorder order for product ${product.product_id}:`, error);
          reorderResults.errors.push({
            product_id: product.product_id,
            product_name: product.product_name,
            error: error.message
          });
        }
      }

      console.log('Inventory check completed:', reorderResults);
      return reorderResults;

    } catch (error) {
      console.error('Error in checkAndCreateReorderOrders:', error);
      throw error;
    }
  }
}

module.exports = InventoryCheckService;