export default function StripeOnboardingPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl text-center min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Trax payment verification opens Wednesday</h1>
      <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
        Your profile is set up. Trax's payment infrastructure is being finalized — your Stripe verification link will arrive via email Wednesday morning. Until then, customize your storefront, prepare your inventory, and get familiar with the platform.
      </p>
      
      <p className="mt-6 text-sm text-muted-foreground">
        Questions? DM @TraxMarketplace.<br/>
        — Jackson, Trax Founder
      </p>
    </div>
  );
}
