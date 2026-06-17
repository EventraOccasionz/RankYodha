import { PrepVideo } from "../types";

export const SEED_PREP_VIDEOS: PrepVideo[] = [
  {
    videoId: "seed_video_1",
    title: "UPSC CSE Complete Strategy & Syllabus Blueprint",
    description: "A comprehensive deep dive into the IAS strategy, prelims and mains structure, answer writing keys, and general studies planning.",
    category: "UPSC",
    videoUrl: "https://www.youtube.com/embed/a9rZ9qQvC9o", // UPSC Strategy guide embed
    durationText: "44 mins",
    createdAt: new Date("2026-06-01").toISOString()
  },
  {
    videoId: "seed_video_2",
    title: "IIT JEE Advanced Physics: Rotational Mechanics",
    description: "Mastering moment of inertia, rolling motion without slipping, and angular momentum equations for high-scoring rank-boosting.",
    category: "JEE",
    videoUrl: "https://www.youtube.com/embed/5-97wX1rT6I", // Physics lecture
    durationText: "58 mins",
    createdAt: new Date("2026-06-02").toISOString()
  },
  {
    videoId: "seed_video_3",
    title: "NEET Professional: Human Physiology Crash Course",
    description: "High-yield NCERT diagrams review on human endocrine structure, chemical coordination, and vital cycles frequently asked in NEET exam.",
    category: "NEET",
    videoUrl: "https://www.youtube.com/embed/D3_qXb7GIdU", // Biology lecture
    durationText: "35 mins",
    createdAt: new Date("2026-06-03").toISOString()
  },
  {
    videoId: "seed_video_4",
    title: "SSC CGL Complete Quantitative Aptitude Speed Rules",
    description: "High-speed calculation shortcuts for income tax officer aspirants, covering percentage, profit & loss, and algebra formulas.",
    category: "SSC",
    videoUrl: "https://www.youtube.com/embed/pCH-42rDby0", // SSC Quantitative Aptitude session
    durationText: "29 mins",
    createdAt: new Date("2026-06-04").toISOString()
  }
];
