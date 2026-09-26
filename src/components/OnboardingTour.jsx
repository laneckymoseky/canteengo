import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const WORKER_STEPS = [
  {
    title: 'Welcome to Roam Bites 🎉',
    body: "Order your food before you even leave your desk, and skip the lunch line entirely.",
  },
  {
    title: 'Browse today\'s menu',
    body: 'Filter by category (breakfast, lunch, specials, drinks) or search for something specific like "rice" or "chicken".',
  },
  {
    title: 'Pay your way',
    body: 'Choose M-Pesa STK push for instant payment, or "Pay in person" if you\'d rather hand over cash at the counter.',
  },
  {
    title: 'Track your order',
    body: 'Once paid, watch your order move from Preparing → Ready for pickup in real time on the Track orders tab. You can also chat with the cook if something\'s unclear.',
  },
]

const COOK_STEPS = [
  {
    title: 'Welcome to the kitchen side 👨‍🍳',
    body: "This is where you manage today's menu and keep orders moving.",
  },
  {
    title: 'Set today\'s menu',
    body: 'Go to "Menu & stock" to pull dishes from the master catalog and set today\'s price and stock quantity.',
  },
  {
    title: 'Work the order queue',
    body: 'New orders appear automatically. Cash orders need you to confirm payment before preparing starts — look for the red "Cash — verify" badge.',
  },
  {
    title: 'Post announcements',
    body: 'Use "Announce" to tell everyone when a fresh batch is ready — you can even attach a photo.',
  },
]

export default function OnboardingTour({ role, onFinish }) {
  const [step, setStep] = useState(0)
  const steps = role === 'cook' || role === 'admin' ? COOK_STEPS : WORKER_STEPS
  const isLast = step === steps.length - 1

  async function finish() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      await supabase
        .from('profiles')
        .update({ has_completed_tour: true })
        .eq('id', sessionData.session.user.id)
    }
    onFinish()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,26,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div className="card" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)' }}>{steps[step].title}</h3>
        <p style={{ color: 'var(--roam-charcoal)' }}>{steps[step].body}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '16px 0' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === step ? 'var(--roam-orange)' : 'var(--roam-border)',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={finish} style={{ flex: 1 }}>
            Skip
          </button>
          <button onClick={() => (isLast ? finish() : setStep(step + 1))} style={{ flex: 1 }}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
