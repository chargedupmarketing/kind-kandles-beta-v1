import { NextRequest, NextResponse } from 'next/server';

const BRAND_CONTEXT = `You are writing emails for "My Kind Kandles & Boutique", a handmade candle and skincare business.

Brand Voice:
- Warm, welcoming, and friendly
- Emphasizes kindness and self-care
- Professional but personal
- Tagline: "Do All Things With Kindness"

Store Details:
- Location: 9505 Reisterstown Rd, Suite 2SE, Owings Mills, MD 21117
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

    // Get API key from localStorage via request or use env variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Check if user has configured their own key in the AI Assistant
    const savedConfig = request.headers.get('x-openai-key');
    const finalApiKey = savedConfig || apiKey;

    if (!finalApiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please set it up in the AI Assistant settings.' 
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: errorData.error?.message || 'Failed to generate content' 
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

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

