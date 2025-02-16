const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const meetingsRoute = require('./routes/meetings');

const app = express();
const port = process.env.PORT || 5000;

connectDB();

//Middleware
app.use(cors({
  origin: 'https://summaree.vercel.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // for cookies (optional)
}));
app.use(express.json());

//Routes
app.use('/api/meetings', meetingsRoute);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});