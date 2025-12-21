import { NextRequest, NextResponse } from 'next/server';
import { getShippoClient, validateAddress as localValidate } from '@/lib/shippo';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const shippo = getShippoClient();
    if (!shippo) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { address } = body;

    // First do local validation
    const localValidation = localValidate(address);
    if (!localValidation.valid) {
      return NextResponse.json({
        valid: false,
        errors: localValidation.errors,
        suggestedAddress: null,
      });
    }

    // Validate with Shippo for more accurate results
    const validatedAddress = await shippo.addresses.create({
      name: address.name,
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      validate: true,
    });

    const isValid = validatedAddress.validationResults?.isValid || false;
    const messages = validatedAddress.validationResults?.messages || [];

    // Build suggested address if available
    let suggestedAddress = null;
    if (validatedAddress.street1) {
      suggestedAddress = {
        name: address.name,
        company: address.company,
        street1: validatedAddress.street1,
        street2: validatedAddress.street2 || '',
        city: validatedAddress.city,
        state: validatedAddress.state,
        zip: validatedAddress.zip,
        country: validatedAddress.country,
      };
    }

    return NextResponse.json({
      valid: isValid,
      errors: messages.filter((m: any) => m.type === 'error').map((m: any) => m.text),
      warnings: messages.filter((m: any) => m.type === 'warning').map((m: any) => m.text),
      suggestedAddress: isValid ? suggestedAddress : null,
      originalAddress: address,
    });

  } catch (error: any) {
    console.error('Error validating address:', error);
    return NextResponse.json(
      { error: 'Failed to validate address', details: error.message },
      { status: 500 }
    );
  }
}

