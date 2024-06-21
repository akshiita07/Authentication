# Authentication-Security

The "Authentication-Security" focuses on demonstrating various authentication and security techniques using Node.js, Express, and EJS. The project provides a simple structure to implement and test different levels of security in a web application.

### Files and Directories
1. **`app.js`**: Main server file that sets up the Express application, configures middleware, and handles routing.
2. **`package.json`**: Contains metadata about the project and its dependencies.
3. **`public/`**: Directory for static assets like CSS and client-side JavaScript.
4. **`views/`**: Directory for EJS templates used for rendering the UI.

### Level 1 Security Implementation
The Level 1 security implementation involves basic user registration and login functionality. 
#### `app.js`

1. **Setup and Configuration**:
   - Imports required modules (`express`, `body-parser`, `ejs`, `mongoose`).
   - Initializes the Express application and sets up the port.
   - Configures the application to use EJS as the templating engine, Body-Parser for parsing request bodies, and serves static files from the `public` directory.

2. **Routes**:
   - **GET `/`**: Renders the home page.
   - **GET `/register`**: Renders the registration page.
   - **GET `/login`**: Renders the login page.

3. **Database Connection**:
   - Connects to a MongoDB database named `userdb`.

4. **User Schema and Model**:
   - Defines a Mongoose schema and model for user data, including `email` and `password`.

5. **POST `/register`**:
   - Handles user registration by creating a new user with the provided email and password.
   - Saves the user to the database and renders the secret page upon successful registration.

6. **POST `/login`**:
   - Handles user login by verifying the provided email and password.
   - If the credentials are correct, renders the secret page; otherwise, logs an error message.

This code sets up a basic authentication system where users can register and login, with the user's data being stored in a MongoDB database. Upon successful registration or login, the user is directed to a secret page.
