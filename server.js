const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));

const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

const DB_FILE = "./keys.json";

// 📦 تحميل المفاتيح
function loadKeys() {
    try {
        if (!fs.existsSync(DB_FILE)) return [];
        const data = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(data || "[]");
    } catch (e) {
        return [];
    }
}

// 💾 حفظ المفاتيح
function saveKeys(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 🟢 لوحة التحكم
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
        key,
        expires: exp.toISOString()
    });

    saveKeys(keys);

    res.redirect("/?pass=" + ADMIN_PASS);
});

// 🔍 التحقق من المفتاح (JSON response)
app.get("/validate", (req, res) => {

    const key = req.query.key;

    const keys = loadKeys();

    const found = keys.find(k => k.key === key);

    // ❌ غير موجود
    if (!found) {
        return res.json({
            valid: false,
            reason: "invalid_key"
        });
    }

    // ❌ منتهي
    if (new Date() > new Date(found.expires)) {
        return res.json({
            valid: false,
            reason: "expired",
            expires: found.expires
        });
    }

    // ✅ صحيح
    return res.json({
        valid: true,
        reason: "ok",
        expires: found.expires,
        sig: "42e051828c47281e49f21a0d674bbcb014f645118c8961e8bb965053bcea1132"
    });
});

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});