export default function IncentiveInfo() {
  const sections = [
    {
      title: 'Monthly Target',
      items: [
        'Every FRO has a monthly donation collection target set by the NGO Admin.',
        'First 3 months: Target is auto-calculated based on your salary & joining date.',
        'After 3 months: NGO Admin sets the target manually.',
        'You can see your current target, collected amount, and remaining on the Dashboard.',
        'All incentives depend on meeting this monthly target.',
      ],
    },
    {
      title: 'Aaj Ka Incentive (Daily Achievement)',
      items: [
        'Your daily achievement amount is logged by HR/Admin for each day you work.',
        'At month end, your total daily achievements are summed up (totalAKI).',
        'AKI payout rules:',
        '  • Monthly target must be met — if not met, AKI = ₹0.',
        '  • New joiners (≤3 months): AKI payout = totalAKI × 100% (full amount).',
        '  • Regular FROs (>3 months): AKI payout = totalAKI × 50% (half amount).',
        'Example: If totalAKI = ₹10,000 and target is met — new joiner gets ₹10,000, regular gets ₹5,000.',
      ],
    },
    {
      title: 'Monthly Incentive (10% of Excess)',
      items: [
        'If your total collection exceeds the monthly target, you earn 10% of the EXCESS amount.',
        'Formula: (Total Collected − Monthly Target) × 10%',
        'Example: Target = ₹50,000, Collected = ₹65,000 → Excess = ₹15,000 → Monthly Incentive = ₹1,500.',
        'No incentive is paid if collection is below or equal to the target.',
      ],
    },
    {
      title: 'Sunday Bonus',
      items: [
        'You earn 1 extra day\'s pay (perDay salary) if BOTH conditions are met:',
        '  1. You came to work on the LAST Sunday of the month.',
        '  2. Your achievement reached the threshold: 60% of target (40% for new joiners).',
        'Example: Monthly target = ₹50,000, your total achievement = ₹35,000 (70%).',
        '  • Regular FRO: 70% ≥ 60% → threshold met. Came on last Sunday → Bonus = 1 day pay.',
        '  • If achievement was only ₹25,000 (50%): 50% < 60% → no bonus.',
      ],
    },
    {
      title: 'How Payments Affect Your Target',
      items: [
        'When you log a "Lead Done" disposition with a payment amount, that amount counts toward your monthly collection target.',
        'The "Donors" page shows all leads who have completed payment (lead_done status).',
        'Each month, paid donors may reappear in your My Leads list for follow-up on recurring collections.',
        'Every successful collection increases your achievement, bringing you closer to your target and unlocking incentives.',
      ],
    },
    {
      title: 'Summary: Your Monthly Earnings',
      items: [
        'Your total earnings for the month =',
        '  Base Salary (after attendance deductions)',
        '  + Aaj Ka Incentive (AKI payout)',
        '  + Monthly Incentive (10% of excess over target)',
        '  + Sunday Bonus (1 day pay if eligible)',
        '  + Any extra amounts/OT',
        '',
        'Check your target progress on the Dashboard and reach out to your NGO Admin for any questions.',
      ],
    },
  ];

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'16px 0' }}>
      <div style={{ marginBottom:20 }}>
        <h3 style={{ margin:'0 0 4px' }}>How Incentives Work</h3>
        <p style={{ margin:0, fontSize:12, color:'var(--ink-soft)', lineHeight:1.5 }}>
          Everything you need to know about targets, daily achievements, monthly incentives, and Sunday bonus.
        </p>
      </div>

      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom:16, border:'1px solid var(--line)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', background:'var(--bg)', borderBottom:'1px solid var(--line)', fontSize:13, fontWeight:700 }}>
            {s.title}
          </div>
          <div style={{ padding:'10px 16px 14px' }}>
            {s.items.map((line, j) => (
              <div key={j} style={{
                padding:'3px 0', fontSize:11.5, lineHeight:1.55, color: line.startsWith('  ') ? 'var(--ink-soft)' : 'var(--ink)',
                paddingLeft: line.startsWith('  ') ? 16 : 0,
                whiteSpace:'pre-wrap',
              }}>
                {line.startsWith('  •') ? <span style={{ display:'flex', gap:6 }}><span style={{ color:'var(--sage)' }}>•</span><span>{line.replace(/^\s*•\s*/,'')}</span></span>
                  : line.startsWith('  ') ? line.trim()
                  : line}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign:'center', padding:'12px 0 24px', fontSize:11, color:'var(--ink-soft)' }}>
        Your actual incentive amounts are calculated by the system at month end based on your attendance, achievements, and collections.
      </div>
    </div>
  );
}
