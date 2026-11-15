// 3D Cockpit Academy curriculum — plain data, no React.
// Ported from the TrueBlend/AstroQuest academy and kept separate from the
// game-state MODULES list in gameState.ts (those are the top-level training modules).

export type ControlId =
  | 'master' | 'o2' | 'cabin' | 'fuel' | 'guidance' | 'comms'
  | 'gimbal' | 'engine' | 'throttle' | 'sep' | 'helmet' | 'abort';

export type CockpitView = 'pad' | 'earth' | 'moon' | 'mars' | 'space';

export type CockpitStep =
  | { kind: 'info'; title: string; text: string }
  | { kind: 'quiz'; q: string; options: string[]; answer: number; why: string }
  | { kind: 'action'; text: string; control: ControlId; hint: string };

export interface CockpitLevel {
  id: string;
  level: string;
  title: string;
  icon: string;
  view: CockpitView;
  alarm?: boolean;
  shake?: boolean;
  steps: CockpitStep[];
}

export const CONTROLS: { id: ControlId; label: string; group: 'left' | 'center' | 'right' }[] = [
  { id: 'master', label: 'MASTER PWR', group: 'left' },
  { id: 'o2', label: 'O₂ SUPPLY', group: 'left' },
  { id: 'cabin', label: 'CABIN PRESS', group: 'left' },
  { id: 'helmet', label: 'SUIT / HELMET', group: 'left' },
  { id: 'fuel', label: 'FUEL PUMPS', group: 'center' },
  { id: 'guidance', label: 'GUIDANCE', group: 'center' },
  { id: 'gimbal', label: 'ENG GIMBAL', group: 'center' },
  { id: 'engine', label: 'IGNITION', group: 'center' },
  { id: 'comms', label: 'COMMS', group: 'right' },
  { id: 'throttle', label: 'THROTTLE', group: 'right' },
  { id: 'sep', label: 'STAGE SEP', group: 'right' },
  { id: 'abort', label: 'ABORT', group: 'right' },
];

