export type SolarSystemBodyData = {
    id: string
    name: string
    englishName: string
    isPlanet: boolean
    moons?: Moon[]
    semimajorAxis: number
    perihelion: number
    aphelion: number
    eccentricity: number
    inclination: number
    mass?: Mass
    vol?: Vol
    density: number
    gravity: number
    escape: number
    meanRadius: number
    equaRadius: number
    polarRadius: number
    flattening: number
    dimension: string
    sideralOrbit: number
    sideralRotation: number
    aroundPlanet?: AroundPlanet
    discoveredBy: string
    discoveryDate: string
    alternativeName: string
    axialTilt: number
    avgTemp: number
    mainAnomaly: number
    argPeriapsis: number
    longAscNode: number
    bodyType: string
    rel: string
}

export type Moon = {
    moon: string
    rel: string
}

export type Mass = {
    massValue: number
    massExponent: number
}

export type Vol = {
    volValue: number
    volExponent: number
}

export type AroundPlanet = {
    planet: string
    rel: string
}

// Legacy type for backwards compatibility
export type Body = SolarSystemBodyData;
