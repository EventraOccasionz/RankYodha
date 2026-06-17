export interface Testimonial {
  id: string;
  name: string;
  feedback: string;
  examName: string;
  scoreAchieved: string;
  photoUrl: string;
  videoUrl?: string; // If present, indicates a video testimonial!
  roleOrCity?: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "test_1",
    name: "Aniket Deshmukh",
    examName: "JEE Advanced",
    scoreAchieved: "AIR 241",
    feedback: "The CBT mock series here is matches NTA layout exactly. The speed trackers and AI section analysis showed me that I was wasting 8 minutes on coordinate geometry choices. I changed my exam strategy on time and broke through!",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "test_2",
    name: "Dr. Shalini Iyer",
    examName: "NEET UG",
    scoreAchieved: "AIR 89",
    feedback: "Concept-level checks on assertion questions in Physics and NCERT line Chemistry options are excellent. The high-yield series made my biology revisions lightning fast. 24/7 student dashboards kept me motivated.",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" // sample video link
  },
  {
    id: "test_3",
    name: "Rahul Meena",
    examName: "UPSC Prelims",
    scoreAchieved: "Score 112.5 (GS)",
    feedback: "ElitePrep is the absolute gold standard for UPSC tests. The historical Polity maps in the PYQ section along with editorial solutions references are incredibly precise. Highly recommended for conceptual clarity.",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" // sample video link
  },
  {
    id: "test_4",
    name: "Sneha Rawat",
    examName: "SSC CGL",
    scoreAchieved: "Excise Inspector",
    feedback: "In CGL, speed is everything. Solving 50 mocks on CBT-style speed timer screens trained my brain to skip hard questions in under 15 seconds. Incredible ranking tools!",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
  }
];
