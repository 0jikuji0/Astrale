export type AstronomicalPosition = {
    name: string;
    ra: string;
    dec: string;
    az: string;
    alt: string;
};

export type PositionsResponse = {
    positions: AstronomicalPosition[];
    location: {
        latitude: number;
        longitude: number;
        elevation: number;
        timezone: number;
    };
    time_info: {
        calculated_for_utc: string;
        local_time_display: string;
        julian_day: number;
        local_sidereal_time: string;
    };
};

const API_BASE_URL = 'https://cors-anywhere.herokuapp.com/https://api.le-systeme-solaire.net/rest';
const API_TOKEN = 'aa48c48d-c1dc-4a68-ba28-6671bbd085ab';

export const fetchCelestialPositions = async (
    latitude: number = 90,
    longitude: number = 90,
    elevation: number = 90,
    timezone: number = 0,
    datetime: string = new Date().toISOString()
): Promise<PositionsResponse> => {
    const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        elev: elevation.toString(),
        zone: timezone.toString(),
    });

    if (datetime) {
        params.append('datetime', datetime);
    }

    const response = await fetch(`${API_BASE_URL}/positions?${params}`, {
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`,
        },
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
};

const parseRA = (ra: string): number => {
    const match = ra.match(/(\d+)h\s*(\d+)min\s*(\d+)s/);
    if (!match) return 0;
    const [, hours, minutes, seconds] = match.map(Number);
    return (hours + minutes / 60 + seconds / 3600) * 15;
};

const parseDec = (dec: string): number => {
    const match = dec.match(/(-?\d+)°(\d+)'(\d+)"/);
    if (!match) return 0;
    const degrees = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
    return decimal * (degrees < 0 ? -1 : 1);
};

export const astronomicalToCartesian = (
    ra: string,
    dec: string,
    distance: number = 1
): [number, number, number] => {
    const raDecimal = parseRA(ra);
    const decDecimal = parseDec(dec);

    const raRad = (raDecimal * Math.PI) / 180;
    const decRad = (decDecimal * Math.PI) / 180;

    const x = distance * Math.cos(decRad) * Math.cos(raRad);
    const y = distance * Math.sin(decRad);
    const z = distance * Math.cos(decRad) * Math.sin(raRad);

    return [x, y, z];
};

const PLANET_NAME_MAP: Record<string, string> = {
    'Mercury': 'Mercure',
    'Mercure': 'Mercure',
    'Venus': 'Vénus',
    'Vénus': 'Vénus',
    'Mars': 'Mars',
    'Jupiter': 'Jupiter',
    'Saturn': 'Saturne',
    'Saturne': 'Saturne',
    'Uranus': 'Uranus',
    'Neptune': 'Neptune',
    'Moon': 'Moon',
    'Lune': 'Moon',
    'Sun': 'Sun',
    'Soleil': 'Sun',
    'Earth': 'Terre',
    'Terre': 'Terre',
};

export const mapPlanetName = (apiName: string): string | null =>
    PLANET_NAME_MAP[apiName] || null;

export const getCurrentDateForAPI = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
};
