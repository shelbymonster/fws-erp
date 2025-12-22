import express from 'express';
import { setCustomerRoutes } from './routes/customers';
import { setInventoryRoutes } from './routes/inventory';
import { setOrderRoutes } from './routes/orders';
import { setReportRoutes } from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setCustomerRoutes(app);
setInventoryRoutes(app);
setOrderRoutes(app);
setReportRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});