import Protected from '@/components/Protected'
export default function Billing(){
  const portal = process.env.STRIPE_CUSTOMER_PORTAL_URL || '#TODO_STRIPE_PORTAL_URL'
  return (
    <Protected>
      <main className="container py-16">
        <h1>Billing</h1>
        <div className="card p-6 mt-6">
          <div className="text-slate-700">Manage payment method, change plan, or cancel anytime.</div>
          <a href={portal} className="btn btn-primary mt-4">Open billing portal</a>
          <div className="text-xs text-slate-500 mt-2">Set <code>STRIPE_CUSTOMER_PORTAL_URL</code> to your portal link.</div>
        </div>
      </main>
    </Protected>
  )
}
