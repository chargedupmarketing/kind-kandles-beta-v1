-- Migration: Remove unused developer tools
-- Date: 2026-02-17
-- Description: Cleanup for removed features (Cleanup Names, Remove Default Titles, AI Assistant)

-- Note: These tools did not create any database tables or stored procedures.
-- They only used existing product tables and made direct updates.
-- No database cleanup is required.

-- The following API endpoints have been removed:
-- - /api/admin/products/cleanup-names
-- - /api/admin/products/cleanup-default-titles
-- - /api/admin/ai/chat

-- The following components have been removed:
-- - ProductNameCleanup.tsx
-- - DefaultTitleCleanup.tsx
-- - AIAssistant.tsx

-- If you want to ensure no orphaned data exists, you can run these optional queries
-- to check for any products that might have been affected by the cleanup tools:

-- Check for products with default titles (optional - for information only)
-- SELECT id, name, title FROM products WHERE title LIKE '%Default Title%';

-- Check for products with cleanup-related metadata (optional - for information only)
-- SELECT id, name, metadata FROM products WHERE metadata::text LIKE '%cleanup%';

-- No action required - this migration serves as documentation only.
