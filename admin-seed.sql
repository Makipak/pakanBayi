INSERT INTO "User" (id, username, "passwordHash", role, nama)
VALUES (
  'admin_cafddc256a8ffe10b80fe592',
  'admin',
  '$2b$10$dtgjW0Zfdkm4PI10IAT1We/GSyuOzz/JWcC0DL433W0RP1z2mohsu',
  'ADMIN',
  'Peneliti Utama'
)
ON CONFLICT (username) DO NOTHING;
