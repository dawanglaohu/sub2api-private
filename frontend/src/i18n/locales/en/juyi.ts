// JuYi customization copy (isolated namespace, zero merge conflicts with upstream)
export default {
  juyi: {
    home: {
      eyebrow: 'Subscription Aggregation Gateway',
      heroTitleA: 'Turn subscriptions into',
      heroTitleB: ' one API.',
      heroDesc:
        'JuYi pools multiple AI subscription accounts into one stable endpoint: one key, swarm scheduling, usage-based billing.',
      pipelineCaption: 'Subscription sources → JuYi scheduling core → unified API endpoint',
      steps: {
        title: 'Three steps to connect',
        subtitle: 'No code changes — just swap the base_url',
        s1Title: 'Create account',
        s1Desc: 'Sign up with email and open the console',
        s2Title: 'Create API key',
        s2Desc: 'Generate an sk- key on the Keys page',
        s3Title: 'Point your base_url',
        s3Desc: 'Set base_url to JuYi and call models as usual',
        copy: 'Copy example',
        copied: 'Copied'
      },
      features: {
        title: 'Built for heavy usage',
        subtitle: 'The way of the colony: each ant is small, together they are steady',
        gateway: 'Multi-platform pool',
        gatewayDesc: 'Claude, Codex, Gemini and more behind one entrance — one key for all',
        schedule: 'Swarm scheduling',
        scheduleDesc: 'Load balancing and sticky sessions across the pool; failures route around',
        billing: 'Usage-based billing',
        billingDesc: 'Per-request usage and cost records; balance, quota and limits at a glance',
        stats: 'Live statistics',
        statsDesc: 'Model distribution, token trends and latency charts on demand',
        keys: 'Multi-key management',
        keysDesc: 'Issue keys per project with independent limits, revoke anytime',
        redeem: 'Redeem & referral',
        redeemDesc: 'Top up with redeem codes and earn through referrals'
      },
      faq: {
        title: 'FAQ',
        q1: 'How is billing calculated?',
        a1: 'Purely usage-based: each request’s token usage is converted to cost and deducted from your balance. Every line is auditable on the Usage page.',
        q2: 'How is this different from calling the official API?',
        a2: 'The calling convention is identical — only the base_url points to JuYi. JuYi schedules your request across the subscription pool and fails over automatically.',
        q3: 'Are my keys and data safe?',
        a3: 'Keys are used only for gateway auth and can be revoked anytime. Request content is not persisted; only usage metadata (model, tokens, latency) is recorded.'
      },
      manifesto: {
        titleA: 'One ant is fragile.',
        titleB: ' A colony moves anything.',
        sub: 'Every subscription is a worker ant. JuYi drills them into a logistics corps that never clocks out and carries every call.'
      },
      poweredBy: 'Built on the open-source project Sub2API'
    },
    dash: {
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      heroTag: 'Swarm scheduling active',
      endpoint: 'API endpoint',
      copied: 'Copied',
      createKey: 'Create key',
      viewDocs: 'View docs'
    },
    hive: {
      title: 'Account hive',
      subtitle: 'Live health of the service account pool',
      active: 'Active',
      inactive: 'Inactive',
      error: 'Error',
      manage: 'Manage accounts',
      empty: 'No service accounts yet — add the first one',
      more: '{n} more'
    },
    appearance: {
      title: 'Appearance',
      theme: 'Theme color',
      font: 'Font',
      themes: {
        honey: 'Honey Amber',
        pheromone: 'Pheromone Teal',
        nightfall: 'Nightfall Indigo',
        ember: 'Ember Rose'
      },
      fonts: {
        default: 'System Sans',
        serif: 'Serif',
        mono: 'Monospace'
      }
    }
  }
}
