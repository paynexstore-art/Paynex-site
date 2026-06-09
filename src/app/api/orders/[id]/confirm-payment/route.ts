import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/auditLogger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supervisorId, amount, type } = await req.json();
    const orderId = params.id;

    // 1. Find Supervisor
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId }
    });

    if (!supervisor) return NextResponse.json({ error: 'Supervisor not found' }, { status: 404 });

    // 2. Start Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update Order Status
      const order = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'under_inquiry',
          inquiryFeePaid: type === 'inquiry_fee_collected',
          inquiryFeePaidAt: new Date(),
        }
      });

      // Update Supervisor Debt and Wallet
      const updatedSupervisor = await tx.supervisor.update({
        where: { id: supervisorId },
        data: {
          totalDebt: { increment: amount }
        }
      });

      // Create Wallet Entry
      const walletEntry = await tx.supervisorWallet.create({
        data: {
          supervisorId: supervisorId,
          orderId: orderId,
          amount: amount,
          transactionType: type,
          balanceAfter: updatedSupervisor.totalDebt,
          description: `تحصيل ${type === 'inquiry_fee_collected' ? 'رسوم استعلام' : 'مقدم'} للطلب ${order.orderNumber}`
        }
      });

      return { order, walletEntry };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
