import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'هذا الحساب غير مفعل. يرجى التواصل مع الإدارة.' }, { status: 403 });
    }

    // Handle both bcrypt hashes and plain text passwords (for legacy supervisors)
    let passwordMatch = false;
    if (user.passwordHash && user.passwordHash.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      passwordMatch = password === user.passwordHash;
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (user.isLocked) {
      return NextResponse.json({ error: `الحساب مقفل: ${user.lockReason}` }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      fullName: user.fullName, 
      role: user.role,
      governorate: user.governorate
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
}
