// Calendar Module for School Calendar & Gantt Application
// Renders the RTL Monthly Grid, day cells, and events with spanning segment styles.

import { DB } from './database.js';

// TV identification must never classify a phone as a kiosk.
function isTvDevice() {
  const ua = navigator.userAgent || '';
  return /SmartTV|Tizen|Web0S|webOS|HbbTV|BRAVIA|NetCast|POV_TV|Viera|Roku|AFT|MiBox|Shield|Chromecast|GoogleTV|AppleTV|DTV|OTT|LargeScreen|Android.*TV/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua) && navigator.maxTouchPoints === 0);
}
function isPhoneLayout() {
  if (isTvDevice()) return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  const isNarrow = window.innerWidth <= 768;
  const isLandscapeMobile = (window.innerWidth <= 950 && window.innerHeight <= 500 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  return isMobileUA || isNarrow || isLandscapeMobile;
}


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

export const SHABBAT_PARASHOT = {"2023-01-07":"פרשת ויחי","2023-01-14":"פרשת שמות","2023-01-21":"פרשת וארא","2023-01-28":"פרשת בא","2023-02-04":"פרשת בשלח","2023-02-11":"פרשת יתרו","2023-02-18":"פרשת משפטים","2023-02-25":"פרשת תרומה","2023-03-04":"פרשת תצוה","2023-03-11":"פרשת כי תשא","2023-03-18":"פרשת ויקהל־פקודי","2023-03-25":"פרשת ויקרא","2023-04-01":"פרשת צו","2023-04-15":"פרשת שמיני","2023-04-22":"פרשת תזריע־מצרע","2023-04-29":"פרשת אחרי מות־קדשים","2023-05-06":"פרשת אמור","2023-05-13":"פרשת בהר־בחקתי","2023-05-20":"פרשת במדבר","2023-05-27":"פרשת נשא","2023-06-03":"פרשת בהעלתך","2023-06-10":"פרשת שלח־לך","2023-06-17":"פרשת קורח","2023-06-24":"פרשת חוקת","2023-07-01":"פרשת בלק","2023-07-08":"פרשת פינחס","2023-07-15":"פרשת מטות־מסעי","2023-07-22":"פרשת דברים","2023-07-29":"פרשת ואתחנן","2023-08-05":"פרשת עקב","2023-08-12":"פרשת ראה","2023-08-19":"פרשת שופטים","2023-08-26":"פרשת כי־תצא","2023-09-02":"פרשת כי־תבוא","2023-09-09":"פרשת נצבים־וילך","2023-09-23":"פרשת האזינו","2023-10-14":"פרשת בראשית","2023-10-21":"פרשת נח","2023-10-28":"פרשת לך־לך","2023-11-04":"פרשת וירא","2023-11-11":"פרשת חיי שרה","2023-11-18":"פרשת תולדות","2023-11-25":"פרשת ויצא","2023-12-02":"פרשת וישלח","2023-12-09":"פרשת וישב","2023-12-16":"פרשת מקץ","2023-12-23":"פרשת ויגש","2023-12-30":"פרשת ויחי","2024-01-06":"פרשת שמות","2024-01-13":"פרשת וארא","2024-01-20":"פרשת בא","2024-01-27":"פרשת בשלח","2024-02-03":"פרשת יתרו","2024-02-10":"פרשת משפטים","2024-02-17":"פרשת תרומה","2024-02-24":"פרשת תצוה","2024-03-02":"פרשת כי תשא","2024-03-09":"פרשת ויקהל","2024-03-16":"פרשת פקודי","2024-03-23":"פרשת ויקרא","2024-03-30":"פרשת צו","2024-04-06":"פרשת שמיני","2024-04-13":"פרשת תזריע","2024-04-20":"פרשת מצרע","2024-05-04":"פרשת אחרי מות","2024-05-11":"פרשת קדשים","2024-05-18":"פרשת אמור","2024-05-25":"פרשת בהר","2024-06-01":"פרשת בחקתי","2024-06-08":"פרשת במדבר","2024-06-15":"פרשת נשא","2024-06-22":"פרשת בהעלתך","2024-06-29":"פרשת שלח־לך","2024-07-06":"פרשת קורח","2024-07-13":"פרשת חוקת","2024-07-20":"פרשת בלק","2024-07-27":"פרשת פינחס","2024-08-03":"פרשת מטות־מסעי","2024-08-10":"פרשת דברים","2024-08-17":"פרשת ואתחנן","2024-08-24":"פרשת עקב","2024-08-31":"פרשת ראה","2024-09-07":"פרשת שופטים","2024-09-14":"פרשת כי־תצא","2024-09-21":"פרשת כי־תבוא","2024-09-28":"פרשת נצבים־וילך","2024-10-05":"פרשת האזינו","2024-10-26":"פרשת בראשית","2024-11-02":"פרשת נח","2024-11-09":"פרשת לך־לך","2024-11-16":"פרשת וירא","2024-11-23":"פרשת חיי שרה","2024-11-30":"פרשת תולדות","2024-12-07":"פרשת ויצא","2024-12-14":"פרשת וישלח","2024-12-21":"פרשת וישב","2024-12-28":"פרשת מקץ","2025-01-04":"פרשת ויגש","2025-01-11":"פרשת ויחי","2025-01-18":"פרשת שמות","2025-01-25":"פרשת וארא","2025-02-01":"פרשת בא","2025-02-08":"פרשת בשלח","2025-02-15":"פרשת יתרו","2025-02-22":"פרשת משפטים","2025-03-01":"פרשת תרומה","2025-03-08":"פרשת תצוה","2025-03-15":"פרשת כי תשא","2025-03-22":"פרשת ויקהל","2025-03-29":"פרשת פקודי","2025-04-05":"פרשת ויקרא","2025-04-12":"פרשת צו","2025-04-26":"פרשת שמיני","2025-05-03":"פרשת תזריע־מצרע","2025-05-10":"פרשת אחרי מות־קדשים","2025-05-17":"פרשת אמור","2025-05-24":"פרשת בהר־בחקתי","2025-05-31":"פרשת במדבר","2025-06-07":"פרשת נשא","2025-06-14":"פרשת בהעלתך","2025-06-21":"פרשת שלח־לך","2025-06-28":"פרשת קורח","2025-07-05":"פרשת חוקת","2025-07-12":"פרשת בלק","2025-07-19":"פרשת פינחס","2025-07-26":"פרשת מטות־מסעי","2025-08-02":"פרשת דברים","2025-08-09":"פרשת ואתחנן","2025-08-16":"פרשת עקב","2025-08-23":"פרשת ראה","2025-08-30":"פרשת שופטים","2025-09-06":"פרשת כי־תצא","2025-09-13":"פרשת כי־תבוא","2025-09-20":"פרשת נצבים","2025-09-27":"פרשת וילך","2025-10-04":"פרשת האזינו","2025-10-18":"פרשת בראשית","2025-10-25":"פרשת נח","2025-11-01":"פרשת לך־לך","2025-11-08":"פרשת וירא","2025-11-15":"פרשת חיי שרה","2025-11-22":"פרשת תולדות","2025-11-29":"פרשת ויצא","2025-12-06":"פרשת וישלח","2025-12-13":"פרשת וישב","2025-12-20":"פרשת מקץ","2025-12-27":"פרשת ויגש","2026-01-03":"פרשת ויחי","2026-01-10":"פרשת שמות","2026-01-17":"פרשת וארא","2026-01-24":"פרשת בא","2026-01-31":"פרשת בשלח","2026-02-07":"פרשת יתרו","2026-02-14":"פרשת משפטים","2026-02-21":"פרשת תרומה","2026-02-28":"פרשת תצוה","2026-03-07":"פרשת כי תשא","2026-03-14":"פרשת ויקהל־פקודי","2026-03-21":"פרשת ויקרא","2026-03-28":"פרשת צו","2026-04-11":"פרשת שמיני","2026-04-18":"פרשת תזריע־מצרע","2026-04-25":"פרשת אחרי מות־קדשים","2026-05-02":"פרשת אמור","2026-05-09":"פרשת בהר־בחקתי","2026-05-16":"פרשת במדבר","2026-05-23":"פרשת נשא","2026-05-30":"פרשת בהעלתך","2026-06-06":"פרשת שלח־לך","2026-06-13":"פרשת קורח","2026-06-20":"פרשת חוקת","2026-06-27":"פרשת בלק","2026-07-04":"פרשת פינחס","2026-07-11":"פרשת מטות־מסעי","2026-07-18":"פרשת דברים","2026-07-25":"פרשת ואתחנן","2026-08-01":"פרשת עקב","2026-08-08":"פרשת ראה","2026-08-15":"פרשת שופטים","2026-08-22":"פרשת כי־תצא","2026-08-29":"פרשת כי־תבוא","2026-09-05":"פרשת נצבים־וילך","2026-09-19":"פרשת האזינו","2026-10-10":"פרשת בראשית","2026-10-17":"פרשת נח","2026-10-24":"פרשת לך־לך","2026-10-31":"פרשת וירא","2026-11-07":"פרשת חיי שרה","2026-11-14":"פרשת תולדות","2026-11-21":"פרשת ויצא","2026-11-28":"פרשת וישלח","2026-12-05":"פרשת וישב","2026-12-12":"פרשת מקץ","2026-12-19":"פרשת ויגש","2026-12-26":"פרשת ויחי","2027-01-02":"פרשת שמות","2027-01-09":"פרשת וארא","2027-01-16":"פרשת בא","2027-01-23":"פרשת בשלח","2027-01-30":"פרשת יתרו","2027-02-06":"פרשת משפטים","2027-02-13":"פרשת תרומה","2027-02-20":"פרשת תצוה","2027-02-27":"פרשת כי תשא","2027-03-06":"פרשת ויקהל","2027-03-13":"פרשת פקודי","2027-03-20":"פרשת ויקרא","2027-03-27":"פרשת צו","2027-04-03":"פרשת שמיני","2027-04-10":"פרשת תזריע","2027-04-17":"פרשת מצרע","2027-05-01":"פרשת אחרי מות","2027-05-08":"פרשת קדשים","2027-05-15":"פרשת אמור","2027-05-22":"פרשת בהר","2027-05-29":"פרשת בחקתי","2027-06-05":"פרשת במדבר","2027-06-12":"פרשת נשא","2027-06-19":"פרשת בהעלתך","2027-06-26":"פרשת שלח־לך","2027-07-03":"פרשת קורח","2027-07-10":"פרשת חוקת","2027-07-17":"פרשת בלק","2027-07-24":"פרשת פינחס","2027-07-31":"פרשת מטות־מסעי","2027-08-07":"פרשת דברים","2027-08-14":"פרשת ואתחנן","2027-08-21":"פרשת עקב","2027-08-28":"פרשת ראה","2027-09-04":"פרשת שופטים","2027-09-11":"פרשת כי־תצא","2027-09-18":"פרשת כי־תבוא","2027-09-25":"פרשת נצבים־וילך","2027-10-09":"פרשת האזינו","2027-10-30":"פרשת בראשית","2027-11-06":"פרשת נח","2027-11-13":"פרשת לך־לך","2027-11-20":"פרשת וירא","2027-11-27":"פרשת חיי שרה","2027-12-04":"פרשת תולדות","2027-12-11":"פרשת ויצא","2027-12-18":"פרשת וישלח","2027-12-25":"פרשת וישב","2028-01-01":"פרשת מקץ","2028-01-08":"פרשת ויגש","2028-01-15":"פרשת ויחי","2028-01-22":"פרשת שמות","2028-01-29":"פרשת וארא","2028-02-05":"פרשת בא","2028-02-12":"פרשת בשלח","2028-02-19":"פרשת יתרו","2028-02-26":"פרשת משפטים","2028-03-04":"פרשת תרומה","2028-03-11":"פרשת תצוה","2028-03-18":"פרשת כי תשא","2028-03-25":"פרשת ויקהל־פקודי","2028-04-01":"פרשת ויקרא","2028-04-08":"פרשת צו","2028-04-22":"פרשת שמיני","2028-04-29":"פרשת תזריע־מצרע","2028-05-06":"פרשת אחרי מות־קדשים","2028-05-13":"פרשת אמור","2028-05-20":"פרשת בהר־בחקתי","2028-05-27":"פרשת במדבר","2028-06-03":"פרשת נשא","2028-06-10":"פרשת בהעלתך","2028-06-17":"פרשת שלח־לך","2028-06-24":"פרשת קורח","2028-07-01":"פרשת חוקת","2028-07-08":"פרשת בלק","2028-07-15":"פרשת פינחס","2028-07-22":"פרשת מטות־מסעי","2028-07-29":"פרשת דברים","2028-08-05":"פרשת ואתחנן","2028-08-12":"פרשת עקב","2028-08-19":"פרשת ראה","2028-08-26":"פרשת שופטים","2028-09-02":"פרשת כי־תצא","2028-09-09":"פרשת כי־תבוא","2028-09-16":"פרשת נצבים־וילך","2028-09-23":"פרשת האזינו","2028-10-14":"פרשת בראשית","2028-10-21":"פרשת נח","2028-10-28":"פרשת לך־לך","2028-11-04":"פרשת וירא","2028-11-11":"פרשת חיי שרה","2028-11-18":"פרשת תולדות","2028-11-25":"פרשת ויצא","2028-12-02":"פרשת וישלח","2028-12-09":"פרשת וישב","2028-12-16":"פרשת מקץ","2028-12-23":"פרשת ויגש","2028-12-30":"פרשת ויחי","2029-01-06":"פרשת שמות","2029-01-13":"פרשת וארא","2029-01-20":"פרשת בא","2029-01-27":"פרשת בשלח","2029-02-03":"פרשת יתרו","2029-02-10":"פרשת משפטים","2029-02-17":"פרשת תרומה","2029-02-24":"פרשת תצוה","2029-03-03":"פרשת כי תשא","2029-03-10":"פרשת ויקהל־פקודי","2029-03-17":"פרשת ויקרא","2029-03-24":"פרשת צו","2029-04-07":"פרשת שמיני","2029-04-14":"פרשת תזריע־מצרע","2029-04-21":"פרשת אחרי מות־קדשים","2029-04-28":"פרשת אמור","2029-05-05":"פרשת בהר","2029-05-12":"פרשת בחקתי","2029-05-19":"פרשת במדבר","2029-05-26":"פרשת נשא","2029-06-02":"פרשת בהעלתך","2029-06-09":"פרשת שלח־לך","2029-06-16":"פרשת קורח","2029-06-23":"פרשת חוקת","2029-06-30":"פרשת בלק","2029-07-07":"פרשת פינחס","2029-07-14":"פרשת מטות־מסעי","2029-07-21":"פרשת דברים","2029-07-28":"פרשת ואתחנן","2029-08-04":"פרשת עקב","2029-08-11":"פרשת ראה","2029-08-18":"פרשת שופטים","2029-08-25":"פרשת כי־תצא","2029-09-01":"פרשת כי־תבוא","2029-09-08":"פרשת נצבים","2029-09-15":"פרשת וילך","2029-09-22":"פרשת האזינו","2029-10-06":"פרשת בראשית","2029-10-13":"פרשת נח","2029-10-20":"פרשת לך־לך","2029-10-27":"פרשת וירא","2029-11-03":"פרשת חיי שרה","2029-11-10":"פרשת תולדות","2029-11-17":"פרשת ויצא","2029-11-24":"פרשת וישלח","2029-12-01":"פרשת וישב","2029-12-08":"פרשת מקץ","2029-12-15":"פרשת ויגש","2029-12-22":"פרשת ויחי","2029-12-29":"פרשת שמות","2030-01-05":"פרשת וארא","2030-01-12":"פרשת בא","2030-01-19":"פרשת בשלח","2030-01-26":"פרשת יתרו","2030-02-02":"פרשת משפטים","2030-02-09":"פרשת תרומה","2030-02-16":"פרשת תצוה","2030-02-23":"פרשת כי תשא","2030-03-02":"פרשת ויקהל","2030-03-09":"פרשת פקודי","2030-03-16":"פרשת ויקרא","2030-03-23":"פרשת צו","2030-03-30":"פרשת שמיני","2030-04-06":"פרשת תזריע","2030-04-13":"פרשת מצרע","2030-04-27":"פרשת אחרי מות","2030-05-04":"פרשת קדשים","2030-05-11":"פרשת אמור","2030-05-18":"פרשת בהר","2030-05-25":"פרשת בחקתי","2030-06-01":"פרשת במדבר","2030-06-08":"פרשת נשא","2030-06-15":"פרשת בהעלתך","2030-06-22":"פרשת שלח־לך","2030-06-29":"פרשת קורח","2030-07-06":"פרשת חוקת","2030-07-13":"פרשת בלק","2030-07-20":"פרשת פינחס","2030-07-27":"פרשת מטות־מסעי","2030-08-03":"פרשת דברים","2030-08-10":"פרשת ואתחנן","2030-08-17":"פרשת עקב","2030-08-24":"פרשת ראה","2030-08-31":"פרשת שופטים","2030-09-07":"פרשת כי־תצא","2030-09-14":"פרשת כי־תבוא","2030-09-21":"פרשת נצבים־וילך","2030-10-05":"פרשת האזינו","2030-10-26":"פרשת בראשית","2030-11-02":"פרשת נח","2030-11-09":"פרשת לך־לך","2030-11-16":"פרשת וירא","2030-11-23":"פרשת חיי שרה","2030-11-30":"פרשת תולדות","2030-12-07":"פרשת ויצא","2030-12-14":"פרשת וישלח","2030-12-21":"פרשת וישב","2030-12-28":"פרשת מקץ","2031-01-04":"פרשת ויגש","2031-01-11":"פרשת ויחי","2031-01-18":"פרשת שמות","2031-01-25":"פרשת וארא","2031-02-01":"פרשת בא","2031-02-08":"פרשת בשלח","2031-02-15":"פרשת יתרו","2031-02-22":"פרשת משפטים","2031-03-01":"פרשת תרומה","2031-03-08":"פרשת תצוה","2031-03-15":"פרשת כי תשא","2031-03-22":"פרשת ויקהל־פקודי","2031-03-29":"פרשת ויקרא","2031-04-05":"פרשת צו","2031-04-19":"פרשת שמיני","2031-04-26":"פרשת תזריע־מצרע","2031-05-03":"פרשת אחרי מות־קדשים","2031-05-10":"פרשת אמור","2031-05-17":"פרשת בהר־בחקתי","2031-05-24":"פרשת במדבר","2031-05-31":"פרשת נשא","2031-06-07":"פרשת בהעלתך","2031-06-14":"פרשת שלח־לך","2031-06-21":"פרשת קורח","2031-06-28":"פרשת חוקת","2031-07-05":"פרשת בלק","2031-07-12":"פרשת פינחס","2031-07-19":"פרשת מטות־מסעי","2031-07-26":"פרשת דברים","2031-08-02":"פרשת ואתחנן","2031-08-09":"פרשת עקב","2031-08-16":"פרשת ראה","2031-08-23":"פרשת שופטים","2031-08-30":"פרשת כי־תצא","2031-09-06":"פרשת כי־תבוא","2031-09-13":"פרשת נצבים־וילך","2031-09-20":"פרשת האזינו","2031-10-11":"פרשת בראשית","2031-10-18":"פרשת נח","2031-10-25":"פרשת לך־לך","2031-11-01":"פרשת וירא","2031-11-08":"פרשת חיי שרה","2031-11-15":"פרשת תולדות","2031-11-22":"פרשת ויצא","2031-11-29":"פרשת וישלח","2031-12-06":"פרשת וישב","2031-12-13":"פרשת מקץ","2031-12-20":"פרשת ויגש","2031-12-27":"פרשת ויחי","2032-01-03":"פרשת שמות","2032-01-10":"פרשת וארא","2032-01-17":"פרשת בא","2032-01-24":"פרשת בשלח","2032-01-31":"פרשת יתרו","2032-02-07":"פרשת משפטים","2032-02-14":"פרשת תרומה","2032-02-21":"פרשת תצוה","2032-02-28":"פרשת כי תשא","2032-03-06":"פרשת ויקהל־פקודי","2032-03-13":"פרשת ויקרא","2032-03-20":"פרשת צו","2032-04-03":"פרשת שמיני","2032-04-10":"פרשת תזריע־מצרע","2032-04-17":"פרשת אחרי מות־קדשים","2032-04-24":"פרשת אמור","2032-05-01":"פרשת בהר","2032-05-08":"פרשת בחקתי","2032-05-15":"פרשת במדבר","2032-05-22":"פרשת נשא","2032-05-29":"פרשת בהעלתך","2032-06-05":"פרשת שלח־לך","2032-06-12":"פרשת קורח","2032-06-19":"פרשת חוקת","2032-06-26":"פרשת בלק","2032-07-03":"פרשת פינחס","2032-07-10":"פרשת מטות־מסעי","2032-07-17":"פרשת דברים","2032-07-24":"פרשת ואתחנן","2032-07-31":"פרשת עקב","2032-08-07":"פרשת ראה","2032-08-14":"פרשת שופטים","2032-08-21":"פרשת כי־תצא","2032-08-28":"פרשת כי־תבוא","2032-09-04":"פרשת נצבים","2032-09-11":"פרשת וילך","2032-09-18":"פרשת האזינו","2032-10-02":"פרשת בראשית","2032-10-09":"פרשת נח","2032-10-16":"פרשת לך־לך","2032-10-23":"פרשת וירא","2032-10-30":"פרשת חיי שרה","2032-11-06":"פרשת תולדות","2032-11-13":"פרשת ויצא","2032-11-20":"פרשת וישלח","2032-11-27":"פרשת וישב","2032-12-04":"פרשת מקץ","2032-12-11":"פרשת ויגש","2032-12-18":"פרשת ויחי","2032-12-25":"פרשת שמות","2033-01-01":"פרשת וארא","2033-01-08":"פרשת בא","2033-01-15":"פרשת בשלח","2033-01-22":"פרשת יתרו","2033-01-29":"פרשת משפטים","2033-02-05":"פרשת תרומה","2033-02-12":"פרשת תצוה","2033-02-19":"פרשת כי תשא","2033-02-26":"פרשת ויקהל","2033-03-05":"פרשת פקודי","2033-03-12":"פרשת ויקרא","2033-03-19":"פרשת צו","2033-03-26":"פרשת שמיני","2033-04-02":"פרשת תזריע","2033-04-09":"פרשת מצרע","2033-04-23":"פרשת אחרי מות","2033-04-30":"פרשת קדשים","2033-05-07":"פרשת אמור","2033-05-14":"פרשת בהר","2033-05-21":"פרשת בחקתי","2033-05-28":"פרשת במדבר","2033-06-04":"פרשת נשא","2033-06-11":"פרשת בהעלתך","2033-06-18":"פרשת שלח־לך","2033-06-25":"פרשת קורח","2033-07-02":"פרשת חוקת","2033-07-09":"פרשת בלק","2033-07-16":"פרשת פינחס","2033-07-23":"פרשת מטות־מסעי","2033-07-30":"פרשת דברים","2033-08-06":"פרשת ואתחנן","2033-08-13":"פרשת עקב","2033-08-20":"פרשת ראה","2033-08-27":"פרשת שופטים","2033-09-03":"פרשת כי־תצא","2033-09-10":"פרשת כי־תבוא","2033-09-17":"פרשת נצבים־וילך","2033-10-01":"פרשת האזינו","2033-10-22":"פרשת בראשית","2033-10-29":"פרשת נח","2033-11-05":"פרשת לך־לך","2033-11-12":"פרשת וירא","2033-11-19":"פרשת חיי שרה","2033-11-26":"פרשת תולדות","2033-12-03":"פרשת ויצא","2033-12-10":"פרשת וישלח","2033-12-17":"פרשת וישב","2033-12-24":"פרשת מקץ","2033-12-31":"פרשת ויגש","2034-01-07":"פרשת ויחי","2034-01-14":"פרשת שמות","2034-01-21":"פרשת וארא","2034-01-28":"פרשת בא","2034-02-04":"פרשת בשלח","2034-02-11":"פרשת יתרו","2034-02-18":"פרשת משפטים","2034-02-25":"פרשת תרומה","2034-03-04":"פרשת תצוה","2034-03-11":"פרשת כי תשא","2034-03-18":"פרשת ויקהל־פקודי","2034-03-25":"פרשת ויקרא","2034-04-01":"פרשת צו","2034-04-15":"פרשת שמיני","2034-04-22":"פרשת תזריע־מצרע","2034-04-29":"פרשת אחרי מות־קדשים","2034-05-06":"פרשת אמור","2034-05-13":"פרשת בהר־בחקתי","2034-05-20":"פרשת במדבר","2034-05-27":"פרשת נשא","2034-06-03":"פרשת בהעלתך","2034-06-10":"פרשת שלח־לך","2034-06-17":"פרשת קורח","2034-06-24":"פרשת חוקת","2034-07-01":"פרשת בלק","2034-07-08":"פרשת פינחס","2034-07-15":"פרשת מטות־מסעי","2034-07-22":"פרשת דברים","2034-07-29":"פרשת ואתחנן","2034-08-05":"פרשת עקב","2034-08-12":"פרשת ראה","2034-08-19":"פרשת שופטים","2034-08-26":"פרשת כי־תצא","2034-09-02":"פרשת כי־תבוא","2034-09-09":"פרשת נצבים־וילך","2034-09-16":"פרשת האזינו","2034-10-07":"פרשת בראשית","2034-10-14":"פרשת נח","2034-10-21":"פרשת לך־לך","2034-10-28":"פרשת וירא","2034-11-04":"פרשת חיי שרה","2034-11-11":"פרשת תולדות","2034-11-18":"פרשת ויצא","2034-11-25":"פרשת וישלח","2034-12-02":"פרשת וישב","2034-12-09":"פרשת מקץ","2034-12-16":"פרשת ויגש","2034-12-23":"פרשת ויחי","2034-12-30":"פרשת שמות","2035-01-06":"פרשת וארא","2035-01-13":"פרשת בא","2035-01-20":"פרשת בשלח","2035-01-27":"פרשת יתרו","2035-02-03":"פרשת משפטים","2035-02-10":"פרשת תרומה","2035-02-17":"פרשת תצוה","2035-02-24":"פרשת כי תשא","2035-03-03":"פרשת ויקהל","2035-03-10":"פרשת פקודי","2035-03-17":"פרשת ויקרא","2035-03-24":"פרשת צו","2035-03-31":"פרשת שמיני","2035-04-07":"פרשת תזריע","2035-04-14":"פרשת מצרע","2035-04-21":"פרשת אחרי מות","2035-05-05":"פרשת קדשים","2035-05-12":"פרשת אמור","2035-05-19":"פרשת בהר","2035-05-26":"פרשת בחקתי","2035-06-02":"פרשת במדבר","2035-06-09":"פרשת נשא","2035-06-16":"פרשת בהעלתך","2035-06-23":"פרשת שלח־לך","2035-06-30":"פרשת קורח","2035-07-07":"פרשת חוקת","2035-07-14":"פרשת בלק","2035-07-21":"פרשת פינחס","2035-07-28":"פרשת מטות","2035-08-04":"פרשת מסעי","2035-08-11":"פרשת דברים","2035-08-18":"פרשת ואתחנן","2035-08-25":"פרשת עקב","2035-09-01":"פרשת ראה","2035-09-08":"פרשת שופטים","2035-09-15":"פרשת כי־תצא","2035-09-22":"פרשת כי־תבוא","2035-09-29":"פרשת נצבים־וילך","2035-10-06":"פרשת האזינו","2035-10-27":"פרשת בראשית","2035-11-03":"פרשת נח","2035-11-10":"פרשת לך־לך","2035-11-17":"פרשת וירא","2035-11-24":"פרשת חיי שרה","2035-12-01":"פרשת תולדות","2035-12-08":"פרשת ויצא","2035-12-15":"פרשת וישלח","2035-12-22":"פרשת וישב","2035-12-29":"פרשת מקץ","2036-01-05":"פרשת ויגש","2036-01-12":"פרשת ויחי","2036-01-19":"פרשת שמות","2036-01-26":"פרשת וארא","2036-02-02":"פרשת בא","2036-02-09":"פרשת בשלח","2036-02-16":"פרשת יתרו","2036-02-23":"פרשת משפטים","2036-03-01":"פרשת תרומה","2036-03-08":"פרשת תצוה","2036-03-15":"פרשת כי תשא","2036-03-22":"פרשת ויקהל־פקודי","2036-03-29":"פרשת ויקרא","2036-04-05":"פרשת צו","2036-04-19":"פרשת שמיני","2036-04-26":"פרשת תזריע־מצרע","2036-05-03":"פרשת אחרי מות־קדשים","2036-05-10":"פרשת אמור","2036-05-17":"פרשת בהר","2036-05-24":"פרשת בחקתי","2036-05-31":"פרשת במדבר","2036-06-07":"פרשת נשא","2036-06-14":"פרשת בהעלתך","2036-06-21":"פרשת שלח־לך","2036-06-28":"פרשת קורח","2036-07-05":"פרשת חוקת","2036-07-12":"פרשת בלק","2036-07-19":"פרשת פינחס","2036-07-26":"פרשת מטות־מסעי","2036-08-02":"פרשת דברים","2036-08-09":"פרשת ואתחנן","2036-08-16":"פרשת עקב","2036-08-23":"פרשת ראה","2036-08-30":"פרשת שופטים","2036-09-06":"פרשת כי־תצא","2036-09-13":"פרשת כי־תבוא","2036-09-20":"פרשת נצבים","2036-09-27":"פרשת וילך","2036-10-04":"פרשת האזינו","2036-10-18":"פרשת בראשית","2036-10-25":"פרשת נח","2036-11-01":"פרשת לך־לך","2036-11-08":"פרשת וירא","2036-11-15":"פרשת חיי שרה","2036-11-22":"פרשת תולדות","2036-11-29":"פרשת ויצא","2036-12-06":"פרשת וישלח","2036-12-13":"פרשת וישב","2036-12-20":"פרשת מקץ","2036-12-27":"פרשת ויגש"};

export const HebrewCalendar = {
  _cache: new Map(),

  getMonthsForYear(hebrewYear) {
    if (this._cache.has(hebrewYear)) {
      return this._cache.get(hebrewYear);
    }
    const approxGregYear = hebrewYear - 3761;
    let d = new Date(approxGregYear, 7, 15);
    const endRange = new Date(approxGregYear + 1, 9, 30);

    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const hebFormatter = new Intl.DateTimeFormat('he-u-ca-hebrew', {
      month: 'long'
    });

    const months = [];
    let currentMonthName = '';
    let currentMonthHebName = '';
    let currentMonthStart = null;
    let prevDate = null;

    while (d <= endRange) {
      const parts = formatter.formatToParts(d);
      let hYear = 0, hMonth = '', hDay = 0;
      for (const p of parts) {
        if (p.type === 'year') hYear = parseInt(p.value, 10);
        if (p.type === 'month') hMonth = p.value;
        if (p.type === 'day') hDay = parseInt(p.value, 10);
      }

      if (hYear === hebrewYear) {
        if (hMonth !== currentMonthName) {
          if (currentMonthStart && prevDate) {
            const daysCount = Math.round((prevDate - currentMonthStart) / (1000 * 60 * 60 * 24)) + 1;
            months.push({
              name: currentMonthHebName,
              index: months.length,
              firstDate: new Date(currentMonthStart),
              lastDate: new Date(prevDate),
              daysCount: daysCount
            });
          }
          currentMonthName = hMonth;
          currentMonthHebName = hebFormatter.format(d).trim();
          currentMonthStart = new Date(d);
        }
        prevDate = new Date(d);
      } else if (hYear > hebrewYear && currentMonthStart && prevDate) {
        const daysCount = Math.round((prevDate - currentMonthStart) / (1000 * 60 * 60 * 24)) + 1;
        months.push({
          name: currentMonthHebName,
          index: months.length,
          firstDate: new Date(currentMonthStart),
          lastDate: new Date(prevDate),
          daysCount: daysCount
        });
        break;
      }

      d.setDate(d.getDate() + 1);
    }

    this._cache.set(hebrewYear, months);
    return months;
  },

  getMonthGrid(hebrewYear, monthIndex) {
    const months = this.getMonthsForYear(hebrewYear);
    if (!months || months.length === 0) return { daysList: [], monthInfo: null, gregorianRangeStr: '' };
    const safeIndex = Math.max(0, Math.min(monthIndex, months.length - 1));
    const monthInfo = months[safeIndex];

    const firstDate = new Date(monthInfo.firstDate);
    const lastDate = new Date(monthInfo.lastDate);

    const startDayOfWeek = firstDate.getDay();
    const totalDays = monthInfo.daysCount;
    const totalCellsNeeded = (startDayOfWeek + totalDays > 35) ? 42 : 35;

    const formatDateKey = (dt) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const daysList = [];

    for (let i = startDayOfWeek; i > 0; i--) {
      const padDate = new Date(firstDate);
      padDate.setDate(padDate.getDate() - i);
      const dateKey = formatDateKey(padDate);
      const hebInfo = DB.getHebrewDateInfo(dateKey);
      const hebGematria = hebInfo.hebrewDate ? hebInfo.hebrewDate.split(' ')[0] : '';
      daysList.push({
        dayNumber: padDate.getDate(),
        hebrewDayGematria: hebGematria,
        dateKey: dateKey,
        isCurrentMonth: false
      });
    }

    for (let i = 0; i < totalDays; i++) {
      const curDate = new Date(firstDate);
      curDate.setDate(curDate.getDate() + i);
      const dateKey = formatDateKey(curDate);
      const hebGematria = convertNumToGematriaDay(i + 1);
      daysList.push({
        dayNumber: curDate.getDate(),
        hebrewDayGematria: hebGematria,
        dateKey: dateKey,
        isCurrentMonth: true
      });
    }

    const remainingCells = totalCellsNeeded - daysList.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      const dateKey = formatDateKey(nextDate);
      const hebInfo = DB.getHebrewDateInfo(dateKey);
      const hebGematria = hebInfo.hebrewDate ? hebInfo.hebrewDate.split(' ')[0] : '';
      daysList.push({
        dayNumber: nextDate.getDate(),
        hebrewDayGematria: hebGematria,
        dateKey: dateKey,
        isCurrentMonth: false
      });
    }

    const fmtDate = (dt) => `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()}`;
    return {
      daysList,
      monthInfo,
      gregorianRangeStr: `${fmtDate(firstDate)} - ${fmtDate(lastDate)}`
    };
  },

  getTodayHebrewInfo() {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(today);
    let hYear = 5787;
    for (const p of parts) {
      if (p.type === 'year') hYear = parseInt(p.value, 10);
    }

    const months = this.getMonthsForYear(hYear);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let matchedIndex = 0;
    for (let i = 0; i < months.length; i++) {
      const s = new Date(months[i].firstDate.getFullYear(), months[i].firstDate.getMonth(), months[i].firstDate.getDate()).getTime();
      const e = new Date(months[i].lastDate.getFullYear(), months[i].lastDate.getMonth(), months[i].lastDate.getDate()).getTime();
      if (todayMid >= s && todayMid <= e) {
        matchedIndex = i;
        break;
      }
    }
    return {
      year: hYear,
      monthIndex: matchedIndex
    };
  },

  getHebrewMonthForDate(date) {
    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let hYear = 5787;
    for (const p of parts) {
      if (p.type === 'year') hYear = parseInt(p.value, 10);
    }
    const months = this.getMonthsForYear(hYear);
    const t = date.getTime();
    let matchedIndex = 0;
    for (let i = 0; i < months.length; i++) {
      if (t >= months[i].firstDate.getTime() && t <= months[i].lastDate.getTime()) {
        matchedIndex = i;
        break;
      }
    }        return { year: hYear, monthIndex: matchedIndex };
  },

  getParashaForDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(Date.UTC(y, m, d));
    const dayOfWeek = dt.getUTCDay(); // 0 is Sunday, 5 is Friday

    // Strictly show on Friday for upcoming Shabbat
    if (dayOfWeek !== 5) {
      return null;
    }

    const shabbatDt = new Date(Date.UTC(y, m, d + 1));
    const sy = shabbatDt.getUTCFullYear();
    const sm = String(shabbatDt.getUTCMonth() + 1).padStart(2, '0');
    const sd = String(shabbatDt.getUTCDate()).padStart(2, '0');
    const shabbatKey = `${sy}-${sm}-${sd}`;

    if (typeof SHABBAT_PARASHOT !== 'undefined' && SHABBAT_PARASHOT[shabbatKey]) {
      return SHABBAT_PARASHOT[shabbatKey].replace(/־/g, ' ');
    }

    // Dynamic background prefetch for dates outside the predefined map
    if (!this._fetchedYears) this._fetchedYears = new Set();
    if (!this._fetchedYears.has(sy) && typeof fetch !== 'undefined') {
      this._fetchedYears.add(sy);
      fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&s=on&i=on&year=${sy}`)
        .then(res => res.json())
        .then(data => {
          let updated = false;
          (data.items || []).forEach(item => {
            if (item.category === 'parashat' && item.date && item.hebrew) {
              if (typeof SHABBAT_PARASHOT !== 'undefined') {
                SHABBAT_PARASHOT[item.date] = item.hebrew;
                updated = true;
              }
            }
          });
          if (updated && typeof renderApp === 'function') {
            renderApp();
          }
        })
        .catch(() => {});
    }

    return null;
  }
};

export const Calendar = {
  // Hebrew month names mapping for Gregorian months
  HEBREW_GREGORIAN_MONTHS: [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ],

  /**
   * Main render function for the Monthly Grid Calendar view
   */
  render({
    year,
    month,
    calendarMode = 'hebrew',
    hebrewYear = 5787,
    hebrewMonthIndex = 0,
    containerId,
    events,
    filterType,
    filterGrade,
    onDayClick,
    onEventClick,
    selectedDate = '',
    onDaySelect = null
  }) {
    const gridContainer = document.getElementById(containerId);
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const formatDateKey = (y, m, d) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    let daysList = [];
    const isFullscreen = document.body.classList.contains('fullscreen-mode');

    if (isFullscreen) {
      // Rolling 4-week kiosk display (current week at top + 3 weeks below, Sunday to Friday = 6 days per week, 24 days total)
      const today = new Date();
      const todayDayOfWeek = today.getDay(); // 0 is Sunday
      const currentSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayDayOfWeek);
      currentSunday.setHours(0, 0, 0, 0);

      for (let w = 0; w < 4; w++) {
        for (let dIdx = 0; dIdx < 6; dIdx++) { // 0 to 5 = Sunday to Friday (skipping Saturday)
          const d = new Date(currentSunday.getFullYear(), currentSunday.getMonth(), currentSunday.getDate() + (w * 7) + dIdx);
          const dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
          const dateInfo = DB.getHebrewDateInfo(dateKey);
          const hebParts = dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ') : [];
          const dayGematria = hebParts[0] || '';
          const hebMonthName = (hebParts[1] || '').replace(/^[בל]/, '');
          const hebrewDayLabel = (dayGematria === "א'" && hebMonthName) ? `${dayGematria} ${hebMonthName}` : dayGematria;

          daysList.push({
            dayNumber: d.getDate(),
            hebrewDayGematria: hebrewDayLabel,
            dateKey: dateKey,
            isCurrentMonth: true // All 4 weeks are part of the active rolling window
          });
        }
      }
    } else if (calendarMode === 'hebrew') {
      const gridData = HebrewCalendar.getMonthGrid(hebrewYear, hebrewMonthIndex);
      daysList = gridData.daysList;
    } else {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const precedingPaddingDays = firstDayOfMonth.getDay();
      const totalCellsNeeded = precedingPaddingDays + daysInMonth > 35 ? 42 : 35;

      const prevMonthDate = new Date(year, month, 0);
      const prevMonthDaysCount = prevMonthDate.getDate();
      const prevMonthYear = prevMonthDate.getFullYear();
      const prevMonthVal = prevMonthDate.getMonth();
      for (let i = precedingPaddingDays - 1; i >= 0; i--) {
        const d = prevMonthDaysCount - i;
        const dateKey = formatDateKey(prevMonthYear, prevMonthVal, d);
        const dateInfo = DB.getHebrewDateInfo(dateKey);
        daysList.push({
          dayNumber: d,
          hebrewDayGematria: dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '',
          dateKey: dateKey,
          isCurrentMonth: false
        });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = formatDateKey(year, month, d);
        const dateInfo = DB.getHebrewDateInfo(dateKey);
        daysList.push({
          dayNumber: d,
          hebrewDayGematria: dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '',
          dateKey: dateKey,
          isCurrentMonth: true
        });
      }

      const nextMonthDate = new Date(year, month + 1, 1);
      const nextMonthYear = nextMonthDate.getFullYear();
      const nextMonthVal = nextMonthDate.getMonth();
      const remainingCells = totalCellsNeeded - daysList.length;
      for (let d = 1; d <= remainingCells; d++) {
        const dateKey = formatDateKey(nextMonthYear, nextMonthVal, d);
        const dateInfo = DB.getHebrewDateInfo(dateKey);
        daysList.push({
          dayNumber: d,
          hebrewDayGematria: dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '',
          dateKey: dateKey,
          isCurrentMonth: false
        });
      }
    }

    // Get today's date key for highlighting
    const today = new Date();
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Filter events based on criteria
    const filteredEvents = this.filterEvents(events, filterType, filterGrade);
    const isMobile = !isFullscreen && isPhoneLayout();

    if (isMobile) {
      this.stopTvRotation();
      this.renderPhoneGrid({
        gridContainer,
        daysList,
        filteredEvents,
        calendarMode,
        todayKey,
        selectedDate,
        onDaySelect,
        onEventClick
      });
      return;
    }

    // Group days into weeks (6 days per week in fullscreen, 7 days in standard mode)
    const daysPerWeek = isFullscreen ? 6 : 7;
    const weeks = [];
    for (let i = 0; i < daysList.length; i += daysPerWeek) {
      weeks.push(daysList.slice(i, i + daysPerWeek));
    }

    weeks.forEach((weekDays) => {
      const weekRow = document.createElement('div');
      weekRow.className = 'calendar-week-row';

      const weekStart = weekDays[0].dateKey;
      const weekEnd = weekDays[weekDays.length - 1].dateKey;
      const lastColIdx = weekDays.length - 1;

      const weekEvents = filteredEvents.filter(evt => {
        return !(evt.endDate < weekStart || evt.startDate > weekEnd);
      });

      const preparedEvents = weekEvents.map(evt => {
        const effectiveStart = evt.startDate < weekStart ? weekStart : evt.startDate;
        const effectiveEnd = evt.endDate > weekEnd ? weekEnd : evt.endDate;
        const startCol = weekDays.findIndex(d => d.dateKey === effectiveStart);
        const endCol = weekDays.findIndex(d => d.dateKey === effectiveEnd);
        const sCol = startCol !== -1 ? startCol : 0;
        const eCol = endCol !== -1 ? endCol : lastColIdx;
        const span = eCol - sCol + 1;
        return {
          event: evt,
          startCol: sCol,
          endCol: eCol,
          span: span,
          startsThisWeek: evt.startDate >= weekStart,
          endsThisWeek: evt.endDate <= weekEnd
        };
      });

      // Sort: multi-day spanning events first (longest span first), then earlier startCol, then earlier startDate
      preparedEvents.sort((a, b) => {
        if (b.span !== a.span) return b.span - a.span;
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        if (a.event.startDate !== b.event.startDate) return a.event.startDate.localeCompare(b.event.startDate);
        return a.event.id.localeCompare(b.event.id);
      });

      // Packing into vertical slots
      const colSlots = Array.from({ length: daysPerWeek }, () => []);
      let maxSlot = -1;
      preparedEvents.forEach(item => {
        let slot = 0;
        while (true) {
          let conflict = false;
          for (let c = item.startCol; c <= item.endCol; c++) {
            if (colSlots[c][slot]) {
              conflict = true;
              break;
            }
          }
          if (!conflict) break;
          slot++;
        }
        for (let c = item.startCol; c <= item.endCol; c++) {
          colSlots[c][slot] = true;
        }
        item.slot = slot;
        if (slot > maxSlot) maxSlot = slot;
      });
      const numSlots = maxSlot + 1;

      // In TV mode, handle dense days with predictable multi-page rotation (up to 3 simultaneous slots)
      const MAX_TV_SLOTS = 3;
      let visibleNumSlots = numSlots;
      let totalPages = 1;
      let currentPage = 0;

      if (isFullscreen) {
        totalPages = Math.max(1, Math.ceil(numSlots / MAX_TV_SLOTS));
        currentPage = (this._tvPageOffset || 0) % totalPages;
        visibleNumSlots = Math.min(numSlots, MAX_TV_SLOTS);
        weekRow.dataset.tvTotalPages = String(totalPages);
        weekRow.dataset.tvCurrentPage = String(currentPage);
      }

      // Explicit grid rows:
      // Row 1: auto (for date numbers & holiday labels)
      // Row 2 to (visibleNumSlots + 1): slot height for each event slot
      // Last Row: bottom spacing
      const slotTrackHeight = isFullscreen ? 'minmax(0, 1fr)' : '26px';
      weekRow.dataset.eventSlots = String(visibleNumSlots);
      const bottomSpacing = isFullscreen ? '2px' : 'minmax(8px, 1fr)';
      const rowTemplates = ['auto'];
      for (let s = 0; s < visibleNumSlots; s++) {
        rowTemplates.push(slotTrackHeight);
      }
      rowTemplates.push(bottomSpacing);
      weekRow.style.gridTemplateRows = rowTemplates.join(' ');

      const totalRowTracks = visibleNumSlots + 2;

      // 1. Render day background cells (spanning row 1 to the end)
      weekDays.forEach((day, colIdx) => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        if (colIdx === lastColIdx) cell.classList.add('is-last-col');
        cell.style.gridColumn = `${colIdx + 1}`;
        cell.style.gridRow = `1 / ${totalRowTracks + 1}`;

        if (!day.isCurrentMonth) cell.classList.add('other-month');
        if (day.dateKey === todayKey) cell.classList.add('today');

        const dateInfo = DB.getHebrewDateInfo(day.dateKey);
        if (dateInfo.status === 'Holiday') cell.classList.add('holiday');
        else if (dateInfo.status === 'Special Day') cell.classList.add('special-day');

        cell.addEventListener('click', () => {
          onDayClick(day.dateKey);
        });

        weekRow.appendChild(cell);
      });

      // 2. Render day headers (grid-row: 1)
      weekDays.forEach((day, colIdx) => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.style.gridColumn = `${colIdx + 1}`;
        header.style.gridRow = '1';

        if (!day.isCurrentMonth) header.classList.add('other-month');
        if (day.dateKey === todayKey) header.classList.add('today');

        const dateInfo = DB.getHebrewDateInfo(day.dateKey);
        if (dateInfo.status === 'Holiday') header.classList.add('holiday');
        else if (dateInfo.status === 'Special Day') header.classList.add('special-day');

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-number-wrapper';

        const primaryLabel = document.createElement('span');
        primaryLabel.className = 'day-number-primary';

        const secondaryLabel = document.createElement('span');
        secondaryLabel.className = 'day-number-secondary';

        if (calendarMode === 'hebrew' || isFullscreen) {
          primaryLabel.textContent = day.hebrewDayGematria || (dateInfo.hebrewDate.split(' ')[0] || '');
          secondaryLabel.textContent = day.dayNumber;
          dayHeader.appendChild(primaryLabel);
          dayHeader.appendChild(secondaryLabel);
        } else {
          primaryLabel.textContent = day.dayNumber;
          secondaryLabel.textContent = day.hebrewDayGematria || (dateInfo.hebrewDate.split(' ')[0] || '');
          dayHeader.appendChild(secondaryLabel);
          dayHeader.appendChild(primaryLabel);
        }

        if (isFullscreen && totalPages > 1 && colIdx === 0) {
          const pageBadge = document.createElement('span');
          pageBadge.className = 'tv-page-indicator';
          pageBadge.textContent = `(${currentPage + 1}/${totalPages})`;
          dayHeader.appendChild(pageBadge);
        }

        header.appendChild(dayHeader);

        if (dateInfo.status === 'Holiday' && dateInfo.description) {
          const holidayLabel = document.createElement('div');
          holidayLabel.className = 'holiday-cell-label';
          holidayLabel.textContent = dateInfo.description;
          holidayLabel.title = dateInfo.description;
          if (isFullscreen) {
            holidayLabel.style.fontSize = '0.72rem';
            holidayLabel.style.lineHeight = '1.12';
          }
          header.appendChild(holidayLabel);
        } else if (dateInfo.status === 'Special Day' && dateInfo.description) {
          const specialLabel = document.createElement('div');
          specialLabel.className = 'special-cell-label';
          specialLabel.textContent = dateInfo.description;
          specialLabel.title = dateInfo.description;
          if (isFullscreen) {
            specialLabel.style.fontSize = '0.72rem';
            specialLabel.style.lineHeight = '1.12';
          }
          header.appendChild(specialLabel);
        }

        const parasha = HebrewCalendar.getParashaForDate(day.dateKey);
        if (parasha) {
          const parashaLabel = document.createElement('div');
          parashaLabel.className = 'parasha-cell-label';
          parashaLabel.innerHTML = `<i class="fas fa-book-open"></i> <span>${parasha}</span>`;
          parashaLabel.title = `פרשת השבוע: ${parasha}`;
          if (isFullscreen) {
            parashaLabel.style.fontSize = '0.72rem';
            parashaLabel.style.lineHeight = '1.12';
          }
          header.appendChild(parashaLabel);
        }

        weekRow.appendChild(header);
      });

      // 3. Render Events in the week
      preparedEvents.forEach(item => {
        if (isFullscreen) {
          const itemPage = Math.floor(item.slot / MAX_TV_SLOTS);
          if (itemPage !== currentPage) {
            return;
          }
        }

        const eventBar = document.createElement('div');
        let typeClass = 'evt-staff';
        switch (item.event.eventType) {
          case 'צוותי': typeClass = 'evt-staff'; break;
          case 'מנהלתי': typeClass = 'evt-admin'; break;
          case 'חברתי': typeClass = 'evt-social'; break;
          case 'פדגוגי': typeClass = 'evt-academic'; break;
          case 'טיול': typeClass = 'evt-trip'; break;
          case 'אחר': typeClass = 'evt-other'; break;
        }

        let segmentClass = 'single-day';
        if (item.span > 1 || !item.startsThisWeek || !item.endsThisWeek) {
          segmentClass = 'multi-day-span';
          if (item.startsThisWeek && !item.endsThisWeek) segmentClass += ' continues-next';
          else if (!item.startsThisWeek && item.endsThisWeek) segmentClass += ' continues-prev';
          else if (!item.startsThisWeek && !item.endsThisWeek) segmentClass += ' continues-both';
        }

        eventBar.className = `event-bar ${segmentClass} ${typeClass}`;
        eventBar.setAttribute('data-event-id', item.event.id);
        eventBar.style.gridColumn = `${item.startCol + 1} / span ${item.span}`;
        const displaySlot = isFullscreen ? (item.slot % MAX_TV_SLOTS) : item.slot;
        eventBar.style.gridRow = `${displaySlot + 2}`;

        const titleSuffix = (!item.startsThisWeek && item.span > 1) ? ' (המשך)' : '';
        eventBar.textContent = item.event.title + titleSuffix;
        eventBar.title = `${item.event.title} (${item.event.eventType})`;

        if (isFullscreen) {
          eventBar.style.fontSize = '0.78rem';
          eventBar.style.lineHeight = '1.15';
        }

        eventBar.addEventListener('click', (e) => {
          e.stopPropagation();
          onEventClick(item.event);
        });

        weekRow.appendChild(eventBar);
      });

      gridContainer.appendChild(weekRow);
    });

    if (isFullscreen) {
      requestAnimationFrame(() => this.fitTvLayout(gridContainer));
      this.startTvRotation(gridContainer, {
        calendarMode,
        year,
        month,
        hebrewYear,
        hebrewMonthIndex,
        containerId,
        events,
        filterType,
        filterGrade,
        onDayClick,
        onEventClick,
        selectedDate,
        onDaySelect
      });
    } else {
      this.stopTvRotation();
    }
  },

  /**
   * Dedicated 2-cards-per-row grid renderer for Phone layout
   */
  renderPhoneGrid({
    gridContainer,
    daysList,
    filteredEvents,
    calendarMode,
    todayKey,
    selectedDate,
    onDaySelect,
    onEventClick
  }) {
    gridContainer.innerHTML = '';

    // Show only days belonging to the displayed month, avoiding unnecessary filler cells.
    const monthDays = daysList.filter(d => d.isCurrentMonth);

    monthDays.forEach(day => {
      const card = document.createElement('div');
      card.className = 'phone-day-card';
      card.dataset.date = day.dateKey;

      if (day.dateKey === selectedDate) card.classList.add('selected-day');
      if (day.dateKey === todayKey) card.classList.add('is-today');

      const dateInfo = DB.getHebrewDateInfo(day.dateKey);
      if (dateInfo.status === 'Holiday') card.classList.add('is-holiday');
      else if (dateInfo.status === 'Special Day') card.classList.add('is-special-day');

      // Card Header
      const header = document.createElement('div');
      header.className = 'phone-card-header';

      const [y, m, d] = day.dateKey.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayNames = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
      const weekdayName = dayNames[dt.getDay()];

      const topRow = document.createElement('div');
      topRow.className = 'phone-card-top-row';

      const weekdayEl = document.createElement('span');
      weekdayEl.className = 'phone-card-weekday';
      weekdayEl.textContent = weekdayName;
      topRow.appendChild(weekdayEl);

      const dateBadge = document.createElement('div');
      dateBadge.className = 'phone-card-date-badge';

      const gregNum = document.createElement('span');
      gregNum.className = 'phone-card-greg-num';
      gregNum.textContent = day.dayNumber;

      const hebDateStr = day.hebrewDayGematria || (dateInfo.hebrewDate ? dateInfo.hebrewDate.split(' ')[0] : '');
      const hebLabel = document.createElement('span');
      hebLabel.className = 'phone-card-heb-date';
      hebLabel.textContent = hebDateStr;

      if (calendarMode === 'hebrew') {
        dateBadge.appendChild(hebLabel);
        dateBadge.appendChild(document.createTextNode(' · '));
        dateBadge.appendChild(gregNum);
      } else {
        dateBadge.appendChild(gregNum);
        if (hebDateStr) {
          dateBadge.appendChild(document.createTextNode(' · '));
          dateBadge.appendChild(hebLabel);
        }
      }

      if (day.dateKey === todayKey) {
        const todayPill = document.createElement('span');
        todayPill.className = 'phone-today-pill';
        todayPill.textContent = 'היום';
        dateBadge.appendChild(todayPill);
      }

      topRow.appendChild(dateBadge);
      header.appendChild(topRow);

      // Holiday / Special Day Label
      if (dateInfo.status === 'Holiday' && dateInfo.description) {
        const hBadge = document.createElement('div');
        hBadge.className = 'phone-holiday-badge';
        hBadge.innerHTML = `<i class="fas fa-umbrella-beach"></i> <span>${dateInfo.description}</span>`;
        header.appendChild(hBadge);
      } else if (dateInfo.status === 'Special Day' && dateInfo.description) {
        const sBadge = document.createElement('div');
        sBadge.className = 'phone-special-badge';
        sBadge.innerHTML = `<i class="fas fa-star"></i> <span>${dateInfo.description}</span>`;
        header.appendChild(sBadge);
      }

      const parasha = HebrewCalendar.getParashaForDate(day.dateKey);
      if (parasha) {
        const pBadge = document.createElement('div');
        pBadge.className = 'phone-parasha-badge';
        pBadge.innerHTML = `<i class="fas fa-book-open"></i> <span>${parasha}</span>`;
        pBadge.title = `פרשת השבוע: ${parasha}`;
        header.appendChild(pBadge);
      }

      // Tapping the day heading selects that date
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        gridContainer.querySelectorAll('.phone-day-card.selected-day').forEach(c => c.classList.remove('selected-day'));
        card.classList.add('selected-day');
        if (onDaySelect) onDaySelect(day.dateKey);
      });

      card.addEventListener('click', () => {
        gridContainer.querySelectorAll('.phone-day-card.selected-day').forEach(c => c.classList.remove('selected-day'));
        card.classList.add('selected-day');
        if (onDaySelect) onDaySelect(day.dateKey);
      });

      card.appendChild(header);

      // Events Container
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'phone-card-events';

      const activeDayEvents = filteredEvents.filter(evt => day.dateKey >= evt.startDate && day.dateKey <= evt.endDate);

      const createEventItem = (evt) => {
        const item = document.createElement('div');
        let typeClass = 'evt-staff';
        switch (evt.eventType) {
          case 'צוותי': typeClass = 'evt-staff'; break;
          case 'מנהלתי': typeClass = 'evt-admin'; break;
          case 'חברתי': typeClass = 'evt-social'; break;
          case 'פדגוגי': typeClass = 'evt-academic'; break;
          case 'טיול': typeClass = 'evt-trip'; break;
          case 'אחר': typeClass = 'evt-other'; break;
        }
        item.className = `phone-event-item ${typeClass}`;
        item.setAttribute('data-event-id', evt.id);

        const titleSpan = document.createElement('div');
        titleSpan.className = 'phone-event-title';
        titleSpan.textContent = evt.title;
        item.appendChild(titleSpan);

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onEventClick) onEventClick(evt);
        });
        return item;
      };

      // Show up to three event titles per day (allowing up to two lines per title)
      const visibleEvents = activeDayEvents.slice(0, 3);
      visibleEvents.forEach(evt => {
        eventsContainer.appendChild(createEventItem(evt));
      });

      // If more events exist, show a clear “עוד N אירועים” control that reveals all events for that day
      if (activeDayEvents.length > 3) {
        const extraEvents = activeDayEvents.slice(3);
        const extraContainer = document.createElement('div');
        extraContainer.className = 'phone-extra-events-container';
        extraContainer.style.display = 'none';

        extraEvents.forEach(evt => {
          extraContainer.appendChild(createEventItem(evt));
        });
        eventsContainer.appendChild(extraContainer);

        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'phone-more-events-btn';
        moreBtn.innerHTML = `<span>עוד ${extraEvents.length} אירועים</span> <i class="fas fa-chevron-down"></i>`;
        moreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = extraContainer.style.display === 'none';
          if (isHidden) {
            extraContainer.style.display = 'flex';
            moreBtn.innerHTML = `<span>הסתר אירועים</span> <i class="fas fa-chevron-up"></i>`;
            moreBtn.classList.add('expanded');
          } else {
            extraContainer.style.display = 'none';
            moreBtn.innerHTML = `<span>עוד ${extraEvents.length} אירועים</span> <i class="fas fa-chevron-down"></i>`;
            moreBtn.classList.remove('expanded');
          }
        });
        eventsContainer.appendChild(moreBtn);
      }

      card.appendChild(eventsContainer);
      gridContainer.appendChild(card);
    });
  },

  /**
   * TV Text fitting helper enforcing minimum font size and reserved holiday space
   */
  fitTvLayout(container) {
    if (!document.body.classList.contains('fullscreen-mode') || !container.isConnected) return;
    const fitText = (element, initialPx, minimumPx) => {
      let size = initialPx;
      element.style.setProperty('font-size', size + 'px', 'important');
      element.style.setProperty('line-height', '1.12', 'important');
      element.style.setProperty('white-space', 'normal', 'important');
      element.style.setProperty('word-break', 'break-word', 'important');
      while (size > minimumPx && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1)) {
        size -= 0.5;
        element.style.setProperty('font-size', size + 'px', 'important');
      }
    };
    container.querySelectorAll('.calendar-week-row').forEach(row => {
      const headers = Array.from(row.querySelectorAll('.calendar-day-header'));
      const count = Number(row.dataset.eventSlots || 0);
      const budget = Math.max(26, row.clientHeight * (count ? 0.32 : 0.8));
      headers.forEach(header => {
        header.style.maxHeight = budget + 'px';
        header.querySelectorAll('.holiday-cell-label, .special-cell-label, .parasha-cell-label').forEach(label => {
          label.style.maxHeight = Math.max(12, budget - 18) + 'px';
          fitText(label, 12, 10);
        });
      });
      const headerHeight = Math.min(budget, Math.max(26, ...headers.map(header => header.scrollHeight)));
      row.style.gridTemplateRows = [headerHeight + 'px', ...Array(count).fill('minmax(0, 1fr)'), '2px'].join(' ');
      row.querySelectorAll('.event-bar').forEach(bar => fitText(bar, 13, 10.5));
    });
  },

  stopTvRotation() {
    if (this._tvRotationTimer) {
      clearInterval(this._tvRotationTimer);
      this._tvRotationTimer = null;
    }
  },

  startTvRotation(container, renderArgs) {
    this.stopTvRotation();
    if (!document.body.classList.contains('fullscreen-mode')) return;
    let hasMultiPage = false;
    container.querySelectorAll('.calendar-week-row').forEach(row => {
      if (Number(row.dataset.tvTotalPages || 1) > 1) hasMultiPage = true;
    });
    if (!hasMultiPage || !renderArgs) return;

    this._tvRotationTimer = setInterval(() => {
      if (!document.body.classList.contains('fullscreen-mode')) {
        this.stopTvRotation();
        return;
      }
      this._tvPageOffset = (this._tvPageOffset || 0) + 1;
      this.render(renderArgs);
    }, 8000);
  },
  

  /**
   * Filter events based on active dropdowns
   */
  filterEvents(events, filterType, filterGrade) {
    return events.filter(event => {
      // 1. Filter by Event Type
      if (filterType !== 'all' && event.eventType !== filterType) {
        return false;
      }
      
      // 2. Filter by Target Grade
      if (filterGrade !== 'all') {
        if (event.targetGrades && event.targetGrades.length > 0) {
          return event.targetGrades.includes(filterGrade);
        }
      }
      
      return true;
    });
  }
};
