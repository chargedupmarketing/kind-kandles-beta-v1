import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const BRAND_CONTEXT = `You are writing emails for "My Kind Kandles & Boutique", a handmade candle and skincare business.

Brand Voice:
- Warm, welcoming, and friendly
- Emphasizes kindness and self-care
- Professional but personal
- Tagline: "Do All Things With Kindness"

Store Details:
- Location: Maryland, USA
- Products: Handmade soy candles, body butters, room sprays, bar soaps, body oils, wax melts
- Brand colors: Pink (#db2777), soft pastels

Email Style Guidelines:
- Use clean, modern HTML email design
- Include the brand header with pink gradient
- Use proper email-safe inline CSS
- Include footer with address and unsubscribe link
- Mobile-responsive design
- Use {{variable}} syntax for dynamic content`;

export async function POST(request: NextRequest) {
  try {
    const { mode, prompt, currentContent, currentSubject, templateType } = await request.json();

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.' 
      }, { status: 400 });
    }

    let systemPrompt = BRAND_CONTEXT;
    let userPrompt = '';

    switch (mode) {
      case 'generate':
        systemPrompt += `\n\nGenerate a complete HTML email template based on the user's description. 
Include:
- Full HTML structure with DOCTYPE
- Inline CSS for email compatibility
- Brand header with gradient
- Main content section
- Footer with address
- Use {{variable}} placeholders where appropriate

Return ONLY the HTML content, no explanations.`;
        userPrompt = `Create an email for: ${prompt}\n\nTemplate type: ${templateType}`;
        break;

      case 'improve':
        systemPrompt += `\n\nImprove the existing email content based on the user's request.
Maintain the same structure but enhance:
- Copy and messaging
- Call-to-action effectiveness
- Emotional engagement
- Brand voice consistency

Return ONLY the improved HTML content, no explanations.`;
        userPrompt = `Current email content:\n${currentContent}\n\nImprovement request: ${prompt}`;
        break;

      case 'subjects':
        systemPrompt += `\n\nGenerate 5 compelling email subject lines based on the description.
Subject lines should:
- Be attention-grabbing but not clickbait
- Include emojis where appropriate
- Be under 60 characters when possible
- Reflect the brand's warm, kind personality
- Include {{variables}} if relevant

Return ONLY a JSON array of 5 subject lines, like: ["Subject 1", "Subject 2", ...]`;
        userPrompt = `Generate subject lines for: ${prompt}\n\nCurrent subject (if any): ${currentSubject}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    if (mode === 'subjects') {
      // Parse JSON array of subjects
      try {
        const suggestions = JSON.parse(content);
        return NextResponse.json({ suggestions });
      } catch {
        // If parsing fails, try to extract subjects from text
        const lines = content.split('\n').filter((line: string) => line.trim());
        const suggestions = lines.slice(0, 5).map((line: string) => 
          line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim()
        );
        return NextResponse.json({ suggestions });
      }
    }

    // For generate and improve modes, return the HTML content
    // Also try to extract a suggested subject if one was generated
    let subject = currentSubject;
    const subjectMatch = content.match(/<title>(.*?)<\/title>/i);
    if (subjectMatch) {
      subject = subjectMatch[1];
    }

    return NextResponse.json({ content, subject });
  } catch (error) {
    console.error('AI email generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

