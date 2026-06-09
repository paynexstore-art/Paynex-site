import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/auditLogger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, adminId, type } = await req.json(); // type: full or partial
    const supervisorId = params.id;

    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: { user: true }
    });

    if (!supervisor) return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const clearAmount = type === 'full' ? supervisor.totalDebt : amount;

      const updatedSupervisor = await tx.supervisor.update({
        where: { id: supervisorId },
        data: {
          totalDebt: { decrement: clearAmount }
        }
      });

      // Unlock user if debt is fully cleared (or however the business rule works)
      // Usually, any payment clears the lock for the next day
      await tx.user.update({
        where: { id: supervisor.userId },
        data: { isLocked: false, lockReason: null }
      });

      await tx.supervisorWallet.create({
        data: {
          supervisorId: supervisorId,
          amount: clearAmount,
          transactionType: type === 'full' ? 'debt_cleared_full' : 'debt_cleared_partial',
          balanceAfter: updatedSupervisor.totalDebt,
          performedBy: adminId,
          description: `تصفية عهدة ${type === 'full' ? 'كلية' : 'جزئية'} بواسطة الإدارة`
        }
      });

      return updatedSupervisor;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
