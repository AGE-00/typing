type RomanizationPreference = 'hepburn' | 'kunrei';

type RomanizationSegment = {
  source: string;
  primary: string;
  alternatives: string[];
};

const digraphs: Record<string, { hepburn: string; kunrei?: string; alternatives?: string[] }> = {
  きゃ: { hepburn: 'kya' }, きゅ: { hepburn: 'kyu' }, きょ: { hepburn: 'kyo' },
  しゃ: { hepburn: 'sha', kunrei: 'sya', alternatives: ['sha', 'sya'] }, しゅ: { hepburn: 'shu', kunrei: 'syu', alternatives: ['shu', 'syu'] }, しょ: { hepburn: 'sho', kunrei: 'syo', alternatives: ['sho', 'syo'] },
  ちゃ: { hepburn: 'cha', kunrei: 'tya', alternatives: ['cha', 'tya', 'cya'] }, ちゅ: { hepburn: 'chu', kunrei: 'tyu', alternatives: ['chu', 'tyu', 'cyu'] }, ちょ: { hepburn: 'cho', kunrei: 'tyo', alternatives: ['cho', 'tyo', 'cyo'] },
  にゃ: { hepburn: 'nya' }, にゅ: { hepburn: 'nyu' }, にょ: { hepburn: 'nyo' },
  ひゃ: { hepburn: 'hya' }, ひゅ: { hepburn: 'hyu' }, ひょ: { hepburn: 'hyo' },
  みゃ: { hepburn: 'mya' }, みゅ: { hepburn: 'myu' }, みょ: { hepburn: 'myo' },
  りゃ: { hepburn: 'rya' }, りゅ: { hepburn: 'ryu' }, りょ: { hepburn: 'ryo' },
  ぎゃ: { hepburn: 'gya' }, ぎゅ: { hepburn: 'gyu' }, ぎょ: { hepburn: 'gyo' },
  じゃ: { hepburn: 'ja', kunrei: 'zya', alternatives: ['ja', 'zya', 'jya'] }, じゅ: { hepburn: 'ju', kunrei: 'zyu', alternatives: ['ju', 'zyu', 'jyu'] }, じょ: { hepburn: 'jo', kunrei: 'zyo', alternatives: ['jo', 'zyo', 'jyo'] },
  びゃ: { hepburn: 'bya' }, びゅ: { hepburn: 'byu' }, びょ: { hepburn: 'byo' },
  ぴゃ: { hepburn: 'pya' }, ぴゅ: { hepburn: 'pyu' }, ぴょ: { hepburn: 'pyo' },
  てぃ: { hepburn: 'ti', alternatives: ['ti', 'thi'] }, でぃ: { hepburn: 'di', alternatives: ['di', 'dhi'] },
  ふぁ: { hepburn: 'fa' }, ふぃ: { hepburn: 'fi' }, ふぇ: { hepburn: 'fe' }, ふぉ: { hepburn: 'fo' },
  ヴぁ: { hepburn: 'va' }, ヴぃ: { hepburn: 'vi' }, ヴぇ: { hepburn: 've' }, ヴぉ: { hepburn: 'vo' },
};

