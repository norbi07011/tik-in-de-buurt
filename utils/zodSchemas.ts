import { z } from 'zod'; // Assuming zod is available globally or via import map

export const cvLinkSchema = z.object({
  name: z.string(),
  url: z.string().url().or(z.literal('')),
});

export const cvExperienceSchema = z.object({
  job_title: z.string().min(1, { message: "Job title is required" }),
  company: z.string().min(1, { message: "Company is required" }),
  location: z.string(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string(),
  is_current: z.boolean(),
  description: z.string().max(1000),
  achievements: z.array(z.string()),
  tech_stack: z.array(z.string()),
  links: z.array(cvLinkSchema),
}).refine(data => {
    if (!data.is_current && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
}, {
    message: "End date cannot be before start date",
    path: ["end_date"],
});

export const cvEducationSchema = z.object({
  degree: z.string().min(1, { message: "Degree is required" }),
  institution: z.string().min(1, { message: "Institution is required" }),
  start_date: z.string(),
  end_date: z.string(),
});

export const cvProjectSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  description: z.string(),
});

export const cvCertificationSchema = z.object({
    name: z.string().min(1, { message: "Certificate name is required" }),
    issuer: z.string().min(1, { message: "Issuer is required" }),
    date: z.string(),
});

export const cvLanguageSchema = z.object({
    language: z.string().min(1, { message: "Language is required" }),
    proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Native']),
});

export const cvSchema = z.object({
  summary: z.string().max(2000),
  experience: z.array(cvExperienceSchema),
  education: z.array(cvEducationSchema),
  projects: z.array(cvProjectSchema),
  skills: z.array(z.string()),
  languages: z.array(cvLanguageSchema),
  certifications: z.array(cvCertificationSchema),
  // Optional sections can be added here with .optional()
  awards: z.array(z.object({ name: z.string(), issuer: z.string(), date: z.string() })).optional(),
  volunteering: z.array(z.object({ organization: z.string(), role: z.string(), date: z.string(), description: z.string() })).optional(),
  interests: z.array(z.object({ name: z.string() })).optional(),
});
