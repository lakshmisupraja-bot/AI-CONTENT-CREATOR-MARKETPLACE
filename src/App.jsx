import { useEffect, useMemo, useRef, useState } from 'react'
import Register from './Register'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { requestCreativeBriefApi } from './creativeBriefApi'
import './App.css'

const creators = [
  {
    id: 1,
    name: 'Maya Chen',
    handle: '@mayamakesworlds',
    location: 'Brooklyn, NY',
    specialty: 'AI Filmmaker',
    rate: '$850',
    availability: 'Available now',
    bio: 'I build cinematic worlds that blur the line between real and imagined. From first frame to final grade, every detail has a point of view.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85',
    projects: [
      { title: 'After the last light', category: 'Brand film · 00:42', image: 'photo-1519608487953-e999c86e7455' },
      { title: 'Soft shapes, loud ideas', category: 'Campaign · 00:18', image: 'photo-1531058020387-3be344556be6' },
      { title: 'Somewhere in between', category: 'Experimental · 00:26', image: 'photo-1518837695005-2083093ee35b' },
    ],
    tools: ['Runway Gen-3', 'Midjourney', 'DaVinci Resolve'],
    skills: ['AI filmmaking', 'Art direction', 'Video editing'],
    verified: ['Tools verified', 'Workflow verified'],
    workflow: 'Concept & reference boards → Midjourney style frames → Runway image-to-video generations → DaVinci color grade. All final frames reviewed and edited by hand.',
    formats: ['16:9', '9:16', '1:1'],
    completed: 28,
  },
  {
    id: 2,
    name: 'Leo Okafor',
    handle: '@leovisuals',
    location: 'London, UK',
    specialty: 'Generative 3D Artist',
    rate: '$720',
    availability: 'Available in 2 weeks',
    bio: 'Surreal product worlds and tactile digital objects. I turn bold ideas into polished images and animations built for modern brands.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=85',
    projects: [
      { title: 'Objects from another life', category: 'Product film · 00:24', image: 'photo-1531058020387-3be344556be6' },
      { title: 'Form studies no. 08', category: '3D motion · 00:12', image: 'photo-1550745165-9bc0b252726f' },
      { title: 'The weight of water', category: 'Art film · 00:31', image: 'photo-1518837695005-2083093ee35b' },
    ],
    tools: ['Blender', 'Stable Diffusion', 'ComfyUI'],
    skills: ['3D animation', 'Product visualization', 'ComfyUI workflows'],
    verified: ['Tools verified', 'Past work verified'],
    workflow: 'Block out in Blender → ComfyUI ControlNet passes for material exploration → composite, light, and render in Blender. Deliverables include project files.',
    formats: ['16:9', '1:1', '4:5'],
    completed: 19,
  },
  {
    id: 3,
    name: 'Amara Williams',
    handle: '@amarastudio',
    location: 'Los Angeles, CA',
    specialty: 'AI Animator',
    rate: '$640',
    availability: 'Available now',
    bio: 'Playful motion for people-first brands. I mix hand-drawn sensibilities with generative animation to make every frame feel alive.',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=85',
    projects: [
      { title: 'Little things, big feelings', category: 'Social campaign · 00:15', image: 'photo-1519608487953-e999c86e7455' },
      { title: 'A softer kind of energy', category: 'Motion identity · 00:20', image: 'photo-1550745165-9bc0b252726f' },
      { title: 'Made of many moments', category: 'Animated short · 00:48', image: 'photo-1531058020387-3be344556be6' },
    ],
    tools: ['Pika', 'After Effects', 'Midjourney'],
    skills: ['AI animation', 'Motion design', 'Character design'],
    verified: ['Workflow verified'],
    workflow: 'Character explorations in Midjourney → animate selected poses with Pika → hand-clean transitions and add type in After Effects.',
    formats: ['9:16', '1:1', '16:9'],
    completed: 34,
  },
  {
    id: 4,
    name: 'Jules Park',
    handle: '@studiojules',
    location: 'Seoul, South Korea',
    specialty: 'AI Art Director',
    rate: '$920',
    availability: 'Available now',
    bio: 'A visual storyteller for culture-forward campaigns. Building cohesive image systems that give a brand room to surprise.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=85',
    projects: [
      { title: 'New rituals', category: 'Art direction · 12 images', image: 'photo-1518837695005-2083093ee35b' },
      { title: 'Nothing ordinary', category: 'Editorial · 8 images', image: 'photo-1519608487953-e999c86e7455' },
      { title: 'Tomorrow, in bloom', category: 'Campaign · 00:21', image: 'photo-1550745165-9bc0b252726f' },
    ],
    tools: ['Midjourney', 'Adobe Firefly', 'Photoshop'],
    skills: ['Art direction', 'AI image generation', 'Brand campaigns'],
    verified: ['Tools verified', 'Workflow verified', 'Past work verified'],
    workflow: 'Campaign visual language and prompt library → Midjourney exploration → Firefly generative fill for precise art direction → Photoshop finishing and delivery.',
    formats: ['4:5', '1:1', '9:16'],
    completed: 42,
  },
]

const toolOptions = ['Runway', 'Midjourney', 'Blender', 'ComfyUI', 'Pika', 'Adobe Firefly', 'Stable Diffusion', 'DaVinci Resolve', 'After Effects', 'Kling', 'Luma', 'Sora']
const skillOptions = ['AI filmmaking', 'AI animation', 'AI video editing', 'Graphic design', 'Generative AI', 'AI advertising', 'Content creation', 'Motion graphics', 'Social media marketing', 'AI image generation', 'Art direction', '3D animation', 'Product visualization', 'ComfyUI workflows', 'Video editing']
const categoryOptions = ['All work', 'Film & video', 'Animation', 'Images & campaigns']

function mapDemoCreator(row) {
  const portfolio = Array.isArray(row.previous_projects) ? row.previous_projects : []
  const referenceImages = Array.isArray(row.reference_images) ? row.reference_images : []
  const referenceVideo = Array.isArray(row.reference_videos) ? row.reference_videos[0] : null
  const skills = Array.isArray(row.skills) ? row.skills : []
  const tools = Array.isArray(row.ai_tools) ? row.ai_tools : []
  const formats = Array.isArray(row.formats) ? row.formats : []
  const verification = row.verification_status === 'Tools and workflow verified'
    ? ['Tools verified', 'Workflow verified']
    : row.verification_status === 'Past work verified'
      ? ['Past work verified']
      : []

  return {
    id: row.id,
    name: row.full_name,
    handle: `@${row.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    location: row.location,
    specialty: row.category,
    rate: `₹${Number(row.minimum_budget_inr).toLocaleString('en-IN')}`,
    minimumBudget: Number(row.minimum_budget_inr),
    maximumBudget: Number(row.maximum_budget_inr),
    availability: row.availability,
    bio: row.bio,
    avatar: row.profile_picture_url,
    projects: portfolio.map((project, index) => ({
      title: project.title || `Selected project ${index + 1}`,
      category: project.category || row.category,
      image: referenceImages[index % Math.max(1, referenceImages.length)] || '',
      videoUrl: index === 0 ? referenceVideo : null,
    })),
    tools,
    skills,
    verified: verification,
    workflow: row.workflow,
    formats,
    completed: Number(row.completed_projects) || 0,
    experience: row.experience_level,
    completionRate: Number(row.completion_rate) || 0,
    portfolioDescription: row.portfolio_description,
  }
}

function getCreatorLoadErrorMessage(error) {
  const code = typeof error?.code === 'string' ? error.code : ''
  const message = typeof error?.message === 'string' ? error.message : 'Unknown Supabase error.'

  if (code === 'PGRST205') {
    return 'Supabase could not find public.demo_creator_profiles in its API schema cache (PGRST205). Confirm VITE_SUPABASE_URL points to the project containing the table, then refresh the PostgREST schema cache.'
  }

  if (code === '42501') {
    return 'Supabase denied access to creator profiles (42501). Check the anon/authenticated SELECT grant and the table’s read-only RLS policy; do not disable RLS.'
  }

  return `Could not load Supabase creator profiles${code ? ` (${code})` : ''}: ${message}`
}

function portfolioImageSrc(image, width) {
  if (!image) return ''
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=82`
}

function loadSavedCreatorIds() {
  try {
    const savedIds = JSON.parse(window.localStorage.getItem('creatorbridge:saved-creators') || '[]')
    return Array.isArray(savedIds) ? savedIds.filter((id) => Number.isInteger(id) || typeof id === 'string') : []
  } catch (error) {
    console.error('Unable to load saved creators from this browser.', error)
    return []
  }
}

function loadStoredList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch (error) {
    console.error(`Unable to load ${key} from this browser.`, error)
    return []
  }
}