const kana: Record<string, { hepburn: string; kunrei?: string; alternatives?: string[] }> = {
  あ: { hepburn: 'a' }, い: { hepburn: 'i' }, う: { hepburn: 'u' }, え: { hepburn: 'e' }, お: { hepburn: 'o' },
  か: { hepburn: 'ka' }, き: { hepburn: 'ki' }, く: { hepburn: 'ku' }, け: { hepburn: 'ke' }, こ: { hepburn: 'ko' },
  さ: { hepburn: 'sa' }, し: { hepburn: 'shi', kunrei: 'si', alternatives: ['shi', 'si'] }, す: { hepburn: 'su' }, せ: { hepburn: 'se' }, そ: { hepburn: 'so' },
  た: { hepburn: 'ta' }, ち: { hepburn: 'chi', kunrei: 'ti', alternatives: ['chi', 'ti'] }, つ: { hepburn: 'tsu', kunrei: 'tu', alternatives: ['tsu', 'tu'] }, て: { hepburn: 'te' }, と: { hepburn: 'to' },
  な: { hepburn: 'na' }, に: { hepburn: 'ni' }, ぬ: { hepburn: 'nu' }, ね: { hepburn: 'ne' }, の: { hepburn: 'no' },
  は: { hepburn: 'ha', alternatives: ['ha', 'wa'] }, ひ: { hepburn: 'hi' }, ふ: { hepburn: 'fu', kunrei: 'hu', alternatives: ['fu', 'hu'] }, へ: { hepburn: 'he', alternatives: ['he', 'e'] }, ほ: { hepburn: 'ho' },
  ま: { hepburn: 'ma' }, み: { hepburn: 'mi' }, む: { hepburn: 'mu' }, め: { hepburn: 'me' }, も: { hepburn: 'mo' },
  や: { hepburn: 'ya' }, ゆ: { hepburn: 'yu' }, よ: { hepburn: 'yo' },
  ら: { hepburn: 'ra' }, り: { hepburn: 'ri' }, る: { hepburn: 'ru' }, れ: { hepburn: 're' }, ろ: { hepburn: 'ro' },
  わ: { hepburn: 'wa' }, を: { hepburn: 'wo', alternatives: ['wo', 'o'] },
  が: { hepburn: 'ga' }, ぎ: { hepburn: 'gi' }, ぐ: { hepburn: 'gu' }, げ: { hepburn: 'ge' }, ご: { hepburn: 'go' },
  ざ: { hepburn: 'za' }, じ: { hepburn: 'ji', kunrei: 'zi', alternatives: ['ji', 'zi'] }, ず: { hepburn: 'zu' }, ぜ: { hepburn: 'ze' }, ぞ: { hepburn: 'zo' },
  だ: { hepburn: 'da' }, ぢ: { hepburn: 'ji', kunrei: 'di', alternatives: ['ji', 'di'] }, づ: { hepburn: 'zu', kunrei: 'du', alternatives: ['zu', 'du'] }, で: { hepburn: 'de' }, ど: { hepburn: 'do' },
  ば: { hepburn: 'ba' }, び: { hepburn: 'bi' }, ぶ: { hepburn: 'bu' }, べ: { hepburn: 'be' }, ぼ: { hepburn: 'bo' },
  ぱ: { hepburn: 'pa' }, ぴ: { hepburn: 'pi' }, ぷ: { hepburn: 'pu' }, ぺ: { hepburn: 'pe' }, ぽ: { hepburn: 'po' },
  ぁ: { hepburn: 'a', alternatives: ['a', 'xa', 'la'] }, ぃ: { hepburn: 'i', alternatives: ['i', 'xi', 'li'] }, ぅ: { hepburn: 'u', alternatives: ['u', 'xu', 'lu'] }, ぇ: { hepburn: 'e', alternatives: ['e', 'xe', 'le'] }, ぉ: { hepburn: 'o', alternatives: ['o', 'xo', 'lo'] },
  ゔ: { hepburn: 'vu' }, ー: { hepburn: '-' },
};

const katakanaStart = 'ァ'.charCodeAt(0);
const katakanaEnd = 'ヶ'.charCodeAt(0);
const punctuationPattern = /[\s、。,.!?！？「」『』（）()]/g;
const nNeedsBoundary = /^[あいうえおやゆよ]/;

export function toHiragana(text: string) {
  return [...text].map((char) => {
    const code = char.charCodeAt(0);
    if (code >= katakanaStart && code <= katakanaEnd) return String.fromCharCode(code - 0x60);
    return char;
  }).join('');
}

function optionFor(entry: { hepburn: string; kunrei?: string; alternatives?: string[] }, preference: RomanizationPreference) {
  return preference === 'kunrei' && entry.kunrei ? entry.kunrei : entry.hepburn;
}

function uniqueOptions(primary: string, options: string[]) {
  return [primary, ...options.filter((option) => option !== primary)].filter((option, index, array) => option && array.indexOf(option) === index);
}

