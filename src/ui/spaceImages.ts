// NASA photographs bundled with the app. The reference project pointed at hosted
// Lovable URLs that only resolve on its own host; these local copies work anywhere.
import earthUrl from './assets/space/earth.jpg';
import moonUrl from './assets/space/moon.jpg';
import marsUrl from './assets/space/mars.jpg';
import padUrl from './assets/space/pad.jpg';
import cockpitUrl from './assets/space/cockpit-interior.jpg';

export const SPACE_IMAGES = {
  pad: padUrl,
  earth: earthUrl,
  moon: moonUrl,
  mars: marsUrl,
  space: earthUrl,
  cabin: cockpitUrl,
} as const;

export type SpaceImageKey = keyof typeof SPACE_IMAGES;
