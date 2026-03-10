# Manual Testing Checklist

Use this checklist before every release to verify critical flows manually.

---

## Authentication

- [ ] Register with valid email and password
- [ ] Register shows validation errors for invalid input
- [ ] Login with valid credentials redirects to dashboard
- [ ] Login with invalid credentials shows error message
- [ ] Login with demo credentials (`demo@genesis.ai` / `Demo1234!`) works
- [ ] "Forgot password" link works (if implemented)
- [ ] Logout clears session and redirects to home
- [ ] Protected pages redirect to login when unauthenticated
- [ ] Session persists across page refreshes

## Landing Page

- [ ] Hero section loads with animations
- [ ] CTA buttons navigate correctly
- [ ] Feature showcase section displays properly
- [ ] Footer links all work (Privacy, Terms, Cookies)
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] Navigation sign-in link works

## Dashboard

- [ ] Dashboard loads with project list or empty state
- [ ] Stats cards display correctly
- [ ] Quick action buttons work
- [ ] Recent projects section shows data or empty state
- [ ] Activity feed displays properly
- [ ] Navigation sidebar links all work

## Project Creation Wizard

- [ ] "New Project" navigates to wizard
- [ ] Step 1: Title and description can be entered
- [ ] Step 2: Genre selection works
- [ ] Step 3: Settings/configuration works
- [ ] Step 4: Review shows all entered data
- [ ] Wizard can be completed successfully
- [ ] Back navigation between steps works
- [ ] Validation prevents empty required fields

## Project Editor

- [ ] Editor loads for an existing project
- [ ] Script editor is functional
- [ ] Character panel loads
- [ ] Scene management works
- [ ] Settings panel accessible
- [ ] Auto-save indicator (if implemented)
- [ ] Preview/playback works

## Explore / Discover

- [ ] Explore page loads with movie grid
- [ ] Search filters work
- [ ] Genre filters work
- [ ] Movie cards display thumbnail, title, creator
- [ ] Clicking a movie card navigates to watch page
- [ ] Pagination or infinite scroll works

## Watch Page

- [ ] Video player loads
- [ ] Movie metadata displayed (title, description, creator)
- [ ] Like/bookmark interactions work
- [ ] Comments section loads
- [ ] Share functionality works
- [ ] Related movies displayed

## Profile

- [ ] Profile page loads with user data
- [ ] Avatar displays correctly
- [ ] Bio and stats show
- [ ] User's movies listed
- [ ] Edit profile works
- [ ] Settings accessible

## Credits & Billing

- [ ] Credits page loads
- [ ] Current balance displayed
- [ ] Purchase options shown
- [ ] Transaction history displayed

## Collaboration

- [ ] Team members panel loads
- [ ] Invite flow works
- [ ] Role permissions applied correctly

## Error Handling

- [ ] 404 page displays for invalid routes
- [ ] Network error shows retry option
- [ ] API errors display user-friendly messages
- [ ] Form validation shows inline errors
- [ ] Loading states display during data fetches

## Performance

- [ ] Pages load within 3 seconds
- [ ] No layout shift during load (CLS)
- [ ] Images lazy load properly
- [ ] Animations are smooth (60fps)
- [ ] No memory leaks (check DevTools)

## Accessibility

- [ ] Tab navigation works across all interactive elements
- [ ] Focus indicators visible
- [ ] Screen reader reads content correctly
- [ ] Color contrast meets WCAG AA
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Escape key closes modals

## Cross-Browser

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Responsive Design

- [ ] Mobile (375px) — all pages layout correctly
- [ ] Tablet (768px) — all pages layout correctly
- [ ] Desktop (1280px+) — all pages layout correctly
- [ ] Navigation collapses to mobile menu
- [ ] Touch interactions work on mobile
- [ ] No horizontal scroll on any viewport

## Security (Manual Checks)

- [ ] Cannot access dashboard without login
- [ ] Cannot access other users' projects
- [ ] XSS: pasting `<script>alert(1)</script>` in inputs is sanitized
- [ ] CSRF: cross-origin form submissions are blocked
- [ ] Source maps not exposed in production
- [ ] No sensitive data in client-side console logs
