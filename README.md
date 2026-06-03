# Retro Blog

A simple 2-column blog with a 1980s/90s DOS-based aesthetic. Features ASCII borders, limited color palette, and monospace fonts.

## Features

- **Frontend**:
  - 2-column layout (Posts & Sidebar).
  - Sidebar with Search, Tag Cloud, Categories, and Archives.
  - Simple navigation menu for static pages.
  - Markdown support for posts (including code blocks and images).
  - Comments section for each post.
- **Admin Section (/admin)**:
  - Authentication-protected dashboard with advanced analytics.
  - CRUD for Posts, Categories, Tags, Static Pages, and Drafts.
  - Draft autosave and saved drafts for posts and pages.
  - Image upload support for posts.
  - Comment moderation (Approve/Deny/Delete).
  - Theme color customization and global settings.
  - **NEW: Dashboard Analytics**:
    - Geo map visualization of visitor locations
    - Top 10 popular pages with unique view counts
    - Analytics filters by time period (Day, Week, Month, Year)
    - Visitor statistics (Total Visitors & Page Views)
  - **NEW: Database Backup & Restore**:
    - Create backups of the database on demand
    - View and manage all available backups
    - Restore from any backup with automatic current DB backup
  - **NEW: Advanced CSS Customization**:
    - Customize menu bar colors independently
    - Customize blog post colors and styling
    - Customize footer appearance
    - Customize sidebar colors and styling
    - Customize admin section colors and buttons
- Blog width adjustment (e.g., 1200px, 100%, etc.).
- Tag management and inline tag creation in posts.
- RSS feed available at `/rss/feed` and linked in the site footer.
- Timezone-aware date formatting with remote time sync fallback.
- **Visitor Tracking**:
  - Automatic visitor geo-location tracking using GeoIP
  - Page view analytics for posts and pages
  - Unique visitor counting per content item
- **Styling**: CSS with customizable color schemes for all UI sections
- **Content**: Markdown-it
- **Other**: Multer (uploads), Bcryptjs (auth), Geoip-lite (geo-blocking & geo-tracking)

## Installation Guide

### Prerequisites
- Node.js installed (v14 or higher recommended)
- NPM (comes with Node.js)

### Steps

1. **Clone the repository** (if applicable) or copy the files to your project directory.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory if you want to override defaults:
   ```env
   PORT=3000
   SESSION_SECRET=your_secret_here
   ADMIN_USER=admin
   ADMIN_PASS=password123
   ```
   If you do not create a `.env` file, the app still starts with defaults: `ADMIN_USER=admin` and `ADMIN_PASS=password123`.

4. **Initialize Database**:
   The SQLite database and an initial admin user will be automatically created when you first start the server.

5. **Start the server**:
   ```bash
   npm start
   ```

