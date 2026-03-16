const express = require("express");
const Datastore = require("nedb");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");

const app = express();
const PORT = 3000;

/* ================= CORS ================= */

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5501');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(cors({
    origin: ["http://localhost:5501", "http://127.0.0.1:5501"],
    credentials: true
}));

app.use(express.json());

/* ================= SESSION ================= */

app.use(session({
    secret: "emi-manager-admin-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

console.log("🚀 EMI Manager Server Starting...");

/* ================= DATABASE ================= */

const usersDB = new Datastore({ filename: "users.db", autoload: true });
const emisDB = new Datastore({ filename: "emis.db", autoload: true });

/* ================= ADMIN LOGIN ================= */

app.post("/admin-login", (req, res) => {

    const { email, password } = req.body;

    if (email === "admin@emimanager.com" && password === "admin123") {

        req.session.isAdmin = true;
        req.session.adminUser = { email, role: "admin" };

        console.log("✅ Admin logged in");

        res.json({ success: true });

    } else {

        res.status(401).json({
            success: false,
            error: "Invalid admin credentials"
        });

    }

});

/* ================= CHECK ADMIN AUTH ================= */

app.get("/check-admin-auth", (req, res) => {

    if (req.session.isAdmin) {

        res.json({
            loggedIn: true,
            admin: req.session.adminUser
        });

    } else {

        res.json({ loggedIn: false });

    }

});

/* ================= ADMIN LOGOUT ================= */

app.get("/admin-logout", (req, res) => {

    req.session.destroy();
    res.clearCookie("connect.sid");

    res.json({ success: true });

});

/* ================= ADMIN STATS ================= */

app.get("/admin/stats", (req, res) => {

    if (!req.session.isAdmin)
        return res.status(403).json({ success: false });

    usersDB.count({}, (err, userCount) => {

        emisDB.count({}, (err, emiCount) => {

            res.json({
                success: true,
                stats: {
                    totalUsers: userCount,
                    totalEmis: emiCount
                }
            });

        });

    });

});

/* ================= ADMIN USERS ================= */

app.get("/admin/users", (req, res) => {

    if (!req.session.isAdmin)
        return res.status(403).json({ success: false });

    usersDB.find({}, (err, users) => {

        if (err)
            return res.status(500).json({ success: false });

        res.json({
            success: true,
            data: users
        });

    });

});

/* ================= ADMIN EMIs ================= */

app.get("/admin/emis", (req, res) => {

    if (!req.session.isAdmin)
        return res.status(403).json({ success: false });

    emisDB.find({}, (err, emis) => {

        usersDB.find({}, (err, users) => {

            const userMap = {};

            users.forEach(user => {
                userMap[user._id] = user.username || user.email;
            });

            const enrichedEmis = emis.map(emi => ({
                ...emi,
                username: userMap[emi.userId] || "Unknown"
            }));

            res.json({
                success: true,
                data: enrichedEmis
            });

        });

    });

});

/* ================= USER REGISTER ================= */

app.post("/register", (req, res) => {

    const { username, email, password } = req.body;

    usersDB.findOne({ email }, async (err, user) => {

        if (user)
            return res.json({
                success: false,
                error: "User already exists"
            });

        const hashedPassword = await bcrypt.hash(password, 10);

        usersDB.insert({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        }, (err) => {

            if (err)
                return res.json({
                    success: false,
                    error: "Registration failed"
                });

            res.json({ success: true });

        });

    });

});

/* ================= USER LOGIN ================= */

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    usersDB.findOne({ email }, async (err, user) => {

        if (!user)
            return res.json({
                success: false,
                error: "User not found"
            });

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword)
            return res.json({
                success: false,
                error: "Invalid password"
            });

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        res.json({ success: true });

    });

});

/* ================= CHECK USER AUTH ================= */

app.get("/check-auth", (req, res) => {

    res.json({
        loggedIn: !!req.session.user,
        user: req.session.user
    });

});

/* ================= USER LOGOUT ================= */

app.get("/logout", (req, res) => {

    req.session.destroy();

    res.json({ success: true });

});

/* ================= ADD EMI ================= */

app.post("/add-emi", (req, res) => {

    if (!req.session.user)
        return res.json({ success: false });

    const emiData = {

        userId: req.session.user.id,
        lender_name: req.body.lender_name,
        loan_amount: parseFloat(req.body.loan_amount),
        interest_rate: parseFloat(req.body.interest_rate),
        tenure_months: parseInt(req.body.tenure_months),
        start_date: req.body.start_date,
        due_date: parseInt(req.body.due_date),
        createdAt: new Date()

    };

    emisDB.insert(emiData, (err) => {

        if (err)
            return res.json({ success: false });

        res.json({ success: true });

    });

});

/* ================= GET USER EMIs ================= */

app.get("/get-emis", (req, res) => {

    if (!req.session.user)
        return res.json({ success: false });

    emisDB.find({ userId: req.session.user.id }, (err, emis) => {

        res.json({
            success: true,
            data: emis
        });

    });

});

/* ================= DELETE EMI ================= */

app.delete("/delete-emi/:id", (req, res) => {

    if (!req.session.user)
        return res.json({ success: false });

    emisDB.remove({
        _id: req.params.id,
        userId: req.session.user.id
    }, {}, (err, numRemoved) => {

        if (numRemoved === 0)
            return res.json({ success: false });

        res.json({ success: true });

    });

});

/* ================= CHATBOT ================= */

app.post("/chatbot", (req, res) => {

    res.json({
        reply: "EMI Assistant ready!"
    });

});

/* ================= SERVER START ================= */

app.listen(PORT, () => {

    console.log(`\n🚀 EMI Manager Server Running`);
    console.log(`🌐 http://localhost:${PORT}`);

    console.log(`\n👨‍💼 ADMIN LOGIN`);
    console.log(`Email: admin@emimanager.com`);
    console.log(`Password: admin123`);

    console.log(`\n📊 Admin Dashboard`);
    console.log(`http://localhost:5501/admin-login.html`);

});