-- Backfill role rows for Lane 6 demo accounts so RBAC middleware can authorize clinical routes.
INSERT INTO permissions (id, userId, roleCode, assignedAt, assignedBy)
SELECT UUID(), u.id, 'doctor', NOW(3), NULL
FROM users u
JOIN roles r ON r.code = 'doctor'
WHERE u.id = 'usr-doc-01'
  AND u.username = 'doctor.lane6'
  AND NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.userId = u.id
      AND p.roleCode = 'doctor'
  );

INSERT INTO permissions (id, userId, roleCode, assignedAt, assignedBy)
SELECT UUID(), u.id, 'nurse', NOW(3), NULL
FROM users u
JOIN roles r ON r.code = 'nurse'
WHERE u.id = 'usr-nurse-01'
  AND u.username = 'nurse.lane6'
  AND NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.userId = u.id
      AND p.roleCode = 'nurse'
  );
