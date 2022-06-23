const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errors, celebrate, Joi } = require('celebrate');
const { UserRouter } = require('./routes/users');
const { CardsRouter } = require('./routes/cards');
const { createUser, login } = require('./controllers/users');
const { isAuthorised } = require('./middlewares/isAuthorised');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const NotFoundError = require('./errors/NotFoundError');

const { PORT = 3000 } = process.env;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
});

const app = express();
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/mestodb');
app.use(cors());
app.use(helmet());
app.use(limiter);
app.use(requestLogger);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

app.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
      name: Joi.string().min(2).max(30),
      about: Joi.string().min(2).max(30),
      avatar: Joi.string().pattern(
        /(http|www|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:~+#-]*[\w@?^=%&~+#-])/,
      ),
    }),
  }),
  createUser,
);

app.use(isAuthorised);
app.use('/', UserRouter);
app.use('/', CardsRouter);

app.use('*', () => {
  throw new NotFoundError('Страница не найдена!');
});

app.use(errorLogger);

app.use(errors());

app.use((err, req, res, next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).send({ message: err.message || 'Ошибка на сервере' });
  }
  res.status(500).send({ message: 'Ошибка на сервере' });
  return next();
});

app.listen(PORT);
