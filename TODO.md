# TODO: Fix OutfitDetail 404 Error (/api/gallery/52) - Step 1 Complete

- [x] Step 1: Add `/api/gallery/<int:id>` route alias in backend/routes/gallery.py to match frontend api.js
- [ ] Step 2: Verify DB has outfit data (run `cd backend && python migrate_json_to_sql.py` if empty)
- [ ] Step 3: Ensure backend server running on port 5001 (`cd backend && python app.py`)
- [ ] Step 4: Test frontend http://localhost:5173/outfit/52 - should load
- [ ] Step 5: Mark complete