export const CURRICULUM: CockpitLevel[] = [
  {
    id: 'earth', level: 'Level 1 · Basics', title: 'Planet Earth', icon: '🌍', view: 'earth',
    steps: [
      { kind: 'info', title: 'Our home planet', text: 'Earth is 12,742 km wide. Gravity is 9.8 m/s² (1 g). The atmosphere is 78% nitrogen and 21% oxygen and protects us from radiation and meteors.' },
      { kind: 'info', title: 'Getting to orbit', text: "Space officially starts at the Kármán line, 100 km up. To stay in low orbit you must fly sideways at about 7.8 km/s — that's why rockets tilt over after launch (the 'gravity turn')." },
      { kind: 'info', title: 'Magnetosphere', text: "Earth's magnetic field deflects the solar wind. Outside it — on the way to the Moon or Mars — astronauts receive much more radiation." },
      { kind: 'quiz', q: 'What speed is needed to stay in low Earth orbit?', options: ['0.8 km/s', '7.8 km/s', '78 km/s'], answer: 1, why: 'About 7.8 km/s sideways — roughly 28,000 km/h.' },
      { kind: 'quiz', q: 'Where does space officially begin?', options: ['10 km', '100 km', '1,000 km'], answer: 1, why: 'The Kármán line at 100 km altitude.' },
    ],
  },
  {
    id: 'moon', level: 'Level 2 · Basics', title: 'The Moon', icon: '🌕', view: 'moon',
    steps: [
      { kind: 'info', title: 'Our neighbour', text: "The Moon is 384,400 km away — about 3 days of flight. Its gravity is 1/6 of Earth's (1.62 m/s²). There is no air, so no parachutes and no gliding." },
      { kind: 'info', title: 'Extreme temperatures', text: "In sunlight the surface reaches +127 °C, in shadow −173 °C. Your suit's cooling and heating system keeps you alive." },
      { kind: 'info', title: 'Lunar dust', text: 'Regolith is sharp and abrasive like ground glass. It clings to suits and can damage seals and lungs. Always clean up before removing the helmet in the cabin.' },
      { kind: 'quiz', q: 'How long does the trip to the Moon take?', options: ['3 hours', '3 days', '3 months'], answer: 1, why: 'Apollo crews took about 3 days.' },
      { kind: 'quiz', q: "Why can't you use parachutes on the Moon?", options: ['Gravity is too strong', 'There is no atmosphere', 'It is too cold'], answer: 1, why: 'No air means landings rely completely on rocket braking.' },
    ],
  },
  {
    id: 'mars', level: 'Level 3 · Advanced', title: 'Mars', icon: '🔴', view: 'mars',
    steps: [
      { kind: 'info', title: 'The red planet', text: "Mars is 55–400 million km from Earth. A trip takes 6–9 months. Gravity is 38% of Earth's. Its red colour comes from iron oxide (rust) dust." },
      { kind: 'info', title: 'Thin atmosphere', text: 'The air is 95% CO₂ and less than 1% as thick as Earth\'s. Landers use heat shields, parachutes AND rockets together.' },
      { kind: 'info', title: 'Communication delay', text: "Radio signals take 4 to 24 minutes one way. Mission Control can't help in real time — crews must solve emergencies themselves." },
      { kind: 'quiz', q: 'Why must Mars crews handle emergencies alone?', options: ["Radios don't work", 'Signals take up to 24 minutes', 'Mars has no satellites'], answer: 1, why: 'Light-speed delay makes live help impossible.' },
      { kind: 'quiz', q: 'Mars gravity compared to Earth is about…', options: ['38%', '100%', '16%'], answer: 0, why: 'About 0.38 g. (16% is the Moon.)' },
    ],
  },
  {
    id: 'ops', level: 'Level 4 · Operations', title: 'Spacecraft Controls', icon: '🎛️', view: 'space',
    steps: [
      { kind: 'info', title: 'Your cockpit', text: 'You are in the commander\'s seat. Drag to look around. Switches on the console are labelled — tap the glowing one when asked. Always follow the checklist in order.' },
      { kind: 'action', text: 'Power up the spacecraft.', control: 'master', hint: 'Left panel · MASTER PWR' },
      { kind: 'action', text: 'Start the oxygen supply.', control: 'o2', hint: 'Left panel · O₂ SUPPLY' },
      { kind: 'action', text: 'Pressurise the cabin.', control: 'cabin', hint: 'Left panel · CABIN PRESS' },
      { kind: 'action', text: 'Open a radio link with Mission Control.', control: 'comms', hint: 'Right panel · COMMS' },
      { kind: 'action', text: 'Align the guidance computer.', control: 'guidance', hint: 'Centre · GUIDANCE' },
      { kind: 'quiz', q: 'Why follow a checklist instead of memory?', options: ['It is faster to skip steps', 'It prevents missed steps under stress', "It's only for beginners"], answer: 1, why: 'Even veteran astronauts use checklists for every procedure.' },
    ],
  },
  {
    id: 'emergency', level: 'Level 5 · Emergency', title: 'Emergency Drills', icon: '🚨', view: 'space', alarm: true,
    steps: [
      { kind: 'info', title: '⚠ MASTER ALARM', text: 'Cabin pressure is dropping! Rule #1: stay calm. Protect the crew first, then fix the problem.' },
      { kind: 'action', text: 'Seal your suit and lock your helmet.', control: 'helmet', hint: 'Left panel · SUIT / HELMET' },
      { kind: 'action', text: 'Switch oxygen to the suit supply.', control: 'o2', hint: 'Left panel · O₂ SUPPLY' },
      { kind: 'action', text: 'Report the emergency to Mission Control.', control: 'comms', hint: 'Right panel · COMMS' },
      { kind: 'quiz', q: 'Fuel pressure is falling fast. What first?', options: ['Keep burning at full power', 'Close the valves to isolate the leak', 'Open the hatch to look'], answer: 1, why: 'Stop the loss first, then replan with Mission Control.' },
      { kind: 'quiz', q: 'The engine fails during launch. What do you do?', options: ['Wait and hope', 'Pull ABORT — the escape tower pulls the capsule to safety', 'Restart the computer'], answer: 1, why: 'The launch escape system exists for exactly this.' },
      { kind: 'action', text: 'Practise: arm the launch ABORT handle.', control: 'abort', hint: 'Right panel · ABORT' },
    ],
  },
  {
    id: 'launch', level: 'Level 6 · Mission', title: 'Launch Day', icon: '🚀', view: 'pad', shake: true,
    steps: [
      { kind: 'info', title: 'T-minus 10 minutes', text: "You're strapped in on top of a Saturn V, 110 m tall. Launch director: 'Go for launch.' Run the final checklist." },
      { kind: 'action', text: 'Start the fuel pumps.', control: 'fuel', hint: 'Centre · FUEL PUMPS' },
      { kind: 'action', text: 'Unlock the engine gimbal for steering.', control: 'gimbal', hint: 'Centre · ENG GIMBAL' },
      { kind: 'action', text: 'T-minus 3… 2… 1… IGNITION!', control: 'engine', hint: 'Centre · IGNITION' },
      { kind: 'action', text: 'Liftoff! Throttle up through max-Q.', control: 'throttle', hint: 'Right panel · THROTTLE' },
      { kind: 'action', text: 'First stage empty at 68 km — separate it.', control: 'sep', hint: 'Right panel · STAGE SEP' },
      { kind: 'info', title: 'Orbit achieved', text: '12 minutes after launch you are in orbit at 190 km and 7.8 km/s. You feel weightless. Secure loose items and check all systems.' },
    ],
  },
  {
    id: 'tli', level: 'Level 7 · Mission', title: 'Heading to the Moon', icon: '🌗', view: 'earth',
    steps: [
      { kind: 'info', title: 'Trans-Lunar Injection', text: 'After 1.5 orbits, the third stage fires again for 6 minutes to speed up to 10.8 km/s and leave Earth orbit toward the Moon.' },
      { kind: 'action', text: 'Confirm guidance for the TLI burn.', control: 'guidance', hint: 'Centre · GUIDANCE' },
      { kind: 'action', text: 'Re-ignite the engine.', control: 'engine', hint: 'Centre · IGNITION' },
      { kind: 'action', text: 'Burn complete — separate from the third stage.', control: 'sep', hint: 'Right panel · STAGE SEP' },
      { kind: 'info', title: '3 days of coasting', text: "Turn the ship around and dock with the lunar lander. Slowly rotate the ship ('barbecue roll') so the Sun heats it evenly. Eat, sleep, exercise and do mid-course corrections." },
      { kind: 'quiz', q: 'Why does the spacecraft slowly roll on the way to the Moon?', options: ['For fun', 'To heat it evenly in sunlight', 'To create gravity'], answer: 1, why: "The 'barbecue roll' stops one side overheating and the other freezing." },
      { kind: 'action', text: 'Lunar orbit insertion — brake with the engine behind the Moon.', control: 'engine', hint: 'Centre · IGNITION' },
      { kind: 'info', title: '🎖 Mission ready', text: 'You are in lunar orbit. Cockpit training is complete. Next, fly the full landing in the Apollo Mission Simulator.' },
    ],
  },
];

/** Number of scored items (quizzes + checklist actions) across the whole curriculum. */
export function scoredItemCount(levels: CockpitLevel[] = CURRICULUM): number {
  return levels.reduce(
    (n, lvl) => n + lvl.steps.filter((s) => s.kind !== 'info').length,
    0
  );
}
