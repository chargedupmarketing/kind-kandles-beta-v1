import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const BRAND_CONTEXT = `You are an automation expert helping to build email workflows for "My Kind Kandles & Boutique", a handmade candle and skincare business.

Brand Voice:
- Warm, welcoming, and friendly
- Emphasizes kindness and self-care
- Professional but personal
- Tagline: "Do All Things With Kindness"

Store Details:
- Location: Maryland, USA
- Products: Handmade soy candles, body butters, room sprays, bar soaps, body oils, wax melts
- Brand colors: Pink (#db2777), soft pastels

Available Email Templates:
- Order Confirmation
- Shipping Notification
- Delivery Confirmation
- Review Request
- Abandoned Cart Reminder
- Welcome Email
- Thank You Email
- Special Offer
- Product Launch
- Birthday Greeting

Workflow Best Practices:
- Don't overwhelm customers with too many emails
- Space out emails appropriately (at least 24 hours between non-urgent emails)
- Abandoned cart: First reminder at 1 hour, second at 24 hours
- Review requests: Wait 7 days after delivery
- Welcome series: Immediate welcome, then 3 days, then 7 days
- Always include unsubscribe options
- Personalize with customer name and order details`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const { mode, prompt, currentWorkflow, trigger } = await request.json();

    let systemPrompt = BRAND_CONTEXT;
    let userPrompt = '';

    switch (mode) {
      case 'suggest':
        systemPrompt += `\n\nSuggest a complete email workflow based on the user's description. Provide:
1. Workflow name
2. Trigger type (order_placed, abandoned_cart, customer_registered, order_delivered, etc.)
3. Detailed step-by-step sequence with:
   - Email template to use
   - Delay before sending (in minutes)
   - Conditions (if any)
   - Purpose of each email

Format as a structured JSON object with this schema:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "trigger": "trigger_type",
  "steps": [
    {
      "type": "send_email",
      "template": "template_name",
      "delay_minutes": 0,
      "description": "Why this email is sent"
    },
    {
      "type": "wait",
      "delay_minutes": 1440,
      "description": "Wait 24 hours"
    }
  ],
  "reasoning": "Why this workflow is effective"
}`;
        userPrompt = `Create a workflow for: ${prompt}${trigger ? `\n\nTrigger: ${trigger}` : ''}`;
        break;

      case 'optimize':
        systemPrompt += `\n\nAnalyze the existing workflow and suggest optimizations. Consider:
- Email timing and spacing
- Customer experience and engagement
- Conversion optimization
- Avoiding email fatigue
- Industry best practices

Provide specific, actionable recommendations with reasoning.`;
        userPrompt = `Current workflow:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nHow can this workflow be improved?`;
        break;

      case 'add-step':
        systemPrompt += `\n\nSuggest the next logical step for this workflow. Consider:
- Current workflow context
- Customer journey stage
- Timing and spacing
- Conversion goals

Provide a specific step recommendation in JSON format:
{
  "type": "send_email" or "wait",
  "template": "template_name",
  "delay_minutes": number,
  "reasoning": "Why this step makes sense"
}`;
        userPrompt = `Current workflow:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nUser request: ${prompt}`;
        break;

      case 'explain':
        systemPrompt += `\n\nExplain workflow concepts and best practices in simple, actionable terms.`;
        userPrompt = prompt;
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

    // Try to parse JSON for suggest and add-step modes
    if (mode === 'suggest' || mode === 'add-step') {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ content, parsed });
        }
      } catch (parseError) {
        // If parsing fails, just return the text content
      }
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Workflow AI error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
