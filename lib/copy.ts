/**
 * FORK POINT — all user-facing strings.
 *
 * No rugby-specific copy should appear outside this file. When forked to a new
 * vertical, swap every value here and the rest of the app reads correctly.
 *
 * Keep keys generic ("brand.wordmark", not "rugbyDirectName") so the schema
 * doesn't have to change on fork — only the values do.
 */

import type { Category, Division, Status } from './constants';

export const copy = {
  brand: {
    name: 'Rugby Direct',
    wordmark: 'Rugby Direct',
  },

  nav: {
    manageClub: 'Manage a club',
    signOut: 'Sign out',
  },

  home: {
    tagline: 'Find rugby clubs near you',
    locationPlaceholder: 'Enter a location',
    radiusLabel: (miles: number) => `${miles} mi`,
    emptyNoLocation: 'Enter a location to find rugby clubs near you',
    emptyNoResults: (radius: number, location: string) =>
      `No clubs found within ${radius} miles of ${location}. Try expanding your search.`,
    expandRadiusCta: 'Expand radius +25 mi',
    resultsCount: (n: number) =>
      n === 1 ? '1 club in range' : `${n} clubs in range`,
    findingClubs: 'Finding clubs near you…',
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
      location: 'Location',
      founded: 'Founded',
      division: 'Division',
      category: 'Category',
      website: 'Website',
      email: 'Email',
      phone: 'Phone',
    },
  },

  auth: {
    signInTitle: 'Sign in',
    signUpTitle: 'Sign up',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    signInCta: 'Sign in',
    signUpCta: 'Create account',
    switchToSignUp: "Don't have an account? Sign up",
    switchToSignIn: 'Already have an account? Sign in',
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
