-- Rename the two destination labels:
--
--   DRAWER  →  COUNTER  (admin obligations — where you do business with a teller)
--   TILL    →  ATM      (optional pulls — self-serve, grab when ready)
--
-- Items currently sit under either label; just point them at the new name.

update items set box = 'COUNTER' where box = 'DRAWER';
update items set box = 'ATM'     where box = 'TILL';
