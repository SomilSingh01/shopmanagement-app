import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { z } from 'zod';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  businessType: z.enum(['B2B', 'B2C']).optional().default('B2C'),
  shopName: z.string().optional(),
  shopCategory: z.string().optional(),
  shopAddress: z.string().optional(),
  otpCode: z.string().length(6), // Require OTP for signup
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone, businessType, shopName, shopCategory, shopAddress, otpCode } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Verify OTP
      const otpRecord = await prisma.oTP.findFirst({
        where: { email, code: otpCode, type: 'SIGNUP' },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid OTP code' });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // Hash password and create user
      const hashedPassword = await AuthService.hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          businessType: businessType as any,
          shopName,
          shopCategory,
          shopAddress
        },
      });

      // Delete the used OTP
      await prisma.oTP.deleteMany({ where: { email, type: 'SIGNUP' } });

      // Generate token
      const token = AuthService.generateToken(user.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.cookie('token', token, cookieOptions);
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: (error as any).errors });
      }
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async sendOTP(req: Request, res: Response) {
    try {
      const { email, type } = z.object({
        email: z.string().email(),
        type: z.enum(['SIGNUP', 'FORGOT_PASSWORD'])
      }).parse(req.body);

      // Check user existence based on type
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (type === 'SIGNUP' && existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (type === 'FORGOT_PASSWORD' && !existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check for 30s cooldown
      const recentOTP = await prisma.oTP.findFirst({
        where: { email, type },
        orderBy: { createdAt: 'desc' }
      });

      if (recentOTP) {
        const timeSinceLastRequest = Date.now() - recentOTP.createdAt.getTime();
        if (timeSinceLastRequest < 30 * 1000) {
          return res.status(429).json({ message: 'Please wait 30 seconds before requesting another code' });
        }
      }

      // Delete any existing OTPs for this email and type to keep database clean
      await prisma.oTP.deleteMany({
        where: { email, type }
      });

      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Expire in 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Save OTP to database
      await prisma.oTP.create({
        data: {
          email,
          code,
          type,
          expiresAt,
          attempts: 0
        }
      });

      // Send email via Brevo (non-fatal if SMTP fails — OTP is already in DB & terminal)
      const result = await EmailService.sendOTP(email, code, type);
      
      if (!result.success && result.error) {
        console.warn('⚠️ Email delivery failed, but OTP is saved. Check terminal for code.');
      }

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: (error as any).errors });
      }
      console.error('Send OTP Error:', error);
      res.status(500).json({ message: 'Failed to send OTP', error: error instanceof Error ? error.message : String(error) });
    }
  }

  static async verifyOTP(req: Request, res: Response) {
    try {
      const { email, code, type } = z.object({
        email: z.string().email(),
        code: z.string().length(6),
        type: z.enum(['SIGNUP', 'FORGOT_PASSWORD'])
      }).parse(req.body);

      const otpRecord = await prisma.oTP.findFirst({
        where: { email, type },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'No OTP found or it has expired' });
      }

      // Check max attempts
      if (otpRecord.attempts >= 3) {
        await prisma.oTP.deleteMany({ where: { email, type } });
        return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
      }

      if (new Date() > otpRecord.expiresAt) {
        await prisma.oTP.deleteMany({ where: { email, type } });
        return res.status(400).json({ message: 'OTP has expired' });
      }

      if (otpRecord.code !== code) {
        // Increment attempts
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 }
        });
        return res.status(400).json({ message: 'Invalid OTP code' });
      }

      // If valid, delete the OTP record
      await prisma.oTP.deleteMany({ where: { email, type } });

      // If forgot password, return a temporary reset token
      if (type === 'FORGOT_PASSWORD') {
        const resetToken = AuthService.generateToken(email);
        return res.json({ resetToken, message: 'OTP verified' });
      }

      res.json({ message: 'OTP verified' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: (error as any).errors });
      }
      console.error('Verify OTP Error:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { resetToken, newPassword } = z.object({
        resetToken: z.string(),
        newPassword: z.string().min(6)
      }).parse(req.body);

      // Decode token to get email
      let email: string;
      try {
        const decoded = AuthService.verifyToken(resetToken) as any;
        email = decoded.id; // Using id field from the generateToken function
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired reset token' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const hashedPassword = await AuthService.hashPassword(newPassword);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: (error as any).errors });
      }
      console.error('Reset Password Error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, phone, password } = loginSchema.parse(req.body);

      // Find user by email or phone (if we added phone to User model, but we only have email. Let's assume phone variable holds the email for now if it's an email string)
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email || phone || '' }, // if phone holds an email
          ]
        }
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await AuthService.comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = AuthService.generateToken(user.id);
      
      const { password: _, ...userWithoutPassword } = user;
      res.cookie('token', token, cookieOptions);
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: (error as any).errors });
      }
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  }

  static async getMe(req: Request, res: Response) {
    try {
      // req.user is populated by the optionalAuthenticate middleware
      if (!(req as any).user) {
        return res.json(null);
      }
      const userId = (req as any).user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        // Just return null instead of 404 to avoid console errors
        return res.json(null);
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('GetMe Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { name, phone, shopName, shopCategory, shopAddress, businessType } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(shopName !== undefined && { shopName }),
          ...(shopCategory !== undefined && { shopCategory }),
          ...(shopAddress !== undefined && { shopAddress }),
          ...(businessType !== undefined && { businessType }),
        },
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
