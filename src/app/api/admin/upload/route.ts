import { NextRequest, NextResponse } from 'next/server';

// Configure route to accept larger payloads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

// Cloudinary configuration (free tier: 25GB storage, 25GB bandwidth/month)
// Sign up at https://cloudinary.com/ and get your credentials
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET; // For unsigned uploads

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, BMP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Check if Cloudinary is configured
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      // Use Cloudinary unsigned upload
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', dataUrl);
      cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      cloudinaryFormData.append('folder', 'products');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (cloudinaryResponse.ok && cloudinaryData.secure_url) {
        return NextResponse.json({
          success: true,
          url: cloudinaryData.secure_url,
          thumb: cloudinaryData.secure_url.replace('/upload/', '/upload/w_200,h_200,c_thumb/'),
          public_id: cloudinaryData.public_id,
          id: cloudinaryData.asset_id,
        });
      }

      console.error('Cloudinary upload error:', cloudinaryData);
    }

    // Fallback: Try 0x0.st (anonymous file hosting, no API key needed)
    // This is a simple pastebin-style service that accepts images
    const zeroFormData = new FormData();
    zeroFormData.append('file', file);

    const zeroResponse = await fetch('https://0x0.st', {
      method: 'POST',
      body: zeroFormData,
    });

    if (zeroResponse.ok) {
      const url = await zeroResponse.text();
      if (url.trim().startsWith('http')) {
        return NextResponse.json({
          success: true,
          url: url.trim(),
          id: url.trim().split('/').pop(),
        });
      }
    }

    // Fallback 2: Try litterbox.catbox.moe (temporary file hosting, 72h retention)
    const catboxFormData = new FormData();
    catboxFormData.append('reqtype', 'fileupload');
    catboxFormData.append('time', '72h');
    catboxFormData.append('fileToUpload', file);

    const catboxResponse = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: catboxFormData,
    });

    if (catboxResponse.ok) {
      const url = await catboxResponse.text();
      if (url.trim().startsWith('http')) {
        return NextResponse.json({
          success: true,
          url: url.trim(),
          id: url.trim().split('/').pop(),
          expires: '72 hours',
        });
      }
    }

    // Fallback 3: Try catbox.moe (permanent hosting)
    const catboxPermanentFormData = new FormData();
    catboxPermanentFormData.append('reqtype', 'fileupload');
    catboxPermanentFormData.append('fileToUpload', file);

    const catboxPermanentResponse = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxPermanentFormData,
    });

    if (catboxPermanentResponse.ok) {
      const url = await catboxPermanentResponse.text();
      if (url.trim().startsWith('http')) {
        return NextResponse.json({
          success: true,
          url: url.trim(),
          id: url.trim().split('/').pop(),
        });
      }
    }

    return NextResponse.json(
      { error: 'All image hosting services are currently unavailable. Please try again later or use an image URL instead.' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image. Please try again or use an image URL.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Most free services don't support deletion
  return NextResponse.json({ 
    success: true,
    message: 'Image reference removed.'
  });
}

