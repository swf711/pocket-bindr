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
