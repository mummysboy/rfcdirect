/**
 * FORK POINT — all user-facing strings.
 *
 * No rugby-specific copy should appear outside this file. When forked to a new
 * vertical, swap every value here and the rest of the app reads correctly.
 *
 * Keep keys generic ("brand.wordmark", not "rugbyDirectName") so the schema
 * doesn't have to change on fork — only the values do.
 */

import type { Category, DayOfWeek, Division, Status } from './constants';

export const copy = {
  brand: {
    name: 'Rugby Direct',
    wordmark: 'Rugby Direct',
  },

  nav: {
    manageClub: 'Manage a club',
    signOut: 'Sign out',
    back: 'Back',
  },

  home: {
    tagline: 'Find rugby clubs near you',
    locationPlaceholder: 'Enter a location',
    searchingNear: (location: string) => `Showing clubs near ${location}`,
    geocodingNote: 'Add a Mapbox token to .env to search any location.',
    radiusLabel: (miles: number) => `${miles} mi`,
    radiusEyebrow: 'Radius',
    emptyNoLocation: 'Enter a location to find rugby clubs near you',
    emptyNoResults: (radius: number, location: string) =>
      `No clubs found within ${radius} miles of ${location}. Try expanding your search.`,
    expandRadiusCta: 'Expand radius +25 mi',
    resultsCount: (n: number) =>
      n === 1 ? '1 club in range' : `${n} clubs in range`,
    resultsInView: (n: number) =>
      n === 1 ? '1 club in view' : `${n} clubs in view`,
    emptyNoClubsInView: 'No clubs in this area. Pan or zoom out.',
    findingClubs: 'Finding clubs near you…',
    loadError: "Couldn't load clubs. Pull to retry.",
    filtersChipLabel: (location: string, radius: number, count: number) =>
      `${location} · ${radius} mi · ${count === 1 ? '1 club' : `${count} clubs`}`,
    filtersChipSearching: (location: string, radius: number) =>
      `${location} · ${radius} mi · Searching…`,
    filtersChipA11y: (location: string, radius: number, count: number) =>
      `Filters: ${location}, ${radius} miles, ${
        count === 1 ? '1 club' : `${count} clubs`
      }. Activate to edit.`,
    filtersChipEdit: 'Edit',
  },

  club: {
    contactCta: 'Contact club',
    shareCta: 'Share',
    editCta: 'Edit profile',
    claimPrompt: 'Is this your club? Claim it.',
    foundedLabel: (year: number) => `Est. ${year}`,
    distanceLabel: (miles: number) => `${miles.toFixed(1)} mi`,
    sections: {
      about: 'About',
      details: 'Details',
      contact: 'Contact',
      social: 'Social',
    },
    fields: {
      name: 'Name',
      location: 'Practice location',
      founded: 'Founded',
      division: 'Division',
      category: 'Category',
      website: 'Website',
      email: 'Email',
      phone: 'Phone',
      practiceDays: 'Practice days',
      practiceTimes: 'Practice times',
    },
    validation: {
      nameRequired: 'Name is required',
      descriptionTooShort:
        'Description should be at least a sentence or two',
      addressRequired: 'Address is required',
      hexInvalid: 'Use a hex color like #B5161E',
    },
  },

  auth: {
    signInTitle: 'Sign in',
    signUpTitle: 'Sign up',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    signInCta: 'Sign in',
    signUpCta: 'Create account',
    signInLoading: 'Signing in…',
    signUpLoading: 'Creating account…',
    switchToSignUp: "Don't have an account? Sign up",
    switchToSignIn: 'Already have an account? Sign in',
    genericError: 'Something went wrong. Try again.',
    invalidEmail: 'Enter a valid email address',
    passwordTooShort: 'Password must be at least 8 characters',
  },

  admin: {
    dashboardTitle: 'Your clubs',
    addClubTitle: 'Add a new club',
    claimCta: 'Claim a club',
    emptyDashboard: "You haven't claimed any clubs yet.",
    statusPending: 'Pending review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    saveCta: 'Save changes',
    savingState: 'Saving…',
    saveSuccess: 'Profile saved',
    claimSubmitted: 'Claim submitted for review',
    uploadLogo: 'Upload logo',
    replaceLogo: 'Replace logo',
    moderateCta: 'Moderate',
    moderateTitle: 'Moderation queue',
    pendingClubsHeading: 'Pending new clubs',
    pendingClaimsHeading: 'Pending claims',
    noPendingClaims: 'No pending claims.',
    noPendingClubs: 'No pending new clubs.',
    noPendingItems: 'Nothing to moderate.',
    approveCta: 'Approve',
    rejectCta: 'Reject',
    listedContactLabel: (email: string) => `Listed contact: ${email}`,
    submittedByLabel: (email: string) => `Submitted by ${email}`,
    practiceLabel: 'Practice',
  },

  notFound: {
    title: "We couldn't find that club",
    body: 'The link may be broken, or the club may have been removed.',
    cta: 'Back to home',
  },

  errors: {
    geocoding: "Couldn't find that location. Try another address.",
    network: 'Connection trouble. Retrying…',
    retryCta: 'Retry',
    uploadFailed: "Couldn't upload that image. Try again.",
  },
} as const;

/** Display labels for enum values. Lookup tables, not free-form strings. */
export const divisionLabels: Record<Division, string> = {
  D1: 'D1',
  D2: 'D2',
  D3: 'D3',
  social: 'Social',
  collegiate: 'Collegiate',
  youth: 'Youth',
  other: 'Other',
};

export const categoryLabels: Record<Category, string> = {
  mens: "Men's",
  womens: "Women's",
  mixed: 'Mixed',
  youth_boys: 'Youth boys',
  youth_girls: 'Youth girls',
  youth_mixed: 'Youth mixed',
};

export const statusLabels: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const dayLabels: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};
