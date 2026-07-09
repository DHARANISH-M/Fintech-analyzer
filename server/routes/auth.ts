import { Router, Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_key_12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Signup Route
router.post('/signup', (async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required.' });
    return;
  }

  try {
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: 'Email already exists.' });
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into DB
    const result = await query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email`,
      [name, email, passwordHash]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'User registered successfully.',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}) as RequestHandler);

// Login Route
router.post('/login', (async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    // Fetch user by email
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Sign JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return token and user details (excluding password_hash)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        // username: derive from email prefix as a sensible default
        username: user.email.split('@')[0],
        // phone and currency not stored yet — return empty defaults so
        // the frontend doesn't break when reading from localStorage
        phone: '',
        currency: '₹',
        profilePictureUrl: null,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}) as RequestHandler);

export default router;
