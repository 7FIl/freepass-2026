# Canteen Order API Documentation

Base URL: `http://localhost:3000/api`

## Table of Contents
- [Authentication](#authentication)
- [Admin Management](#admin-management)
- [Canteen Management](#canteen-management)
- [Order Management](#order-management)

---

## Authentication

### 1. Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Rate Limit:** 5 requests per minute per IP

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "johndoe@gmail.com",
  "password": "Password123"
}
```

**Validation Rules:**
- `username`: 3-30 characters, letters, numbers, and underscores only
- `email`: Valid email from allowed domains (gmail.com, outlook.com, yahoo.com, etc.)
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "johndoe@gmail.com",
    "role": "USER",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 2. Login
Authenticate and receive a JWT token.

**Endpoint:** `POST /auth/login`

**Rate Limit:** 3 requests per minute per IP (brute force protection)

**Request Body:**
```json
{
  "email": "johndoe@gmail.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "johndoe@gmail.com",
      "role": "USER"
    }
  }
}
```

---

### 3. Update Profile
Update username or email. Requires authentication.

**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@gmail.com"
}
```

**Note:** At least one field must be provided.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "username": "newusername",
    "email": "newemail@gmail.com",
    "role": "USER",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 4. Change Password
Change user password. Requires authentication.

**Endpoint:** `PUT /auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Validation Rules:**
- `currentPassword`: Must match current password
- `newPassword`: Must be different from current password and meet password requirements (min 8 characters, uppercase, lowercase, number)

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Admin Management

**Note:** All admin routes require authentication and ADMIN role.

### 1. Create User
Create a new user with specific role (Admin only).

**Endpoint:** `POST /admin/users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@gmail.com",
  "password": "Password123",
  "role": "CANTEEN_OWNER"
}
```

**Allowed Roles:** `USER`, `CANTEEN_OWNER`, `ADMIN`

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "username": "newuser",
    "email": "newuser@gmail.com",
    "role": "CANTEEN_OWNER",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 2. Get All Users
Retrieve list of all users with optional filters.

**Endpoint:** `GET /admin/users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `role` (optional): Filter by role (`USER`, `CANTEEN_OWNER`, `ADMIN`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `GET /admin/users?role=CANTEEN_OWNER&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "user1",
        "email": "user1@gmail.com",
        "role": "CANTEEN_OWNER",
        "createdAt": "2026-02-05T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 3. Get User by ID
Get details of a specific user.

**Endpoint:** `GET /admin/users/:userId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "username": "user1",
    "email": "user1@gmail.com",
    "role": "USER",
    "createdAt": "2026-02-05T10:00:00.000Z",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 4. Update User
Update user details including role.

**Endpoint:** `PUT /admin/users/:userId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "updatedusername",
  "email": "updatedemail@gmail.com",
  "role": "CANTEEN_OWNER"
}
```

**Note:** All fields are optional. Provide only fields to update.

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "username": "updatedusername",
    "email": "updatedemail@gmail.com",
    "role": "CANTEEN_OWNER",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 5. Delete User
Delete a user account.

**Endpoint:** `DELETE /admin/users/:userId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6. Get Canteen Owners
Retrieve all users with CANTEEN_OWNER role.

**Endpoint:** `GET /admin/canteen-owners`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Canteen owners retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "username": "owner1",
      "email": "owner1@gmail.com",
      "role": "CANTEEN_OWNER",
      "createdAt": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

---

## Canteen Management

### 1. Create Canteen
Create a new canteen (Canteen Owner only).

**Endpoint:** `POST /canteens`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Request Body:**
```json
{
  "name": "Campus Canteen",
  "location": "Building A, Floor 1",
  "contactInfo": "+1234567890"
}
```

**Validation Rules:**
- `name`: 3-100 characters
- `location`: 5-200 characters
- `contactInfo`: 10-20 characters

**Response (201):**
```json
{
  "success": true,
  "message": "Canteen created successfully",
  "data": {
    "id": "uuid",
    "name": "Campus Canteen",
    "location": "Building A, Floor 1",
    "contactInfo": "+1234567890",
    "isOpen": false,
    "ownerId": "uuid",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 2. Get All Canteens
Get list of all canteens (Public).

**Endpoint:** `GET /canteens`

**Query Parameters:**
- `isOpen` (optional): Filter by status (`true`/`false`)

**Example:** `GET /canteens?isOpen=true`

**Response (200):**
```json
{
  "success": true,
  "message": "Canteens retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Campus Canteen",
      "location": "Building A, Floor 1",
      "contactInfo": "+1234567890",
      "isOpen": true,
      "ownerId": "uuid",
      "createdAt": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Canteen by ID
Get details of a specific canteen (Public).

**Endpoint:** `GET /canteens/:canteenId`

**Response (200):**
```json
{
  "success": true,
  "message": "Canteen retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Campus Canteen",
    "location": "Building A, Floor 1",
    "contactInfo": "+1234567890",
    "isOpen": true,
    "ownerId": "uuid",
    "createdAt": "2026-02-05T10:00:00.000Z",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 4. Update Canteen
Update canteen details (Owner only).

**Endpoint:** `PUT /canteens/:canteenId`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Authorization:** Only the canteen owner or ADMIN can update the canteen. The system verifies ownership before allowing updates.

**Request Body:**
```json
{
  "name": "Updated Canteen Name",
  "location": "New Location",
  "contactInfo": "+9876543210",
  "isOpen": true
}
```

**Note:** All fields are optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Canteen updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Canteen Name",
    "location": "New Location",
    "contactInfo": "+9876543210",
    "isOpen": true,
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 5. Toggle Canteen Status
Toggle isOpen status (Owner only).

**Endpoint:** `POST /canteens/:canteenId/toggle-status`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Canteen status updated successfully",
  "data": {
    "id": "uuid",
    "name": "Campus Canteen",
    "isOpen": true
  }
}
```

---

### 6. Create Menu Item
Add a new menu item to canteen (Owner only).

**Endpoint:** `POST /canteens/:canteenId/menu`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Request Body:**
```json
{
  "name": "Burger",
  "description": "Beef burger with cheese",
  "price": 5.99,
  "category": "Main Course",
  "isAvailable": true,
  "imageUrl": "https://example.com/burger.jpg"
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `description`: Optional, max 500 characters
- `price`: Positive number
- `category`: 2-50 characters
- `imageUrl`: Optional, valid URL

**Response (201):**
```json
{
  "success": true,
  "message": "Menu item created successfully",
  "data": {
    "id": "uuid",
    "name": "Burger",
    "description": "Beef burger with cheese",
    "price": 5.99,
    "category": "Main Course",
    "isAvailable": true,
    "imageUrl": "https://example.com/burger.jpg",
    "canteenId": "uuid",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 7. Get Menu Items
Get all menu items for a canteen (Public).

**Endpoint:** `GET /canteens/:canteenId/menu`

**Query Parameters:**
- `category` (optional): Filter by category
- `isAvailable` (optional): Filter by availability (`true`/`false`)

**Example:** `GET /canteens/uuid/menu?category=Main%20Course&isAvailable=true`

**Response (200):**
```json
{
  "success": true,
  "message": "Menu items retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Burger",
      "description": "Beef burger with cheese",
      "price": 5.99,
      "category": "Main Course",
      "isAvailable": true,
      "imageUrl": "https://example.com/burger.jpg",
      "canteenId": "uuid",
      "createdAt": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

---

### 8. Update Menu Item
Update menu item details (Owner only).

**Endpoint:** `PUT /canteens/:canteenId/menu/:menuItemId`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Request Body:**
```json
{
  "name": "Cheeseburger",
  "price": 6.99,
  "isAvailable": false
}
```

**Note:** All fields are optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Menu item updated successfully",
  "data": {
    "id": "uuid",
    "name": "Cheeseburger",
    "price": 6.99,
    "isAvailable": false,
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 9. Delete Menu Item
Delete a menu item (Owner only).

**Endpoint:** `DELETE /canteens/:canteenId/menu/:menuItemId`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

---

## Order Management

### 1. Create Order
Create a new order from a canteen (Authenticated users).

**Endpoint:** `POST /orders/:canteenId`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2
    },
    {
      "menuItemId": "uuid2",
      "quantity": 1
    }
  ],
  "notes": "No onions please"
}
```

**Validation Rules:**
- `items`: Array with at least 1 item
- `menuItemId`: Valid UUID
- `quantity`: Positive integer
- `notes`: Optional, max 500 characters

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "canteenId": "uuid",
    "totalAmount": 18.97,
    "status": "PENDING",
    "notes": "No onions please",
    "items": [
      {
        "id": "uuid",
        "menuItemId": "uuid",
        "quantity": 2,
        "price": 5.99,
        "menuItem": {
          "name": "Burger"
        }
      }
    ],
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 2. Get User Orders
Get all orders for authenticated user with pagination.

**Endpoint:** `GET /orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by order status (`WAITING`, `COOKING`, `READY`, `COMPLETED`)
- `paymentStatus` (optional): Filter by payment status (`UNPAID`, `PAID`)

**Examples:**
- `GET /orders?page=1&limit=10` - Get all orders
- `GET /orders?paymentStatus=UNPAID` - Get pending/unpaid transactions
- `GET /orders?status=WAITING&paymentStatus=PAID` - Get paid orders waiting to be cooked
- `GET /orders?status=COMPLETED&page=2&limit=20` - Get completed orders (page 2)

**Response (200):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "canteenId": "uuid",
      "totalPrice": 18.97,
      "status": "WAITING",
      "paymentStatus": "PAID",
      "createdAt": "2026-02-05T10:00:00.000Z",
      "canteen": {
        "id": "uuid",
        "name": "Campus Canteen"
      },
      "items": [
        {
          "id": "uuid",
          "menuItemId": "uuid",
          "quantity": 2,
          "price": 11.98,
          "menuItem": {
            "id": "uuid",
            "name": "Burger",
            "price": 5.99
          }
        }
      ],
      "payment": {
        "id": "uuid",
        "amount": 18.97,
        "status": "SUCCESS"
      },
      "review": null
    }
  ],
  "pagination": {
    "total": 45,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### 3. Get Canteen Orders
Get all orders for a specific canteen (Owner only).

**Endpoint:** `GET /orders/canteen/:canteenId`

**Headers:**
```
Authorization: Bearer <canteen_owner_token>
```

**Query Parameters:**
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "totalAmount": 18.97,
      "status": "PENDING",
      "notes": "No onions please",
      "createdAt": "2026-02-05T10:00:00.000Z",
      "user": {
        "username": "johndoe",
        "email": "johndoe@gmail.com"
      },
      "items": [
        {
          "menuItemId": "uuid",
          "quantity": 2,
          "price": 5.99,
          "menuItem": {
            "name": "Burger"
          }
        }
      ]
    }
  ]
}
```

---

### 4. Update Order Status
Update order status (Owner for their canteen, User for cancellation).

**Endpoint:** `PUT /orders/:orderId/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Authorization:** Only the canteen owner (verified by ownership) or ADMIN can update order status. The order must be paid before the owner can change the status.

