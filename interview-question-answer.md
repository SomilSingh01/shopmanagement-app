# Fullstack Engineering Interview Q&A

This document contains common architectural interview questions based on the ShopManager application. Use this to prepare for senior-level backend and fullstack engineering interviews.

---

### Q1: Why did you choose MySQL instead of MongoDB (NoSQL) for this project?
**Answer:**
"I chose a Relational Database (MySQL) because an e-commerce platform relies heavily on **highly structured, related data**. For example, an `Order` must be strictly tied to a `User`, a `Customer`, and multiple `Products`. MySQL guarantees **ACID compliance** (Atomicity, Consistency, Isolation, Durability). This ensures that if a user places an order, the database won't accidentally subtract the inventory without actually saving the order. MongoDB (NoSQL) is great for unstructured data, but for financial transactions and strict inventory management, relational SQL databases are the absolute industry standard."

---

### Q2: Why are you running your database inside a Docker container instead of installing MySQL directly on your machine?
**Answer:**
"Using a `docker-compose.yml` file guarantees **environment consistency**. If another developer joins my team, they don't have to spend hours configuring MySQL on their machine—they just run `docker-compose up` and get the exact same database version, ports, and credentials that I am using. Furthermore, when it's time to deploy to production, Docker makes the application completely portable, scalable, and independent of the host operating system."

---

### Q3: Why use Prisma ORM instead of writing raw SQL queries or using an older tool like Sequelize?
**Answer:**
"Prisma is currently the industry standard for TypeScript backends for two massive reasons: **Type-Safety** and **Developer Velocity**. 
1. When I define my models in `schema.prisma`, Prisma automatically generates strict TypeScript types for my entire database. If I try to save an Order but misspell a column name, my compiler throws an error *before* the code ever runs. 
2. Prisma prevents **SQL Injection** attacks natively out of the box. 
3. It handles database migrations beautifully. Instead of writing complex `ALTER TABLE` SQL scripts manually, I update my schema file, and Prisma automatically calculates the differences and safely applies them."

---

### Q4: How did you design the database schema for the Orders?
**Answer:**
"I designed the schema using standard normalized relational principles. 
- A `User` has a **One-to-Many** relationship with `Orders`.
- Because an `Order` can have many `Products`, and a `Product` can belong to many `Orders`, this is a **Many-to-Many** relationship. 
- I handled this by creating a join table called `OrderItem`. The `OrderItem` table is critical because it doesn't just link the product and the order—it also tracks the *quantity* and the locked-in *price* of the product at the exact moment of purchase. If a product's price changes next month, historical receipts remain perfectly intact."

---

### Q5: How did you secure user passwords? Why did you use Bcrypt?
**Answer:**
"I used the `bcryptjs` library to hash passwords before storing them in the database. Bcrypt is an industry standard because it doesn't just hash the password; it automatically generates and incorporates a 'salt' (random data). This salt protects the passwords against rainbow table attacks. Furthermore, Bcrypt is computationally intensive by design, which slows down brute-force attacks significantly compared to older algorithms like MD5 or SHA-256."

---

### Q6: What is a JWT and why did you choose it for your authentication strategy?
**Answer:**
"JWT stands for JSON Web Token. I chose it because it enables **stateless authentication**. In traditional session-based auth, the server has to remember every logged-in user in its memory (or a database/Redis), which becomes a bottleneck when scaling to 10,000+ users. With JWTs, the token itself contains the user's ID cryptographically signed by the server. When the server receives a request with a token, it can instantly verify its authenticity mathematically without ever having to look up a session in a database. This allows the API to scale horizontally with ease."

---

### Q7: How do you protect certain API routes so only logged-in users can access them?
**Answer:**
"I built a custom Express middleware called `authenticate`. This function intercepts the incoming HTTP request before it reaches the controller logic. It checks the `Authorization` header for a Bearer token. If the token is missing or invalid, the middleware rejects the request with a `401 Unauthorized` status. If the token is valid, it decodes the payload (the user's ID), attaches it to the `req.user` object, and calls `next()` to pass control to the actual controller. This keeps the controllers clean and ensures security is handled at the network boundary."

---

