export class Product {
    id: number;
    name: string;
    price: number;
    quantity: number;

    constructor(id: number, name: string, price: number, quantity: number) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
    }

    save(): void {
        // Logic to save the product data
    }

    static retrieve(id: number): Product | null {
        // Logic to retrieve product data by id
        return null; // Placeholder return
    }
}