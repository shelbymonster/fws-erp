export class InventoryController {
    private products: any[] = [];

    addProduct(product: any) {
        this.products.push(product);
        return product;
    }

    getProducts() {
        return this.products;
    }

    updateProduct(productId: number, updatedProduct: any) {
        const index = this.products.findIndex(product => product.id === productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedProduct };
            return this.products[index];
        }
        return null;
    }

    deleteProduct(productId: number) {
        const index = this.products.findIndex(product => product.id === productId);
        if (index !== -1) {
            return this.products.splice(index, 1)[0];
        }
        return null;
    }
}