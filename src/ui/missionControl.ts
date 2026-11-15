// Mission Control lines. Each stays under 15 words, calm and plain.

/** Spoken when a stage starts. Example: "Mission Control. Stage open: Landing Simulation. Objective: Pilot the spacecraft to a safe landing." */
export function missionControlStageOpen(name: string, objective: string): string {
  return `Mission Control. Stage open: ${name}. Objective: ${objective}`;
}
