#!/bin/bash

# Create backend directory structure
mkdir -p src/{config,controllers,middleware,models,routes,services,utils}
mkdir -p src/database/{migrations,seeds}

# Create frontend directory structure
mkdir -p client/src/{components,pages,services,store,utils,hooks}
mkdir -p client/public

# Create necessary configuration files
touch .env.example .env
touch tsconfig.json
touch src/config/database.ts
touch src/config/redis.ts

# Create core backend files
touch src/app.ts
touch src/server.ts
touch src/routes/index.ts
touch src/routes/auth.routes.ts
touch src/controllers/auth.controller.ts
touch src/services/auth.service.ts
touch src/services/password.service.ts
touch src/services/rateLimit.service.ts
touch src/middleware/auth.middleware.ts
touch src/middleware/rateLimit.middleware.ts
touch src/models/user.model.ts
touch src/models/loginAttempt.model.ts
touch src/models/ipBlacklist.model.ts 