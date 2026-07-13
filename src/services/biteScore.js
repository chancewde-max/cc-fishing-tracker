// ============================================================
// biteScore.js — species-specific best-bite scoring.
// Inputs are normalized outputs from the weather/tides/solunar
// services. Returns a 1-5 score, a label, and human reason bullets.
// ============================================================

export const SPECIES = [
  { key: 'trout', name: 'Speckled Trout', emoji: '🎣' },
  { key: 'redfish', name: 'Redfish', emoji: '🐟' },
  { key: 'drum', name: 'Black Drum', emoji: '🥁' },
];

const LABELS = {
  5: 'Excellent',
  4: 'Good',
  3: 'Fair',
  2: 'Poor',
  1: 'Poor',
};

/** Map a 0-100 score to a 1-5 bucket (rounded, clamped). */
function toStar(score) {
  const s = Math.max(0, Math.min(100, score));
  return Math.max(1, Math.min(5, Math.round((s / 100) * 5)));
}

function classify(score) {
  return LABELS[toStar(score)];
}

// ---- Per-species scoring ----------------------------------------------

function scoreTrout({ windSpeed, pressureTrend, tideState, solunarScore, waterTemp }) {
  let score = 62;
  const reasons = [];

  // Wind: <12 great, >18 bad
  if (windSpeed != null) {
    if (windSpeed < 12) {
      score += 14;
      reasons.push(`Light wind (${Math.round(windSpeed)} mph) — calm, fish feed up top.`);
    } else if (windSpeed <= 18) {
      score += 2;
      reasons.push(`Moderate wind (${Math.round(windSpeed)} mph).`);
    } else {
      score -= 18;
      reasons.push(`Breezy (${Math.round(windSpeed)} mph) — chop roughs up the trout bite.`);
    }
  }

  // Pressure: stable or falling preferred
  if (pressureTrend != null) {
    if (pressureTrend < -0.5) {
      score += 10;
      reasons.push('Falling barometer — classic pre-front trout feed.');
    } else if (pressureTrend <= 0.5) {
      score += 3;
      reasons.push('Steady pressure.');
    } else {
      score -= 10;
      reasons.push('Rising pressure — trout go a bit lockjaw.');
    }
  }

  // Tide: moving water
  if (tideState) {
    if (tideState.isMoving) {
      score += 8;
      reasons.push('Tide is moving — trout stack on the edges.');
    } else {
      score -= 6;
      reasons.push('Near slack tide — slower bite.');
    }
  }

  // Water temp: cooler (<78F) better
  if (waterTemp != null) {
    if (waterTemp < 78) {
      score += 6;
      reasons.push(`Water ${Math.round(waterTemp)}°F — in the trout sweet spot.`);
    } else {
      score -= 8;
      reasons.push(`Warm water (${Math.round(waterTemp)}°F) — trout seek deeper, darker holes.`);
    }
  }

  // Solunar
  if (solunarScore != null) {
    score += Math.round((solunarScore - 50) * 0.25);
    if (solunarScore >= 75) reasons.push('Strong solunar window active.');
  }

  return { score: Math.round(score), reasons };
}

function scoreRedfish({ windSpeed, pressureTrend, tideState, solunarScore, waterTemp }) {
  let score = 66;
  const reasons = [];

  // Tolerant of wind
  if (windSpeed != null) {
    if (windSpeed < 14) {
      score += 8;
      reasons.push(`Light wind (${Math.round(windSpeed)} mph).`);
    } else if (windSpeed <= 22) {
      score += 2;
      reasons.push(`Windy (${Math.round(windSpeed)} mph) — redfish don't mind.`);
    } else {
      score -= 8;
      reasons.push(`Strong wind (${Math.round(windSpeed)} mph) — sight-casting harder.`);
    }
  }

  // Loves moving tide + low light
  if (tideState) {
    if (tideState.isMoving) {
      score += 12;
      reasons.push('Moving tide — redfish cruise the flats hard.');
    } else {
      score -= 4;
      reasons.push('Slack tide — try potholes and drains.');
    }
  }

  // Low light (dawn/dusk/minor) — check solunar currentPeriod via solunarScore boost already;
  // here we nudge for warmer tolerance.
  if (waterTemp != null) {
    if (waterTemp >= 70 && waterTemp <= 84) {
      score += 4;
      reasons.push(`Water ${Math.round(waterTemp)}°F — redfish comfortable.`);
    } else if (waterTemp > 84) {
      score -= 4;
      reasons.push(`Hot water (${Math.round(waterTemp)}°F) — target early/late.`);
    }
  }

  if (pressureTrend != null) {
    if (pressureTrend < 0.5) {
      score += 4;
      reasons.push('Falling/stable pressure — reds stay active.');
    } else {
      score -= 3;
    }
  }

  if (solunarScore != null) {
    score += Math.round((solunarScore - 50) * 0.2);
    if (solunarScore >= 75) reasons.push('Prime solunar window.');
  }

  return { score: Math.round(score), reasons };
}

function scoreDrum({ windSpeed, pressureTrend, tideState, solunarScore, waterTemp }) {
  let score = 70;
  const reasons = [];

  // Loves big tidal movement
  if (tideState) {
    if (tideState.range != null && tideState.range >= 1.0) {
      score += 14;
      reasons.push(`Big tide swing (${tideState.range.toFixed(1)} ft) — drum feed the cuts.`);
    } else if (tideState.isMoving) {
      score += 8;
      reasons.push('Tide moving — drum work the channels.');
    } else {
      score -= 6;
      reasons.push('Slack water — drum slow down.');
    }
  }

  // Tolerant of wind
  if (windSpeed != null) {
    if (windSpeed > 20) {
      score += 2;
      reasons.push(`Windy (${Math.round(windSpeed)} mph) — doesn't bother drum.`);
    } else {
      reasons.push(`Wind ${Math.round(windSpeed ?? 0)} mph — fine.`);
    }
  }

  // Cooler fine
  if (waterTemp != null) {
    if (waterTemp <= 78) {
      score += 4;
      reasons.push(`Water ${Math.round(waterTemp)}°F — drum steady.`);
    } else {
      score -= 2;
      reasons.push(`Warmer water (${Math.round(waterTemp)}°F) — drum deeper.`);
    }
  }

  if (pressureTrend != null) {
    if (pressureTrend <= 0.5) score += 3;
    else score -= 2;
  }

  if (solunarScore != null) {
    score += Math.round((solunarScore - 50) * 0.15);
    if (solunarScore >= 75) reasons.push('Good solunar timing.');
  }

  return { score: Math.round(score), reasons };
}

const STRATEGIES = {
  trout: scoreTrout,
  redfish: scoreRedfish,
  drum: scoreDrum,
};

/**
 * Compute a best-bite score for a species.
 * @param {{windSpeed:number,pressureTrend:number,tideState:object,solunarScore:number,waterTemp:number}} input
 * @param {string} species 'trout'|'redfish'|'drum'
 * @returns {{score:1|2|3|4|5,label:string,reasons:string[]}}
 */
export function computeBite(input, species) {
  const fn = STRATEGIES[species];
  if (!fn) {
    return { score: 3, label: 'Fair', reasons: ['Unknown species.'] };
  }
  const { score, reasons } = fn(input || {});
  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: toStar(clamped),
    label: classify(clamped),
    reasons: reasons.slice(0, 3),
  };
}

export default computeBite;
