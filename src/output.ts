export function emit(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

export function fail(message: string, code: string | undefined, exitCode = 1): never {
  const payload: Record<string, unknown> = { error: message };
  if (code) payload.code = code;
  process.stderr.write(JSON.stringify(payload) + '\n');
  process.exit(exitCode);
}
