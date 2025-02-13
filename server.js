const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
// Import Routes
const googleAPIRoutes = require("./routes/googleAPI");
const uploadRoutes = require("./routes/upload");
const processRoutes = require("./routes/process");
const emailRoutes = require("./routes/emails");


dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data


// Use Routes
app.use("/api/meetings", googleAPIRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/process", processRoutes);



// Root route
app.get("/", (req, res) => {
  res.send("Meeting Summarizer Backend is Running 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
