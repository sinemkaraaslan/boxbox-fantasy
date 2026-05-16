const { validationResult } = require('express-validator');

//express-validator chain'lerinden sonra çalışır.
//Hata varsa 400 döner, yoksa devam ettirir.
 
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

module.exports = validate;