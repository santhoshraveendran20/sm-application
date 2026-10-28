# Commercial Decision Intelligence — Frontend

React 18 + Vite frontend for SRMTech Commercial Decision Intelligence. It follows the same folder layout as the Sytnova frontend.

## Run it

```bash
npm install
```

```bash
npm run dev
```

The app opens on http://localhost:3000.

```bash
npm run build
```

## Environment (.env)

| Key | Purpose |
| --- | --- |
| `VITE_CLIENT_ID` | Azure AD (Entra ID) application (client) ID |
| `VITE_AUTHORITY` | `https://login.microsoftonline.com/<tenant-id>` |
| `VITE_API_URL` | Backend base URL used by `src/api/api.jsx` |
| `VITE_REDIRECT_URI` | Optional. Defaults to the current origin |
| `VITE_POST_LOGOUT_REDIRECT_URI` | Optional. Defaults to the current origin |

## Microsoft SSO setup

1. In Azure Portal → App registrations → your app → Authentication, add a **Single-page application** platform.
2. Add every origin you run the app on as a redirect URI, for example `http://localhost:3000` and your deployed URL.
3. Make sure `VITE_CLIENT_ID` and `VITE_AUTHORITY` in `.env` point to that app registration and tenant.

Flow: **Sign in with Microsoft** → `loginRedirect` → Microsoft → back to `/` → `AppWrapper.jsx` reads the signed-in account, stores the session in Redux and opens `/dashboard`. If the app registration defines app roles, the first `roles` claim is shown as the user's role. Sign out calls `logoutRedirect` for SSO users.

## Username / password sign-in

`POST {VITE_API_URL}/auth/login` with `{ username, password, remember }`. The response must include `token` (or `access_token`) and a `user` object (`name` or `first_name`/`last_name`, `email`, `username`, `role`). Every API call made through `src/api/api.jsx` sends `Authorization: Bearer <token>`; a `401` signs the user out.

## Folder structure

```
src/
  api/api.jsx                     axios client + request helper
  config/authConfig.jsx           MSAL configuration and SSO helpers
  Components/
    hoc/PrivateRoutes.jsx         route guard
    redux/                        auth slice + store (persists the session)
    common/                       Modal, ConfirmModal, SelectField, PasswordField, PasswordStrength, helpers
    Pagination/                   PaginationComponent
    Pages/
      Login/                      sign-in page
      Layouts/                    shell with collapsible sidebar
      Sidebar/                    navigation (expanded, compact with flyouts, mobile drawer)
      Topbar/                     breadcrumb, theme toggle, notifications, profile menu
      Notifications/              notifications panel
      AdminSettings/              Admin settings header and tabs
      UserManagement/             users table, filters, add/edit, reset password, status and archive actions
      ComingSoon/                 placeholder for modules not built yet
      ErrorPage/                  route error screen
      root.css                    design tokens (light and dark)
  App.jsx  AppWrapper.jsx  main.jsx  router.jsx  Themecontext.jsx  index.css
```

User management currently runs on sample data from `UserManagement/mockData.js`, so every action works without a backend. Replace the state updates in `UserManagement.jsx` with `request(...)` calls when the users API is ready.
