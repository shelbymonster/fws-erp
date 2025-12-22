export class Order {
    id: number;
    customerId: number;
    productIds: number[];
    totalAmount: number;

    constructor(id: number, customerId: number, productIds: number[], totalAmount: number) {
        this.id = id;
        this.customerId = customerId;
        this.productIds = productIds;
        this.totalAmount = totalAmount;
    }

    save() {
        // Logic to save the order data
    }

    static getOrder(id: number) {
        // Logic to retrieve order data by id
    }

    static getAllOrders() {
        // Logic to retrieve all orders
    }

    update() {
        // Logic to update the order data
    }

    static deleteOrder(id: number) {
        // Logic to delete the order by id
    }
}