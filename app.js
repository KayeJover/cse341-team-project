import 'dotenv/config';
import express from 'express';
import Path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import pkg from './package.json' with { type: 'json' };
import globalMiddleware from './src/middleware/global.js';
import routes from './src/routes/router.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const app = express();

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure session storage using MongoDB.
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required.');
}

app.use(session({
    name: 'kizuna.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME || 'practice',
        collectionName: 'sessions',
        ttl: 60 * 60,
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
    },
}));

app.use(globalMiddleware);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Application routes
app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';

    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
