import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const scriptPath = join(process.cwd(), 'scripts', 'fix-settings-complete.cjs');
    const content = readFileSync(scriptPath, 'utf8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Content-Disposition': 'attachment; filename="fix-settings-complete.cjs"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
