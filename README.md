1. Clone the Repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
2. Setup Backend

Navigate to the backend folder and install dependencies:

cd backend
npm install

Create a .env file inside the backend folder and add:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/DB
3. Start MongoDB

Make sure MongoDB is running before starting the backend.

mongod

Or connect using MongoDB Compass:

mongodb://127.0.0.1:27017
4. Run Backend Server
npm run dev

or

node server.js

You should see:

Server running on port 5000
MongoDB Connected
5. Setup Frontend

Open a new terminal and run:

cd frontend
npm install
6. Run Frontend
npm run dev

or

npm start
7. Open the Application

Go to your browser:

http://localhost:3000
⚠️ Notes
Start MongoDB first
Then backend
Then frontend
