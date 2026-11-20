/**
 * Rule-Based Campus Complaint Classifier
 * Built exclusively for Lovely Professional University (LPU), Phagwara Campus
 * 
 * Target Departments (Strictly 6):
 * 1. Plumbing
 * 2. Electrical
 * 3. Wi-Fi
 * 4. Mess
 * 5. Academic
 * 6. Other
 */

// Normalized keyword dictionaries with weightings
const DEPARTMENT_RULES = {
  Plumbing: {
    strongKeywords: [
      'leakage', 'leaking', 'leak', 'plumbing', 'plumber',
      'tap', 'taps', 'faucet', 'flush', 'commode', 'toilet',
      'drainage', 'drain', 'sewer', 'sewage', 'pipe', 'pipes',
      'shower', 'sink', 'basin', 'geyser', 'geezer', 'washroom',
      'urinal', 'ro water', 'water cooler', 'purifier'
    ],
    indicKeywords: [
      'paani', 'pani', 'nalka', 'nal', 'tootie', 'tuti',
      'panni', 'nahane', 'tanki', 'motor', 'ganda pani',
      'chhat tapak', 'tapak', 'seelan', 'badboo toilet',
      'toilet block', 'commode block', 'naali', 'nali',
      'paani muk gya', 'nalke'
    ],
    patterns: [
      /water\s+(leak|supply|shortage|dirty|pressure|cold|heater)/i,
      /washroom.*(leak|water|tap|flush|dirty|smell|choke|block)/i,
      /toilet.*(choke|block|flush|water|clean|leak)/i,
      /tap.*(leak|drop|broken|loose)/i,
      /geyser.*(water|leak|not heating|cold water|thanda)/i,
      /pani.*(nahi|leak|ganda|kharab|aata|aaraha)/i,
      /paani.*(muk|nahi|kadon|band)/i
    ]
  },

  Electrical: {
    strongKeywords: [
      'electricity', 'electric', 'electrical', 'electrician',
      'power', 'powercut', 'socket', 'switch', 'switchboard',
      'spark', 'sparking', 'short circuit', 'wiring', 'wire',
      'mcb', 'tripped', 'trip', 'blackout', 'voltage',
      'fan', 'ceiling fan', 'tubelight', 'bulb', 'light',
      'lights', 'ac', 'air conditioner', 'cooler motor'
    ],
    indicKeywords: [
      'bijli', 'current', 'pankha', 'pankhe', 'batti',
      'lightan', 'taar', 'taarein', 'short', 'dhuwan',
      'dhuan', 'plug point', 'switchboard jal', 'chhat wala pankha',
      'bijli chali', 'batti gul', 'current maar', 'light nahi',
      'pankha nahi chal reha'
    ],
    patterns: [
      /(power|electricity)\s+(cut|outage|failure|down|issue|problem)/i,
      /(short\s*circuit|spark|sparking|shock|burnt smell)/i,
      /(ac|air\s*conditioner).*(cool|cold|fan|remote|work|trip|gas)/i,
      /(ceiling\s*fan|fan).*(noise|slow|not working|stop|speed|hil raha)/i,
      /(light|tubelight|bulb).*(flicker|not working|fuse|chali gayi)/i,
      /(switch|socket|board|plug).*(loose|broken|spark|current)/i,
      /pankh[ae].*(nahi|slow|awaaz|kharaab)/i,
      /bijli.*(nahi|chali|band)/i
    ]
  },

  'Wi-Fi': {
    strongKeywords: [
      'wifi', 'wi-fi', 'internet', 'network', 'router',
      'broadband', 'lan', 'ethernet', 'bandwidth', 'connectivity',
      'signal', 'speed', 'disconnecting', 'disconnect',
      'portal', 'login portal', 'authentication', 'access point',
      'dns', 'ip address', 'hotspot', 'packet drop', 'ping'
    ],
    indicKeywords: [
      'net', 'hostel wifi', 'net slow', 'signal nahi',
      'connect nahi', 'range nahi', 'net band', 'portal login',
      'wi-fi down', 'net connection', 'wifi chal nahi',
      'wi fi band', 'signal bilkul nahi'
    ],
    patterns: [
      /wi-?fi.*(slow|connect|down|working|authenticate|range|drop|password|signal)/i,
      /internet.*(slow|speed|down|working|connect|disconnected)/i,
      /router.*(red light|blinking|reboot|restart|power)/i,
      /portal.*(login|authenticate|roll no|credentials|error)/i,
      /net.*(nahi chal|slow|band|aata|disconnect)/i,
      /range.*(nahi|bohot kam)/i
    ]
  },

  Mess: {
    strongKeywords: [
      'mess', 'canteen', 'food', 'meal', 'meals', 'dining',
      'breakfast', 'lunch', 'dinner', 'roti', 'chapati',
      'dal', 'daal', 'rice', 'sabzi', 'curry', 'curd',
      'caterer', 'kitchen', 'hygiene', 'insect', 'cockroach',
      'hair', 'stale', 'rotten', 'undercooked', 'tasteless',
      'diet', 'mess contractor', 'drinking water mess'
    ],
    indicKeywords: [
      'khana', 'khaana', 'kachi roti', 'baasi', 'keeda',
      'kida', 'baal', 'bal', 'pet kharab', 'swad',
      'namak', 'mirch', 'mess wale', 'khaana khrab',
      'safai mess', 'subah ka nashta', 'dhabe', 'rotiyaan'
    ],
    patterns: [
      /mess.*(food|lunch|dinner|breakfast|quality|dirty|hygiene|timing|staff)/i,
      /food.*(poison|quality|taste|stale|cold|bad|undercooked|raw|smell)/i,
      /(keeda|insect|cockroach|hair|stone|kankad).*(food|khana|daal|sabzi|plate)/i,
      /khana.*(kharab|ganda|baasi|kacha|swad|taste|thanda)/i,
      /roti.*(kachi|jali|hard|sukhi)/i,
      /daal.*(pani|namak|patli)/i
    ]
  },

  Academic: {
    strongKeywords: [
      'classroom', 'class', 'lecture', 'projector', 'podium',
      'faculty', 'teacher', 'professor', 'hod', 'lab',
      'laboratory', 'bench', 'desk', 'blackboard', 'whiteboard',
      'marker', 'duster', 'attendance', 'timetable', 'exam',
      'marks', 'syllabus', 'audio system', 'mic', 'microphone',
      'speaker classroom', 'lecture hall', 'practical', 'curriculum'
    ],
    indicKeywords: [
      'sir', 'maam', 'class room', 'attendance mark',
      'projector screen', 'bench toota', 'desk tuta',
      'mic awaaz', 'class cancel', 'lab computer',
      'attendance ka issue', 'timetable clash', 'speaker fati'
    ],
    patterns: [
      /projector.*(screen|on nahi|display|blur|cable|hdmi|remote)/i,
      /(classroom|lecture\s*hall|class).*(sound|mic|bench|ac|projector|audio)/i,
      /lab.*(system|pc|computer|software|equipment|apparatus|practical)/i,
      /attendance.*(portal|shortage|register|mark|update|error)/i,
      /(teacher|faculty|prof).*(not coming|absent|late|cancelled)/i,
      /desk.*(broken|toota|repair)/i,
      /bench.*(broken|hil raha)/i
    ]
  },

  Other: {
    strongKeywords: [
      'security', 'guard', 'lift', 'elevator', 'parking',
      'garbage', 'dustbin', 'sanitation', 'cleanliness',
      'laundry', 'washing machine', 'noise', 'stray dog',
      'monkey', 'dogs', 'gate', 'gatepass', 'id card',
      'lost and found', 'transport', 'bus', 'uni-mall',
      'gym', 'ground', 'corridor', 'campus facility'
    ],
    indicKeywords: [
      'guard', 'kooda', 'kachra', 'safai corridor',
      'bandar', 'kutte', 'lift band', 'kapde',
      'dhobi', 'shor', 'raat ko shor', 'id kho gaya',
      'gate pe', 'bus late', 'auto wale'
    ],
    patterns: [
      /(lift|elevator).*(stuck|not working|service|ground)/i,
      /(stray\s*dog|dog|monkey|monkeys).*(hostel|campus|biting|scary|corridor)/i,
      /(dustbin|garbage|kachra|kooda).*(overflow|smell|cleaning|not cleaned)/i,
      /(security|guard).*(behavior|misbehavior|rudeness|gate|checking)/i,
      /(laundry|washing\s*machine).*(broken|token|cloth|wash)/i,
      /(parking|bicycle|cycle|scooter|car).*(stolen|damage|space)/i,
      /(noise|sound|music).*(night|disturb|hostel wing)/i
    ]
  }
};

