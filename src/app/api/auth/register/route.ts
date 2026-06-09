import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs'; // استخدام bcryptjs لضمان التوافق مع Vercel Edge/Serverless

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, role } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        role: role || 'customer',
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
