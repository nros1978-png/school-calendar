// Database Module for School Calendar & Gantt Application
// Manages Firestore persistence for Users, Calendar_Base, and Events tables with real-time snapshot updates.

import { db } from './firebase.js';
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const DEFAULT_CALENDAR_BASE = [
  { date: '2026-09-01', hebrewDate: "י\"ט באלול תשפ\"ו", status: 'Regular', description: 'פתיחת שנת הלימודים תשפ"ז' },
  { date: '2026-09-11', hebrewDate: "כ\"ט באלול תשפ\"ו", status: 'Holiday', description: 'ערב ראש השנה' },
  { date: '2026-09-12', hebrewDate: "א' בתשרי תשפ\"ז", status: 'Holiday', description: 'ראש השנה - יום א\'' },
  { date: '2026-09-13', hebrewDate: "ב' בתשרי תשפ\"ז", status: 'Holiday', description: 'ראש השנה - יום ב\'' },
  { date: '2026-09-20', hebrewDate: "ט' בתשרי תשפ\"ז", status: 'Holiday', description: 'ערב יום כיפור' },
  { date: '2026-09-21', hebrewDate: "י' בתשרי תשפ\"ז", status: 'Holiday', description: 'יום כיפור' },
  { date: '2026-09-25', hebrewDate: "י\"ד בתשרי תשפ\"ז", status: 'Holiday', description: 'ערב סוכות' },
  { date: '2026-09-26', hebrewDate: "ט\"ו בתשרי תשפ\"ז", status: 'Holiday', description: 'חג סוכות' },
  { date: '2026-09-27', hebrewDate: "ט\"ז בתשרי תשפ\"ז", status: 'Holiday', description: 'סוכות - חול המועד' },
  { date: '2026-09-28', hebrewDate: "י\"ז בתשרי תשפ\"ז", status: 'Holiday', description: 'סוכות - חול המועד' },
  { date: '2026-09-29', hebrewDate: "י\"ח בתשרי תשפ\"ז", status: 'Holiday', description: 'סוכות - חול המועד' },
  { date: '2026-09-30', hebrewDate: "י\"ט בתשרי תשפ\"ז", status: 'Holiday', description: 'סוכות - חול המועד' },
  { date: '2026-10-01', hebrewDate: "כ' בתשרי תשפ\"ז", status: 'Holiday', description: 'סוכות - חול המועד' },
  { date: '2026-10-02', hebrewDate: "כ\"א בתשרי תשפ\"ז", status: 'Holiday', description: 'הושענא רבה' },
  { date: '2026-10-03', hebrewDate: "כ\"ב בתשרי תשפ\"ז", status: 'Holiday', description: 'שמיני עצרת / שמחת תורה' },
  { date: '2026-10-23', hebrewDate: "י\"ב בחשוון תשפ\"ז", status: 'Special Day', description: 'יום הזיכרון ליצחק רבין' },
  { date: '2026-12-05', hebrewDate: "כ\"ה בכסלו תשפ\"ז", status: 'Special Day', description: 'חנוכה - נר ראשון' },
  { date: '2026-12-06', hebrewDate: "כ\"ו בכסלו תשפ\"ז", status: 'Holiday', description: 'חנוכה - חופשת בית ספר' },
  { date: '2026-12-07', hebrewDate: "כ\"ז בכסלו תשפ\"ז", status: 'Holiday', description: 'חנוכה - חופשת בית ספר' },
  { date: '2026-12-08', hebrewDate: "כ\"ח בכסלו תשפ\"ז", status: 'Holiday', description: 'חנוכה - חופשת בית ספר' },
  { date: '2026-12-09', hebrewDate: "כ\"ט בכסלו תשפ\"ז", status: 'Holiday', description: 'חנוכה - חופשת בית ספר' },
  { date: '2026-12-10', hebrewDate: "א' בטבת תשפ\"ז", status: 'Holiday', description: 'חנוכה - חופשת בית ספר' },
  { date: '2026-12-11', hebrewDate: "ב' בטבת תשפ\"ז", status: 'Holiday', description: 'חנוכה - חופשת בית ספר' },
  { date: '2026-12-12', hebrewDate: "ג' בטבת תשפ\"ז", status: 'Special Day', description: 'חנוכה - נר שמיני' },
  { date: '2027-01-19', hebrewDate: "י' בטבת תשפ\"ז", status: 'Special Day', description: 'צום עשרה בטבת' },
  { date: '2027-02-22', hebrewDate: "ט\"ו בשבט תשפ\"ז", status: 'Special Day', description: 'ט"ו בשבט' },
  { date: '2027-03-22', hebrewDate: "י\"ג באדר ב' תשפ\"ז", status: 'Special Day', description: 'תענית אסתר' },
  { date: '2027-03-23', hebrewDate: "י\"ד באדר ב' תשפ\"ז", status: 'Holiday', description: 'פורים' },
  { date: '2027-03-24', hebrewDate: "ט\"ו באדר ב' תשפ\"ז", status: 'Holiday', description: 'שושן פורים' },
  { date: '2027-04-14', hebrewDate: "ז' בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-15', hebrewDate: "ח' בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-16', hebrewDate: "ט' בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-17', hebrewDate: "י' בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-18', hebrewDate: "י\"א בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-19', hebrewDate: "י\"ב בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-20', hebrewDate: "י\"ג בניסן תשפ\"ז", status: 'Holiday', description: 'חופשת פסח' },
  { date: '2027-04-21', hebrewDate: "י\"ד בניסן תשפ\"ז", status: 'Holiday', description: 'ערב פסח' },
  { date: '2027-04-22', hebrewDate: "ט\"ו בניסן תשפ\"ז", status: 'Holiday', description: 'פסח - חג ראשון' },
  { date: '2027-04-23', hebrewDate: "ט\"ז בניסן תשפ\"ז", status: 'Holiday', description: 'פסח - חול המועד' },
  { date: '2027-04-24', hebrewDate: "י\"ה בניסן תשפ\"ז", status: 'Holiday', description: 'פסח - חול המועד' },
  { date: '2027-04-25', hebrewDate: "י\"ח בניסן תשפ\"ז", status: 'Holiday', description: 'פסח - חול המועד' },
  { date: '2027-04-26', hebrewDate: "י\"ט בניסן תשפ\"ז", status: 'Holiday', description: 'פסח - חול המועד' },
  { date: '2027-04-27', hebrewDate: "כ' בניסן תשפ\"ז", status: 'Holiday', description: 'שביעי של פסח' },
  { date: '2027-04-28', hebrewDate: "כ\"א בניסן תשפ\"ז", status: 'Holiday', description: 'אסרו חג פסח' },
  { date: '2027-05-04', hebrewDate: "כ\"ז בניסן תשפ\"ז", status: 'Special Day', description: 'יום הזיכרון לשואה ולגבורה' },
  { date: '2027-05-11', hebrewDate: "ד' באייר תשפ\"ז", status: 'Special Day', description: 'יום הזיכרון לחללי מערכות ישראל' },
  { date: '2027-05-12', hebrewDate: "ה' באייר תשפ\"ז", status: 'Holiday', description: 'יום העצמאות' },
  { date: '2027-05-25', hebrewDate: "י\"ח באייר תשפ\"ז", status: 'Special Day', description: 'ל"ג בעומר' },
  { date: '2027-06-03', hebrewDate: "כ\"ז באייר תשפ\"ז", status: 'Special Day', description: 'יום ירושלים' },
  { date: '2027-06-10', hebrewDate: "ה' בסיוון תשפ\"ז", status: 'Holiday', description: 'ערב שבועות' },
  { date: '2027-06-11', hebrewDate: "ו' בסיוון תשפ\"ז", status: 'Holiday', description: 'חג השבועות' },
  { date: '2027-06-30', hebrewDate: "כ\"ה בסיוון תשפ\"ז", status: 'Regular', description: 'סיום שנת הלימודים תשפ"ז' }
];

