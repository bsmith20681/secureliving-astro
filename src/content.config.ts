import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    subtitle: z.string(),
    metaDescription: z.string().optional(),
    category: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    image: image().optional(),
    excerpt: z.string().optional(),
    authorImage: z.string().optional(),
    authorBio: z.string().optional(),
    company: z.string().optional(),
  }),
});

const companies = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/companies' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    slug: z.string(),
    phone: z.string(),
    phoneUnformatted: z.string().optional(),
    website: z.string().url(),
    rating: z.object({
      overall: z.number().min(0).max(5),
      equipment: z.number().min(0).max(5),
      features: z.number().min(0).max(5),
      pricing: z.number().min(0).max(5),
      easeOfUse: z.number().min(0).max(5),
      customerService: z.number().min(0).max(5),
    }),
    logo: image(),
    promo: z.string().optional(),

    // Overview
    installType: z.enum(['professional', 'diy', 'both']),
    contractRequired: z.boolean(),
    monthToMonth: z.boolean(),
    bestFor: z.string(),

    // Pros & Cons
    pros: z.array(z.string()),
    cons: z.array(z.string()),

    // Pricing
    pricing: z.object({
      monthly: z.object({
        min: z.number(),
        max: z.number().nullable(),
        notes: z.string().optional(),
      }),
      equipment: z.object({
        min: z.number().nullable(),
        max: z.number().nullable(),
        notes: z.string().optional(),
      }),
      contractLength: z.string(),
      activationFee: z.number().nullable(),
      cancelFee: z.number().nullable(),
    }),

    // Monitoring
    monitoring: z.object({
      247: z.boolean(),
      dispatchTypes: z.array(z.string()),
      connection: z.object({
        wifi: z.boolean(),
        cellular: z.boolean(),
        landline: z.boolean(),
      }),
      backupBattery: z.boolean(),
      monitoringStations: z.number().nullable(),
    }),

    // Equipment
    equipment: z.object({
      panel: z.object({
        touchscreen: z.boolean(),
        type: z.string(),
      }),
      sensors: z.object({
        doorWindow: z.boolean(),
        motion: z.boolean(),
        glassBreak: z.boolean(),
      }),
      keyfob: z.boolean(),
      siren: z.boolean(),
    }),

    // Cameras
    cameras: z.object({
      doorbell: z.boolean(),
      outdoor: z.boolean(),
      indoor: z.boolean(),
      powerOptions: z.array(z.string()),
      features: z.object({
        hd: z.boolean(),
        nightVision: z.boolean(),
        twoWayTalk: z.boolean(),
        liveView: z.boolean(),
        continuousRecording: z.boolean(),
        aiSearch: z.boolean(),
      }),
      videoStorage: z.object({
        days: z.number().nullable(),
        local: z.boolean(),
        cloud: z.boolean(),
      }),
      recordsWithoutWifi: z.boolean(),
      proprietaryToService: z.boolean(),
    }),

    // Home Automation
    homeAutomation: z.object({
      zWaveSupport: z.boolean(),
      compatibleDevices: z.array(z.string()),
      nestCompatible: z.boolean(),
      automations: z.boolean(),
      scenes: z.boolean(),
      thirdPartyApp: z.boolean(),
      rating: z.enum(['best', 'good', 'limited', 'none']),
    }),

    // Mobile App
    mobileApp: z.object({
      rating: z.enum(['excellent', 'good', 'fair', 'poor']),
      singleApp: z.boolean(),
      remoteArmDisarm: z.boolean(),
      multiProperty: z.boolean(),
      remoteUserManagement: z.boolean(),
      cameraIntegrated: z.boolean(),
    }),

    // Review
    review: z.string(),
  }),
});

const authors = defineCollection({
  loader: file('./src/content/authors/authors.json'),
  schema: ({ image }) => z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
    image: image(),
  }),
});

export const collections = { articles, companies, authors };
