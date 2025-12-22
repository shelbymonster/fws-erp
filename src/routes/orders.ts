import { Router } from 'express';
import { OrdersController } from '../controllers/orders';

const router = Router();
const ordersController = new OrdersController();

export function setOrderRoutes(app) {
    app.post('/orders', ordersController.createOrder.bind(ordersController));
    app.get('/orders/:id', ordersController.getOrder.bind(ordersController));
    app.put('/orders/:id', ordersController.updateOrder.bind(ordersController));
    app.delete('/orders/:id', ordersController.deleteOrder.bind(ordersController));
}