const DEFAULT_EVENTS = [
  {
    id: 'evt-1',
    title: 'הערכות צוות מורים לפתיחת שנה',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    eventType: 'צוותי',
    targetGrades: [],
    createdBy: 'admin@school.org',
    description: 'סמינר היערכות פדגוגית ומנהלתית לכלל סגל ההוראה בבית הספר.'
  },
  {
    id: 'evt-2',
    title: 'חלוקת ספרי לימוד והסדרי כניסה',
    startDate: '2026-09-06',
    endDate: '2026-09-07',
    eventType: 'מנהלתי',
    targetGrades: [],
    createdBy: 'admin@school.org',
    description: 'קבלת ספרים מרוכזת במזכירות בית הספר.'
  },
  {
    id: 'evt-3',
    title: 'מבחן אבחון שכבתי במתמטיקה',
    startDate: '2026-09-17',
    endDate: '2026-09-17',
    eventType: 'פדגוגי',
    targetGrades: ['ד', 'ה', 'ו'],
    createdBy: 'nros1978@gmail.com',
    description: 'מבחן כניסה לצורך מיפוי רמת התלמידים.'
  }
];

let cachedEvents = [];
let cachedUsers = [];
let cachedCalendarBase = [];
export function normalizeDutyDay(dayData) {
  if (!dayData || !Array.isArray(dayData) || dayData.length === 0) return [];
  if (dayData[0] && typeof dayData[0] === 'object' && Array.isArray(dayData[0].duties)) {
    return dayData;
  }
  return [
    {
      name: 'הפסקה ראשונה (10:00 - 10:30)',
      duties: dayData.map(d => ({
        location: d.location || d.role || '',
        teacher: d.teacher || ''
      }))
    }
  ];
}

