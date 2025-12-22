export class Customer {
    id: number;
    name: string;
    email: string;
    phone: string;

    constructor(id: number, name: string, email: string, phone: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    save(): void {
        // Logic to save customer data
    }

    static retrieve(id: number): Customer | null {
        // Logic to retrieve customer data by id
        return null; // Placeholder return
    }
}