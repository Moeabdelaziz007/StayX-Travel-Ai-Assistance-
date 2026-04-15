import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27-acacia' as any,
    });
  }
  return stripeClient;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      return NextResponse.json({ 
        success: true, 
        metadata: session.metadata,
        paymentStatus: 'paid'
      });
    } else {
      return NextResponse.json({ success: false, paymentStatus: session.payment_status });
    }
  } catch (error: any) {
    console.error('Stripe verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
