-- Sample seed data so the app is useful in local dev.
-- Replace with real curated club list before going to production.

insert into public.clubs (
  name, slug, description, year_founded, division, category,
  location, address_display, website_url, brand_color, status
) values
  (
    'Olympic Club RFC',
    'olympic-club-rfc',
    'A historic San Francisco rugby side competing at the highest level of US club rugby. Welcomes new players at all experience levels for the social side; the D1 squad is selective.',
    1981,
    'D1',
    'mens',
    st_makepoint(-122.4194, 37.7749)::geography,
    'San Francisco, CA',
    'https://www.olyclubrugby.com',
    '#B5161E',
    'approved'
  ),
  (
    'San Francisco Golden Gate RFC',
    'sf-golden-gate-rfc',
    'SFGG fields D1 men''s and women''s sides plus social and youth programs out of Treasure Island and the Presidio. Long-running pipeline to the Eagles.',
    1962,
    'D1',
    'mens',
    st_makepoint(-122.3712, 37.8235)::geography,
    'San Francisco, CA',
    'https://www.sfggrugby.org',
    '#1A1A1A',
    'approved'
  ),
  (
    'Berkeley All Blues',
    'berkeley-all-blues',
    'East Bay women''s rugby club with a deep tradition of national championships. Recruits experienced players and runs a strong development side.',
    1979,
    'D1',
    'womens',
    st_makepoint(-122.2730, 37.8715)::geography,
    'Berkeley, CA',
    null,
    '#003F87',
    'approved'
  ),
  (
    'San Jose Seahawks RFC',
    'san-jose-seahawks-rfc',
    'South Bay men''s side playing competitive Northern California club rugby. Friendly to new players and former high school / college athletes returning to the game.',
    1968,
    'D2',
    'mens',
    st_makepoint(-121.8863, 37.3382)::geography,
    'San Jose, CA',
    null,
    '#1A4D2E',
    'approved'
  );
