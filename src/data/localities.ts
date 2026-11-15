export interface Landmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Public-importance baseline of the road/junction, 0-100 (synthetic, for the prototype). */
  importance: number;
}

export interface Locality {
  name: string;
  zone: string;
  /** Affected-population baseline for the locality, 0-100 (synthetic density proxy). */
  density: number;
  landmarks: Landmark[];
}

/**
 * Localities, landmarks and coordinates are approximate and illustrative.
 * Zone mapping and scores are synthetic and exist only to drive the prototype.
 */
export const LOCALITIES: Locality[] = [
  {
    name: 'Koramangala',
    zone: 'South Zone',
    density: 60,
    landmarks: [
      { id: 'kor-sony', name: 'Sony World Junction, 4th Block', lat: 12.9352, lng: 77.6245, importance: 74 },
      { id: 'kor-80ft', name: '80 Feet Road, 4th Block', lat: 12.9341, lng: 77.6271, importance: 62 },
      { id: 'kor-khb', name: 'KHB Colony Main Road, 5th Block', lat: 12.93465, lng: 77.6258, importance: 60 },
      { id: 'kor-forum', name: 'Forum Mall Signal, Hosur Road', lat: 12.9348, lng: 77.6112, importance: 80 },
      { id: 'kor-6th', name: '17th Main, 6th Block', lat: 12.9386, lng: 77.6217, importance: 34 },
    ],
  },
  {
    name: 'Indiranagar',
    zone: 'East Zone',
    density: 62,
    landmarks: [
      { id: 'ind-metro', name: '100 Feet Road, Indiranagar Metro', lat: 12.9784, lng: 77.6408, importance: 80 },
      { id: 'ind-cmh', name: 'CMH Road Junction', lat: 12.979, lng: 77.637, importance: 68 },
      { id: 'ind-12th', name: '12th Main, HAL 2nd Stage', lat: 12.9719, lng: 77.6412, importance: 40 },
    ],
  },
  {
    name: 'Whitefield',
    zone: 'Mahadevapura Zone',
    density: 62,
    landmarks: [
      { id: 'wf-itpl', name: 'ITPL Main Road, Tech Park Gate', lat: 12.9857, lng: 77.737, importance: 74 },
      { id: 'wf-hopefarm', name: 'Hope Farm Junction, Varthur Road', lat: 12.9893, lng: 77.75, importance: 68 },
      { id: 'wf-station', name: 'Whitefield Railway Station Road', lat: 12.9975, lng: 77.757, importance: 56 },
    ],
  },
  {
    name: 'Electronic City',
    zone: 'Bommanahalli Zone',
    density: 52,
    landmarks: [
      { id: 'ec-flyover', name: 'Electronic City Phase 1 Flyover', lat: 12.8452, lng: 77.6602, importance: 80 },
      { id: 'ec-infosys', name: 'Hosur Road, Infosys Gate', lat: 12.844, lng: 77.663, importance: 68 },
      { id: 'ec-neeladri', name: 'Neeladri Road Underpass', lat: 12.846, lng: 77.67, importance: 52 },
    ],
  },
  {
    name: 'Jayanagar',
    zone: 'South Zone',
    density: 48,
    landmarks: [
      { id: 'jay-4th', name: '4th Block Shopping Complex', lat: 12.925, lng: 77.5938, importance: 74 },
      { id: 'jay-southend', name: 'South End Circle', lat: 12.938, lng: 77.58, importance: 68 },
      { id: 'jay-9th', name: '36th Cross, 9th Block', lat: 12.918, lng: 77.587, importance: 34 },
    ],
  },
  {
    name: 'Marathahalli',
    zone: 'Mahadevapura Zone',
    density: 70,
    landmarks: [
      { id: 'mar-bridge', name: 'Marathahalli Bridge', lat: 12.9569, lng: 77.7011, importance: 80 },
      { id: 'mar-orr', name: 'Outer Ring Road, Kundalahalli Gate', lat: 12.965, lng: 77.716, importance: 74 },
      { id: 'mar-munekolala', name: 'Munekolala Main Road', lat: 12.954, lng: 77.708, importance: 34 },
    ],
  },
  {
    name: 'HSR Layout',
    zone: 'Bommanahalli Zone',
    density: 50,
    landmarks: [
      { id: 'hsr-bda', name: 'BDA Complex, Sector 6', lat: 12.9116, lng: 77.6389, importance: 62 },
      { id: 'hsr-27th', name: '27th Main, Sector 1', lat: 12.9082, lng: 77.6476, importance: 56 },
      { id: 'hsr-agara', name: 'Agara Lake Junction', lat: 12.923, lng: 77.65, importance: 62 },
    ],
  },
];

export function getLocality(name: string): Locality | undefined {
  return LOCALITIES.find((l) => l.name === name);
}

export function getLandmark(locality: string, landmarkId: string): Landmark | undefined {
  return getLocality(locality)?.landmarks.find((m) => m.id === landmarkId);
}
