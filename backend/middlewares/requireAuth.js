const jwt = require("jsonwebtoken")
const prisma = require("../config/prisma")
const dotenv = require("dotenv");
dotenv.config();

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    // A missing token is not an anonymous pass — every route mounted after
    // requireAuth is protected (applicant PII, company management, event ops).
    // The public routes are all registered BEFORE requireAuth in the router,
    // so they never reach here. (A malformed token is rejected below.)
    if (!authorization) {
        return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authorization.split(" ")[1];
    try {
        const { _id } = jwt.verify(token, process.env.TOKEN_SIGN);
        const company = await prisma.company.findUnique({ where: { id: _id }, select: { id: true, email: true } });
        req.user = company ? { _id: company.id, email: company.email } : null;
        next();
    } catch (error) {
        res.status(401).json({ error: "Authorization token is invalid or missing" })
    }
}

module.exports = requireAuth