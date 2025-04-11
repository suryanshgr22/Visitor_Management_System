require('dotenv').config({ path: './.env' });
const express = require('express');
const connectDB = require('./db/index.js'); 
const app = express();

// Connect to MongoDB
console.log('MONGO_URI:', process.env.MONGO_URI);
connectDB();

app.use(express.json());

// Routes
app.use('/api/admin', require('./routes/admin.js'));
app.use('/api/gate', require('./routes/gate.js'));
app.use('/api/visitor', require('./routes/visitor.js'));
app.use('/api/host', require('./routes/host.js'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