function buildSegments(text: string, preference: RomanizationPreference = 'hepburn'): RomanizationSegment[] {
  const source = toHiragana(text).replace(punctuationPattern, '');
  const segments: RomanizationSegment[] = [];
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === 'っ') {
      const nextPair = source.slice(i + 1, i + 3);
      const nextEntry = digraphs[nextPair] ?? kana[source[i + 1]];
      const nextPrimary = nextEntry ? optionFor(nextEntry, preference) : '';
      const primary = nextPrimary[0] ?? '';
      segments.push({ source: char, primary, alternatives: uniqueOptions(primary, [primary, 'xtu', 'ltu']) });
      continue;
    }
    if (char === 'ん') {
      const nextPair = source.slice(i + 1, i + 3);
      const nextChar = source[i + 1] ?? '';
      const nextSource = digraphs[nextPair] ? nextPair : nextChar;
      const options = nNeedsBoundary.test(nextSource) ? ['nn', "n'"] : ['n', 'nn'];
      segments.push({ source: char, primary: options[0], alternatives: options });
      continue;
    }
    const pair = source.slice(i, i + 2);
    const digraph = digraphs[pair];
    if (digraph) {
      const primary = optionFor(digraph, preference);
      segments.push({ source: pair, primary, alternatives: uniqueOptions(primary, digraph.alternatives ?? [digraph.hepburn, digraph.kunrei ?? '']) });
      i += 1;
      continue;
    }
    const entry = kana[char];
    if (entry) {
      const primary = optionFor(entry, preference);
      segments.push({ source: char, primary, alternatives: uniqueOptions(primary, entry.alternatives ?? [entry.hepburn, entry.kunrei ?? '']) });
      continue;
    }
    const primary = char.toLowerCase();
    segments.push({ source: char, primary, alternatives: [primary] });
  }
  return segments;
}

function appendPreferredRest(segments: RomanizationSegment[], startIndex: number) {
  return segments.slice(startIndex).map((segment) => segment.primary).join('');
}

export function getPrimaryRomanization(text: string, preference: RomanizationPreference = 'hepburn') {
  return buildSegments(text, preference).map((segment) => segment.primary).join('');
}

export function buildAcceptedRomanizations(text: string, preference: RomanizationPreference = 'hepburn') {
  const segments = buildSegments(text, preference);
  const results = new Set(['']);
  const maxCandidates = 4096;
  for (const segment of segments) {
    const next = new Set<string>();
    for (const current of results) {
      segment.alternatives.forEach((option) => next.add(current + option));
      if (next.size >= maxCandidates) break;
    }
    results.clear();
    for (const value of next) results.add(value);
    if (results.size >= maxCandidates) break;
  }
  return [...results].sort((a, b) => a.length - b.length || a.localeCompare(b));
}

export function chooseBestRomanization(typed: string, acceptedRomanizations: string[]) {
  const normalized = typed.toLowerCase();
  const candidates = acceptedRomanizations
    .filter((target) => target.startsWith(normalized))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  const target = candidates[0];
  if (!target) return null;
  return {
    target,
    complete: normalized === target,
    nextExpected: target[normalized.length] ?? '',
  };
}

export function chooseRomanizationForText(text: string, typed: string, preference: RomanizationPreference = 'hepburn') {
  const normalized = typed.toLowerCase();
  const segments = buildSegments(text, preference);
  const primaryTarget = appendPreferredRest(segments, 0);
  if (!normalized) {
    return { target: primaryTarget, complete: primaryTarget.length === 0, nextExpected: primaryTarget[0] ?? '' };
  }

  let target: string | null = null;
  const visit = (index: number, built: string): boolean => {
    if (built.length >= normalized.length) {
      if (!built.startsWith(normalized)) return false;
      target = built + appendPreferredRest(segments, index);
      return true;
    }
    if (index >= segments.length) {
      if (built === normalized) {
        target = built;
        return true;
      }
      return false;
    }
    for (const option of segments[index].alternatives) {
      const next = built + option;
      if ((normalized.startsWith(next) || next.startsWith(normalized)) && visit(index + 1, next)) return true;
    }
    return false;
  };

  if (!visit(0, '') || target === null) return null;
  return {
    target,
    complete: normalized === target,
    nextExpected: target[normalized.length] ?? '',
  };
}

export function getRomanizationEfficiency(typed: string, acceptedRomanizations: string[]) {
  const sorted = [...acceptedRomanizations].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const optimal = sorted[0] ?? typed;
  const extraKeystrokes = Math.max(0, typed.length - optimal.length);
  const efficiency = typed.length === 0 ? 100 : (optimal.length / typed.length) * 100;
  return {
    typed,
    optimal,
    extraKeystrokes,
    efficiency,
  };
}

export function nextExpectedChar(target: string, position: number) {
  return target[position] ?? '';
}
