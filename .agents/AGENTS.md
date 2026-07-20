# Project Global Rules

Always adhere to the following principles when writing or modifying code in this project:

1. **Architecture First**: Always prioritize a scalable, N-tier architecture (Controllers, Services, Repositories) separating routing from business logic.
2. **Reusability (DRY)**: Write DRY (Don't Repeat Yourself) code. Abstract common logic into reusable utility functions or services.
3. **Scalability**: Design systems with 10k+ concurrent users in mind. Avoid blocking operations, use connection pooling, and always write optimized database queries.
4. **Security & Validation**: Never trust user input. Validate all incoming data at the API boundary using tools like Zod before it touches the business logic or database.
5. **Quality over Speed**: Do not "hack" temporary fixes unless explicitly asked to. Write clean, strongly-typed TypeScript, with explicit error handling and meaningful variable names.
