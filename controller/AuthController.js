import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/security_config.js";
import User from "../models/User.js";
import Boom from "boom";

export class AuthController {

  async registerNewUser(req, res) {
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    const newUser = await User.create(
      {
        name: req.body.name,
        password: hashedPassword,
      }
    );
    let token = jwt.sign({ id: newUser._id }, config.secret, {
      expiresIn: 86400, // токен на 24 часа
    });
    return res.status(200).send({ auth: true, token: token});
  }

  async currentUserInfo(req, res) {
    console.log(req.method);
    await User.findById(req.userId, { password: 0 }, function (err, user) {
      if (err) return res.status(500).send("Ошибка при поиске пользователя.");
      if (!user) return res.status(404).send("Пользователь не найден.");
      res.status(200).send(user);
    });
  }

  verifyToken(req, res, next) {
    var token = req.headers["x-access-token"];
    if (!token)
      return res.status(403).send({
        auth: false,
        message: "нужен jwt токен через заголовок x-assecc-token",
      });

    jwt.verify(token, config.secret, function (err, decoded) {
      if (err)
        return res
          .status(401)
          .send({ auth: false, message: "Аутонтификация токена не прошла." });
      req.userId = decoded.id;
      next();
    });
  }

  async signIn(req, res) {
    try {
      let user = await User.findOne({ name: req.body.name });
      if (!user) return res.status(404).send("Пользователя не существует.");
      let passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid)
        return res.status(401).send({ auth: false, token: null });
      let token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 86400,
      });
      return res.status(200).send({ auth: true, token: token });
    } catch (error) {
      return Boom.boomify(error);
    }
  }


  async registerChecks(req, res) {
 
    if (typeof req.body.codeword == 'undefined') {
      return res.status(403).send({
        message:
          "Кодовое слово через codeword в body через x-www-formunlencoded",
      });
      
    }
    
    let result = await bcrypt.compare(req.body.codeword, config.codeword);
    if (!result) return res.status(500).send({ message: "Неправильный хеш" });;
     
    let user  = await User.findOne({
        name: req.body.name
    });

    if (user) {
      return res.status(400).send({ message: "Уже есть такой пользователь" });
    } else return;

  }

}
