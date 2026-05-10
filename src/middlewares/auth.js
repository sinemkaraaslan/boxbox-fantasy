const jwt = require('jsonwebtoken');

function authenticate(req, res, next){
    const header = req.headers.authorization //headerdan tokenı al

    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({ error: 'Token Gerekli' });      
    }
    const token = header.split(' ')[1]; // Bearer almıyorsun
    try {
        //Token'ı doğrula
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        //req user'a kullanıcı id'sini koy 
        req.user = { id: payload.sub }; 
        next();
    } catch (err){
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({error: 'Token süresi dolmuş' });
        }
        return res.status(401).json({ error: 'Geçersiz token' });
    }
}
module.exports = authenticate;