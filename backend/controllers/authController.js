const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

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

module.exports = {
    register,
    login
};