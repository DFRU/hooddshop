import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Sweepstakes Rules | Hood'd",
  description: "Official rules for the Hood'd Weekly Draw sweepstakes.",
};

export default function OfficialRulesPage() {
  return (
    <main
      className="max-w-3xl mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)] pt-24 pb-16"
      style={{ color: "var(--color-text-muted)" }}
    >
      <h1 className="text-display-lg text-white mb-8">Official Sweepstakes Rules</h1>
      <p className="text-body-sm mb-6" style={{ color: "#555" }}>Last updated: April 2026</p>

      <div className="space-y-8 text-body-sm leading-relaxed">
        <section>
          <h2 className="text-display-sm text-white mb-3">1. Sponsor</h2>
          <p>The Hood&apos;d Weekly Draw (&quot;Sweepstakes&quot;) is sponsored by Hood&apos;d (&quot;Sponsor&quot;), contactable at contact@hooddshop.com.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">2. No Purchase Necessary</h2>
          <p>NO PURCHASE OR PAYMENT OF ANY KIND IS NECESSARY TO ENTER OR WIN. A purchase will not improve your chances of winning. Void where prohibited by law.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">3. Eligibility</h2>
          <p>Open to individuals who are 18 years of age or older at the time of entry. Employees, officers, and directors of the Sponsor and their immediate family members are not eligible. Subject to all applicable federal, state, provincial, and local laws and regulations.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">4. Entry Period</h2>
          <p>Each Sweepstakes period runs from Sunday 00:00 UTC through the following Saturday 23:59 UTC (&quot;Entry Period&quot;). The Sponsor reserves the right to modify the schedule with reasonable notice posted on this page.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">5. How to Enter</h2>
          <p>To enter, subscribe to the Hood&apos;d mailing list at hooddshop.com by providing a valid email address during an active Entry Period. Limit one (1) entry per person per Entry Period. Entries received outside an active Entry Period will be applied to the next available period. Automated or programmatic entries are prohibited.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">6. Prize</h2>
          <p>One (1) winner per Entry Period will receive one (1) Hood&apos;d custom sublimation-printed car hood cover in the nation design of their choice. Approximate retail value: $49.99 USD. Prize is non-transferable and no cash alternative is available. Sponsor reserves the right to substitute a prize of equal or greater value.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">7. Winner Selection and Notification</h2>
          <p>One (1) winner will be selected at random from all eligible entries received during the Entry Period. The drawing will be conducted by the Sponsor within 48 hours of the close of each Entry Period. The winner will be notified via the email address provided at entry. If the winner does not respond within fourteen (14) days, the prize will be forfeited and an alternate winner may be selected.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">8. Odds of Winning</h2>
          <p>Odds of winning depend on the total number of eligible entries received during each Entry Period.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">9. Privacy</h2>
          <p>Email addresses collected for entry are subject to the Sponsor&apos;s <a href="/privacy" className="underline" style={{ color: "var(--color-accent)" }}>Privacy Policy</a>. Email addresses will be used for Sweepstakes administration and, if opted in, marketing communications. Subscribers may unsubscribe at any time via the link in any email.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">10. General Conditions</h2>
          <p>By entering, participants agree to be bound by these Official Rules and the decisions of the Sponsor, which are final. The Sponsor reserves the right to cancel, suspend, or modify the Sweepstakes if fraud, technical failures, or any factor beyond the Sponsor&apos;s control impairs the integrity of the Sweepstakes. The Sponsor is not responsible for lost, late, misdirected, or incomplete entries.</p>
        </section>

        <section>
          <h2 className="text-display-sm text-white mb-3">11. Governing Law</h2>
          <p>This Sweepstakes is governed by the laws of the United States. Any disputes arising from or relating to this Sweepstakes shall be resolved in the courts of the Sponsor&apos;s jurisdiction.</p>
        </section>
      </div>
    </main>
  );
}
