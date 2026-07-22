-- A yayasan's three organs are mutually exclusive.
--
-- UU No. 16/2001 jo. UU No. 28/2004 Pasal 29: "Anggota Pembina tidak boleh
-- merangkap sebagai anggota Pengurus dan/atau anggota Pengawas." The
-- separation is the point of the structure: the organ that appoints cannot
-- also be the organ that executes, nor the one that audits.
--
-- The API enforces this too (utils/role-eligibility.ts), and that is where a
-- person doing data entry gets a readable message. This trigger exists because
-- bulk imports, restores and manual SQL repairs never pass through application
-- code — which is exactly how the current violation arrived: the seed gave
-- ketua@cipansor.or.id both YAYASAN_KETUA and YAYASAN_PEMBINA.
--
-- A trigger rather than a unique index: the rule is "at most one organ per
-- user", which depends on a join to `roles`, and an index predicate cannot
-- reach another table. Holding two roles *within* one organ stays allowed — a
-- small yayasan may have one person as both ketua and bendahara.

CREATE OR REPLACE FUNCTION assert_yayasan_organ_exclusive()
RETURNS TRIGGER AS $$
DECLARE
  incoming_organ text;
  conflicting_organ text;
BEGIN
  SELECT CASE
           WHEN r.code = 'YAYASAN_PEMBINA' THEN 'PEMBINA'
           WHEN r.code = 'YAYASAN_PENGAWAS' THEN 'PENGAWAS'
           WHEN r.code IN ('YAYASAN_KETUA', 'YAYASAN_SEKRETARIS',
                           'YAYASAN_BENDAHARA', 'YAYASAN_ANGGOTA') THEN 'PENGURUS'
         END
    INTO incoming_organ
    FROM roles r
   WHERE r.id = NEW.role_id;

  -- Not a yayasan organ role, or the assignment is inactive: nothing to check.
  IF incoming_organ IS NULL OR NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT CASE
           WHEN r.code = 'YAYASAN_PEMBINA' THEN 'PEMBINA'
           WHEN r.code = 'YAYASAN_PENGAWAS' THEN 'PENGAWAS'
           ELSE 'PENGURUS'
         END
    INTO conflicting_organ
    FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
   WHERE ura.user_id = NEW.user_id
     AND ura.id <> NEW.id
     AND ura.is_active
     AND r.code IN ('YAYASAN_PEMBINA', 'YAYASAN_PENGAWAS', 'YAYASAN_KETUA',
                    'YAYASAN_SEKRETARIS', 'YAYASAN_BENDAHARA', 'YAYASAN_ANGGOTA')
     AND CASE
           WHEN r.code = 'YAYASAN_PEMBINA' THEN 'PEMBINA'
           WHEN r.code = 'YAYASAN_PENGAWAS' THEN 'PENGAWAS'
           ELSE 'PENGURUS'
         END <> incoming_organ
   LIMIT 1;

  IF conflicting_organ IS NOT NULL THEN
    RAISE EXCEPTION
      'Yayasan organ conflict: % cannot also be % (UU 16/2001 Pasal 29)',
      incoming_organ, conflicting_organ
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_yayasan_organ_exclusive ON user_role_assignments;

CREATE TRIGGER trg_yayasan_organ_exclusive
  BEFORE INSERT OR UPDATE ON user_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION assert_yayasan_organ_exclusive();
