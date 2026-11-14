import { NextRequest, NextResponse } from 'next/server';
import { type PersonaRoleId } from '@/backend/psi-datasets';
import { runSiSynthesisQuery } from '@/backend/si-synthesis-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt || '').trim();
    const personaRole = (body.personaRole as PersonaRoleId) || 'engineer';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await runSiSynthesisQuery(prompt, personaRole);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Synthesis request failed' },
      { status: 500 }
    );
  }
}
