
import { describe, expect, test, vi } from 'vitest';

import {
    loadSessionUser,
    requireApiLogin,
    requirePageLogin,
    requireApiRole,
    requirePageRole
} from '../src/middleware/auth.js';

// Create mock request and response objects.
function createMocks(user = null) {
    const req = {
        session: user ? { user } : {},
        query: {}
    };

    const res = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        redirect: vi.fn().mockReturnThis(),
        render: vi.fn().mockReturnThis()
    };

    const next = vi.fn();

    return { req, res, next };
}

describe('loadSessionUser', () => {
    test('loads the logged-in user into req.user and res.locals.user', () => {
        const user = { id: '1', username: 'testuser', role: 'customer' };
        const { req, res, next } = createMocks(user);

        loadSessionUser(req, res, next);

        expect(req.user).toEqual(user);
        expect(res.locals.user).toEqual(user);
        expect(next).toHaveBeenCalledOnce();
    });

    test('sets the user to null when nobody is logged in', () => {
        const { req, res, next } = createMocks();

        loadSessionUser(req, res, next);

        expect(req.user).toBeNull();
        expect(res.locals.user).toBeNull();
        expect(next).toHaveBeenCalledOnce();
    });
});

describe('requireApiLogin', () => {
    test('returns 401 when the user is not logged in', () => {
        const { req, res, next } = createMocks();

        requireApiLogin()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('allows a logged-in user', () => {
        const user = { id: '1', username: 'testuser', role: 'customer' };
        const { req, res, next } = createMocks(user);

        requireApiLogin()(req, res, next);

        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalledOnce();
    });
});

describe('requirePageLogin', () => {
    test('redirects to login when the user is not logged in', () => {
        const { req, res, next } = createMocks();

        requirePageLogin()(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('allows a logged-in user', () => {
        const user = { id: '1', username: 'testuser', role: 'customer' };
        const { req, res, next } = createMocks(user);

        requirePageLogin()(req, res, next);

        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalledOnce();
    });
});

describe('requireApiRole', () => {
    test('returns 401 when the user is not logged in', () => {
        const { req, res, next } = createMocks();

        requireApiRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when the user has the wrong role', () => {
        const user = { id: '1', username: 'testuser', role: 'customer' };
        const { req, res, next } = createMocks(user);

        requireApiRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test('allows a user with the required role', () => {
        const user = { id: '2', username: 'admin', role: 'admin' };
        const { req, res, next } = createMocks(user);

        requireApiRole('admin')(req, res, next);

        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalledOnce();
    });
});

describe('requirePageRole', () => {
    test('redirects to login when the user is not logged in', () => {
        const { req, res, next } = createMocks();

        requirePageRole('admin')(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('renders the 403 page when the user has the wrong role', () => {
        const user = { id: '1', username: 'testuser', role: 'customer' };
        const { req, res, next } = createMocks(user);

        requirePageRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.render).toHaveBeenCalledWith(
            'errors/403',
            expect.objectContaining({
                title: 'Access Denied'
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('allows a user with the required role', () => {
        const user = { id: '2', username: 'admin', role: 'admin' };
        const { req, res, next } = createMocks(user);

        requirePageRole('admin')(req, res, next);

        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalledOnce();
    });
});
