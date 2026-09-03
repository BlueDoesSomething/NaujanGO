# TODO: Separate Logged-Out and Logged-In User Experiences

## Tasks
- [x] Wrap the App with AuthProvider in main.jsx
- [x] Update App.jsx to use useAuth hook instead of hardcoded isLoggedIn
- [x] Update Navbar.jsx to show different navigation based on authentication status
- [x] Implement route protection for sensitive pages (booking, checkout)
- [x] Update Login.jsx to use AuthContext for authentication
- [x] Update Register.jsx to use AuthContext for registration

## Followup Steps
- [ ] Test login and registration functionality
- [ ] Verify logged-out users see guest home and limited navigation
- [ ] Verify logged-in users see logged-in home and full navigation
- [ ] Test protected routes redirect to login when not authenticated
- [ ] Run frontend and backend servers for end-to-end testing
