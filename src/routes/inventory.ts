import { Router } from 'express';
import { InventoryController } from '../controllers/inventory';

const router = Router();
const inventoryController = new InventoryController();

router.post('/products', inventoryController.addProduct.bind(inventoryController));
router.get('/products', inventoryController.getProducts.bind(inventoryController));
router.put('/products/:id', inventoryController.updateProduct.bind(inventoryController));
router.delete('/products/:id', inventoryController.deleteProduct.bind(inventoryController));

export function setInventoryRoutes(app) {
    app.use('/api/inventory', router);
}