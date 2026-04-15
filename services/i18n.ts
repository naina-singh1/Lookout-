// services/i18n.ts — English + Hindi translations for Lookout

export type Lang = 'en' | 'hi';

const translations = {
  en: {
    // Nav
    navMap:     'Map',
    navFeed:    'Feed',
    navRoute:   'Route',
    navMe:      'Me',

    // Map screen
    city:                  'Delhi',
    reports:               (n: number) => `${n} report${n !== 1 ? 's' : ''}`,
    nearestPotholes:       (n: number) => `Nearest ${n} Pothole${n !== 1 ? 's' : ''}`,
    noPotholesNearby:      'No potholes nearby',
    noPotholesYet:         'No potholes reported yet — be the first!',
    reportBtn:             '+ Report',
    reportModalTitle:      'Report a Pothole',
    reportModalSub:        'at your current location',
    submitReport:          'Submit Report',
    cancel:                'Cancel',
    reportedTitle:         'Reported!',
    reportedMsg:           (sev: string, loc: string) => `${sev} pothole logged at ${loc}.`,
    locationNeeded:        'Location needed',
    locationNeededMsg:     'Enable location access to report a pothole.',
    error:                 'Error',
    severe:                'Severe',
    moderate:              'Moderate',
    minor:                 'Minor',

    // Driving alert
    slowDownNow:           'SLOW DOWN NOW',
    slowDown:              'Slow down ahead',
    easeOff:               'Pothole ahead',
    potholeAhead:          'Pothole ahead',

    // Feed screen
    nearbyFeed:            'Nearby Feed',
    filterAll:             'All',
    filterSevere:          'Severe',
    filterModerate:        'Moderate',
    filterMinor:           'Minor',
    loadingReports:        'Loading reports…',
    noReportsYet:          'No potholes reported yet',
    useMapTab:             'Use the Map tab to report one!',
    tryDifferentFilter:    'Try a different filter',

    // Route screen
    routePlanner:          'Route Planner',
    destination:           'Destination',
    whereTo:               'Where to? e.g. Connaught Place',
    go:                    'Go',
    routeSummary:          'Route Summary',
    distance:              'Distance',
    estTime:               'Est. time',
    potholes:              'Potholes',
    severePotholeWarning:  (n: number) => `${n} severe pothole${n !== 1 ? 's' : ''} on this route`,
    considerAlternate:     (mod: number) => `${mod > 0 ? `+ ${mod} moderate · ` : ''}Consider an alternate route`,
    potholesOnRoute:       (n: number) => `${n} Pothole${n !== 1 ? 's' : ''} on Route`,
    noPotholesOnRoute:     'No potholes on this route 🎉',
    enterDestination:      'Enter a destination',
    routeSubtitle:         "We'll warn you about potholes on the way",
    fromRoute:             'from route',
    placeNotFound:         'Place not found',
    placeNotFoundMsg:      (dest: string) => `Could not find "${dest}". Try adding more detail.`,
    routeNotFound:         'Route not found',
    routeNotFoundMsg:      (dest: string) => `Could not find a driving route to "${dest}".`,
    locationNeededRoute:   'Enable location to use Route Planner.',

    // Profile screen
    profile:               'Profile',
    reported:              'Reported',
    confirmed:             'Confirmed',
    alertSettings:         'Alert Settings',
    drivingAlerts:         'Driving alerts',
    drivingAlertsSub:      'Show banner while driving near a pothole',
    proximityNotifs:       'Proximity notifications',
    proximityNotifsSub:    'Push notification 100m before a pothole',
    myReports:             'My Reports',
    noReportsProfile:      'No reports yet — use the Map tab to report one!',
    signOut:               'Sign Out',
    language:              'Language',

    // Notifications
    notifSlowDownNow:      'SLOW DOWN NOW',
    notifSlowDown:         'Slow down ahead',
    notifPotholeAhead:     'Pothole ahead',
    notifBody:             (sev: string, loc: string, dist: string) =>
      `${sev.charAt(0).toUpperCase() + sev.slice(1)} pothole — ${loc} · ${dist} away`,
  },

  hi: {
    // Nav
    navMap:     'मानचित्र',
    navFeed:    'फ़ीड',
    navRoute:   'मार्ग',
    navMe:      'मैं',

    // Map screen
    city:                  'दिल्ली',
    reports:               (n: number) => `${n} रिपोर्ट`,
    nearestPotholes:       (n: number) => `निकटतम ${n} गड्ढ${n !== 1 ? 'े' : 'ा'}`,
    noPotholesNearby:      'पास में कोई गड्ढा नहीं',
    noPotholesYet:         'अभी तक कोई गड्ढा रिपोर्ट नहीं — पहले रिपोर्ट करें!',
    reportBtn:             '+ रिपोर्ट',
    reportModalTitle:      'गड्ढा रिपोर्ट करें',
    reportModalSub:        'आपके वर्तमान स्थान पर',
    submitReport:          'रिपोर्ट सबमिट करें',
    cancel:                'रद्द करें',
    reportedTitle:         'रिपोर्ट हो गया!',
    reportedMsg:           (sev: string, loc: string) => `${loc} पर ${sev} गड्ढा दर्ज किया गया।`,
    locationNeeded:        'स्थान आवश्यक',
    locationNeededMsg:     'गड्ढा रिपोर्ट करने के लिए स्थान सक्षम करें।',
    error:                 'त्रुटि',
    severe:                'गंभीर',
    moderate:              'मध्यम',
    minor:                 'मामूली',

    // Driving alert
    slowDownNow:           'अभी धीमे हों!',
    slowDown:              'आगे धीमे हों',
    easeOff:               'आगे गड्ढा है',
    potholeAhead:          'आगे गड्ढा है',

    // Feed screen
    nearbyFeed:            'नज़दीकी फ़ीड',
    filterAll:             'सभी',
    filterSevere:          'गंभीर',
    filterModerate:        'मध्यम',
    filterMinor:           'मामूली',
    loadingReports:        'रिपोर्ट लोड हो रही है…',
    noReportsYet:          'अभी तक कोई गड्ढा रिपोर्ट नहीं',
    useMapTab:             'मानचित्र टैब से रिपोर्ट करें!',
    tryDifferentFilter:    'दूसरा फ़िल्टर आज़माएं',

    // Route screen
    routePlanner:          'मार्ग योजनाकार',
    destination:           'गंतव्य',
    whereTo:               'कहाँ जाना है? जैसे कनॉट प्लेस',
    go:                    'जाएं',
    routeSummary:          'मार्ग सारांश',
    distance:              'दूरी',
    estTime:               'अनुमानित समय',
    potholes:              'गड्ढे',
    severePotholeWarning:  (n: number) => `इस मार्ग पर ${n} गंभीर गड्ढ${n !== 1 ? 'े' : 'ा'}`,
    considerAlternate:     (mod: number) => `${mod > 0 ? `+ ${mod} मध्यम · ` : ''}वैकल्पिक मार्ग पर विचार करें`,
    potholesOnRoute:       (n: number) => `मार्ग पर ${n} गड्ढ${n !== 1 ? 'े' : 'ा'}`,
    noPotholesOnRoute:     'इस मार्ग पर कोई गड्ढा नहीं 🎉',
    enterDestination:      'गंतव्य दर्ज करें',
    routeSubtitle:         'रास्ते में गड्ढों के बारे में सूचित करेंगे',
    fromRoute:             'मार्ग से',
    placeNotFound:         'स्थान नहीं मिला',
    placeNotFoundMsg:      (dest: string) => `"${dest}" नहीं मिला। अधिक विवरण जोड़ें।`,
    routeNotFound:         'मार्ग नहीं मिला',
    routeNotFoundMsg:      (dest: string) => `"${dest}" तक ड्राइविंग मार्ग नहीं मिला।`,
    locationNeededRoute:   'मार्ग योजनाकार के लिए स्थान सक्षम करें।',

    // Profile screen
    profile:               'प्रोफ़ाइल',
    reported:              'रिपोर्ट किए',
    confirmed:             'पुष्टि किए',
    alertSettings:         'अलर्ट सेटिंग्स',
    drivingAlerts:         'ड्राइविंग अलर्ट',
    drivingAlertsSub:      'गड्ढे के पास ड्राइव करते समय बैनर दिखाएं',
    proximityNotifs:       'निकटता सूचनाएं',
    proximityNotifsSub:    'गड्ढे से 100 मीटर पहले सूचना',
    myReports:             'मेरी रिपोर्ट',
    noReportsProfile:      'अभी तक कोई रिपोर्ट नहीं — मानचित्र टैब से रिपोर्ट करें!',
    signOut:               'साइन आउट',
    language:              'भाषा',

    // Notifications
    notifSlowDownNow:      'अभी धीमे हों!',
    notifSlowDown:         'आगे धीमे हों',
    notifPotholeAhead:     'आगे गड्ढा है',
    notifBody:             (sev: string, loc: string, dist: string) =>
      `${sev} गड्ढा — ${loc} · ${dist} दूर`,
  },
} as const;

export type Translations = typeof translations.en;
export { translations };
