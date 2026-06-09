import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { supervisorId, location, photoUrl, faceVerified } = await req.json();

    // Check if locked
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: { user: true }
    });

    if (supervisor?.user.isLocked) {
      return NextResponse.json({ error: 'الحساب مقفل مالياً. يرجى مراجعة الإدارة.' }, { status: 403 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        supervisorId,
        date: new Date(),
        checkInTime: new Date(),
        checkInLocation: location,
        checkInPhotoUrl: photoUrl,
        faceVerified,
        status: 'present',
      }
    });

    await prisma.supervisor.update({
      where: { id: supervisorId },
      data: {
        isCheckedIn: true,
        lastCheckinAt: new Date(),
        lastCheckinLocation: location
      }
    });

    return NextResponse.json(attendance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
