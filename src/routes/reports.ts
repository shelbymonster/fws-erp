import { Router } from 'express';
import ReportsController from '../controllers/reports';

const router = Router();
const reportsController = new ReportsController();

export function setReportRoutes(app: Router) {
    app.get('/reports/sales', reportsController.getSalesReport.bind(reportsController));
    app.get('/reports/inventory', reportsController.getInventoryReport.bind(reportsController));
}