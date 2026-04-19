const test = require('node:test');
const assert = require('node:assert/strict');

const errorHandler = require('../middleware/errorHandler');

const createRes = () => {
  const res = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

test('errorHandler uses statusCode and message', () => {
  const err = { statusCode: 400, message: 'Bad' };
  const res = createRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Bad');
  assert.equal(res.body.success, false);
});

test('errorHandler handles mongoose ValidationError', () => {
  const err = {
    name: 'ValidationError',
    errors: {
      title: { message: 'Title required' },
      price: { message: 'Price invalid' },
    },
  };
  const res = createRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Title required/);
  assert.match(res.body.message, /Price invalid/);
});

test('errorHandler handles duplicate key errors', () => {
  const err = { code: 11000, keyValue: { email: 'a@b.com' } };
  const res = createRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Duplicate value/);
  assert.match(res.body.message, /email/);
});

test('errorHandler handles cast errors', () => {
  const err = { name: 'CastError', path: 'courseId', value: 'bad' };
  const res = createRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Invalid/);
});

test('errorHandler handles JWT errors', () => {
  const err = { name: 'JsonWebTokenError' };
  const res = createRes();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Invalid token.');
});
