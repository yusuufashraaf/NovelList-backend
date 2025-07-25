# 📚 NovelNest - Modern Online Bookstore API

Welcome to the official documentation for **NovelNest** — a secure, scalable, and feature-rich e-commerce API designed for modern online bookstores. Powered by **Node.js**, **Express**, and **MongoDB**, NovelNest provides everything from authentication and product management to real-time admin alerts and secure payment handling.

---

## 🧽 Table of Contents

- [🚀 Features](#-features)
- [🛠 Installation](#-installation)
- [🔐 Environment Variables](#-environment-variables)
- [📦 Usage](#-usage)
- [📡 API Endpoints](#-api-endpoints)
- [🔒 Authentication & Authorization](#-authentication--authorization)
- [⚙️ Technologies Used](#-technologies-used)
- [❌ Error Handling](#-error-handling)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📬 Contact](#-contact)
- [🚀 Deployment](#-deployment)
- [🔮 Future Enhancements](#-future-enhancements)
- [📄 License](#-license)

---

## 🚀 Features

✅ User authentication with JWT and OAuth (Google & GitHub)  
✅ Role-Based Access Control (`user` / `admin`)  
✅ Full CRUD for books, categories & subcategories  
✅ Cart, wishlist, and order tracking  
✅ Ratings, reviews & comment moderation  
✅ Real-time notifications with **Socket.io**  
✅ Advanced search, filtering & pagination  
✅ Secure file uploads with **Multer + Cloudinary**  
✅ Integrated PayPal payments  
✅ Clean and scalable project structure

---

## 🛠 Installation

```bash
git clone https://github.com/yusuufashraaf/novelnest.git
cd novelnest
npm install
```

Create a `.env` file as described below and then run:

```bash
npm run dev   # Start in development mode
npm start     # Start in production
```

---

## 🔐 Environment Variables

Create a `.env` file at the root with the following values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_EMAIL=your_email@example.com
SMTP_PASSWORD=your_password

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GITHUB_CLIENT_ID=github_client_id
GITHUB_CLIENT_SECRET=github_client_secret

FRONTEND_URL=https://your-frontend.com
BACKEND_URL=https://your-backend.com
```

> 🛡️ **Important:** Never commit `.env` to version control.

---

## 📦 Usage

- Base API URL: `http://localhost:5000/api/`
- Use tools like **Postman**, **Insomnia**, or **cURL**
- For protected routes, include the header:
  ```
  Authorization: Bearer <token>
  ```
- Use `multipart/form-data` when uploading files (images or PDFs)

---

## 📡 API Endpoints

### 🔑 Auth

| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| POST   | `/api/auth/signup` | Register a new user |
| POST   | `/api/auth/login`  | User login & JWT    |
| POST   | `/api/auth/google` | Google OAuth        |
| GET    | `/api/auth/github` | GitHub OAuth        |

### 👤 Users

| Method | Endpoint                     | Description                     |
| ------ | ---------------------------- | ------------------------------- |
| GET    | `/api/users/profile`         | Get current user profile        |
| PUT    | `/api/users/profile`         | Update profile (name/email/etc) |
| POST   | `/api/users/send-otp`        | Send OTP for password reset     |
| POST   | `/api/users/verify-otp`      | Verify OTP                      |
| POST   | `/api/users/forgot-password` | Start password reset            |
| PUT    | `/api/users/reset-password`  | Reset password using OTP        |

### 📚 Products

| Method | Endpoint                | Description                       |
| ------ | ----------------------- | --------------------------------- |
| GET    | `/api/products`         | Get all products                  |
| GET    | `/api/products/:id`     | Get a specific product            |
| POST   | `/api/products`         | Add a product (admin/author only) |
| PUT    | `/api/products/:id`     | Update a product                  |
| DELETE | `/api/products/:id`     | Delete a product                  |
| GET    | `/api/products/genres`  | Get unique genres                 |
| GET    | `/api/products/authors` | Get unique authors                |

### 📂 Categories

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| GET    | `/api/categories` | Get all categories       |
| POST   | `/api/categories` | Add new category (admin) |

### ❤️ Wishlist

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| GET    | `/api/wishlist`            | Get user's wishlist       |
| POST   | `/api/wishlist/:productId` | Add item to wishlist      |
| DELETE | `/api/wishlist/:productId` | Remove item from wishlist |

### 🛒 Cart

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| GET    | `/api/cart`            | Get cart items        |
| POST   | `/api/cart`            | Add item to cart      |
| PUT    | `/api/cart`            | Update item quantity  |
| DELETE | `/api/cart/:productId` | Remove item from cart |

### 💳 Orders

| Method | Endpoint               | Description                      |
| ------ | ---------------------- | -------------------------------- |
| POST   | `/api/orders`          | Place a new order                |
| GET    | `/api/orders`          | Get user’s orders                |
| GET    | `/api/orders/:orderId` | Get a specific order             |
| GET    | `/api/orders/admin`    | Admin: get all orders            |
| PUT    | `/api/orders/:orderId` | Update order status (admin only) |

### 💬 Comments & Reviews

| Method | Endpoint                           | Description                          |
| ------ | ---------------------------------- | ------------------------------------ |
| POST   | `/api/comments`                    | Add comment/review                   |
| GET    | `/api/comments/product/:productId` | Get all comments for a product       |
| GET    | `/api/comments/ratings/all`        | Get average ratings for all products |
| GET    | `/api/comments/admin/all`          | Admin: get all comments              |
| DELETE | `/api/comments/:commentId`         | Delete comment (admin or owner only) |

---

## 🔒 Authentication & Authorization

Authentication is powered by **JWT** and **OAuth**.

**Authorization Roles:**

- `user`: Access to cart, orders, profile
- `admin`: Full access to all resources

### 🔁 Auth Flow:

1. Register/Login ➔ Get JWT token
2. Add token in requests to protected endpoints
3. Middleware validates token and sets user info
4. Access control enforced based on roles

---

## ⚙️ Technologies Used

| Tech Stack                  | Usage                      |
| --------------------------- | -------------------------- |
| **Node.js**                 | Runtime                    |
| **Express.js**              | Web framework              |
| **MongoDB**                 | Database                   |
| **Mongoose**                | ODM                        |
| **JWT** / `bcrypt`          | Auth & encryption          |
| **Multer** + **Cloudinary** | File Uploads               |
| **Socket.io**               | Real-time admin alerts     |
| **Nodemailer**              | Emails                     |
| **Passport.js**             | OAuth with Google & GitHub |

---

## ❌ Error Handling

Standard error format for consistency:

```json
{
  "status": "fail",
  "message": "Email is required"
}
```

Includes:

- Centralized error middleware
- Mongoose errors (validation, duplicates, cast errors)
- Custom API error classes

---

## 🧪 Testing

- 🔧 **Manual**: Postman / Insomnia
- 🤪 **Unit**: Jest / Mocha + Chai
- 🔌 **Integration**: Supertest
- 🦮 **E2E**: Simulated user flows
- 🔄 **Mocks**: For emails & external APIs

---

## 🤝 Contributing

We welcome contributions! 🙌

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

✅ Use [Conventional Commits](https://www.conventionalcommits.org/)  
✅ Include tests & update docs when needed  
✅ Open a PR and describe your changes clearly

---

## 📬 Contact

- 📧 Email: [yusuufahsraaf@gmail.com](mailto:yusuufahsraaf@gmail.com)
- 🐛 Issues: [GitHub Issue Tracker](https://github.com/yusuufashraaf/novelnest/issues)

---

## 🚀 Deployment

- Recommended Platforms: **Render**, **Vercel**, **Heroku**, **AWS**
- Add environment variables via dashboard
- Set `NODE_ENV=production`

Example `Procfile`:

```
web: npm start
```

---

## 🔮 Future Enhancements

- [ ] GraphQL API support
- [ ] Stripe/PayPal hybrid payment support
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Improved testing coverage

---

## 📄 License

This project is licensed under the **MIT License**.

---

> Made with 💛 for book lovers. Happy building with **NovelNest**!  
> 📖🛍️
