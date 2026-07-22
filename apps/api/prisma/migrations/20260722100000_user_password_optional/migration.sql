-- users.password_hash becomes optional.
--
-- Some people in the system are recorded but never sign in. TK Qur'an pupils
-- are the case that forced it: they are four to six years old and hold no
-- account, yet they must exist as Students for attendance, PAUD assessment,
-- SPP and the parent portal to have anyone to point at. Student has no name
-- column and requires a userId, so the identity row is where the name lives.
--
-- NULL here means no credential was ever issued — a stronger and more honest
-- statement than storing a random hash nobody knows. authService.login refuses
-- such rows explicitly instead of handing a NULL to bcrypt.
--
-- Existing rows are untouched: every account keeps the hash it has.

ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
