export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: number;
    customerId: number;
    productIds: number[];
    totalAmount: number;
}