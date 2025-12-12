import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// File categories/buckets
const BUCKETS = {
  products: 'product-images',
  marketing: 'marketing-assets',
  documents: 'documents',
  blog: 'blog-images',
};

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// Ensure buckets exist
async function ensureBucketsExist() {
  for (const [, bucketName] of Object.entries(BUCKETS)) {
    const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
    
    if (!existingBucket) {
      await supabase.storage.createBucket(bucketName, {
        public: true, // Make files publicly accessible
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
      });
    }
  }
}

// GET: List files in a bucket/folder
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'products';
    const folder = searchParams.get('folder') || '';
    
    const bucketName = BUCKETS[bucket as keyof typeof BUCKETS] || BUCKETS.products;
    
    await ensureBucketsExist();

    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }

    // Get public URLs for each file
    const filesWithUrls = files?.map((file) => {
      const filePath = folder ? `${folder}/${file.name}` : file.name;
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      return {
        ...file,
        url: urlData.publicUrl,
        path: filePath,
        bucket: bucket,
      };
    }) || [];

    // Get storage usage stats
    const allBucketStats = await Promise.all(
      Object.entries(BUCKETS).map(async ([key, name]) => {
        const { data: bucketFiles } = await supabase.storage.from(name).list('', { limit: 1000 });
        const totalSize = bucketFiles?.reduce((acc, f) => acc + (f.metadata?.size || 0), 0) || 0;
        const fileCount = bucketFiles?.filter(f => f.id).length || 0;
        return { bucket: key, name, totalSize, fileCount };
      })
    );

    return NextResponse.json({
      files: filesWithUrls,
      buckets: Object.keys(BUCKETS),
      currentBucket: bucket,
      currentFolder: folder,
      stats: allBucketStats,
    });
  } catch (error) {
    console.error('Files list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upload a file
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBucketsExist();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'products';
    const folder = formData.get('folder') as string || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bucketName = BUCKETS[bucket as keyof typeof BUCKETS] || BUCKETS.products;
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    // Log the upload in database
    await supabase.from('file_uploads').insert({
      file_name: fileName,
      original_name: file.name,
      file_path: filePath,
      bucket: bucket,
      file_type: file.type,
      file_size: file.size,
      public_url: urlData.publicUrl,
      uploaded_by: admin.email || 'admin',
    }).select().single();

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        bucket: bucket,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a file
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'products';
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const bucketName = BUCKETS[bucket as keyof typeof BUCKETS] || BUCKETS.products;

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    // Remove from database log
    await supabase
      .from('file_uploads')
      .delete()
      .eq('file_path', path)
      .eq('bucket', bucket);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

