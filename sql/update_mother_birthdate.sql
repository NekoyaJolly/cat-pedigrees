-- Trigger function to update mother's notes2 with the latest kitten's birth_date
CREATE OR REPLACE FUNCTION update_mother_notes2_on_kitten_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if mother_jcu and birth_date exist on the new record
  IF NEW.mother_jcu IS NOT NULL AND NEW.birth_date IS NOT NULL THEN
    -- Update the mother's record where pedigree_id matches the mother_jcu
    -- Note: If you have a different identifier field for mother (e.g. jcu, old_code), 
    -- replace pedigree_id with that field.
    UPDATE pedigrees
    SET 
      notes2 = NEW.birth_date,
      updated_at = NOW()
    WHERE pedigree_id = NEW.mother_jcu;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition for INSERT and UPDATE on pedigrees table
DROP TRIGGER IF EXISTS update_mother_trigger ON pedigrees;
CREATE TRIGGER update_mother_trigger
AFTER INSERT OR UPDATE OF mother_jcu, birth_date ON pedigrees
FOR EACH ROW
EXECUTE FUNCTION update_mother_notes2_on_kitten_change();