6. **Access the blog**:
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin` (Login with the credentials set in your `.env` file)

## Usage Tips
- **Drafts**: Use the post/page editor to save drafts and reload them later from the Admin Drafts page. Drafts also autosave periodically while you write.
- **RSS Feed**: The site footer includes an RSS link at `/rss/feed` so external readers can subscribe to new posts.
- **Images**: When creating or editing a post, you can upload an image. It will be automatically prepended to the content in Markdown format.
- **Code Blocks**: Use triple backticks (\`\`\`) in the post editor to create DOS-style code blocks.
- **Geo-blocking**: Country codes can be added to the `blocked_ips` table via the Admin Settings to block entire regions.

## New Features

### Dashboard Analytics
The admin dashboard now features comprehensive visitor and content analytics:
- **Visitor Geo Map**: Visual representation of where your visitors are coming from
- **Visitor Statistics**: Total unique visitors and page views (last 7 days)
- **Top 10 Pages**: View your most popular posts and pages with unique view counts
- **Time Period Filters**: See analytics for the last day, week, month, or year
- **Real-time Updates**: Analytics are updated in real-time as visitors browse your site

### Database Backup & Restore
Never lose your blog data:
- **Create Backups**: One-click backup creation from the dashboard
- **Automatic Versioning**: Each backup is timestamped for easy identification
- **Backup Management**: View, restore, or delete backups from a simple interface
- **Safety**: Current database is automatically backed up when restoring a previous backup
- **Backups Directory**: All backups are stored in a dedicated `backups/` directory

### Advanced CSS Customization
Fine-grained control over your blog's appearance:
- **Global Colors**: Main background, text, border, and highlight colors
- **Menu Bar**: Customize menu appearance, hover effects, and colors independently
- **Blog Posts**: Set colors for post titles, text, links, and metadata
- **Footer**: Customize footer styling and link colors
- **Sidebar**: Adjust sidebar background, text, titles, and links
- **Admin Section**: Customize admin panel colors, buttons, and UI elements

All color settings are managed through the Admin Settings page and are applied instantly without restarting the server.

## Database Schema

The application includes the following main tables:
- **users**: Administrator accounts
- **posts**: Blog posts with categories
- **pages**: Static pages (About, Contact, etc.)
- **comments**: Post comments (moderated)
- **categories**: Post categories
- **tags**: Post tags
- **drafts**: Saved drafts for posts and pages
- **blocked_ips**: Blocked IP addresses and countries
- **settings**: Site configuration and theme colors
- **visitors**: Visitor geo-location tracking
- **page_views**: Content view analytics per IP

## File Structure

```
├── index.js                 # Main application entry point
├── package.json             # Dependencies and scripts
├── public/
│   ├── css/
│   │   └── style.css       # Main stylesheet with CSS variables
│   └── uploads/            # User-uploaded images
├── lib/
│   ├── db.js              # Database initialization
│   ├── analytics.js       # Analytics functions (NEW)
│   ├── backup.js          # Backup/restore functionality (NEW)
│   ├── blocker.js         # IP blocking middleware
│   ├── data.js            # Common data functions
│   └── time.js            # Timezone handling
├── routes/
│   ├── admin.js           # Admin dashboard & backup routes
│   ├── posts.js           # Post CRUD operations
│   ├── pages.js           # Page CRUD operations
│   ├── comments.js        # Comment moderation
│   ├── settings.js        # Settings management
│   ├── drafts.js          # Draft management
│   ├── taxonomy.js        # Categories and tags
│   ├── frontend.js        # Frontend routes with tracking
│   └── rss.js             # RSS feed generation
├── views/
│   ├── index.ejs          # Homepage
│   ├── post.ejs           # Single post view
│   ├── page.ejs           # Single page view
│   ├── admin/
│   │   ├── index.ejs      # Admin dashboard with analytics
│   │   ├── login.ejs      # Admin login
│   │   ├── settings.ejs   # Settings page
│   │   ├── posts/         # Post management views
│   │   ├── pages/         # Page management views
│   │   └── ...
│   └── partials/
│       ├── header.ejs     # Page header
│       ├── footer.ejs     # Page footer
│       └── sidebar.ejs    # Sidebar
└── backups/               # Database backups directory (NEW)
```

## API Endpoints

### Public Endpoints
- `GET /` - Homepage with latest posts
- `GET /post/:slug` - View a specific post
- `GET /page/:slug` - View a static page
- `GET /category/:slug` - Posts in a category
- `GET /tag/:slug` - Posts with a specific tag
- `GET /search?q=query` - Search posts
- `GET /archive/:year/:month` - Posts from an archive period
- `POST /post/:id/comment` - Add a comment to a post
- `GET /rss/feed` - RSS feed of latest posts

### Admin Endpoints
- `GET /admin` - Dashboard with analytics (requires authentication)
- `POST /admin/backup` - Create a database backup
- `GET /admin/backups` - List available backups
- `POST /admin/backups/delete/:filename` - Delete a backup
- `POST /admin/backups/restore/:filename` - Restore from a backup
- `GET /admin/login` - Admin login page
- `POST /admin/login` - Submit login credentials
- `GET /admin/logout` - Logout
- `/admin/posts` - Post management
- `/admin/pages` - Page management
- `/admin/comments` - Comment moderation
- `/admin/settings` - Theme and settings management
- `/admin/categories` - Category management
- `/admin/tags` - Tag management
- `/admin/drafts` - Draft management
