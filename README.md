# Adilabad Backend

This repository contains the backend implementation for the Adilabad project.

## Features

- **Express.js Server**: Backend server framework.
- **MySQL Database**: Storage for category and user data.
- **File Uploads**: Support for file uploads with `uploads` directory.
- **RESTful API**: Endpoints for managing categories and users.
- **Error Handling**: Middleware for handling server errors.
- **Security**: Uses bcrypt for password hashing and JWT for authentication.

## Prerequisites

- Node.js and npm installed locally.
- MySQL database running (not mandetory).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/quantum-brize/Adilabad-Backend.git
   cd adilabad-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   nodemon
   ```
   or
    ```bash
   nodemon index.js
   ```

   The server will run on `http://localhost:5000`.

## Configuration

- `config/config.js`: Contains frontend URL and other configurations.
- `config/config.json`: Example configuration for database connection.

## API Endpoints

- **USER        /api/user/**:
- **CATEGORY    /api/category/**:
- **ADMIN       /api/admin/**:


## Directory Structure
```
├── config/
│   ├── config.js
├── controllers/
├── database/
|   ├──db.js
├── middleware/
├── models/
├── node_modules/
├── routes/
├── uploads/
├── .gitignore
├── index.js
├── package-lock.json
├── package.json
└── README.md
```

- Middleware handles errors with a generic message for 500 status.

## Dependencies

- `express`: Web server framework.
- `bcryptjs`: Password hashing.
- `cors`: Cross-Origin Resource Sharing middleware.
- `dotenv`: Environment variables management.
- `express-validator`: Validation for incoming requests.
- `jsonwebtoken`: Authentication using JSON Web Tokens.
- `mysql`: MySQL database connection.
- `uid`: Unique ID generation.

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details.

## Authors

- <img
      style="height:50px; max-width:100%; border-radius: 100px;"
      src="https://avatars.githubusercontent.com/u/81762448?s=400&u=bcddeef46e22f0ce099721e9c774207b1f04f954&v=4"/> - [Sk Rohan](https://github.com/skrohan0420)


---


