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