### Q8: How do you handle JWT expiration, and what is a Refresh Token?
**Answer:**
"For security, JWTs should be short-lived (e.g., 15 minutes to 1 hour) so that if a token is stolen, the attacker has limited time to use it. When the token expires, the user would normally be logged out. To prevent poor user experience, we implement a **Refresh Token strategy**. The server issues a short-lived Access Token and a long-lived Refresh Token (stored securely, often as an HttpOnly cookie). When the Access Token expires, the frontend silently sends the Refresh Token to a special `/refresh` endpoint to get a brand new Access Token without the user having to re-enter their password."

---

### Q9: Why did you use Zod to validate the login and registration requests?
**Answer:**
"Validating user input is the first rule of backend security. I used Zod because it provides strict, declarative schema validation that perfectly integrates with TypeScript. Instead of writing dozens of manual `if (!req.body.email) ...` checks, I define a Zod schema. If a malicious user sends a payload missing an email, or an overly long string designed to crash the database, Zod intercepts it at the controller level and automatically returns a clean `400 Bad Request` error. This guarantees that my database and business logic only ever receive perfectly formatted data."

---

### Q10: Where is the safest place to store a JWT on the frontend?
**Answer:**
"Storing JWTs in `localStorage` is very common, but it exposes the app to **XSS (Cross-Site Scripting)** attacks, because any malicious JavaScript running on the page can steal the token. For a highly secure, enterprise-grade application, the best practice is to store the JWT inside an **HttpOnly, Secure cookie**. HttpOnly cookies cannot be read by JavaScript at all, completely eliminating the XSS threat. However, when using cookies, you must then implement **CSRF (Cross-Site Request Forgery)** tokens to prevent malicious sites from forging requests."

---

### Q11: Why did you separate the Authentication logic into an `AuthService` rather than putting it all in the `AuthController`?
**Answer:**
"This follows the **N-Tier Architecture** and **Single Responsibility Principle**. Controllers should only care about HTTP (reading requests and sending responses). Services should care about the actual business logic (hashing passwords, signing tokens). By keeping them separate, my code becomes highly reusable. For example, if I later build an internal CLI tool or a background job that needs to hash a password, I can just call `AuthService.hashPassword()` without having to mock an HTTP Request and Response object."

---

## Fundamentals (1.5 Years Experience Level)

### Q12: What is a REST API?
**Answer:**
"REST (Representational State Transfer) is a standard architecture for building web APIs. It relies on standard HTTP methods to perform operations on resources (data). For example, in our app, we use `GET /api/v1/products` to fetch products, `POST /api/v1/auth/register` to create a user, and `DELETE /api/v1/products/:id` to delete a product. It makes communication between the React frontend and Node.js backend predictable and standardized."

---

### Q13: What is Express.js, and why do we use it instead of just raw Node.js?
**Answer:**
"Node.js has built-in modules to create a web server, but doing so manually requires writing a lot of complex, repetitive code to handle URL parsing, reading headers, and managing routes. Express.js is a lightweight framework built on top of Node.js. It gives us simple tools like `app.get()`, a highly effective middleware system, and easy JSON response handling (`res.json()`), allowing us to focus on business logic rather than server mechanics."

---

### Q14: Why do we use Environment Variables (a `.env` file)?
**Answer:**
"Environment variables keep sensitive information (like our `DATABASE_URL` and `JWT_SECRET`) out of the actual source code. If we hardcoded our database password into `prisma.config.ts`, anyone who looks at our GitHub repository could steal our data. By using a `.env` file (and adding it to `.gitignore`), we ensure that passwords stay securely on our local machine or our production server, but never in version control."

---

### Q15: What is Middleware in Express?
**Answer:**
"Middleware is simply a function that runs *between* receiving an incoming request and sending the final response. It has access to the `req` (request) and `res` (response) objects, as well as a `next()` function to pass control to the next step. In our app, we use middleware for global things like `cors()` (allowing our React app to talk to the backend) and `express.json()` (to parse JSON bodies), as well as specific things like our `authenticate` function to block unauthorized users."

---

## Phase 4: Core Business Logic

