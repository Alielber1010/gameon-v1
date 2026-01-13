import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { put } from '@vercel/blob';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    let authResult;
    try {
      authResult = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authResult || !authResult.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `reports/report-${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    });
  } catch (error: any) {
    console.error('Error uploading report image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
