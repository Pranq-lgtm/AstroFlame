import { NextRequest, NextResponse } from 'next/server';
import {
  runSiCopilotChat,
  type ChatTurnMessage,
  type CopilotChamberContext,
} from '@/backend/si-synthesis-engine';
import { type PersonaRoleId } from '@/backend/psi-datasets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || '').trim();
    const personaRole = (body.personaRole || 'engineer') as PersonaRoleId;
    const history: ChatTurnMessage[] = Array.isArray(body.history) ? body.history : [];
    const chamberContext: CopilotChamberContext = {
      activeDatasetId: String(body.chamberContext?.activeDatasetId || 'bass-ii-psi-25'),
      gravityG: Number(body.chamberContext?.gravityG ?? 0.0),
      oxygenPercent: Number(body.chamberContext?.oxygenPercent ?? 21),
      airflowCmPerSec: Number(body.chamberContext?.airflowCmPerSec ?? 2.5),
      eFieldKv: Number(body.chamberContext?.eFieldKv ?? 0.0),
      coolFlameMode: Boolean(body.chamberContext?.coolFlameMode),
      provenanceMode: String(body.chamberContext?.provenanceMode || '3d_illustration'),
    };

    if (!message) {
      return NextResponse.json(
        { error: 'Please provide a question for the SI Copilot.' },
        { status: 400 }
      );
    }

    const result = await runSiCopilotChat({
      message,
      history,
      personaRole,
      chamberContext,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SI Copilot synthesis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
