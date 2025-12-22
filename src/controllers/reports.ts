export class ReportsController {
    getSalesReport(req, res) {
        // Logic to generate sales report
        res.send("Sales report generated");
    }

    getInventoryReport(req, res) {
        // Logic to generate inventory report
        res.send("Inventory report generated");
    }
}