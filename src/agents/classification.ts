import type { AgentResult, Category, ClassificationOutput, ImageMeta } from '../types';
import { CATEGORIES } from '../types';

interface Rule {
  re: RegExp;
  label: string;
  weight: number;
}

/** Transparent keyword rules. Weight 2 = strong signal, 1 = weak signal. */
const RULES: Record<Category, Rule[]> = {
  Pothole: [
    { re: /pot\s?holes?/, label: 'pothole', weight: 2 },
    { re: /\bcrater/, label: 'crater', weight: 2 },
    { re: /sink\s?hole|caved|cave-in|caving/, label: 'road cave-in', weight: 2 },
    { re: /(damaged|broken|bad|cracked|uneven)\s+(road|surface|tar|asphalt)|road\s+(damage|surface)/, label: 'damaged road', weight: 2 },
    { re: /asphalt|\btar\b|\bditch|\bcracks?\b|resurfac/, label: 'road surface', weight: 1 },
  ],
  Garbage: [
    { re: /garbage|trash|litter|rubbish/, label: 'garbage', weight: 2 },
    { re: /\bwaste\b|\bdump(ed|ing)?\b|landfill|debris/, label: 'waste/dumping', weight: 2 },
    { re: /dustbin|\bbins?\b|\bskip\b|compactor/, label: 'bin/skip', weight: 1 },
    { re: /stench|stink|rotting|foul smell|\bsmell/, label: 'odour', weight: 1 },
    { re: /not (been )?(collected|cleared|picked)/, label: 'not collected', weight: 2 },
  ],
  Streetlight: [
    { re: /street\s?-?lights?|\blamp\s?posts?|light\s+poles?|lamp\b/, label: 'streetlight', weight: 2 },
    { re: /no lights?|lights? (are |is )?(off|dead|out|not working)|not working.*light|light.*not working/, label: 'light not working', weight: 2 },
    { re: /\bbulbs?\b|flicker|electric pole/, label: 'bulb/pole', weight: 1 },
    { re: /\bdark\b|darkness|unlit/, label: 'dark stretch', weight: 1 },
  ],
  Waterlogging: [
    { re: /water\s?-?\s?logg|water\s?-?logging/, label: 'waterlogging', weight: 2 },
    { re: /flood|inundat|submerg|knee-deep|waist-deep/, label: 'flooding', weight: 2 },
    { re: /stagnant|stagnat|puddle|ponding|rainwater|water on (the )?road/, label: 'stagnant water', weight: 2 },
    { re: /storm\s?water|\bdrains?\b|sewage|overflowing drain|drain overflow/, label: 'drain/sewage', weight: 1 },
    { re: /\brain\b|downpour|monsoon/, label: 'rain', weight: 1 },
  ],
};

function score(text: string): { scores: Record<Category, number>; hits: Record<Category, string[]> } {
  const scores = {} as Record<Category, number>;
  const hits = {} as Record<Category, string[]>;
  for (const c of CATEGORIES) {
    scores[c] = 0;
    hits[c] = [];
    for (const r of RULES[c]) {
      if (r.re.test(text)) {
        scores[c] += r.weight;
        hits[c].push(r.label);
      }
    }
  }
  return { scores, hits };
}

/** Stage 1 – Classification Agent (simulated, rule-based; uses text + image *metadata* only). */
export function classificationAgent(input: {
  description: string;
  citizenCategory: Category | '';
  image?: ImageMeta;
}): AgentResult<ClassificationOutput> {
  const text = input.description.toLowerCase();
  const { scores, hits } = score(text);

  // Image metadata only (file name). No computer-vision model is used.
  let imageSignal = 'No image attached.';
  if (input.image) {
    const fileText = input.image.name.toLowerCase().replace(/[_\-.]+/g, ' ');
    const img = score(fileText);
    const best = CATEGORIES.filter((c) => img.scores[c] > 0).sort((a, b) => img.scores[b] - img.scores[a])[0];
    if (best) {
      scores[best] += 1;
      imageSignal = `Image attached (${input.image.width}×${input.image.height}, ${input.image.sizeKB} KB). File name hints "${best}" (metadata only – no visual model).`;
    } else {
      imageSignal = `Image attached (${input.image.width}×${input.image.height}, ${input.image.sizeKB} KB). No category hint in metadata; pixels are not analysed (no vision model).`;
    }
  }

  const evidence = { ...scores };
  const prior = input.citizenCategory;
  if (prior) scores[prior] += 1; // the citizen's own selection is a weak prior

  const ranked = [...CATEGORIES].sort((a, b) => scores[b] - scores[a]);
  const top = ranked[0];
  const hasEvidence = evidence[top] > 0 || (prior !== '' && scores[prior] > 0);
  const category: Category | null = hasEvidence ? top : null;

  const total = CATEGORIES.reduce((s, c) => s + scores[c], 0);
  const share = total > 0 ? scores[top] / total : 0;
  const strength = Math.min(1, evidence[top] / 3);
  const confidence = category ? Math.round(100 * Math.min(0.98, 0.45 + 0.35 * share + 0.2 * strength)) : 0;
  const matchedKeywords = category ? hits[category] : [];
  const agrees = !!category && (prior === '' || prior === category);
  const needsReview = !category || !agrees || evidence[top] === 0;

  let explanation: string;
  if (!category) {
    explanation = 'No civic-issue keywords found in the description, so the complaint could not be classified automatically.';
  } else if (!agrees) {
    explanation = `Description language points to ${category} (${matchedKeywords.join(', ')}), which differs from the citizen's selection (${prior}). Flagged for officer review.`;
  } else if (evidence[top] === 0) {
    explanation = `No strong keywords found; accepted the citizen's selection (${category}). Flagged for officer review.`;
  } else {
    explanation = `Matched ${matchedKeywords.map((k) => `"${k}"`).join(', ')} → ${category}.`;
  }

  return {
    agent: 'Classification Agent',
    stage: 1,
    mode: 'simulated-rule-based',
    output: {
      category,
      citizenCategory: prior,
      confidence,
      matchedKeywords,
      imageSignal,
      agreesWithCitizen: agrees,
      needsReview,
    },
    explanation,
  };
}
