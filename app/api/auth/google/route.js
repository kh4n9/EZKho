import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json(
                { message: 'No credential provided' },
                { status: 400 }
            );
        }

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        await connectToDatabase();

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user
            // Generate a random password since they use Google to login
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            // Default store name
            const storeName = `Cửa hàng của ${name}`;

            user = await User.create({
                username: email.split('@')[0] + '_' + Math.floor(Math.random() * 1000), // Ensure unique username
                email,
                password: randomPassword, // Will be hashed by pre-save hook
                full_name: name,
                avatar: picture,
                store_name: storeName,
                role: 'owner', // Default role
                is_active: true,
                email_verified: true, // Verified by Google
            });
        } else {
            // Update existing user info if needed (optional)
            // user.avatar = picture;
            // await user.save();
        }

        // Generate App JWT
        const token = generateToken(user._id);

        // Update last login
        user.last_login = new Date();
        await user.save();

        // Return user info and token
        return NextResponse.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar: user.avatar,
                store_name: user.store_name
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json(
            { message: 'Authentication failed', error: error.message },
            { status: 500 }
        );
    }
}
