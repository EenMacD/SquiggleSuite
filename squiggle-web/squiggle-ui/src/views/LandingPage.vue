<template>
  <div class="landing">
    <!-- Nav -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <svg class="nav-logo" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="#3B82F6" stroke-width="2.5"/><path d="M10 20c2-4 4-8 6-8s4 4 6 8" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="12" r="2.5" fill="#3B82F6"/></svg>
          <span class="nav-title">Squiggle</span>
        </div>
        <div class="nav-links">
          <a href="#features" class="nav-link">Features</a>
          <a href="#download" class="nav-link">Download</a>
          <router-link to="/app" class="nav-cta">Open App</router-link>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="pitch-lines"></div>
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
      </div>
      <div class="hero-content">
        <div class="badge">🏉 Rugby Play Designer</div>
        <h1 class="hero-title">Design Rugby Plays,<br/><span class="gradient-text">Visually.</span></h1>
        <p class="hero-sub">Draw running lines, set up sequences, and animate your plays in real-time. Built for coaches, analysts, and players.</p>
        <div class="hero-actions">
          <router-link to="/app" class="btn btn-primary btn-lg" id="hero-try-live">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Try It Live
          </router-link>
          <a href="#download" class="btn btn-outline btn-lg" id="hero-download">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download
          </a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="features">
      <h2 class="section-title">Everything You Need</h2>
      <p class="section-sub">Powerful tools to design, animate, and share rugby plays.</p>
      <div class="feature-grid">
        <div class="feature-card" v-for="f in features" :key="f.title">
          <div class="feature-icon" v-html="f.icon"></div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Download -->
    <section id="download" class="download">
      <h2 class="section-title">Download the Desktop App</h2>
      <p class="section-sub">Native performance. Offline support. Available for all major platforms.</p>
      <div class="download-grid">
        <a v-for="p in platforms" :key="p.os" :href="p.url" class="download-card" :class="{ recommended: p.recommended }" target="_blank" rel="noopener" :id="'download-' + p.os.toLowerCase()">
          <div v-if="p.recommended" class="rec-badge">Recommended</div>
          <div class="os-icon" v-html="p.icon"></div>
          <h3>{{ p.os }}</h3>
          <p class="os-ext">{{ p.ext }}</p>
          <span class="dl-btn">Download</span>
        </a>
      </div>
      <p class="download-note">Desktop builds coming soon — <a :href="releasesUrl" target="_blank" rel="noopener">watch releases on GitHub</a></p>
    </section>

    <!-- Web CTA -->
    <section class="web-cta">
      <div class="cta-card">
        <h2>Don't want to install anything?</h2>
        <p>Use Squiggle right in your browser. No download required.</p>
        <router-link to="/app" class="btn btn-primary btn-lg" id="cta-try-live">Try It Live →</router-link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <span>© {{ year }} Squiggle</span>
        <a :href="releasesUrl" target="_blank" rel="noopener">GitHub</a>
        <span class="version">v0.1.0</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const year = new Date().getFullYear()
const releasesUrl = 'https://github.com/EenMacD/SquiggleSuite/releases'

const detectedOS = ref('')
onMounted(() => {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) detectedOS.value = 'Windows'
  else if (ua.includes('mac')) detectedOS.value = 'macOS'
  else if (ua.includes('linux')) detectedOS.value = 'Linux'
})

const features = [
  { title: 'Draw Running Lines', desc: 'Click a player and sketch their path. Intuitive freehand drawing on a scaled rugby pitch.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M3 17c3-4 6-12 9-8s3 8 6 4" stroke-linecap="round"/></svg>' },
  { title: 'Phases & Sequences', desc: 'Build multi-phase plays with ordered sequences. Chain together complex team movements.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="8" y="14" width="7" height="7" rx="1"/><path d="M10 7h4M6.5 10v4.5h2M17.5 10v4.5h-2"/></svg>' },
  { title: 'Real-time Playback', desc: 'Animate your entire play. Watch players run their lines with ball passes and timed events.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><polygon points="5 3 19 12 5 21 5 3"/></svg>' },
  { title: 'Speed & Timing', desc: 'Control individual player speed and start delays. Fine-tune every detail of your play.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>' },
  { title: 'Ball Passing', desc: 'Set up timed passes between players. The ball follows realistic trajectories during playback.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="12" cy="12" r="4"/><path d="M4 12h4M16 12h4M12 4v4M12 16v4"/></svg>' },
  { title: 'Save & Record', desc: 'Save your plays locally. Record animated playback for review and sharing with your team.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' },
]

