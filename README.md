🎨 Movie Explorer SPA

Movie Explorer is a responsive Single Page Application (SPA) that lets users browse, search, filter,
and sort movies and TV shows. It supports a local JSON server or a fallback to the TVMaze API. Users
can also like shows, view details in a modal, and toggle between light/dark themes.

🍌 Features

- Responsive grid layout (4 → 3 → 2 → 1 per row based on screen size)
- Search shows by name or summary
- Filter by genres
- Sort by rating or name
- Like button with local persistence (JSON server)
- Modal to view detailed show info
- Dark/Light theme toggle
- Skeleton loading effect and fade-in animation for smoother UX

🞥 Demo

⚙️ Installation & Setup

1. Clone the repository

bash git clone https://github.com/your-username/movie-explorer.git cd movie-explorer

2. Install JSON Server (optional, for local API)

bash npm install -g json-server

3. Start JSON Server

bash json-server --watch db.json --port 3000

> `db.json` contains the initial list of shows with `id`, `name`, `genres`, `rating`, `image`,
> `likes`, and `summary`.

4. Open `index.html` in your browser No additional server needed; SPA works locally.

📓 Usage

- Search: Start typing in the search input to filter shows in real-time.
- Filter by Genre: Select a genre to narrow results.
- Sort Shows: Use the dropdown to sort by rating or name.
- Like Shows: Click ❤️ to increment likes (saved locally if JSON server is running).
- View Details: Click a card to open a modal with full show details.
- Dark/Light Mode: Click the toggle button in the top bar.

🛠️ Tech Stack

- HTML5 / CSS3
- Vanilla JavaScript (ES6+)
- JSON Server (local API)
- TVMaze API (fallback)
- Responsive design with CSS Grid and media queries

📚 Project Structure

movie-explorer/ │ ├─ index.html Main HTML file ├─ style.css Styles (responsive, dark/light theme,
skeleton, animations) ├─ script.js SPA logic (fetching, filtering, sorting, likes, modal) ├─ db.json
Local JSON server data └─ README.md Project documentation

💡 Notes

- Fallback API: If JSON server is not running, the app fetches shows from TVMaze API automatically.
- Skeleton Loading: Shows placeholders while data is loading.
- Accessibility: Basic ARIA attributes for modals and controls included.

📜 License

This project is MIT Licensed – feel free to use and modify for your learning projects.
