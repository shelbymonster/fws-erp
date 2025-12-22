import { Router } from 'express';
import { CustomersController } from '../controllers/customers';

const router = Router();
const customersController = new CustomersController();

export function setCustomerRoutes(app) {
    app.use('/api/customers', router);

    router.post('/', customersController.createCustomer.bind(customersController));
    router.get('/:id', customersController.getCustomer.bind(customersController));
    router.put('/:id', customersController.updateCustomer.bind(customersController));
    router.delete('/:id', customersController.deleteCustomer.bind(customersController));
}