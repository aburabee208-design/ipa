const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));

const ADMIN_PASS = "1234"; // 🔐 غيّرها

const DB_FILE = "./keys.json";

// تحميل المفاتيح
function loadKeys() {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// حفظ المفاتيح
function saveKeys(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 🟢 الصفحة الرئيسية (محميه)
app.get("/", (req, res) => {

    if (req.query.pass !== ADMIN_PASS) {
        return res.send("❌ Access Denied");
    }

    const keys = loadKeys();

    let html = `
    <h2>🔐 Admin Panel</h2>

    <form method="POST" action="/create?pass=${ADMIN_PASS}">
        <input name="key" placeholder="Key" required />
        <input name="days" placeholder="Days" required />
        <button>Create</button>
    </form>

    <hr>
    <h3>Keys:</h3>
    `;

    keys.forEach(k => {
        html += `
        <div>
            <b>${k.key}</b><br>
            Expires: ${k.expires}
        </div>
        <hr>`;
    });

    res.send(html);
});

// ➕ إنشاء مفتاح
app.post("/create", (req, res) => {

    if (req.query.pass !== ADMIN_PASS) {
        return res.send("❌ No Access");
    }

    const { key, days } = req.body;

    const keys = loadKeys();

    const exp = new Date();
    exp.setDate(exp.getDate() + parseInt(days));

    keys.push({
        key: key,
        expires: exp.toISOString()
    });

    saveKeys(keys);

    res.redirect("/?pass=" + ADMIN_PASS);
});

// 🔍 التحقق من المفتاح (API)
app.get("/validate", (req, res) => {

    const key = req.query.key;

    const keys = loadKeys();

    const found = keys.find(k => k.key === key);

    if (!found) {
        return res.sendStatus(403);
    }

    if (new Date() > new Date(found.expires)) {
        return res.sendStatus(403);
    }

    return res.sendStatus(200);
});

// 🚀 تشغيل السيرفر
app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});