import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

export const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this IP, please wait a minute before trying again' },
  skip: () => process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'))
});
