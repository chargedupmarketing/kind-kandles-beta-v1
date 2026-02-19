import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface BlogGenerationRequest {
  type: 'title' | 'excerpt' | 'content' | 'outline' | 'seo' | 'tags' | 'improve';
  topic?: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'inspiring';
  length?: 'short' | 'medium' | 'long';
  title?: string;
  excerpt?: string;
  content?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BlogGenerationRequest;
    const { type, topic, tone = 'friendly', length = 'medium', title, excerpt, content } = body;

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    // Build system prompt
    const systemPrompt = `You are a skilled content writer for My Kind Kandles & Boutique, a premium candle and skincare brand. The brand voice is warm, inviting, and empowering with the tagline "Do All Things With Kindness". Write content that:
- Is engaging and relatable
- Focuses on self-care, wellness, home ambiance, and the joy of candles
- Uses a ${tone} tone
- Is SEO-optimized when appropriate
- Never uses generic filler content`;

    // Build user prompt based on type
    let userPrompt = '';
    const topicText = topic || title || 'candles and self-care';

    switch (type) {
      case 'title':
        userPrompt = `Generate 5 compelling blog post titles about "${topicText}" for a candle and boutique brand. Make them catchy, SEO-friendly, and engaging. Format as a numbered list.`;
        break;
      case 'excerpt':
        userPrompt = `Write a compelling 2-3 sentence excerpt/summary for a blog post titled "${title || topicText}". It should hook the reader and make them want to read more. Keep it under 160 characters for SEO.`;
        break;
      case 'outline':
        userPrompt = `Create a detailed blog post outline for "${title || topicText}". Include:
- An attention-grabbing introduction hook
- 4-6 main sections with subpoints
- A strong conclusion with call-to-action
Format with headers and bullet points.`;
        break;
      case 'content':
        userPrompt = `Write a complete, engaging blog post about "${title || topicText}". 
${content ? `Build upon this existing content:\n${content}\n\n` : ''}
Requirements:
- Length: ${length === 'short' ? '400-600' : length === 'long' ? '1200-1500' : '800-1000'} words
- Include practical tips and insights
- Use HTML formatting (h2, h3, p, ul, li, strong, em tags)
- Add a compelling introduction and conclusion
- Include a subtle mention of Kind Kandles products where natural`;
        break;
      case 'seo':
        userPrompt = `Generate SEO metadata for a blog post titled "${title}" with excerpt: "${excerpt}". Provide:
1. SEO Title (50-60 characters, include primary keyword)
2. Meta Description (150-160 characters, compelling with call-to-action)
3. 5-7 relevant keywords/tags
Format clearly with labels.`;
        break;
      case 'tags':
        userPrompt = `Suggest 8-10 relevant tags/keywords for a blog post titled "${title}" about ${topicText}. Focus on:
- Primary topic keywords
- Related candle/self-care terms
- Long-tail keywords for SEO
Format as a comma-separated list.`;
        break;
      case 'improve':
        userPrompt = `Improve and enhance this blog content while maintaining its core message:

${content}

Make it more:
- Engaging and readable
- Well-structured with clear sections
- SEO-optimized
- On-brand for a candle boutique
Use HTML formatting.`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
    }

    // Call Anthropic API
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: type === 'content' || type === 'improve' ? 4096 : 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const generatedContent = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    console.error('Blog AI generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