function getCreatorBriefMatch(creator, brief) {
  const specialty = `${creator.specialty} ${creator.skills.join(' ')} ${creator.projects.map((project) => project.category).join(' ')}`.toLowerCase()
  const contentType = (brief.contentType || '').toLowerCase()
  const contentMatch = contentType.includes('animation')
    ? /animat|motion/.test(specialty)
    : contentType.includes('image')
      ? /image|art direction|campaign|editorial|visual/.test(specialty)
      : contentType.includes('3d')
        ? /3d|product visualization|comfyui/.test(specialty)
        : /filmmak|video|film|campaign|motion/.test(specialty)
  const formatMatch = creator.formats.includes(brief.format) || creator.formats.includes('Multiple formats') || brief.format === 'Creator to recommend'
  const budget = Number(brief.budget)
  const budgetMatch = budget > 0 && creator.minimumBudget > 0
    ? budget >= creator.minimumBudget && budget <= creator.maximumBudget
    : false
  const context = `${brief.title || ''} ${brief.style || ''} ${brief.details || ''}`.toLowerCase()
  const keywords = [...new Set(context.match(/[a-z0-9]{4,}/g) || [])]
    .filter((word) => !['with', 'that', 'this', 'from', 'your', 'into', 'work', 'create', 'original', 'include', 'human', 'review', 'final', 'based', 'project'].includes(word))
  const creatorText = `${creator.specialty} ${creator.bio} ${creator.skills.join(' ')} ${creator.tools.join(' ')} ${creator.workflow}`.toLowerCase()
  const sharedKeywords = keywords.filter((word) => creatorText.includes(word)).slice(0, 3)
  const score = (contentMatch ? 4 : 0) + (formatMatch ? 2 : 0) + (budgetMatch ? 3 : 0) + sharedKeywords.length
  const reasons = [
    ...(contentMatch ? [`Specializes in ${brief.contentType}`] : []),
    ...(formatMatch ? [`Works in ${brief.format}`] : []),
    ...(budgetMatch ? ['Within your stated budget'] : []),
    ...sharedKeywords.map((word) => `Relevant experience: ${word}`),
  ]
  return { score, reasons, contentMatch, formatMatch }
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    play: <><path d="m9 6 10 6-10 6V6Z" /></>,
    sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
    bookmark: <><path d="M6 4h12v17l-6-4-6 4V4Z" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 17v3h14v-3" /></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

function App() {
  const [page, setPage] = useState('discover')
  const [role, setRole] = useState('')
  const [sessionUser, setSessionUser] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState('')
  const [tool, setTool] = useState('')
  const [category, setCategory] = useState('All work')
  const [locationFilter, setLocationFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [minimumBudgetFilter, setMinimumBudgetFilter] = useState('')
  const [maximumBudgetFilter, setMaximumBudgetFilter] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [creatorPage, setCreatorPage] = useState(1)
  const [databaseCreators, setDatabaseCreators] = useState(null)
  const [creatorsLoading, setCreatorsLoading] = useState(isSupabaseConfigured)
  const [creatorLoadError, setCreatorLoadError] = useState(
    isSupabaseConfigured
      ? ''
      : 'Supabase is not configured for this frontend. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart Vite.',
  )
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [matchingBrief, setMatchingBrief] = useState(null)
  const [showBrief, setShowBrief] = useState(false)
  const [briefReturnPage, setBriefReturnPage] = useState('briefs')
  const [roughIdea, setRoughIdea] = useState('')
  const [briefs, setBriefs] = useState(() => {
    const storedBriefs = loadStoredList('creatorbridge:briefs')
    return supabase ? storedBriefs.filter((item) => !item.persisted) : storedBriefs
  })
  const [referenceFiles, setReferenceFiles] = useState([])
  const [briefSubmitting, setBriefSubmitting] = useState(false)
  const briefSubmissionLock = useRef(false)
  const [submittedBrief, setSubmittedBrief] = useState(null)
  const [briefReferenceBusy, setBriefReferenceBusy] = useState('')
  const [briefError, setBriefError] = useState('')
  const [briefValidationErrors, setBriefValidationErrors] = useState({})
  const [briefStorageError, setBriefStorageError] = useState('')
  const [savedIds, setSavedIds] = useState(loadSavedCreatorIds)
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([])
  const [invitationBriefId, setInvitationBriefId] = useState('')
  const [invitationMessage, setInvitationMessage] = useState('')
  const [invitations, setInvitations] = useState(() => loadStoredList('creatorbridge:invitations'))
  const [notice, setNotice] = useState('')
  const [mobileFilters, setMobileFilters] = useState(false)
  const [brief, setBrief] = useState({
    title: '', projectDescription: '', targetAudience: '', contentType: '', outputFormat: '', style: '', format: '9:16', usage: 'Other', duration: '15–30 seconds', budget: '', deadline: '', details: '', additionalRequirements: '',
  })

  useEffect(() => {
    if (!supabase) return undefined

    let cancelled = false
    const loadProfile = async (user) => {
      const fallbackProfile = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || '',
        display_name: user.user_metadata?.display_name || user.user_metadata?.company_name || user.email,
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, display_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Unable to load the signed-in profile.', error)
        if (!cancelled) setSessionUser(fallbackProfile)
        return
      }

      if (!cancelled) setSessionUser(data || fallbackProfile)
    }

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('Unable to restore the signed-in session.', error)
          return
        }
        if (data.session) loadProfile(data.session.user)
      })
      .catch((error) => {
        console.error('Unable to restore the signed-in session.', error)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSessionUser(null)
        setBriefs([])
        return
      }
      setBriefs([])
      window.setTimeout(() => loadProfile(session.user), 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || sessionUser?.role !== 'brand') return undefined

    let cancelled = false
    requestCreativeBriefApi('/api/creative-briefs')
      .then((data) => {
        if (cancelled) return
        const databaseBriefs = data.map((row) => ({
          id: row.id,
          title: row.title,
          contentType: row.content_type,
          projectDescription: row.project_description,
          targetAudience: row.target_audience,
          style: row.creative_style,
          outputFormat: row.output_format,
          format: row.aspect_ratio,
          usage: row.commercial_use,
          duration: row.duration,
          budget: row.budget ?? '',
          deadline: row.deadline || '',
          details: row.details,
          additionalRequirements: row.additional_requirements,
          referenceFiles: row.reference_files || [],
          created: new Date(row.created_at).toLocaleDateString(),
          persisted: true,
        }))
        setBriefs((previous) => [
          ...databaseBriefs,
          ...previous.filter((item) => !item.persisted && item.brandId === sessionUser.id),
        ])
        setBriefStorageError('')
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Unexpected error while loading saved creative briefs.', error)
        setBriefStorageError(`Could not load your saved briefs: ${error.message}`)
      })

    return () => {
      cancelled = true
    }
  }, [sessionUser])

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstallPrompt(null)
      setShowInstallHelp(false)
      setNotice('CreatorBridge is installed on this device.')
      window.setTimeout(() => setNotice(''), 3200)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined

    let cancelled = false
    supabase
      .from('demo_creator_profiles')
      .select('id, full_name, email, phone, category, location, minimum_budget_inr, maximum_budget_inr, skills, experience_level, ai_tools, portfolio_description, profile_picture_url, reference_images, reference_videos, previous_projects, availability, bio, completed_projects, completion_rate, verification_status, formats, commercial_use, workflow')
      .order('full_name')
      .range(0, 999)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Unable to load demo creator profiles from Supabase.', error)
          setCreatorLoadError(getCreatorLoadErrorMessage(error))
          setDatabaseCreators(null)
          return
        }
        setDatabaseCreators((data || []).map(mapDemoCreator))
        setCreatorLoadError('')
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Unexpected error while loading creator profiles.', error)
        setCreatorLoadError(getCreatorLoadErrorMessage(error))
        setDatabaseCreators(null)
      })
      .finally(() => {
        if (!cancelled) setCreatorsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('creatorbridge:saved-creators', JSON.stringify(savedIds))
    } catch (error) {
      console.error('Unable to save your creator shortlist in this browser.', error)
    }
  }, [savedIds])

  useEffect(() => {
    try {
      window.localStorage.setItem('creatorbridge:invitations', JSON.stringify(invitations))
    } catch (error) {
      console.error('Unable to save invitations in this browser.', error)
    }
  }, [invitations])

  const creatorProfiles = databaseCreators ?? creators

  const visibleCreators = useMemo(() => {
    const filteredCreators = creatorProfiles.filter((creator) => {
    const searchText = `${creator.name} ${creator.specialty} ${creator.location} ${creator.experience || ''} ${creator.bio} ${creator.skills.join(' ')} ${creator.tools.join(' ')}`.toLowerCase()
    const matchesQuery = searchText.includes(query.trim().toLowerCase())
    const matchesSkill = !skill || creator.skills.includes(skill) || creator.specialty === skill
    const matchesTool = !tool || creator.tools.some((item) => item.toLowerCase().includes(tool.toLowerCase()))
    const matchesSaved = page !== 'saved' || savedIds.includes(creator.id)
    const matchesLocation = !locationFilter || creator.location.toLowerCase().includes(locationFilter.trim().toLowerCase())
    const matchesExperience = !experienceFilter || creator.experience === experienceFilter
    const matchesAvailability = !availabilityFilter || creator.availability === availabilityFilter
    const matchesMinimumBudget = !minimumBudgetFilter || creator.maximumBudget >= Number(minimumBudgetFilter)
    const matchesMaximumBudget = !maximumBudgetFilter || creator.minimumBudget <= Number(maximumBudgetFilter)
    const matchesCategory = category === 'All work'
      || (category === 'Film & video' && (/film|video|filmmak/i.test(creator.specialty) || creator.projects.some((project) => /film|video|campaign/i.test(project.category))))
      || (category === 'Animation' && (/animat|motion/i.test(creator.specialty) || creator.skills.some((item) => /animation|motion/i.test(item))))
      || (category === 'Images & campaigns' && (/graphic|image|advertis|content creation/i.test(creator.specialty) || creator.projects.some((project) => /image|editorial|campaign/i.test(project.category))))
    return matchesQuery && matchesSkill && matchesTool && matchesCategory && matchesSaved && matchesLocation && matchesExperience && matchesAvailability && matchesMinimumBudget && matchesMaximumBudget
    })
    return filteredCreators.sort((first, second) => {
      if (page === 'matches' && matchingBrief) {
        const matchDifference = getCreatorBriefMatch(second, matchingBrief).score - getCreatorBriefMatch(first, matchingBrief).score
        if (matchDifference) return matchDifference
      }
      if (sortBy === 'budget-low') return (first.minimumBudget || 0) - (second.minimumBudget || 0)
      if (sortBy === 'budget-high') return (second.maximumBudget || 0) - (first.maximumBudget || 0)
      if (sortBy === 'experience') {
        const experienceOrder = { Emerging: 1, Intermediate: 2, Expert: 3 }
        const experienceDifference = (experienceOrder[second.experience] || 0) - (experienceOrder[first.experience] || 0)
        if (experienceDifference) return experienceDifference
      }
      return first.name.localeCompare(second.name)
    })
  }, [availabilityFilter, category, creatorProfiles, experienceFilter, locationFilter, matchingBrief, maximumBudgetFilter, minimumBudgetFilter, page, query, savedIds, skill, sortBy, tool])

  const pageSize = 16
  const pageCount = Math.max(1, Math.ceil(visibleCreators.length / pageSize))
  const currentCreatorPage = Math.min(creatorPage, pageCount)
  const pageCreators = visibleCreators.slice((currentCreatorPage - 1) * pageSize, currentCreatorPage * pageSize)

  const findCreatorsForBrief = (briefToMatch) => {
    setMatchingBrief(briefToMatch)
    setInvitationBriefId(String(briefToMatch.id))
    setPage('matches')
    setQuery('')
    setSkill('')
    setTool('')
    setCategory('All work')
    setLocationFilter('')
    setExperienceFilter('')
    setAvailabilityFilter('')
    setMinimumBudgetFilter('')
    setMaximumBudgetFilter('')
    setCreatorPage(1)
    window.setTimeout(() => document.getElementById('creator-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const notify = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const downloadBriefReference = async (path) => {
    if (!supabase || !sessionUser || !path) return
    setBriefReferenceBusy(path)
    try {
      const { data, error } = await supabase.storage
        .from('creative-brief-references')
        .download(path)
      if (error) throw error
      const objectUrl = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = path.split('/').pop() || 'creative-reference'
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      console.error('Unable to download a creative brief reference file.', error)
      notify(`Could not download the reference file: ${error.message || 'Please try again.'}`)
    } finally {
      setBriefReferenceBusy('')
    }
  }

  const installApp = async () => {
    if (!installPrompt) {
      setShowInstallHelp(true)
      return
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      setInstallPrompt(null)
      if (outcome === 'accepted') notify('CreatorBridge is installing on this device.')
    } catch (error) {
      console.error('Unable to start the CreatorBridge installation prompt.', error)
      notify('Your browser could not start installation. See the install instructions.')
      setShowInstallHelp(true)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Unable to sign out.', error)
      notify('Could not sign out. Please try again.')
      return
    }
    setSessionUser(null)
    setPage('discover')
    notify('You have been signed out.')
  }

  const updateBrief = (field, value) => {
    setBrief((previous) => ({ ...previous, [field]: value }))
    setBriefValidationErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  const openBriefBuilder = () => {
    setBriefError('')
    setBriefValidationErrors({})
    setSubmittedBrief(null)
    setBriefReturnPage(page)
    setShowBrief(true)
  }

  const toggleSavedCreator = (creatorId) => {
    const isSaved = savedIds.includes(creatorId)
    setSavedIds((previous) => isSaved
      ? previous.filter((id) => id !== creatorId)
      : [...previous, creatorId])
    if (isSaved) {
      setSelectedCreatorIds((previous) => previous.filter((id) => id !== creatorId))
    }
  }

  const sendInvitations = () => {
    const selectedBrief = briefs.find((item) => String(item.id) === invitationBriefId)
    if (!selectedCreatorIds.length) {
      notify('Select at least one creator from your shortlist.')
      return
    }
    if (!selectedBrief) {
      notify('Choose a brief before sending invitations.')
      return
    }
    if (!invitationMessage.trim()) {
      notify('Add a short message to personalize your invitation.')
      return
    }

    const alreadyInvitedIds = new Set(invitations
      .filter((invitation) => String(invitation.briefId) === invitationBriefId && invitation.status !== 'Closed')
      .map((invitation) => invitation.creatorId))
    const eligibleCreatorIds = selectedCreatorIds.filter((id) => !alreadyInvitedIds.has(id))

    if (!eligibleCreatorIds.length) {
      notify('These creators already have an open invitation for this brief.')
      return
    }

    const createdAt = new Date().toISOString()
    const newInvitations = eligibleCreatorIds.map((creatorId) => ({
      id: `${createdAt}-${creatorId}`,
      creatorId,
      briefId: selectedBrief.id,
      message: invitationMessage.trim(),
      status: 'Sent',
      createdAt,
    }))
    setInvitations((previous) => [...newInvitations, ...previous])
    setSelectedCreatorIds((previous) => previous.filter((id) => !eligibleCreatorIds.includes(id)))
    notify(`Invitation${newInvitations.length === 1 ? '' : 's'} sent to ${newInvitations.length} creator${newInvitations.length === 1 ? '' : 's'}.`)
  }

  const buildBrief = () => {
    const idea = roughIdea.trim()
    if (!idea) {
      notify('Add a few words about your idea first.')
      return
    }
    const normalized = idea.charAt(0).toUpperCase() + idea.slice(1)
    setBrief((previous) => ({
      ...previous,
      title: previous.title || (idea.length > 54 ? `${normalized.slice(0, 51)}…` : normalized),
      projectDescription: previous.projectDescription || idea,
      targetAudience: previous.targetAudience || 'Describe the audience this creative should reach.',
      contentType: /animat|character|motion/i.test(idea) ? 'Animation' : /image|photo|still|visual/i.test(idea) ? 'Images & campaign assets' : 'Film & video',
      style: previous.style || (/cinematic|film|movie/i.test(idea) ? 'Cinematic' : 'Modern'),
      additionalRequirements: previous.additionalRequirements || `Create an original AI-assisted concept based on this idea: ${idea}. Include the proposed tools and workflow, human review and finishing steps, and final usage-ready exports.`,
    }))
    notify('Idea shaped into a draft. Review the details before publishing.')
  }

  const submitBrief = async (event) => {
    event.preventDefault()
    if (briefSubmissionLock.current) return
    setBriefError('')

    const validationErrors = {}
    if (!brief.title.trim()) validationErrors.title = 'Enter a project name.'
    if (!brief.projectDescription.trim()) validationErrors.projectDescription = 'Describe your project.'
    if (!brief.targetAudience.trim()) validationErrors.targetAudience = 'Describe your target audience.'
    if (!brief.style.trim()) validationErrors.style = 'Choose a creative style.'
    if (!brief.outputFormat.trim()) validationErrors.outputFormat = 'Choose an output format.'
    if (referenceFiles.length > 5) validationErrors.referenceFiles = 'Upload no more than five reference files.'
    if (referenceFiles.some((file) => file.size > 10 * 1024 * 1024)) validationErrors.referenceFiles = 'Each reference file must be 10 MB or smaller.'
    if (referenceFiles.some((file) => ![
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/bmp',
      'image/tiff',
      'image/heic',
      'image/heif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ].includes(file.type))) validationErrors.referenceFiles = 'Use images, PDF, DOC, DOCX, or TXT files.'
    setBriefValidationErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      setBriefError('Please correct the highlighted fields before submitting.')
      return
    }

    if (!supabase || !sessionUser || sessionUser.role !== 'brand') {
      setBriefError('Sign in with a brand account to submit briefs to the database.')
      return
    }

    if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
      setBriefError('The brief API is not configured. Add VITE_API_BASE_URL to the frontend environment and restart the app.')
      return
    }

    briefSubmissionLock.current = true
    setBriefSubmitting(true)
    const uploadedPaths = []
    const briefDetails = [
      brief.projectDescription.trim(),
      `Target audience: ${brief.targetAudience.trim()}`,
      brief.additionalRequirements.trim(),
    ].filter(Boolean).join('\n\n')
    try {
      const referencePaths = []
      let savedBrief

      if (supabase && sessionUser) {
        for (const [index, file] of referenceFiles.entries()) {
          const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
          const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${index}`
          const path = `${sessionUser.id}/${fileId}-${fileName}`
          const { error } = await supabase.storage
            .from('creative-brief-references')
            .upload(path, file, { contentType: file.type, upsert: false })
          if (error) throw error
          uploadedPaths.push(path)
          referencePaths.push(path)
        }

        const data = await requestCreativeBriefApi('/api/creative-briefs', {
          method: 'POST',
          body: {
            title: brief.title.trim(),
            projectDescription: brief.projectDescription.trim(),
            targetAudience: brief.targetAudience.trim(),
            creativeStyle: brief.style,
            outputFormat: brief.outputFormat,
            contentType: brief.contentType,
            aspectRatio: brief.format,
            usage: brief.usage,
            duration: brief.duration,
            budget: brief.budget || null,
            deadline: brief.deadline || null,
            additionalRequirements: brief.additionalRequirements.trim(),
            referenceFiles: referencePaths,
          },
        })
        if (!data?.id || !data.created_at) {
          throw new Error('The database did not confirm the saved brief. Please check your briefs before retrying.')
        }

        savedBrief = {
          ...brief,
          id: data.id,
          title: data.title,
          projectDescription: data.project_description,
          targetAudience: data.target_audience,
          style: data.creative_style,
          outputFormat: data.output_format,
          contentType: data.content_type,
          format: data.aspect_ratio,
          usage: data.commercial_use,
          duration: data.duration,
          budget: data.budget ?? '',
          deadline: data.deadline || '',
          additionalRequirements: data.additional_requirements,
          details: briefDetails,
          referenceFiles: data.reference_files || [],
          created: new Date(data.created_at).toLocaleDateString(),
          persisted: true,
          brandId: data.brand_id,
        }
      }

      const updatedBriefs = [savedBrief, ...briefs.filter((item) => String(item.id) !== String(savedBrief.id))]
      setBriefs(updatedBriefs)
      setInvitationBriefId(String(savedBrief.id))
      setSubmittedBrief(savedBrief)
      if (briefReturnPage === 'matches') setMatchingBrief(savedBrief)
      setBrief({ title: '', projectDescription: '', targetAudience: '', contentType: '', outputFormat: '', style: '', format: '9:16', usage: 'Other', duration: '15–30 seconds', budget: '', deadline: '', details: '', additionalRequirements: '' })
      setReferenceFiles([])
      setBriefValidationErrors({})
      setRoughIdea('')
      notify('Creative Brief saved successfully!')
    } catch (error) {
      console.error('Unable to submit the creative brief.', error)
      if (uploadedPaths.length && supabase) {
        try {
          const { error: cleanupError } = await supabase.storage
            .from('creative-brief-references')
            .remove(uploadedPaths)
          if (cleanupError) console.error('Unable to clean up reference files after brief submission failed.', cleanupError)
        } catch (cleanupError) {
          console.error('Unable to clean up reference files after brief submission failed.', cleanupError)
        }
      }
      setBriefError(`Could not submit your brief: ${error.message || 'Please try again.'}`)
    } finally {
      briefSubmissionLock.current = false
      setBriefSubmitting(false)
    }
  }

  if (page === 'register') {
    return <Register key={role} role={role} onBack={() => setPage('discover')} onAuthenticated={(profile) => {
      setSessionUser(profile)
      setPage('discover')
      notify(`Welcome to CreatorBridge, ${profile.display_name || profile.company_name || 'you'}.`)
    }} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#discover" onClick={(event) => { event.preventDefault(); setPage('discover') }}>
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>creatorbridge<span className="brand-ai">.ai</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === 'discover' || page === 'matches' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('discover')}><Icon name="grid" size={16} /> Discover</button>
          <button className={page === 'saved' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('saved')}><Icon name="bookmark" size={16} /> Saved{savedIds.length > 0 && <span className="nav-count">{savedIds.length}</span>}</button>
          <button className={page === 'briefs' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('briefs')}><Icon name="briefcase" size={16} /> My briefs{briefs.length > 0 && <span className="nav-count">{briefs.length}</span>}</button>
          <a className="nav-link how-link" href="#how-it-works">How it works</a>
        </nav>
        <div className="topbar-actions">
          <button className="text-action install-app-button" aria-label="Install CreatorBridge app" onClick={installApp}><Icon name="download" size={16} /><span>Install app</span></button>
          {sessionUser
            ? <button className="button button-dark" onClick={() => setPage('account')}>{sessionUser.display_name || 'My account'}</button>
            : <>
              <button className="text-action" onClick={() => { setRole('Creator'); setPage('register') }}>For creators</button>
              <button className="button button-dark" onClick={() => { setRole('Brand'); setPage('register') }}>Log in <Icon name="arrow" size={15} /></button>
            </>}
          <button className="mobile-menu" aria-label="Toggle filters" onClick={() => setMobileFilters((value) => !value)}><Icon name="sliders" /></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> THE CREATIVE MARKETPLACE, REIMAGINED</div>
            <h1>Find your next<br /><span>creative collaborator.</span></h1>
            <p>Meet the AI-native creators turning ambitious ideas into unforgettable work.</p>
            <div className="hero-search">
              <Icon name="search" size={19} />
              <input aria-label="Search creators" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “AI filmmaker” or “Runway”" />
              <button onClick={() => document.getElementById('creator-grid')?.scrollIntoView({ behavior: 'smooth' })}>Find a creator <Icon name="arrow" size={16} /></button>
            </div>
            <div className="search-hints"><span>Popular:</span>{['AI filmmaking', 'Midjourney', 'Product video'].map((hint) => <button key={hint} onClick={() => setQuery(hint)}>{hint}</button>)}</div>
          </div>
          <div className="hero-art" aria-label="Abstract cinematic pink landscape">
            <div className="art-image" />
            <div className="art-scrim" />
            <div className="art-caption"><span className="play-button"><Icon name="play" size={15} /></span><span><strong>Worlds that don’t exist</strong><small>AI short film · Maya Chen</small></span><span className="art-duration">00:42</span></div>
            <div className="floating-note"><span className="note-spark"><Icon name="spark" size={15} /></span><span><strong>Human imagination,</strong><small>supercharged.</small></span></div>
            <span className="art-index">SELECTED WORK&nbsp; — &nbsp;001</span>
          </div>
        </section>

        <section className="trust-strip" aria-label="Marketplace highlights">
          <div><strong>Curated talent</strong><span>Not just another directory</span></div><i />
          <div><strong>Process, made visible</strong><span>Know how every project comes to life</span></div><i />
          <div><strong>Built for what’s next</strong><span>AI-native from first prompt to final frame</span></div>
        </section>

        <section className="discovery-section" id="creator-grid">
          <div className="section-heading">
            <div><div className="eyebrow muted-eyebrow">{page === 'saved' ? 'YOUR CREATOR SHORTLIST' : page === 'matches' ? 'BRIEF-BASED CREATOR MATCHING' : 'THE PEOPLE BEHIND THE PROMPTS'}</div><h2>{page === 'saved' ? 'Creators you saved' : page === 'matches' ? 'Creators for your brief' : 'Creators worth discovering'}<span className="heading-period">.</span></h2><p>{page === 'saved' ? 'Your shortlist is saved on this device for your next visit.' : page === 'matches' ? `Ranked by fit for “${matchingBrief?.title || 'your brief'}”. Save a match, then invite them from your shortlist.` : 'A handpicked community of original thinkers and next-gen makers.'}</p></div>
            <div className="discovery-actions">{page === 'saved' && savedIds.length > 0 && <button className="text-action clear-shortlist" onClick={() => { setSavedIds([]); setSelectedCreatorIds([]) }}>Clear shortlist</button>}{page === 'matches' && <button className="button button-outline create-brief" onClick={() => setPage('briefs')}>All briefs</button>}<button className="button button-outline create-brief" onClick={openBriefBuilder}><Icon name="plus" size={16} /> Create Creative Brief</button></div>
          </div>
          {page === 'saved' && savedIds.length > 0 && (
            <section className="outreach-composer" aria-labelledby="outreach-title">
              <div className="outreach-intro">
                <span className="outreach-step">NEXT STEP</span>
                <h3 id="outreach-title">Take your shortlist forward</h3>
                <p>Select creators below, choose the project brief, and send a personal invitation.</p>
              </div>
              <div className="outreach-controls">
                <label className="outreach-field">
                  <span>PROJECT BRIEF</span>
                  <select value={invitationBriefId} onChange={(event) => setInvitationBriefId(event.target.value)}>
                    <option value="">Choose a brief</option>
                    {briefs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
                {briefs.length === 0 && <button className="outreach-create-brief" onClick={openBriefBuilder}>Create a brief to get started <Icon name="arrow" size={14} /></button>}
                <label className="outreach-field outreach-message">
                  <span>PERSONAL MESSAGE</span>
                  <textarea rows="2" maxLength={500} value={invitationMessage} onChange={(event) => setInvitationMessage(event.target.value)} placeholder="Hi! I loved your work and think you could be a great fit for our project..." />
                </label>
                <div className="outreach-send-row">
                  <span>{selectedCreatorIds.length ? `${selectedCreatorIds.length} creator${selectedCreatorIds.length === 1 ? '' : 's'} selected` : 'Select creators from your shortlist below'}</span>
                  <button className="button button-dark" onClick={sendInvitations} disabled={!selectedCreatorIds.length || !briefs.length || !invitationMessage.trim()}>
                    Send {selectedCreatorIds.length || ''} invitation{selectedCreatorIds.length === 1 ? '' : 's'} <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>
            </section>
          )}
          <div className="discovery-layout">
            <aside className={`filter-panel ${mobileFilters ? 'filters-open' : ''}`}>
              <div className="filter-head"><span><Icon name="sliders" size={17} /> Refine your search</span><button onClick={() => { setSkill(''); setTool(''); setCategory('All work'); setQuery(''); setLocationFilter(''); setExperienceFilter(''); setAvailabilityFilter(''); setMinimumBudgetFilter(''); setMaximumBudgetFilter('') }}>Reset</button></div>
              <label className="filter-label" htmlFor="skill-filter">SPECIALIZATION</label>
              <select id="skill-filter" value={skill} onChange={(event) => setSkill(event.target.value)}><option value="">All specializations</option>{skillOptions.map((item) => <option key={item}>{item}</option>)}</select>
              <label className="filter-label" htmlFor="tool-filter">AI TOOLS & MODELS</label>
              <select id="tool-filter" value={tool} onChange={(event) => setTool(event.target.value)}><option value="">Any tool or model</option>{toolOptions.map((item) => <option key={item}>{item}</option>)}</select>
              <label className="filter-label" htmlFor="location-filter">LOCATION</label>
              <input className="filter-text-input" id="location-filter" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="Any location" />
              <label className="filter-label" htmlFor="experience-filter">EXPERIENCE</label>
              <select id="experience-filter" value={experienceFilter} onChange={(event) => setExperienceFilter(event.target.value)}><option value="">Any experience</option>{['Emerging', 'Intermediate', 'Expert'].map((level) => <option key={level}>{level}</option>)}</select>
              <label className="filter-label" htmlFor="availability-filter">AVAILABILITY</label>
              <select id="availability-filter" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}><option value="">Any availability</option><option>Available now</option><option>Available in 2 weeks</option></select>
              <label className="filter-label">PROJECT BUDGET (INR)</label>
              <div className="budget-filter"><input inputMode="numeric" aria-label="Minimum project budget in rupees" value={minimumBudgetFilter} onChange={(event) => setMinimumBudgetFilter(event.target.value.replace(/\D/g, ''))} placeholder="Min ₹" /><input inputMode="numeric" aria-label="Maximum project budget in rupees" value={maximumBudgetFilter} onChange={(event) => setMaximumBudgetFilter(event.target.value.replace(/\D/g, ''))} placeholder="Max ₹" /></div>
              <label className="filter-label">CONTENT TYPE</label>
              <div className="category-options">{categoryOptions.map((item) => <button className={category === item ? 'category-option selected' : 'category-option'} key={item} onClick={() => setCategory(item)}>{item}<span>{category === item && <Icon name="check" size={14} />}</span></button>)}</div>
              <div className="filter-note"><Icon name="spark" size={16} /><span><strong>Not sure where to start?</strong>Share your idea in a brief and find the right fit together.</span></div>
            </aside>

            <div className="creator-results">
              <div className="results-toolbar"><span><strong>{visibleCreators.length}</strong> {page === 'saved' ? 'saved creators' : page === 'matches' ? 'creators ranked by brief fit' : 'creators to explore'}{databaseCreators && <span className="database-source"> · Supabase directory</span>}</span><div className="results-toolbar-actions">{page === 'matches' && <span className="match-explainer">Fit considers category, format, budget, and brief keywords</span>}<select className="sort-select" aria-label="Sort creators" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recommended">Recommended</option><option value="budget-low">Lowest budget</option><option value="budget-high">Highest budget</option><option value="experience">Most experienced</option></select></div></div>
              {creatorLoadError && <div className="creator-load-error" role="alert">{creatorLoadError} Showing built-in sample creators; Supabase records are unavailable until this is resolved.</div>}
              {creatorsLoading && <div className="creator-load-status" role="status">Loading creator profiles from Supabase…</div>}
              {visibleCreators.length ? <div className="creator-grid">{pageCreators.map((creator) => (
                <article className="creator-card" key={creator.id}>
                  <div className="creator-card-top">
                    <button className="creator-avatar-button" aria-label={`View ${creator.name}'s profile`} onClick={() => setSelectedCreator(creator)}><img className="creator-avatar" src={creator.avatar} alt="" /></button>
                    <div className="creator-identity"><button onClick={() => setSelectedCreator(creator)} className="creator-name">{creator.name}</button><span>{creator.specialty}</span><span className="creator-location"><Icon name="pin" size={13} /> {creator.location}</span></div>
                    <button className={savedIds.includes(creator.id) ? 'save-button is-saved' : 'save-button'} aria-label={savedIds.includes(creator.id) ? 'Remove saved creator' : 'Save creator'} onClick={() => toggleSavedCreator(creator.id)}><Icon name="bookmark" size={17} /></button>
                  </div>
                  <div className="portfolio-strip">{creator.projects.map((project) => <button className="portfolio-thumb" key={project.title} onClick={() => setSelectedCreator(creator)} aria-label={`View ${project.title}`}>{project.image && <img src={portfolioImageSrc(project.image, 380)} alt="" />}{project.videoUrl ? <span><Icon name="play" size={14} /></span> : <span><Icon name="arrow" size={13} /></span>}</button>)}</div>
                  <p className="creator-bio">{creator.bio}</p>
                  <div className="creator-tags">{creator.tools.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
                  <div className="creator-skill-tags">{creator.skills.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
                  {page === 'matches' && matchingBrief && <div className="match-reasons"><span className="match-fit">{getCreatorBriefMatch(creator, matchingBrief).score >= 7 ? 'STRONG FIT' : getCreatorBriefMatch(creator, matchingBrief).score >= 4 ? 'POTENTIAL FIT' : 'EXPLORE'}</span><div>{getCreatorBriefMatch(creator, matchingBrief).reasons.length ? getCreatorBriefMatch(creator, matchingBrief).reasons.map((reason) => <span key={reason}>{reason}</span>) : <span>Review portfolio and workflow for project fit</span>}</div></div>}
                  <div className="creator-card-footer"><div className="availability"><span className={creator.availability === 'Available now' ? 'availability-dot' : 'availability-dot later'} />{creator.availability}</div>{page === 'saved' ? <button className={selectedCreatorIds.includes(creator.id) ? 'select-creator selected' : 'select-creator'} aria-pressed={selectedCreatorIds.includes(creator.id)} onClick={() => setSelectedCreatorIds((previous) => previous.includes(creator.id) ? previous.filter((id) => id !== creator.id) : [...previous, creator.id])}><Icon name="check" size={13} />{selectedCreatorIds.includes(creator.id) ? 'Selected' : 'Select'}</button> : page === 'matches' ? <button className={savedIds.includes(creator.id) ? 'select-creator selected' : 'select-creator'} onClick={() => toggleSavedCreator(creator.id)}><Icon name={savedIds.includes(creator.id) ? 'check' : 'bookmark'} size={13} />{savedIds.includes(creator.id) ? 'Saved' : 'Save to shortlist'}</button> : <button className="view-profile" onClick={() => setSelectedCreator(creator)}>View profile <Icon name="arrow" size={14} /></button>}</div>
                  {page === 'saved' && invitations.filter((invitation) => invitation.creatorId === creator.id).slice(0, 1).map((invitation) => {
                    const linkedBrief = briefs.find((item) => String(item.id) === String(invitation.briefId))
                    return <div className={`card-invitation-status status-${invitation.status.toLowerCase().replace(/\s+/g, '-')}`} key={invitation.id}><span>Invitation {invitation.status.toLowerCase()} · {linkedBrief?.title || 'Brief'}</span><select aria-label={`Update invitation status for ${creator.name}`} value={invitation.status} onChange={(event) => setInvitations((previous) => previous.map((item) => item.id === invitation.id ? { ...item, status: event.target.value } : item))}><option>Sent</option><option>In discussion</option><option>Hired</option><option>Closed</option></select></div>
                  })}
                </article>
              ))}</div> : <div className="empty-state"><span className="empty-icon"><Icon name={page === 'saved' && savedIds.length === 0 ? 'bookmark' : 'search'} size={22} /></span><h3>{page === 'saved' ? savedIds.length === 0 ? 'Your shortlist is ready for its first creator.' : 'No saved creators match these filters.' : 'No creators found just yet.'}</h3><p>{page === 'saved' ? savedIds.length === 0 ? 'Save creators you like while exploring, and they’ll be here whenever you come back.' : 'Reset your filters to see your saved creators, or explore more profiles.' : 'Try a different tool, skill, or content type to widen your search.'}</p><button className="button button-outline" onClick={() => { if (page === 'saved' && savedIds.length === 0) setPage('discover'); else { setSkill(''); setTool(''); setCategory('All work'); setLocationFilter(''); setExperienceFilter(''); setAvailabilityFilter(''); setMinimumBudgetFilter(''); setMaximumBudgetFilter('') } }}>{page === 'saved' && savedIds.length === 0 ? 'Explore creators' : 'Clear all filters'}</button></div>}
              {visibleCreators.length > pageSize && <nav className="creator-pagination" aria-label="Creator result pages"><button disabled={currentCreatorPage === 1} onClick={() => setCreatorPage(currentCreatorPage - 1)}>Previous</button><span>Page {currentCreatorPage} of {pageCount}</span><button disabled={currentCreatorPage === pageCount} onClick={() => setCreatorPage(currentCreatorPage + 1)}>Next</button></nav>}
            </div>
          </div>
          {page === 'saved' && (
            <section className="sent-invitations" aria-labelledby="sent-invitations-title">
              <div className="sent-invitations-heading"><div><span className="outreach-step">KEEP THINGS MOVING</span><h3 id="sent-invitations-title">Invitation activity</h3></div><span>{invitations.length} sent</span></div>
              {invitations.length ? <div className="invitation-list">{invitations.map((invitation) => {
                const creator = creators.find((item) => item.id === invitation.creatorId)
                const linkedBrief = briefs.find((item) => String(item.id) === String(invitation.briefId))
                if (!creator) return null
                return <article className="invitation-row" key={invitation.id}><img src={creator.avatar} alt="" /><div className="invitation-summary"><strong>{creator.name}</strong><span>{linkedBrief?.title || 'Brief'} · {new Date(invitation.createdAt).toLocaleDateString()}</span><p>{invitation.message}</p></div><label className="invitation-status"><span>STATUS</span><select aria-label={`Update invitation status for ${creator.name}`} value={invitation.status} onChange={(event) => setInvitations((previous) => previous.map((item) => item.id === invitation.id ? { ...item, status: event.target.value } : item))}><option>Sent</option><option>In discussion</option><option>Hired</option><option>Closed</option></select></label></article>
              })}</div> : <div className="invitation-empty"><span>Once you invite creators, your outreach and next steps will be tracked here.</span></div>}
              <div className="invitation-demo-note">Demo workflow: invitations and manually updated statuses are saved in this browser. No emails are sent.</div>
            </section>
          )}
        </section>

        <section className="brief-banner">
          <div className="banner-icon"><Icon name="spark" size={23} /></div>
          <div className="banner-copy"><span>HAVE AN IDEA TAKING SHAPE?</span><h2>Good briefs make great things happen.</h2><p>Tell us what you’re imagining. We’ll help you find the right person to bring it to life.</p></div>
          <button className="button button-light" onClick={openBriefBuilder}>Start a creative brief <Icon name="arrow" size={16} /></button>
          <div className="banner-orb" />
        </section>

        <section className="how-section" id="how-it-works">
          <div className="eyebrow muted-eyebrow">A BETTER WAY TO MAKE THINGS</div><h2>From first thought to final frame.</h2>
          <div className="steps"><article><span>01</span><h3>Find your people</h3><p>Explore distinct creator profiles, real work, and the tools behind every frame.</p></article><article><span>02</span><h3>Share the vision</h3><p>Build a clear brief with the format, style, usage rights, and details that matter.</p></article><article><span>03</span><h3>Make something new</h3><p>Connect on process, collaborate through generations, and create with confidence.</p></article></div>
        </section>

        <section className="data-note">
          <div className="data-note-copy"><div className="eyebrow muted-eyebrow">BUILT FOR AI-NATIVE WORK</div><h2>More than a pretty portfolio.</h2><p>Every profile and brief captures the context behind the creative, so brands can evaluate fit, workflow, and commercial readiness—not just the final image.</p></div>
          <div className="data-model"><div className="model-title"><span className="model-dot" /> A glimpse under the hood <span className="model-live">PROFILE MODEL</span></div><div className="model-row"><span>Creator</span><div><code>specialization</code><code>skills[]</code><code>tools_models[]</code></div></div><div className="model-row"><span>Portfolio item</span><div><code>media_url</code><code>content_type</code><code>workflow</code><code>verified_signals[]</code></div></div><div className="model-row"><span>Creative brief</span><div><code>style</code><code>format_ratio</code><code>usage_rights</code><code>budget</code></div></div><div className="model-footnote">Verification is a signal—not a substitute for reviewing the creator’s process and work.</div></div>
        </section>
      </main>

      <footer className="site-footer"><a className="brand footer-brand" href="#discover" onClick={(event) => { event.preventDefault(); setPage('discover') }}><span className="brand-mark"><span /><span /><span /><span /></span><span>creatorbridge<span className="brand-ai">.ai</span></span></a><span>Made for the next generation of making.</span><span>© 2026 CreatorBridge AI</span></footer>

      {page === 'briefs' && <div className="page-overlay" role="dialog" aria-modal="true" aria-labelledby="briefs-title">
        <section className="briefs-panel">
          <div className="modal-top"><div><div className="eyebrow muted-eyebrow">YOUR CREATIVE PROJECTS</div><h2 id="briefs-title">My briefs<span className="heading-period">.</span></h2></div><button className="icon-button" aria-label="Close briefs" onClick={() => setPage('discover')}><Icon name="close" /></button></div>
          <div className="briefs-intro">Keep your next big idea in one place. Draft a brief, then explore creators who can bring it to life.</div>
          <button className="button button-dark new-brief-button" onClick={openBriefBuilder}><Icon name="plus" size={16} /> Create Creative Brief</button>
          {briefStorageError && <div className="brief-error" role="alert">{briefStorageError}</div>}
          {briefs.length ? <div className="brief-list">{briefs.map((item) => (
            <article className="brief-item" key={item.id}>
              <div className="brief-item-icon"><Icon name="briefcase" /></div>
              <div className="brief-item-content">
                <span className="brief-status">{item.persisted ? 'SAVED TO DATABASE' : 'SAVED ON THIS DEVICE'}</span>
                <h3>{item.title}</h3>
                <p>{item.outputFormat || item.contentType} · {item.format} · {item.usage}{item.referenceFiles?.length ? ` · ${item.referenceFiles.length} reference file${item.referenceFiles.length === 1 ? '' : 's'}` : ''}</p>
                <details className="brief-details">
                  <summary>View project details</summary>
                  <div className="brief-details-content">
                    <p><strong>Description:</strong> {item.projectDescription || item.details || '—'}</p>
                    <p><strong>Target audience:</strong> {item.targetAudience || '—'}</p>
                    <p><strong>Creative style:</strong> {item.style || '—'}</p>
                    <p><strong>Output and delivery:</strong> {item.outputFormat || item.contentType} · {item.format} · {item.duration}</p>
                    <p><strong>Usage rights:</strong> {item.usage}</p>
                    <p><strong>Budget:</strong> {item.budget ? `₹${Number(item.budget).toLocaleString('en-IN')}` : 'Not specified'}{item.deadline ? ` · Deadline ${item.deadline}` : ''}</p>
                    <p><strong>Additional requirements:</strong> {item.additionalRequirements || item.details || '—'}</p>
                    {item.referenceFiles?.length > 0 && <div className="brief-reference-list"><strong>Reference files</strong>{item.referenceFiles.map((path) => <div className="brief-reference-item" key={path}><span>{path.split('/').pop()}</span>{item.persisted && <button type="button" className="brief-reference-download" disabled={briefReferenceBusy === path} onClick={() => downloadBriefReference(path)}>{briefReferenceBusy === path ? 'Downloading…' : 'Download'}</button>}</div>)}</div>}
                  </div>
                </details>
                <button className="brief-match-button" onClick={() => findCreatorsForBrief(item)}>Find creators <Icon name="arrow" size={14} /></button>
              </div>
              <span className="brief-date">{item.created}</span>
            </article>
          ))}</div> : <div className="briefs-empty"><div className="briefs-empty-icon"><Icon name="briefcase" size={23} /></div><h3>Your next project starts here.</h3><p>Create your first creative brief to capture your idea, requirements, and usage needs.</p><button className="text-action" onClick={openBriefBuilder}>Create your first brief <Icon name="arrow" size={15} /></button></div>}
          <div className="demo-note"><Icon name="spark" size={17} /><p><strong>{sessionUser?.role === 'brand' ? 'Your brand workspace:' : 'Database access required:'}</strong> {sessionUser?.role === 'brand' ? 'Brief records are loaded from the configured backend database. Reference files use your private Supabase Storage bucket.' : 'Sign in with a brand account to load and manage database-backed briefs.'}</p></div>
        </section>
      </div>}

      {page === 'account' && sessionUser && <div className="page-overlay" role="dialog" aria-modal="true" aria-labelledby="account-title"><section className="briefs-panel account-panel"><div className="modal-top"><div><div className="eyebrow muted-eyebrow">{sessionUser.role === 'creator' ? 'CREATOR WORKSPACE' : 'BRAND WORKSPACE'}</div><h2 id="account-title">Your account<span className="heading-period">.</span></h2></div><button className="icon-button" aria-label="Close account" onClick={() => setPage('discover')}><Icon name="close" /></button></div><div className="account-identity"><strong>{sessionUser.display_name || sessionUser.company_name || 'CreatorBridge member'}</strong><span>{sessionUser.email}</span><span className="account-role">{sessionUser.role || 'Member'}</span></div><div className="account-summary"><article><strong>{savedIds.length}</strong><span>Saved creators</span></article><article><strong>{briefs.length}</strong><span>Creative briefs</span></article><article><strong>{invitations.length}</strong><span>Invitations</span></article></div><div className="account-actions"><button className="button button-outline" onClick={() => { setPage('saved'); setSelectedCreatorIds([]) }}>Open shortlist</button><button className="button button-outline" onClick={() => setPage('briefs')}>Manage briefs</button><button className="button button-dark" onClick={signOut}>Sign out</button></div><p className="account-note">Creative briefs are loaded from the backend database when configured. Saved creators and invitation activity are kept in this browser. The prototype does not send email or process payments.</p></section></div>}

      {showInstallHelp && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowInstallHelp(false) }}><section className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title"><div className="modal-top"><div><div className="eyebrow muted-eyebrow">TAKE CREATORBRIDGE WITH YOU</div><h2 id="install-title">Install the app<span className="heading-period">.</span></h2></div><button className="icon-button" aria-label="Close install instructions" onClick={() => setShowInstallHelp(false)}><Icon name="close" /></button></div><p className="briefs-intro">Install CreatorBridge on your home screen or desktop for an app-like experience. Your browser may need a secure HTTPS connection.</p><div className="install-instructions"><article><strong>Windows, Mac, or Chromebook</strong><span>Open this site in Chrome or Edge, then use the install icon in the address bar or choose “Install CreatorBridge” from the browser menu.</span></article><article><strong>Android</strong><span>Open this site in Chrome, tap the menu, then choose “Install app” or “Add to Home screen”.</span></article><article><strong>iPhone or iPad</strong><span>Open this site in Safari, tap Share, choose “Add to Home Screen”, then tap Add.</span></article></div></section></div>}

      {showBrief && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !briefSubmitting) setShowBrief(false) }}><section className="brief-modal" role="dialog" aria-modal="true" aria-labelledby="brief-modal-title"><div className="modal-top"><div><div className="eyebrow muted-eyebrow">{submittedBrief ? 'BRIEF SUBMITTED' : 'LET’S MAKE SOMETHING'}</div><h2 id="brief-modal-title">{submittedBrief ? 'A clear brief. Great start' : 'Start with the big idea'}<span className="heading-period">.</span></h2><p className="modal-subtitle">{submittedBrief ? 'Your creative brief has been saved. Review the details below.' : 'A few thoughtful details help creators understand the opportunity.'}</p></div><button className="icon-button" aria-label="Close brief form" disabled={briefSubmitting} onClick={() => { if (!briefSubmitting) setShowBrief(false) }}><Icon name="close" /></button></div>
        {submittedBrief ? <section className="submitted-brief-summary" aria-labelledby="submitted-brief-title">
          <div className="submitted-brief-success" role="status"><span className="toast-check"><Icon name="check" size={14} /></span>Creative Brief saved successfully!</div>
          <article className="submitted-brief-card">
            <div className="submitted-brief-heading"><span className="brief-status">SAVED TO DATABASE</span><h3 id="submitted-brief-title">{submittedBrief.title}</h3></div>
            <dl className="submitted-brief-fields">
              <div><dt>Project description</dt><dd>{submittedBrief.projectDescription}</dd></div>
              <div><dt>Target audience</dt><dd>{submittedBrief.targetAudience}</dd></div>
              <div><dt>Creative style</dt><dd>{submittedBrief.style}</dd></div>
              <div><dt>Output format</dt><dd>{submittedBrief.outputFormat}</dd></div>
              <div><dt>Content type</dt><dd>{submittedBrief.contentType || 'Not specified'}</dd></div>
              <div><dt>Aspect ratio</dt><dd>{submittedBrief.format || 'Not specified'}</dd></div>
              <div><dt>Usage rights</dt><dd>{submittedBrief.usage}</dd></div>
              <div><dt>Deliverable length</dt><dd>{submittedBrief.duration || 'Not specified'}</dd></div>
              <div><dt>Budget</dt><dd>{submittedBrief.budget ? `₹${Number(submittedBrief.budget).toLocaleString('en-IN')}` : 'Not specified'}</dd></div>
              <div><dt>Target delivery date</dt><dd>{submittedBrief.deadline || 'Not specified'}</dd></div>
              <div><dt>Additional requirements</dt><dd>{submittedBrief.additionalRequirements || 'None provided'}</dd></div>
              <div><dt>Reference files</dt><dd>{submittedBrief.referenceFiles?.length ? submittedBrief.referenceFiles.map((path) => path.split('/').pop()).join(', ') : 'None attached'}</dd></div>
            </dl>
          </article>
          <div className="form-actions submitted-brief-actions">
            <button type="button" className="button button-outline" onClick={() => { setSubmittedBrief(null); setBriefError(''); setBriefValidationErrors({}) }}>Create another brief</button>
            <button type="button" className="button button-dark" onClick={() => { setShowBrief(false); setSubmittedBrief(null); setPage('briefs') }}>View my briefs <Icon name="arrow" size={15} /></button>
          </div>
        </section> : <>
        <div className="ai-builder"><span className="ai-builder-icon"><Icon name="spark" size={17} /></span><div className="ai-builder-copy"><strong>Have a rough idea?</strong><span>We’ll shape it into a useful first draft.</span></div><textarea aria-label="Rough creative idea" value={roughIdea} onChange={(event) => setRoughIdea(event.target.value)} placeholder="e.g. A dreamy product film for our new sustainable fragrance..." /><button type="button" className="button button-ai" onClick={buildBrief}>Build my brief <Icon name="arrow" size={14} /></button></div>
        <form className="brief-form" noValidate onSubmit={submitBrief}>
          <label className="form-field full-field">PROJECT NAME <span className="required-mark">REQUIRED</span><input required aria-required="true" aria-invalid={Boolean(briefValidationErrors.title)} aria-describedby={briefValidationErrors.title ? 'brief-title-error' : 'brief-title-help'} maxLength={90} value={brief.title} onChange={(event) => updateBrief('title', event.target.value)} placeholder="e.g. Spring launch campaign" /><span id={briefValidationErrors.title ? 'brief-title-error' : 'brief-title-help'} className={briefValidationErrors.title ? 'field-error' : 'field-help'}>{briefValidationErrors.title || 'Name this creative project.'}</span></label>
          <label className="form-field full-field">PROJECT DESCRIPTION <span className="required-mark">REQUIRED</span><textarea required aria-required="true" aria-invalid={Boolean(briefValidationErrors.projectDescription)} aria-describedby={briefValidationErrors.projectDescription ? 'brief-description-error' : 'brief-description-help'} rows="3" maxLength={2000} value={brief.projectDescription} onChange={(event) => updateBrief('projectDescription', event.target.value)} placeholder="Describe your project, goals, and what you want the creator to make" /><span id={briefValidationErrors.projectDescription ? 'brief-description-error' : 'brief-description-help'} className={briefValidationErrors.projectDescription ? 'field-error' : 'field-help'}>{briefValidationErrors.projectDescription || 'Share the context and outcome you are looking for.'}</span></label>
          <label className="form-field full-field">TARGET AUDIENCE <span className="required-mark">REQUIRED</span><input required aria-required="true" aria-invalid={Boolean(briefValidationErrors.targetAudience)} aria-describedby={briefValidationErrors.targetAudience ? 'brief-audience-error' : 'brief-audience-help'} maxLength={500} value={brief.targetAudience} onChange={(event) => updateBrief('targetAudience', event.target.value)} placeholder="e.g. First-time founders and small business owners" /><span id={briefValidationErrors.targetAudience ? 'brief-audience-error' : 'brief-audience-help'} className={briefValidationErrors.targetAudience ? 'field-error' : 'field-help'}>{briefValidationErrors.targetAudience || 'Who should this creative work reach?'}</span></label>
          <label className="form-field">CREATIVE STYLE <span className="required-mark">REQUIRED</span><select required aria-required="true" aria-invalid={Boolean(briefValidationErrors.style)} aria-describedby={briefValidationErrors.style ? 'brief-style-error' : undefined} value={brief.style} onChange={(event) => updateBrief('style', event.target.value)}><option value="">Select a style</option><option>Modern</option><option>Realistic</option><option>Cinematic</option><option>Minimalist</option><option>Professional</option><option>Artistic</option><option>Other</option></select>{briefValidationErrors.style && <span id="brief-style-error" className="field-error">{briefValidationErrors.style}</span>}</label>
          <label className="form-field">OUTPUT FORMAT <span className="required-mark">REQUIRED</span><select required aria-required="true" aria-invalid={Boolean(briefValidationErrors.outputFormat)} aria-describedby={briefValidationErrors.outputFormat ? 'brief-output-error' : undefined} value={brief.outputFormat} onChange={(event) => updateBrief('outputFormat', event.target.value)}><option value="">Select an output format</option><option>Image</option><option>Video</option><option>Website Design</option><option>Social Media Content</option><option>Advertisement</option><option>Other</option></select>{briefValidationErrors.outputFormat && <span id="brief-output-error" className="field-error">{briefValidationErrors.outputFormat}</span>}</label>
          <label className="form-field">CONTENT TYPE<select value={brief.contentType} onChange={(event) => updateBrief('contentType', event.target.value)}><option>Film & video</option><option>Animation</option><option>Images & campaign assets</option><option>3D & immersive</option><option>Something else</option></select></label>
          <label className="form-field">FORMAT / ASPECT RATIO<select value={brief.format} onChange={(event) => updateBrief('format', event.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option><option>Multiple formats</option><option>Creator to recommend</option></select></label>
          <label className="form-field">USAGE RIGHTS<select value={brief.usage} onChange={(event) => updateBrief('usage', event.target.value)}><option>Personal Use</option><option>Commercial Use</option><option>Educational Use</option><option>Other</option></select></label>
          <label className="form-field">BUDGET (INR)<input inputMode="numeric" type="number" min="0" max="100000000" value={brief.budget} onChange={(event) => updateBrief('budget', event.target.value)} placeholder="e.g. 25000 (optional)" /></label>
          <label className="form-field">DELIVERABLE LENGTH<select value={brief.duration} onChange={(event) => updateBrief('duration', event.target.value)}><option>15–30 seconds</option><option>Under 15 seconds</option><option>30–60 seconds</option><option>60+ seconds</option><option>Not applicable / images</option></select></label>
          <label className="form-field">TARGET DELIVERY DATE<input type="date" value={brief.deadline} onChange={(event) => updateBrief('deadline', event.target.value)} /></label>
          <label className="form-field full-field">REFERENCE IMAGES OR FILES<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,image/tiff,image/heic,image/heif,.pdf,.doc,.docx,.txt" multiple aria-invalid={Boolean(briefValidationErrors.referenceFiles)} aria-describedby={briefValidationErrors.referenceFiles ? 'brief-files-error' : 'brief-files-help'} onChange={(event) => { setReferenceFiles(Array.from(event.target.files || [])); setBriefError(''); setBriefValidationErrors((previous) => { const next = { ...previous }; delete next.referenceFiles; return next }) }} /><span id={briefValidationErrors.referenceFiles ? 'brief-files-error' : 'brief-files-help'} className={briefValidationErrors.referenceFiles ? 'field-error' : 'file-upload-help'}>{briefValidationErrors.referenceFiles || 'Optional · Up to 5 files · JPG, PNG, WebP, GIF, AVIF, BMP, TIFF, HEIC/HEIF, PDF, DOC, DOCX, or TXT · max 10 MB each'}</span>{referenceFiles.length > 0 && <span className="selected-files">{referenceFiles.map((file) => file.name).join(' · ')}</span>}</label>
          <label className="form-field full-field">ADDITIONAL REQUIREMENTS<textarea rows="3" maxLength={2000} value={brief.additionalRequirements} onChange={(event) => updateBrief('additionalRequirements', event.target.value)} placeholder="Mention deliverables, workflow, deadlines, or other requirements" /></label>
          <div className="usage-note"><Icon name="check" size={15} /><span>Be clear about where and how you’ll use the work. Final licensing terms can be agreed directly with your creator.</span></div>
          {briefError && <div className="brief-error full-field" role="alert">{briefError}{supabase && (!sessionUser || sessionUser.role !== 'brand') && <button type="button" className="brief-auth-link" onClick={() => { setShowBrief(false); setRole('Brand'); setPage('register') }}>Sign in or create a brand account</button>}</div>}
          {!supabase && <div className="brief-local-note full-field">Demo mode: this brief and its reference-file names will be saved in this browser only.</div>}
          <div className="form-actions"><button type="button" className="text-action" onClick={() => setShowBrief(false)} disabled={briefSubmitting}>Cancel</button><button className="button button-dark" type="submit" disabled={briefSubmitting}>{briefSubmitting ? 'Uploading & submitting…' : 'Submit Brief'} {!briefSubmitting && <Icon name="arrow" size={15} />}</button></div>
        </form>
        </>}
      </section></div>}

      {selectedCreator && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCreator(null) }}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-name"><button className="icon-button profile-close" aria-label="Close profile" onClick={() => setSelectedCreator(null)}><Icon name="close" /></button><div className="profile-header"><img src={selectedCreator.avatar} alt="" /><div><span className="profile-specialty">{selectedCreator.specialty}</span><h2 id="profile-name">{selectedCreator.name}</h2><span className="creator-location"><Icon name="pin" size={13} /> {selectedCreator.location} <span className="profile-dot">·</span> {selectedCreator.completed} projects</span></div></div><p className="profile-bio">{selectedCreator.bio}</p>{selectedCreator.portfolioDescription && <p className="profile-portfolio-description">{selectedCreator.portfolioDescription}</p>}<div className="verification-block"><div className="profile-section-label">TRUST SIGNALS <span>Creator-reported, with work reviewed</span></div><div className="verification-list">{selectedCreator.verified.length ? selectedCreator.verified.map((item) => <span key={item}><span className="verified-check"><Icon name="check" size={12} /></span>{item}</span>) : <span>Not yet verified</span>}{selectedCreator.completionRate > 0 && <span>{selectedCreator.completionRate}% project completion</span>}</div></div><div className="profile-section-label work-label">SELECTED WORK <span>Click a piece to view the workflow</span></div><div className="profile-projects">{selectedCreator.projects.map((project) => <button key={project.title} onClick={() => notify(`Workflow: ${selectedCreator.workflow}`)}>{project.videoUrl ? <video src={project.videoUrl} poster={portfolioImageSrc(project.image, 500)} muted playsInline controls preload="none" aria-label={`${project.title} video`} /> : project.image ? <img src={portfolioImageSrc(project.image, 500)} alt="" /> : <div className="project-media-placeholder">Portfolio preview</div>}<span>{project.title}<small>{project.category}</small></span></button>)}</div><div className="profile-details"><div><div className="profile-section-label">TOOLS & MODELS</div><div className="profile-chip-list">{selectedCreator.tools.map((item) => <span key={item}>{item}</span>)}</div></div><div><div className="profile-section-label">SKILLS</div><div className="profile-chip-list">{selectedCreator.skills.map((item) => <span key={item}>{item}</span>)}</div></div><div><div className="profile-section-label">FORMATS</div><div className="profile-chip-list">{selectedCreator.formats.map((item) => <span key={item}>{item}</span>)}</div></div>{selectedCreator.experience && <div><div className="profile-section-label">EXPERIENCE</div><div className="profile-chip-list"><span>{selectedCreator.experience}</span></div></div>}</div><div className="workflow-card"><div className="profile-section-label"><Icon name="spark" size={14} /> HOW I MAKE IT</div><p>{selectedCreator.workflow}</p></div><div className="profile-bottom"><span><span className={selectedCreator.availability === 'Available now' ? 'availability-dot' : 'availability-dot later'} />{selectedCreator.availability}</span><span>{selectedCreator.minimumBudget ? <>Project range <strong>₹{selectedCreator.minimumBudget.toLocaleString('en-IN')}–₹{selectedCreator.maximumBudget.toLocaleString('en-IN')}</strong></> : <>From <strong>{selectedCreator.rate}</strong> / day</>}</span><button className="button button-dark" onClick={() => { setSelectedCreator(null); openBriefBuilder() }}>Start a conversation <Icon name="arrow" size={15} /></button></div></section></div>}
      {notice && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={14} /></span>{notice}</div>}
    </div>
  )
}

export default App