let cachedDutyRoster = {
  announcements: 'ברוכים הבאים לשנת הלימודים! נא להקפיד על נוכחות בזמן בתורנויות.',
  duties: {
    '0': [
      {
        name: 'הפסקה ראשונה (10:00 - 10:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'משה כהן' },
          { location: 'חצר עליונה', teacher: 'רחל לוי' },
          { location: 'חצר תחתונה', teacher: 'דוד ישראלי' }
        ]
      },
      {
        name: 'הפסקה שנייה (12:00 - 12:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'יעקב גולד' },
          { location: 'מסדרון קומה א\'', teacher: 'מיכל שטרן' }
        ]
      }
    ],
    '1': [
      {
        name: 'הפסקה ראשונה (10:00 - 10:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'יעקב גולד' },
          { location: 'חצר עליונה', teacher: 'חנה פריד' },
          { location: 'חצר תחתונה', teacher: 'יוסי כץ' }
        ]
      },
      {
        name: 'הפסקה שנייה (12:00 - 12:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'אברהם לוין' },
          { location: 'מסדרון קומה א\'', teacher: 'תמר שפירא' }
        ]
      }
    ],
    '2': [
      {
        name: 'הפסקה ראשונה (10:00 - 10:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'אברהם לוין' },
          { location: 'חצר עליונה', teacher: 'לאה אבני' },
          { location: 'חצר תחתונה', teacher: 'נועם רוזנברג' }
        ]
      },
      {
        name: 'הפסקה שנייה (12:00 - 12:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'דניאל שר' },
          { location: 'מסדרון קומה א\'', teacher: 'אסתר דהן' }
        ]
      }
    ],
    '3': [
      {
        name: 'הפסקה ראשונה (10:00 - 10:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'דניאל שר' },
          { location: 'חצר עליונה', teacher: 'רבקה מזרחי' },
          { location: 'חצר תחתונה', teacher: 'איתמר גבע' }
        ]
      },
      {
        name: 'הפסקה שנייה (12:00 - 12:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'יונתן גל' },
          { location: 'מסדרון קומה א\'', teacher: 'שלומית בר' }
        ]
      }
    ],
    '4': [
      {
        name: 'הפסקה ראשונה (10:00 - 10:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'יונתן גל' },
          { location: 'חצר עליונה', teacher: 'שרה אהרוני' },
          { location: 'חצר תחתונה', teacher: 'אליעזר שוורץ' }
        ]
      },
      {
        name: 'הפסקה שנייה (12:00 - 12:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'מאיר סגל' },
          { location: 'מסדרון קומה א\'', teacher: 'מרים כרמל' }
        ]
      }
    ],
    '5': [
      {
        name: 'הפסקה ראשונה (10:00 - 10:30)',
        duties: [
          { location: 'שער ראשי', teacher: 'מאיר סגל' },
          { location: 'חצר עליונה', teacher: 'אורית רון' },
          { location: 'חצר תחתונה', teacher: 'בנימין דגן' }
        ]
      }
    ]
  }
};

try {
  const storedRoster = localStorage.getItem('school_duty_roster');
  if (storedRoster) cachedDutyRoster = JSON.parse(storedRoster);
} catch (e) {}

