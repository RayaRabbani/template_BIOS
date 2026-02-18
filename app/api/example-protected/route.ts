import { NextResponse } from 'next/server';

import { canUserPerform } from '@/lib/check-ability';

export async function GET() {
  const canViewBudgets = await canUserPerform('view', 'budgets');

  if (!canViewBudgets) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to view budgets' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Success! You have permission to view budgets',
    data: {
      budgets: [
        { id: 1, name: 'Q1 Budget', amount: 100000 },
        { id: 2, name: 'Q2 Budget', amount: 150000 },
      ],
    },
  });
}
