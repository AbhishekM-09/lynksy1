import { z } from 'zod'

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/

export const SignupSchema = z.object({
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(6,'Min 6 characters').max(12,'Max 12 characters')
    .regex(/[A-Z]/,'Need uppercase').regex(/[0-9]/,'Need a number'),
  username:  z.string().min(3,'Min 3 chars').max(30,'Max 30 chars').toLowerCase()
    .refine(v => USERNAME_RE.test(v), 'Letters, numbers, hyphens, underscores only'),
  firstName: z.string().min(1,'Required').max(50),
  lastName:  z.string().max(50).optional().or(z.literal('')),
  terms:     z.boolean().refine(v => v === true, 'You must accept the terms'),
})

export const LoginSchema = z.object({
  email:    z.string().min(1,'Required'),
  password: z.string().min(1,'Required'),
})

export const LinkSchema = z.object({
  title:       z.string().min(1,'Title required').max(100,'Max 100 chars'),
  url:         z.string().optional().or(z.literal('')),
  emoji:       z.string().max(10).default(''),
  description: z.string().max(200).default(''),
  type:        z.string().default('URL'),
  isActive:    z.boolean().default(true),
  isPinned:    z.boolean().default(false),
  utmSource:   z.string().max(100).default(''),
  utmMedium:   z.string().max(100).default(''),
  utmCampaign: z.string().max(100).default(''),
  thumbnailUrl: z.string().nullable().optional(),
  showFrom: z.string().optional().or(z.literal('')),
  showUntil: z.string().optional().or(z.literal('')),
  
  // Custom UPI fields
  upiId: z.string().optional().or(z.literal('')),
  displayName: z.string().optional().or(z.literal('')),
  defaultAmount: z.number().optional().or(z.string().optional()),
  buttonText: z.string().optional().or(z.literal('')),
  enabled: z.boolean().optional(),
  upiGoalEnabled: z.boolean().optional(),
  upiGoalTitle: z.string().optional().or(z.literal('')),
  upiGoalTarget: z.number().optional().or(z.string().optional()),
  upiGoalRaised: z.number().optional().or(z.string().optional()),
}).superRefine((data, ctx) => {
  if (data.type === 'UPI' || data.type === 'upi_tip') {
    if (!data.upiId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'UPI ID is required',
        path: ['upiId'],
      })
    } else {
      const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/
      if (!upiRegex.test(data.upiId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid UPI ID format (example: user@oksbi)',
          path: ['upiId'],
        })
      }
    }
  } else if (data.type !== 'FORM') {
    if (!data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'URL is required',
        path: ['url'],
      })
    } else {
      try {
        new URL(data.url)
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Must be a valid URL starting with http://',
          path: ['url'],
        })
      }
    }
  }
})

export const ProfileSchema = z.object({
  displayName:     z.string().max(100),
  bio:             z.string().max(200,'Max 200 characters'),
  category:        z.string().max(50),
  location:        z.string().max(100),
  website:         z.string().url().optional().or(z.literal('')),
  instagramHandle: z.string().max(50),
  youtubeHandle:   z.string().max(50),
  twitterHandle:   z.string().max(50),
  spotifyUrl:      z.string().url().optional().or(z.literal('')),
  linkedinHandle:  z.string().max(50),
  upiId:           z.string().max(50).optional().or(z.literal('')),
})
