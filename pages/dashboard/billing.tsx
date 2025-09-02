import Protected from '@/components/Protected'
export default function Billing(){
  const portal = process.env.STRIPE_CUSTOMER_PORTAL_URL || 'https://billing.stripe.com/p/login/5kA7tX49H7PNbAs288 '
  return (
    <Protected>
      <main className="container py-16">
        <h1>Billing</h1>
        <div className="card p-6 mt-6">
          <div className="text-slate-700">Manage payment method, change plan, or cancel anytime.</div>
          <a href={portal} className="btn btn-primary mt-4">Open billing portal</a>
        </div>
      </main>
    </Protected>
  )
}
