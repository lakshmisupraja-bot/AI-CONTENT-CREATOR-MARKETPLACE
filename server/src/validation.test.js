import test from 'node:test'
import assert from 'node:assert/strict'
import { validateBrief } from './validation.js'

const validBrief = {
  title: 'Spring campaign',
  projectDescription: 'A launch film for a new product.',
  targetAudience: 'First-time customers',
  creativeStyle: 'Cinematic',
  outputFormat: 'Video',
  contentType: 'Film & video',
  aspectRatio: '9:16',
  usage: 'Commercial Use',
  duration: '15–30 seconds',
  budget: '25000',
  deadline: '2026-12-01',
  additionalRequirements: 'Include captions.',
  referenceFiles: [],
}

test('validates and normalizes a brief payload', () => {
  const result = validateBrief(validBrief, 'brand-uuid')
  assert.equal(result.brandId, 'brand-uuid')
  assert.equal(result.title, 'Spring campaign')
  assert.equal(result.budget, 25000)
  assert.deepEqual(result.referenceFiles, [])
})

test('rejects missing required fields', () => {
  assert.throws(() => validateBrief({ ...validBrief, title: '  ' }, 'brand-uuid'), /Project name is required/)
})

test('rejects unsupported dropdown values', () => {
  assert.throws(() => validateBrief({ ...validBrief, outputFormat: 'SQL' }, 'brand-uuid'), /valid output format/)
})

test('rejects invalid budgets and calendar dates', () => {
  assert.throws(() => validateBrief({ ...validBrief, budget: '-1' }, 'brand-uuid'), /Budget must be/)
  assert.throws(() => validateBrief({ ...validBrief, deadline: '2026-02-30' }, 'brand-uuid'), /valid calendar date/)
})

test('rejects too many or foreign reference files', () => {
  assert.throws(() => validateBrief({
    ...validBrief,
    referenceFiles: Array.from({ length: 6 }, (_, index) => `brand-uuid/${index}.png`),
  }, 'brand-uuid'), /no more than five/)
  assert.throws(() => validateBrief({
    ...validBrief,
    referenceFiles: ['another-brand/file.png'],
  }, 'brand-uuid'), /signed-in brand/)
})
