import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/auditLogger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, adminNotes, decisionBy } = await req.json();
    const orderId = params.id;

    const oldOrder = await prisma.order.findUnique({ where: { id: orderId } });

    const updates: any = {
      status,
      adminOverrideNotes: adminNotes,
      finalDecisionBy: decisionBy,
      updatedAt: new Date(),
    };

    if (status === 'approved') {
      updates.approvedAt = new Date();
    } else if (status === 'rejected') {
      updates.rejectedAt = new Date();
      // 60 days cooldown
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + 60);
      updates.rejectionCooldownUntil = cooldownDate;
    } else if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }

    const newOrder = await prisma.order.update({
      where: { id: orderId },
      data: updates,
    });

    // Log the action
    await logActivity({
      userId: decisionBy,
      userRole: 'super_admin',
      action: `Order Status Change: ${status}`,
      entityType: 'order',
      entityId: orderId,
      oldValue: oldOrder as any,
      newValue: newOrder as any,
    });

    return NextResponse.json(newOrder);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
