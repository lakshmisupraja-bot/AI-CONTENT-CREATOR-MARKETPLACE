const creativeStyles = new Set([
  'Modern',
  'Realistic',
  'Cinematic',
  'Minimalist',
  'Professional',
  'Artistic',
  'Other',
])

const outputFormats = new Set([
  'Image',
  'Video',
  'Website Design',
  'Social Media Content',
  'Advertisement',
  'Other',
])

const usageRights = new Set([
  'Personal Use',
  'Commercial Use',
  'Educational Use',
  'Other',
])

const contentTypes = new Set([
  'Film & video',
  'Animation',
  'Images & campaign assets',
  '3D & immersive',
  'Something else',
])

const aspectRatios = new Set([
  '9:16',
  '16:9',
  '1:1',
  '4:5',
  'Multiple formats',
  'Creator to recommend',
])

const durations = new Set([
  '15–30 seconds',
  'Under 15 seconds',
  '30–60 seconds',
  '60+ seconds',
  'Not applicable / images',
])

function text(value, field, maxLength, { required = false } = {}) {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be text.`)
  }

  const normalized = value.trim()
  if (required && !normalized) {
    throw new Error(`${field} is required.`)
  }
  if (normalized.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`)
  }
  return normalized
}

function option(value, field, options) {
  if (typeof value !== 'string' || !options.has(value)) {
    throw new Error(`Choose a valid ${field}.`)
  }
  return value
}

export function validateBrief(body, brandId) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Brief data must be a JSON object.')
  }

  const title = text(body.title, 'Project name', 90, { required: true })
  const projectDescription = text(body.projectDescription, 'Project description', 2000, { required: true })
  const targetAudience = text(body.targetAudience, 'Target audience', 500, { required: true })
  const creativeStyle = option(body.creativeStyle, 'creative style', creativeStyles)
  const outputFormat = option(body.outputFormat, 'output format', outputFormats)
  const usage = option(body.usage, 'usage rights', usageRights)
  const contentType = option(body.contentType, 'content type', contentTypes)
  const aspectRatio = option(body.aspectRatio, 'aspect ratio', aspectRatios)
  const duration = option(body.duration, 'deliverable length', durations)
  const additionalRequirements = text(body.additionalRequirements ?? '', 'Additional requirements', 2000)

  let budget = null
  if (body.budget !== '' && body.budget !== null && body.budget !== undefined) {
    const numericBudget = Number(body.budget)
    if (!Number.isFinite(numericBudget) || numericBudget < 0 || numericBudget > 100_000_000) {
      throw new Error('Budget must be a number between 0 and 100,000,000.')
    }
    budget = numericBudget
  }

  let deadline = null
  if (body.deadline) {
    if (typeof body.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) {
      throw new Error('Deadline must be a valid calendar date.')
    }
    const parsedDate = new Date(`${body.deadline}T00:00:00.000Z`)
    if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== body.deadline) {
      throw new Error('Deadline must be a valid calendar date.')
    }
    deadline = body.deadline
  }

  const referenceFiles = body.referenceFiles ?? []
  if (!Array.isArray(referenceFiles) || referenceFiles.length > 5) {
    throw new Error('Attach no more than five reference files.')
  }
  for (const path of referenceFiles) {
    if (typeof path !== 'string' || !path.startsWith(`${brandId}/`) || path.length > 1024) {
      throw new Error('Reference file paths must belong to the signed-in brand.')
    }
  }

  return {
    brandId,
    title,
    projectDescription,
    targetAudience,
    creativeStyle,
    outputFormat,
    contentType,
    aspectRatio,
    usage,
    duration,
    budget,
    deadline,
    additionalRequirements,
    details: [projectDescription, `Target audience: ${targetAudience}`, additionalRequirements]
      .filter(Boolean)
      .join('\n\n'),
    referenceFiles,
  }
}