**Request Body:**
```json
{
  "status": "PREPARING"
}
```

**Important:** The order payment must be completed (`paymentStatus: PAID`) before the canteen owner can update the order status. This ensures customers pay before food preparation begins.

**Allowed Status Transitions:**
- User can: `PENDING` → `CANCELLED`
- Owner can (after payment): `PENDING` → `PREPARING` → `READY` → `COMPLETED`

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": "uuid",
    "status": "PREPARING",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 5. Make Payment
Create a payment for an order (User only).

**Endpoint:** `POST /orders/:orderId/payment`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 18.97,
  "paymentMethod": "CASH",
  "transactionId": "TXN123456"
}
```

**Payment Methods:** `CASH`, `CARD`, `DIGITAL_WALLET`

**Validation Rules:**
- `amount`: Must match order total amount
- `paymentMethod`: Required
- `transactionId`: Optional for CASH, required for others

**Response (201):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 18.97,
    "paymentMethod": "CASH",
    "transactionId": "TXN123456",
    "status": "COMPLETED",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 6. Create Review
Add a review for a completed order (User only).

**Endpoint:** `POST /orders/:orderId/review`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great food and fast service!"
}
```

**Validation Rules:**
- `rating`: Integer between 1 and 5
- `comment`: Optional, max 500 characters
- Order must be COMPLETED
- Only one review per order

