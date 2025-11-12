import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface SurveySubmission {
  id: string;
  timestamp: string;
  email: string;
  name: string;
  gender: string;
  ageRange: string;
  location: string;
  howDidYouFindUs: string;
  candlePreferences: string[];
  otherInfo?: string;
  couponCode: string;
  couponUsed: boolean;
}

// Generate a unique coupon code
function generateCouponCode(): string {
  const prefix = 'WELCOME';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

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
async function readSurveySubmissions(): Promise<SurveySubmission[]> {
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

// Write survey submissions
async function writeSurveySubmissions(submissions: SurveySubmission[]) {
  await ensureDataFile();
  await fs.writeFile(getSurveyDataPath(), JSON.stringify(submissions, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.name || !body.gender || !body.ageRange || 
        !body.location || !body.howDidYouFindUs || !body.candlePreferences?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique coupon code
    const couponCode = generateCouponCode();

    // Create submission object
    const submission: SurveySubmission = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      email: body.email,
      name: body.name,
      gender: body.gender,
      ageRange: body.ageRange,
      location: body.location,
      howDidYouFindUs: body.howDidYouFindUs,
      candlePreferences: body.candlePreferences,
      otherInfo: body.otherInfo || '',
      couponCode,
      couponUsed: false
    };

    // Read existing submissions
    const submissions = await readSurveySubmissions();

    // Check if email already exists
    const existingSubmission = submissions.find(s => s.email === body.email);
    if (existingSubmission) {
      return NextResponse.json({
        success: true,
        couponCode: existingSubmission.couponCode,
        message: 'You have already submitted a survey. Here is your existing coupon code.'
      });
    }

    // Add new submission
    submissions.push(submission);

    // Save to file
    await writeSurveySubmissions(submissions);

    // TODO: Send email with coupon code (integrate with email service)
    // await sendCouponEmail(body.email, body.name, couponCode);

    return NextResponse.json({
      success: true,
      couponCode,
      message: 'Survey submitted successfully!'
    });

  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

