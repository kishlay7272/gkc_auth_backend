const config = require('../../config.json');
const jwt = require('jsonwebtoken');
var dbConn_sql = require('./../../config/db_sql.config');
// const users = [{ id: 1, Email: 'kishlay0606@gmail.com', password: 'kishlay', firstName: 'Test', lastName: 'User' }];
module.exports = {
    authenticate
};
async function authenticate({ email, password }) {
    console.log(email,password);
    await dbConn_sql.query('SELECT * from `user` where email=? and password=?', [email,password],async function (err, rows) {
        if (err) {
          console.log("error: ", err);
          result(err, null);
        }
        else {
          console.log(rows);
        //   const user = users.find(u => u.Email === email && u.password === password);
        if(rows.length==0) throw 'Username or password is incorrect'
          if (!rows) throw 'Username or password is incorrect';
          // create a jwt token that is valid for 7 days
          const token =  await jwt.sign({ sub: rows[0].password }, config.secret,{ expiresIn: '1d' });
          console.log("token",token);
          await dbConn_sql.query('UPDATE user SET token=?  where (Email=? and password=?)', [token,email,password],async function (err, rows) {
            if (err) {
              console.log("error: ", err);
              result(err, null);
            }
            else {
              console.log(rows);
            }})
          return token;
        }
      });
    // const user = users.find(u => u.Email === email && u.password === password);
    // if (!user) throw 'Username or password is incorrect';
    // // create a jwt token that is valid for 7 days
    // const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '1d' });
    // return token;
}