export const DB = {
  /**
   * Initializes real-time snapshot listeners for Firestore collections.
   * Calls the provided onUpdate callback when any cached table updates.
   */
  init(onUpdate) {
    // 1. Listen to Events collection
    onSnapshot(collection(db, 'events'), (snapshot) => {
      cachedEvents = snapshot.docs.map(doc => doc.data());
      if (cachedEvents.length === 0 && !localStorage.getItem('school_events_seeded')) {
        localStorage.setItem('school_events_seeded', 'true');
        this.seedEvents();
      }
      if (onUpdate) onUpdate();
    });

    // 2. Listen to Users collection
    onSnapshot(collection(db, 'users'), (snapshot) => {
      cachedUsers = snapshot.docs.map(doc => doc.data());
      // Seed default Super Admin if users are completely empty
      if (cachedUsers.length === 0) {
        this.addUser('nros1978@gmail.com', true, 'Admin');
      }
      if (onUpdate) onUpdate();
    });

    // 3. Listen to Calendar Base collection
    onSnapshot(collection(db, 'calendar_base'), (snapshot) => {
      cachedCalendarBase = snapshot.docs.map(doc => doc.data());
      if (cachedCalendarBase.length === 0) {
        this.seedCalendarBase();
      }
      if (onUpdate) onUpdate();
    });

    // 4. Listen to Settings / Duty Roster document
    onSnapshot(doc(db, 'settings', 'duty_roster'), (docSnap) => {
      if (docSnap.exists()) {
        cachedDutyRoster = docSnap.data();
        try { localStorage.setItem('school_duty_roster', JSON.stringify(cachedDutyRoster)); } catch(e) {}
        if (onUpdate) onUpdate();
      } else {
        setDoc(doc(db, 'settings', 'duty_roster'), cachedDutyRoster).catch(() => {});
      }
    }, (error) => {
      console.warn("Firestore duty_roster listener warning:", error);
    });
  },

  // --- Duty Roster & Announcements API ---
  getDutyRoster() {
    return cachedDutyRoster;
  },

  async saveDutyRoster(rosterData) {
    cachedDutyRoster = rosterData;
    try { localStorage.setItem('school_duty_roster', JSON.stringify(rosterData)); } catch(e) {}
    await setDoc(doc(db, 'settings', 'duty_roster'), rosterData, { merge: true });
  },

  // --- Users Collection API ---
  getUsers() {
    return cachedUsers;
  },

  async getUser(email) {
    const cleanEmail = email.trim().toLowerCase();
    const docRef = doc(db, 'users', cleanEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  },

  async addUser(email, isAuthorized = false, role = 'Teacher') {
    const cleanEmail = email.trim().toLowerCase();
    await setDoc(doc(db, 'users', cleanEmail), {
      email: cleanEmail,
      isAuthorized,
      role
    });
  },

  async updateUser(email, updates) {
    const cleanEmail = email.trim().toLowerCase();
    await setDoc(doc(db, 'users', cleanEmail), updates, { merge: true });
  },

  async removeUser(email) {
    const cleanEmail = email.trim().toLowerCase();
    await deleteDoc(doc(db, 'users', cleanEmail));
  },

  // --- Calendar Base Collection API ---
  getCalendarBase() {
    return cachedCalendarBase;
  },

  async saveCalendarBase(data) {
    for (const entry of data) {
      await setDoc(doc(db, 'calendar_base', entry.date), entry);
    }
  },

  async clearCalendarBase() {
    for (const entry of cachedCalendarBase) {
      await deleteDoc(doc(db, 'calendar_base', entry.date));
    }
  },

  // --- Events Collection API ---
  getEvents() {
    return cachedEvents;
  },

  async addEvent(eventData) {
    const id = 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    await setDoc(doc(db, 'events', id), {
      id,
      ...eventData
    });
  },

  async updateEvent(id, updatedData) {
    await setDoc(doc(db, 'events', id), updatedData, { merge: true });
  },

  async deleteEvent(id) {
    await deleteDoc(doc(db, 'events', id));
  },

  async clearEvents() {
    for (const event of cachedEvents) {
      await deleteDoc(doc(db, 'events', event.id));
    }
  },

  // --- Seeding Helpers ---
  async seedCalendarBase() {
    await this.saveCalendarBase(DEFAULT_CALENDAR_BASE);
  },

  async seedEvents() {
    for (const event of DEFAULT_EVENTS) {
      await setDoc(doc(db, 'events', event.id), event);
    }
  },

  getHebrewDateInfo(dateStr) {
    const baseEntry = cachedCalendarBase.find(entry => entry.date === dateStr);
    let hebrewDate = '';
    let status = baseEntry ? baseEntry.status : 'Regular';
    let description = baseEntry ? (baseEntry.description || '') : '';

    if (baseEntry && baseEntry.hebrewDate) {
      hebrewDate = convertHebrewDateStringToLetters(baseEntry.hebrewDate);
    } else {
      try {
        const dateParts = dateStr.split('-');
        const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
        
        const hebrewFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
          day: 'numeric',
          month: 'long'
        });
        
        const hebrewYearFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
          year: 'numeric'
        });

        let formattedDate = hebrewFormatter.format(dateObj);
        let formattedYear = hebrewYearFormatter.format(dateObj);
        
        let cleanHebrewDate = `${formattedDate} ${formattedYear}`;
        hebrewDate = convertHebrewDateStringToLetters(cleanHebrewDate);
      } catch (e) {
        hebrewDate = '';
      }
    }

    // Auto-detect Rosh Chodesh as a Special Day if not already a Holiday
    if (hebrewDate && status !== 'Holiday' && !description) {
      const parts = hebrewDate.split(' ');
      const dayStr = parts[0] || '';
      const monthStr = (parts[1] || '').replace(/^[בל]/, '');

      if (dayStr === "א'" && monthStr && monthStr !== 'תשרי') {
        // Day 1 of Hebrew month (except Tishrei which is Rosh Hashana)
        status = 'Special Day';
        description = `ראש חודש ${monthStr}`;
      } else if (dayStr === "ל'") {
        // Day 30 of Hebrew month is Day 1 of Rosh Chodesh for next month
        try {
          const dateParts = dateStr.split('-');
          const nextDayObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, parseInt(dateParts[2], 10) + 1));
          const nextHebFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' });
          const nextMonth = nextHebFormatter.format(nextDayObj).trim().replace(/^[בל]/, '');
          status = 'Special Day';
          description = `ראש חודש ${nextMonth}`;
        } catch (e) {
          status = 'Special Day';
          description = 'ראש חודש';
        }
      }
    }

    return {
      hebrewDate,
      status,
      description
    };
  }
};

