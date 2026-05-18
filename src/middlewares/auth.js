const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  //Önce cookieden, sonra Authorization headerdan dene
  let token = req.cookies?.boxbox_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch(err){
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token süresi dolmuş' });
    }
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

module.exports = authenticate;