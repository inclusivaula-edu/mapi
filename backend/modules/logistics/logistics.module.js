import express from 'express';
import supplierRoutes from './routes/suppliers.routes.js';
import productRoutes from './routes/products.routes.js';
import orderRoutes from './routes/orders.routes.js';
import deliveryRoutes from './routes/deliveries.routes.js';

const router = express.Router();

router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/deliveries', deliveryRoutes);

export default router;