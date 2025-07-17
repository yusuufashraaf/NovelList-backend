# NovelNest Backend (Under Development)

## Technology & features[mongo DB,node js,express js,socket io,OAuth2 ,gen Ai, angular ,bootstrap]

Welcome to the backend of **NovelNest**, a bookstore application. This project provides RESTful APIs for managing users, products, orders, and other functionalities required for the bookstore.

## Project Structure

```
.eslintrc.json
.gitignore
index.js
package.json
swagger.json
.vscode/
    launch.json
config/
    connectDB.js
    passport.js
controllers/
    authController.js
    brandController.js
    cartController.js
    categoryController.js
    commentController.js
    contactController.js
    orderController.js
    paypalController.js
    productController.js
    subCategoryController.js
    userController.js
    wishlistController.js
middlewares/
    Authenticate.js
models/
routes/
services/
src/
uploads/
utils/
```

### Key Files and Directories

- **`src/app.js`**: Main entry point for the application. Configures middleware, routes, and error handling.
- **`routes/`**: Contains route definitions for various resources like users, products, orders, etc.
- **`controllers/`**: Contains business logic for handling requests.
- **`middlewares/`**: Middleware for authentication and error handling.
- **`config/`**: Configuration files for database and passport authentication.
- **`swagger.json`**: Swagger documentation for API endpoints.

## Features

- **User Authentication**: Passport.js integration for secure user authentication.
- **Product Management**: APIs for managing products, categories, and subcategories.
- **Order Management**: APIs for handling orders and payments (PayPal integration).
- **Wishlist and Cart**: APIs for managing user wishlists and carts.
- **Comments and Reviews**: APIs for adding comments and reviews to products.
- **Contact Us**: Endpoint for user inquiries.
- **Swagger Documentation**: Interactive API documentation available at `/api-docs`.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/NovelNest-backend.git
   cd NovelNest-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

### User Routes
- `POST /api/v1/auth/register`: Register a new user.
- `POST /api/v1/auth/login`: Login a user.

### Product Routes
- `GET /api/v1/products`: Get all products.
- `POST /api/v1/products`: Add a new product.

### Order Routes
- `POST /api/v1/orders`: Create a new order.
- `GET /api/v1/orders`: Get all orders.

### Wishlist Routes
- `GET /api/v1/wishlist`: Get user's wishlist.
- `POST /api/v1/wishlist`: Add an item to the wishlist.

### Cart Routes
- `GET /api/v1/cart`: Get user's cart.
- `POST /api/v1/cart`: Add an item to the cart.

### Contact Us
- `POST /api/v1/contactUs`: Submit a contact form.

### Swagger Documentation
Access the API documentation at `/api-docs`.

## Error Handling

- **404 Errors**: Routes not found are handled with a custom error message.
- **Global Error Handler**: All errors are processed and returned in a structured format.

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.

## License

This project is licensed under the MIT License.
