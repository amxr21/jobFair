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
        // A validly-signed token whose company row no longer exists (deleted
        // account, stale token from a wiped dev DB) must not fall through as
        // an authenticated-but-anonymous request — req.user ending up `null`
        // here previously let the request past requireAuth and into route
        // handlers, where role checks like isCastoAccount(req) (req.user?.email)
        // just evaluate to false instead of the 401 this actually is. That
        // masqueraded as a 403 "not authorized" on CASTO-only writes (e.g.
        // event-ops booths) instead of the real "please sign in again".
        if (!company) {
            return res.status(401).json({ error: "Authorization token is invalid or missing" });
        }
        req.user = { _id: company.id, email: company.email };
        next();
    } catch (error) {
        res.status(401).json({ error: "Authorization token is invalid or missing" })
    }
}

module.exports = requireAuth