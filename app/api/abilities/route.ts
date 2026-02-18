import { NextResponse } from 'next/server';

import { getAbilitiesFromBackend } from '@/lib/abilities';

export async function GET() {
  try {
    const abilities = await getAbilitiesFromBackend();
    return NextResponse.json(abilities);
  } catch (error) {
    console.error('Error fetching abilities:', error);
    return NextResponse.json([], { status: 500 });
  }
}
