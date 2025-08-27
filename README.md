# Food Corpus (Merged UI + API)

This project combines the Food Corpus UI with the API logic/endpoints from the Guffran project.

- UI: Based on `food-corpus-app` (HTML/CSS)
- API: Uses endpoints and auth flow from `guffran-main` (login/register, auth/me, contributions, chunked uploads)

## Structure

- index.html
- pages/
  - login.html
  - register.html
  - dashboard.html
  - upload.html
- styles/
  - main.css
- js/
  - merged-auth.js
  - merged-dashboard.js
  - merged-upload.js

## Run

Open `index.html` in a browser. This is a static client app that talks to `https://api.corpus.swecha.org/api/v1`.

If loading from file:// is restricted by your browser for some features, use a simple local server.

## Notes

- Auth token is stored as `authToken` (and mirrored to `token` for compatibility).
- User ID is stored as `userId` after calling `/auth/me`.
- Uploads use chunked API for audio/video and direct upload/finalization for other types.
