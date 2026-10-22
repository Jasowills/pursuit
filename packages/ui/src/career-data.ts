export type Opportunity = {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  status: 'Review' | 'Prepared' | 'Applied' | 'Video needed';
  reason: string;
  posting: string;
  confirmation?: string;
};
export type CareerMessage = { id: string; role: 'user' | 'assistant'; text: string };
export type CareerBook = {
  version: 1;
  messages: CareerMessage[];
  opportunities: Opportunity[];
  notes: string[];
};
export type CareerScreen =
  'assistant' | 'opportunities' | 'applications' | 'outreach' | 'resumes' | 'background';
export const EMPTY_BOOK: CareerBook = { version: 1, messages: [], opportunities: [], notes: [] };
export const RESUME = {
  name: 'Alex Morgan',
  title: 'Product Designer',
  contact: 'alex.morgan@example.com · London, UK · alexmorgan.example',
  summary:
    'Product designer with six years of experience making complex software feel simple. I lead research, interaction design and design systems for B2B products, working closely with engineering from discovery to launch.',
  tailored:
    'Product designer with six years of experience turning complex B2B workflows into clear, accessible experiences. Experienced in end-to-end discovery, cross-functional delivery and design systems—the work at the heart of Northstar’s product design role.',
  experience: [
    {
      company: 'Meridian Studio',
      role: 'Senior Product Designer',
      date: '2022 — Present',
      bullets: [
        'Led discovery and interaction design for a reporting workspace used by operations teams.',
        'Partnered with eight engineers and a product manager to take a new onboarding flow from interviews to release.',
        'Built a reusable component library and documented keyboard, focus and error states across core journeys.',
      ],
    },
    {
      company: 'Fieldwork',
      role: 'Product Designer',
      date: '2020 — 2022',
      bullets: [
        'Interviewed customers and mapped their workflows to inform the redesign of a project planning tool.',
        'Created prototypes, ran usability sessions and translated findings into implementation-ready designs.',
        'Collaborated with frontend engineers to improve responsive layouts and interaction consistency.',
      ],
    },
  ],
  skills: [
    'Product discovery',
    'Interaction design',
    'Figma',
    'Design systems',
    'Prototyping',
    'Usability research',
    'Accessibility',
    'Cross-functional delivery',
  ],
  education: 'BA (Hons) Interaction Design · Ravensbourne University London · 2020',
};
export function sampleBook(): CareerBook {
  return {
    version: 1,
    notes: [],
    messages: [
      {
        id: 'm1',
        role: 'user',
        text: 'Find senior product design roles that fit my experience. Remote or London, £80k+, and teams where I can own discovery through delivery.',
      },
      {
        id: 'm2',
        role: 'assistant',
        text: 'I’ve reviewed 128 roles against your preferences and shortlisted 4 for a closer look. Northstar stands out: the role combines B2B workflow design, research and design systems—all grounded in your Meridian experience.',
      },
      {
        id: 'm3',
        role: 'assistant',
        text: 'Your Northstar resume and cover letter are ready to review. Another role asks for a short introduction video; I’ve put together a 90-second script and a recording checklist. Nothing in this sample workspace is sent externally.',
      },
    ],
    opportunities: [
      {
        id: 'northstar',
        company: 'Northstar',
        role: 'Senior Product Designer',
        location: 'London · Hybrid',
        salary: '£85k–£105k',
        status: 'Review',
        reason:
          'Your B2B workflow work, research practice and design system experience align with the role.',
        posting:
          'We’re looking for a Senior Product Designer to lead discovery and design for complex B2B workflows. You’ll partner with engineering, run research, and evolve our design system. London/hybrid. £85k–£105k.',
      },
      {
        id: 'morrow',
        company: 'Morrow',
        role: 'Lead Product Designer',
        location: 'Remote · UK',
        salary: '£90k–£110k',
        status: 'Video needed',
        reason:
          'Strong end-to-end product experience. The application requests a 90-second video introduction.',
        posting:
          'Lead product design from research to delivery. Please include a 90-second introduction video explaining a project you are proud of.',
      },
      {
        id: 'fieldstone',
        company: 'Fieldstone',
        role: 'Product Designer',
        location: 'Remote · Europe',
        salary: '£80k–£95k',
        status: 'Prepared',
        reason:
          'Relevant experience simplifying planning workflows and working closely with frontend engineers.',
        posting:
          'Help simplify planning for distributed teams. Research, prototyping, accessibility and design systems.',
      },
      {
        id: 'bramble',
        company: 'Bramble',
        role: 'Senior Experience Designer',
        location: 'London · Flexible',
        salary: '£85k–£100k',
        status: 'Applied',
        reason: 'Submitted in this sample scenario after an explicit approval.',
        posting: 'Design clear experiences for complex products.',
        confirmation: 'SAMPLE-ONLY-1042',
      },
    ],
  };
}
export const COVER_LETTER = `Dear Northstar team,\n\nThe Senior Product Designer role caught my attention because it brings together the work I enjoy most: understanding complex workflows, making the next step clear, and staying close to engineering through delivery.\n\nAt Meridian Studio, I’ve led discovery and interaction design for a reporting workspace used by operations teams. I partnered with eight engineers and a product manager to take a new onboarding flow from customer interviews to release, and built a component library with documented keyboard, focus and error states.\n\nThat combination of research, systems thinking and hands-on delivery is what I would bring to Northstar. I’d welcome a conversation about the workflows your team is working to simplify.\n\nBest,\nAlex Morgan`;
export const VIDEO_SCRIPT = [
  [
    '0:00–0:15',
    'Make a human introduction',
    'Hi, I’m Alex, a product designer based in London. I like turning complicated workflows into products that feel clear and useful.',
  ],
  [
    '0:15–0:50',
    'Tell one relevant story',
    'At Meridian Studio, I led discovery and interaction design for a reporting workspace. I worked with customers, a product manager and eight engineers—from interviews and prototypes through to release.',
  ],
  [
    '0:50–1:15',
    'Connect the story to the role',
    'The part I enjoyed most was bringing research and a reusable design system together. That’s why Morrow’s focus on end-to-end ownership caught my attention.',
  ],
  [
    '1:15–1:30',
    'Finish with a clear invitation',
    'I’d love to talk about how your team approaches discovery and delivery. Thanks for taking the time to meet me.',
  ],
];
