
```
gameon-v1
├─ app
│  ├─ admin
│  │  ├─ dashboard
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ api
│  │  └─ auth
│  │     ├─ me
│  │     │  └─ route.ts
│  │     ├─ signup
│  │     │  └─ route.ts
│  │     └─ [...nextauth]
│  │        └─ route.ts
│  ├─ dashboard
│  │  ├─ ai-coach
│  │  │  └─ page.tsx
│  │  ├─ hosted
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ loading.tsx
│  │  ├─ notifications
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ profile
│  │  │  └─ page.tsx
│  │  └─ upcoming
│  │     └─ page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ login
│  │  └─ page.tsx
│  ├─ page.tsx
│  └─ signup
│     └─ page.tsx
├─ BACKEND_INTEGRATION_BLUEPRINT.md
├─ components
│  ├─ admin
│  │  ├─ admin-login-form.tsx
│  │  ├─ admin-sidebar-provider.tsx
│  │  ├─ admin-sidebar.tsx
│  │  ├─ report-details-modal.tsx
│  │  └─ reports-table.tsx
│  ├─ auth
│  │  ├─ login-form.tsx
│  │  ├─ signup-form.tsx
│  │  └─ stats-cards.tsx
│  ├─ dashboard
│  │  ├─ create-game-modal.tsx
│  │  ├─ game-card.tsx
│  │  ├─ game-details-modal.tsx
│  │  ├─ game-grid.tsx
│  │  ├─ hosted-game-management-modal.tsx
│  │  ├─ public-user-profile-modal.tsx
│  │  ├─ report-modal.tsx
│  │  ├─ search-bar.tsx
│  │  ├─ sport-filters.tsx
│  │  ├─ upcoming-game-details-modal.tsx
│  │  └─ user-profile-modal.tsx
│  ├─ layout
│  │  └─ app-sidebar.tsx
│  ├─ theme-provider.tsx
│  └─ ui
│     ├─ accordion.tsx
│     ├─ alert-dialog.tsx
│     ├─ alert.tsx
│     ├─ aspect-ratio.tsx
│     ├─ avatar.tsx
│     ├─ badge.tsx
│     ├─ breadcrumb.tsx
│     ├─ button-group.tsx
│     ├─ button.tsx
│     ├─ calendar.tsx
│     ├─ card.tsx
│     ├─ carousel.tsx
│     ├─ chart.tsx
│     ├─ checkbox.tsx
│     ├─ collapsible.tsx
│     ├─ command.tsx
│     ├─ context-menu.tsx
│     ├─ dialog.tsx
│     ├─ drawer.tsx
│     ├─ dropdown-menu.tsx
│     ├─ empty.tsx
│     ├─ field.tsx
│     ├─ form.tsx
│     ├─ hover-card.tsx
│     ├─ input-group.tsx
│     ├─ input-otp.tsx
│     ├─ input.tsx
│     ├─ item.tsx
│     ├─ kbd.tsx
│     ├─ label.tsx
│     ├─ logo.tsx
│     ├─ menubar.tsx
│     ├─ navigation-menu.tsx
│     ├─ pagination.tsx
│     ├─ popover.tsx
│     ├─ progress.tsx
│     ├─ radio-group.tsx
│     ├─ resizable.tsx
│     ├─ scroll-area.tsx
│     ├─ select.tsx
│     ├─ separator.tsx
│     ├─ sheet.tsx
│     ├─ sidebar.tsx
│     ├─ skeleton.tsx
│     ├─ slider.tsx
│     ├─ sonner.tsx
│     ├─ spinner.tsx
│     ├─ switch.tsx
│     ├─ table.tsx
│     ├─ tabs.tsx
│     ├─ textarea.tsx
│     ├─ toast.tsx
│     ├─ toaster.tsx
│     ├─ toggle-group.tsx
│     ├─ toggle.tsx
│     ├─ tooltip.tsx
│     ├─ use-mobile.tsx
│     └─ use-toast.ts
├─ components.json
├─ controllers
│  ├─ adminController.ts
│  └─ gameController.ts
├─ hooks
│  ├─ use-mobile.tsx
│  └─ use-toast.ts
├─ lib
│  ├─ auth.ts
│  ├─ db
│  │  ├─ models
│  │  │  ├─ data
│  │  │  │  ├─ mockGames.ts
│  │  │  │  ├─ mockReports.ts
│  │  │  │  └─ mockUsers.ts
│  │  │  ├─ Game.ts
│  │  │  ├─ Report.ts
│  │  │  ├─ types
│  │  │  │  ├─ admin.ts
│  │  │  │  ├─ game.ts
│  │  │  │  └─ next-auth.d.ts
│  │  │  └─ User.ts
│  │  ├─ mongodb.ts
│  │  └─ utils
│  │     └─ transformGame.ts
│  ├─ db.ts
│  ├─ jwt.ts
│  └─ utils.ts
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ pnpm-lock.yaml
├─ postcss.config.js
├─ postcss.config.mjs
├─ public
│  ├─ apple-icon.png
│  ├─ icon-dark-32x32.png
│  ├─ icon-light-32x32.png
│  ├─ icon.svg
│  ├─ images
│  │  ├─ game-detail-bg.png
│  │  ├─ homepage-bg.png
│  │  ├─ hosted-game-management.png
│  │  ├─ login-bg.png
│  │  ├─ report-bg.png
│  │  ├─ signup-page.png
│  │  ├─ upcoming-game-detail.png
│  │  └─ upcoming-games-bg.png
│  ├─ placeholder-logo.png
│  ├─ placeholder-logo.svg
│  ├─ placeholder-user.jpg
│  ├─ placeholder.jpg
│  └─ placeholder.svg
├─ styles
│  └─ globals.css
├─ tailwind.config.js
├─ tsconfig.json
└─ views
   ├─ components
   │  ├─ auth
   │  │  ├─ login-form.tsx
   │  │  ├─ signup-form.tsx
   │  │  └─ stats-cards.tsx
   │  ├─ dashboard
   │  │  ├─ game-card.tsx
   │  │  ├─ game-grid.tsx
   │  │  ├─ public-user-profile-modal.tsx
   │  │  ├─ search-bar.tsx
   │  │  └─ sport-filters.tsx
   │  └─ ui
   │     └─ logo.tsx
   └─ pages
      └─ login-page.tsx

```