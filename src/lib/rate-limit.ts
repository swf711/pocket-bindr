import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

export const forgotPasswordIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:forgot:ip',
})

export const forgotPasswordEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: 'rl:forgot:email',
})

// Registration: 10 attempts/hr per IP, 5/hr per email
export const registerIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:register:ip',
})

export const registerEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 m'),
  prefix: 'rl:register:email',
})

// Password change (PATCH): 10/15min per IP, 5/15min per userId
export const passwordChangeIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  prefix: 'rl:pw-change:ip',
})

export const passwordChangeUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:pw-change:user',
})

// Password set for OAuth users (POST): 10/hr per IP, 3/hr per userId
export const passwordSetIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:pw-set:ip',
})

export const passwordSetUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: 'rl:pw-set:user',
})

// Add email for pure-OAuth users — request (POST /api/user/email/request):
// 10/hr per IP, 3/hr per userId
export const emailRequestIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:email-request:ip',
})

export const emailRequestUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: 'rl:email-request:user',
})

// Add email for pure-OAuth users — verify (POST /api/user/email/verify): 10/hr per IP
export const emailVerifyIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:email-verify:ip',
})

// Signup email verification (POST /api/auth/verify-signup, unauthenticated): 10/hr per IP
export const signupVerifyIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:signup-verify:ip',
})

// Resend signup verification email (POST /api/auth/resend-verification): 10/hr per IP, 3/hr per email
export const resendVerificationIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:resend-verify:ip',
})

export const resendVerificationEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: 'rl:resend-verify:email',
})

// OAuth account linking (initiate): 10/hr per IP, 5/hr per userId
export const linkIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:link:ip',
})

export const linkUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 m'),
  prefix: 'rl:link:user',
})

// Report (missing card / bug): 10/hr per IP, 5/hr per userId
export const reportIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: 'rl:report:ip',
})

export const reportUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 m'),
  prefix: 'rl:report:user',
})

// Batch add cards to binder (POST /api/binders/[id]/cards/batch): 40/min per IP, 20/min per userId
export const batchAddIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, '1 m'),
  prefix: 'rl:binder-batch:ip',
})

export const batchAddUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'rl:binder-batch:user',
})

// Card image proxy: 300/min per IP. Generous enough for a full binder page load
// (only un-self-hosted official images are proxied; most images are direct Supabase),
// while capping abuse as a bandwidth relay for the whitelisted hosts.
export const proxyImageIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(300, '1 m'),
  prefix: 'rl:proxy-img:ip',
})
