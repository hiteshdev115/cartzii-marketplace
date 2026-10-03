import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAddressCountry, validatePostalCode } from '../lib/validation/address.ts';

const supported = ['ca', 'us'];

test('saved address country names normalize to checkout ISO codes', () => {
  assert.equal(normalizeAddressCountry('Canada', supported), 'CA');
  assert.equal(normalizeAddressCountry('United States', supported), 'US');
});

test('saved address country codes tolerate casing and whitespace', () => {
  assert.equal(normalizeAddressCountry(' ca ', supported), 'CA');
  assert.equal(normalizeAddressCountry('us', supported), 'US');
});

test('normalization does not map an unsupported country to the storefront', () => {
  assert.equal(normalizeAddressCountry('United Kingdom', supported), 'UNITED KINGDOM');
  assert.equal(normalizeAddressCountry('', supported), '');
  assert.notEqual(normalizeAddressCountry('United States', supported), 'CA');
});

test('country names are derived from the supported country configuration', () => {
  assert.equal(normalizeAddressCountry('United Kingdom', ['GB']), 'GB');
});

test('postal-code validation remains country-specific', () => {
  assert.equal(validatePostalCode('M5V 3A8', 'CA'), true);
  assert.equal(validatePostalCode('90210', 'US'), true);
  assert.equal(validatePostalCode('90210', 'CA'), false);
});