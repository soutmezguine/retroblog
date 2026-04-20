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
  - Authentication-protected dashboard.
  - CRUD for Posts, Categories, Tags, and Static Pages.
  - Image upload support for posts.
  - Comment moderation (Approve/Deny/Delete).
  - Theme color customization.
  - IP and Geo-blocking for spam prevention.

## Tech Stack

- **Server**: Node.js, Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **Templates**: EJS
- **Styling**: CSS (DOS aesthetic)
- **Content**: Markdown-it
- **Other**: Multer (uploads), Bcryptjs (auth), Geoip-lite (geo-blocking)

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
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   SESSION_SECRET=your_secret_here
   ADMIN_USER=admin
   ADMIN_PASS=password123
   ```

4. **Initialize Database**:
   The database and an initial admin user will be automatically created when you first start the server.

5. **Start the server**:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   node index.js
   ```

6. **Access the blog**:
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin` (Login with the credentials set in your `.env` file)

## Usage Tips

- **Images**: When creating or editing a post, you can upload an image. It will be automatically prepended to the content in Markdown format.
- **Code Blocks**: Use triple backticks (\`\`\`) in the post editor to create DOS-style code blocks.
- **Geo-blocking**: Country codes can be added to the `blocked_ips` table via the Admin Settings to block entire regions.
