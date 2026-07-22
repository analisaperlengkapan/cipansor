-- Dormitory.unit_id becomes optional.
--
-- An asrama at Cipansor is run at foundation level: santri study at SD IT,
-- SMP IT or SMA Qur'an and board in the same building. The column was NOT NULL,
-- so a unit had to be named, and every asrama claimed SMP IT while housing
-- santri from three units. NULL now means "dikelola yayasan, lintas unit",
-- the same convention announcements.unit_id already uses.
--
-- Existing rows are deliberately left alone. Which unit runs an asrama is an
-- operational fact, not something a migration should guess; the field is now
-- editable and can be cleared from the UI. Access control no longer reads this
-- column at all (see assertRoomAccess), so a stale value here cannot lock
-- anyone out.

ALTER TABLE "dormitories" ALTER COLUMN "unit_id" DROP NOT NULL;