**Response (201):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "userId": "uuid",
    "canteenId": "uuid",
    "rating": 5,
    "comment": "Great food and fast service!",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

### 7. Get Canteen Reviews
Get all reviews for a canteen (Public).

**Endpoint:** `GET /orders/canteen/:canteenId/reviews`

**Response (200):**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great food and fast service!",
      "createdAt": "2026-02-05T10:00:00.000Z",
      "user": {
        "username": "johndoe"
      }
    }
  ]
}
```

---

### 8. Delete Review
Delete a review (Admin or Review owner).

**Endpoint:** `DELETE /orders/review/:reviewId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Forbidden: Admin access required"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Rate Limit (429)

**Registration Rate Limit:**
```json
{
  "success": false,
  "message": "Too many registration attempts from this IP, please try again after a minute"
}
```

**Login Rate Limit (Brute Force Protection):**
```json
{
  "success": false,
  "message": "Too many login attempts from this IP, please try again after a minute"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## User Roles

### USER
- Create orders
- View their own orders
- Make payments
- Create reviews for their orders
- Update profile and change password

### CANTEEN_OWNER
- All USER permissions
- Create and manage canteens (own canteens only)
- Create, update, and delete menu items
- View orders for their canteens
- Update order status for their canteens
- Toggle canteen open/closed status

### ADMIN
- All permissions
- Create users with any role
- View, update, and delete any user
- Delete any review
- View all canteen owners

---

## Authentication

Most endpoints require authentication using JWT (JSON Web Token).

**Environment Requirement:**
- `JWT_SECRET` environment variable **must be set** for the API to start
- Minimum 32 characters recommended for production
- Application will throw an error on startup if JWT_SECRET is missing

**How to authenticate:**
1. Login using `/auth/login` to get a token
2. Include the token in the Authorization header for protected routes:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

**Token expiration:** 24 hours

---

## Rate Limiting

**Registration endpoint** (`POST /auth/register`): Limited to 5 requests per minute per IP address.

---

## Allowed Email Domains

The following email domains are allowed for registration:
- gmail.com
- icloud.com, me.com, mac.com
- outlook.com, hotmail.com, live.com, msn.com
- yahoo.com
- student.ub.ac.id, ub.ac.id (University of Brawijaya)
- 163.com, 126.com, qq.com
- yandex.ru
- mail.ru
- proton.me, protonmail.com
