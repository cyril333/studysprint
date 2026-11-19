// ============================================================
// StudySprint - Authentication Middleware
// ============================================================
const jwt = require('jsonwebtoken');

// ── Verify JWT Token ────────────────────────────────────────
// Ensures the request has a valid authentication token.
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// ── Authorize by Role ───────────────────────────────────────
// Factory function: returns middleware that checks if the user
// has one of the allowed roles.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
