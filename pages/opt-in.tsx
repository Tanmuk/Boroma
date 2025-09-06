import Image from "next/image";

export default function OptInProof() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Proof of Consent – Customer Dashboard
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          This page demonstrates where Boroma customers add their phone number
          and agree to receive account-related SMS updates. This dashboard is
          normally behind login.
        </p>

        <div className="mb-6">
          <Image
            src="/dashboard-screenshot.png"
            alt="Boroma customer dashboard showing Members section with phone number input and account controls"
            width={1200}
            height={800}
            className="rounded-lg border"
          />
          <p className="text-xs text-gray-500 mt-2">
            Location: <strong>Customer Dashboard → Members</strong>. Users
            provide their number and manage/remove it. Page also links to Terms
            of Service & Privacy Policy.
          </p>
        </div>

        <div className="bg-gray-900 text-gray-100 text-sm font-mono rounded-md p-4 mb-6 overflow-x-auto">
          I agree to be contacted by phone and to receive SMS updates about my
          support requests from Boroma. Msg &amp; data rates may apply. Msg
          frequency varies. Reply STOP to opt out, HELP for help.
        </div>

        <p className="text-gray-700 text-sm">
          We log consent with timestamp and account ID. Users can remove their
          number or cancel their plan at any time from the same dashboard.
        </p>

        <footer className="text-gray-500 text-xs text-center mt-8">
          Boroma is operated by <strong>Design Duty Ltd</strong>, a UK
          registered company (No. 15112864). <br />
          This page is solely to assist carrier/Twilio review.
        </footer>
      </div>
    </main>
  );
}
