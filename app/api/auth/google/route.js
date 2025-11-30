import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        console.log('Google Auth: Request received');

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error('Google Auth Error: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined');
            return NextResponse.json(
                { message: 'Server configuration error: Missing Google Client ID' },
                { status: 500 }
            );
        }

        const client = new OAuth2Client(clientId);

        const { credential } = await request.json();
        console.log('Google Auth: Credential received', credential ? 'Yes' : 'No');

        if (!credential) {
            console.log('Google Auth: No credential provided');
            return NextResponse.json(
                { message: 'No credential provided' },
                { status: 400 }
            );
        }

        // Verify Google Token
        console.log('Google Auth: Verifying token...');
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        console.log('Google Auth: Token verified. Payload:', JSON.stringify(payload, null, 2));
        const { email, name, picture, sub: googleId } = payload;

        console.log('Google Auth: Connecting to database...');
        try {
            await connectToDatabase();
            console.log('Google Auth: Connected to database');
        } catch (dbError) {
            console.error('Google Auth: Database connection failed', dbError);
            return NextResponse.json(
                { message: 'Database connection failed', error: dbError.message },
                { status: 500 }
            );
        }

        // Check if user exists
        let user = await User.findOne({ email });
        console.log('Google Auth: User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('Google Auth: Creating new user...');
            // Create new user
            // Generate a random password since they use Google to login
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            // Default store name
            const storeName = `Cửa hàng của ${name}`;

            user = await User.create({
                username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000), // Ensure unique username (increased range)
                email,
                password: randomPassword, // Will be hashed by pre-save hook
                full_name: name,
                avatar: picture,
                store_name: storeName,
                role: 'owner', // Default role
                is_active: true,
                email_verified: true, // Verified by Google
            });
            console.log('Google Auth: New user created', user._id);
        } else {
            // Update existing user info if needed (optional)
            // user.avatar = picture;
            // await user.save();
            console.log('Google Auth: Existing user', user._id);
        }

        // Generate App JWT
        console.log('Google Auth: Generating token...');
        const token = generateToken(user._id);
        console.log('Google Auth: Token generated');

        // Update last login
        user.last_login = new Date();
        await user.save();
        console.log('Google Auth: Last login updated');

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
            { message: 'Authentication failed', error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
