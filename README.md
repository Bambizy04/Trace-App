# Trace - Lost and Found Application

Trace is a robust Flask-based web application designed to help users report lost and found items and match them efficiently.

## Features
- **User Authentication**: Secure signup and login using JWT.
- **Item Management**: Report lost or found items with details and images.
- **Smart Matching**: Automated matching system to connect lost items with found ones.
- **Admin Dashboard**: Manage users and items.
- **Responsive UI**: Modern, premium design for seamless user experience.

## Tech Stack
- **Backend**: Flask, SQLAlchemy, JWT-Extended, Bcrypt.
- **Database**: SQLite (local) / PostgreSQL (production/Vercel).
- **Deployment**: Configured for Vercel.

## Setup Instructions

### Prerequisites
- Python 3.8+
- Virtual Environment (recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Bambizy04/Trace-App.git
   cd Trace-App
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your_secret_key
   JWT_SECRET_KEY=your_jwt_secret_key
   DATABASE_URL=sqlite:///trace_db.sqlite
   ```

5. Run the application:
   ```bash
   ./run.sh
   ```
   Or:
   ```bash
   flask run --port 8000
   ```

## VS Code Integration
The project includes a `.vscode/launch.json` for easy debugging. Simply press `F5` in VS Code to start the application with the debugger attached.

## License
MIT