### Q16: How did you ensure the database remains consistent when creating a complex Order?
**Answer:**
"Creating an Order is a multi-step process: we have to save the `Order` record, and then save multiple `OrderItem` records. If the server crashes in the middle, we could end up with an Order that has no items, which corrupts the database. I solved this by using **Database Transactions** via Prisma (`items: { create: [...] }`). A transaction guarantees that either *all* the records are saved successfully, or *none* of them are. If saving the items fails, the entire order is rolled back automatically, keeping the database in a perfectly valid state."

---

### Q17: Why do we recalculate the Order Total on the backend instead of just accepting the total sent by the frontend?
**Answer:**
"Never trust the client! If we rely on the frontend to send the `total` price, a malicious user could modify the HTTP request before it leaves their browser and set their $500 order total to $1. To prevent this, the frontend only sends the product IDs and quantities. The backend controller iterates through those items, multiplies the quantity by the known price, and calculates the true total itself before saving to the database."

---

### Q18: You used `PATCH` for updating the Order Status instead of `PUT`. What is the difference?
**Answer:**
"In REST API design, `PUT` is used to completely replace an entire resource. If I use `PUT`, I expect the client to send the entire order object (total, customer ID, items, status). `PATCH` is used for **partial updates**. Since we are only updating a single specific field (the `status` from PENDING to SHIPPED), `PATCH /orders/:id/status` is the semantically correct HTTP method."

---

## Phase 5: Dashboard & Aggregation

### Q19: How did you calculate the total revenue for the dashboard? Why didn't you just fetch all orders and sum them up in JavaScript?
**Answer:**
"I used **Prisma Aggregations** (`prisma.order.aggregate({ _sum: { total: true } })`) to calculate the revenue directly inside the MySQL database. If I fetched all the orders into Node.js and used `array.reduce()` to sum them up, it would work fine for 100 orders. But if the store scales to 10,000+ orders, pulling millions of rows into Node.js memory would cause a massive memory leak and crash the server. Offloading the heavy math to the SQL engine is infinitely more scalable and faster."

---

### Q20: When building the dashboard, you created endpoints for 'Recent Orders' and 'Low Stock Alerts'. How did you optimize these queries?
**Answer:**
"I optimized them by using **Pagination/Limits** and **Targeted Selects**. For recent orders, I used `take: 5` and `orderBy: { createdAt: 'desc' }`. This ensures the database only sends exactly 5 rows over the network, rather than sending thousands of rows that the frontend has to filter. I also used Prisma's `select` feature to only fetch the Customer's Name and Email, completely omitting unnecessary data (like their password hashes or unrelated IDs) to minimize the network payload size."

---

## Phase 6: Connecting & Scaling (Frontend to Backend)

### Q21: How exactly does your React frontend communicate with your Node.js backend?
**Answer:**
"The frontend and backend are completely separate applications running on different ports (or different servers entirely). They communicate via HTTP requests over the network. In my React app, I use a library called `axios`. I configure a base URL (e.g., `http://localhost:5000/api/v1`) in an `api.ts` file. Whenever a user clicks a button, React triggers an Axios request over the network to that URL, the Node backend processes it, interacts with MySQL, and sends a JSON response back over the network to React."

---

### Q22: What is CORS, and why did you have to configure it on your backend?
**Answer:**
"CORS stands for **Cross-Origin Resource Sharing**. By default, web browsers have a strict security policy that prevents a website running on one domain (like `localhost:5173`) from making API requests to a completely different domain (like `localhost:5000`). To fix this, I added the `cors()` middleware to my Express backend. This acts like a 'bouncer' at the door—it tells the browser, 'I explicitly trust requests coming from this React app, please allow them through.'"

---

### Q23: How do you attach the JWT token to your API requests without doing it manually every single time?
**Answer:**
"I use an **Axios Request Interceptor**. Instead of manually passing the token into every single `axios.get()` or `axios.post()` call across the entire frontend, I configure an interceptor in my API client setup. This interceptor automatically pauses every single outgoing request, reads the JWT from `localStorage`, and injects it into the `Authorization: Bearer <token>` HTTP header. This keeps the frontend code incredibly clean and DRY (Don't Repeat Yourself)."

---

## Phase 7: Database Management & Tooling

