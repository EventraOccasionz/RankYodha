export interface PYQQuestion {
  id: string;
  category: string; // "JEE" | "NEET" | "UPSC" | "SSC"
  subject: string; // "Physics" | "Chemistry" | "Mathematics" | "History" | "Polity"
  chapter: string;
  year: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  isPremiumLocked: boolean;
}

export const PYQ_QUESTIONS: PYQQuestion[] = [
  // JEE Physics
  {
    id: "pyq_jee_phy_1",
    category: "JEE",
    subject: "Physics",
    chapter: "Electrostatics",
    year: 2023,
    questionText: "A spherical conductor of radius 10 cm has a charge of 3.2 x 10^-7 C distributed uniformly. What is the magnitude of electric field at a point 15 cm from the center of the sphere?",
    options: [
      "1.28 x 10^5 N/C",
      "1.28 x 10^4 N/C",
      "0.128 x 10^5 N/C",
      "12.8 x 10^5 N/C"
    ],
    correctOptionIndex: 0,
    explanation: "Using Gauss's Law, for an external point, the sphere behaves as a point charge concentrated at the center. E = k*q / r^2. Plug in k = 9*10^9, q = 3.2*10^-7 C, and r = 0.15 m to get approx 1.28*10^5 N/C.",
    isPremiumLocked: false
  },
  {
    id: "pyq_jee_phy_2",
    category: "JEE",
    subject: "Physics",
    chapter: "Rotational Dynamics",
    year: 2022,
    questionText: "A solid sphere is rolling on a frictionless horizontal table. What is the ratio of its rotational kinetic energy to its total kinetic energy?",
    options: [
      "2 / 5",
      "2 / 7",
      "5 / 7",
      "1 / 2"
    ],
    correctOptionIndex: 1,
    explanation: "Rotational KE = (1/2)*I*w^2 = (1/2)*(2/5*M*R^2)*(v/R)^2 = (1/5)*M*v^2. Total KE = Rotational + Translational = (1/5 + 1/2)*M*v^2 = (7/10)*M*v^2. The ratio is (1/5) / (7/10) = 2/7.",
    isPremiumLocked: true
  },
  
  // JEE Math
  {
    id: "pyq_jee_math_1",
    category: "JEE",
    subject: "Mathematics",
    chapter: "Integration",
    year: 2023,
    questionText: "Find the value of the integral from 0 to pi/2 of [sin(x)^3 / (sin(x)^3 + cos(x)^3)] dx.",
    options: [
      "pi / 2",
      "pi / 4",
      "pi / 8",
      "0"
    ],
    correctOptionIndex: 1,
    explanation: "Apply the property integral(a to b) f(x)dx = integral(a to b) f(a+b-x)dx. Let the integral be I. Replacing x by pi/2 - x gives costerms. Adding the two integrals yields 2I = integral(0 to pi/2) 1 dx = pi/2. Hence, I = pi/4.",
    isPremiumLocked: false
  },
  {
    id: "pyq_jee_math_2",
    category: "JEE",
    subject: "Mathematics",
    chapter: "Complex Numbers",
    year: 2021,
    questionText: "Let z be a complex number such that |z - 2i| = |z + 2i|. The locus of z in the complex plane represents which of the following?",
    options: [
      "The Real Axis",
      "The Imaginary Axis",
      "A circle centered at the origin",
      "An ellipse"
    ],
    correctOptionIndex: 0,
    explanation: "The equation represents the set of points equidistant from 2i and -2i. This locus is the perpendicular bisector of the segment joining 2i and -2i, which is the real axis (y = 0).",
    isPremiumLocked: true
  },

  // NEET Chemistry
  {
    id: "pyq_neet_chem_1",
    category: "NEET",
    subject: "Chemistry",
    chapter: "Chemical Bonding",
    year: 2022,
    questionText: "Which of the following molecules shows the highest dipole moment?",
    options: [
      "CO2",
      "BF3",
      "NH3",
      "NF3"
    ],
    correctOptionIndex: 2,
    explanation: "CO2 and BF3 are highly symmetrical and have a net dipole moment of zero. In NH3, the orbital dipole due to the lone pair is in the same direction as the resultant dipole of the N-H bonds, whereas in NF3, they oppose each other. Hence, NH3 has a much higher dipole moment.",
    isPremiumLocked: false
  },
  {
    id: "pyq_neet_chem_2",
    category: "NEET",
    subject: "Chemistry",
    chapter: "Organic Mechanisms",
    year: 2023,
    questionText: "The major product of the acid-catalyzed hydration of 3,3-dimethyl-1-butene is:",
    options: [
      "3,3-dimethyl-2-butanol",
      "2,3-dimethyl-2-butanol",
      "2,3-dimethyl-1-butanol",
      "2,2-dimethyl-3-butanol"
    ],
    correctOptionIndex: 1,
    explanation: "The reaction proceeds via carbocation formation. Initial secondary carbocation undergoes a 1,2-methyl shift to form a more stable tertiary carbocation, which is then attacked by water. This rearrangement yields 2,3-dimethyl-2-butanol as the major product.",
    isPremiumLocked: true
  },

  // UPSC History
  {
    id: "pyq_upsc_hist_1",
    category: "UPSC",
    subject: "History",
    chapter: "Modern India",
    year: 2022,
    questionText: "With reference to ancient India, which of the following statements about the Gagan-Dhwajas and Trade guilds is correct?",
    options: [
      "They had independent military guards to protect warehouses",
      "Guild system was restricted exclusively to South India",
      "The king had absolute power over merchant guilds and did not recognize customary guild rules",
      "Guild actions were determined exclusively by religious leaders"
    ],
    correctOptionIndex: 0,
    explanation: "Merchant guilds (Shrenis) in ancient India were highly powerful, maintained their own security guards, governed their own operational regulations, and kings respected guild charters and customs deeply.",
    isPremiumLocked: false
  },
  {
    id: "pyq_upsc_hist_2",
    category: "UPSC",
    subject: "History",
    chapter: "Medieval Monuments",
    year: 2023,
    questionText: "Consider the following statements regarding the visual layout of Humayun's Tomb, Delhi:\n1. It was the first structural monument built inside a Charbagh styled garden landscape.\n2. The double-dome construction was inspired by Samarkand architectural blueprints.\nWhich of the statements given above is/are correct?",
    options: [
      "1 only",
      "2 only",
      "Both 1 and 2",
      "Neither 1 nor 2"
    ],
    correctOptionIndex: 2,
    explanation: "Both statements are completely correct. Humayun's Tomb was completed in 1572 inside a large Charbagh garden and used the Samarkand-style double-dome technique to achieve spectacular height and aesthetic proportions.",
    isPremiumLocked: true
  },

  // UPSC Polity
  {
    id: "pyq_upsc_pol_1",
    category: "UPSC",
    subject: "Polity",
    chapter: "Emergency Provisions",
    year: 2021,
    questionText: "Under Article 356 of the Constitution of India, a proclamation of President's Rule in a State requires approved resolutions by both houses of Parliament within what time duration?",
    options: [
      "One Month",
      "Two Months",
      "Three Months",
      "Six Months"
    ],
    correctOptionIndex: 1,
    explanation: "Proclamation authorizing Article 356 President's rule must receive approved simple majority resolutions in both Lok Sabha and Rajya Sabha within a maximum of 2 months from date of declaration.",
    isPremiumLocked: false
  },
  {
    id: "pyq_upsc_pol_2",
    category: "UPSC",
    subject: "Polity",
    chapter: "Judicial Review",
    year: 2023,
    questionText: "Which amendment to the Constitution of India inserted Article 31B and the Ninth Schedule to immunize certifiable agrarian reforms from fundamental rights challenges?",
    options: [
      "First Constitutional Amendment Act, 1951",
      "Fourth Amendment Act, 1955",
      "Seventeenth Amendment Act, 1964",
      "Forty-Fourth Amendment Act, 1978"
    ],
    correctOptionIndex: 0,
    explanation: "The Ninth Schedule along with Article 31B was introduced by the 1st Constitutional Amendment in 1951, spearheaded by PM Jawaharlal Nehru, to protect agrarian land reforms from landholder judicial challenges.",
    isPremiumLocked: true
  }
];
