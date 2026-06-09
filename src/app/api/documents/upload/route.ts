import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { processDocument } from '@/lib/watermark';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const supervisorId = formData.get('supervisorId') as string;
    const supervisorName = formData.get('supervisorName') as string;
    const documentType = formData.get('documentType') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const userId = formData.get('userId') as string;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Process Image with Watermark
    const processedBuffer = await processDocument({
      imageBuffer: buffer,
      gpsLat: lat,
      gpsLng: lng,
      supervisorName: supervisorName,
      orderId: orderId
    });

    // 2. Upload to Supabase Storage
    const fileName = `${orderId}/${documentType}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, processedBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName);

    // 3. Save to DB
    const doc = await prisma.document.create({
      data: {
        orderId,
        uploadedBy: userId,
        documentType,
        originalUrl: publicUrl, // Using same for now as we processed it
        processedUrl: publicUrl,
        gpsLocation: { lat, lng },
        gpsTimestamp: new Date(),
        watermarkApplied: true,
      }
    });

    return NextResponse.json(doc);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