// Gematria converter helpers
function convertNumToGematriaDay(num) {
  const gematriaLetters = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
    10: 'י', 20: 'כ', 30: 'ל'
  };
  
  if (num <= 10) return gematriaLetters[num] + "'";
  if (num === 15) return 'ט"ו';
  if (num === 16) return 'ט"ז';
  
  const tens = Math.floor(num / 10) * 10;
  const ones = num % 10;
  
  if (ones === 0) return gematriaLetters[tens] + "'";
  return gematriaLetters[tens] + '"' + gematriaLetters[ones];
}

function convertYearToGematria(year) {
  let num = year > 5000 ? year - 5000 : year;
  const hundredsLetters = { 100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת' };
  const tensLetters = { 10: 'י', 20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ' };
  const onesLetters = { 1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט' };
  
  let result = '';
  while (num >= 400) {
    result += 'ת';
    num -= 400;
  }
  if (num >= 100) {
    const hundreds = Math.floor(num / 100) * 100;
    result += hundredsLetters[hundreds];
    num %= 100;
  }
  if (num === 15) return result + 'ט"ו';
  if (num === 16) return result + 'ט"ז';
  
  if (num >= 10) {
    const tens = Math.floor(num / 10) * 10;
    result += tensLetters[tens];
    num %= 10;
  }
  if (num >= 1) {
    result += onesLetters[num];
  }
  
  if (result.length === 1) return result + "'";
  return result.slice(0, -1) + '"' + result.slice(-1);
}

export function convertHebrewDateStringToLetters(hebDateStr) {
  let cleanStr = hebDateStr.trim();
  const dayMatch = cleanStr.match(/^(\d+)\s+(.+)$/);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    const gematriaDay = convertNumToGematriaDay(dayNum);
    cleanStr = `${gematriaDay} ${dayMatch[2]}`;
  }
  const yearMatch = cleanStr.match(/\b(5\d{3})\b/);
  if (yearMatch) {
    const yearNum = parseInt(yearMatch[1], 10);
    const gematriaYear = convertYearToGematria(yearNum);
    cleanStr = cleanStr.replace(yearMatch[1], gematriaYear);
  }
  return cleanStr;
}
