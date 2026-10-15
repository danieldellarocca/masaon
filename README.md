# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## איפה אני? – משחק ניחוש מקומות (`/geo`)

משחק אישי בסגנון GeoGuessr: נוחתים במקום אקראי ב-Google Street View ומנחשים על המפה איפה זה.
המשחק עצמאי לגמרי (בלי Firebase ובלי משתמשים), ונמצא בכתובת `/geo` של האתר.

- **בחירת מפה:** כל העולם, יבשת, אזור (המזרח התיכון, סקנדינביה, הבלקן, דרום-מזרח אסיה ועוד), מדינה אחת או כמה מדינות, או עיגול שמסמנים בעצמכם על המפה.
- **הגדרות:** 3/5/10 סבבים, הגבלת זמן לסבב, ושלושה מצבי תנועה (חופשי / בלי תזוזה / תמונה קפואה).
- **ניקוד:** הנוסחה של GeoGuessr – עד 5,000 נקודות לסבב, לפי המרחק ביחס לגודל המפה.
- היסטוריית משחקים ושיאים נשמרים בדפדפן (localStorage).

### מפתח Google Maps

צריך מפתח API של Google עם **Maps JavaScript API** מופעל (וחשבון חיוב; יש מכסה חודשית חינמית).
אפשר להדביק את המפתח במסך הפתיחה של המשחק (נשמר רק בדפדפן), או להגדיר אותו בסביבה:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
# אופציונלי: Map ID משלכם (ברירת המחדל היא DEMO_MAP_ID)
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=...
```

קוד המשחק: `src/app/geo`, `src/components/geo`, `src/lib/geo`. גבולות המדינות: `public/geo/countries-50m.json` (Natural Earth דרך world-atlas).