### Q24: Since your database is running inside a Docker container without a screen, how do you actually look at your data, delete records, or run manual queries?
**Answer:**
"There are two main ways I interact with my raw database. The first and fastest way is using **Prisma Studio** (`npx prisma studio`). This launches a modern, web-based graphical interface right in my browser where I can view, add, update, or delete rows visually without writing raw SQL. The second way, for writing complex manual SQL queries, is using a dedicated Database Client (like **DBeaver** or **MySQL Workbench**). Because I mapped port `3306` in my `docker-compose.yml`, I can connect these clients directly to `localhost:3306` and interact with the database just like any normal remote server."

---

### Q25: Which is the true "Industry Standard" for managing a database: Prisma Studio or a dedicated SQL Client like DBeaver? Why?
**Answer:**
"Both are industry standards, but they serve different purposes. Modern full-stack developers use **Prisma Studio** for daily development because it is fast, visual, and safe for simple data entry or debugging. However, **Dedicated SQL Clients (like DBeaver)** are the standard for Backend Engineers and Database Administrators (DBAs). Prisma Studio is limited—you cannot run raw SQL, export massive CSV dumps, analyze query execution plans, or manage database user permissions. For complex analytics, heavy migrations, or writing highly optimized `JOIN` statements, a dedicated SQL Client is absolutely mandatory."

---

### Q26: In our Express backend, we used Prisma (an ORM). Why didn't we just write raw SQL queries directly in our code? Is Prisma used in the real industry?
**Answer:**
"Prisma is an absolute industry standard right now for modern TypeScript applications. While writing raw SQL is fine for small scripts, doing it in a large enterprise app is incredibly dangerous and error-prone. Prisma provides **Type Safety**; if I try to select a column that doesn't exist, my TypeScript code will instantly throw a red error before the app even runs. If I wrote raw SQL, the app would crash in production. Furthermore, Prisma handles extremely complex logic securely—like SQL Injection prevention, connection pooling, and multi-table transactions—saving hundreds of hours of manual, buggy boilerplate code."

---

## Phase 8: Enterprise Scale, Security, and Performance

### Q27: How did you secure the user's session against XSS attacks?
**Answer:**
"Initially, we stored JWT tokens in `localStorage`, which is vulnerable to Cross-Site Scripting (XSS) where malicious JavaScript can read the token. To reach enterprise-level security, I migrated the authentication system to use **HttpOnly cookies**. My Node.js backend now attaches the token to an HttpOnly cookie, which instructs the browser to physically block all JavaScript access to it. The frontend then uses Axios with `withCredentials: true` to automatically and securely send the cookie with every request."

---

### Q28: How did you protect your Node.js backend against brute-force or DDOS attacks?
**Answer:**
"I implemented a multi-layered middleware defense on the Express server:
1. I used **`helmet`** to secure HTTP headers and hide the Express fingerprint, preventing attackers from sniffing vulnerabilities.
2. I wrote a custom **`sanitize` middleware** to strip dangerous HTML tags (`<` and `>`) from all incoming request bodies to prevent stored XSS.
3. I used **`express-rate-limit`** to restrict IPs to 100 requests per 15-minute window. This effectively stops botnets from brute-forcing passwords or DDOSing the server."

---

### Q29: Why did you choose TanStack React Query instead of standard `useEffect` hooks for data fetching?
**Answer:**
"At scale, relying on `useEffect` is dangerous. It triggers redundant network requests every single time a component mounts, which heavily strains the database and degrades user experience. I integrated **React Query** to act as a client-side cache (a 'Memory Bank'). It stores the fetched data, instantly serves it on route changes for a zero-millisecond load time, and silently re-validates with the server in the background using a configurable stale-time. This cut our backend network traffic by over 80%."

---

### Q30: How did you optimize your database to handle thousands of concurrent users?
**Answer:**
"As the tables grew, filtering orders by status or searching customers by name became a massive bottleneck because the database had to perform full table scans (O(N) time complexity). To solve this, I added **B-Tree indexes** to high-frequency query columns in my Prisma schema (e.g., `@@index([status])` on Orders and `@@index([name])` on Customers). This reduced query time complexity to O(log N), allowing the MySQL database to instantly locate records without scanning the entire table."
