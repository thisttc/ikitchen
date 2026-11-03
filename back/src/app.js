const express = require("express");
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const blogRoute = require('./routes/blog');
const uploadRouter = require('./routes/upload');
const pdfRouter = require('./routes/pdf');
const cleanRouter = require('./routes/cleanup');
const statisticsRouter = require('./routes/statistics');
const adminRouter = require('./routes/admin');
const userRoutes = require('./routes/user');
const themeRoutes = require('./routes/theme');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');
const { cleanupUnusedFile } = require('./controllers/cleanController');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

const corsOptions = {
    origin: 'http://localhost:5173', 
    optionsSuccessStatus: 200
};

app.use('/user', signupRoute);
app.use('/auth', loginRoute);
app.use('/blog', blogRoute);
app.use('/upload', uploadRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/pdf', pdfRouter);
app.use('/pdfs', express.static(path.join(__dirname, '../pdf')));
app.use('/clean', cleanRouter);
app.use('/statistics', statisticsRouter);
app.use('/admin', adminRouter);
app.use('/staff', userRoutes);
app.use('/theme', themeRoutes);

cron.schedule('0 1 * * *', async () => {
    console.log('Running images and pdfs cleanup...');
    try {
        const req = {};
        const res = {
            status: () => ({ json: (data) => console.log('cleaning result:', data) })
        };
        await cleanupUnusedFile(req, res);
    } catch (err) {
        console.error('Cleaning error:', err);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
})