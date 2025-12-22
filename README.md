# Simple ERP System

This is a hyper-simplistic ERP system designed specifically for small businesses. The focus is on ease of use and simplicity, allowing users to manage customers, inventory, and orders with minimal effort.

## Features

- **Customer Management**: Create, update, and delete customer records.
- **Inventory Management**: Add, update, and remove products from inventory.
- **Order Processing**: Manage customer orders efficiently.
- **Reporting**: Generate sales and inventory reports.

## Project Structure

```
simple-erp
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── customers.ts
│   │   ├── inventory.ts
│   │   ├── orders.ts
│   │   └── reports.ts
│   ├── models
│   │   ├── Customer.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── routes
│   │   ├── customers.ts
│   │   ├── inventory.ts
│   │   ├── orders.ts
│   │   └── reports.ts
│   ├── services
│   │   ├── customerService.ts
│   │   ├── inventoryService.ts
│   │   └── orderService.ts
│   └── types
│       └── index.ts
├── public
│   ├── css
│   │   └── styles.css
│   └── js
│       └── main.js
├── views
│   ├── customers.html
│   ├── dashboard.html
│   ├── inventory.html
│   └── orders.html
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd simple-erp
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```

Visit `http://localhost:3000` in your web browser to access the ERP system.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.