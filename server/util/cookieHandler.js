const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "3Lev6On9Ke1";

const generateToken = () => {
  const uniqueId = uuidv4();
  return jwt.sign({ token: uniqueId }, JWT_SECRET);
};

const verifyToken = async (token) => {
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateToken, verifyToken };
