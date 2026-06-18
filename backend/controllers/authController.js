const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

async function me(req, res) {
  try {
    const user = await authService.findUserById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user.id, email: user.email, created_at: user.created_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await authService.findUserById(req.userId);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await authService.updatePassword(req.userId, hashed);
    res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update password" });
  }
}

async function register(req, res) {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required"
            });
        }

        const user = await authService.createUser(email, password);

        res.json(user);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Registration failed"
        });

    }
}

async function login(req, res) {

    try {

        const { email, password } = req.body;

        const user = await authService.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            token
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });

    }
}

module.exports = { register, login, me, changePassword };