/**
 * Classifies a raw complaint into one of the 6 official departments.
 * 
 * @param {string} text - The raw complaint text
 * @returns {{ department: string, confidence: number, matchDetails: object }}
 */
export function classifyComplaint(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      department: 'Other',
      confidence: 0,
      matchDetails: { reason: 'Empty or invalid input' }
    };
  }

  const cleanText = text.toLowerCase().trim();

  // Score tracking per department
  const scores = {
    Plumbing: 0,
    Electrical: 0,
    'Wi-Fi': 0,
    Mess: 0,
    Academic: 0,
    Other: 0
  };

  const matches = {
    Plumbing: [],
    Electrical: [],
    'Wi-Fi': [],
    Mess: [],
    Academic: [],
    Other: []
  };

  // Evaluate rules
  for (const [dept, ruleSet] of Object.entries(DEPARTMENT_RULES)) {
    // 1. Strong keywords (weight = 3)
    for (const kw of ruleSet.strongKeywords) {
      const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
      if (regex.test(cleanText)) {
        scores[dept] += 3;
        matches[dept].push(`strong: ${kw}`);
      }
    }

    // 2. Indic / Hinglish / Punjabi terms (weight = 2.5)
    for (const kw of ruleSet.indicKeywords) {
      if (cleanText.includes(kw.toLowerCase())) {
        scores[dept] += 2.5;
        matches[dept].push(`indic: ${kw}`);
      }
    }

    // 3. Regular expression phrase patterns (weight = 4)
    for (const pat of ruleSet.patterns) {
      if (pat.test(cleanText)) {
        scores[dept] += 4;
        matches[dept].push(`pattern: ${pat.source}`);
      }
    }
  }

  // Domain-specific disambiguation overrides:
  // e.g. "geyser switch/spark" should weigh electrical more than plumbing
  if (cleanText.includes('geyser') || cleanText.includes('geezer')) {
    if (cleanText.includes('switch') || cleanText.includes('spark') || cleanText.includes('current') || cleanText.includes('mcb')) {
      scores.Electrical += 5;
    }
    if (cleanText.includes('leak') || cleanText.includes('pipe') || cleanText.includes('paani') || cleanText.includes('pani') || cleanText.includes('water')) {
      scores.Plumbing += 4;
    }
  }

  // "water cooler" with electrical shock vs water leak
  if (cleanText.includes('water cooler') || cleanText.includes('cooler')) {
    if (cleanText.includes('shock') || cleanText.includes('current') || cleanText.includes('motor')) {
      scores.Electrical += 4;
    }
  }

  // "projector ac classroom" disambiguation:
  if (cleanText.includes('classroom') || cleanText.includes('class')) {
    if (cleanText.includes('fan') || cleanText.includes('light') || cleanText.includes('ac') || cleanText.includes('switch')) {
      // Fan/AC in classroom is an Electrical issue
      scores.Electrical += 2;
    }
    if (cleanText.includes('projector') || cleanText.includes('mic') || cleanText.includes('speaker') || cleanText.includes('faculty') || cleanText.includes('attendance')) {
      // Teaching apparatus is Academic
      scores.Academic += 4;
    }
  }

  // Find department with maximum score
  let bestDept = 'Other';
  let maxScore = 0;

  for (const [dept, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestDept = dept;
    }
  }

  // If score is 0 or no specific signals found, fallback to 'Other'
  if (maxScore === 0) {
    bestDept = 'Other';
  }

  return {
    department: bestDept,
    rawScore: maxScore,
    matchDetails: {
      matchedRules: matches[bestDept] || [],
      allScores: scores
    }
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
