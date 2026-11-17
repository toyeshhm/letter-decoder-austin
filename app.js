const $ = id => document.getElementById(id)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const CAT_ART = { housing_eviction: 'cat-housing', utility_shutoff: 'cat-utility', immigration: 'cat-immigration', debt_collection: 'cat-money', taxes_irs: 'cat-money', medical_bills: 'cat-money', benefits: 'cat-money', school: 'cat-school', court_legal: 'cat-court', other: 'reading' }
const EMPTY = { art: '/assets/empty-state.webp', text: '' }

// scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: 0.15 })
document.querySelectorAll('.reveal').forEach(el => io.observe(el))

// parallax
const layers = [...document.querySelectorAll('[data-parallax]')]
if (!reduced) addEventListener('scroll', () => requestAnimationFrame(() => layers.forEach(el => {
  const r = el.getBoundingClientRect()
  el.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * Number(el.dataset.parallax)}px)`
})), { passive: true })

// scroll progress + nav state
const bar = $('progress'), nav = document.querySelector('.nav')
addEventListener('scroll', () => {
  const k = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)
  bar.style.transform = `scaleX(${k})`; nav.classList.toggle('scrolled', scrollY > 40)
}, { passive: true })

// 3D tilt on cards
if (!reduced && matchMedia('(hover:hover)').matches) document.querySelectorAll('.how figure, .cat, .decode-card').forEach(el => {
  el.classList.add('tilt')
  const max = el.classList.contains('decode-card') ? 3 : 8
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5
    el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-4px)`
  })
  el.addEventListener('mouseleave', () => { el.style.transform = '' })
})

async function toJpeg(blob) {
  const img = await createImageBitmap(blob)
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85)
}

const card = document.querySelector('.decode-card')
function setBusy(on) {
  card.classList.toggle('busy', on)
  clearInterval(setBusy.t)
  if (!on) return
  const lang = $('lang').selectedOptions[0].textContent
  const lines = ['Reading your letter…', 'Finding the deadline…', `Writing it in ${lang}…`, 'Looking up free help in Austin…', 'Almost there…']
  let i = 0; $('statusText').textContent = lines[0]
  setBusy.t = setInterval(() => { i = Math.min(i + 1, lines.length - 1); $('statusText').textContent = lines[i] }, 3200)
}

async function decode(blob) {
  $('error').classList.remove('on'); $('result').classList.remove('on')
  document.getElementById('decode').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  setBusy(true)
  try {
    const dataUrl = await toJpeg(blob)
    $('thumb').src = dataUrl; $('thumb').parentElement.classList.add('has-photo')
    const r = await fetch('/api/decode', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl.split(',')[1], mime: 'image/jpeg', language: $('lang').value }) })
    const out = await r.json()
    if (!r.ok) throw new Error(out.error || 'Something went wrong.')
    if (!out.is_letter) throw new Error("That doesn't look like a letter. Try a photo of the whole page.")
    render(out)
  } catch (e) {
    $('error').textContent = e.message || 'Something went wrong. Please try again.'; $('error').classList.add('on')
  } finally { setBusy(false) }
}

function countUp(el, to) {
  if (reduced || to <= 0) { el.textContent = to; return }
  const t0 = performance.now()
  const step = t => { const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - (1 - k) ** 3)); k < 1 && requestAnimationFrame(step) }
  requestAnimationFrame(step)
}

function render(o) {
  const L = o.labels, res = $('result')
  res.dir = o.rtl ? 'rtl' : 'ltr'
  $('r-art').src = `/assets/${CAT_ART[o.category] ?? 'reading'}.webp`
  $('r-urg').textContent = o.urgency === 'high' ? '⚠ Urgent' : o.urgency === 'medium' ? 'Soon' : 'Not urgent'
  $('r-urg').className = 'pill ' + o.urgency
  $('r-from').textContent = o.from; $('r-title').textContent = o.title
  $('l-summary').textContent = L.summary; $('r-summary').textContent = o.summary
  $('l-deadline').textContent = L.deadline; $('r-deadline').textContent = o.deadline_text
  const ring = $('ring'); ring.style.strokeDashoffset = 327
  if (o.deadline_date) {
    const due = new Date(o.deadline_date + 'T23:59')
    const days = Math.max(0, Math.ceil((due - new Date()) / 864e5))
    $('r-date').textContent = due.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    countUp($('r-days'), days); $('r-dayslabel').textContent = days === 1 ? 'day' : 'days'
    requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = 327 * Math.min(1, days / 30) }))
  } else { $('r-date').textContent = ''; $('r-days').textContent = '—'; $('r-dayslabel').textContent = '' }
  $('l-ignore').textContent = L.if_ignored; $('r-ignore').textContent = o.if_ignored
  $('l-steps').textContent = L.next_steps
  $('r-steps').replaceChildren(...o.next_steps.map(s => Object.assign(document.createElement('li'), { textContent: s })))
  $('l-help').textContent = L.who_can_help
  $('s-name').textContent = o.service.name; $('s-what').textContent = o.service.what
  $('s-call').textContent = '📞 ' + L.call + ' ' + o.service.phone
  $('s-call').href = 'tel:' + o.service.phone.replace(/ext.*$/i, '').replace(/[^\d+]/g, '')
  $('s-web').textContent = L.website + ' ↗'; $('s-web').href = o.service.url
  $('l-note').textContent = L.not_advice
  res.classList.add('on'); res.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

$('pick').onclick = () => $('file').click()
$('file').onchange = e => e.target.files[0] && decode(e.target.files[0])
document.querySelectorAll('[data-sample]').forEach(b => b.onclick = async () => decode(await (await fetch('/assets/sample-letter.jpg')).blob()))
$('again').onclick = () => {
  $('result').classList.remove('on'); $('thumb').src = EMPTY.art; $('thumb').parentElement.classList.remove('has-photo')
  document.getElementById('decode').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
}
