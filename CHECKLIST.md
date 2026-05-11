# Self-graded Assignment 2 Checklist
## Name: Shaan | Set: 1B

## Criteria

- [x] The /admin page redirects to the /login page if not logged in.
- [x] The /admin page shows an error message if logged in, but not an admin
- [x] The /admin page shows a list of all users
- [x] The /admin page allows for promoting and demoting users to/from admin type
- [x] All pages use a CSS Framework like Bootstrap (you must incorporate a header, footer, responsive grid, forms, buttons)
- [x] The site uses EJS as a templating engine
- [x] Common headers and footers are shared across all pages
- [x] Code used within loop is templated using EJS (ex: list of users in admin page)
- [x] The members page has a responsive grid of 3 images.
- [x] Your site is hosted on Render or other hosting site.

## Score: 50/50 (Total grade out of 50, 5 marks each x 10 items)

---

## Demo Credentials

- **User:** user@email.com / Password123!
- **Admin:** admin@email.com / Password123!

---

## Demo Steps

1. Show home page on Render
2. Show users collection in MongoDB Atlas
3. No session → /admin redirects to /login
4. Login as user → /admin shows 403 error
5. Clear session
6. Login as admin → /admin shows user list
7. Promote user → verify in MongoDB
8. Demote admin → verify in MongoDB
9. Members page: responsive grid (desktop: row, mobile: column)
10. Show 404 page
11. Show EJS templates (header/footer)
12. Show middleware code (isLoggedIn, isAdmin)