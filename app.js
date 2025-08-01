const express=require('express')
const bodyparser=require('body-parser')
const fs=require('fs')
const path=require('path')
const morgan = require("morgan");
const cors=require('cors')
const helmet = require("helmet");
const app=express()
const dotenv = require("dotenv");
dotenv.config();
const sequelize=require('./models/index')
const TeamUpload=require('./models/TeamUpload')
const User=require('./models/User')
const Mentor=require('./models/Mentor')
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  })
);



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


// Routes
app.use('/templates', express.static(path.join(__dirname, 'public/templates')));
app.use('/api',userRoutes)
app.use('/api/auth', authRoutes);


const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {flags:'a'}
);
app.use(morgan("combined", { stream: accessLogStream }));


TeamUpload.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
TeamUpload.belongsTo(Mentor, { foreignKey: 'mentor_id', onDelete: 'SET NULL' });

User.hasMany(TeamUpload, { foreignKey: 'user_id' });
Mentor.hasMany(TeamUpload, { foreignKey: 'mentor_id' });

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('Connection error:', err));

sequelize.sync().then(() => {
  app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
});

