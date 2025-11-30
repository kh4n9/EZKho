import jwt from 'jsonwebtoken';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const authenticateUser = async (request) => {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    // console.log('Auth Debug: Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth Debug: No token provided');
      throw new Error('No token provided');
    }

    const token = authHeader.substring(7);
    // console.log('Auth Debug: Token:', token.substring(0, 10) + '...');

    let decoded;
    try {
      decoded = verifyToken(token);
      // console.log('Auth Debug: Decoded:', decoded);
    } catch (e) {
      console.log('Auth Debug: Token verification failed:', e.message);
      throw e;
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('Auth Debug: User not found for ID:', decoded.userId);
      throw new Error('User not found');
    }

    if (!user.is_active) {
      console.log('Auth Debug: User is inactive:', decoded.userId);
      throw new Error('User inactive');
    }

    return user;
  } catch (error) {
    console.error('Auth Debug: Authentication failed:', error.message);
    throw new Error('Authentication failed: ' + error.message);
  }
};

export const authorize = (roles = []) => {
  return async (request) => {
    const user = await authenticateUser(request);

    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new Error('Insufficient permissions');
    }

    return user;
  };
};