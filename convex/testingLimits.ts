// Explicitly authorised retests: one development completion check or four legacy attempts. Invalid configuration fails closed.
export function answerAttemptLimit(): number {
  const configured = process.env.EVALUATION_ATTEMPT_LIMIT;
  if (configured === undefined) return 10;
  if (configured === "10") return 10;
  if (configured === "11") return 11;
  if (configured === "14") return 14;
  return 0;
}
