import { NextRequest, NextResponse } from 'next/server';

// Imgur Client ID - using anonymous uploads (no account needed)
// You can get your own Client ID at https://api.imgur.com/oauth2/addclient
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'c4a4a563c460336';

// Max file size: 10MB (Imgur's limit)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

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
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
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

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Upload to Imgur
    const imgurResponse = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        type: 'base64',
        name: file.name,
        title: file.name.split('.')[0],
      }),
    });

    const imgurData = await imgurResponse.json();

    if (!imgurResponse.ok || !imgurData.success) {
      console.error('Imgur upload error:', imgurData);
      return NextResponse.json(
        { error: imgurData.data?.error || 'Failed to upload to Imgur' },
        { status: 500 }
      );
    }

    // Return the direct image URL
    return NextResponse.json({
      success: true,
      url: imgurData.data.link,
      deleteHash: imgurData.data.deletehash, // Can be used to delete the image later
      id: imgurData.data.id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete image from Imgur (optional - requires the deleteHash)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteHash = searchParams.get('deleteHash');

    if (!deleteHash) {
      return NextResponse.json(
        { error: 'No deleteHash provided' },
        { status: 400 }
      );
    }

    const imgurResponse = await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      },
    });

    const imgurData = await imgurResponse.json();

    if (!imgurResponse.ok || !imgurData.success) {
      console.error('Imgur delete error:', imgurData);
      return NextResponse.json(
        { error: 'Failed to delete image from Imgur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

