import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Get the data directory path
function getDataDir() {
  return path.join(process.cwd(), 'data');
}

// Get the survey data file path
function getSurveyDataPath() {
  return path.join(getDataDir(), 'survey-submissions.json');
}

// Ensure data directory and file exist
async function ensureDataFile() {
  const dataDir = getDataDir();
  const filePath = getSurveyDataPath();

  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read survey submissions
async function readSurveySubmissions() {
  await ensureDataFile();
  let data = await fs.readFile(getSurveyDataPath(), 'utf-8');
  // Remove BOM and any whitespace issues
  data = data.replace(/^\uFEFF/, '').trim();
  if (!data || data === '') {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON, reinitializing file:', error);
    // If JSON is corrupted, reset the file
    await fs.writeFile(getSurveyDataPath(), JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const isAuthenticated = await checkAuth(request);
    // if (!isAuthenticated) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const submissions = await readSurveySubmissions();

    // Sort by timestamp (newest first)
    submissions.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: submissions,
      total: submissions.length
    });

  } catch (error) {
    console.error('Error fetching survey submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

