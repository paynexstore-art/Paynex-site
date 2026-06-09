import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { supervisorId, location } = await req.json();

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        supervisorId,
        date: new Date(),
        checkOutTime: null
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!todayAttendance) {
      return NextResponse.json({ error: 'No active check-in found' }, { status: 404 });
    }

    const checkOutTime = new Date();
    const workingHours = (checkOutTime.getTime() - todayAttendance.checkInTime!.getTime()) / (1000 * 60 * 60);

    const attendance = await prisma.attendance.update({
      where: { id: todayAttendance.id },
      data: {
        checkOutTime,
        checkOutLocation: location,
        workingHours: Number(workingHours.toFixed(2))
      }
    });

    // Lock the user upon checkout until debt is cleared
    const supervisor = await prisma.supervisor.findUnique({ where: { id: supervisorId } });
    
    await prisma.user.update({
      where: { id: supervisor!.userId },
      data: { 
        isLocked: true, 
        lockReason: 'بانتظار تصفية العهدة اليومية' 
      }
    });

    await prisma.supervisor.update({
      where: { id: supervisorId },
      data: {
        isCheckedIn: false,
        lastCheckoutAt: checkOutTime
      }
    });

    return NextResponse.json(attendance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
