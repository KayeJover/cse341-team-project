
import { describe, expect, test, inject } from 'vitest';
import request from 'supertest';
import Role from '../src/models/schemas/roles.js';

const mongoUri = inject('MONGODB_TEST_URI');

process.env.MONGODB_URI = mongoUri;
process.env.MONGODB_DB_NAME = 'kizuna-rail-test';
process.env.SESSION_SECRET = 'test-session-secret';

const { default: app } = await import('../app.js');

describe('Authentication E2E Tests', () => {
    test('GET /api/auth/me should reject unauthenticated users', async () => {
        const response = await request(app).get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            'Authentication required. Please log in.'
        );
    });

    test('POST /api/auth/register should create a customer account', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                displayName: 'E2E Test User',
                username: 'e2e_test_user',
                email: 'e2e_test@example.com',
                password: 'E2ETest123!'
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Registration successful.');
        expect(response.body.user.username).toBe('e2e_test_user');
        expect(response.body.user.role).toBe('customer');
    });

    test('POST /api/auth/login should authenticate a registered user', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                displayName: 'Login Test User',
                username: 'login_test_user',
                email: 'login_test@example.com',
                password: 'LoginTest123!'
            });

        const agent = request.agent(app);

        const loginResponse = await agent
            .post('/api/auth/login')
            .send({
                username: 'login_test_user',
                password: 'LoginTest123!'
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.message).toBe('Login successful.');
        expect(loginResponse.body.user.username).toBe('login_test_user');

        const profileResponse = await agent.get('/api/auth/me');

        expect(profileResponse.status).toBe(200);
        expect(profileResponse.body.user.username).toBe('login_test_user');
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'nonexistent_user',
                password: 'WrongPassword123!'
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            'Invalid username or password.'
        );
    });

    test('POST /api/auth/logout should destroy the authenticated session', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                displayName: 'Logout Test User',
                username: 'logout_test_user',
                email: 'logout_test@example.com',
                password: 'LogoutTest123!'
            });

        const agent = request.agent(app);

        await agent
            .post('/api/auth/login')
            .send({
                username: 'logout_test_user',
                password: 'LogoutTest123!'
            });

        const logoutResponse = await agent.post('/api/auth/logout');

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body.message).toBe('Logout successful.');

        const profileResponse = await agent.get('/api/auth/me');

        expect(profileResponse.status).toBe(401);
    });

    test('Database should contain customer and admin roles', async () => {
        const roles = await Role.find({
            name: { $in: ['customer', 'admin'] }
        })
            .sort({ name: 1 })
            .lean();

        expect(roles.map((role) => role.name)).toEqual([
            'admin',
            'customer'
        ]);
    });
});