const platforms = [
  { os: 'Windows', ext: '.exe', url: releasesUrl, icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M3 12V6.5l8-1.1V12H3zm0 .5h8v6.6l-8-1.1V12.5zm9-7.7L22 3.5V12h-10V4.8zm0 7.7H22v8.5l-10-1.3V12.5z"/></svg>', recommended: false },
  { os: 'macOS', ext: '.dmg', url: releasesUrl, icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>', recommended: false },
  { os: 'Linux', ext: '.AppImage', url: releasesUrl, icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M12.5 2c-.6 0-1.1.6-1 1.2.2 1.3-.2 2-1 2.8C9.3 7.2 8.5 9 9 11c-1.5.5-2.5 1.5-3 3-.7 2.1.3 4.4 2.3 5.3.3.2.7.3 1 .4 1 2 3 3.3 5.2 3.3 2.7 0 5-2.2 5-5 0-.3 0-.7-.1-1 1.3-1 2.1-2.6 2.1-4.3 0-2-1.1-3.8-2.8-4.7.1-.5.1-1 0-1.5-.3-1.2-1.4-2-2.6-1.8-.7-1.7-2.2-2.7-3.6-2.7z"/></svg>', recommended: false },
]

// Auto-mark detected OS as recommended
onMounted(() => {
  platforms.forEach(p => {
    p.recommended = p.os === detectedOS.value
  })
})
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--bg);
  overflow-x: hidden;
}

/* Nav */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(71, 85, 105, 0.25);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between; height: 64px;
}
.nav-brand { display: flex; align-items: center; gap: 10px; }
.nav-logo { width: 32px; height: 32px; }
.nav-title { font-weight: 800; font-size: 1.25rem; background: linear-gradient(135deg, #F8FAFC, #94A3B8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.nav-links { display: flex; align-items: center; gap: 24px; }
.nav-link { color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color .2s; }
.nav-link:hover { color: var(--text); }
.nav-cta {
  padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 0.875rem;
  background: var(--accent); color: #fff; text-decoration: none; transition: all .2s;
}
.nav-cta:hover { background: var(--accent-hover); transform: translateY(-1px); }

/* Hero */
.hero {
  position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 120px 24px 80px; text-align: center;
}
.hero-bg {
  position: absolute; inset: 0; overflow: hidden;
}
.pitch-lines {
  position: absolute; inset: 0; opacity: 0.04;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 98px, rgba(255,255,255,0.5) 98px, rgba(255,255,255,0.5) 100px),
    repeating-linear-gradient(90deg, transparent, transparent 68px, rgba(255,255,255,0.5) 68px, rgba(255,255,255,0.5) 70px);
}
.glow {
  position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15;
}
.glow-1 { width: 600px; height: 600px; background: #3B82F6; top: -200px; right: -100px; animation: float 8s ease-in-out infinite; }
.glow-2 { width: 500px; height: 500px; background: #8B5CF6; bottom: -150px; left: -100px; animation: float 10s ease-in-out infinite reverse; }
@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

.hero-content { position: relative; z-index: 1; max-width: 700px; }
.badge {
  display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
  background: rgba(59, 130, 246, 0.12); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.2);
  margin-bottom: 24px; letter-spacing: 0.02em;
}
.hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; line-height: 1.05;
  color: var(--text); margin-bottom: 20px; letter-spacing: -0.03em;
}
.gradient-text {
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hero-sub {
  font-size: 1.15rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 36px; max-width: 540px; margin-left: auto; margin-right: auto;
}
.hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
  border-radius: 10px; font-weight: 600; font-size: 0.95rem; text-decoration: none;
  transition: all .25s var(--ease); cursor: pointer; border: none;
}
.btn-lg { padding: 14px 32px; font-size: 1rem; }
.btn-primary { background: var(--accent); color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
.btn-primary:hover { background: var(--accent-hover); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.45); }
.btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border-strong); }
.btn-outline:hover { background: rgba(51,65,85,0.4); border-color: var(--text-secondary); transform: translateY(-2px); }

/* Features */
.features {
  padding: 100px 24px; max-width: 1200px; margin: 0 auto;
}
.section-title { text-align: center; font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px; }
.section-sub { text-align: center; color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 56px; }
.feature-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;
}
.feature-card {
  padding: 32px; border-radius: 16px;
  background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.3);
  transition: all .3s var(--ease);
}
.feature-card:hover { transform: translateY(-4px); border-color: rgba(59, 130, 246, 0.3); background: rgba(30, 41, 59, 0.8); }
.feature-icon { margin-bottom: 16px; color: #60A5FA; }
.feature-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.feature-card p { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; }

/* Download */
.download {
  padding: 100px 24px; max-width: 900px; margin: 0 auto;
}
.download-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
.download-card {
  position: relative; padding: 36px 24px; border-radius: 16px; text-align: center;
  background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.3);
  text-decoration: none; color: var(--text); transition: all .3s var(--ease); cursor: pointer;
}
.download-card:hover { transform: translateY(-4px); border-color: rgba(59, 130, 246, 0.4); }
.download-card.recommended { border-color: rgba(59, 130, 246, 0.5); background: rgba(59, 130, 246, 0.08); }
.rec-badge {
  position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  padding: 3px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 700;
  background: var(--accent); color: #fff; white-space: nowrap;
}
.os-icon { margin-bottom: 16px; color: var(--text-secondary); display: flex; justify-content: center; }
.download-card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 4px; }
.os-ext { color: var(--muted); font-size: 0.8rem; margin-bottom: 16px; }
.dl-btn {
  display: inline-block; padding: 8px 24px; border-radius: 8px; font-weight: 600; font-size: 0.85rem;
  background: rgba(59, 130, 246, 0.15); color: #60A5FA; transition: all .2s;
}
.download-card:hover .dl-btn { background: var(--accent); color: #fff; }
.download-note { text-align: center; color: var(--muted); font-size: 0.85rem; }
.download-note a { color: #60A5FA; text-decoration: none; }
.download-note a:hover { text-decoration: underline; }

/* Web CTA */
.web-cta { padding: 60px 24px 100px; }
.cta-card {
  max-width: 640px; margin: 0 auto; padding: 48px; border-radius: 20px; text-align: center;
  background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.cta-card h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
.cta-card p { color: var(--text-secondary); margin-bottom: 24px; }

/* Footer */
.footer {
  border-top: 1px solid rgba(71, 85, 105, 0.25); padding: 24px;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 24px;
  color: var(--muted); font-size: 0.8rem;
}
.footer-inner a { color: var(--text-secondary); text-decoration: none; }
.footer-inner a:hover { color: var(--text); }
.version { opacity: 0.5; }

/* Mobile */
@media (max-width: 768px) {
  .download-grid { grid-template-columns: 1fr; max-width: 320px; margin-left: auto; margin-right: auto; }
  .nav-links { gap: 12px; }
  .nav-link { display: none; }
  .feature-grid { grid-template-columns: 1fr; }
}
</style>
