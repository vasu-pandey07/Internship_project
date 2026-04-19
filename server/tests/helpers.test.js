const test = require('node:test');
const assert = require('node:assert/strict');

const { asyncHandler, ApiError } = require('../utils/helpers');

test('ApiError sets message and statusCode', () => {
  const err = new ApiError('Oops', 418);
  assert.equal(err.message, 'Oops');
  assert.equal(err.statusCode, 418);
});

test('asyncHandler forwards errors to next()', async () => {
  const req = {};
  const res = {};
  const expected = new Error('boom');

  let captured;
  const next = (err) => { captured = err; };

  const handler = asyncHandler(async () => {
    throw expected;
  });

  await handler(req, res, next);
  assert.equal(captured, expected);
});
