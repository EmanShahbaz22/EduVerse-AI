# EduVerse AI Frontend

Angular 19 frontend for EduVerse-AI.

## Run
```bash
npm install
npm start
```

## Build
```bash
npm run build
```

Production font inlining is disabled to keep CI/offline builds stable in restricted-network environments.

## API Contract Notes
1. Auth is cookie-based (`withCredentials`) and no local bearer token is required.
2. Quiz submission payload now sends only:
   - `quizId`
   - `courseId`
   - `answers`
3. Student enrollment identity is server-derived; client-provided `studentId`/`tenantId` are ignored for student role.
4. Payment checkout only requires `courseId`; `tenantId` is optional and ignored for student identity enforcement.

## Static Data Audit
See [docs/STATIC_DATA_AUDIT.md](docs/STATIC_DATA_AUDIT.md).
