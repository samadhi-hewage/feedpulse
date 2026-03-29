import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
    return res.json({ success: true, data: { token }, message: 'Login successful' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}