const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const meetingsRoute = require('./routes/meetings');


const app = express();
const port = process.env.PORT || 5000;

connectDB();

// Middleware

<<<<<<< HEAD
<<<<<<< HEAD
app.use(cors(*));
=======
app.use(cors());
>>>>>>> ad3624d (restructured backend)
=======
app.use(cors());
=======
app.use(cors(*));
>>>>>>> af802925efd0cc93033df0ba451fdd1d2ff7a025
>>>>>>> 780dbca (new commit)
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Welcome to summaree');
});

// Routes
app.use('/api/meetings', meetingsRoute);

// Error handler middleware (example)
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});